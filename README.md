# slack-mock

[![Build Status](https://travis-ci.org/Skellington-Closet/slack-mock.svg?branch=master)](https://travis-ci.org/Skellington-Closet/slack-mock) 
[![Coverage Status](https://coveralls.io/repos/github/Skellington-Closet/slack-mock/badge.svg?branch=master)](https://coveralls.io/github/Skellington-Closet/slack-mock?branch=master)
[![Standard - JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

A Slack API mocker for all your Slack bot and Slack app integration tests.

## Mock All Slack APIs

Slack Mock will mock all seven ways of pushing data into and pulling data from Slack. You can use it to mock calls to 
- [the Web API](https://api.slack.com/web)
- [the RTM API](https://api.slack.com/rtm)
- [the Events API](https://api.slack.com/events-api)
- [Slash Commands](https://api.slack.com/slash-commands)
- [Incoming Webhooks](https://api.slack.com/incoming-webhooks)
- [Outgoing Webhooks](https://api.slack.com/outgoing-webhooks)
- [Interactive Buttons](https://api.slack.com/docs/message-buttons)

You can use your API calls as is without changing any URLs or tokens. Slack Mock will capture all outbound HTTP requests to `https://slack.com` and `https://hooks.slack.com`, so Slack will never receive your API calls. 

With Slack-Mock you can inspect all outbound requests and trigger incoming requests to make sure your bot is doing the right thing.

## No Magic Included

OK, there's a little magic included in capturing HTTP requests, but that's it. No timeouts, magic promises, or events. Integration tests are hard, trying to make them easy with "convenience" abstractions that are out of your control only makes them harder.

Integration test by their nature are testing a closed system: you are inspecting from the outside a complex flow between at least two entities (your bot and the Slack API) and there is no guaranteed way to know when that flow is complete by observing from the outside. Any attempt to guess when the communication is complete will be wrong some of the time and just cause you frustration.

That's why Slack Mock provides simple, synchronous methods to queue, trigger, and inspect messages to and from Slack. No magic included.

To write a Slack Mock integration test queue up responses from Slack to your bot, then use Slack Mock to send a message from Slack to your bot to trigger a bot action, wait some time, then assert that your bot made the correct calls to Slack in order. How long do you wait? It depends on what your bot is doing. Play around a little and see what works. I find a 50 millisecond wait is more than enough for most flows. 

## Usage

See the [examples tests](examples/test) for full examples of mocking both a single-team RTM bot and a full
Slack App. You can run the examples with `npm run examples`.

### Events API

```js
const payload = {...}

return slackMock.events.send('http://localhost:9000/event', payload)
  .then(delay(50))
  .then(() => {
    expect(slackMock.events.calls).to.have.length(1)
    const firstCall = slackMock.events.calls[0]
    expect(firstCall.statusCode).to.equal(200)
  })
```

### Incoming Webhooks

```js
// incoming webhooks
const firstCall = slackMock.incomingWebhooks.calls[0]
expect(firstCall.params.text).to.equal('hello world')
```

### Interactive Buttons

```js
const payload = {...}

slackMock.interactiveButtons.addResponse({statusCode: 201})

return slackMock.interactiveButtons.send('http://localhost:9000/button', payload)
  .then(delay(75))
  .then(() => {
    expect(slackMock.interactiveButtons.calls).to.have.length(2)
    const responseUrlCall = _.find(slackMock.interactiveButtons.calls, {type: 'response_url'})
    expect(responseUrlCall.params.text).to.equal('GO CUBS')
  })
```

### Outgoing Webhooks

```js
const payload = {...}

return slackMock.outgoingWebhooks.send('http://localhost:9000/outgoing', payload)
  .then(delay(50))
  .then(() => {
    expect(slackMock.outgoingWebhooks.calls).to.have.length(1)
    const firstCall = slackMock.outgoingWebhooks.calls[0]
    expect(firstCall.params.text).to.equal('GO CUBS')
  })
```

### RTM

```js
return slackMock.rtm.send({token: 'abc123', type: 'message', channel: 'mockChannel', user: 'usr', text: 'hello'})
  .then(delay(50))
  .then(() => {
    expect(slackMock.rtm.calls).to.have.length(1)
    expect(slackMock.rtm.calls[0].message.text).to.equal('GO CUBS')
  })
```

### Slash Commands

```js
const payload = {...}

return slackMock.slashCommands.send('http://localhost:9000/slash', payload)
  .then(delay(75))
  .then(() => {
    expect(slackMock.slashCommands.calls).to.have.length(2)

    const responseUrlCall = _.find(slackMock.slashCommands.calls, {type: 'response_url'})
    expect(responseUrlCall.params.text).to.equal('GO CUBS')
    expect(responseUrlCall.params.response_type).to.equal('ephemeral')
  })
```


### OAuth (Web + RTM API)

```js
const botToken = 'xoxb-XXXXXXXXXXXX-TTTTTTTTTTTTTT'

slackMock.web.addResponse({
  url: 'https://slack.com/api/oauth.access',
  statusCode: 200,
  body: {
    access_token: 'xoxp-XXXXXXXX-XXXXXXXX-XXXXX',
    scope: 'incoming-webhook,commands,bot',
    team_name: 'mockTeam',
    team_id: 'Tmock',
    bot: {
      bot_user_id: 'Bmock',
      bot_access_token: botToken
    }
  }
})

slackMock.web.addResponse({
  url: 'https://slack.com/api/rtm.start',
  statusCode: 200,
  body: {
    ok: true,
    self: {
      name: 'mockSelf',
      id: 'Bmock'
    },
    team: {
      name: 'mockTeam',
      id: 'Tmock'
    }
  }
})

request({
  method: 'POST',
  uri: 'http://localhost:9000/oauth',
  qs: {
    code: 'abc123'
  }
}, (err) => {
  if (err) {
    return console.log(err)
  }

  return delay(250) // wait for oauth flow to complete, rtm to be established
    .then(() => {
      return slackMock.rtm.send(botToken, {type: 'message', channel: 'mockChannel', user: 'usr', text: 'hello'})
    })
    .then(delay(20))
    .then(() => {
      expect(slackMock.rtm.calls).to.have.length(1)
      expect(slackMock.rtm.calls[0].message.text).to.equal('GO CUBS')
    })
    .then(() => done(), (e) => done(e))
})
```


## API Conventions

Slack Mock will intercept all requests to `https://slack.com` and `https://hooks.slack.com`. There's no need to change any URLs in your bot.

Here are the method conventions. Not every API wrapper supports each of these methods, see the [API docs](#api) below:
- `addResponse` will add the next response returned. You can call mutlitple times to queue responses. If you set a `url` option, then the response will only be returned for that url. URL specific responses take precedence over unspecified responses
- `calls` will be in order received and always contain params, headers, and url. Params contain both query params and body properties.
- `reset` will always clear calls and any queued responses you have.
- `send` will always send *from* Slack *to* your bot/app. Send will always return a promise for an easy way to build in delays.

There is also a top level `reset` convenience method that will call reset on each API wrapper.

Slack mock will respond to all requests with a 200 OK unless a custom response has been queued. For web requests, a the default body will be `{ok: true}`.

## RTM Conventions

The RTM mocker creates a websocket server to intercept RTM websocket calls. This means unlike the other API mocks there are some truly asynchronous methods in the RTM mocker: `send` and `stopServer`. Both of these methods return promises that can be resolved or rejected.

An RTM server will automatically be created when you call `https://slack.com/api/rtm.start` and will use the `token` parameter you pass as a unique identifier for this server. You will receive a URL in the response body for that RTM connection.

You can start and stop the RTM server using the same access token. These methods provide a good way to test reconnection attempts by your bot as well as let you bootstrap and clean up after your tests. While you can start an RTM server explicitly in your tests, there is no need to do this if you call the `rtm.start` API method, as this will create a server for you.

## API

### `require('slack-mock')`: `function(config)`

The exported function used to start the Slack Mock server. Returns an instance of the server.

Slack Mock is a singleton so can only be configured once per process. Subsequent calls to slackMock() will return
the same instance.

Config options are: 
  - `rtmPort` (number, optional) The port number the RTM websocket server will be started on. Defaults to 9001.
  - `logLevel` (String, optional) The log level to use. One of `error`, `warn`, `info`, `verbose`, `debug`, or `silly`. Defaults to `info`.

---

### `instance`

The configured instance of the Slack Mock `slackMock.instance` object. This is the same object returned from `require('slack-mock')(config)`.

---

### `instance.events` (Events API)

The `events` object mocks sending payloads from the Slack Events API to your Slack App.

- `send`: `function(targetUrl, body)` Sends an HTTP request from the Events API to your Slack App target URL.
Returns an immediately resolved Promise for easy chaining.

- `reset`: `function()` Empties the `events.calls` array.

- `calls`: `Array` An array of payloads received your from Slack app in response to an Events API POST.
  - `url` The url of the call that was intercepted.
  - `params` The response body as an Object.
  - `headers` The headers of the intercepted response as an Object.
  - `statusCode` The status code of the intercepted response. Only captured for immediate responses, not when using the `response_url`.

---

### `instance.incomingWebhooks` (Incoming Webhooks)

The `incomingWebhooks` object mocks receiving payloads from you Slack App to all Incoming Webhooks at `https://hooks.slack.com/`.

- `addResponse`: `function(opts)` Queues a response payload that Slack Mock will use to respond upon
receiving a post to a registered endpoint. This method can be called multiple times. Responses
will be used in a FIFO order. Options are: 
  - `url` (String, optional) The Incoming Webhook URL your app will be POSTing to.
  - `statusCode` (Number, optional) The HTTP status code to reply with. Defaults to 200. 
  - `body` (Object, optional) The response body to reply with. Defaults to `OK`.
  - `headers` (Object, optional) The HTTP headers to reply with. Defaults to `{}`.

- `reset`: `function()` Empties the `incomingWebhooks.calls` array and clears any queued responses.

- `calls`: `Array` An array of payloads received your from Slack app to an Incoming Webhook url.
  - `url` The url of the call that was intercepted.
  - `params` The POST body merged with any query string parameters captured from the intercepted request as an Object.
  - `headers` The headers of the intercepted request as an Object.

---

### `instance.interactiveButtons` (Interactive Buttons)

The `interactiveButtons` object mocks sending and receiving payloads from Slack interactive buttons to your Slack App.

- `send`: `function(targetUrl, body)` Sends an HTTP request from a Slack interactive button to your Slack App target URL.
The body will include a `response_url` parameter. Returns an immediately resolved Promise for easy chaining.

- `addResponse`: `function(opts)` Queues a response payload that Slack Mock will use to respond upon
receiving a post to a registered endpoint. This method can be called multiple times. Responses
will be used in a FIFO order. Options are: 
  - `url` (String, optional) The Incoming Webhook URL your app will be POSTing to.
  - `statusCode` (Number, optional) The HTTP status code to reply with. Defaults to 200. 
  - `body` (Object, optional) The response body to reply with. Defaults to `OK`
  - `headers` (Object, optional) The HTTP headers to reply with. Defaults to `{}`

- `reset`: `function()` Empties the `interactiveButtons.calls` array and clears any queued responses.

- `calls`: `Array` An array of payloads received your from Slack app in response to an Slack interactive button POST.
This includes both responses to the original Slack interactive button request and requests to the `response_url`.
  - `url` The url of the call that was intercepted. For type `response`, this will be the endpoint in your Slack app used in the call to 
  `interactiveButtons.send`, for type `response_url` this will be the `response_url` from the payload sent to your Slack app.
  - `params` The POST body merged with any query string parameters captured from the intercepted request as an Object.
  - `headers` The headers of the intercepted request as an Object.
  - `statusCode` The status code of the intercepted response. Only captured for immediate responses, not when using the `response_url`.
  - `type` Either `response` or `response_url`. Indicates how the call was intercepted.

---

### `instance.outgoingingWebhooks` (Outgoing Webhooks)

The `outgoingingWebhooks` object mocks sending and receiving payloads from Slack Outgoing Webhooks to your Slack App.

- `send`: `function(targetUrl, body)` Sends an HTTP request from an Outgoing Webhook to your Slack App target URL.
Returns an immediately resolved Promise for easy chaining.

- `reset`: `function()` Empties the `outgoingingWebhooks.calls` array.

- `calls`: `Array` An array of payloads received your from Slack app in response to an Outgoing Webhook POST.
  - `url` The url of the call that was intercepted.
  - `params` The response body as an Object.
  - `headers` The headers of the intercepted request as an Object.
  - `statusCode` The status code of the intercepted response.

---

### `instance.rtm` (RTM)

The `rtm` object mocks sending and receiving payloads from the Slack RTM API.

- `clients`: `Array` An array of websocket clients connected to the mock RTM server. Ordered by connection time.

- `send`: `function(token, message)` Returns a promise. Sends a message from Slack to the bot that connected using the 
passed authentication token.

- `reset`: `function()` Clears the `rtm.calls` array. Reset will not stop the RTM servers or close any connections. To close the RTM connection to your bot, use the `stopServer` method.

- `calls`: `Array` An array of payloads received by the RTM API from your Slack app.
  - `message` The message that was received by the RTM API as an Object.
  - `token` The token used in this message. This is the same token in your `message` payload. It can be used to call `startServer` and `stopServer`.
  - `rawMessage` The original String message received by the RTM API. Good for troubleshooting.
  
- `startServer`: `function(token)` Given the access token your bot will pass in messages, will start a web socket server. A web socket server will automatically be created for you when you call `https://slack.com/api/rtm.start` using the token you pass in the request.

- `stopServer`: `function(token)` Returns a promise. Given the access token your bot has passed in messages, will close the associated websocket server. This is handy for testing reconnection strategies by stopping the server, thus forcing a disconnect from your bot, then starting the server. It can also be used to clean up after a series of tests. 

---

### `instance.slashCommands` (Slash Commands)

The `slashCommands` object mocks sending and receiving payloads from a Slack Slash Command to your Slack App.

- `send`: `function(targetUrl, body)` Sends an HTTP request from a Slash Command to your Slack App target URL.
The body will include a `response_url` parameter Returns an immediately resolved Promise for easy chaining.

- `addResponse`: `function(opts)` Queues a response payload that Slack Mock will use to respond upon
receiving a post to a registered endpoint. This method can be called multiple times. Responses
will be used in a FIFO order. Options are: 
  - `url` (String, optional) The Incoming Webhook URL your app will be POSTing to.
  - `statusCode` (Number, optional) The HTTP status code to reply with. Defaults to 200. 
  - `body` (Object, optional) The response body to reply with. Defaults to `OK`.
  - `headers` (Object, optional) The HTTP headers to reply with. Defaults to `{}`.

- `reset`: `function()` Empties the `slashCommands.calls` array and any queued responses.

- `calls`: `Array` An array of payloads received your from Slack app in response to an Slash Command POST.
This includes both responses to the original Slash Command request and requests to the `response_url`.
  - `url` The url of the call that was intercepted.
  - `params` The POST body merged with any query string parameters captured from the intercepted request as an Object OR
  the response body, depending on whether this was a response or a new request using `response_url`.
  - `headers` The headers of the intercepted request as an Object.
  - `statusCode` The status code of the intercepted response. Only captured for immediate responses, not for using the `response_url`.
  - `type` Either `response` or `response_url`. Indicates how the call was intercepted.

---

### `instance.web` (Web API)

The `web` object receives requests to the Slack Web API and responds with mocked responses.

This mock can be used both for the Web API and the OAuth endpoint (`https://slack.com/oauth/authorize`). 
It supports both GET and POST requests to all endpoints.

The `https://slack.com/api/rtm.start` call requires a `token` parameter either as a query parameter or in the POST body. This will be used
to create an RTM server. See the [RTM docs](#instancertm-rtm) for more information.

- `addResponse`: `function(opts)` Queues a response payload that Slack Mock will use to respond upon
receiving a request to a Web API endpoint. Endpoints without a custom response will return 200 `{ok: true}`.
A `url` parameter will be added to all responses from the `https://slack.com/api/rtm.start` method if the body
contains `ok: true`. 

  This method can be called multiple times per endpoint. Responses will be used in a FIFO order. Options are: 
  - `url` (String, optional) Web API URL your app will be POSTing to.
  - `statusCode` (Number, optional) The HTTP status code to reply with. Defaults to 200. 
  - `body` (Object, optional) The response body to reply with. Defaults to `{ok: true}`
  - `headers` (Object, optional) The HTTP headers to reply with. Defaults to `{}`

- `reset`: `function()` Empties the `web.calls` array and clears any queued responses.

- `calls`: `Array` An array of payloads received your from Slack app to a Web API endpoint.
Each call will contain:
  - `url` The url of the call that was intercepted.
  - `params` The POST body merged with any query string parameters captured from the intercepted request as an Object.
  - `headers` The headers of the intercepted request as an Object.

---

### `instance.reset`: `function()`

Resets all mocks. A convenience method for calling reset on individual API mocks.


