import { useEffect, useState } from 'react';
import { api } from './api';
import './App.css';

const emptyForm = { customerName: '', customerEmail: '', startDate: '', endDate: '' };

export default function App() {
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    setVehicles(await api.get('/vehicles'));
    setBookings(await api.get('/bookings'));
  };

  useEffect(() => {
    load().catch((e) => setMsg({ type: 'error', text: e.message }));
  }, []);

  const change = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    try {
      const b = await api.post('/bookings', { ...form, vehicleId: selected._id });
      setMsg({ type: 'ok', text: `Booked ${selected.name} — total $${b.totalPrice}` });
      setSelected(null);
      setForm(emptyForm);
      await load();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  const cancel = async (id) => {
    try {
      await api.del(`/bookings/${id}`);
      setMsg({ type: 'ok', text: 'Booking cancelled' });
      await load();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="container">
      <h1>🚗 Vehicle Rental</h1>
      {msg && <div className={`msg ${msg.type}`}>{msg.text}</div>}

      <h2>Available vehicles</h2>
      <div className="grid">
        {vehicles.map((v) => (
          <div key={v._id} className="card">
            <div className="emoji">{v.emoji}</div>
            <h3>{v.name}</h3>
            <p>{v.type} · {v.seats} seats</p>
            <p className="price">${v.pricePerDay} / day</p>
            <button onClick={() => { setSelected(v); setMsg(null); }}>Book now</button>
          </div>
        ))}
      </div>

      {selected && (
        <div className="panel">
          <h2>Book {selected.name}</h2>
          <form onSubmit={submit}>
            <input name="customerName" placeholder="Your name" value={form.customerName} onChange={change} required />
            <input name="customerEmail" type="email" placeholder="Email" value={form.customerEmail} onChange={change} required />
            <label>Start <input name="startDate" type="date" value={form.startDate} onChange={change} required /></label>
            <label>End <input name="endDate" type="date" value={form.endDate} onChange={change} required /></label>
            <div className="row">
              <button type="submit">Confirm booking</button>
              <button type="button" className="secondary" onClick={() => setSelected(null)}>Close</button>
            </div>
          </form>
        </div>
      )}

      <h2>Bookings</h2>
      <table>
        <thead>
          <tr><th>Vehicle</th><th>Customer</th><th>Dates</th><th>Total</th><th>Status</th><th></th></tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b._id}>
              <td>{b.vehicle?.name}</td>
              <td>{b.customerName}</td>
              <td>{b.startDate.slice(0, 10)} → {b.endDate.slice(0, 10)}</td>
              <td>${b.totalPrice}</td>
              <td className={b.status === 'ACTIVE' ? 'active' : 'cancelled'}>{b.status}</td>
              <td>{b.status === 'ACTIVE' && <button className="danger" onClick={() => cancel(b._id)}>Cancel</button>}</td>
            </tr>
          ))}
          {bookings.length === 0 && <tr><td colSpan="6">No bookings yet</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
