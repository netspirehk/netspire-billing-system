declare module 'resend' {
  export type ResendEmailSendResult = {
    data?: { id?: string } | null;
    error?: { message?: string } | null;
  };

  export class Resend {
    constructor(apiKey?: string);
    emails: {
      send(options: any): Promise<ResendEmailSendResult>;
    };
  }
}


