# bedrock-oauth2-client ChangeLog

## 7.0.0 - 2023-09-xx

### Changed
- **BREAKING**: Drop support for Node.js < 18.
- Use `@digitalbazaar/http-client@4`. This version requires Node.js 18+.
- Use `p-retry@6`. This version requires Node.js 16+.
- Remove use of `nock` in the test suite. It is currently not compatible with
  the Node.js `fetch` API.

## 6.0.1 - 2022-08-05

### Fixed
- Update internal dependencies.

## 6.0.0 - 2022-04-29

### Changed
- **BREAKING**: Update peer deps:
  - `@bedrock/core@6`
  - `@bedrock/express@8`
  - `@bedrock/https-agent@4`.

## 5.0.0 - 2022-04-06

### Changed
- **BREAKING**: Rename package to `@bedrock/oauth2-client`.
- **BREAKING**: Convert to module (ESM).
- **BREAKING**: Remove default export.
- **BREAKING**: Require node 14.x.

## 4.0.1 - 2022-02-23

### Fixed
- Exit with error code `1` on unrecoverable error instead of doing
  graceful clean exit.

## 4.0.0 - 2021-12-10

### Removed
- **BREAKING**: Remove database storage.

### Changed
- **BREAKING**: Update `getAccessToken` and `getNewAccessToken` to return object with
  `accessToken` property.

## 3.1.0 - 2021-11-30

### Added
- Added optional `explain` param to get more details about database performance.
- Added database tests in order to check database performance.

## 3.0.3 - 2021-11-29

### Changed
- Simplify `options` and `url` in `authzHttpClient`.

## 3.0.2 - 2021-11-29

### Added
- Update `options` and `url` in `authzHttpClient`.

## 3.0.1 - 2021-11-08

### Added
- Added check for `error.data` in error check functions.

## 3.0.0 - 2021-11-03

### Removed
- **BREAKING**: Removed `OAuth2Client` class.

### Added
- Added `createAuthzHttpClient` which returns an instance of `httpClient` with the
  `authorization` header populated.
- Added additional tests for `authzHttpClient` and errors.

## 2.1.0 - 2021-09-14

### Added
- Added `retryAndExitOnFailure` parameter to `getAccessToken`. When true, it
  will continually retry to get an access token and exit if it encounters an
  unrecoverable error.

## 2.0.0 - 2021-09-09

### Changed
- **BREAKING**: Renamed `checkError` to `isInvalidAccessTokenError`.

### Added
- Added `isUnrecoverableError`.
- Added tests for `isInvalidAccessTokenError` and `isUnrecoverableError`.

## 1.1.0 - 2021-09-03

### Added
- Added `checkError` export.

## 1.0.0 - 2021-08-31

### Added
- Initial release, see individual commits for history.
