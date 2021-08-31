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

- Node.js 12+ is required.

### NPM

To install via NPM:

```
npm install --save bedrock-oauth2-client
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
import bedrock from 'bedrock';
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

## Contribute

See [the contribute file](https://github.com/digitalbazaar/bedrock/blob/master/CONTRIBUTING.md)!

PRs accepted.

If editing the Readme, please conform to the
[standard-readme](https://github.com/RichardLitt/standard-readme) specification.

## Commercial Support

Commercial support for this library is available upon request from
Digital Bazaar: support@digitalbazaar.com

## License

[Bedrock Non-Commercial License v1.0](LICENSE.md) © Digital Bazaar
