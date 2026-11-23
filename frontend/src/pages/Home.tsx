import { useEffect, useState } from 'react';
import { api, NEIGHBORHOODS, type Listing, type Match, type Review, type User } from '../lib/api';
import { SchematicMap, initials, money } from '../components';
import { go } from '../App';

/* The mockup's worked example, shown until a signed-in user's real top
   match is available. Numbers and copy are the mockup's own. */
const EXAMPLE_FACTORS = [
  { label: 'Budget', points: 18, max: 20 },
  { label: 'Neighborhood', points: 10, max: 15 },
  { label: 'Move in date', points: 9, max: 10 },
  { label: 'Sleep schedule', points: 15, max: 15 },
  { label: 'Cleanliness', points: 14, max: 15 },
  { label: 'Noise', points: 3, max: 5 },
];

const EXAMPLE_QUOTES = [
  {
    name: 'Jordan Ellis',
    rating: 5,
    listing: 'Sunny 2BR on College Ave',
    text: 'Lived here last year. Landlord fixed the dishwasher within a day and returned the full deposit.',
  },
  {
    name: 'Priya Nair',
    rating: 4,
    listing: 'Sunny 2BR on College Ave',
    text: 'Great location and quiet building. Heating is a little uneven in winter.',
  },
];

function FactorRows({ factors }: { factors: { label: string; points: number; max: number }[] }) {
  return (
    <div className="factor-rows">
      {factors.map((f) => (
        <div className="factor-row" key={f.label}>
          <span>{f.label}</span>
          <span className="factor-bar">
            <i style={{ width: `${Math.round((f.points / f.max) * 100)}%` }} />
          </span>
          <span className="pts num">
            {f.points}/{f.max}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function Home({ user }: { user: User | null }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [neighborhood, setNeighborhood] = useState('all');
  const [maxPrice, setMaxPrice] = useState('');
  const [topMatch, setTopMatch] = useState<Match | null>(null);
  const [quotes, setQuotes] = useState<{ name: string; rating: number; listing: string; text: string }[]>(EXAMPLE_QUOTES);

  useEffect(() => {
    api
      .listings({})
      .then((d) => {
        setListings(d.listings);
        if (d.listings.length > 0) {
          setSelectedId(d.listings[0].id);
          api
            .listing(d.listings[0].id)
            .then((det) => {
              if (det.reviews.length > 0) {
                setQuotes(
                  det.reviews.slice(0, 2).map((r: Review) => ({
                    name: r.reviewer_name,
                    rating: r.rating,
                    listing: det.listing.title,
                    text: r.comment,
                  })),
                );
              }
            })
            .catch(() => undefined);
        }
      })
      .catch(() => setListings([]));
  }, []);

  useEffect(() => {
    if (!user) {
      setTopMatch(null);
      return;
    }
    api
      .matches()
      .then((d) => setTopMatch(d.matches.length > 0 ? d.matches[0] : null))
      .catch(() => setTopMatch(null));
  }, [user]);

  const search = (e: React.FormEvent) => {
    e.preventDefault();
    const qs = new URLSearchParams();
    if (maxPrice) qs.set('maxPrice', maxPrice);
    if (neighborhood !== 'all') qs.set('neighborhood', neighborhood);
    go(`browse${qs.toString() ? `?${qs.toString()}` : ''}`);
  };

  const demoCount = listings.length;

  return (
    <div>
      {/* ---------- hero + map ---------- */}
      <section className="hero-wrap">
        <div className="hero-copy">
          <h1>Find a place near campus, and someone to share it with.</h1>
          <p className="lede">
            Search by price for each bedroom, see the walk to the Arts Quad, and read what
            past tenants say about the landlord before you sign.
          </p>
          <form className="search-card" onSubmit={search}>
            <label style={{ flex: '1 1 150px' }}>
              <span className="sr-only">Neighborhood</span>
              <select value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}>
                <option value="all">Any neighborhood</option>
                {NEIGHBORHOODS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ flex: '1.2 1 200px' }}>
              <span className="sr-only">Highest price for each bedroom</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="Up to $1,500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value.replace(/[^0-9]/g, ''))}
              />
            </label>
            <button type="submit" className="btn">
              Search housing
            </button>
          </form>
          <p className="hero-note">
            {demoCount > 0 ? `${demoCount} demo places are listed. ` : ''}They are fictional and marked as demos.
          </p>
        </div>
        <div style={{ flex: '1.25 1 480px', minWidth: 0 }}>
          <SchematicMap
            listings={listings}
            selectedId={selectedId}
            onSelect={setSelectedId}
            caption="Schematic map, not to scale. Rings show walking minutes from the Arts Quad."
          />
        </div>
      </section>

      {/* ---------- roommate matching ---------- */}
      <section className="band">
        <div className="band-inner">
          <div className="band-copy">
            <h2>Roommate matches that show their work.</h2>
            <p>
              Answer ten questions about how you live. Every match gets a score out of 100
              and a plain breakdown, so you know what lines up and what to talk about before
              you send a request.
            </p>
            <button type="button" className="btn ghost" onClick={() => go('matching')}>
              Find roommates
            </button>
          </div>
          {topMatch ? (
            <div className="match-preview">
              <div className="match-preview-head">
                <div className="avatar">{initials(topMatch.user.name)}</div>
                <div style={{ flex: '1 1 160px' }}>
                  <div style={{ fontFamily: "'Schibsted Grotesk',sans-serif", fontWeight: 700, fontSize: 20 }}>
                    {topMatch.user.name}
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 15 }}>
                    {topMatch.user.major}, class of {topMatch.user.grad_year}
                  </div>
                </div>
                <div className="score-big">
                  <div className="n num">{topMatch.score}</div>
                  <div className="of">out of 100</div>
                </div>
              </div>
              <FactorRows factors={topMatch.factors} />
              {topMatch.watchOuts.length > 0 && (
                <div className="talk-box">
                  <strong>Talk about first:</strong> {topMatch.watchOuts[0]}
                </div>
              )}
              <p className="fine-note">Your best match right now. The full list is on the Roommates page.</p>
            </div>
          ) : (
            <div className="match-preview">
              <div className="match-preview-head">
                <div className="avatar">PN</div>
                <div style={{ flex: '1 1 160px' }}>
                  <div style={{ fontFamily: "'Schibsted Grotesk',sans-serif", fontWeight: 700, fontSize: 20 }}>Priya Nair</div>
                  <div style={{ color: 'var(--muted)', fontSize: 15 }}>Biology, class of 2028</div>
                </div>
                <div className="score-big">
                  <div className="n num">89</div>
                  <div className="of">out of 100</div>
                </div>
              </div>
              <FactorRows factors={EXAMPLE_FACTORS} />
              <div className="talk-box">
                <strong>Talk about first:</strong> Priya likes quieter evenings than you do.
              </div>
              <p className="fine-note">Example from the demo accounts. Three more factors are in the full breakdown.</p>
            </div>
          )}
        </div>
      </section>

      {/* ---------- places right now ---------- */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 34 }}>Places near campus right now</h2>
          <a
            href="#/browse"
            onClick={(e) => {
              e.preventDefault();
              go('browse');
            }}
            style={{ fontWeight: 600, minHeight: 44, display: 'inline-flex', alignItems: 'center' }}
          >
            See all{demoCount > 0 ? ` ${demoCount}` : ''} on the map
          </a>
        </div>
        <div className="place-rows">
          {listings.slice(0, 3).map((l) => (
            <a
              key={l.id}
              className="place-row"
              href={`#/listing/${l.id}`}
              onClick={(e) => {
                e.preventDefault();
                go(`listing/${l.id}`);
              }}
            >
              <div>
                <span className="pr num">{money(l.price_per_bedroom)}</span>
                <div className="per">a bedroom</div>
              </div>
              <div style={{ minWidth: 0 }}>
                <div className="t">{l.title}</div>
                <div className="m">
                  {l.neighborhood}, {l.bedrooms} bed, {l.bathrooms} bath
                </div>
              </div>
              <div className="r">
                <div className="w num">{l.distance_min} min walk</div>
                <div className="d">
                  {l.furnished ? 'Furnished' : 'Unfurnished'},{' '}
                  {l.utilities_included ? 'utilities included' : 'utilities not included'}
                </div>
              </div>
            </a>
          ))}
        </div>
      </section>

      {/* ---------- landlord reviews ---------- */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 72px', display: 'flex', flexWrap: 'wrap', gap: 48 }}>
        <div style={{ flex: '1 1 320px', minWidth: 0 }}>
          <h2 style={{ margin: 0, fontSize: 34, lineHeight: 1.1, textWrap: 'balance' }}>
            Read the landlord reviews before you sign.
          </h2>
          <p style={{ margin: '14px 0 0', color: 'var(--muted)', fontSize: 19, maxWidth: 420 }}>
            Students rate their landlords on every listing, so the details other sites leave
            out show up before the lease does.
          </p>
        </div>
        <div className="quote-grid">
          {quotes.map((q) => (
            <figure className="quote-card" key={q.name + q.listing}>
              <blockquote>{q.text}</blockquote>
              <figcaption>
                <strong>{q.name}</strong>, {q.rating} out of 5, {q.listing}
              </figcaption>
            </figure>
          ))}
        </div>
      </section>
    </div>
  );
}
