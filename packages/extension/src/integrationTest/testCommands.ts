export const enum TestCommands {
  GetDecorationSetterRecording = 'rxjs-debugging-for-vs-code.command.test.getDecorationSetterRecording',
}

export interface ITestCommandTypes {
  [TestCommands.GetDecorationSetterRecording]: (
    file: string,
    decorationType: 'liveLog' | 'logPoints' | 'logPointGutterIcon'
  ) => ReadonlyArray<{
    decorationType: string;
    ranges: ReadonlyArray<string>;
    options: ReadonlyArray<string>;
  }>;
}
