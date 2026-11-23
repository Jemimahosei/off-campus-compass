import { useEffect, useState } from 'react';
import { api, NEIGHBORHOODS, type Match, type Questionnaire, type User } from '../lib/api';
import { formatDate, initials, money } from '../components';

/* --- mappings between the mockup's chip labels and the API's enum values --- */

const SLEEP_LABELS: Record<Questionnaire['sleep_schedule'], string> = {
  early: 'Early riser',
  night: 'Night owl',
  flexible: 'Flexible',
};
const GUEST_LABELS: Record<Questionnaire['guests'], string> = {
  rare: 'Rarely',
  occasional: 'Sometimes',
  often: 'Often',
};
const SMOKE_LABELS: Record<Questionnaire['smoking'], string> = {
  no: 'No',
  yes: 'Smoker',
  ok: 'Fine with me',
};
const STUDY_LABELS: Record<Questionnaire['study_habits'], string> = {
  quiet: 'Quiet at home',
  social: 'With other people',
};
/* The mockup offers four preset move-in dates instead of a date picker. */
const MOVE_OPTIONS = [
  { label: 'Jun 1', md: '06-01' },
  { label: 'Aug 1', md: '08-01' },
  { label: 'Aug 15', md: '08-15' },
  { label: 'Sep 1', md: '09-01' },
];

function moveLabel(iso: string): string {
  const m = /^\d{4}-(\d{2}-\d{2})/.exec(iso || '');
  const hit = m ? MOVE_OPTIONS.find((o) => o.md === m[1]) : undefined;
  return hit ? hit.label : formatDate(iso);
}

function moveToIso(label: string, currentIso: string): string {
  const opt = MOVE_OPTIONS.find((o) => o.label === label);
  if (!opt) return currentIso;
  const year = /^\d{4}/.exec(currentIso || '')?.[0] || '2026';
  return `${year}-${opt.md}`;
}

const CLEAN_WORDS = ['', 'Relaxed', 'Fairly relaxed', 'Middle of the road', 'Tidy', 'Spotless'];

const EMPTY_Q: Questionnaire = {
  budget_min: 1000,
  budget_max: 1500,
  neighborhoods: ['Collegetown'],
  move_in: '2026-08-15',
  bedrooms_needed: 2,
  sleep_schedule: 'night',
  cleanliness: 4,
  guests: 'occasional',
  smoking: 'no',
  study_habits: 'quiet',
  noise_tolerance: 3,
};

