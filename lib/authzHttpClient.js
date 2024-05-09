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

import {getAccessToken, getNewAccessToken} from './oauth2-client.js';
import {httpClient} from '@digitalbazaar/http-client';
import {httpsAgent} from '@bedrock/https-agent';
import {isInvalidAccessTokenError} from './errorCheck.js';

const proxyMethods = new Set([
  'get', 'post', 'push', 'put', 'patch', 'head', 'delete'
]);

export function createAuthzHttpClient({oAuth2Client} = {}) {
  const authzHttpClient = new Proxy(httpClient, {
    async apply(target, thisArg, args) {
      return _handleRequest(target, this, args, oAuth2Client);
    },
    get(target, propKey) {
      const propValue = target[propKey];

      // only intercept particular methods
      if(!proxyMethods.has(propKey)) {
        return propValue;
      }
      return async function() {
        return _handleRequest(propValue, this, arguments, oAuth2Client);
      };
    }
  });
  return authzHttpClient;
}

/**
 * @param {Function} target - HttpClient method ('get', 'post', etc).
 * @param {object} thisArg - HttpClient instance.
 * @param {Array<*>} args - Method arguments ([url, options]).
 * @param {object} oAuth2Client - Client credentials.
 *
 * @returns {Promise} Resolves with the result of the httpClient method call
 *   (get, post, etc), that was made with an addition of the Authorization
 *   header.
 */
async function _handleRequest(target, thisArg, args, oAuth2Client) {
  const {accessToken} = await getAccessToken({...oAuth2Client});

  // create the authz header using the token
  // add the authz header to the headers object of args
  const [url, options = {}] = args;
  if(!options.agent) {
    options.agent = httpsAgent;
  }
  options.headers = options.headers || {};
  if(options.headers.Authorization) {
    if(!Array.isArray(options.headers.Authorization)) {
      options.headers.Authorization = [options.headers.Authorization];
    }
    options.headers.Authorization.push(`Bearer ${accessToken}`);
  } else {
    options.headers.Authorization = `Bearer ${accessToken}`;
  }
  try {
    return await target.apply(thisArg, [url, options]);
  } catch(error) {
    return _handleTokenError({
      error, target, thisArg, url, options, oAuth2Client
    });
  }
}

/**
 * @param {object} options - Options to use.
 * @param {Error} options.error - Error encountered while performing an http
 *   method.
 * @param {Function} options.target - HttpClient method ('get', 'post', etc).
 * @param {object} options.thisArg - HttpClient instance.
 * @param {string} options.url - URL on which the http method was performed.
 * @param {Array<*>} options.options - Method arguments ([url, options]).
 * @param {object} options.oAuth2Client - Client credentials.
 *
 * @returns {Promise} Resolves with the result of retrying the http method call,
 *   after getting a new access token.
 */
async function _handleTokenError({
  error, target, thisArg, url, options, oAuth2Client
}) {
  if(!isInvalidAccessTokenError({error})) {
    throw error;
  }
  const {accessToken} =
    await getNewAccessToken({...oAuth2Client, maxRetries: 3});
  options.headers = options.headers || {};
  if(options.headers.Authorization) {
    options.headers.Authorization = [options.headers.Authorization];
    options.headers.Authorization.push(`Bearer ${accessToken}`);
  } else {
    options.headers.Authorization = `Bearer ${accessToken}`;
  }
  return target.apply(thisArg, [url, options]);
}
