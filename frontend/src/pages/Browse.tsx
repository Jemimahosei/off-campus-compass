import { useEffect, useState } from 'react';
import { api, type Listing } from '../lib/api';
import { ListingCard } from '../components';
import { go } from '../App';

function readInitial(): Record<string, string> {
  const hash = window.location.hash;
  const qIndex = hash.indexOf('?');
  const params: Record<string, string> = {};
  if (qIndex >= 0) {
    const qs = new URLSearchParams(hash.slice(qIndex + 1));
    for (const [k, v] of qs.entries()) params[k] = v;
  }
  return params;
}

export default function Browse() {
  const initial = readInitial();
  const [listings, setListings] = useState<Listing[]>([]);
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [maxPrice, setMaxPrice] = useState(initial.maxPrice || '');
  const [minPrice, setMinPrice] = useState(initial.minPrice || '');
  const [bedrooms, setBedrooms] = useState(initial.bedrooms || '');
  const [neighborhood, setNeighborhood] = useState(initial.neighborhood || 'all');
  const [furnished, setFurnished] = useState(false);
  const [utilities, setUtilities] = useState(false);
  const [availableFrom, setAvailableFrom] = useState('');

  const load = () => {
    setLoading(true);
    setError('');
    api
      .listings({
        maxPrice: maxPrice || undefined,
        minPrice: minPrice || undefined,
        bedrooms: bedrooms || undefined,
        neighborhood: neighborhood === 'all' ? undefined : neighborhood,
        furnished: furnished ? 'true' : undefined,
        utilities: utilities ? 'true' : undefined,
        availableFrom: availableFrom || undefined,
      })
      .then((d) => {
        setListings(d.listings);
        setNeighborhoods(d.neighborhoods);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Could not load listings.');
        setLoading(false);
      });
  };

  useEffect(load, []); // load once; filters apply on Search click

  return (
    <div>
      <h1 className="serif" style={{ fontSize: 32, margin: '4px 0 6px' }}>Find housing near Cornell</h1>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        Every listing shows price per bedroom, walk time to campus, and whether utilities are included.
        Demo listings are fictional and marked as demos.
      </p>

      <div className="filters">
        <div className="field">
          <label htmlFor="f-max">Max $ / bedroom</label>
          <input id="f-max" type="number" min={0} value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} placeholder="e.g. 900" />
        </div>
        <div className="field">
          <label htmlFor="f-min">Min $ / bedroom</label>
          <input id="f-min" type="number" min={0} value={minPrice} onChange={(e) => setMinPrice(e.target.value)} placeholder="e.g. 600" />
        </div>
        <div className="field">
          <label htmlFor="f-bed">Bedrooms (min)</label>
          <select id="f-bed" value={bedrooms} onChange={(e) => setBedrooms(e.target.value)}>
            <option value="">Any</option>
            <option value="1">1+</option>
            <option value="2">2+</option>
            <option value="3">3+</option>
            <option value="4">4+</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-area">Neighborhood</label>
          <select id="f-area" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}>
            <option value="all">All neighborhoods</option>
            {neighborhoods.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="f-avail">Available by</label>
          <input id="f-avail" type="date" value={availableFrom} onChange={(e) => setAvailableFrom(e.target.value)} />
        </div>
        <div className="check-row">
          <label><input type="checkbox" checked={furnished} onChange={(e) => setFurnished(e.target.checked)} /> Furnished</label>
          <label><input type="checkbox" checked={utilities} onChange={(e) => setUtilities(e.target.checked)} /> Utilities included</label>
        </div>
        <button className="btn" onClick={load}>Search</button>
      </div>

      {error && <div className="error">{error}</div>}

      <div className="section">
        {loading ? (
          <div className="empty">Loading listings…</div>
        ) : listings.length === 0 ? (
          <div className="empty">No places match those filters. Try widening the price or clearing the neighborhood.</div>
        ) : (
          <>
            <p style={{ color: 'var(--muted)' }}>{listings.length} place{listings.length === 1 ? '' : 's'} found, cheapest first.</p>
            <div className="card-grid">
              {listings.map((l) => (
                <ListingCard key={l.id} listing={l} onOpen={(id) => go(`listing/${id}`)} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
