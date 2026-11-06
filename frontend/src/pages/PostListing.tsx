import { useState } from 'react';
import { api, NEIGHBORHOODS } from '../lib/api';
import { go } from '../App';

export default function PostListing() {
  const [form, setForm] = useState({
    title: '',
    neighborhood: 'Collegetown',
    address_label: '',
    price_per_bedroom: '',
    bedrooms: '2',
    bathrooms: '1',
    distance_min: '',
    furnished: false,
    utilities_included: false,
    available_from: '2026-08-01',
    description: '',
    amenities: '',
    landlord_label: '',
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const set = (key: string, value: string | boolean) =>
    setForm((f) => ({ ...f, [key]: value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const d = await api.createListing({
        title: form.title,
        neighborhood: form.neighborhood,
        address_label: form.address_label,
        price_per_bedroom: Number(form.price_per_bedroom),
        bedrooms: Number(form.bedrooms),
        bathrooms: Number(form.bathrooms),
        distance_min: Number(form.distance_min),
        furnished: form.furnished,
        utilities_included: form.utilities_included,
        available_from: form.available_from,
        description: form.description,
        amenities: form.amenities.split(',').map((a) => a.trim()).filter(Boolean),
        landlord_label: form.landlord_label,
      });
      go(`listing/${d.listing.id}`);
    } catch (err: any) {
      setError(err.message || 'Could not post the listing.');
      setSaving(false);
    }
  };

  return (
    <div>
      <h1 className="serif" style={{ fontSize: 32, margin: '4px 0 6px' }}>Post a place</h1>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        Have a room opening up or a place to sublet? Post it for other Cornell students.
        Use a street or block, not a full street address, and never share anyone's phone number.
      </p>
      {error && <div className="error">{error}</div>}
      <form onSubmit={submit} className="form-card">
        <div className="form-grid">
          <div className="field full">
            <label htmlFor="p-title">Title</label>
            <input id="p-title" value={form.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Sunny 2BR on College Ave" required />
          </div>
          <div className="field">
            <label htmlFor="p-area">Neighborhood</label>
            <select id="p-area" value={form.neighborhood} onChange={(e) => set('neighborhood', e.target.value)}>
              {NEIGHBORHOODS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="p-addr">Street / block (no house number)</label>
            <input id="p-addr" value={form.address_label} onChange={(e) => set('address_label', e.target.value)} placeholder="e.g. College Ave" required />
          </div>
          <div className="field">
            <label htmlFor="p-price">Price per bedroom ($ / month)</label>
            <input id="p-price" type="number" min={0} value={form.price_per_bedroom} onChange={(e) => set('price_per_bedroom', e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="p-beds">Bedrooms</label>
            <select id="p-beds" value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="p-baths">Bathrooms</label>
            <select id="p-baths" value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)}>
              {[1, 2, 3].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="p-dist">Walk to campus (minutes)</label>
            <input id="p-dist" type="number" min={0} value={form.distance_min} onChange={(e) => set('distance_min', e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="p-avail">Available from</label>
            <input id="p-avail" type="date" value={form.available_from} onChange={(e) => set('available_from', e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="p-landlord">Landlord / property name</label>
            <input id="p-landlord" value={form.landlord_label} onChange={(e) => set('landlord_label', e.target.value)} placeholder="e.g. Your landlord or property group" />
          </div>
          <div className="field full">
            <label htmlFor="p-desc">Description</label>
            <textarea id="p-desc" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="What is the place like? What should roommates know?" />
          </div>
          <div className="field full">
            <label htmlFor="p-amen">Amenities (comma separated)</label>
            <input id="p-amen" value={form.amenities} onChange={(e) => set('amenities', e.target.value)} placeholder="In-unit laundry, Dishwasher, Parking" />
          </div>
          <div className="check-row full">
            <label><input type="checkbox" checked={form.furnished} onChange={(e) => set('furnished', e.target.checked)} /> Furnished</label>
            <label><input type="checkbox" checked={form.utilities_included} onChange={(e) => set('utilities_included', e.target.checked)} /> Utilities included</label>
          </div>
        </div>
        <div className="form-actions">
          <button className="btn" type="submit" disabled={saving}>{saving ? 'Posting…' : 'Post this place'}</button>
        </div>
      </form>
    </div>
  );
}
