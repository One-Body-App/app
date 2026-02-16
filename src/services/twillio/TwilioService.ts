type TwilioChatClient = {
  on: (event: string, listener: () => void) => void;
  updateToken: (token: string) => Promise<void> | void;
  shutdown: () => void;
};

type TwilioClientFactory = {
  create: (token: string) => Promise<TwilioChatClient>;
};

const resolveTwilioFactory = (): TwilioClientFactory | null => {
  try {
    // Twilio chat is optional in this app build.
    // eslint-disable-next-line global-require
    return require('twilio-chat')?.Client ?? null;
  } catch (error) {
    return null;
  }
};

export default class TwilioService {
  static serviceInstance: TwilioService | null = null;

  static chatClient: TwilioChatClient | null = null;

  static getInstance() {
    if (!TwilioService.serviceInstance) {
      TwilioService.serviceInstance = new TwilioService();
    }
    return TwilioService.serviceInstance;
  }

  static async getChatClient(twilioToken?: string) {
    if (TwilioService.chatClient) {
      return TwilioService.chatClient;
    }

    if (!twilioToken) {
      throw new Error('Twilio token is null or undefined');
    }

    const factory = resolveTwilioFactory();
    if (!factory) {
      throw new Error('Twilio chat SDK is not installed');
    }

    TwilioService.chatClient = await factory.create(twilioToken);
    return TwilioService.chatClient;
  }

  static addTokenListener(getToken: () => Promise<string>) {
    if (!TwilioService.chatClient) {
      throw new Error('Twilio client is null or undefined');
    }
    TwilioService.chatClient.on('tokenAboutToExpire', () => {
      getToken().then((token) => TwilioService.chatClient?.updateToken(token));
    });

    TwilioService.chatClient.on('tokenExpired', () => {
      getToken().then((token) => TwilioService.chatClient?.updateToken(token));
    });
    return TwilioService.chatClient;
  }

  static clientShutdown() {
    TwilioService.chatClient?.shutdown();
    TwilioService.chatClient = null;
  }
}
