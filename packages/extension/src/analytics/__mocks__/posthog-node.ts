let createdInstance: Posthog | null = null;

export function resetPosthogMock(): void {
  createdInstance = null;
}

export function getPosthogMockInstance(): Posthog | null {
  return createdInstance;
}

export default class Posthog {
  constructor(readonly projectApiKey: string, readonly options: Record<string, unknown>) {
    if (createdInstance !== null) {
      throw new Error('Instance already created! Consider calling resetMock()');
    }
    createdInstance = this;
  }

  readonly identify = jest.fn();

  readonly capture = jest.fn();
}
