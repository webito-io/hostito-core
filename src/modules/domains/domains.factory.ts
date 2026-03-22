import { BadRequestException, Injectable } from '@nestjs/common';
import { SpaceshipProvider } from './providers/spaceship/spaceship.provider';
import {
  DomainProvider,
  DomainProviderType,
} from './providers/domains.provider.interface';

@Injectable()
export class DomainsFactory {
  constructor(private readonly spaceship: SpaceshipProvider) {}

  get(type: DomainProviderType): DomainProvider {
    switch (type) {
      case DomainProviderType.SPACESHIP:
        return this.spaceship;
      default:
        throw new BadRequestException(`Domain provider ${type} not supported`);
    }
  }
}
