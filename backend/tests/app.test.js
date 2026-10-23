const request = require('supertest');
const app = require('../app');

describe('Vehicle Rental API', () => {
  test('GET /health returns ok', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  test('GET /metrics exposes Prometheus metrics', async () => {
    await request(app).get('/health');
    const res = await request(app).get('/metrics');
    expect(res.statusCode).toBe(200);
    expect(res.text).toContain('http_requests_total');
  });

  test('POST /api/bookings rejects empty body', async () => {
    const res = await request(app).post('/api/bookings').send({});
    expect(res.statusCode).toBe(400);
  });
});
