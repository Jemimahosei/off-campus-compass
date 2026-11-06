import { useEffect, useState } from 'react';
import { api, DEMO_ACCOUNTS, type Listing, type User } from '../lib/api';
import { CompassMark, ListingCard } from '../components';
import { go } from '../App';

export default function Home({ user }: { user: User | null }) {
  const [featured, setFeatured] = useState<Listing[]>([]);
  const [maxPrice, setMaxPrice] = useState('');
  const [neighborhood, setNeighborhood] = useState('all');

  useEffect(() => {
    api
      .listings({})
      .then((d) => setFeatured(d.listings.slice(0, 6)))
      .catch(() => setFeatured([]));
  }, []);

  const search = () => {
    const qs = new URLSearchParams();
    if (maxPrice) qs.set('maxPrice', maxPrice);
    if (neighborhood !== 'all') qs.set('neighborhood', neighborhood);
    go(`browse${qs.toString() ? `?${qs.toString()}` : ''}`);
  };

  return (
    <div>
      <section className="hero">
        <CompassMark />
        <h1>
          Find your place off campus, <em>and the people to share it with.</em>
        </h1>
        <p>
          Off Campus Compass is the housing search Cornell students actually need: real
          options near campus, honest landlord reviews, and roommate matching that shows
          its work — no more networking with upperclassmen just to get basic details.
        </p>
        <div className="hero-cta">
          <button className="btn" onClick={() => go('browse')}>Browse housing</button>
          <button className="btn ghost" onClick={() => go('matching')}>
            {user ? 'Find roommates' : 'Find roommates — log in'}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
          <select
            aria-label="Neighborhood"
            value={neighborhood}
            onChange={(e) => setNeighborhood(e.target.value)}
            style={{ border: '1px solid #cfc6b8', borderRadius: 999, padding: '10px 14px', background: '#fff' }}
          >
            <option value="all">Any neighborhood</option>
            {['Collegetown', 'West Campus', 'North Campus', 'East Hill', 'Fall Creek', 'South Hill', 'Downtown', 'Cayuga Heights'].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <input
            aria-label="Max price per bedroom"
            type="number"
            min={0}
            placeholder="Max $ / bedroom"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            style={{ border: '1px solid #cfc6b8', borderRadius: 999, padding: '10px 14px', background: '#fff', width: 180 }}
          />
          <button className="btn" onClick={search}>Search</button>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>How it works</h2>
        </div>
        <div className="rule" />
        <div className="how-grid">
          <div className="how-card">
            <div className="step">1</div>
            <h3>Answer 10 questions</h3>
            <p>Budget, neighborhood, move-in date, sleep schedule, cleanliness, guests, smoking, study habits, noise. Two minutes, no essay.</p>
          </div>
          <div className="how-card">
            <div className="step">2</div>
            <h3>See why you match</h3>
            <p>Every match comes with a score out of 100 and the reasons behind it — what lines up and what to talk about first.</p>
          </div>
          <div className="how-card">
            <div className="step">3</div>
            <h3>Team up, then move in</h3>
            <p>Send a roommate request, agree on a place from the listings, and check the landlord reviews before anyone signs.</p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2>Featured places</h2>
          <p>A few of the listings near campus right now.</p>
        </div>
        <div className="rule" />
        {featured.length === 0 ? (
          <div className="empty">Listings are loading…</div>
        ) : (
          <div className="card-grid">
            {featured.map((l) => (
              <ListingCard key={l.id} listing={l} onOpen={(id) => go(`listing/${id}`)} />
            ))}
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <button className="btn ghost" onClick={() => go('browse')}>See all housing →</button>
        </div>
      </section>

      <section className="section">
        <div className="demo-box">
          <strong>Just looking around?</strong> Log in with a demo account — no sign-up needed.
          <div style={{ marginTop: 8 }}>
            {DEMO_ACCOUNTS.map((a) => (
              <div key={a.email}>
                <code>{a.email}</code> / <code>{a.password}</code> — {a.name}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
