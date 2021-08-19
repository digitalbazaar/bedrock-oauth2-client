/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import * as storage from './storage.js';
import * as bedrock from 'bedrock';
import {httpClient} from '@digitalbazaar/http-client';
import {LruCache} from '@digitalbazaar/lru-memoize';
import logger from './logger.js';
const {util: {BedrockError}} = bedrock;

let cache;

bedrock.events.on('bedrock.init', async () => {
  const cfg = bedrock.config['oauth2-client'];
  cache = new LruCache({
    max: cfg.cache.maxSize,
    maxAge: cfg.cache.maxAge
  });
});

export class OAuth2Client {
  /**
   * Constructs an OAuth2Client instance to return an access token. It first
   * checks the database to see if an access token already exists for the client
   * id; if not, it creates an access token then stores it in the database.
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
   * Gets a new access token by first checking the database to see if an
   * access token already exists for the client id; if not it creates an
   * access token then stores it in the database.
   *
   * @returns {string} The access token.
   */
  async getAccessToken() {
    const {
      client_id, client_secret, token_endpoint, grant_type, scope, httpsAgent,
      maxRetries
    } = this;
    const fn = () => _getUncachedAccessToken({
      client_id, client_secret, token_endpoint, grant_type, scope, httpsAgent,
      maxRetries});
    return cache.memoize({key: client_id, fn});
  }
}

async function _getUncachedAccessToken({
  client_id, client_secret, token_endpoint, grant_type, scope, httpsAgent,
  maxRetries}) {
  let {token} = await storage.get({client_id}) || {};
  if(!(token && token.access_token)) {
    token = await getNewAccessToken({
      client_id, client_secret, token_endpoint, grant_type, scope, httpsAgent,
      maxRetries
    });
    await storage.insert({token});
  }
  return token.access_token;
}

/**
 * Gets a new access token from the provided URL.
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
 * @returns {string} The access token.
 */
async function getNewAccessToken({
  client_id, client_secret, token_endpoint, grant_type, scope, httpsAgent,
  maxRetries = 3
}) {
  const body = new URLSearchParams({
    client_id, client_secret, grant_type, scope
  });

  for(; maxRetries >= 0; --maxRetries) {
    const access_token = await _createAccessToken(
      {url: token_endpoint, body, httpsAgent});
    if(access_token) {
      return {client_id, client_secret, access_token};
    }
  }
  throw new BedrockError(
    `Service Unavailable`, 'InvalidStateError', {
      httpStatusCode: 503,
      public: true
    });
}

async function _createAccessToken({url, body, httpsAgent}) {
  let response;
  try {
    ({data: response} = await httpClient.post(url, {
      body,
      agent: httpsAgent
    }));
  } catch(e) {
    logger.error('Error getting access token.', {error: e});
  }
  if(response && response.access_token) {
    return response.access_token;
  }
  return false;
}
