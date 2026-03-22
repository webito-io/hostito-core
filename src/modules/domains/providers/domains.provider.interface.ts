import { Domain, Organization, User } from '@prisma/client';

export interface DomainProvisionResult {
  status: 'success' | 'failed';
  message?: string;
  data?: any;
}

export interface DomainProvisioningArgs {
  domain: Domain;
  organization?: Organization;
  user?: User;
  [key: string]: any;
}

export interface DomainProvider {
  register(args: DomainProvisioningArgs): Promise<DomainProvisionResult>;
  renew(args: DomainProvisioningArgs): Promise<DomainProvisionResult>;
  lock(args: DomainProvisioningArgs): Promise<DomainProvisionResult>;
  unlock(args: DomainProvisioningArgs): Promise<DomainProvisionResult>;
  code(args: DomainProvisioningArgs): Promise<DomainProvisionResult>;
  nameservers(args: DomainProvisioningArgs): Promise<DomainProvisionResult>;
  privacy(args: DomainProvisioningArgs): Promise<DomainProvisionResult>;
  transfer(args: DomainProvisioningArgs): Promise<DomainProvisionResult>;
  availability(domainName: string): Promise<boolean>;
}

export enum DomainProviderType {
  SPACESHIP = 'spaceship',
  DYNADOT = 'dynadot',
}
