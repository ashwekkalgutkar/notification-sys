import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as requestSupertest from 'supertest';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/http-exception.filter';

const request = (requestSupertest as any).default || requestSupertest;

jest.setTimeout(30000);

describe('Notification System API (e2e smoke)', () => {
  let app: INestApplication;

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
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /api/rules should return 200 and an array', async () => {
    const res = await request(app.getHttpServer()).get('/api/rules').expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('GET /api/notifications should return 200 with paginated { data, meta } shape', async () => {
    const res = await request(app.getHttpServer()).get('/api/notifications').expect(200);
    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it('POST /api/events with invalid body should return 400', async () => {
    await request(app.getHttpServer())
      .post('/api/events')
      .send({ invalidField: 'bad data' })
      .expect(400);
  });
});
