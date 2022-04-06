/*!
 * Copyright (c) 2021-2022 Digital Bazaar, Inc. All rights reserved.
 */
import * as bedrock from '@bedrock/core';
import '@bedrock/https-agent';
import '@bedrock/mongodb';
import '@bedrock/oauth2-client';

import '@bedrock/test';
import './mocha/nock.js';
bedrock.start();
