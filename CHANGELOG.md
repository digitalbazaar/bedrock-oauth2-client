# bedrock-oauth2-client ChangeLog

## 4.0.0 - 2021-xx-xx

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
