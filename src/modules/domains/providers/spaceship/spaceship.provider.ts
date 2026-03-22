import { Injectable } from '@nestjs/common';
import {
  DomainProvisioningArgs,
  DomainProvisionResult,
  DomainProvider,
} from '../domains.provider.interface';

@Injectable()
export class SpaceshipProvider implements DomainProvider {
  async register(args: DomainProvisioningArgs): Promise<DomainProvisionResult> {
    return {
      status: 'success',
      message: `Domain ${args.domain.name} registered via Spaceship`,
    };
  }

  async renew(args: DomainProvisioningArgs): Promise<DomainProvisionResult> {
    return {
      status: 'success',
      message: `Domain ${args.domain.name} renewed via Spaceship`,
    };
  }

  async lock(args: DomainProvisioningArgs): Promise<DomainProvisionResult> {
    return {
      status: 'success',
      message: `Domain ${args.domain.name} locked via Spaceship`,
    };
  }

  async unlock(args: DomainProvisioningArgs): Promise<DomainProvisionResult> {
    return {
      status: 'success',
      message: `Domain ${args.domain.name} unlocked via Spaceship`,
    };
  }

  async code(args: DomainProvisioningArgs): Promise<DomainProvisionResult> {
    return {
      status: 'success',
      message: `Domain ${args.domain.name} code via Spaceship`,
    };
  }

  async nameservers(
    args: DomainProvisioningArgs,
  ): Promise<DomainProvisionResult> {
    return {
      status: 'success',
      message: `Domain ${args.domain.name} nameservers via Spaceship`,
    };
  }

  async privacy(args: DomainProvisioningArgs): Promise<DomainProvisionResult> {
    return {
      status: 'success',
      message: `Domain ${args.domain.name} privacy via Spaceship`,
    };
  }

  async transfer(args: DomainProvisioningArgs): Promise<DomainProvisionResult> {
    return {
      status: 'success',
      message: `Domain ${args.domain.name} transfer via Spaceship`,
    };
  }

  async availability(domainName: string): Promise<boolean> {
    return Math.random() > 0.5;
  }
}
