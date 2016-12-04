# slack-mock

[![Build Status](https://travis-ci.org/colestrode/slack-mock.svg?branch=master)](https://travis-ci.org/colestrode/slack-mock) 
[![Coverage Status](https://coveralls.io/repos/github/colestrode/slack-mock/badge.svg?branch=master)](https://coveralls.io/github/colestrode/slack-mock?branch=master)
[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

A Slack API mocker for all your Slack bot integration tests.

## Mock All Slack APIs

Slack Mock will mock all seven (yes, seven!) ways of pushing data into and pulling data from Slack. You can use it to mock calls to 
- [the Web API](https://api.slack.com/web)
- [the RTM API](https://api.slack.com/rtm)
- [the Events API](https://api.slack.com/events-api)
- [Slash Commands](https://api.slack.com/slash-commands)
- [Incoming Webhooks](https://api.slack.com/incoming-webhooks)
- [Outgoing Webhooks](https://api.slack.com/outgoing-webhooks)
- [Interactive Buttons](https://api.slack.com/docs/message-buttons)

You can use your API calls as is without changing any URLs or tokens. Slack Mock will capture all outbound HTTP requests to `https://slack.com` and `https://hooks.slack.com`, so Slack will never receive your API calls. 

You can inspect all outbound requests and trigger incoming requests to make sure your bot is behaving correctly.

## No Magic Included

OK, there's a little magic included in capturing HTTP requests, but that's it. No timeouts, magic promises, or events. Functional tests are hard, trying to make them easy with magic that is out of your control for "convenience" only makes them harder.

Functional test by their nature are asynchronous: you are inspecting from the outside an arbitrarily complex flow between at least two entities (your bot and the Slack API) and there is no guaranteed, deterministic way to know when that flow is complete. Any attempt by this library to assume to signal the communication is complete will be wrong some of the tim, and just cause you frustration.

The simplest and most straightforward approach is to build in wait times into your integration tests (inevetiably this is what I do for integration tests regardless of the sugar provided by the libray I'm using).

This is my recommended flow for an integration test: queue up responses from Slack to your bot, then send a message from Slack to your bot to trigger a bot action, wait some period of time, then assert that your bot made the correct calls to Slack in order. How long do you wait? It depends on what your bot is doing. Play around a little and see what works. I find a 25 millisecond wait is enough for simple flows. 

## Examples

See the [examples tests](examples/test) for full examples of mocking both a single-team RTM bot and a full
Slack App. You can run the examples with `npm run examples`.

TODO inclue samples here


## API Conventions

Slack Mock will intercept all requests to `https://slack.com` and `https://hooks.slack.com`. There's no need to change any URLs in your bot.

General notes on API methods. Not every API wrapper supports every method, see the API docs below:
- `addResponse` will add the next response returned. You can call mutlitple times to queue responses. If you set a `url` option, then the response will only be returned for that url. URL specific responses take precedence over unspecified responses
- `calls` will be in order received and always contain params, headers, and url. Params are a mix of url params and body.
- `reset` will always clear calls and any queued responses you have.
- `send` will always send *from* Slack *to* your bot/app. Send will always return a promise for an easy way to build in delays.

There is also a top level `reset` convenience method that will call reset on each API wrapper.

Slack mock will respond to all requests with a 200 OK unless a custom response has been queued. For web requests, a the default body will be `{ok: true}`.

## API

### `slackMock`: `function(config)`

The exported function used to start the Slack Mock server. Returns an instance of the server.

Slack Mock is a singleton so can only be configured once per process. Subsequent calls to slackMock() will return
the same instance.

Config options are: 
  - `rtmPort` (number, optional) The port number the RTM websocket server will be started on. Defaults to 9001.
  - `logLevel` (String, optional) The log level to use. One of error, warn, info, verbose, debug, silly. Defaults to info.


---


### `instance`

The configured instance of the Slack Mock `slackMock.instance` object. This is the same object returned from `slackMock(config)` 

---


### `instance.events` (Events API)

The `events` object mocks sending payloads from the Slack Events API to your Slack App.

- `send`: `function(targetUrl, body)` Sends a payload from the Events API to your Slack App target URL.
The body will include a `response_url` parameter. Returns an immediately resolved Promise for easy chaining.

- `reset`: `function()` Empties the `events.calls` array.

- `calls`: `Array` An array of payloads received your from Slack app in response to an Events API POST.
This includes both responses to the original Events API request and requests to the `response_url`.
  - `url` The url of the call that was intercepted
  - `params` The POST body merged with any query string parameters captured from the intercepted request as an Object
  - `headers` The headers of the intercepted request as an Object
  - `statusCode` The status code of the intercepted request


---


### `instance.incomingWebhooks` (Incoming Webhooks)

The `incomingWebhooks` object mocks sending payloads from you Slack App to all Incoming Webhooks at `https://hooks.slack.com/`.

- `addResponse`: `function(opts)` Queues a response payload that Slack Mock will use to respond upon
receiving a post to a registered endpoint. This method can be called multiple times. Responses
will be used in a FIFO order. Options are: 
  - `url` (String, optional) The Incoming Webhook URL your app will be POSTing to.
  - `statusCode` (Number, optional) The HTTP status code to reply with. Defaults to 200. 
  - `body` (Object, optional) The response body to reply with. Defaults to `{ok: true}`
  - `headers` (Object, optional) The HTTP headers to reply with. Defaults to `{}`

- `reset`: `function()` Empties the `incomingWebhooks.calls` array and clears any queued responses.

- `calls`: `Array` An array of payloads received your from Slack app to an Incoming Webhook url.
  - `url` The url of the call that was intercepted
  - `params` The POST body merged with any query string parameters captured from the intercepted request as an Object
  - `headers` The headers of the intercepted request as an Object
  - `statusCode` The status code of the intercepted request. Only captured for immediate responses, not for using the `response_url`.
  - `type` Either `response` or `response_url`. Indicates how the call was intercepted.


---


### `instance.interactiveButtons` (Interactive Buttons)

The `interactiveButtons` object mocks sending payloads from Slack interactive buttons to your Slack App.

- `send`: `function(targetUrl, body)` Sends a payload from a Slack interactive button to your Slack App target URL.
The body will include a `response_url` parameter. Returns an immediately resolved Promise for easy chaining.

- `addResponse`: `function(opts)` Queues a response payload that Slack Mock will use to respond upon
receiving a post to a registered endpoint. This method can be called multiple times. Responses
will be used in a FIFO order. Options are: 
  - `url` (String, optional) The Incoming Webhook URL your app will be POSTing to.
  - `statusCode` (Number, optional) The HTTP status code to reply with. Defaults to 200. 
  - `body` (Object, optional) The response body to reply with. Defaults to `{ok: true}`
  - `headers` (Object, optional) The HTTP headers to reply with. Defaults to `{}`


- `reset`: `function()` Empties the `interactiveButtons.calls` array.

- `calls`: `Array` An array of payloads received your from Slack app in response to an Slack interactive button POST.
This includes both responses to the original Slack interactive button request and requests to the `response_url`.
  - `url` The url of the call that was intercepted. For type `response`, this will be the endpoint in your Slack app used in the call to 
  `interactiveButtons.send`, for type `response_url` this will be the `response_url` from the payload sent to your Slack app.
  - `params` The POST body merged with any query string parameters captured from the intercepted request as an Object
  - `headers` The headers of the intercepted request as an Object
  - `statusCode` The status code of the intercepted request. Only captured for immediate responses, not for using the `response_url`.
  - `type` Either `response` or `response_url`. Indicates how the call was intercepted.


---


### `instance.outgoingingWebhooks` (Outgoing Webhooks)

The `outgoingingWebhooks` object mocks sending payloads from Slack Outgoing Webhooks to your Slack App.

- `send`: `function(targetUrl, body)` Sends a payload from an Outgoing Webhook to your Slack App target URL.
The body will include a `response_url` parameter Returns an immediately resolved Promise for easy chaining.

- `reset`: `function()` Empties the `outgoingingWebhooks.calls` array.

- `calls`: `Array` An array of payloads received your from Slack app in response to an Outgoing Webhook POST.
  - `url` The url of the call that was intercepted
  - `params` The POST body merged with any query string parameters captured from the intercepted request as an Object
  - `headers` The headers of the intercepted request as an Object
  - `statusCode` The status code of the intercepted request.


---


### `instance.rtm` (RTM)

The `rtm` object mocks sending and receiving payloads from the Slack RTM API.

- `clients`: `Array` An array of websocket clients connected to the mock RTM server. Ordered by connection time.

- `broadcast`: `function(message)` Broadcasts a message from Slack to all connected clients (bots). Good for single team 
bots or simulating bots that are connected to the same team. Returns an immediately resolved Promise for easy chaining.

- `send`: `function(message, client)` Sends a message from Slack to a connected client (bot).
Returns an immediately resolved Promise for easy chaining.

- `reset`: `function()` Clears the `rtm.calls` array and closes connections to all connected clients.

- `calls`: `Array` An array of payloads received by the RTM API from your Slack app.
  - `message` The message that was received by the RTM API as an Object.
  - `client` A reference to the websocket client that received the payload.
  - `rawMessage` The original String message received by the RTM API. Good for troubleshooting.


---


### `instance.slashCommands` (Slash Commands)

The `slashCommands` object mocks sending payloads from a Slack Slash Command to your Slack App.

- `send`: `function(targetUrl, body)` Sends a payload from a Slash Command to your Slack App target URL.
The body will include a `response_url` parameter Returns an immediately resolved Promise for easy chaining.

- `addResponse`: `function(opts)` Queues a response payload that Slack Mock will use to respond upon
receiving a post to a registered endpoint. This method can be called multiple times. Responses
will be used in a FIFO order. Options are: 
  - `url` (String, optional) The Incoming Webhook URL your app will be POSTing to.
  - `statusCode` (Number, optional) The HTTP status code to reply with. Defaults to 200. 
  - `body` (Object, optional) The response body to reply with. Defaults to `{ok: true}`
  - `headers` (Object, optional) The HTTP headers to reply with. Defaults to `{}`

- `reset`: `function()` Empties the `slashCommands.calls` array.

- `calls`: `Array` An array of payloads received your from Slack app in response to an Slash Command POST.
This includes both responses to the original Slash Command request and requests to the `response_url`.
  - `url` The url of the call that was intercepted
  - `params` The POST body merged with any query string parameters captured from the intercepted request as an Object
  - `headers` The headers of the intercepted request as an Object
  - `statusCode` The status code of the intercepted request. Only captured for immediate responses, not for using the `response_url`.
  - `type` Either `response` or `response_url`. Indicates how the call was intercepted.


---


### `instance.web` (Web API)

The `web` object receives requests to the Slack Web API and responds with mocked responses.

This mock can be used both for the Web API and the OAuth endpoint (`https://slack.com/oauth/authorize`). 
It supports both GET and POST requests to all endpoints.

- `addResponse`: `function(opts)` Queues a response payload that Slack Mock will use to respond upon
receiving a request to a Web API endpoint. Endpoints without a custom response will return 200 `{ok: true}`.
This method can be called multiple times per endpoint. Responses will be used in a FIFO order. Options are: 
  - `url` (String, optional) Web API URL your app will be POSTing to.
  - `status` (Number, optional) The HTTP status code to reply with. Defaults to 200. 
  - `body` (Object, optional) The response body to reply with. Defaults to `{ok: true}`
  - `headers` (Object, optional) The HTTP headers to reply with. Defaults to `{}`

- `reset`: `function()` Empties the `web.calls` array and clears any queued responses.

- `calls`: `Array` An array of payloads received your from Slack app to a Web API endpoint.
Each call will contain
  - `url` The url of the call that was intercepted
  - `params` The POST body merged with any query string parameters captured from the intercepted request as an Object
  - `headers` The headers of the intercepted request as an Object


---


### `instance.reset`: `function()`

Resets all mocks. A convenience method for calling reset on individual API mocks.


