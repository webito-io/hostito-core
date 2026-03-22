import {
  Domain,
  Organization,
  Product,
  Provisioner,
  Server,
  Service,
  ServiceStatus,
  User,
} from '@prisma/client';

export interface ProvisionResult {
  status: 'success' | 'failed';
  username?: string;
  password?: string;
  message?: string;
  data?: Record<string, unknown>;
  serviceStatus?: ServiceStatus;
}

export type ExtendedService = Service & {
  domain?: Domain | null;
  product?: Product | null;
  organization?: (Organization & { users: User[] }) | null;
};

export interface ProvisioningArgs {
  service: ExtendedService;
  server: Server;
  provisioner: Provisioner;
  [key: string]: unknown;
}

export interface ProvisionerProvider {
  create(args: ProvisioningArgs): Promise<ProvisionResult>;
  suspend?(args: ProvisioningArgs): Promise<ProvisionResult>;
  unsuspend?(args: ProvisioningArgs): Promise<ProvisionResult>;
  terminate?(args: ProvisioningArgs): Promise<ProvisionResult>;
  pkg?(args: ProvisioningArgs): Promise<ProvisionResult>;
  passwd?(args: ProvisioningArgs): Promise<ProvisionResult>;
  renew?(args: ProvisioningArgs): Promise<ProvisionResult>;
  testConnection?(server: Server, provisioner: Provisioner): Promise<boolean>;
}

export enum ProvisionerType {
  CPANEL = 'cpanel',
  DIRECTADMIN = 'directadmin',
}
