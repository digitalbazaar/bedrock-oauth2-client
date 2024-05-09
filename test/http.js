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
import {asyncHandler} from '@bedrock/express';

bedrock.events.on('bedrock-express.configure.routes', app => {

  app.post('/token', asyncHandler(async (req, res) => {
    res.json({access_token: '78910'});
  }));

  app.get('/gettest', asyncHandler(async (req, res) => {
    if(req.headers.authorization !== 'Bearer 78910') {
      res.sendStatus(403);
      return;
    }
    res.json({response: 'success'});
  }));

  app.get('/geterrortest', asyncHandler(async (req, res) => {
    if(req.headers.authorization !== 'Bearer 123') {
      res.sendStatus(403);
      return;
    }
    res.json({response: 'success'});
  }));
});
