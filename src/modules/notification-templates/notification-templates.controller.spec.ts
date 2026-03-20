import { Test, TestingModule } from '@nestjs/testing';
import { NotificationTemplatesController } from './notification-templates.controller';
import { NotificationTemplatesService } from './notification-templates.service';

describe('NotificationTemplatesController', () => {
  let controller: NotificationTemplatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationTemplatesController],
      providers: [NotificationTemplatesService],
    }).compile();

    controller = module.get<NotificationTemplatesController>(NotificationTemplatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
