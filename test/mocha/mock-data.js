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

export const oAuth2Payload = {
  client_id: '123',
  client_secret: '456',
  token_endpoint: 'https://localhost:18443/token',
  grant_type: 'client_credentials',
  scope: ['meter']
};

export const mockToken1 = {
  client_id: '123',
  client_secret: 'abc',
  token_endpoint: 'https://localhost:18443/token',
  access_token: '123abc'
};

export const mockToken2 = {
  client_id: '234',
  client_secret: 'bcd',
  token_endpoint: 'https://localhost:18443/token',
  access_token: '234bcd'
};
