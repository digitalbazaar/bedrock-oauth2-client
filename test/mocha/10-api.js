/*
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

const {storage, isInvalidTokenError} = require('bedrock-oauth2-client');

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
      result = await storage.insert({token});
    } catch(e) {
      err = e;
    }
    assertNoError(err);
    should.exist(result);
    result.should.have.property('meta');
    result.token.client_id.should.eql(token.client_id);
    result.token.client_secret.should.eql(token.client_secret);
    result.token.access_token.should.eql(token.access_token);
    result.token.should.have.property('expires');
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
      result = await storage.get({client_id: token.client_id});
    } catch(e) {
      err = e;
    }
    assertNoError(err);
    should.exist(result);
    result.should.have.property('meta');
    result.token.client_id.should.eql(token.client_id);
    result.token.client_secret.should.eql(token.client_secret);
    result.token.access_token.should.eql(token.access_token);
    result.token.should.have.property('expires');
  });
  it('should return true if an error contains "invalid_token"', async () => {
    const e = new Error('Invalid Token');
    e.status = 401;
    e.data = {error: 'invalid_token'};
    const errorResult = isInvalidTokenError({e});
    errorResult.should.eql(true);
  });
  it('should return false if an error status is not 401', async () => {
    const e = new Error('Invalid Token');
    e.status = 500;
    e.data = {error: 'invalid_token'};
    const errorResult = isInvalidTokenError({e});
    errorResult.should.eql(false);
  });
});
