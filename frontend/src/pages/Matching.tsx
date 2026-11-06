import { useEffect, useState } from 'react';
import { api, NEIGHBORHOODS, type Match, type Questionnaire, type User } from '../lib/api';
import { initials } from '../components';

const EMPTY_Q: Questionnaire = {
  budget_min: 700,
  budget_max: 1000,
  neighborhoods: ['Collegetown'],
  move_in: '2026-08-15',
  bedrooms_needed: 2,
  sleep_schedule: 'night',
  cleanliness: 3,
  guests: 'occasional',
  smoking: 'no',
  study_habits: 'quiet',
  noise_tolerance: 3,
};

export default function Matching({ user }: { user: User }) {
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [draft, setDraft] = useState<Questionnaire>(EMPTY_Q);
  const [editing, setEditing] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [requestMsg, setRequestMsg] = useState<Record<number, string>>({});
  const [requestText, setRequestText] = useState<Record<number, string>>({});

  const loadMatches = async () => {
    try {
      const d = await api.matches();
      setMatches(d.matches);
    } catch (e: any) {
      setError(e.message || 'Could not load matches.');
    }
  };

  useEffect(() => {
    api
      .getQuestionnaire()
      .then((d) => {
        setQuestionnaire(d.questionnaire);
        if (d.questionnaire) {
          setDraft(d.questionnaire);
          loadMatches();
        } else {
          setEditing(true);
        }
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || 'Could not load your questionnaire.');
        setLoading(false);
      });
    void user;
  }, []);

  const toggleNeighborhood = (n: string) => {
    setDraft((d) => ({
      ...d,
      neighborhoods: d.neighborhoods.includes(n)
        ? d.neighborhoods.filter((x) => x !== n)
        : [...d.neighborhoods, n],
    }));
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setNotice('');
    try {
      const d = await api.saveQuestionnaire(draft);
      setQuestionnaire(d.questionnaire);
      setEditing(false);
      setNotice('Preferences saved. Here are your matches.');
      loadMatches();
    } catch (err: any) {
      setError(err.message || 'Could not save preferences.');
    }
  };

  const sendRequest = async (toUserId: number) => {
    try {
      await api.sendRequest(toUserId, requestText[toUserId] || '');
      setRequestMsg((m) => ({ ...m, [toUserId]: 'Request sent!' }));
      loadMatches();
    } catch (err: any) {
      setRequestMsg((m) => ({ ...m, [toUserId]: err.message || 'Could not send request.' }));
    }
  };

  if (loading) return <div className="empty">Loading…</div>;

  return (
    <div>
      <h1 className="serif" style={{ fontSize: 32, margin: '4px 0 6px' }}>Find roommates who fit</h1>
      <p style={{ color: 'var(--muted)', marginTop: 0 }}>
        Ten questions about how you actually live. Matches are scored out of 100 and every
        score shows its work — what lines up and what to talk about first.
      </p>
      {error && <div className="error">{error}</div>}
      {notice && <div className="notice">{notice}</div>}

      {(!questionnaire || editing) && (
        <form onSubmit={save} className="form-card">
          <h2 style={{ marginTop: 0 }}>{questionnaire ? 'Update your preferences' : 'Your housing preferences'}</h2>
          <div className="form-grid">
            <div className="field">
              <label htmlFor="q-min">Budget min ($ / month)</label>
              <input id="q-min" type="number" min={0} value={draft.budget_min} onChange={(e) => setDraft({ ...draft, budget_min: Number(e.target.value) })} />
            </div>
            <div className="field">
              <label htmlFor="q-max">Budget max ($ / month)</label>
              <input id="q-max" type="number" min={0} value={draft.budget_max} onChange={(e) => setDraft({ ...draft, budget_max: Number(e.target.value) })} />
            </div>
            <div className="field full">
              <label>Neighborhoods you would live in</label>
              <div className="pill-row">
                {NEIGHBORHOODS.map((n) => (
                  <button
                    type="button"
                    key={n}
                    className={`chip${draft.neighborhoods.includes(n) ? ' selected' : ''}`}
                    onClick={() => toggleNeighborhood(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div className="field">
              <label htmlFor="q-move">Move-in date</label>
              <input id="q-move" type="date" value={draft.move_in} onChange={(e) => setDraft({ ...draft, move_in: e.target.value })} />
            </div>
            <div className="field">
              <label htmlFor="q-beds">Bedrooms needed</label>
              <select id="q-beds" value={draft.bedrooms_needed} onChange={(e) => setDraft({ ...draft, bedrooms_needed: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="q-sleep">Sleep schedule</label>
              <select id="q-sleep" value={draft.sleep_schedule} onChange={(e) => setDraft({ ...draft, sleep_schedule: e.target.value as Questionnaire['sleep_schedule'] })}>
                <option value="early">Early bird</option>
                <option value="night">Night owl</option>
                <option value="flexible">Flexible</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="q-clean">Cleanliness (1 messy – 5 spotless)</label>
              <select id="q-clean" value={draft.cleanliness} onChange={(e) => setDraft({ ...draft, cleanliness: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="q-guests">Guests</label>
              <select id="q-guests" value={draft.guests} onChange={(e) => setDraft({ ...draft, guests: e.target.value as Questionnaire['guests'] })}>
                <option value="rare">Rarely</option>
                <option value="occasional">Occasionally</option>
                <option value="often">Often</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="q-smoke">Smoking</label>
              <select id="q-smoke" value={draft.smoking} onChange={(e) => setDraft({ ...draft, smoking: e.target.value as Questionnaire['smoking'] })}>
                <option value="no">Non-smoker</option>
                <option value="yes">Smoker</option>
                <option value="ok">Fine with smoking</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="q-study">Study habits</label>
              <select id="q-study" value={draft.study_habits} onChange={(e) => setDraft({ ...draft, study_habits: e.target.value as Questionnaire['study_habits'] })}>
                <option value="quiet">Quiet at home</option>
                <option value="social">Social at home</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="q-noise">Noise tolerance (1 low – 5 high)</label>
              <select id="q-noise" value={draft.noise_tolerance} onChange={(e) => setDraft({ ...draft, noise_tolerance: Number(e.target.value) })}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <option key={n} value={n}>{n}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-actions">
            <button className="btn" type="submit">Save & see matches</button>
            {questionnaire && (
              <button className="btn ghost" type="button" onClick={() => setEditing(false)}>Cancel</button>
            )}
          </div>
        </form>
      )}

      {questionnaire && !editing && (
        <div style={{ margin: '18px 0' }}>
          <button className="btn ghost small" onClick={() => setEditing(true)}>Edit my preferences</button>
        </div>
      )}

      {questionnaire && !editing && (
        <section className="section">
          <div className="section-head">
            <h2>Your matches</h2>
            <p>Best fit first. Scores are out of 100.</p>
          </div>
          <div className="rule" />
          {matches.length === 0 ? (
            <div className="empty">No other students have filled out the questionnaire yet. Check back soon — or invite a friend.</div>
          ) : (
            <div style={{ display: 'grid', gap: 16 }}>
              {matches.map((m) => (
                <div className="match-card" key={m.user.id}>
                  <div className="match-avatar" style={{ background: m.user.color || '#B31B1B' }}>
                    {initials(m.user.name)}
                  </div>
                  <div style={{ flex: '1 1 320px', minWidth: 0 }}>
                    <h3 style={{ margin: '0 0 2px' }}>{m.user.name}</h3>
                    <div className="meta" style={{ color: 'var(--muted)', fontSize: 14 }}>
                      {m.user.major} · Class of {m.user.grad_year}
                    </div>
                    <p style={{ margin: '8px 0' }}>{m.user.bio}</p>
                    {m.strengths.length > 0 && (
                      <div>
                        <strong style={{ fontSize: 13 }}>Why you match:</strong>
                        <ul className="why-list">
                          {m.strengths.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {m.watchOuts.length > 0 && (
                      <div style={{ marginTop: 6 }}>
                        <strong style={{ fontSize: 13 }} className="watch">Talk about first:</strong>
                        <ul className="why-list watch">
                          {m.watchOuts.map((s) => (
                            <li key={s}>{s}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <details style={{ marginTop: 10 }}>
                      <summary style={{ cursor: 'pointer', fontSize: 14, fontWeight: 700 }}>See the full score breakdown</summary>
                      <div style={{ marginTop: 8 }}>
                        {m.factors.map((f) => (
                          <div className="factor-row" key={f.key}>
                            <span>{f.label}</span>
                            <span className="factor-bar"><i style={{ width: `${(f.points / f.max) * 100}%` }} /></span>
                            <span className="pts">{f.points}/{f.max}</span>
                          </div>
                        ))}
                        <p style={{ fontSize: 13, color: 'var(--muted)' }}>
                          Budget 20 · Neighborhood 15 · Move-in 10 · Sleep 15 · Cleanliness 15 ·
                          Guests 10 · Smoking 5 · Study 5 · Noise 5
                        </p>
                      </div>
                    </details>
                    <div style={{ marginTop: 12 }}>
                      {m.request ? (
                        <span className="tag" style={{ fontSize: 13 }}>
                          {m.request.status === 'accepted'
                            ? '✓ Housemates — request accepted'
                            : m.request.status === 'declined'
                              ? 'Request declined'
                              : m.request.direction === 'outgoing'
                                ? 'Request sent — waiting for a reply'
                                : 'They sent you a request — see Requests'}
                        </span>
                      ) : (
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <input
                            placeholder="Say hi — mention a place or your schedule"
                            value={requestText[m.user.id] || ''}
                            onChange={(e) => setRequestText((t) => ({ ...t, [m.user.id]: e.target.value }))}
                            style={{ flex: '1 1 220px', border: '1px solid #cfc6b8', borderRadius: 9, padding: '9px 11px' }}
                          />
                          <button className="btn small" onClick={() => sendRequest(m.user.id)}>
                            Send roommate request
                          </button>
                        </div>
                      )}
                      {requestMsg[m.user.id] && (
                        <div style={{ fontSize: 13, marginTop: 6 }}>{requestMsg[m.user.id]}</div>
                      )}
                    </div>
                  </div>
                  <div className="score-ring">
                    <div className="score-num">{m.score}</div>
                    <div className="score-label">/ 100 match</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
