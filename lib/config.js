/*!
 * Copyright 2021 - 2025 Digital Bazaar, Inc.
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

import {config} from '@bedrock/core';

config['oauth2-client'] = {
  accessTokenCache: {
    max: 100,
    // 5 minutes
    ttl: 5 * 60 * 1000
  },
  // time to live - the amount of a time a record will stay in the database
  // before it is expired. 2 week expiration in milliseconds.
  ttl: 2 * 7 * 24 * 60 * 60 * 1000
};
