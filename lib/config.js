/*!
 * Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {config} from '@bedrock/core';

config['oauth2-client'] = {
  accessTokenCache: {
    maxSize: 100,
    // 5 minutes
    maxAge: 5 * 60 * 1000
  },
  // time to live - the amount of a time a record will stay in the database
  // before it is expired. 2 week expiration in milliseconds.
  ttl: 2 * 7 * 24 * 60 * 60 * 1000
};
