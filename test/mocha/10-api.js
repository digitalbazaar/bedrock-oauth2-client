/*
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const {oAuth2Payload} = require('./mock-data.js');
const {
  storage, isInvalidAccessTokenError, isUnrecoverableError, getAccessToken,
  createAuthzHttpClient
} = require('bedrock-oauth2-client');

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
    err.message.should.equal('"client_id" must be a string.');
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
    err.message.should.equal('"client_secret" must be a string.');
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
    err.message.should.equal('"token_endpoint" must be a string.');
  });
  it('should return an authzHttpClient', async () => {
    const payload = JSON.parse(JSON.stringify(oAuth2Payload));
    const authzHttpClient =
      await createAuthzHttpClient({oAuth2Client: payload});
    should.exist(authzHttpClient);
    authzHttpClient.should.be.a('function');
  });
  it('should successfully get a response using authzHttpClient', async () => {
    const payload = JSON.parse(JSON.stringify(oAuth2Payload));
    const authzHttpClient =
      await createAuthzHttpClient({oAuth2Client: payload});
    should.exist(authzHttpClient);
    authzHttpClient.should.be.a('function');
    let result;
    let err;
    try {
      result = await authzHttpClient.get('http://www.test.com/gettest', {});
    } catch(e) {
      err = e;
    }
    should.not.exist(err);
    result.status.should.eql(200);
    result.data.response.should.eql('success');
  });
  it('should error with incorrect access token', async () => {
    const payload = JSON.parse(JSON.stringify(oAuth2Payload));
    const authzHttpClient =
      await createAuthzHttpClient({oAuth2Client: payload});
    should.exist(authzHttpClient);
    authzHttpClient.should.be.a('function');
    let result;
    let err;
    try {
      result = await authzHttpClient.get('http://www.test.com/geterrortest',
        {});
    } catch(e) {
      err = e;
    }
    should.exist(err);
    should.not.exist(result);
    err.code.should.eql('ERR_NOCK_NO_MATCH');
  });
});