function Chip({
  on,
  onClick,
  children,
  minWidth,
}: {
  on: boolean;
  onClick: () => void;
  children: React.ReactNode;
  minWidth?: number;
}) {
  return (
    <button
      type="button"
      className={on ? 'chip selected' : 'chip'}
      style={minWidth ? { minWidth } : undefined}
      aria-pressed={on}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export default function Matching({ user }: { user: User }) {
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [draft, setDraft] = useState<Questionnaire>(EMPTY_Q);
  const [editing, setEditing] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [openId, setOpenId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [requestMsg, setRequestMsg] = useState<Record<number, string>>({});
  const [requestText, setRequestText] = useState<Record<number, string>>({});

  const loadMatches = async () => {
    try {
      const d = await api.matches();
      setMatches(d.matches);
      setOpenId((cur) => cur ?? (d.matches.length > 0 ? d.matches[0].user.id : null));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const touch = () => {
    setError('');
    setNotice('');
  };

  const toggleNeighborhood = (n: string) => {
    touch();
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
    if (draft.budget_max < draft.budget_min) {
      setError('Your highest budget is below your lowest. Swap them or raise the highest.');
      return;
    }
    if (draft.neighborhoods.length === 0) {
      setError('Pick at least one neighborhood so we can match you.');
      return;
    }
    try {
      const d = await api.saveQuestionnaire(draft);
      setQuestionnaire(d.questionnaire);
      setEditing(false);
      setNotice('Answers saved. Your matches are updated.');
      loadMatches();
    } catch (err: any) {
      setError(err.message || 'Could not save preferences.');
    }
  };

  const sendRequest = async (toUserId: number) => {
    try {
      await api.sendRequest(toUserId, requestText[toUserId] || '');
      setRequestMsg((m) => ({ ...m, [toUserId]: '' }));
      loadMatches();
    } catch (err: any) {
      setRequestMsg((m) => ({ ...m, [toUserId]: err.message || 'Could not send request.' }));
    }
  };

  if (loading)
    return (
      <div className="container">
        <div className="empty">Loading…</div>
      </div>
    );

  /* ---------------- Ten questions (mockup screen 7) ---------------- */
  if (!questionnaire || editing) {
    return (
      <div className="container narrow">
        <h1 className="page-title">Ten questions about how you live</h1>
        <p className="page-sub">
          Two minutes. Your answers are only used to score matches, and you can change them
          any time.
        </p>
        {notice && (
          <div role="status" className="notice">
            <span>{notice}</span>
            <a
              href="#/matching"
              onClick={(e) => {
                e.preventDefault();
                setEditing(false);
              }}
            >
              See my matches
            </a>
          </div>
        )}
        {error && (
          <div role="alert" className="error">
            {error}
          </div>
        )}

        <form className="q-form" onSubmit={save}>
          <fieldset className="q-group">
            <legend>Money and place</legend>
            <div className="q first">1. Monthly budget</div>
            <div className="budget-row">
              <label>
                <span>Lowest</span>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={draft.budget_min}
                  onChange={(e) => {
                    touch();
                    setDraft({ ...draft, budget_min: Number(e.target.value) });
                  }}
                />
              </label>
              <label>
                <span>Highest</span>
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={draft.budget_max}
                  onChange={(e) => {
                    touch();
                    setDraft({ ...draft, budget_max: Number(e.target.value) });
                  }}
                />
              </label>
            </div>

            <div className="q" id="q2">2. Neighborhoods you would live in</div>
            <div role="group" aria-labelledby="q2" className="chiprow">
              {NEIGHBORHOODS.map((n) => (
                <Chip key={n} on={draft.neighborhoods.includes(n)} onClick={() => toggleNeighborhood(n)}>
                  {n}
                </Chip>
              ))}
            </div>

            <div className="q" id="q3">3. When do you want to move in?</div>
            <div role="group" aria-labelledby="q3" className="chiprow">
              {MOVE_OPTIONS.map((o) => (
                <Chip
                  key={o.label}
                  on={moveLabel(draft.move_in) === o.label}
                  onClick={() => {
                    touch();
                    setDraft({ ...draft, move_in: moveToIso(o.label, draft.move_in) });
                  }}
                >
                  {o.label}
                </Chip>
              ))}
            </div>

            <div className="q" id="q4">4. Bedrooms you need</div>
            <div role="group" aria-labelledby="q4" className="chiprow">
              {[1, 2, 3, 4].map((n) => (
                <Chip
                  key={n}
                  minWidth={56}
                  on={draft.bedrooms_needed === n}
                  onClick={() => {
                    touch();
                    setDraft({ ...draft, bedrooms_needed: n });
                  }}
                >
                  {n}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset className="q-group">
            <legend>Daily rhythm</legend>
            <div className="q first" id="q5">5. Sleep schedule</div>
            <div role="group" aria-labelledby="q5" className="chiprow">
              {(Object.keys(SLEEP_LABELS) as Questionnaire['sleep_schedule'][]).map((k) => (
                <Chip
                  key={k}
                  on={draft.sleep_schedule === k}
                  onClick={() => {
                    touch();
                    setDraft({ ...draft, sleep_schedule: k });
                  }}
                >
                  {SLEEP_LABELS[k]}
                </Chip>
              ))}
            </div>

            <div className="q" id="q6">
              6. How tidy do you keep shared space?{' '}
              <span className="q-hint">1 is relaxed, 5 is spotless</span>
            </div>
            <div role="group" aria-labelledby="q6" className="chiprow">
              {[1, 2, 3, 4, 5].map((n) => (
                <Chip
                  key={n}
                  minWidth={56}
                  on={draft.cleanliness === n}
                  onClick={() => {
                    touch();
                    setDraft({ ...draft, cleanliness: n });
                  }}
                >
                  {n}
                </Chip>
              ))}
            </div>

            <div className="q" id="q7">
              7. How much noise is fine at home?{' '}
              <span className="q-hint">1 is library quiet, 5 is anything goes</span>
            </div>
            <div role="group" aria-labelledby="q7" className="chiprow">
              {[1, 2, 3, 4, 5].map((n) => (
                <Chip
                  key={n}
                  minWidth={56}
                  on={draft.noise_tolerance === n}
                  onClick={() => {
                    touch();
                    setDraft({ ...draft, noise_tolerance: n });
                  }}
                >
                  {n}
                </Chip>
              ))}
            </div>
          </fieldset>

          <fieldset className="q-group">
            <legend>Home life</legend>
            <div className="q first" id="q8">8. Guests</div>
            <div role="group" aria-labelledby="q8" className="chiprow">
              {(Object.keys(GUEST_LABELS) as Questionnaire['guests'][]).map((k) => (
                <Chip
                  key={k}
                  on={draft.guests === k}
                  onClick={() => {
                    touch();
                    setDraft({ ...draft, guests: k });
                  }}
                >
                  {GUEST_LABELS[k]}
                </Chip>
              ))}
            </div>

            <div className="q" id="q9">9. Smoking at home</div>
            <div role="group" aria-labelledby="q9" className="chiprow">
              {(['no', 'ok'] as Questionnaire['smoking'][]).map((k) => (
                <Chip
                  key={k}
                  on={draft.smoking === k}
                  onClick={() => {
                    touch();
                    setDraft({ ...draft, smoking: k });
                  }}
                >
                  {SMOKE_LABELS[k]}
                </Chip>
              ))}
            </div>

            <div className="q" id="q10">10. Where do you study?</div>
            <div role="group" aria-labelledby="q10" className="chiprow">
              {(Object.keys(STUDY_LABELS) as Questionnaire['study_habits'][]).map((k) => (
                <Chip
                  key={k}
                  on={draft.study_habits === k}
                  onClick={() => {
                    touch();
                    setDraft({ ...draft, study_habits: k });
                  }}
                >
                  {STUDY_LABELS[k]}
                </Chip>
              ))}
            </div>
          </fieldset>

          <div className="q-actions">
            <button type="submit" className="btn">
              Save and see matches
            </button>
            {questionnaire && (
              <button type="button" className="btn ghost" onClick={() => setEditing(false)}>
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  /* ---------------- Matches (mockup screen 4) ---------------- */
  const q = questionnaire;
  const isDemo = user.email.endsWith('.demo');
  return (
    <div className="container">
      <h1 className="page-title" style={{ fontSize: 40 }}>
        Roommates who fit
      </h1>
      <p className="page-sub">
        Scores are out of 100 and every one shows its work. Best fit first.
        {isDemo ? ' These are example scores for the demo account.' : ''}
      </p>
      {error && (
        <div role="alert" className="error">
          {error}
        </div>
      )}
      {notice && (
        <div role="status" className="notice">
          <span>{notice}</span>
        </div>
      )}

      <div className="matches-cols">
        <aside className="answers-card">
          <h2>Your answers</h2>
          <dl>
            <div>
              <dt>Budget</dt>
              <dd className="num">
                {money(q.budget_min)} to {money(q.budget_max)} a month
              </dd>
            </div>
            <div>
              <dt>Neighborhoods</dt>
              <dd>{q.neighborhoods.join(', ')}</dd>
            </div>
            <div>
              <dt>Move in</dt>
              <dd>
                {formatDate(q.move_in)}, {q.bedrooms_needed} bedroom{q.bedrooms_needed === 1 ? '' : 's'}
              </dd>
            </div>
            <div>
              <dt>Sleep</dt>
              <dd>{SLEEP_LABELS[q.sleep_schedule]}</dd>
            </div>
            <div>
              <dt>Home life</dt>
              <dd>
                {CLEAN_WORDS[q.cleanliness] ?? q.cleanliness},{' '}
                {q.guests === 'rare'
                  ? 'rare guests'
                  : q.guests === 'occasional'
                    ? 'occasional guests'
                    : 'frequent guests'}
                , {q.smoking === 'no' ? 'no smoking' : q.smoking === 'yes' ? 'smoker' : 'fine with smoking'},{' '}
                {q.study_habits === 'quiet' ? 'quiet study' : 'studies with others'}
              </dd>
            </div>
          </dl>
          <button
            type="button"
            className="btn ghost"
            style={{ marginTop: 18, minHeight: 44, padding: '0 18px' }}
            onClick={() => {
              setDraft(q);
              setEditing(true);
            }}
          >
            Edit answers
          </button>
        </aside>

        <div className="match-list">
          {matches.length === 0 ? (
            <div className="empty" style={{ border: 0 }}>
              No other students have filled out the questionnaire yet. Check back soon — or
              invite a friend.
            </div>
          ) : (
            matches.map((m) => {
              const open = openId === m.user.id;
              const first = m.user.name.split(' ')[0];
              return (
                <div key={m.user.id} className={`match-row${open ? ' open' : ''}`}>
                  <button
                    type="button"
                    className="m-head"
                    aria-expanded={open}
                    onClick={() => setOpenId(open ? null : m.user.id)}
                  >
                    <span className="avatar sm">{initials(m.user.name)}</span>
                    <span className="who">
                      <span className="n">{m.user.name}</span>
                      <span className="d">
                        {m.user.major}, class of {m.user.grad_year}
                      </span>
                    </span>
                    <span className="sc">
                      <span className="n num">{m.score}</span>
                      <span className="of">out of 100</span>
                    </span>
                  </button>
                  {open && (
                    <div className="match-open">
                      {m.user.bio && <p className="bio">{m.user.bio}</p>}
                      <div className="why-cols">
                        {m.strengths.length > 0 && (
                          <div>
                            <div className="h">Why you match</div>
                            <ul>
                              {m.strengths.map((s) => (
                                <li key={s}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {m.watchOuts.length > 0 && (
                          <div className="talk">
                            <div className="h">Talk about first</div>
                            <ul>
                              {m.watchOuts.map((s) => (
                                <li key={s}>{s}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>

                      <div className="breakdown-h">Score breakdown</div>
                      <div className="factor-rows">
                        {m.factors.map((f) => (
                          <div className="factor-row" key={f.key}>
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

                      <div className="request-area">
                        {m.request ? (
                          <div role="status" className="request-sent">
                            {m.request.status === 'accepted'
                              ? '✓ Housemates — request accepted'
                              : m.request.status === 'declined'
                                ? 'Request declined'
                                : m.request.direction === 'outgoing'
                                  ? `Request sent. Waiting for a reply from ${first}.`
                                  : `${first} sent you a request — see Requests.`}
                          </div>
                        ) : (
                          <div className="request-form">
                            <label>
                              <span className="sr-only">Message to {first}</span>
                              <input
                                type="text"
                                placeholder="Say hi and mention a place or your schedule"
                                value={requestText[m.user.id] || ''}
                                onChange={(e) =>
                                  setRequestText((t) => ({ ...t, [m.user.id]: e.target.value }))
                                }
                              />
                            </label>
                            <button type="button" className="btn" onClick={() => sendRequest(m.user.id)}>
                              Send roommate request
                            </button>
                          </div>
                        )}
                        {requestMsg[m.user.id] && <div className="request-msg">{requestMsg[m.user.id]}</div>}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
