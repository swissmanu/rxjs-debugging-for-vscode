import type {
  CDP_BINDING_NAME_READY,
  CDP_BINDING_NAME_SEND_TELEMETRY,
  RUNTIME_PROGRAM_ENV_VAR,
  RUNTIME_TELEMETRY_BRIDGE,
} from '../../shared/telemetry/consts';
import type TelemetryBridge from '../telemetryBridge';

declare global {
  namespace NodeJS {
    interface Global {
      [CDP_BINDING_NAME_READY]: (x: string) => void | undefined;
      [CDP_BINDING_NAME_SEND_TELEMETRY]: (msg: string) => void | undefined;
      [RUNTIME_TELEMETRY_BRIDGE]: TelemetryBridge | undefined;
      [RUNTIME_PROGRAM_ENV_VAR]: string | undefined;
    }
  }
}
