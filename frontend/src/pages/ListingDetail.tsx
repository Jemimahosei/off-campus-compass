import { useEffect, useState } from 'react';
import { api, type Listing, type Review, type User } from '../lib/api';
import { BookmarkIcon, SchematicMap, formatDate, money } from '../components';
import { go } from '../App';

const BED_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five'];

export default function ListingDetail({ id, user }: { id: number; user: User | null }) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [bookmarked, setBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewNotice, setReviewNotice] = useState('');

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

  const toggleSave = async () => {
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
      setError(e.message || 'Could not save this place.');
    }
  };

  const postReview = async () => {
    setReviewError('');
    setReviewNotice('');
    if (!rating) {
      setReviewError('Pick a rating from 1 to 5.');
      return;
    }
    if (comment.trim().length < 10) {
      setReviewError('Add a sentence or two so the next renter knows what to expect.');
      return;
    }
    try {
      await api.postReview(id, { rating, comment: comment.trim() });
      setRating(0);
      setComment('');
      setReviewNotice('Review posted.');
      load();
    } catch (err: any) {
      setReviewError(err.message || 'Could not post review.');
    }
  };

  if (loading) return <div className="container"><div className="empty">Loading…</div></div>;
  if (error || !listing)
    return (
      <div className="container">
        <div className="error">{error || 'Listing not found.'}</div>
      </div>
    );

  const dist = [5, 4, 3, 2, 1]
    .map((star) => ({ star, count: reviews.filter((r) => r.rating === star).length }))
    .filter((d) => d.star >= 3 || d.count > 0);
  const roommatesNeeded = Math.max(0, listing.bedrooms - 1);

  return (
    <div className="container">
      <nav className="crumb" aria-label="Breadcrumb">
        <a
          href="#/browse"
          onClick={(e) => {
            e.preventDefault();
            go('browse');
          }}
        >
          Housing
        </a>{' '}
        / {listing.neighborhood} / {listing.title}
      </nav>

      <div className="detail-cols">
        <div className="detail-main">
          <h1>{listing.title}</h1>
          <p className="detail-sub">
            {listing.address_label}, {listing.neighborhood}. Available {formatDate(listing.available_from)}.
            {listing.is_demo ? ' Demo listing, fictional.' : ''}
          </p>

          <div className="price-line">
            <div>
              <span className="big num">{money(listing.price_per_bedroom)}</span>{' '}
              <span className="per">a bedroom each month</span>
            </div>
            <div className="num" style={{ color: 'var(--muted)' }}>
              {money(listing.price_per_bedroom * listing.bedrooms)} for the whole unit
            </div>
          </div>

          <dl className="facts">
            <div>
              <dt>Bedrooms</dt>
              <dd className="num">{listing.bedrooms}</dd>
            </div>
            <div>
              <dt>Bathrooms</dt>
              <dd className="num">{listing.bathrooms}</dd>
            </div>
            <div>
              <dt>Walk to the Arts Quad</dt>
              <dd className="num">{listing.distance_min} min</dd>
            </div>
            <div>
              <dt>Furnished</dt>
              <dd>{listing.furnished ? 'Yes' : 'No'}</dd>
            </div>
            <div>
              <dt>Utilities</dt>
              <dd>{listing.utilities_included ? 'Included' : 'Not included'}</dd>
            </div>
            <div>
              <dt>Landlord</dt>
              <dd style={{ fontSize: 17 }}>{listing.landlord_label}</dd>
            </div>
          </dl>

          <h2>About this place</h2>
          <p className="about">{listing.description}</p>

          <h2>What comes with it</h2>
          {listing.amenities.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 18 }}>No amenities listed.</p>
          ) : (
            <ul className="amen">
              {listing.amenities.map((a) => (
                <li key={a}>{a}</li>
              ))}
            </ul>
          )}

          <h2 style={{ marginTop: 44 }}>What past tenants say about the landlord</h2>
          {reviews.length === 0 ? (
            <p style={{ color: 'var(--muted)', fontSize: 18 }}>
              No reviews yet — be the first to share what it is like renting here.
            </p>
          ) : (
            <>
              <div className="rating-head">
                <div>
                  <span className="big num">{avgRating !== null ? avgRating.toFixed(1) : '—'}</span>{' '}
                  <span className="of">
                    out of 5, from {reviews.length} review{reviews.length === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="dist">
                  {dist.map((d) => (
                    <div className="dist-row" key={d.star}>
                      <span className="num">{d.star} stars</span>
                      <span className="factor-bar">
                        <i style={{ width: `${reviews.length ? (d.count / reviews.length) * 100 : 0}%` }} />
                      </span>
                      <span className="num">{d.count}</span>
                    </div>
                  ))}
                </div>
              </div>
              {reviews.map((r) => (
                <div className="review" key={r.id}>
                  <div className="who">
                    {r.reviewer_name}{' '}
                    <span className="r num">{r.rating} out of 5</span>
                  </div>
                  <p>{r.comment}</p>
                </div>
              ))}
            </>
          )}

          <form
            className="review-form"
            onSubmit={(e) => {
              e.preventDefault();
              if (user) postReview();
              else go('login');
            }}
          >
            <div className="t">Rented here? Rate the landlord.</div>
            <div style={{ fontWeight: 600, fontSize: 15, marginTop: 12 }} id="rl">
              Your rating
            </div>
            <div role="group" aria-labelledby="rl" style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={rating === n ? 'chip selected' : 'chip'}
                  style={{ minWidth: 44 }}
                  aria-pressed={rating === n}
                  onClick={() => {
                    setRating(n);
                    setReviewError('');
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
            <label htmlFor="cm">What was it like?</label>
            <textarea
              id="cm"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Repairs, deposit, how quickly they replied"
            />
            {reviewError && (
              <div role="alert" className="error">
                {reviewError}
              </div>
            )}
            {reviewNotice && (
              <div role="status" className="notice">
                {reviewNotice}
              </div>
            )}
            <button type="submit" className="btn" style={{ marginTop: 14, padding: '0 24px' }}>
              Post review
            </button>
            {!user && (
              <p style={{ margin: '12px 0 0', fontSize: 15, color: 'var(--muted)' }}>
                You will be asked to log in first — reviews are posted under your name.
              </p>
            )}
          </form>
        </div>

        <aside className="detail-aside">
          <div className="aside-card">
            <SchematicMap listings={[listing]} selectedId={listing.id} crop />
            <div className="cap">
              {listing.distance_min} min walk to the Arts Quad. Schematic map, not to scale.
            </div>
          </div>
          <div className="save-card">
            <button
              type="button"
              className={`save-btn${bookmarked ? ' saved' : ''}`}
              aria-pressed={bookmarked}
              onClick={toggleSave}
            >
              <BookmarkIcon filled={bookmarked} />
              {bookmarked ? 'Saved' : 'Save this place'}
            </button>
            <button type="button" className="btn block" style={{ minHeight: 52, fontSize: 17 }} onClick={() => go('matching')}>
              Find roommates for this place
            </button>
            <p>
              {roommatesNeeded > 0
                ? `${BED_WORDS[listing.bedrooms] ?? listing.bedrooms} bedrooms means ${BED_WORDS[roommatesNeeded] ?? roommatesNeeded} roommate${roommatesNeeded === 1 ? '' : 's'}. Matches are scored out of 100 on how you actually live.`
                : 'One bedroom means no roommate needed for this place. Matches are scored out of 100 on how you actually live.'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
