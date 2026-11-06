import type { Listing } from './lib/api';

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

export function CompassMark({ size = 120 }: { size?: number }) {
  return (
    <svg className="compass-mark" width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <circle cx="50" cy="50" r="46" fill="none" stroke="#b31b1b" strokeWidth="1.5" />
      <circle cx="50" cy="50" r="34" fill="none" stroke="#b31b1b" strokeWidth="0.75" opacity="0.6" />
      <polygon points="50,8 55,50 50,92 45,50" fill="#b31b1b" />
      <polygon points="8,50 50,45 92,50 50,55" fill="#b31b1b" opacity="0.55" />
      <circle cx="50" cy="50" r="5" fill="#faf6f0" stroke="#b31b1b" strokeWidth="1.5" />
      <text x="50" y="4" textAnchor="middle" fontSize="8" fontWeight="700" fill="#b31b1b">N</text>
    </svg>
  );
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

export function Stars({ rating }: { rating: number }) {
  const full = Math.round(rating);
  return (
    <span className="stars" aria-label={`${rating} out of 5 stars`}>
      {'★'.repeat(full)}
      {'☆'.repeat(Math.max(0, 5 - full))}
    </span>
  );
}

export function ListingCard({
  listing,
  onOpen,
}: {
  listing: Listing;
  onOpen: (id: number) => void;
}) {
  return (
    <article className="listing-card" onClick={() => onOpen(listing.id)}>
      <div className={`listing-art ${artClass(listing.neighborhood)}`}>
        <span className="art-house">
          <HouseGlyph />
        </span>
        <span className="art-neighborhood">{listing.neighborhood}</span>
      </div>
      <div className="listing-body">
        <h3>{listing.title}</h3>
        <div className="price">
          ${listing.price_per_bedroom}
          <span> / bedroom / month</span>
        </div>
        <div className="meta">
          {listing.bedrooms} bed · {listing.bathrooms} bath · {listing.distance_min} min walk to campus
        </div>
        <div className="meta">{listing.address_label} · available {listing.available_from}</div>
        <div className="tags">
          {listing.furnished && <span className="tag">Furnished</span>}
          {listing.utilities_included && <span className="tag">Utilities included</span>}
          {listing.is_demo && <span className="tag demo">Demo listing</span>}
        </div>
        <div className="card-foot">
          <span className="meta">{listing.landlord_label}</span>
          <span aria-hidden="true">→</span>
        </div>
      </div>
    </article>
  );
}

export function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
