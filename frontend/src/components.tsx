import type { Listing } from './lib/api';

/* ---------- helpers ---------- */

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function money(n: number): string {
  return '$' + n.toLocaleString('en-US');
}

/** '2026-08-01' -> 'Aug 1, 2026'; anything else passes through unchanged. */
export function formatDate(raw: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(raw || '');
  if (!m) return raw;
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[Number(m[2]) - 1]} ${Number(m[3])}, ${m[1]}`;
}

/* The API has no coordinates for listings. The mockups place the ten seeded
   demo listings at fixed points on the schematic map (760x640 space); those
   exact points are used when a title matches, and any other listing gets a
   deterministic point on its walking-time ring so pins never collide with
   the Arts Quad marker itself. */
const SEED_PIN_POSITIONS: Record<string, { x: number; y: number }> = {
  'Sunny 2BR on College Ave': { x: 336, y: 318 },
  'Cozy 3BR near Dryden Rd': { x: 520, y: 322 },
  'Modern 1BR on Eddy St': { x: 456, y: 300 },
  'Spacious 4BR on Stewart Ave': { x: 270, y: 276 },
  'Quiet 2BR on Triphammer Rd': { x: 404, y: 117 },
  'Bright 3BR on Linn St': { x: 240, y: 169 },
  'Renovated 2BR on Seneca St': { x: 196, y: 318 },
  'Charming 3BR on Cascadilla St': { x: 312, y: 436 },
  'Studio on College Ave': { x: 392, y: 288 },
  'Large 5BR house on Cayuga Heights Rd': { x: 524, y: 78 },
};

export function pinPosition(listing: Listing): { x: number; y: number } {
  const known = SEED_PIN_POSITIONS[listing.title];
  if (known) return known;
  // Rings on the schematic are 45px per 5 walking minutes, centred on the
  // Arts Quad at (380, 250).
  const r = Math.max(30, Math.min(225, listing.distance_min * 9));
  const angle = ((listing.id * 47 + 20) % 360) * (Math.PI / 180);
  return {
    x: Math.round(380 + r * Math.cos(angle)),
    y: Math.round(250 + r * Math.sin(angle)),
  };
}

/* ---------- brand mark (as drawn in the mockups) ---------- */

export function CompassLogo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 30" aria-hidden="true">
      <circle cx="15" cy="15" r="13" fill="none" stroke="#1f1f1f" strokeWidth="2" />
      <path d="M15 4 L19 15 L15 26 L11 15 Z" fill="#b31b1b" />
      <circle cx="15" cy="15" r="2.4" fill="#ffffff" />
    </svg>
  );
}

/* Kept for compatibility with any page still importing the old mark. */
export function CompassMark({ size = 120 }: { size?: number }) {
  return <CompassLogo size={size} />;
}

export function HouseGlyph() {
  return (
    <svg width="54" height="54" viewBox="0 0 64 64" aria-hidden="true">
      <path d="M8 34 L32 12 L56 34 V56 H8 Z" fill="rgba(255,255,255,0.92)" />
      <rect x="26" y="40" width="12" height="16" fill="#b31b1b" />
      <rect x="15" y="38" width="8" height="8" fill="#b31b1b" opacity="0.7" />
      <rect x="41" y="38" width="8" height="8" fill="#b31b1b" opacity="0.7" />
    </svg>
  );
}

export function artClass(neighborhood: string): string {
  const map: Record<string, string> = {
    Collegetown: 'art-collegetown',
    'West Campus': 'art-west',
    'North Campus': 'art-north',
    'East Hill': 'art-east',
    'Fall Creek': 'art-fall',
    'South Hill': 'art-south',
    Downtown: 'art-downtown',
    'Cayuga Heights': 'art-cayuga',
  };
  return map[neighborhood] || 'art-collegetown';
}

export function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="stars" aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(full)}
      {'☆'.repeat(Math.max(0, 5 - full))}
    </span>
  );
}

export function BookmarkIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="18" height="20" viewBox="0 0 18 20" aria-hidden="true">
      <path
        d="M3 2h12v16l-6-4-6 4z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/* ---------- schematic map (artwork copied from the mockups) ---------- */

export function SchematicMap({
  listings,
  selectedId,
  onSelect,
  caption,
  crop,
}: {
  listings: Listing[];
  selectedId?: number | null;
  onSelect?: (id: number) => void;
  caption?: string;
  /** Render the zoomed crop used on the listing page instead of the full map. */
  crop?: boolean;
}) {
  return (
    <div>
      <div className={`map-box${crop ? ' sq' : ''}`}>
        <svg
          className="schematic"
          viewBox={crop ? '260 190 240 180' : '0 0 760 640'}
          preserveAspectRatio="xMidYMid slice"
          role="img"
          aria-label="Schematic map of Cornell and Collegetown with walking time rings from the Arts Quad"
        >
          <rect x="0" y="0" width="760" height="640" fill="#e8e8e6" />
          <path d="M0 0H215C190 70 150 120 118 200C100 250 92 290 60 318C40 335 14 330 0 322Z" fill="#c5d8e0" />
          <path d="M470 200C420 196 380 200 330 190C280 180 230 190 170 170C150 164 140 150 138 138" fill="none" stroke="#d5dfd0" strokeWidth="22" strokeLinecap="round" />
          <path d="M470 262C430 270 390 266 340 272C300 276 250 292 190 286" fill="none" stroke="#d5dfd0" strokeWidth="18" strokeLinecap="round" />
          <rect x="344" y="226" width="72" height="48" rx="8" fill="#f3d6d6" />
          <g fill="none" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M378 262L372 392" />
            <path d="M330 330L520 322" />
            <path d="M392 286L450 330" />
            <path d="M330 282L290 288L210 330L120 372" />
            <path d="M420 40L428 130L424 226" />
            <path d="M200 140L250 172L320 196" />
            <path d="M110 332L250 324" />
            <path d="M290 412L340 470" />
            <path d="M470 160L570 60" />
          </g>
          <g fill="none" stroke="#b31b1b" strokeOpacity="0.4" strokeWidth="1.5" strokeDasharray="3 5">
            <circle cx="380" cy="250" r="45" />
            <circle cx="380" cy="250" r="90" />
            <circle cx="380" cy="250" r="135" />
            <circle cx="380" cy="250" r="180" />
            <circle cx="380" cy="250" r="225" />
          </g>
          {!crop && (
            <>
              <g fontFamily="'Source Sans 3',sans-serif" fontSize="12" fill="#8f1414" fontWeight="600">
                <text x="422" y="235">5 min</text>
                <text x="465" y="219">10 min</text>
                <text x="507" y="204">15 min</text>
                <text x="549" y="189">20 min</text>
                <text x="591" y="174">25 min</text>
              </g>
              <g fontFamily="'Source Sans 3',sans-serif" fontSize="12" fill="#4a4a4a">
                <text x="386" y="384">College Ave</text>
                <text x="470" y="356">Dryden Rd</text>
                <text x="150" y="354">Stewart Ave</text>
                <text x="436" y="150">Triphammer Rd</text>
                <text x="92" y="316">Seneca St</text>
                <text x="28" y="70" fill="#3d6b80">Cayuga Lake</text>
              </g>
            </>
          )}
          <circle cx="380" cy="250" r="7" fill="#1f1f1f" stroke="#ffffff" strokeWidth="3" />
          <text x="392" y="254" fontFamily="'Schibsted Grotesk',sans-serif" fontSize="13" fontWeight="700" fill="#1f1f1f">
            Arts Quad
          </text>
        </svg>
        {listings.map((l) => {
          const p = pinPosition(l);
          const sel = l.id === selectedId;
          return (
            <button
              key={l.id}
              type="button"
              className={`pin num${sel ? ' sel' : ''}`}
              style={{
                left: `${(p.x / 760) * 100}%`,
                top: `${(p.y / 640) * 100}%`,
                zIndex: sel ? 5 : 1,
                transform: `translate(-50%,-50%) scale(${sel ? 1.1 : 1})`,
              }}
              aria-label={`${l.title}, ${money(l.price_per_bedroom)} a bedroom`}
              onClick={() => onSelect && onSelect(l.id)}
            >
              {money(l.price_per_bedroom)}
            </button>
          );
        })}
        {!crop && selectedId != null && (() => {
          const sel = listings.find((l) => l.id === selectedId);
          if (!sel) return null;
          return (
            <div className="map-info">
              <div className="t">{sel.title}</div>
              <div className="d num">
                {money(sel.price_per_bedroom)} a bedroom, {sel.distance_min} min walk to the Arts Quad
              </div>
            </div>
          );
        })()}
      </div>
      {caption && <p className="map-caption">{caption}</p>}
    </div>
  );
}

/* ---------- listing card (used by the Saved page) ---------- */

export function ListingCard({
  listing,
  onOpen,
}: {
  listing: Listing;
  onOpen: (id: number) => void;
}) {
  return (
    <article className="listing-card" onClick={() => onOpen(listing.id)}>
      <div className="lc-price">
        {money(listing.price_per_bedroom)}
        <span> a bedroom</span>
      </div>
      <h3>{listing.title}</h3>
      <div className="meta">
        {listing.neighborhood}, {listing.bedrooms} bed, {listing.bathrooms} bath
      </div>
      <div className="meta num">
        {listing.distance_min} min walk · available {formatDate(listing.available_from)}
      </div>
      <div className="tags">
        {listing.furnished && <span className="tag">Furnished</span>}
        {listing.utilities_included && <span className="tag">Utilities included</span>}
        {listing.is_demo && <span className="tag demo">Demo listing</span>}
      </div>
      <div className="card-foot">
        <span className="meta">{listing.landlord_label}</span>
        <span aria-hidden="true">→</span>
      </div>
    </article>
  );
}
