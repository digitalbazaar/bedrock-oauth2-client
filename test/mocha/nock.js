/*
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const nock = require('nock');

nock('http://www.test.com')
  .post('/token')
  .reply(200, {access_token: '78910'});

nock('http://www.test.com', {
  reqheaders: {
    authorization: 'Bearer 78910',
  }
})
  .get('/gettest')
  .reply(200, {response: 'success'});

nock('http://www.test.com', {
  reqheaders: {
    authorization: 'Bearer 123',
  }
})
  .get('/geterrortest')
  .reply(200, {response: 'success'});
