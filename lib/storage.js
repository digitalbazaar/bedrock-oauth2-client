/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import database from 'bedrock-mongodb';
import * as bedrock from 'bedrock';

bedrock.events.on('bedrock-mongodb.ready', async () => {
  await database.openCollections(['oauth2-client-accessToken']);

  await database.createIndexes([{
    // prevent duplicate tokens from being stored
    collection: 'oauth2-client-accessToken',
    fields: {'token.token': 1},
    options: {unique: true, background: false}
  }, {
    // automatically expire tokens with an `expires` date field
    collection: 'oauth2-client-accessToken',
    fields: {'token.expires': 1},
    options: {
      partialFilterExpression: {'token.expires': {$exists: true}},
      unique: false,
      background: false,
      expireAfterSeconds: 0
    }
  }]);
});

/**
 * Queries the database for an existing access token for the client id.
 *
 * @param {object} options - Options to use.
 * @param {string} options.client_id - The ID of the client.
 *
 * @returns {string} The access token if there is one, null if not.
 */
export async function get({client_id}) {
  const query = {
    'token.client_id': client_id
  };
  let token;
  const record =
    await database.collections['oauth2-client-accessToken'].findOne(query);
  if(record && record.token) {
    token = record.token;
  }
  return token;
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
  // expires after 2 weeks
  const ttl = 2 * 7 * 24 * 60 * 60 * 1000;
  token.expires = new Date(now + ttl);
  let record = {
    meta,
    token
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
