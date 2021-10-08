/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import * as storage from './storage.js';
import * as bedrock from 'bedrock';
import {isUnrecoverableError} from './errorCheck.js';
import {httpClient} from '@digitalbazaar/http-client';
import {httpsAgent} from 'bedrock-https-agent';
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

/**
   * Gets a new access token by first checking the database to see if an
   * access token already exists for the client id; if not it creates an
   * access token then stores it in the database.
   *
   * @param {object} options - Options to use.
   * @param {string} options.client_id - The ID of the client.
   * @param {string} options.client_secret - The client secret.
   * @param {string} options.token_endpoint - The URL to call.
   * @param {string} options.grant_type - The grant type.
   * @param {string} options.scope - The scope.
   * @param {number} options.maxRetries - The maximum number of times to retry
   *  the request.
   *
   * @returns {Promise<string>} The access token.
   */
export async function getAccessToken({
  client_id, client_secret, token_endpoint, grant_type, scope, maxRetries
}) {
  // it is ok to return the same cached token when the params `client_secret` or
  // `maxRetries` are different, but these params below must be unique per token
  const key = JSON.stringify([client_id, token_endpoint, grant_type, scope]);
  const fn = () => _getUncachedAccessToken({
    client_id, client_secret, token_endpoint, grant_type, scope, maxRetries
  });
  return ACCESS_TOKEN_CACHE.memoize({key, fn});
}

async function _getUncachedAccessToken({
  client_id, client_secret, token_endpoint, grant_type, scope, maxRetries
}) {
  let {token} = await storage.get({client_id, token_endpoint}) || {};
  if(!(token && token.access_token)) {
    token = await getNewAccessToken({
      client_id, client_secret, token_endpoint, grant_type, scope, maxRetries
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
 * @param {number} options.maxRetries - The maximum number of times to retry
 *  the request.
 *
 * @returns {string} The access token.
 */
export async function getNewAccessToken({
  client_id, client_secret, token_endpoint, grant_type, scope, maxRetries = 3
}) {
  const body = new URLSearchParams({
    client_id, client_secret, grant_type, scope
  });

  for(; maxRetries >= 0; --maxRetries) {
    const access_token = await _requestAccessToken(
      {url: token_endpoint, body, maxRetries});
    if(access_token) {
      return {client_id, token_endpoint, access_token};
    }
  }
  throw new BedrockError(
    `Service Unavailable`, 'InvalidStateError', {
      httpStatusCode: 503,
      public: true
    });
}

async function _requestAccessToken({url, body}) {
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

export async function getAuthzClients({clients}) {
  for(const client in clients) {
    const clientInfo = clients[client];
    await _createAccessToken({...clientInfo});
  }
  return true;
}

async function _createAccessToken({
  client_id, client_secret, token_endpoint, grant_type, scope
}) {
  const body = new URLSearchParams({
    client_id, client_secret, grant_type, scope
  });
  let accessToken;
  try {
    accessToken = await pRetry(() => _requestAccessTokenRetryAndExitOnFailure({
      url: token_endpoint, body
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
  const tokenRecord = {access_token: accessToken, client_id, token_endpoint};
  await storage.insert({token: tokenRecord});
  return accessToken;
}

async function _requestAccessTokenRetryAndExitOnFailure({url, body}) {
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
