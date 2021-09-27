/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import bedrock from 'bedrock';
const {config} = bedrock;
import './config.js';
import {getAuthClients} from './oauth2-client.js';
import * as storage from './storage.js';
export {storage};
export * from './errorCheck.js';
export * from './authHttpClient.js';

bedrock.events.on('bedrock.ready', async () => {
  const clients = config;
  await getAuthClients({clients});

});

// for all client in config, get accesstoken for each one.
// all have to pass, if any fail it waits for a peirod of time, then exists
// now we have all accesstokens, create an authhttpclient for each
// finish event handler, then anyone who calls getauthhttpclient(shortname)
// and will return client
// client with handle oauth errors

// https://github.com/digitalbazaar/http-client/blob/main/main.js#L16-L29
// layer on handleresponse
