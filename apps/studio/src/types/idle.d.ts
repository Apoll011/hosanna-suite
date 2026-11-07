// idle.d.ts
interface IdleDeadline {
  readonly didTimeout: boolean;
  timeRemaining(): DOMHighResTimeStamp;
}

interface IdleRequestOptions {
  timeout?: number;
}

type IdleCallbackToken = number;

interface Window {
  requestIdleCallback(
    callback: (deadline: IdleDeadline) => void,
    options?: IdleRequestOptions,
  ): IdleCallbackToken;
  cancelIdleCallback(token: IdleCallbackToken): void;
}
