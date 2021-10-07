/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import bedrock from 'bedrock';
const {config} = bedrock;
import './config.js';
import {getAuthzClients} from './oauth2-client.js';
import * as storage from './storage.js';
export {storage};
export * from './errorCheck.js';
export * from './authzHttpClient.js';

bedrock.events.on('bedrock.ready', async () => {
  const promises = [];
  for(const namespace in config) {
    if(config[namespace].authorization) {
      const clients = config[namespace].authorization;
      promises.push(getAuthzClients({clients}));
    }
  }
  await Promise.all(promises);
});
