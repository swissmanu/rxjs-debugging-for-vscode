export const enum ObservableEventType {
  Completed = 'Completed',
  Error = 'Error',
  Next = 'Next',
  Subscribe = 'Subscribe',
  Unsubscribe = 'Unsubscribe',
}

export interface IObservableEventData {
  [ObservableEventType.Completed]: void;
  [ObservableEventType.Error]: { error: string };
  [ObservableEventType.Next]: { value: string };
  [ObservableEventType.Subscribe]: void;
  [ObservableEventType.Unsubscribe]: void;
}
