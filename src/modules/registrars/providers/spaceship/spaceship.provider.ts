import { Injectable } from '@nestjs/common';
import { Registrar } from '@prisma/client';
import {
  DomainProvider,
  DomainProvisioningArgs,
  DomainProvisionResult,
} from '../domains.provider.interface';

export type SpaceshipConfig = {
  baseUrl: string;
  apiKey: string;
  apiSecret: string;
};

@Injectable()
export class SpaceshipProvider implements DomainProvider {
  private getConfig(registrar: Registrar): SpaceshipConfig {
    const config = registrar.config as unknown as SpaceshipConfig;
    if (!config?.apiKey || !config?.apiSecret || !config?.baseUrl) {
      throw new Error('Spaceship registrar config is incomplete');
    }
    return config;
  }

  private async request<T = unknown>(
    config: SpaceshipConfig,
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const res = await fetch(`${config.baseUrl}${path}`, {
      method,
      headers: {
        'X-API-Key': config.apiKey,
        'X-API-Secret': config.apiSecret,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!res.ok) {
      const err = (await res
        .json()
        .catch(() => ({ detail: res.statusText }))) as { detail?: string };
      throw new Error(
        `Spaceship API [${res.status}]: ${err.detail || 'Unknown error'}`,
      );
    }

    if (res.status === 204) return {} as T;
    return (await res.json()) as T;
  }

  async availability(
    domainName: string,
    registrar: Registrar,
  ): Promise<boolean> {
    const config = this.getConfig(registrar);
    const data = await this.request<{ result: string }>(
      config,
      'GET',
      `/domains/${domainName}/available`,
    );
    return data.result === 'available';
  }

  async register(args: DomainProvisioningArgs): Promise<DomainProvisionResult> {
    const config = this.getConfig(args.registrar);
    const {
      domain,
      contacts,
      years = 1,
      autoRenew = false,
      privacyProtection,
    } = args;
    try {
      await this.request(config, 'POST', `/domains/${domain.name}`, {
        autoRenew,
        years,
        privacyProtection: privacyProtection ?? {
          level: 'high',
          userConsent: true,
        },
        contacts,
      });
      return {
        status: 'success',
        message: `Domain ${domain.name} registration initiated`,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error occurred';
      return { status: 'failed', message };
    }
  }

  async renew(args: DomainProvisioningArgs): Promise<DomainProvisionResult> {
    const config = this.getConfig(args.registrar);
    const { domain, years = 1, currentExpirationDate } = args;
    try {
      await this.request(config, 'POST', `/domains/${domain.name}/renew`, {
        years,
        currentExpirationDate:
          currentExpirationDate ?? domain.expiresAt?.toISOString(),
      });
      return {
        status: 'success',
        message: `Domain ${domain.name} renewal initiated`,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error occurred';
      return { status: 'failed', message };
    }
  }

  async lock(args: DomainProvisioningArgs): Promise<DomainProvisionResult> {
    const config = this.getConfig(args.registrar);
    try {
      await this.request(
        config,
        'PUT',
        `/domains/${args.domain.name}/transfer/lock`,
        { isLocked: true },
      );
      return {
        status: 'success',
        message: `Domain ${args.domain.name} locked`,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error occurred';
      return { status: 'failed', message };
    }
  }

  async unlock(args: DomainProvisioningArgs): Promise<DomainProvisionResult> {
    const config = this.getConfig(args.registrar);
    try {
      await this.request(
        config,
        'PUT',
        `/domains/${args.domain.name}/transfer/lock`,
        { isLocked: false },
      );
      return {
        status: 'success',
        message: `Domain ${args.domain.name} unlocked`,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error occurred';
      return { status: 'failed', message };
    }
  }

  async code(args: DomainProvisioningArgs): Promise<DomainProvisionResult> {
    const config = this.getConfig(args.registrar);
    try {
      const data = await this.request<{ authCode: string; expires: string }>(
        config,
        'GET',
        `/domains/${args.domain.name}/transfer/auth-code`,
      );
      return { status: 'success', data };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error occurred';
      return { status: 'failed', message };
    }
  }

  async nameservers(
    args: DomainProvisioningArgs,
  ): Promise<DomainProvisionResult> {
    const config = this.getConfig(args.registrar);
    try {
      const data = await this.request(
        config,
        'PUT',
        `/domains/${args.domain.name}/nameservers`,
        {
          provider: 'custom',
          hosts: args.nameservers ?? args.domain.nameservers,
        },
      );
      return { status: 'success', data };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error occurred';
      return { status: 'failed', message };
    }
  }

  async privacy(args: DomainProvisioningArgs): Promise<DomainProvisionResult> {
    const config = this.getConfig(args.registrar);
    try {
      await this.request(
        config,
        'PUT',
        `/domains/${args.domain.name}/privacy/preference`,
        {
          privacyLevel: args.enabled ? 'high' : 'public',
          userConsent: true,
        },
      );
      return {
        status: 'success',
        message: `Domain ${args.domain.name} privacy updated`,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error occurred';
      return { status: 'failed', message };
    }
  }

  async transfer(args: DomainProvisioningArgs): Promise<DomainProvisionResult> {
    const config = this.getConfig(args.registrar);
    const {
      domain,
      contacts,
      authCode,
      autoRenew = false,
      privacyProtection,
    } = args;
    try {
      await this.request(config, 'POST', `/domains/${domain.name}/transfer`, {
        autoRenew,
        privacyProtection: privacyProtection ?? {
          level: 'high',
          userConsent: true,
        },
        contacts,
        authCode,
      });
      return {
        status: 'success',
        message: `Domain ${domain.name} transfer initiated`,
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Unknown error occurred';
      return { status: 'failed', message };
    }
  }
}
