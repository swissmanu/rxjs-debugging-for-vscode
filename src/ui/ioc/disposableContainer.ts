import { Container, interfaces } from 'inversify';
import { IDisposable } from '../../shared/types';

export interface IDisposableContainer extends interfaces.Container, IDisposable {}

export default class DisposableContainer extends Container implements IDisposableContainer {
  private readonly disposables: IDisposable[] = [];

  trackDisposableBinding = <T extends IDisposable>(_context: interfaces.Context, injectable: T): T => {
    this.disposables.push(injectable);
    return injectable;
  };

  dispose(): void {
    for (const disposable of this.disposables) {
      disposable.dispose();
    }
    this.unbindAll();
  }
}
