import { Injectable, Logger } from '@nestjs/common';
import { Provisioner, Server } from '@prisma/client';
import {
  ProvisionResult,
  ProvisionerProvider,
  ProvisioningArgs,
} from '../provisioners.provider.interface';

@Injectable()
export class DirectadminProvider implements ProvisionerProvider {
  private readonly logger = new Logger(DirectadminProvider.name);

  async create(args: ProvisioningArgs): Promise<ProvisionResult> {
    this.logger.log(
      `Creating DirectAdmin account for service #${args.service.id} on server #${args.server.id}`,
    );
    return Promise.resolve({ status: 'success', message: 'Account created' });
  }

  async suspend(args: ProvisioningArgs): Promise<ProvisionResult> {
    this.logger.log(
      `Suspending DirectAdmin account for service #${args.service.id}`,
    );
    return Promise.resolve({ status: 'success', message: 'Account suspended' });
  }

  async unsuspend(args: ProvisioningArgs): Promise<ProvisionResult> {
    this.logger.log(
      `Unsuspending DirectAdmin account for service #${args.service.id}`,
    );
    return Promise.resolve({
      status: 'success',
      message: 'Account unsuspended',
    });
  }

  async terminate(args: ProvisioningArgs): Promise<ProvisionResult> {
    this.logger.log(
      `Terminating DirectAdmin account for service #${args.service.id}`,
    );
    return Promise.resolve({
      status: 'success',
      message: 'Account terminated',
    });
  }

  async pkg(args: ProvisioningArgs): Promise<ProvisionResult> {
    this.logger.log(
      `Changing DirectAdmin package for service #${args.service.id}`,
    );
    return Promise.resolve({ status: 'success', message: 'Package changed' });
  }

  async passwd(args: ProvisioningArgs): Promise<ProvisionResult> {
    this.logger.log(
      `Changing DirectAdmin password for service #${args.service.id}`,
    );
    return Promise.resolve({ status: 'success', message: 'Password changed' });
  }

  async renew(_args: ProvisioningArgs): Promise<ProvisionResult> {
    return Promise.resolve({ status: 'success', message: 'Account renewed' });
  }

  async testConnection(
    server: Server,
    _provisioner: Provisioner,
  ): Promise<boolean> {
    this.logger.log(`Testing DirectAdmin connection to server #${server.id}`);
    // TODO: Implement DirectAdmin API call here
    return Promise.resolve(true);
  }
}
