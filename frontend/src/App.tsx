import { useCallback, useEffect, useState } from 'react';
import { api, clearAuth, getStoredUser, type User } from './lib/api';
import Home from './pages/Home';
import Browse from './pages/Browse';
import ListingDetail from './pages/ListingDetail';
import Matching from './pages/Matching';
import Requests from './pages/Requests';
import Saved from './pages/Saved';
import PostListing from './pages/PostListing';
import Auth from './pages/Auth';
import Profile from './pages/Profile';

type Route =
  | { name: 'home' }
  | { name: 'browse' }
  | { name: 'listing'; id: number }
  | { name: 'matching' }
  | { name: 'requests' }
  | { name: 'saved' }
  | { name: 'post' }
  | { name: 'login' }
  | { name: 'register' }
  | { name: 'profile' };

function parseHash(): Route {
  const raw = window.location.hash.replace(/^#\/?/, '');
  const [path, query] = raw.split('?');
  const parts = path.split('/').filter(Boolean);
  if (parts[0] === 'browse') return { name: 'browse' };
  if (parts[0] === 'listing' && parts[1]) return { name: 'listing', id: Number(parts[1]) };
  if (parts[0] === 'matching') return { name: 'matching' };
  if (parts[0] === 'requests') return { name: 'requests' };
  if (parts[0] === 'saved') return { name: 'saved' };
  if (parts[0] === 'post') return { name: 'post' };
  if (parts[0] === 'login') return { name: 'login' };
  if (parts[0] === 'register') return { name: 'register' };
  if (parts[0] === 'profile') return { name: 'profile' };
  void query;
  return { name: 'home' };
}

export function go(path: string) {
  window.location.hash = `#/${path}`;
}

export default function App() {
  const [route, setRoute] = useState<Route>(parseHash);
  const [user, setUser] = useState<User | null>(() => getStoredUser());

  useEffect(() => {
    const onHash = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  // If a stored session exists, refresh it once on load.
  useEffect(() => {
    if (!getStoredUser()) return;
    api.me().catch(() => {
      clearAuth();
      setUser(null);
    });
  }, []);

  const handleAuth = useCallback((u: User) => setUser(u), []);
  const handleLogout = useCallback(() => {
    clearAuth();
    setUser(null);
    go('');
  }, []);

  const authed = !!user;
  const needsAuth = ['matching', 'requests', 'saved', 'post', 'profile'].includes(route.name);

  return (
    <div>
      <header className="topbar">
        <div className="topbar-inner">
          <a className="brand" href="#/" onClick={(e) => { e.preventDefault(); go(''); }}>
            <svg width="34" height="34" viewBox="0 0 100 100" aria-hidden="true">
              <circle cx="50" cy="50" r="46" fill="none" stroke="#b31b1b" strokeWidth="5" />
              <polygon points="50,10 58,50 50,90 42,50" fill="#b31b1b" />
              <polygon points="10,50 50,42 90,50 50,58" fill="#b31b1b" opacity="0.55" />
              <circle cx="50" cy="50" r="7" fill="#faf6f0" stroke="#b31b1b" strokeWidth="4" />
            </svg>
            <span>
              <span className="brand-name">
                Off Campus <em>Compass</em>
              </span>
              <br />
              <span className="brand-sub">Cornell · Collegetown · Ithaca</span>
            </span>
          </a>
          <nav className="nav">
            <button className={route.name === 'home' ? 'active' : ''} onClick={() => go('')}>Home</button>
            <button className={route.name === 'browse' ? 'active' : ''} onClick={() => go('browse')}>Find housing</button>
            <button className={route.name === 'matching' ? 'active' : ''} onClick={() => go('matching')}>Find roommates</button>
            {authed && (
              <>
                <button className={route.name === 'saved' ? 'active' : ''} onClick={() => go('saved')}>Saved</button>
                <button className={route.name === 'requests' ? 'active' : ''} onClick={() => go('requests')}>Requests</button>
                <button className={route.name === 'post' ? 'active' : ''} onClick={() => go('post')}>Post a place</button>
              </>
            )}
            {authed ? (
              <>
                <span className="user-chip">{user.name}</span>
                <button onClick={() => go('profile')}>Profile</button>
                <button onClick={handleLogout}>Log out</button>
              </>
            ) : (
              <button className={route.name === 'login' ? 'active' : ''} onClick={() => go('login')}>Log in</button>
            )}
          </nav>
        </div>
      </header>

      <main className="container">
        {route.name === 'home' && <Home user={user} />}
        {route.name === 'browse' && <Browse />}
        {route.name === 'listing' && <ListingDetail id={route.id} user={user} />}
        {route.name === 'matching' && (authed ? <Matching user={user!} /> : <Auth mode="login" onAuth={handleAuth} notice="Log in to find roommates." />)}
        {route.name === 'requests' && (authed ? <Requests /> : <Auth mode="login" onAuth={handleAuth} notice="Log in to see your roommate requests." />)}
        {route.name === 'saved' && (authed ? <Saved /> : <Auth mode="login" onAuth={handleAuth} notice="Log in to see your saved places." />)}
        {route.name === 'post' && (authed ? <PostListing /> : <Auth mode="login" onAuth={handleAuth} notice="Log in to post a place." />)}
        {route.name === 'login' && <Auth mode="login" onAuth={handleAuth} />}
        {route.name === 'register' && <Auth mode="register" onAuth={handleAuth} />}
        {route.name === 'profile' && (authed ? <Profile user={user!} onUserChange={handleAuth} /> : <Auth mode="login" onAuth={handleAuth} notice="Log in to see your profile." />)}
        {needsAuth && !authed && null}
      </main>

      <footer className="footer">
        <div className="footer-inner">
          <strong>Off Campus Compass</strong> — built by Cornell students, for Cornell students.
          Find a place off campus and roommates who actually fit, without having to network
          with upperclassmen for basic details.
          <div className="pill-row">
            <span className="tag">Housing search</span>
            <span className="tag">Roommate matching</span>
            <span className="tag">Landlord reviews</span>
          </div>
          <p style={{ marginTop: 12 }}>
            Demo listings are fictional and marked as demos. Always verify a real listing,
            meet roommates in person, and read a lease before signing anything.
          </p>
        </div>
      </footer>
    </div>
  );
}
