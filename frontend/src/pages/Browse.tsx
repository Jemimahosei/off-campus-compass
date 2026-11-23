import { useCallback, useEffect, useRef, useState } from 'react';
import { api, type Listing } from '../lib/api';
import { SchematicMap, formatDate, money } from '../components';
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

type SortKey = 'price' | 'priceDesc' | 'walk';

const WAKE_AFTER_MS = 3500; // show the wake-up state if the API is still silent
const RETRY_MS = 8000; // keep retrying while the free host wakes
const GIVE_UP_MS = 120000; // mockup copy: "Still nothing after two minutes?"

export default function Browse() {
  const initial = readInitial();
  const [all, setAll] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [waking, setWaking] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [error, setError] = useState('');

  const [maxPrice, setMaxPrice] = useState(() => {
    const n = Number(initial.maxPrice);
    return Number.isFinite(n) && n >= 600 && n <= 2000 ? n : 2000;
  });
  const [beds, setBeds] = useState(() => {
    const n = Number(initial.bedrooms);
    return [0, 2, 3, 4].includes(n) ? n : 0;
  });
  const [neighborhood, setNeighborhood] = useState(initial.neighborhood || 'all');
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [furn, setFurn] = useState(false);
  const [util, setUtil] = useState(false);
  const [sort, setSort] = useState<SortKey>('price');
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const startedAt = useRef<number>(Date.now());
  const timer = useRef<number | null>(null);

  const load = useCallback(() => {
    api
      .listings({})
      .then((d) => {
        setAll(d.listings);
        setNeighborhoods(d.neighborhoods);
        setLoading(false);
        setWaking(false);
        setGaveUp(false);
        setError('');
      })
      .catch((e) => {
        // A sleeping free-tier host usually just hangs or 503s; keep retrying
        // behind the wake-up state instead of failing on the first error.
        if (Date.now() - startedAt.current < GIVE_UP_MS) {
          setWaking(true);
          timer.current = window.setTimeout(load, RETRY_MS);
        } else {
          setLoading(false);
          setWaking(false);
          setGaveUp(true);
          setError(e.message || 'Could not load listings.');
        }
      });
  }, []);

  useEffect(() => {
    startedAt.current = Date.now();
    load();
    const wakeTimer = window.setTimeout(() => {
      setLoading((still) => {
        if (still) setWaking(true);
        return still;
      });
    }, WAKE_AFTER_MS);
    return () => {
      window.clearTimeout(wakeTimer);
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [load]);

  const retryNow = () => {
    startedAt.current = Date.now();
    setLoading(true);
    setGaveUp(false);
    setError('');
    if (timer.current) window.clearTimeout(timer.current);
    load();
  };

  /* Mockup filtering is live and client-side: price ceiling, minimum
     bedrooms, furnished / utilities toggles, then sort. The neighborhood
     arriving from the home search is honoured as an extra filter. */
  const visible = all
    .filter(
      (l) =>
        l.price_per_bedroom <= maxPrice &&
        l.bedrooms >= beds &&
        (neighborhood === 'all' || l.neighborhood === neighborhood) &&
        (!furn || l.furnished) &&
        (!util || l.utilities_included),
    )
    .sort((a, b) => {
      if (sort === 'price') return a.price_per_bedroom - b.price_per_bedroom;
      if (sort === 'priceDesc') return b.price_per_bedroom - a.price_per_bedroom;
      return a.distance_min - b.distance_min;
    });

  const filtersOn = maxPrice < 2000 || beds > 0 || furn || util || neighborhood !== 'all';
  const clear = () => {
    setMaxPrice(2000);
    setBeds(0);
    setFurn(false);
    setUtil(false);
    setNeighborhood('all');
  };

  const selId = visible.some((l) => l.id === selectedId) ? selectedId : visible[0]?.id ?? null;

  const chip = (on: boolean) => (on ? 'chip selected' : 'chip');

  return (
    <div className="container wide">
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0, fontSize: 34 }}>Housing near Cornell</h1>
        {!loading && !waking && (
          <div role="status" className="num" style={{ color: 'var(--muted)' }}>
            {visible.length} place{visible.length === 1 ? '' : 's'} shown
          </div>
        )}
      </div>

      {waking || (loading && !gaveUp) ? (
        /* ---- server wake-up state (mockup screen 6) ---- */
        <div>
          {waking && (
            <div className="wake-card" role="status">
              <div className="t">Waking up the listings server</div>
              <p>
                This site runs on a free host that sleeps when nobody has visited for a
                while. The first visit takes up to a minute. Your places will appear on
                their own.
              </p>
              <div className="wake-track">
                <div className="wake-bar" />
              </div>
              <div className="wake-actions">
                <button type="button" className="btn" style={{ minHeight: 44, padding: '0 20px' }} onClick={retryNow}>
                  Try again now
                </button>
                <span className="hint">Still nothing after two minutes? Try again, or come back in a bit.</span>
              </div>
            </div>
          )}
          <div style={{ marginTop: 20, display: 'flex', flexWrap: 'wrap', gap: 20 }}>
            <div className="skel-panel" aria-hidden="true">
              {[70, 60, 75, 65].map((w, i) => (
                <div className="skel-row" key={i}>
                  <div className="skel" style={{ height: 40 }} />
                  <div style={{ display: 'grid', gap: 8 }}>
                    <div className="skel" style={{ height: 18, width: `${w}%` }} />
                    <div className="skel light" style={{ height: 14, width: `${w + 15}%` }} />
                  </div>
                </div>
              ))}
            </div>
            <div className="map-wait">The map appears with the first places.</div>
          </div>
        </div>
      ) : gaveUp ? (
        <div>
          {error && <div className="error">{error}</div>}
          <div className="wake-card" role="status">
            <div className="t">Waking up the listings server</div>
            <p>
              This site runs on a free host that sleeps when nobody has visited for a while.
              Still nothing after two minutes? Try again, or come back in a bit.
            </p>
            <div className="wake-actions">
              <button type="button" className="btn" style={{ minHeight: 44, padding: '0 20px' }} onClick={retryNow}>
                Try again now
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ---- loaded state (mockup screens 2 + 5) ---- */
        <div>
          <div className="filter-bar">
            <div style={{ flex: '1 1 220px', minWidth: 0 }}>
              <label className="f-label" htmlFor="mx">
                Highest price for each bedroom: <span className="num">{money(maxPrice)}</span>
              </label>
              <input
                id="mx"
                type="range"
                min={600}
                max={2000}
                step={50}
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
              />
            </div>
            <div>
              <div className="f-label">Bedrooms</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { v: 0, label: 'Any' },
                  { v: 2, label: '2 or more' },
                  { v: 3, label: '3 or more' },
                  { v: 4, label: '4 or more' },
                ].map((b) => (
                  <button
                    key={b.v}
                    type="button"
                    className={chip(beds === b.v)}
                    aria-pressed={beds === b.v}
                    onClick={() => setBeds(b.v)}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="f-label">Includes</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <button type="button" className={chip(furn)} aria-pressed={furn} onClick={() => setFurn(!furn)}>
                  Furnished
                </button>
                <button type="button" className={chip(util)} aria-pressed={util} onClick={() => setUtil(!util)}>
                  Utilities
                </button>
              </div>
            </div>
            {neighborhoods.length > 0 && (
              <div>
                <label className="f-label" htmlFor="nb">
                  Neighborhood
                </label>
                <select id="nb" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}>
                  <option value="all">All neighborhoods</option>
                  {neighborhoods.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div>
              <label className="f-label" htmlFor="so">
                Sort by
              </label>
              <select id="so" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
                <option value="price">Price, lowest first</option>
                <option value="priceDesc">Price, highest first</option>
                <option value="walk">Closest to campus</option>
              </select>
            </div>
            {filtersOn && (
              <button type="button" className="clear-link" onClick={clear}>
                Clear filters
              </button>
            )}
          </div>

          <div className="browse-cols">
            <div className="list-panel">
              {visible.length === 0 ? (
                <div className="empty-state">
                  <div className="t">Nothing matches those filters.</div>
                  <p>Raise the price limit or switch off Furnished or Utilities to see more places.</p>
                  <button type="button" className="btn" onClick={clear}>
                    Clear filters
                  </button>
                </div>
              ) : (
                visible.map((l) => {
                  const sel = l.id === selId;
                  return (
                    <div key={l.id} className={`browse-row${sel ? ' sel' : ''}`}>
                      <button
                        type="button"
                        className="row-main"
                        aria-pressed={sel}
                        onClick={() => setSelectedId(l.id)}
                      >
                        <span>
                          <span className="pr num">{money(l.price_per_bedroom)}</span>
                          <span className="per">a bedroom</span>
                        </span>
                        <span style={{ display: 'block', minWidth: 0 }}>
                          <span className="t">{l.title}</span>
                          <span className="m num">
                            {l.neighborhood}, {l.bedrooms} bed, {l.bathrooms} bath, {l.distance_min} min walk
                          </span>
                          <span className="m">
                            {l.furnished ? 'Furnished' : 'Unfurnished'},{' '}
                            {l.utilities_included ? 'Utilities included' : 'Utilities not included'}
                          </span>
                        </span>
                      </button>
                      {sel && (
                        <div className="expand">
                          <span className="avail">Available {formatDate(l.available_from)}</span>
                          <button type="button" className="btn small" onClick={() => go(`listing/${l.id}`)}>
                            View this place
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div className="map-panel">
              <SchematicMap
                listings={visible}
                selectedId={selId}
                onSelect={setSelectedId}
                caption="Schematic map, not to scale. Rings show walking minutes from the Arts Quad."
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
