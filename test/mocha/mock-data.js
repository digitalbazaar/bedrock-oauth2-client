/*!
 * Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */
export const oAuth2Payload = {
  client_id: '123',
  client_secret: '456',
  token_endpoint: 'http://www.test.com/token',
  grant_type: 'client_credentials',
  scope: ['meter']
};

export const mockToken1 = {
  client_id: '123',
  client_secret: 'abc',
  token_endpoint: 'http://www.test.com/token',
  access_token: '123abc'
};

export const mockToken2 = {
  client_id: '234',
  client_secret: 'bcd',
  token_endpoint: 'http://www.test.com/token',
  access_token: '234bcd'
};
