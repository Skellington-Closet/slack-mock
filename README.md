# slack-mock
A Slack API mocker for Slack bot integration tests.

## API

### `slackMock`: `function(config)`

The exported function used to start the Slack Mock server. Returns an instance of the server.

Config options are: 
  - rtmPort (number, optional) The port number the RTM websocket server will be started on. Defaults to 9001.
  - logLevel (String, optional) The log level to use. One of error, warn, info, verbose, debug, silly. Defaults to info.


### `instance`

The configured instance of the Slack Mock `slackMock.instance` object. This is the same object returned from `slackMock(config)` 



### `instance.events` (Events API)

The `events` object mocks sending payloads from the Slack Events API to your Slack App.

- `send`: `function(targetUrl, body)` Sends a payload from the Events API to your Slack App target URL.
The body will include a `response_url` parameter

- `reset`: `function()` Empties the `events.calls` array.

- `calls`: `Array` An array of payloads received your from Slack app in response to an Events API POST.
This includes both responses to the original Events API request and requests to the `response_url`.


### `instance.incomingWebhooks` (Incoming Webhooks)

The `incomingWebhooks` object mocks sending payloads from the Slack Events API to your Slack App.

- `register`: `function(url)` Registers a Slack Incoming Webhook endpoint your Slack app will POST to.

- `addResponse`: `function(opts)` Queues a response payload that Slack Mock will use to respond upon
receiving a post to a registered endpoint. This method can be called multiple times per webhook. Responses
will be used in a FIFO order.

Options are: 
  - url (String, required) The Incoming Webhook URL your app will be POSTing to.
  - status (Object, optional) The HTTP status code to reply with. Defaults to 200. 
  - body (Object, optional) The response body to reply with. Defaults to `{ok: true}`
  - headers (Object, optional) The HTTP headers to reply with. Defaults to `{}`

- `reset`: `function()` Empties the `incomingWebhooks.calls` array and clears any queued responses.

- `calls`: `Array` An array of payloads received your from Slack app to an Incoming Webhook url.

### `instance.interactiveButtons` (Interactive Buttons)

The `interactiveButtons` object mocks sending payloads from Slack interactive buttons to your Slack App.

- `send`: `function(targetUrl, body)` Sends a payload from a Slack interactive button to your Slack App target URL.
The body will include a `response_url` parameter

- `reset`: `function()` Empties the `interactiveButtons.calls` array.

- `calls`: `Array` An array of payloads received your from Slack app in response to an Slack interactive button POST.
This includes both responses to the original Slack interactive button request and requests to the `response_url`.


### `instance.incomingWebhooks` Outgoing Webhooks

### RTM API

### Slash Commands

### Web API


## Examples

