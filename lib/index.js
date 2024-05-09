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
