import { useEffect, useState } from 'react';
import { api, type Listing } from '../lib/api';
import { ListingCard } from '../components';
import { go } from '../App';

export default function Saved() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .bookmarks()
      .then((d) => {
        setListings(d.listings);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Could not load saved places.');
        setLoading(false);
      });
  }, []);

  return (
    <div>
      <h1 className="serif" style={{ fontSize: 32, margin: '4px 0 6px' }}>Saved places</h1>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>The listings you bookmarked while browsing.</p>
      {error && <div className="error">{error}</div>}
      {loading ? (
        <div className="empty">Loading…</div>
      ) : listings.length === 0 ? (
        <div className="empty">
          Nothing saved yet. <button className="btn ghost small" onClick={() => go('browse')}>Browse housing</button>
        </div>
      ) : (
        <div className="card-grid">
          {listings.map((l) => (
            <ListingCard key={l.id} listing={l} onOpen={(id) => go(`listing/${id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
