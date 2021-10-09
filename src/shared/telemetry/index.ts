import { IObservableEventData, ObservableEventType } from './observableEvent';
import { IOperatorIdentifier } from './operatorIdentifier';

export const enum TelemetryEventType {
  OperatorLogPoint = 'OperatorLogPoint',
}

export type TelemetryEvent = OperatorLogPointTelemetryEvent;

export type OperatorLogPointTelemetryEvent =
  | IOperatorLogPointTelemetryEvent<ObservableEventType.Completed>
  | IOperatorLogPointTelemetryEvent<ObservableEventType.Error>
  | IOperatorLogPointTelemetryEvent<ObservableEventType.Next>
  | IOperatorLogPointTelemetryEvent<ObservableEventType.Subscribe>
  | IOperatorLogPointTelemetryEvent<ObservableEventType.Unsubscribe>;

interface IOperatorLogPointTelemetryEvent<O extends ObservableEventType> {
  type: TelemetryEventType.OperatorLogPoint;
  observableEvent: O;
  data: IObservableEventData[O];
  operator: IOperatorIdentifier;
}
