import { Position, Uri } from 'vscode';
import OperatorLogPoint from '.';

export const logPointFixtureA = new OperatorLogPoint(
  Uri.file('/foo.ts'),
  new Position(42, 84),
  {
    operatorIndex: 100,
    fileName: 'foo.ts',
    line: 101,
    character: 102,
  },
  'take'
);

export const logPointFixtureB = new OperatorLogPoint(
  Uri.file('/bar.ts'),
  new Position(128, 256),
  {
    operatorIndex: 201,
    fileName: 'bar.ts',
    line: 202,
    character: 203,
  },
  null,
  true
);
