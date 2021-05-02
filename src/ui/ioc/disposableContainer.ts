import { Container, interfaces } from 'inversify';
import { IDisposable } from '../../shared/types';
import { ILogger } from '../logger';

export interface IDisposableContainer extends interfaces.Container, IDisposable {}

export default class DisposableContainer extends Container implements IDisposableContainer {
  private readonly disposables: IDisposable[] = [];

  constructor(readonly name: string, options?: interfaces.ContainerOptions | undefined) {
    super(options);
  }

  trackDisposableBinding = <T extends IDisposable>(_context: interfaces.Context, injectable: T): T => {
    this.disposables.push(injectable);
    return injectable;
  };

  dispose(): void {
    this.get<ILogger>(ILogger).info('IoC', `Dispose IoC Container "${this.name}"`);

    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.unbindAll();
  }
}
