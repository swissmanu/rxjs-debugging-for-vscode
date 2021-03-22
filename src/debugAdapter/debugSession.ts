import * as debugAdapter from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import { RxJSDebugConfigurationRequestArguments } from '../shared/types';

export class DebugSession extends debugAdapter.DebugSession {
  constructor() {
    super();
  }

  initializeRequest(
    response: DebugProtocol.InitializeResponse,
    args: DebugProtocol.InitializeRequestArguments
  ): void {
    // This default debug adapter does not support conditional breakpoints.
    response.body!.supportsConditionalBreakpoints = false;

    // This default debug adapter does not support hit conditional breakpoints.
    response.body!.supportsHitConditionalBreakpoints = false;

    // This default debug adapter does not support function breakpoints.
    response.body!.supportsFunctionBreakpoints = false;

    // This default debug adapter implements the 'configurationDone' request.
    response.body!.supportsConfigurationDoneRequest = true;

    // This default debug adapter does not support hovers based on the 'evaluate' request.
    response.body!.supportsEvaluateForHovers = false;

    // This default debug adapter does not support the 'stepBack' request.
    response.body!.supportsStepBack = true;

    // This default debug adapter does not support the 'setVariable' request.
    response.body!.supportsSetVariable = false;

    // This default debug adapter does not support the 'restartFrame' request.
    response.body!.supportsRestartFrame = false;

    // This default debug adapter does not support the 'stepInTargets' request.
    response.body!.supportsStepInTargetsRequest = false;

    // This default debug adapter does not support the 'gotoTargets' request.
    response.body!.supportsGotoTargetsRequest = false;

    // This default debug adapter does not support the 'completions' request.
    response.body!.supportsCompletionsRequest = false;

    // This default debug adapter does not support the 'restart' request.
    response.body!.supportsRestartRequest = false;

    // This default debug adapter does not support the 'exceptionOptions' attribute on the 'setExceptionBreakpoints' request.
    response.body!.supportsExceptionOptions = false;

    // This default debug adapter does not support the 'format' attribute on the 'variables', 'evaluate', and 'stackTrace' request.
    response.body!.supportsValueFormattingOptions = false;

    // This debug adapter does not support the 'exceptionInfo' request.
    response.body!.supportsExceptionInfoRequest = false;

    // This debug adapter does not support the 'TerminateDebuggee' attribute on the 'disconnect' request.
    response.body!.supportTerminateDebuggee = false;

    // This debug adapter does not support delayed loading of stack frames.
    response.body!.supportsDelayedStackTraceLoading = false;

    // This debug adapter does not support the 'loadedSources' request.
    response.body!.supportsLoadedSourcesRequest = false;

    // This debug adapter does not support the 'logMessage' attribute of the SourceBreakpoint.
    response.body!.supportsLogPoints = true;

    // This debug adapter does not support the 'terminateThreads' request.
    response.body!.supportsTerminateThreadsRequest = false;

    // This debug adapter does not support the 'setExpression' request.
    response.body!.supportsSetExpression = false;

    // This debug adapter does not support the 'terminate' request.
    response.body!.supportsTerminateRequest = false;

    // This debug adapter does not support data breakpoints.
    response.body!.supportsDataBreakpoints = true;

    /** This debug adapter does not support the 'readMemory' request. */
    response.body!.supportsReadMemoryRequest = false;

    /** The debug adapter does not support the 'disassemble' request. */
    response.body!.supportsDisassembleRequest = false;

    /** The debug adapter does not support the 'cancel' request. */
    response.body!.supportsCancelRequest = false;

    /** The debug adapter does not support the 'breakpointLocations' request. */
    response.body!.supportsBreakpointLocationsRequest = false;

    /** The debug adapter does not support the 'clipboard' context value in the 'evaluate' request. */
    response.body!.supportsClipboardContext = false;

    /** The debug adapter does not support stepping granularities for the stepping requests. */
    response.body!.supportsSteppingGranularity = false;

    /** The debug adapter does not support the 'setInstructionBreakpoints' request. */
    response.body!.supportsInstructionBreakpoints = false;

    /** The debug adapter does not support 'filterOptions' on the 'setExceptionBreakpoints' request. */
    response.body!.supportsExceptionFilterOptions = false;

    this.sendResponse(response);
  }

  protected attachRequest(
    _response: DebugProtocol.AttachResponse,
    {
      cdpProxy,
    }: DebugProtocol.AttachRequestArguments &
      Partial<RxJSDebugConfigurationRequestArguments>
  ): void {
    if (cdpProxy) {
      // Connect to CDP Proxy
      console.log('Connect to', cdpProxy);
    }
  }
}
