import { useEffect, useState } from 'react';
import { api, type RoommateRequest, type User } from '../lib/api';

export default function Requests() {
  const [incoming, setIncoming] = useState<RoommateRequest[]>([]);
  const [outgoing, setOutgoing] = useState<RoommateRequest[]>([]);
  const [housemates, setHousemates] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = () => {
    Promise.all([api.requests(), api.housemates()])
      .then(([r, h]) => {
        setIncoming(r.incoming);
        setOutgoing(r.outgoing);
        setHousemates(h.housemates);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Could not load requests.');
        setLoading(false);
      });
  };

  useEffect(load, []);

  const act = async (id: number, kind: 'accept' | 'decline') => {
    try {
      if (kind === 'accept') await api.acceptRequest(id);
      else await api.declineRequest(id);
      load();
    } catch (e: any) {
      setError(e.message || 'Could not update request.');
    }
  };

  if (loading) return <div className="empty">Loading…</div>;

  return (
    <div>
      <h1 className="serif" style={{ fontSize: 32, margin: '4px 0 6px' }}>Roommate requests</h1>
      {error && <div className="error">{error}</div>}

      {housemates.length > 0 && (
        <section className="section">
          <h2 className="serif">Your housemates</h2>
          <div className="rule" />
          <div className="pill-row">
            {housemates.map((h) => (
              <span key={h.id} className="chip selected">✓ {h.name} · {h.major}</span>
            ))}
          </div>
        </section>
      )}

      <section className="section">
        <h2 className="serif">Requests for you</h2>
        <div className="rule" />
        {incoming.length === 0 ? (
          <div className="empty">No one has sent you a roommate request yet.</div>
        ) : (
          incoming.map((r) => (
            <div className="panel" key={r.id} style={{ marginBottom: 12 }}>
              <strong>{r.from_name}</strong>
              <span style={{ color: 'var(--muted)' }}> · {r.from_major} · Class of {r.from_grad_year}</span>
              <p style={{ margin: '8px 0' }}>{r.message || 'Wants to be roommates.'}</p>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                {r.status === 'pending' ? (
                  <>
                    <button className="btn small" onClick={() => act(r.id, 'accept')}>Accept</button>
                    <button className="btn ghost small" onClick={() => act(r.id, 'decline')}>Decline</button>
                  </>
                ) : (
                  <span className="tag">{r.status === 'accepted' ? '✓ Accepted' : 'Declined'}</span>
                )}
                <span style={{ fontSize: 13, color: 'var(--muted)' }}>{new Date(r.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))
        )}
      </section>

      <section className="section">
        <h2 className="serif">Requests you sent</h2>
        <div className="rule" />
        {outgoing.length === 0 ? (
          <div className="empty">You have not sent any roommate requests yet. Find matches first.</div>
        ) : (
          outgoing.map((r) => (
            <div className="panel" key={r.id} style={{ marginBottom: 12 }}>
              <strong>{r.to_name}</strong>
              <span style={{ color: 'var(--muted)' }}> · {r.to_major} · Class of {r.to_grad_year}</span>
              <p style={{ margin: '8px 0' }}>{r.message || 'No message.'}</p>
              <span className="tag">
                {r.status === 'pending' ? 'Waiting for a reply' : r.status === 'accepted' ? '✓ Accepted — housemates!' : 'Declined'}
              </span>
            </div>
          ))
        )}
      </section>
    </div>
  );
}
