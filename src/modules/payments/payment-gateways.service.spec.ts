import { Test, TestingModule } from '@nestjs/testing';
import { PaymentGatewaysService } from './payment-gateways.service';

describe('PaymentGatewaysService', () => {
  let service: PaymentGatewaysService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PaymentGatewaysService],
    }).compile();

    service = module.get<PaymentGatewaysService>(PaymentGatewaysService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
