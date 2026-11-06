import { useEffect, useState } from 'react';
import { api, type Questionnaire, type User } from '../lib/api';
import { initials } from '../components';
import { go } from '../App';

export default function Profile({ user, onUserChange }: { user: User; onUserChange: (u: User) => void }) {
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null);
  const [housemates, setHousemates] = useState<User[]>([]);
  void onUserChange;

  useEffect(() => {
    api.getQuestionnaire().then((d) => setQuestionnaire(d.questionnaire)).catch(() => undefined);
    api.housemates().then((d) => setHousemates(d.housemates)).catch(() => undefined);
  }, []);

  return (
    <div>
      <h1 className="serif" style={{ fontSize: 32, margin: '4px 0 6px' }}>Your profile</h1>
      <div className="panel" style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="match-avatar" style={{ background: user.color || '#B31B1B', width: 72, height: 72, fontSize: 30 }}>
          {initials(user.name)}
        </div>
        <div>
          <h2 style={{ margin: 0 }}>{user.name}</h2>
          <div style={{ color: 'var(--muted)' }}>
            {user.major} {user.grad_year ? `· Class of ${user.grad_year}` : ''} · {user.email}
          </div>
          {user.bio && <p style={{ margin: '8px 0 0' }}>{user.bio}</p>}
        </div>
      </div>

      <section className="section">
        <h2 className="serif">Housing preferences</h2>
        <div className="rule" />
        {questionnaire ? (
          <div className="panel">
            <dl className="kv">
              <dt>Budget</dt><dd>${questionnaire.budget_min} – ${questionnaire.budget_max} / month</dd>
              <dt>Neighborhoods</dt><dd>{questionnaire.neighborhoods.join(', ')}</dd>
              <dt>Move-in</dt><dd>{questionnaire.move_in}</dd>
              <dt>Bedrooms</dt><dd>{questionnaire.bedrooms_needed}</dd>
              <dt>Sleep</dt><dd>{questionnaire.sleep_schedule}</dd>
              <dt>Cleanliness</dt><dd>{questionnaire.cleanliness} / 5</dd>
              <dt>Guests</dt><dd>{questionnaire.guests}</dd>
              <dt>Smoking</dt><dd>{questionnaire.smoking === 'no' ? 'Non-smoker' : questionnaire.smoking === 'yes' ? 'Smoker' : 'Fine with smoking'}</dd>
              <dt>Study</dt><dd>{questionnaire.study_habits}</dd>
              <dt>Noise tolerance</dt><dd>{questionnaire.noise_tolerance} / 5</dd>
            </dl>
            <div style={{ marginTop: 14 }}>
              <button className="btn ghost small" onClick={() => go('matching')}>Edit preferences / see matches</button>
            </div>
          </div>
        ) : (
          <div className="empty">
            You have not filled out the housing questionnaire yet.
            <div style={{ marginTop: 10 }}>
              <button className="btn small" onClick={() => go('matching')}>Answer 10 questions</button>
            </div>
          </div>
        )}
      </section>

      {housemates.length > 0 && (
        <section className="section">
          <h2 className="serif">Your housemates</h2>
          <div className="rule" />
          <div className="pill-row">
            {housemates.map((h) => (
              <span key={h.id} className="chip selected">✓ {h.name}</span>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
