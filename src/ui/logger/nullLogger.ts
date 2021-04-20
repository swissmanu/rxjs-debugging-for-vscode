import { injectable } from 'inversify';
import { ILogger } from '.';

@injectable()
export default class NullLogger implements ILogger {
  log(): void {}
}
