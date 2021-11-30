/*
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
const {mockToken1, mockToken2} = require('./mock-data.js');
const {storage} = require('bedrock-oauth2-client');

describe('Storage Database Tests', function() {
  describe('Indexes', function() {
    beforeEach(async () => {
      // mutliple records are inserted here in order to do proper assertions
      // for 'nReturned', 'totalKeysExamined' and 'totalDocsExamined'.
      await storage.insert({token: mockToken1});
      await storage.insert({token: mockToken2});
    });
    it(`is properly indexed for 'token.client_id' and 'token.token_endpoint'` +
      'in get()', async function() {
      const {client_id, token_endpoint} = mockToken1;
      const {executionStats} = await storage.get({
        client_id, token_endpoint, explain: true
      });
      executionStats.nReturned.should.equal(1);
      executionStats.totalKeysExamined.should.equal(1);
      executionStats.totalDocsExamined.should.equal(1);
      executionStats.executionStages.inputStage.inputStage.stage
        .should.equal('IXSCAN');
      executionStats.executionStages.inputStage.inputStage.keyPattern
        .should.eql({'token.client_id': 1, 'token.token_endpoint': 1});
    });
  });
});
