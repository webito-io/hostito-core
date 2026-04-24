import { Injectable } from '@nestjs/common';
import { Provisioner, Server } from '@prisma/client';
import * as crypto from 'crypto';
import {
  ProvisionResult,
  ProvisionerProvider,
  ProvisioningArgs,
} from '../provisioners.provider.interface';

export type CpanelCredentials = {
  username: string;
  apiToken: string;
};

@Injectable()
export class CpanelProvider implements ProvisionerProvider {
  /**
   * Generate a cryptographically secure random password string.
   * Ensures at least one uppercase letter, one digit, and one special character.
   */
  private generateSecurePassword(length = 10): string {
    const upper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    const specials = '!@#$%^&*()-_=+[]{};:,.<>?';
    const allChars = upper.toLowerCase() + upper + digits;

    // Generate main random part
    const randomBytes = crypto.randomBytes(length);
    let passwordCore = '';
    for (let i = 0; i < length; i++) {
      passwordCore += allChars[randomBytes[i] % allChars.length];
    }

    // Append required complexity characters
    const byte = crypto.randomBytes(3);
    const upperChar = upper[byte[0] % upper.length];
    const digitChar = digits[byte[1] % digits.length];
    const specialChar = specials[byte[2] % specials.length];

    return passwordCore + upperChar + digitChar + specialChar;
  }

  private async request<T = unknown>(
    server: Server,
    endpoint: string,
    params: Record<string, string | number | undefined>,
  ): Promise<T> {
    const creds = server.credentials as CpanelCredentials;

    if (!creds.username || !creds.apiToken) {
      throw new Error(`Incomplete cPanel credentials for server #${server.id}`);
    }

    const url = new URL(
      `https://${server.hostname}:${server.port || 2087}/json-api/${endpoint}`,
    );
    url.searchParams.append('api.version', '1');

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) url.searchParams.append(key, String(value));
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: { Authorization: `whm ${creds.username}:${creds.apiToken}` },
    });

    if (!response.ok) throw new Error(`HTTP Error: ${response.statusText}`);

    const data = (await response.json()) as {
      metadata?: { result: number; reason: string };
    };
    if (data.metadata?.result === 0) throw new Error(data.metadata.reason);

    return data as T;
  }

  async create(args: ProvisioningArgs): Promise<ProvisionResult> {
    const { service, server } = args;
    const domain = service.domain?.name;
    let username = service.username;

    if (!username && domain) {
      username =
        domain
          .split('.')[0]
          .substring(0, 8)
          .replace(/[^a-zA-Z0-9]/g, '') + Math.floor(Math.random() * 100);
    }

    const password = service.password || this.generateSecurePassword(10);
    const plan =
      (service.product?.config as Record<string, unknown>)?.cpanel_package ||
      'default';
    const contactemail = service.organization?.users?.[0]?.email;

    if (!domain || !username || !password) {
      throw new Error('Missing domain, username or password');
    }

    const planStr = typeof plan === 'string' ? plan : JSON.stringify(plan);

    const data = await this.request<Record<string, unknown>>(
      server,
      'createacct',
      { username, domain, password, plan: planStr, contactemail },
    );
    return { status: 'success', username, password, data };
  }

  async suspend(args: ProvisioningArgs): Promise<ProvisionResult> {
    const { service, server } = args;
    if (!service.username) throw new Error('Missing username');
    const data = await this.request<Record<string, unknown>>(
      server,
      'suspendacct',
      { user: service.username, reason: 'Suspended by Hostito Billing' },
    );
    return { status: 'success', data };
  }

  async unsuspend(args: ProvisioningArgs): Promise<ProvisionResult> {
    const { service, server } = args;
    if (!service.username) throw new Error('Missing username');
    const data = await this.request<Record<string, unknown>>(
      server,
      'unsuspendacct',
      { user: service.username },
    );
    return { status: 'success', data };
  }

  async terminate(args: ProvisioningArgs): Promise<ProvisionResult> {
    const { service, server } = args;
    if (!service.username) throw new Error('Missing username');
    const data = await this.request<Record<string, unknown>>(
      server,
      'removeacct',
      { user: service.username },
    );
    return { status: 'success', data };
  }

  async pkg(args: ProvisioningArgs): Promise<ProvisionResult> {
    const { service, server, newPackage } = args;
    if (!service.username) throw new Error('Missing username');
    let pkgName = '';
    if (typeof newPackage === 'string') {
      pkgName = newPackage;
    } else if (newPackage && typeof newPackage === 'object') {
      const pkg = (newPackage as Record<string, unknown>)?.cpanel_package;
      pkgName = typeof pkg === 'string' ? pkg : JSON.stringify(newPackage);
    }
    const data = await this.request<Record<string, unknown>>(
      server,
      'changepackage',
      { user: service.username, pkg: pkgName },
    );
    return { status: 'success', data };
  }

  async passwd(args: ProvisioningArgs): Promise<ProvisionResult> {
    const { service, server, password } = args;
    if (!service.username) throw new Error('Missing username');
    const data = await this.request<Record<string, unknown>>(server, 'passwd', {
      user: service.username,
      password: String(password),
    });
    return { status: 'success', data };
  }

  async renew(_args: ProvisioningArgs): Promise<ProvisionResult> {
    // For cPanel, renew might just mean unsuspending or updating metadata
    // In many cases, it's a no-op if the service was ACTIVE.
    await Promise.resolve();
    return { status: 'success', message: 'Account renewed successfully' };
  }

  async testConnection(
    server: Server,
    _provisioner: Provisioner,
  ): Promise<boolean> {
    try {
      await this.request(server, 'version', {});
      return true;
    } catch {
      return false;
    }
  }
}
