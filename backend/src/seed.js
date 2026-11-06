// Demo seed data. Runs once, only when the users table is empty.
// ALL listings and profiles here are fictional and marked as demos:
// plausible Collegetown/Ithaca geography (street and neighborhood names)
// but no real landlords, phone numbers, or addresses of real people.
// Real users create their own accounts and listings on top of this.
const bcrypt = require('bcryptjs');
const { query } = require('./db');

const DEMO_PASSWORD = 'demo123';

const DEMO_USERS = [
  {
    name: 'Maya Chen',
    email: 'demo@offcampuscompass.demo',
    major: 'Information Science',
    grad_year: '2027',
    bio: 'Junior who likes quiet mornings, big windows, and a kitchen that stays clean.',
    color: '#B31B1B',
    q: {
      budget_min: 700, budget_max: 1000,
      neighborhoods: ['Collegetown', 'East Hill'],
      move_in: '2026-08-15', bedrooms_needed: 2,
      sleep_schedule: 'night', cleanliness: 4, guests: 'occasional',
      smoking: 'no', study_habits: 'quiet', noise_tolerance: 3,
    },
  },
  {
    name: 'Jordan Ellis',
    email: 'jordan@offcampuscompass.demo',
    major: 'Mechanical Engineering',
    grad_year: '2026',
    bio: 'Senior, early riser, gym before class. Looking for a calm place near the Slope.',
    color: '#1F4E5F',
    q: {
      budget_min: 600, budget_max: 900,
      neighborhoods: ['Collegetown', 'West Campus'],
      move_in: '2026-08-01', bedrooms_needed: 2,
      sleep_schedule: 'early', cleanliness: 3, guests: 'rare',
      smoking: 'no', study_habits: 'social', noise_tolerance: 4,
    },
  },
  {
    name: 'Priya Nair',
    email: 'priya@offcampuscompass.demo',
    major: 'Biology',
    grad_year: '2028',
    bio: 'Sophomore, pre-med, night owl. I cook a lot and I always clean up after.',
    color: '#7A5C00',
    q: {
      budget_min: 650, budget_max: 950,
      neighborhoods: ['North Campus', 'Collegetown'],
      move_in: '2026-08-20', bedrooms_needed: 2,
      sleep_schedule: 'night', cleanliness: 5, guests: 'occasional',
      smoking: 'no', study_habits: 'quiet', noise_tolerance: 2,
    },
  },
  {
    name: 'Sam Okafor',
    email: 'sam@offcampuscompass.demo',
    major: 'Economics',
    grad_year: '2027',
    bio: 'Junior. I host friends on weekends and I am usually out at club events.',
    color: '#2E6B34',
    q: {
      budget_min: 800, budget_max: 1200,
      neighborhoods: ['Collegetown', 'Downtown'],
      move_in: '2026-08-10', bedrooms_needed: 3,
      sleep_schedule: 'night', cleanliness: 2, guests: 'often',
      smoking: 'ok', study_habits: 'social', noise_tolerance: 5,
    },
  },
  {
    name: 'Lena Fischer',
    email: 'lena@offcampuscompass.demo',
    major: 'Architecture',
    grad_year: '2026',
    bio: 'Grad student. Studio runs late, home is for quiet. No parties, ever.',
    color: '#5B2A86',
    q: {
      budget_min: 900, budget_max: 1300,
      neighborhoods: ['Fall Creek', 'East Hill'],
      move_in: '2026-09-01', bedrooms_needed: 1,
      sleep_schedule: 'early', cleanliness: 5, guests: 'rare',
      smoking: 'no', study_habits: 'quiet', noise_tolerance: 2,
    },
  },
  {
    name: 'Diego Ramirez',
    email: 'diego@offcampuscompass.demo',
    major: 'Computer Science',
    grad_year: '2028',
    bio: 'Sophomore. Flexible on most things, just want a place close to Duffield.',
    color: '#8A3324',
    q: {
      budget_min: 600, budget_max: 850,
      neighborhoods: ['Collegetown', 'South Hill'],
      move_in: '2026-08-15', bedrooms_needed: 2,
      sleep_schedule: 'flexible', cleanliness: 3, guests: 'occasional',
      smoking: 'no', study_habits: 'social', noise_tolerance: 4,
    },
  },
];

