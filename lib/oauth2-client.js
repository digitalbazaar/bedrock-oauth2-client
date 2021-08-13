/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import * as storage from './storage';
import * as bedrock from 'bedrock';
import {httpClient} from '@digitalbazaar/http-client';
import logger from './logger';
const {util: {BedrockError}} = bedrock;

export class OAuth2Client {
/**
 * Constructs an OAuth2Client instance to return an access token. It first
 *  checks the database to see if an access token already exists for the client
 *  id; if not it creates an access token then stores it in the database.
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
   *  access token already exists for the client id; if not it creates an
   *  access token then stores it in the database.
   *
   * @returns {string} The access token.
   */
  async getToken() {
    const {
      client_id, client_secret, token_endpoint, grant_type, scope, httpsAgent,
      maxRetries
    } = this;
    let token;
    token = await storage.get({client_id});
    if(!token || !token.access_token) {
      token = await getNewAccessToken({
        client_id, client_secret, token_endpoint, grant_type, scope, httpsAgent,
        maxRetries
      });
      await storage.insert({token});
    }
    return token.access_token;
  }
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
  const body = new URLSearchParams();
  body.set('client_id', client_id);
  body.set('client_secret', client_secret);
  body.set('grant_type', grant_type);
  body.set('scope', scope);

  let response;
  const token = {client_id, client_secret};

  while(maxRetries >= 0) {
    response = await httpPost({url: token_endpoint, body, httpsAgent});
    if(response && response.access_token) {
      token.access_token = response.access_token;
      return token;
    }
    --maxRetries;
  }
  throw new BedrockError(
    `Service Unavailable`, 'InvalidStateError', {
      httpStatusCode: 503,
      public: true
    });
}

async function httpPost({url, body, httpsAgent}) {
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
    return response;
  }
  return false;
}
