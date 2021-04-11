import * as debugAdapter from 'vscode-debugadapter';
import { DebugProtocol } from 'vscode-debugprotocol';
import { telemetryCDPBindingName } from '../shared/telemetry';
import { RxJSDebugConfigurationRequestArguments } from '../shared/types';
import CDPClient from './cdpClient';
import { ErrorCode, getErrorMessage } from './errors';

export class DebugSession extends debugAdapter.DebugSession {
  private cdpClient: CDPClient | undefined;

  constructor() {
    super();
  }

  protected initializeRequest(
    response: DebugProtocol.InitializeResponse,
    _args: DebugProtocol.InitializeRequestArguments
  ): void {
    // response.body!.supportsConfigurationDoneRequest = true;
    // response.body!.supportsFunctionBreakpoints = true;
    // response.body!.supportsConditionalBreakpoints = true;
    // response.body!.supportsHitConditionalBreakpoints = true;
    // response.body!.supportsEvaluateForHovers = true;
    // exceptionBreakpointFilters?: ExceptionBreakpointsFilter[];
    // response.body!.supportsStepBack = true;
    // response.body!.supportsSetVariable = true;
    // response.body!.supportsRestartFrame = true;
    // response.body!.supportsGotoTargetsRequest = true;
    // response.body!.supportsStepInTargetsRequest = true;
    // response.body!.supportsCompletionsRequest = true;
    // completionTriggerCharacters?: string[];
    // response.body!.supportsModulesRequest = true;
    // additionalModuleColumns?: ColumnDescriptor[];
    // supportedChecksumAlgorithms?: ChecksumAlgorithm[];
    // response.body!.supportsRestartRequest = true;
    // response.body!.supportsExceptionOptions = true;
    // response.body!.supportsValueFormattingOptions = true;
    // response.body!.supportsExceptionInfoRequest = true;
    // response.body!.supportTerminateDebuggee = true;
    // response.body!.supportsDelayedStackTraceLoading = true;
    // response.body!.supportsLoadedSourcesRequest = true;
    response.body!.supportsLogPoints = true;
    // response.body!.supportsTerminateThreadsRequest = true;
    // response.body!.supportsSetExpression = true;
    // response.body!.supportsTerminateRequest = true;
    // response.body!.supportsDataBreakpoints = true;
    // response.body!.supportsReadMemoryRequest = true;
    // response.body!.supportsDisassembleRequest = true;
    // response.body!.supportsCancelRequest = true;
    response.body!.supportsBreakpointLocationsRequest = true;
    // response.body!.supportsClipboardContext = true;
    // response.body!.supportsSteppingGranularity = true;
    // response.body!.supportsInstructionBreakpoints = true;
    // response.body!.supportsExceptionFilterOptions = true;

    this.sendResponse(response);
  }

  protected async attachRequest(
    response: DebugProtocol.AttachResponse,
    {
      cdpProxy,
    }: DebugProtocol.AttachRequestArguments &
      Partial<RxJSDebugConfigurationRequestArguments>
  ): Promise<void> {
    if (!cdpProxy) {
      return this.sendErrorResponse(
        response,
        getErrorMessage(ErrorCode.NO_CDP_CONNECTION_INFORMATION)
      );
    }

    try {
      this.cdpClient = new CDPClient(cdpProxy.host, cdpProxy.port);

      await this.cdpClient.connect();
      await Promise.all([
        await this.cdpClient.request('Runtime', 'enable'),
        await this.cdpClient.request('Runtime', 'addBinding', {
          name: telemetryCDPBindingName,
        }),
        await this.cdpClient.subscribe('Runtime', 'bindingCalled', (x) => {
          console.log(x);
        }),
      ]);

      this.sendEvent({ event: 'initialized', type: 'event', seq: -1 });
    } catch (e) {
      this.cdpClient?.dispose();
      this.sendErrorResponse(
        response,
        getErrorMessage(ErrorCode.COULD_NOT_ESTABLISH_AND_INITIALIZE_CDP)
      );
    }
  }

  // protected breakpointLocationsRequest(
  //   response: DebugProtocol.BreakpointLocationsResponse,
  //   args: DebugProtocol.BreakpointLocationsArguments,
  //   request?: DebugProtocol.Request
  // ): void {
  //   response.body = { breakpoints: [{ line: 7, column: 4 }] };
  //   this.sendResponse(response);
  // }

  // protected setBreakPointsRequest(
  //   response: DebugProtocol.SetBreakpointsResponse,
  //   args: DebugProtocol.SetBreakpointsArguments,
  //   request?: DebugProtocol.Request
  // ): void {
  //   console.log(args);
  // }
}
