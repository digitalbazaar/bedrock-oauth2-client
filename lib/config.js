/*!
 * Copyright (c) 2021 Digital Bazaar, Inc. All rights reserved.
 */
import bedrock from 'bedrock';
const {config} = bedrock;

config['oauth2-client'] = {
  cache: {
    maxSize: 100,
    // 5 minutes
    maxAge: 5 * 60 * 1000
  }
};
