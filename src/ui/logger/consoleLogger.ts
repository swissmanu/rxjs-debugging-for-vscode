import { injectable } from 'inversify';
import { ILogger } from '.';

@injectable()
export default class ConsoleLogger implements ILogger {
  log(message: string): void {
    console.log(message);
  }
}