// address_label is a block/street only — no real street numbers.
const DEMO_LISTINGS = [
  { title: 'Sunny 2BR on College Ave', neighborhood: 'Collegetown', address_label: 'College Ave', price_per_bedroom: 850, bedrooms: 2, bathrooms: 1, distance_min: 6, furnished: 1, utilities_included: 1, available_from: '2026-08-01', description: 'Bright corner unit with big windows, two equal-sized bedrooms, and a kitchen that actually fits two people cooking at once.', amenities: ['In-unit laundry', 'Dishwasher', 'High-speed internet'], landlord_label: 'Demo Property Group' },
  { title: 'Cozy 3BR near Dryden Rd', neighborhood: 'Collegetown', address_label: 'Dryden Rd', price_per_bedroom: 720, bedrooms: 3, bathrooms: 2, distance_min: 8, furnished: 0, utilities_included: 0, available_from: '2026-08-15', description: 'Classic Collegetown three-bedroom, a short walk to the Slope. Great for a group of three splitting costs.', amenities: ['Back porch', 'Basement storage'], landlord_label: 'Demo Property Group' },
  { title: 'Modern 1BR on Eddy St', neighborhood: 'Collegetown', address_label: 'Eddy St', price_per_bedroom: 1150, bedrooms: 1, bathrooms: 1, distance_min: 5, furnished: 1, utilities_included: 1, available_from: '2026-06-01', description: 'Renovated one-bedroom, five minutes to campus. Ideal if you want your own space and a short walk to class.', amenities: ['In-unit laundry', 'Dishwasher', 'Gym in building'], landlord_label: 'Demo Property Group' },
  { title: 'Spacious 4BR on Stewart Ave', neighborhood: 'West Campus', address_label: 'Stewart Ave', price_per_bedroom: 680, bedrooms: 4, bathrooms: 2, distance_min: 12, furnished: 0, utilities_included: 0, available_from: '2026-08-01', description: 'Big house with a yard and a real living room. Best for a group of four who want space to spread out.', amenities: ['Yard', 'Driveway parking', 'Basement storage'], landlord_label: 'Demo Property Group' },
  { title: 'Quiet 2BR on Triphammer Rd', neighborhood: 'North Campus', address_label: 'Triphammer Rd', price_per_bedroom: 700, bedrooms: 2, bathrooms: 1, distance_min: 15, furnished: 1, utilities_included: 1, available_from: '2026-08-20', description: 'Calm street, furnished, and quiet at night. A good fit if you study at home and want an early bedtime to stick.', amenities: ['Furnished', 'Off-street parking'], landlord_label: 'Demo Property Group' },
  { title: 'Bright 3BR on Linn St', neighborhood: 'Fall Creek', address_label: 'Linn St', price_per_bedroom: 750, bedrooms: 3, bathrooms: 1, distance_min: 18, furnished: 0, utilities_included: 0, available_from: '2026-09-01', description: 'Walk to the gorges in five minutes. Three bedrooms, sunny kitchen, and a landlord who answers the phone.', amenities: ['Porch', 'Garden'], landlord_label: 'Demo Property Group' },
  { title: 'Renovated 2BR on Seneca St', neighborhood: 'Downtown', address_label: 'Seneca St', price_per_bedroom: 800, bedrooms: 2, bathrooms: 1, distance_min: 20, furnished: 1, utilities_included: 1, available_from: '2026-08-01', description: 'Downtown living with a bus stop at the corner. Renovated kitchen and bath, furnished, utilities included.', amenities: ['Bus stop at corner', 'Dishwasher', 'In-unit laundry'], landlord_label: 'Demo Property Group' },
  { title: 'Charming 3BR on Cascadilla St', neighborhood: 'South Hill', address_label: 'Cascadilla St', price_per_bedroom: 650, bedrooms: 3, bathrooms: 1, distance_min: 22, furnished: 0, utilities_included: 0, available_from: '2026-08-15', description: 'The most affordable three-bedroom on the list. A longer walk, but a big yard and a quiet street.', amenities: ['Yard', 'Porch'], landlord_label: 'Demo Property Group' },
  { title: 'Studio on College Ave', neighborhood: 'Collegetown', address_label: 'College Ave', price_per_bedroom: 1050, bedrooms: 1, bathrooms: 1, distance_min: 4, furnished: 1, utilities_included: 1, available_from: '2026-06-15', description: 'Efficient studio four minutes from campus. Everything included, just bring a suitcase.', amenities: ['Furnished', 'Utilities included', 'Gym in building'], landlord_label: 'Demo Property Group' },
  { title: 'Large 5BR house on Cayuga Heights Rd', neighborhood: 'Cayuga Heights', address_label: 'Cayuga Heights Rd', price_per_bedroom: 900, bedrooms: 5, bathrooms: 3, distance_min: 25, furnished: 0, utilities_included: 0, available_from: '2026-08-01', description: 'Big house for a big group. Five bedrooms, three baths, and a bus route that drops you at the Arts Quad.', amenities: ['Driveway parking', 'Yard', 'Basement storage'], landlord_label: 'Demo Property Group' },
];

