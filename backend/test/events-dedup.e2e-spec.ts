import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as requestSupertest from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';

const request = (requestSupertest as any).default || requestSupertest;

jest.setTimeout(30000);

describe('Events API End-to-End & Deduplication (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let seededRuleId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.useGlobalFilters(new GlobalExceptionFilter());
    await app.init();

    prisma = app.get(PrismaService);

    // Clean up test data
    await prisma.notificationLog.deleteMany({
      where: { eventId: 'e2e-test-event-001' },
    });
    await prisma.notificationRule.deleteMany({
      where: { triggerEvent: 'e2e.order.created' },
    });

    // Seed test rule
    const rule = await prisma.notificationRule.create({
      data: {
        name: 'E2E Test Rule',
        triggerEvent: 'e2e.order.created',
        conditions: JSON.stringify([
          { field: 'orderValue', operator: 'gte', value: 1000 },
        ]),
        recipients: JSON.stringify(['e2e-recipient@example.com']),
        channels: JSON.stringify(['email']),
        messageTemplate: 'E2E Order {{orderId}} created with value ${{orderValue}}',
        isEnabled: true,
      },
    });
    seededRuleId = rule.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.notificationLog.deleteMany({
        where: { eventId: 'e2e-test-event-001' },
      });
      if (seededRuleId) {
        await prisma.notificationRule.delete({ where: { id: seededRuleId } }).catch(() => {});
      }
    }
    if (app) {
      await app.close();
    }
  });

  it('1. Should process event and create a notification log entry on first submission', async () => {
    const eventPayload = {
      eventType: 'e2e.order.created',
      eventId: 'e2e-test-event-001',
      payload: {
        orderId: 'E2E-999',
        orderValue: 2500,
      },
    };

    const res = await request(app.getHttpServer())
      .post('/api/events')
      .send(eventPayload)
      .expect(201);

    expect(res.body).toHaveProperty('eventId', 'e2e-test-event-001');
    expect(res.body.matchedRulesCount).toBe(1);
    expect(res.body.dispatches).toHaveLength(1);
    expect(res.body.dispatches[0].ruleId).toBe(seededRuleId);
    expect(['sent', 'failed']).toContain(res.body.dispatches[0].status);

    // Verify directly in DB
    const logsInDb = await prisma.notificationLog.findMany({
      where: { eventId: 'e2e-test-event-001' },
    });
    expect(logsInDb.length).toBe(1);
    expect(logsInDb[0].recipient).toBe('e2e-recipient@example.com');
    expect(logsInDb[0].channel).toBe('email');
  });

  it('2. DEDUPLICATION TEST: Should NOT create duplicate notification log entry when same eventId is submitted again', async () => {
    const duplicateEventPayload = {
      eventType: 'e2e.order.created',
      eventId: 'e2e-test-event-001', // Exact same eventId
      payload: {
        orderId: 'E2E-999',
        orderValue: 2500,
      },
    };

    const res = await request(app.getHttpServer())
      .post('/api/events')
      .send(duplicateEventPayload)
      .expect(201);

    expect(res.body.dispatches).toHaveLength(1);
    expect(res.body.dispatches[0].status).toBe('skipped');
    expect(res.body.dispatches[0].reason).toContain('Duplicate eventId');

    // CRITICAL ASSERTION: Verify total records in DB for eventId remains EXACTLY 1!
    const logsInDbAfterDuplicate = await prisma.notificationLog.findMany({
      where: { eventId: 'e2e-test-event-001' },
    });
    expect(logsInDbAfterDuplicate.length).toBe(1);
  });
});
