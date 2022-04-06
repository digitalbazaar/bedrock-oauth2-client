/*!
 * Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */
import * as bedrock from '@bedrock/core';
import './config.js';
import {getAuthzClients} from './oauth2-client.js';
export * from './errorCheck.js';
export * from './authzHttpClient.js';
export * from './oauth2-client.js';

const {config} = bedrock;

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
