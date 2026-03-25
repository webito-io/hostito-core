import { Test, TestingModule } from '@nestjs/testing';
import { PaymentGatewaysController } from './payment-gateways.controller';
import { PaymentGatewaysService } from './payment-gateways.service';

describe('PaymentGatewaysController', () => {
  let controller: PaymentGatewaysController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PaymentGatewaysController],
      providers: [PaymentGatewaysService],
    }).compile();

    controller = module.get<PaymentGatewaysController>(
      PaymentGatewaysController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
