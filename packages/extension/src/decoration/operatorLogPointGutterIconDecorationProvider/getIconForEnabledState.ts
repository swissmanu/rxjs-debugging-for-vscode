import { Uri } from 'vscode';
import { IResourceProvider } from '../../resources';
import { EnabledState } from './getEnabledState';

export default function getIconForEnabledState(resourceProvider: IResourceProvider, enabledState: EnabledState): Uri {
  switch (enabledState) {
    case 'all':
      return resourceProvider.uriForResource('debug-breakpoint-log.svg');
    case 'some':
      return resourceProvider.uriForResource('debug-breakpoint-log.svg');
    case 'none':
      return resourceProvider.uriForResource('debug-breakpoint-log-unverified.svg');
  }
}
