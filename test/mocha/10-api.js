/*
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */

const {
  storage, isInvalidAccessTokenError, isUnrecoverableError, getAccessToken,
  createAuthzHttpClient
} = require('bedrock-oauth2-client');
const {oAuth2Payload} = require('./mock-data.js');

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
    const error = new Error('Invalid Token');
    error.status = 401;
    error.data = {error: 'invalid_token', name: 'ConstraintError'};
    const errorResult = isInvalidAccessTokenError({error});
    errorResult.should.eql(true);
  });
  it('should return false if an error status is not 401', async () => {
    const error = new Error('Invalid Token');
    error.status = 500;
    error.data = {error: 'invalid_token'};
    const errorResult = isInvalidAccessTokenError({error});
    errorResult.should.eql(false);
  });
  it('should return true if an error is unrecoverable', async () => {
    const error = new Error('Invalid Token');
    error.status = 401;
    error.data = {error: 'InvalidClient'};
    const errorResult = isUnrecoverableError({error});
    errorResult.should.eql(true);
  });
  it('should return false if an error is not unrecoverable', async () => {
    const error = new Error('Invalid Token');
    error.status = 401;
    error.data = {error: 'invalid_token', name: 'ConstraintError'};
    const errorResult = isUnrecoverableError({error});
    errorResult.should.eql(false);
  });
  it('should throw error with no client_id', async () => {
    const payload = JSON.parse(JSON.stringify(oAuth2Payload));
    delete payload.client_id;
    let result;
    let err;
    try {
      result = await getAccessToken({...payload});
    } catch(e) {
      err = e;
    }
    should.not.exist(result);
    err.message.should.equal('"client_id" is required.');
  });
  it('should throw error with no client_secret', async () => {
    const payload = JSON.parse(JSON.stringify(oAuth2Payload));
    delete payload.client_secret;
    let result;
    let err;
    try {
      result = await getAccessToken({...payload});
    } catch(e) {
      err = e;
    }
    should.not.exist(result);
    err.message.should.equal('"client_secret" is required.');
  });
  it('should throw error with no token_endpoint', async () => {
    const payload = JSON.parse(JSON.stringify(oAuth2Payload));
    delete payload.token_endpoint;
    let result;
    let err;
    try {
      result = await getAccessToken({...payload});
    } catch(e) {
      err = e;
    }
    should.not.exist(result);
    err.message.should.equal('"token_endpoint" is required.');
  });
  it('should return an authzHttpClient', async () => {
    const payload = JSON.parse(JSON.stringify(oAuth2Payload));
    const authzHttpClient =
      await createAuthzHttpClient({oAuth2Client: payload});
    should.exist(authzHttpClient);
    authzHttpClient.should.be.a('function');
  });
});
