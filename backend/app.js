const express = require('express');
const cors = require('cors');
const client = require('prom-client');
const Vehicle = require('./models/Vehicle');
const Booking = require('./models/Booking');

const app = express();
app.use(cors());
app.use(express.json());

// ---------- Prometheus metrics ----------
client.collectDefaultMetrics();

const httpRequests = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});
const httpDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5]
});
const bookingsCreated = new client.Counter({
  name: 'bookings_created_total',
  help: 'Total bookings created'
});
const bookingsCancelled = new client.Counter({
  name: 'bookings_cancelled_total',
  help: 'Total bookings cancelled'
});

app.use((req, res, next) => {
  const stop = httpDuration.startTimer();
  res.on('finish', () => {
    const route = req.route ? req.baseUrl + req.route.path : 'unmatched';
    const labels = { method: req.method, route, status: res.statusCode };
    httpRequests.inc(labels);
    stop(labels);
  });
  next();
});

const wrap = (fn) => (req, res) =>
  Promise.resolve(fn(req, res)).catch((err) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  });

// ---------- Routes ----------
app.get('/health', (req, res) => res.json({ status: 'ok' }));
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.get('/api/vehicles', wrap(async (req, res) => {
  res.json(await Vehicle.find().sort({ createdAt: 1 }));
}));

app.post('/api/vehicles', wrap(async (req, res) => {
  const { name, type, seats, pricePerDay, emoji } = req.body;
  if (!name || pricePerDay == null) {
    return res.status(400).json({ error: 'name and pricePerDay are required' });
  }
  res.status(201).json(await Vehicle.create({ name, type, seats, pricePerDay, emoji }));
}));

app.get('/api/bookings', wrap(async (req, res) => {
  res.json(await Booking.find().populate('vehicle').sort({ createdAt: -1 }));
}));

app.post('/api/bookings', wrap(async (req, res) => {
  const { vehicleId, customerName, customerEmail, startDate, endDate } = req.body;
  if (!vehicleId || !customerName || !customerEmail || !startDate || !endDate) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start) || isNaN(end) || end <= start) {
    return res.status(400).json({ error: 'End date must be after start date' });
  }
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });

  const clash = await Booking.findOne({
    vehicle: vehicleId,
    status: 'ACTIVE',
    startDate: { $lt: end },
    endDate: { $gt: start }
  });
  if (clash) {
    return res.status(409).json({ error: 'Vehicle is already booked for these dates' });
  }

  const days = Math.ceil((end - start) / 86400000);
  const booking = await Booking.create({
    vehicle: vehicleId,
    customerName,
    customerEmail,
    startDate: start,
    endDate: end,
    totalPrice: days * vehicle.pricePerDay
  });
  bookingsCreated.inc();
  res.status(201).json(booking);
}));

app.delete('/api/bookings/:id', wrap(async (req, res) => {
  const booking = await Booking.findByIdAndUpdate(
    req.params.id, { status: 'CANCELLED' }, { new: true }
  );
  if (!booking) return res.status(404).json({ error: 'Booking not found' });
  bookingsCancelled.inc();
  res.json(booking);
}));

module.exports = app;
