# bedrock-oauth2-client ChangeLog

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
