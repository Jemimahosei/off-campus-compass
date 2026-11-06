import { useEffect, useState } from 'react';
import { api, type Listing, type Review, type User } from '../lib/api';
import { artClass, HouseGlyph, Stars } from '../components';
import { go } from '../App';

export default function ListingDetail({ id, user }: { id: number; user: User | null }) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewMsg, setReviewMsg] = useState('');

  const load = () => {
    setLoading(true);
    api
      .listing(id)
      .then((d) => {
        setListing(d.listing);
        setReviews(d.reviews);
        setAvgRating(d.avgRating);
        setBookmarked(d.bookmarked);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Could not load this listing.');
        setLoading(false);
      });
  };

  useEffect(load, [id]);

  const toggleBookmark = async () => {
    if (!user) {
      go('login');
      return;
    }
    try {
      if (bookmarked) {
        await api.removeBookmark(id);
        setBookmarked(false);
      } else {
        await api.addBookmark(id);
        setBookmarked(true);
      }
    } catch (e: any) {
      setError(e.message || 'Could not save bookmark.');
    }
  };

  const submitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    setReviewMsg('');
    try {
      await api.postReview(id, { rating, comment });
      setComment('');
      setReviewMsg('Thanks — your review is posted.');
      load();
    } catch (err: any) {
      setReviewMsg(err.message || 'Could not post review.');
    }
  };

  if (loading) return <div className="empty">Loading…</div>;
  if (error || !listing) return <div className="error">{error || 'Listing not found.'}</div>;

  return (
    <div>
      <div className={`detail-art ${artClass(listing.neighborhood)}`}>
        <span style={{ position: 'absolute', right: 18, top: 16 }}>
          <HouseGlyph />
        </span>
        <h1>{listing.title}</h1>
      </div>

      <div className="two-col" style={{ marginTop: 20 }}>
        <div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'baseline', flexWrap: 'wrap' }}>
            <span className="price" style={{ fontSize: 28 }}>${listing.price_per_bedroom}<span> / bedroom / month</span></span>
            {avgRating !== null && (
              <span><Stars rating={avgRating} /> {avgRating.toFixed(1)} from {reviews.length} review{reviews.length === 1 ? '' : 's'}</span>
            )}
          </div>
          <p style={{ fontSize: 17 }}>{listing.description}</p>

          <div className="tags" style={{ margin: '10px 0' }}>
            {listing.furnished && <span className="tag">Furnished</span>}
            {listing.utilities_included && <span className="tag">Utilities included</span>}
            {listing.is_demo && <span className="tag demo">Demo listing — fictional, for trying the site</span>}
          </div>

          <h2 className="serif">Amenities</h2>
          {listing.amenities.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No amenities listed.</p>
          ) : (
            <ul>
              {listing.amenities.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}

          <h2 className="serif" style={{ marginTop: 28 }}>Landlord reviews</h2>
          {reviews.length === 0 ? (
            <p style={{ color: 'var(--muted)' }}>No reviews yet — be the first to share what it is like renting here.</p>
          ) : (
            reviews.map((r) => (
              <div className="review" key={r.id}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <Stars rating={r.rating} />
                  <strong>{r.reviewer_name}</strong>
                </div>
                <p style={{ margin: '6px 0 0' }}>{r.comment}</p>
              </div>
            ))
          )}

          {user ? (
            <form onSubmit={submitReview} className="form-card" style={{ marginTop: 18 }}>
              <h3 style={{ marginTop: 0 }}>Review this landlord</h3>
              <div className="form-grid">
                <div className="field">
                  <label htmlFor="rev-rating">Rating</label>
                  <select id="rev-rating" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} star{n === 1 ? '' : 's'}</option>
                    ))}
                  </select>
                </div>
                <div className="field full">
                  <label htmlFor="rev-comment">What should other students know?</label>
                  <textarea id="rev-comment" value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Deposit returned? Repairs fast? Noisy at night?" />
                </div>
              </div>
              <div className="form-actions">
                <button className="btn" type="submit">Post review</button>
                {reviewMsg && <span style={{ fontSize: 14 }}>{reviewMsg}</span>}
              </div>
            </form>
          ) : (
            <p style={{ marginTop: 18 }}>
              <a href="#/login" onClick={(e) => { e.preventDefault(); go('login'); }}>Log in</a> to review this landlord.
            </p>
          )}
        </div>

        <aside className="panel">
          <h3>The details</h3>
          <dl className="kv">
            <dt>Neighborhood</dt><dd>{listing.neighborhood}</dd>
            <dt>Area</dt><dd>{listing.address_label}</dd>
            <dt>Bed / Bath</dt><dd>{listing.bedrooms} bed · {listing.bathrooms} bath</dd>
            <dt>Walk to campus</dt><dd>{listing.distance_min} minutes</dd>
            <dt>Available</dt><dd>{listing.available_from}</dd>
            <dt>Landlord</dt><dd>{listing.landlord_label}</dd>
          </dl>
          <div style={{ display: 'flex', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
            <button className="btn" onClick={toggleBookmark}>
              {bookmarked ? '★ Saved' : '☆ Save this place'}
            </button>
            <button className="btn ghost" onClick={() => go('matching')}>Find roommates for it</button>
          </div>
          {listing.is_demo && (
            <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 14 }}>
              Demo listing: the place, landlord and address are fictional. Real listings
              posted by students appear here the same way.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
