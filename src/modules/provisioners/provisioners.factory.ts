import { BadRequestException, Injectable } from '@nestjs/common';
import { CpanelProvider } from './providers/cpanel/cpanel.provider';
import { DirectadminProvider } from './providers/directadmin/directadmin.provider';
import {
  ProvisionerProvider,
  ProvisionerType,
} from './providers/provisioners.provider.interface';

@Injectable()
export class ProvisionersFactory {
  constructor(
    private readonly cpanelProvider: CpanelProvider,
    private readonly directadminProvider: DirectadminProvider,
  ) {}

  get(provisionerName: ProvisionerType): ProvisionerProvider {
    switch (provisionerName) {
      case 'cpanel':
        return this.cpanelProvider;
      case 'directadmin':
        return this.directadminProvider;
      default:
        throw new BadRequestException(
          `Unknown provisioner: ${provisionerName}`,
        );
    }
  }
}
