/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import database from 'bedrock-mongodb';
import * as bedrock from 'bedrock';
const cfg = bedrock.config['oauth2-client'];

bedrock.events.on('bedrock-mongodb.ready', async () => {
  await database.openCollections(['oauth2-client-accessToken']);

  await database.createIndexes([{
    // automatically expire tokens with an `expires` date field
    collection: 'oauth2-client-accessToken',
    fields: {'token.expires': 1},
    options: {
      partialFilterExpression: {'token.expires': {$exists: true}},
      unique: false,
      background: false,
      expireAfterSeconds: 0
    }
  }, {
    // index for query that is used to look up tokens
    collection: 'oauth2-client-accessToken',
    fields: {'token.client_id': 1, 'token.token_endpoint': 1},
    options: {unique: true, background: false}
  }]);
});

/**
 * Queries the database for an existing access token for the client id.
 *
 * @param {object} options - Options to use.
 * @param {string} options.client_id - The ID of the client.
 * @param {string} options.token_endpoint - The URL of the token endpoint.
 *
 * @returns {string} The access token if there is one, null if not.
 */
export async function get({client_id, token_endpoint}) {
  const collection = database.collections['oauth2-client-accessToken'];
  const query = {
    'token.client_id': client_id, 'token.token_endpoint': token_endpoint
  };
  return collection.findOne(query);
}

/**
 * Inserts a token into the database.
 *
 * @param {object} options - Options to use.
 * @param {object} options.token - The token record, including client id and
 *    access token.
 *
 * @returns {string} The token record.
 */
export async function insert({token}) {
  const now = Date.now();
  const meta = {created: now, updated: now};
  // token expires after 2 weeks
  const ttl = cfg.ttl;
  let record = {
    meta,
    token: {
      ...token,
      expires: new Date(now + ttl)
    }
  };
  const collection = database.collections['oauth2-client-accessToken'];
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