const DEMO_REVIEWS = [
  { listingIndex: 0, userIndex: 1, rating: 5, comment: 'Lived here last year. Landlord fixed the dishwasher within a day and returned the full deposit.' },
  { listingIndex: 0, userIndex: 2, rating: 4, comment: 'Great location and quiet building. Heating is a little uneven in winter.' },
  { listingIndex: 3, userIndex: 0, rating: 4, comment: 'House is solid and the yard is a plus. The walk up the hill gets old in February.' },
];

async function seed() {
  const count = await query('SELECT COUNT(*) AS c FROM users');
  if (Number(count[0].c) > 0) return;

  const now = new Date().toISOString();
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const userIds = [];
  for (const u of DEMO_USERS) {
    const rows = await query(
      'INSERT INTO users (name, email, password_hash, major, grad_year, bio, color, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
      [u.name, u.email, hash, u.major, u.grad_year, u.bio, u.color, now]
    );
    const id = rows[0].id;
    userIds.push(id);
    const q = u.q;
    await query(
      'INSERT INTO questionnaires (user_id, budget_min, budget_max, neighborhoods, move_in, bedrooms_needed, sleep_schedule, cleanliness, guests, smoking, study_habits, noise_tolerance, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, q.budget_min, q.budget_max, JSON.stringify(q.neighborhoods), q.move_in, q.bedrooms_needed, q.sleep_schedule, q.cleanliness, q.guests, q.smoking, q.study_habits, q.noise_tolerance, now]
    );
  }

  const listingIds = [];
  for (const l of DEMO_LISTINGS) {
    const rows = await query(
      'INSERT INTO listings (title, neighborhood, address_label, price_per_bedroom, bedrooms, bathrooms, distance_min, furnished, utilities_included, available_from, description, amenities, landlord_label, posted_by, is_demo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?) RETURNING id',
      [l.title, l.neighborhood, l.address_label, l.price_per_bedroom, l.bedrooms, l.bathrooms, l.distance_min, l.furnished, l.utilities_included, l.available_from, l.description, JSON.stringify(l.amenities), l.landlord_label, null, now]
    );
    listingIds.push(rows[0].id);
  }

  for (const r of DEMO_REVIEWS) {
    await query(
      'INSERT INTO landlord_reviews (listing_id, user_id, landlord_name, rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [listingIds[r.listingIndex], userIds[r.userIndex], 'Demo Property Group', r.rating, r.comment, now]
    );
  }

  // Maya bookmarked two listings; Priya sent Maya a pending roommate request;
  // Maya and Jordan already accepted each other as housemates (demo state).
  await query('INSERT INTO bookmarks (user_id, listing_id, created_at) VALUES (?, ?, ?)', [userIds[0], listingIds[0], now]);
  await query('INSERT INTO bookmarks (user_id, listing_id, created_at) VALUES (?, ?, ?)', [userIds[0], listingIds[2], now]);
  await query(
    "INSERT INTO roommate_requests (from_user_id, to_user_id, message, status, created_at) VALUES (?, ?, ?, 'pending', ?)",
    [userIds[2], userIds[0], 'Hi Maya! Our budgets and sleep schedules line up — want to look at the College Ave 2BR together?', now]
  );
  await query(
    "INSERT INTO roommate_requests (from_user_id, to_user_id, message, status, created_at) VALUES (?, ?, ?, 'accepted', ?)",
    [userIds[0], userIds[1], 'Hey Jordan, want to team up for the Stewart Ave house?', now]
  );

  console.log(`Seeded ${DEMO_USERS.length} demo users, ${DEMO_LISTINGS.length} demo listings.`);
}

module.exports = { seed, DEMO_PASSWORD };
