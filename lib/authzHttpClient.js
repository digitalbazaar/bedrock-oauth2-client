/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import {httpClient} from '@digitalbazaar/http-client';
import {httpsAgent} from 'bedrock-https-agent';
import {isInvalidAccessTokenError} from './errorCheck.js';
import {getAccessToken, getNewAccessToken} from './oauth2-client.js';

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
  const accessToken = await getAccessToken({...oAuth2Client});

  // create the authz header using the token
  // add the authz header to the headers object of args
  const [url, options] = args;
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
 * @param {Error} error - Error encountered while performing an http method.
 * @param {Function} target - HttpClient method ('get', 'post', etc).
 * @param {object} thisArg - HttpClient instance.
 * @param {string} url - URL on which the http method was performed.
 * @param {Array<*>} options - Method arguments ([url, options]).
 * @param {object} oAuth2Client - Client credentials.
 *
 * @returns {Promise} Resolves with the result of re-trying the http method
 *   call, after getting a new access token.
 */
async function _handleTokenError({
  error, target, thisArg, url, options, oAuth2Client
}) {
  if(!isInvalidAccessTokenError({error})) {
    throw error;
  }
  const accessToken = await getNewAccessToken({...oAuth2Client, maxRetries: 3});
  options.headers = options.headers || {};
  if(options.headers.Authorization) {
    options.headers.Authorization = [options.headers.Authorization];
    options.headers.Authorization.push(`Bearer ${accessToken}`);
  } else {
    options.headers.Authorization = `Bearer ${accessToken}`;
  }
  return target.apply(thisArg, [url, options]);
}
