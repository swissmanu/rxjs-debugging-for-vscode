import { Uri } from 'vscode';
import { IResourceProvider } from '../../resources';
import { EnabledState } from './getEnabledState';

export default function getIconForEnabledState(resourceProvider: IResourceProvider, enabledState: EnabledState): Uri {
  switch (enabledState) {
    case 'all':
      return resourceProvider.uriForResource('rxjs-operator-log-point-all-enabled.svg');
    case 'some':
      return resourceProvider.uriForResource('rxjs-operator-log-point-some-enabled.svg');
    case 'none':
      return resourceProvider.uriForResource('rxjs-operator-log-point-disabled.svg');
  }
}
