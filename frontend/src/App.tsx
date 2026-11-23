import { useCallback, useEffect, useState } from 'react';
import { api, clearAuth, getStoredUser, type User } from './lib/api';
import { CompassLogo } from './components';
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
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onHash = () => {
      setRoute(parseHash());
      setMenuOpen(false);
    };
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
  const navTo = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    go(path);
  };
  const housingActive = route.name === 'browse' || route.name === 'listing';

  return (
    <div>
      <div className="top-strip" />
      <header className="site-header">
        <div className="site-header-inner">
          <a className="brand" href="#/" onClick={navTo('')}>
            <CompassLogo />
            Off Campus Compass
          </a>
          <button
            type="button"
            className="menu-btn"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            Menu
          </button>
          <nav className={`site-nav${menuOpen ? ' open' : ''}`} aria-label="Main">
            <a href="#/browse" className={housingActive ? 'active' : ''} aria-current={housingActive ? 'page' : undefined} onClick={navTo('browse')}>
              Housing
            </a>
            <a href="#/matching" className={route.name === 'matching' ? 'active' : ''} aria-current={route.name === 'matching' ? 'page' : undefined} onClick={navTo('matching')}>
              Roommates
            </a>
            <a href="#/saved" className={route.name === 'saved' ? 'active' : ''} aria-current={route.name === 'saved' ? 'page' : undefined} onClick={navTo('saved')}>
              Saved
            </a>
            {authed && (
              <>
                <a href="#/requests" className={route.name === 'requests' ? 'active' : ''} onClick={navTo('requests')}>
                  Requests
                </a>
                <a href="#/post" className={route.name === 'post' ? 'active' : ''} onClick={navTo('post')}>
                  Post a place
                </a>
              </>
            )}
            {authed ? (
              <>
                <span className="user-name">{user.name}</span>
                <a href="#/profile" className={route.name === 'profile' ? 'active' : ''} onClick={navTo('profile')}>
                  Profile
                </a>
                <button type="button" className="linklike" onClick={handleLogout}>
                  Log out
                </button>
              </>
            ) : (
              <a href="#/login" className="btn" style={{ minHeight: 44, padding: '0 18px' }} onClick={navTo('login')}>
                Log in
              </a>
            )}
          </nav>
        </div>
      </header>

      <main>
        {route.name === 'home' && <Home user={user} />}
        {route.name === 'browse' && <Browse />}
        {route.name === 'listing' && <ListingDetail id={route.id} user={user} />}
        {route.name === 'matching' && (authed ? <Matching user={user!} /> : <Auth mode="login" onAuth={handleAuth} notice="Log in to find roommates." />)}
        {route.name === 'login' && <Auth mode="login" onAuth={handleAuth} />}
        {route.name === 'register' && <Auth mode="register" onAuth={handleAuth} />}
        {(route.name === 'requests' || route.name === 'saved' || route.name === 'post' || route.name === 'profile') && (
          <div className="container">
            {route.name === 'requests' && (authed ? <Requests /> : <Auth mode="login" onAuth={handleAuth} notice="Log in to see your roommate requests." next="requests" />)}
            {route.name === 'saved' && (authed ? <Saved /> : <Auth mode="login" onAuth={handleAuth} notice="Log in to see your saved places." next="saved" />)}
            {route.name === 'post' && (authed ? <PostListing /> : <Auth mode="login" onAuth={handleAuth} notice="Log in to post a place." next="post" />)}
            {route.name === 'profile' && (authed ? <Profile user={user!} onUserChange={handleAuth} /> : <Auth mode="login" onAuth={handleAuth} notice="Log in to see your profile." next="profile" />)}
          </div>
        )}
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <div className="foot-main">
            Built by Cornell students, for Cornell students. Find a place off campus and
            roommates who fit, without networking with upperclassmen for basic details.
          </div>
          <div>Trying it out? Log in with demo@offcampuscompass.demo and the password demo123.</div>
        </div>
      </footer>

      <nav className="mobile-nav" aria-label="Main">
        <a href="#/browse" className={housingActive ? 'active' : ''} aria-current={housingActive ? 'page' : undefined} onClick={navTo('browse')}>
          Housing
        </a>
        <a href="#/matching" className={route.name === 'matching' ? 'active' : ''} aria-current={route.name === 'matching' ? 'page' : undefined} onClick={navTo('matching')}>
          Roommates
        </a>
        <a href="#/saved" className={route.name === 'saved' ? 'active' : ''} aria-current={route.name === 'saved' ? 'page' : undefined} onClick={navTo('saved')}>
          Saved
        </a>
      </nav>
    </div>
  );
}
