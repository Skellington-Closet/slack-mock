# Change Log
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/) 
and this project adheres to [Semantic Versioning](http://semver.org/).


## [1.1.0](https://github.com/Skellington-Closet/skellington/compare/v1.0.0...v1.1.0)

### Added

- New `logger` option.

### Changed

- Default Botkit logger now uses [Skellington Logger](https://github.com/Skellington-Closet/skellington-logger)
- Skellington uses its own logger instead of piggy-backing on Botkit's logger.


## [1.0.0](https://github.com/Skellington-Closet/skellington/compare/v0.2.0...v1.0.0)

### Added

- Beautiful new logo from [@jasonrhodes](https://github.com/jasonrhodes)!
- Debug mode for logging all messages to `controller.hears` calls. Adds a `skellington` key to the message object.
- Skellington instance returned from exported function. There's not much here until you turn on debug mode.

### Changed

- Support for Slack apps! (So much work for one line in the change log.)
- Adds `botConnected` callback triggered on successful connection to the Slack RTM API.
- Botkit.slackbot configs are now in the `botkit` config stanza. This will future-proof the config options and prevent collisions.
- Botkit dependency is now `^` matched to help bug fixes and new features propagate quicker.

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
