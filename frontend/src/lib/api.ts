// API client for Off Campus Compass.
// Base URL comes from VITE_API_URL at build time; in local dev it defaults
// to the backend on :8081.
const BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8081/api';

export interface User {
  id: number;
  name: string;
  email: string;
  major: string;
  grad_year: string;
  bio: string;
  color: string;
}

export interface Listing {
  id: number;
  title: string;
  neighborhood: string;
  address_label: string;
  price_per_bedroom: number;
  bedrooms: number;
  bathrooms: number;
  distance_min: number;
  furnished: boolean;
  utilities_included: boolean;
  available_from: string;
  description: string;
  amenities: string[];
  landlord_label: string;
  posted_by: number | null;
  is_demo: boolean;
}

export interface Review {
  id: number;
  listing_id: number;
  user_id: number;
  reviewer_name: string;
  landlord_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Questionnaire {
  budget_min: number;
  budget_max: number;
  neighborhoods: string[];
  move_in: string;
  bedrooms_needed: number;
  sleep_schedule: 'early' | 'night' | 'flexible';
  cleanliness: number;
  guests: 'rare' | 'occasional' | 'often';
  smoking: 'no' | 'yes' | 'ok';
  study_habits: 'quiet' | 'social';
  noise_tolerance: number;
}

export interface MatchFactor {
  key: string;
  label: string;
  points: number;
  max: number;
  note: string;
}

export interface Match {
  user: User;
  score: number;
  factors: MatchFactor[];
  strengths: string[];
  watchOuts: string[];
  request: { status: string; direction: string; requestId: number } | null;
}

export interface RoommateRequest {
  id: number;
  from_user_id: number;
  to_user_id: number;
  from_name?: string;
  to_name?: string;
  from_major?: string;
  to_major?: string;
  from_grad_year?: string;
  to_grad_year?: string;
  message: string;
  status: 'pending' | 'accepted' | 'declined';
  created_at: string;
}

function getToken(): string | null {
  return localStorage.getItem('occ_token');
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem('occ_user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

export function saveAuth(token: string, user: User) {
  localStorage.setItem('occ_token', token);
  localStorage.setItem('occ_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('occ_token');
  localStorage.removeItem('occ_user');
}

async function req<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...opts, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as any).error || `Request failed (${res.status})`);
  }
  return data as T;
}

export const api = {
  health: () => req<{ ok: boolean; engine: string }>('/health'),
  register: (body: { name: string; email: string; password: string; major?: string; grad_year?: string; bio?: string }) =>
    req<{ token: string; user: User }>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (email: string, password: string) =>
    req<{ token: string; user: User }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  me: () => req<{ user: User; questionnaire: Questionnaire | null }>('/me'),
  listings: (params: Record<string, string | number | undefined> = {}) => {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== '' && v !== 'all') qs.set(k, String(v));
    }
    const suffix = qs.toString() ? `?${qs.toString()}` : '';
    return req<{ listings: Listing[]; neighborhoods: string[] }>(`/listings${suffix}`);
  },
  listing: (id: number) =>
    req<{ listing: Listing; reviews: Review[]; avgRating: number | null; bookmarked: boolean }>(`/listings/${id}`),
  createListing: (body: Partial<Listing>) =>
    req<{ listing: Listing }>('/listings', { method: 'POST', body: JSON.stringify(body) }),
  postReview: (listingId: number, body: { rating: number; comment: string }) =>
    req<{ review: Review }>(`/listings/${listingId}/reviews`, { method: 'POST', body: JSON.stringify(body) }),
  bookmarks: () => req<{ listings: Listing[] }>('/bookmarks'),
  addBookmark: (listingId: number) =>
    req<{ ok: boolean }>(`/bookmarks/${listingId}`, { method: 'POST' }),
  removeBookmark: (listingId: number) =>
    req<{ ok: boolean }>(`/bookmarks/${listingId}`, { method: 'DELETE' }),
  getQuestionnaire: () => req<{ questionnaire: Questionnaire | null }>('/profile/questionnaire'),
  saveQuestionnaire: (body: Questionnaire) =>
    req<{ questionnaire: Questionnaire }>('/profile/questionnaire', { method: 'PUT', body: JSON.stringify(body) }),
  matches: () => req<{ matches: Match[] }>('/matches'),
  sendRequest: (toUserId: number, message: string) =>
    req<{ request: RoommateRequest }>('/requests', { method: 'POST', body: JSON.stringify({ toUserId, message }) }),
  requests: () => req<{ incoming: RoommateRequest[]; outgoing: RoommateRequest[] }>('/requests'),
  acceptRequest: (id: number) => req<{ ok: boolean }>(`/requests/${id}/accept`, { method: 'POST' }),
  declineRequest: (id: number) => req<{ ok: boolean }>(`/requests/${id}/decline`, { method: 'POST' }),
  housemates: () => req<{ housemates: User[] }>('/housemates'),
};

export const NEIGHBORHOODS = [
  'Collegetown',
  'West Campus',
  'North Campus',
  'East Hill',
  'Fall Creek',
  'South Hill',
  'Downtown',
  'Cayuga Heights',
];

export const DEMO_ACCOUNTS = [
  { email: 'demo@offcampuscompass.demo', password: 'demo123', name: 'Maya Chen — junior, Information Science' },
  { email: 'jordan@offcampuscompass.demo', password: 'demo123', name: 'Jordan Ellis — senior, Mechanical Engineering' },
  { email: 'priya@offcampuscompass.demo', password: 'demo123', name: 'Priya Nair — sophomore, Biology' },
];
