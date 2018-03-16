# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) 
and this project adheres to [Semantic Versioning](http://semver.org/).

## [1.1.1](https://github.com/Skellington-Closet/slack-mock/compare/v1.1.0...v1.1.1)

### Fixed

- Closes the express server when the RTM websocket server is closed. Thanks for the PR [finferflu](https://github.com/finferflu)!

## [1.1.0](https://github.com/Skellington-Closet/slack-mock/compare/v1.0.2...v1.1.0)

### Changed

- Starts RTM server on a web API request to `rtm.connect`. Thanks for the PR [Lowry99](https://github.com/Lowry99)!

## [1.0.2](https://github.com/Skellington-Closet/slack-mock/compare/v1.0.1...v1.0.2)

### Changed

- Fixed wrong parameter name in README web API examples. Thanks for the PR [bmajz](https://github.com/bmajz)!

## [1.0.1](https://github.com/Skellington-Closet/slack-mock/compare/v1.0.0...v1.0.1)

### Added

- `params` property in the Events API recorded response. This was incorrectly stored as `body`.
`body` will continue to work for the Events API calls, though will be deprecated and removed in a future major release.

### Changed

- Fixed incorrect docs for the Events API
- Fixed incorrect docs and README example for the RTM API.

## [1.0.0](https://github.com/Skellington-Closet/slack-mock/tree/v1.0.0)

### Added

- Every initial feature for all your mocking needs! 
