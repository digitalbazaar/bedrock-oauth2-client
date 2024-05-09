/*!
 * Copyright 2021 - 2024 Digital Bazaar, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

import * as bedrock from '@bedrock/core';
import {httpClient} from '@digitalbazaar/http-client';
import {httpsAgent} from '@bedrock/https-agent';
import {isUnrecoverableError} from './errorCheck.js';
import {logger} from './logger.js';
import {LruCache} from '@digitalbazaar/lru-memoize';
import pRetry from 'p-retry';

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
   * @param {string} options.audience - The URL of resource server.
   *
   * @returns {Promise<object>} The access token.
   */
export async function getAccessToken({
  client_id, client_secret, token_endpoint, grant_type, scope, audience,
  maxRetries
}) {
  if(!client_id) {
    throw new TypeError(`"client_id" must be a string.`);
  }
  if(!client_secret) {
    throw new TypeError(`"client_secret" must be a string.`);
  }
  if(!token_endpoint) {
    throw new TypeError(`"token_endpoint" must be a string.`);
  }
  // it is ok to return the same cached token when the params `client_secret` or
  // `maxRetries` are different, but these params below must be unique per token
  // stored as a stringified array, '[client_id,token_endpoint,etc]'
  const key = JSON.stringify([client_id, token_endpoint, grant_type, scope]);
  const fn = () => getNewAccessToken({
    client_id, client_secret, token_endpoint, grant_type, scope, audience,
    maxRetries
  });
  return ACCESS_TOKEN_CACHE.memoize({key, fn});
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
 * @param {string} options.audience - The URL of resource server.
 *
 * @returns {object} The access token.
 */
export async function getNewAccessToken({
  client_id, client_secret, token_endpoint, grant_type, scope, audience,
  maxRetries = 3
}) {
  const body = new URLSearchParams({
    client_id, client_secret, grant_type, scope
  });

  for(; maxRetries >= 0; --maxRetries) {
    const access_token = await _requestAccessToken(
      {url: token_endpoint, body});
    if(access_token) {
      return {accessToken: access_token};
    }
  }
  throw new BedrockError(
    `Service Unavailable: Could not renew token for ${audience}.`,
    'InvalidStateError', {
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
  const promises = [];
  for(const client in clients) {
    const clientInfo = clients[client];
    clientInfo.name = client;
    promises.push(_createAccessToken(clientInfo));
  }
  await Promise.all(promises);
  return true;
}

async function _createAccessToken({
  client_id, client_secret, token_endpoint, grant_type, scope, name
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
        logger.error('Unable to acquire access token. Retrying...', {error});
      },
      maxTimeout: RETRY_MAX_TIMEOUT,
    });
  } catch(e) {
    logger.debug(`Failed to acquire access token for "${name}".`, {e});
    throw e;
  }
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
      process.exit(1);
    }
    throw error;
  }
}
