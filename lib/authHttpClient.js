/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import {httpClient} from '@digitalbazaar/http-client';
import {isInvalidAccessTokenError} from './errorCheck.js';
import {getAccessToken, getNewAccessToken} from './oauth2-client.js';
import bedrock from 'bedrock';
const {BedrockError} = bedrock;

const proxyMethods = new Set([
  'get', 'post', 'push', 'patch', 'head', 'delete'
]);

export function getAuthHttpClient({oAuth2Client}) {
  const authHttpClient = new Proxy(httpClient, {
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
  return authHttpClient;
}

async function _handleRequest(target, thisArg, args, oAuth2Client) {
  const accessToken = await getAccessToken(...oAuth2Client);

  // create the auth header using the token
  // add the auth header to the headers object of args
  const [url, options] = args;
  options.headers = options.headers || {};
  options.headers.Authorization = `Bearer ${accessToken}`;

  let response;
  try {
    response = await target.apply(thisArg, [url, options]);
  } catch(error) {
    return _handleTokenError({
      error, target, thisArg, url, options, oAuth2Client
    });
  }
  return response;
}

async function _handleTokenError({
  error, target, thisArg, url, options, oAuth2Client
}) {
  if(!isInvalidAccessTokenError({error})) {
    throw error;
  }
  const accessToken = await getNewAccessToken({...oAuth2Client, maxRetries: 3});
  if(accessToken) {
    return target.apply(thisArg, [url, options]);
  }
  throw new BedrockError('Could not get token after 3 retries', error);
}
