declare module "slack-mock" {
  interface INSTANCE {
    events: EVENT,
    incomingWebhooks: INCOMINGWEBHOOK,
    interactiveButtons: INTERACTIVEBUTTON,
    outgoingWebhooks: OUTGOINGWEBHOOK,
    rtm?: RTM,
    slashCommands: SLASHCOMMAND,
    web: WEB,
    reset(): void
  }

  interface EVENT {
    send(target: string, data: DATA): Promise<any>,
    reset(): void,
    calls: any[]
  }

  interface INCOMINGWEBHOOK {
    addResponse(opts: OPTS): void,
    reset(): void,
    calls: any[]
  }

  interface INTERACTIVEBUTTON {
    addResponse(opts: OPTS): void,
    send(target: string, data: DATA): Promise<any>,
    reset(): void,
    calls: any[]
  }

  interface OUTGOINGWEBHOOK {
    send(targetUrl: string, outgoingBody: DATA): Promise<any>,
    reset(): void,
    calls: any[]
  }

  interface RTM {
    send(token: string, message: MESSAGE): Promise<any>,
    reset(): void,
    calls: any[],
    startServer(token: string): void,
    stopServer(token: string): Promise<any>
  }

  interface SLASHCOMMAND {
    addResponse(opts: OPTS): void,
    send(target: string, data: DATA): Promise<any>,
    reset(): void,
    calls: any[]
  }

  interface WEB {
    addResponse(opts: OPTS): void,
    reset(): void,
    calls: any[]
  }

  interface DATA {
    token?: string,
    team_id?: string,
    team_domain?: string,
    channel_id?: string,
    channel_name?: string,
    user_id?: string,
    user_name?: string,
    command?: string,
    text?: string
  }

  interface OPTS  {
    url?: string,
    statusCode?: number,
    status?: number,
    body?: any,
    headers?: any
  }

  interface MESSAGE {
    type: string,
    channel: string,
    user: string,
    text: string
  }

  function init(): INSTANCE;
  export = init;
}
