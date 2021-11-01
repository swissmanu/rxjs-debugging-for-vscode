export const enum TestCommands {
  GetDecorationSetterRecording = 'rxjs-debugging-for-vs-code.command.test.getDecorationSetterRecording',
}

export interface ITestCommandTypes {
  [TestCommands.GetDecorationSetterRecording]: () => string;
}
