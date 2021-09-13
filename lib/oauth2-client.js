/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import * as storage from './storage.js';
import * as bedrock from 'bedrock';
import {isUnrecoverableError} from './errorCheck.js';
import {httpClient} from '@digitalbazaar/http-client';
import {LruCache} from '@digitalbazaar/lru-memoize';
import pRetry from 'p-retry';
import logger from './logger.js';
const {util: {BedrockError}} = bedrock;

let ACCESS_TOKEN_CACHE;
// the maximum number of milliseconds between two retries
const RETRY_MAX_TIMEOUT = 30000;

bedrock.events.on('bedrock.init', async () => {
  const cfg = bedrock.config['oauth2-client'];
  ACCESS_TOKEN_CACHE = new LruCache({
    max: cfg.accessTokenCache.maxSize,
    maxAge: cfg.accessTokenCache.maxAge
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
   * @param {string} options.issuer - The issuer.
   * @param {string} options.logger - The logger.
   *
   * @returns {OAuth2Client} The `OAuth2Client` instance.
   */
  constructor({config, httpsAgent, issuer, logger} = {}) {
    const cfg = config.find(a => a.issuer === issuer);
    this.client_id = cfg.client_id;
    this.client_secret = cfg.client_secret;
    this.token_endpoint = cfg.token_endpoint;
    this.grant_type = cfg.grant_type;
    this.scope = cfg.scope;
    this.maxRetries = cfg.maxRetries;
    this.httpsAgent = httpsAgent;
    this.logger = logger;
  }

  /**
   * Gets a new access token by first checking the database to see if an
   * access token already exists for the client id; if not it creates an
   * access token then stores it in the database.
   *
   * @param {object} options - Options to use.
   * @param {string} options.retryAndExitOnFailure - If the request should be
   *  retried indefinitely, and exit upon an unrecoverable error.
   * @returns {Promise<string>} The access token.
   */
  async getAccessToken({retryAndExitOnFailure = false}) {
    const {
      client_id, client_secret, token_endpoint, grant_type, scope, httpsAgent,
      maxRetries
    } = this;
    if(retryAndExitOnFailure) {
      return getAccessTokenRetryAndExitOnFailure({
        client_id, client_secret, token_endpoint, grant_type, scope, httpsAgent
      });
    }
    const fn = () => _getUncachedAccessToken({
      client_id, client_secret, token_endpoint, grant_type, scope, httpsAgent,
      maxRetries
    });
    return ACCESS_TOKEN_CACHE.memoize({key: client_id, fn});
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
  maxRetries = 3}) {
  const body = new URLSearchParams({
    client_id, client_secret, grant_type, scope
  });

  for(; maxRetries >= 0; --maxRetries) {
    const access_token = await _requestAccessToken(
      {url: token_endpoint, body, httpsAgent, maxRetries});
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

async function _requestAccessToken({url, body, httpsAgent}) {
  let response;
  try {
    ({data: response} = await httpClient.post(url, {
      body,
      agent: httpsAgent
    }));
  } catch(error) {
    logger.error('Error getting access token.', {error});
  }
  if(response && response.access_token) {
    return response.access_token;
  }

  return false;
}

async function getAccessTokenRetryAndExitOnFailure({
  client_id, client_secret, token_endpoint, grant_type, scope, httpsAgent
}) {
  const body = new URLSearchParams({
    client_id, client_secret, grant_type, scope
  });
  let accessToken;
  try {
    accessToken = await pRetry(() => _requestAccessTokenRetryAndExitOnFailure({
      url: token_endpoint, body, httpsAgent
    }), {
      retries: 300,
      onFailedAttempt: async error => {
        logger.error(
          'Unable to acquire access token. Retrying...', {error});
      },
      maxTimeout: RETRY_MAX_TIMEOUT,
    });
  } catch(e) {
    logger.debug('Failed to acquire access token.', {e});
    throw e;
  }
  return accessToken;
}

async function _requestAccessTokenRetryAndExitOnFailure({
  url, body, httpsAgent
}) {
  let response;
  try {
    ({data: response} = await httpClient.post(url, {
      body,
      agent: httpsAgent
    }));
    return response.access_token;
  } catch(error) {
    if(isUnrecoverableError({error})) {
      logger.error('An unrecoverable error was encountered, exiting.', {error});
      bedrock.exit();
    }
    throw error;
  }
}
