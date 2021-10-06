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
  for(const namespace in config) {
    if(config[namespace].authorization) {
      const clients = config[namespace].authorization;
      await getAuthClients({clients});
    }
  }
});
