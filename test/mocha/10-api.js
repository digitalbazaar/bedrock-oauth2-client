/*
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

const {checkDatabase, insertToken} = require('bedrock-oauth2-client');

describe('oauth2-client', () => {
  it('should insert an item into the database', async () => {
    const token = {
      client_id: '123',
      client_secret: 'abc',
      access_token: '123abc'
    };
    let result;
    let err;
    try {
      result = await insertToken({token});
    } catch(e) {
      err = e;
    }
    assertNoError(err);
    should.exist(result);
    result.should.have.property('meta');
    result.token.should.eql(token);
  });
  it('should get am item from the database', async () => {
    const token = {
      client_id: '123',
      client_secret: 'abc',
      access_token: '123abc'
    };
    let result;
    let err;
    try {
      result = await checkDatabase({client_id: token.client_id});
    } catch(e) {
      err = e;
    }
    assertNoError(err);
    should.exist(result);
    result.client_id.should.eql(token.client_id);
    result.client_secret.should.eql(token.client_secret);
    result.access_token.should.eql(token.access_token);
    result.should.have.property('expires');
  });
});
