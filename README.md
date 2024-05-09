# Bedrock OAuth 2.0 Client _(bedrock-oauth2-client)_

[![Build Status](https://img.shields.io/github/workflow/status/digitalbazaar/bedrock-oauth2-client/Bedrock%20Node.js%20CI)](https://github.com/digitalbazaar/bedrock-oauth2-client/actions?query=workflow%3A%22Bedrock+Node.js+CI%22)
[![NPM Version](https://img.shields.io/npm/v/bedrock-oauth2-client.svg)](https://npm.im/bedrock-oauth2-client)

> A bedrock module that creates and manages an OAuth2 client, that will make it easy to make http-client API calls to OAuth2-protected endpoints.

## Table of Contents

- [Background](#background)
- [Security](#security)
- [Install](#install)
- [Usage](#usage)
- [Contribute](#contribute)
- [Commercial Support](#commercial-support)
- [License](#license)

## Background

A Bedrock helper library intended to work with OAuth 2.0 bearer token protected API endpoints
(see for example [`authorize-access-token-middleware`](https://github.com/digitalbazaar/authorize-access-token-middleware)).
For use with `client_credentials` grant types only, for Server-to-Server use cases.

* [RFC6749 The OAuth 2.0 Authorization Framework](https://datatracker.ietf.org/doc/html/rfc6749) specification.

## Security

TBD

## Install

- Node.js 14+ is required.

### NPM

To install via NPM:

```
npm install --save @bedrock/oauth2-client
```

### Development

To install locally (for development):

```
git clone https://github.com/digitalbazaar/bedrock-oauth2-client.git
cd bedrock-oauth2-client
npm install
```

## Usage

### Configuration

Create a `configs/authorization.js` config file. For example:

```js
import * as bedrock from '@bedrock/core';
const {config} = bedrock;

config['your-bedrock-project'].authorization = [{
  issuer: config['your-bedrock-project'].services.issuerUrl,
  protocol: 'oauth2_client_grant',
  // Pre-registered CLIENT_ID and CLIENT_SECRET
  client_id: '...',
  client_secret: '...',
  // API endpoint to make a Client Credentials grant POST request to
  token_endpoint: `${config['your-bedrock-project'].services.issuerUrl}/token`,
  pkce: false,
  grant_type: 'client_credentials',
  scope: ['your.custom.scope']
}];
```
And add the corresponding entry to `lib/config.js`:

```js
await import(path.join(config.paths.config, 'authorization.js'));
```

### Requesting an Access Token on startup

On the `bedrock.start` event, for example in `lib/config.js`, request the access token from the required issuer.

```js
if(!process.env.CI) {
  bedrock.events.on('bedrock.start', async () => {
    const issuer = config['bedrock-oauth2-client'].services.issuerUrl;
    config['bedrock-oauth2-client'].exampleIssuerOAuth2Access.accessToken =
      await refreshAccessToken({issuer});
  });
}
```

### On Access Token Expiration/Revocation

Fetching a new access token on server startup (and re-authorizing another access token when the LRU Cache expires)
should prevent tokens from expiring. However, there are other events beyond the client control --
issuer keys being rotated, scopes being changed or revoked, etc. For these cases, you also need automated logic that
tries to refresh an access token if it encounters an appropriate error.

### When to Retry

If `error` is `invalid_token` AND `name` is `ConstraintError` (this covers Expired, Revoked, and Issuer Key Rotated
cases), check to see if max number of retries is exceeded (for that issuer). If not, retry the authorization flow and
fetch another access token.

If `name` is `DataError` or on any other error encountered during authorization flow -- do not retry. Continue throwing
a `503 Service Unavailable` error any time an access token is required for this issuer.

## Expanded Errors
Example OAuth 2 error response (the `error`, `error_description` and `error_uri` fields are dictated by the OAuth 2.0
spec, and the `name` property is Bedrock-specific):

```
HTTP/1.1 401 Unauthorized
WWW-Authenticate: Bearer error="invalid_token"
  error_description="The access token expired"
Content-type: application/json

{
  "error": "invalid_token",
  "error_description": "The access token expired",
  "name": "ConstraintError"
}
```

Bedrock-specific `invalid_token` conditions:
* Expired - `ConstraintError`
* Not found - `NotFoundError`
* Malformed JSON - `DataError`
* Malformed JWT (access token) - `DataError`
* Invalid signature (issuer key rotated, for example) - `ConstraintError` (was: DataError)
* Revoked - `ConstraintError`

## Contribute

See [the contribute file](https://github.com/digitalbazaar/bedrock/blob/master/CONTRIBUTING.md)!

PRs accepted.

If editing the Readme, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## Commercial Support

Commercial support for this library is available upon request from
Digital Bazaar: support@digitalbazaar.com

## License

[Apache-2.0](LICENSE) © Digital Bazaar
