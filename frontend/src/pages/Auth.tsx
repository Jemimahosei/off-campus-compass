import { useState } from 'react';
import { api, DEMO_ACCOUNTS, saveAuth, type User } from '../lib/api';
import { go } from '../App';

export default function Auth({
  mode,
  onAuth,
  notice,
}: {
  mode: 'login' | 'register';
  onAuth: (u: User) => void;
  notice?: string;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [major, setMajor] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const d =
        mode === 'login'
          ? await api.login(email, password)
          : await api.register({ name, email, password, major, grad_year: gradYear });
      saveAuth(d.token, d.user);
      onAuth(d.user);
      go('');
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setBusy(false);
    }
  };

  const fillDemo = async (demoEmail: string, demoPassword: string) => {
    setError('');
    setBusy(true);
    try {
      const d = await api.login(demoEmail, demoPassword);
      saveAuth(d.token, d.user);
      onAuth(d.user);
      go('');
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="form-card" style={{ margin: '20px auto', maxWidth: 520 }}>
        <h2 style={{ marginTop: 0 }}>{mode === 'login' ? 'Welcome back' : 'Create your account'}</h2>
        <p style={{ color: 'var(--muted)', marginTop: 0 }}>
          {mode === 'login'
            ? 'Log in to save places, match with roommates, and send requests.'
            : 'One account for housing search and roommate matching. Cornell students only, in spirit — be kind.'}
        </p>
        {notice && <div className="notice">{notice}</div>}
        {error && <div className="error">{error}</div>}
        <form onSubmit={submit}>
          <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
            {mode === 'register' && (
              <div className="field">
                <label htmlFor="a-name">Full name</label>
                <input id="a-name" value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
            )}
            <div className="field">
              <label htmlFor="a-email">Email</label>
              <input id="a-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="field">
              <label htmlFor="a-pass">Password</label>
              <input id="a-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>
            {mode === 'register' && (
              <>
                <div className="field">
                  <label htmlFor="a-major">Major (optional)</label>
                  <input id="a-major" value={major} onChange={(e) => setMajor(e.target.value)} placeholder="e.g. Information Science" />
                </div>
                <div className="field">
                  <label htmlFor="a-year">Class year (optional)</label>
                  <input id="a-year" value={gradYear} onChange={(e) => setGradYear(e.target.value)} placeholder="e.g. 2027" />
                </div>
              </>
            )}
          </div>
          <div className="form-actions">
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
            </button>
            {mode === 'login' ? (
              <button type="button" className="btn ghost" onClick={() => go('register')}>Create an account instead</button>
            ) : (
              <button type="button" className="btn ghost" onClick={() => go('login')}>Log in instead</button>
            )}
          </div>
        </form>
      </div>

      <div className="demo-box" style={{ maxWidth: 520, margin: '0 auto' }}>
        <strong>Try it without signing up</strong> — pick a demo account:
        {DEMO_ACCOUNTS.map((a) => (
          <div key={a.email} style={{ marginTop: 8, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <button className="btn small" disabled={busy} onClick={() => fillDemo(a.email, a.password)}>
              Log in as {a.name}
            </button>
            <code>{a.email}</code>
          </div>
        ))}
      </div>
    </div>
  );
}
