/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import database from 'bedrock-mongodb';
import * as bedrock from 'bedrock';
import {httpClient} from '@digitalbazaar/http-client';
import logger from './logger.js';
const {util: {BedrockError}} = bedrock;

bedrock.events.on('bedrock-mongodb.ready', async () => {
  await database.openCollections(['access-tokens']);

  await database.createIndexes([{
    // prevent duplicate tokens from being stored
    collection: 'access-tokens',
    fields: {'token.token': 1},
    options: {unique: true, background: false}
  }, {
    // automatically expire tokens with an `expires` date field
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
/**
 * Constructs a OAuth2Client instance that can be used to return an accessToken.
 *  It first checks the database to see if an accessToken already exists for the
 *  client id; if not it creates an accessToken then stores it in the database.
 *
 * @param {object} options - Options to use.
 * @param {string} options.config - The "oauth2-client-grant" properties.
 * @param {object} options.httpsAgent - A NodeJS HTTPS Agent (`https.Agent`).
 *
 * @returns {OAuth2Client} The `OAuth2Client` instance.
 */
  constructor({config, httpsAgent} = {}) {
    this.client_id = config.client_id;
    this.client_secret = config.client_secret;
    this.token_endpoint = config.token_endpoint;
    this.grant_type = config.grant_type;
    this.scope = config.scope;
    this.maxRetries = config.maxRetries;
    this.httpsAgent = httpsAgent;
  }
  /**
   * Gets a new accessToken by first checking the database to see if an
   *  accessToken already exists for the client id; if not it creates an
   *  accessToken then stores it in the database.
   *
   * @returns {string} The accessToken.
   */
  async getToken() {
    const {
      client_id, client_secret, token_endpoint, grant_type, scope, httpsAgent,
      maxRetries
    } = this;
    let token;
    token = await checkDatabase({client_id});
    if(!token || !token.access_token) {
      token = await getNewAccessToken({
        client_id, client_secret, token_endpoint, grant_type, scope, httpsAgent,
        maxRetries
      });
      await insertToken({token});
    }
    return token.access_token;
  }
}

/**
 * Gets a new accessToken from the provided URL.
 *
 * @param {object} options - Options to use.
 * @param {string} options.client_id - The ID of the client.
 * @param {string} options.client_secret - The client secret.
 * @param {string} options.token_endpoint - The URL to call.
 * @param {string} options.grant_type - The grant type.
 * @param {string} options.scope - The scope.
 * @param {object} options.httpsAgent - A NodeJS HTTPS Agent (`https.Agent`).
 * @param {number} options.maxRetries - The maximum number of times to retry
 *  the request.
 *
 * @returns {string} The accessToken.
 */
async function getNewAccessToken({
  client_id, client_secret, token_endpoint, grant_type, scope, httpsAgent,
  maxRetries = 3
}) {
  const body = new URLSearchParams();
  body.set('client_id', client_id);
  body.set('client_secret', client_secret);
  body.set('grant_type', grant_type);
  body.set('scope', scope);

  let response;
  const token = {client_id, client_secret};

  while(maxRetries >= 0) {
    response = await httpCall({url: token_endpoint, body, httpsAgent});
    if(response && response.access_token) {
      token.access_token = response.access_token;
      return token;
    }
    --maxRetries;
  }
  throw new BedrockError(
    `Service Unavilable`, 'InvalidStateError', {
      httpStatusCode: 503,
      public: true
    });
}

async function httpCall({url, body, httpsAgent}) {
  let response;
  try {
    ({data: response} = await httpClient.post(url, {
      body,
      agent: httpsAgent
    }));
  } catch(e) {
    logger.error('Error getting accessToken.', {error: e});
  }
  if(response && response.access_token) {
    return response;
  }
  return false;
}

/**
 * Inserts a token into the database.
 *
 * @param {object} options - Options to use.
 * @param {object} options.token - The token record, including client id and
 * accessToken.
 *
 * @returns {string} The token record.
 */
export async function insertToken({token}) {
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
  }
  return record;
}

/**
 * Queries the database for an existing accessToken for the client id.
 *
 * @param {object} options - Options to use.
 * @param {string} options.client_id - The ID of the client.
 *
 * @returns {string} The accessToken if there is one, null if not.
 */
export async function checkDatabase({client_id}) {
  const query = {
    'token.client_id': client_id
  };
  let token;
  const result = await database.collections['access-tokens'].findOne(query);
  if(result && result.token) {
    token = result.token;
  }
  return token;
}
