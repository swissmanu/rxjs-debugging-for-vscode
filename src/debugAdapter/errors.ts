import { DebugProtocol } from 'vscode-debugprotocol';

export const enum ErrorCode {
  // Initialization:
  COULD_NOT_ESTABLISH_AND_INITIALIZE_CDP = 1000,
  NO_CDP_CONNECTION_INFORMATION = 1001,
}

const message: Record<ErrorCode, string> = {
  [ErrorCode.COULD_NOT_ESTABLISH_AND_INITIALIZE_CDP]:
    'Could not establish and initialize CDP connection.',
  [ErrorCode.NO_CDP_CONNECTION_INFORMATION]:
    'Did not get valid CDP connection information.',
};

export function getErrorMessage(errorCode: ErrorCode): DebugProtocol.Message {
  return {
    id: errorCode,
    format: message[errorCode],
  };
}
