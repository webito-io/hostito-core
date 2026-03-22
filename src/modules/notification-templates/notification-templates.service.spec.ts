import { Test, TestingModule } from '@nestjs/testing';
import { NotificationTemplatesService } from './notification-templates.service';

describe('NotificationTemplatesService', () => {
  let service: NotificationTemplatesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationTemplatesService],
    }).compile();

    service = module.get<NotificationTemplatesService>(NotificationTemplatesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
