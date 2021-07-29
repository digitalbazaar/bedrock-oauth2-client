/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

import database from 'bedrock-mongodb';
import * as bedrock from 'bedrock';
import {promisify} from 'util';
import {httpClient} from '@digitalbazaar/http-client';
const {util: {BedrockError}} = bedrock;

bedrock.events.on('bedrock-mongodb.ready', async () => {
  await promisify(database.openCollections)(['access-tokens']);

  // shard based on `siteId`
  await promisify(database.createIndexes)([{
    // prevent duplicate events from being stored
    collection: 'access-tokens',
    fields: {'token.token': 1},
    options: {unique: true, background: false}
  }, {
    // automatically expire events with an `expires` date field
    collection: 'access-tokens',
    fields: {'token.expires': 1},
    options: {
      partialFilterExpression: {'token.expires': {$exists: true}},
      unique: false,
      background: false,
      expireAfterSeconds: 0
    }
  }]);
});

export class OAuth2Client {
  constructor({
    client_id, client_secret, url, grant_type, scope, httpsAgent
  } = {}) {
    this.client_id = client_id;
    this.client_secret = client_secret;
    this.url = url;
    this.grant_type = grant_type;
    this.scope = scope;
    this.httpsAgent = httpsAgent;
  }
  async getToken() {
    const {client_id, client_secret, url, grant_type, scope, httpsAgent} = this;
    let token;
    ({token} = await checkDatabase({client_id}));
    if(!token || !token.access_token) {
      token = await getNewAccessToken({
        client_id, client_secret, url, grant_type, scope, httpsAgent
      });
      await insertToken({token});
    }
    return token.access_token;
  }
}

async function getNewAccessToken({
  client_id, client_secret, url, grant_type, scope, httpsAgent
}) {
  const body = new URLSearchParams();
  body.set('client_id', client_id);
  body.set('client_secret', client_secret);
  body.set('grant_type', grant_type);
  body.set('scope', scope);

  let response;
  try {
    ({data: response} = await httpClient.post(url, {
      body,
      agent: httpsAgent
    }));
  } catch(e) {
    throw new BedrockError(
      `Service Unavilable`, 'InvalidStateError', {
        httpStatusCode: 503,
        public: true
      }, e);
  }
  const token = {client_id, client_secret};
  if(response && response.access_token) {
    token.access_token = response.access_token;
    return token;
  } else {
    throw new BedrockError(
      `Service Unavilable`, 'InvalidStateError', {
        httpStatusCode: 503,
        public: true
      });
  }
}

async function insertToken({token}) {
  const now = Date.now();
  const meta = {created: now, updated: now};
  // expires after 2 weeks
  const ttl = 2 * 7 * 24 * 60 * 60 * 1000;
  token.expires = new Date(now + ttl);
  let record = {
    meta,
    token
  };
  const collection = database.collections['access-tokens'];
  try {
    const result = await collection.insertOne(record, database.writeOptions);
    record = result.ops[0];
  } catch(e) {
    if(!database.isDuplicateError(e)) {
      throw e;
    }
    throw new BedrockError(
      'Duplicate token.',
      'DuplicateError', {
        public: true,
        httpStatusCode: 409
      }, e);
  }
  return record;
}

async function checkDatabase({client_id}) {
  const query = {
    'token.client_id': client_id
  };
  return database.collections['access-tokens'].findOne(query);
}
