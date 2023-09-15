/*!
 * Copyright (c) 2021-2023 Digital Bazaar, Inc. All rights reserved.
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
