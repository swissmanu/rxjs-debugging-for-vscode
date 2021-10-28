import { injectable } from 'inversify';
import CDPClient, { ICDPClient, ICDPClientAddress } from './cdpClient';

export const ICDPClientProvider = Symbol('CDPClientProvider');
export interface ICDPClientProvider {
  createCDPClient(address: ICDPClientAddress): ICDPClient;
}

@injectable()
export class DefaultCDPClientProvider implements ICDPClientProvider {
  createCDPClient({ host, port, path = '' }: ICDPClientAddress): ICDPClient {
    return new CDPClient(host, port, path);
  }
}
