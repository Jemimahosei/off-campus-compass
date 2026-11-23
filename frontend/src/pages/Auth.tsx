import { useState } from 'react';
import { api, DEMO_ACCOUNTS, saveAuth, type User } from '../lib/api';
import { go } from '../App';

/* Demo cards on the mockup's log-in screen: name + class/major line only. */
const DEMO_LINES: Record<string, string> = {
  'demo@offcampuscompass.demo': 'Junior, Information Science',
  'jordan@offcampuscompass.demo': 'Senior, Mechanical Engineering',
  'priya@offcampuscompass.demo': 'Sophomore, Biology',
};

export default function Auth({
  mode,
  onAuth,
  notice,
  next,
}: {
  mode: 'login' | 'register';
  onAuth: (u: User) => void;
  notice?: string;
  /** Where to land after a successful sign-in. Defaults to the roommates
      flow, as in the mockups: log in and demo cards land on Roommates, and
      a brand-new account goes straight to the ten questions (the Matching
      page opens the questionnaire when none is saved). */
  next?: string;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [major, setMajor] = useState('');
  const [gradYear, setGradYear] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const finish = (token: string, u: User) => {
    saveAuth(token, u);
    onAuth(u);
    go(next ?? 'matching');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const d =
        mode === 'login'
          ? await api.login(email, password)
          : await api.register({ name, email, password, major, grad_year: gradYear });
      finish(d.token, d.user);
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
      finish(d.token, d.user);
    } catch (err: any) {
      setError(err.message || 'Demo login failed.');
      setBusy(false);
    }
  };

  return (
    <div className="auth-cols">
      <form className="auth-card" onSubmit={submit}>
        <h1>{mode === 'login' ? 'Log in' : 'Create an account'}</h1>
        <p className="sub">
          {mode === 'login'
            ? 'Save places, answer the ten questions and message roommates.'
            : 'One account for housing search and roommate matching. Then answer ten questions so we can score your matches.'}
        </p>
        {notice && <div className="notice">{notice}</div>}
        {error && (
          <div role="alert" className="error">
            {error}
          </div>
        )}

        {mode === 'register' && (
          <>
            <label htmlFor="a-name">Full name</label>
            <input id="a-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </>
        )}
        <label htmlFor="em">Email</label>
        <input
          id="em"
          type="email"
          placeholder="netid@cornell.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <label htmlFor="pw">Password</label>
        <input
          id="pw"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
        />
        {mode === 'register' && (
          <>
            <label htmlFor="a-major">Major (optional)</label>
            <input
              id="a-major"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              placeholder="e.g. Information Science"
            />
            <label htmlFor="a-year">Class year (optional)</label>
            <input
              id="a-year"
              value={gradYear}
              onChange={(e) => setGradYear(e.target.value)}
              placeholder="e.g. 2027"
            />
          </>
        )}
        <button
          type="submit"
          className="btn block"
          style={{ minHeight: 52, fontSize: 18 }}
          disabled={busy}
        >
          {busy ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Create account'}
        </button>
        {mode === 'login' ? (
          <p className="auth-switch">
            New here?{' '}
            <a
              href="#/register"
              onClick={(e) => {
                e.preventDefault();
                go('register');
              }}
            >
              Create an account
            </a>{' '}
            and answer ten questions.
          </p>
        ) : (
          <p className="auth-switch">
            Already have an account?{' '}
            <a
              href="#/login"
              onClick={(e) => {
                e.preventDefault();
                go('login');
              }}
            >
              Log in
            </a>
          </p>
        )}
      </form>

      <section className="auth-side">
        <h2>Just looking around?</h2>
        <p>Log in as a demo student. No sign up needed. All demo accounts are fictional.</p>
        <div className="demo-list">
          {DEMO_ACCOUNTS.map((a) => {
            const person = a.name.split(' — ')[0];
            const line = DEMO_LINES[a.email] || a.name.split(' — ')[1] || '';
            return (
              <button
                key={a.email}
                type="button"
                className="demo-card"
                disabled={busy}
                onClick={() => fillDemo(a.email, a.password)}
              >
                <div className="n">{person}</div>
                <div className="d">{line}</div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
