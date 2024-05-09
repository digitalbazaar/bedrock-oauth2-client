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

import {
  createAuthzHttpClient, getAccessToken, isInvalidAccessTokenError,
  isUnrecoverableError
} from '@bedrock/oauth2-client';
import {oAuth2Payload} from './mock-data.js';

describe('oauth2-client', () => {
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
      result = await authzHttpClient.get('https://localhost:18443/gettest', {});
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
      result = await authzHttpClient.get(
        'https://localhost:18443/geterrortest', {});
    } catch(e) {
      err = e;
    }
    should.exist(err);
    should.not.exist(result);
    err.message.should.equal('Request failed with status code 403 Forbidden');
    err.status.should.equal(403);
  });
});
