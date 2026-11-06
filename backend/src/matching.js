// Roommate compatibility scoring.
//
// NOTE ON PROVENANCE: jem's INFO 4125 teammates (incl. Anamitra Rawat)
// built a matching algorithm for this project, but the original file was
// not retrievable tonight — the shared Drive folder is not visible from the
// connected Drive account, there is no Figma connector, and the Housing Hub
// repo is private. This implementation is written from the Devpost project
// description plus standard roommate-matching criteria. When jem shares the
// teammates' original algorithm, the weights below should be compared with
// it and reconciled. The score is transparent on purpose: every match shows
// the per-factor breakdown so students can see WHY two people match.
//
// Scores are 0-100, weights sum to 100:
//   budget overlap 20 | neighborhoods 15 | move-in date 10 | sleep 15 |
//   cleanliness 15 | guests 10 | smoking 5 | study habits 5 | noise 5
const WEIGHTS = {
  budget: 20,
  neighborhoods: 15,
  moveIn: 10,
  sleep: 15,
  cleanliness: 15,
  guests: 10,
  smoking: 5,
  study: 5,
  noise: 5,
};

const GUEST_ORDER = ['rare', 'occasional', 'often'];

function rangeOverlap(aMin, aMax, bMin, bMax) {
  const lo = Math.max(aMin, bMin);
  const hi = Math.min(aMax, bMax);
  if (hi < lo) return 0;
  const overlap = hi - lo;
  const smaller = Math.min(aMax - aMin, bMax - bMin);
  if (smaller <= 0) return 1;
  return Math.min(1, overlap / smaller);
}

function jaccard(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  const inter = [...setA].filter((x) => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : inter / union;
}

function daysBetween(a, b) {
  return Math.abs((new Date(a) - new Date(b)) / (1000 * 60 * 60 * 24));
}

// q is a questionnaire row; neighborhoods arrive as a parsed array.
function scorePair(a, b) {
  const factors = [];
  let total = 0;

  // Budget overlap (20)
  const bo = rangeOverlap(a.budget_min, a.budget_max, b.budget_min, b.budget_max);
  const budgetPts = Math.round(WEIGHTS.budget * bo);
  total += budgetPts;
  factors.push({
    key: 'budget',
    label: 'Budget',
    points: budgetPts,
    max: WEIGHTS.budget,
    note:
      bo >= 0.99
        ? `Budgets line up ($${a.budget_min}–$${a.budget_max} vs $${b.budget_min}–$${b.budget_max})`
        : bo > 0
          ? `Budgets partly overlap ($${a.budget_min}–$${a.budget_max} vs $${b.budget_min}–$${b.budget_max})`
          : `Budgets don't overlap ($${a.budget_min}–$${a.budget_max} vs $${b.budget_min}–$${b.budget_max})`,
  });

  // Neighborhoods (15)
  const jac = jaccard(a.neighborhoods, b.neighborhoods);
  const areaPts = Math.round(WEIGHTS.neighborhoods * jac);
  total += areaPts;
  const shared = a.neighborhoods.filter((n) => b.neighborhoods.includes(n));
  factors.push({
    key: 'neighborhoods',
    label: 'Neighborhood',
    points: areaPts,
    max: WEIGHTS.neighborhoods,
    note:
      shared.length > 0
        ? `Both want ${shared.join(', ')}`
        : 'Different preferred neighborhoods',
  });

  // Move-in date (10)
  const gap = daysBetween(a.move_in, b.move_in);
  const movePts = gap <= 14 ? 10 : gap <= 45 ? 6 : gap <= 90 ? 3 : 0;
  total += movePts;
  factors.push({
    key: 'moveIn',
    label: 'Move-in date',
    points: movePts,
    max: WEIGHTS.moveIn,
    note:
      gap <= 14
        ? `Move-in dates are ${Math.round(gap)} days apart`
        : `Move-in dates are ${Math.round(gap)} days apart`,
  });

  // Sleep schedule (15)
  let sleepPts;
  let sleepNote;
  if (a.sleep_schedule === b.sleep_schedule) {
    sleepPts = 15;
    sleepNote = `Both ${a.sleep_schedule === 'early' ? 'early birds' : a.sleep_schedule === 'night' ? 'night owls' : 'flexible sleepers'}`;
  } else if (a.sleep_schedule === 'flexible' || b.sleep_schedule === 'flexible') {
    sleepPts = 10;
    sleepNote = 'One of you is flexible about sleep times';
  } else {
    sleepPts = 3;
    sleepNote = 'Different sleep schedules — one early bird, one night owl';
  }
  total += sleepPts;
  factors.push({ key: 'sleep', label: 'Sleep schedule', points: sleepPts, max: WEIGHTS.sleep, note: sleepNote });

  // Cleanliness (15) — 1..5 scale
  const cleanDiff = Math.abs(a.cleanliness - b.cleanliness);
  const cleanPts = cleanDiff === 0 ? 15 : cleanDiff === 1 ? 10 : cleanDiff === 2 ? 5 : 0;
  total += cleanPts;
  factors.push({
    key: 'cleanliness',
    label: 'Cleanliness',
    points: cleanPts,
    max: WEIGHTS.cleanliness,
    note:
      cleanDiff === 0
        ? 'Same cleanliness expectations'
        : cleanDiff === 1
          ? 'Close on cleanliness'
          : 'Different cleanliness expectations — worth talking about',
  });

  // Guests (10)
  const gDiff = Math.abs(GUEST_ORDER.indexOf(a.guests) - GUEST_ORDER.indexOf(b.guests));
  const guestPts = gDiff === 0 ? 10 : gDiff === 1 ? 6 : 2;
  total += guestPts;
  factors.push({
    key: 'guests',
    label: 'Guests',
    points: guestPts,
    max: WEIGHTS.guests,
    note:
      gDiff === 0
        ? `Both have guests ${a.guests}`
        : `Different guest habits (${a.guests} vs ${b.guests})`,
  });

  // Smoking (5)
  let smokePts;
  let smokeNote;
  if (a.smoking === b.smoking) {
    smokePts = 5;
    smokeNote = a.smoking === 'no' ? 'Both non-smokers' : 'Same smoking preference';
  } else if (a.smoking === 'ok' || b.smoking === 'ok') {
    smokePts = 3;
    smokeNote = 'One of you is fine with smoking';
  } else {
    smokePts = 0;
    smokeNote = 'Smoking mismatch — one smokes, the other does not';
  }
  total += smokePts;
  factors.push({ key: 'smoking', label: 'Smoking', points: smokePts, max: WEIGHTS.smoking, note: smokeNote });

  // Study habits (5)
  const studyPts = a.study_habits === b.study_habits ? 5 : 2;
  total += studyPts;
  factors.push({
    key: 'study',
    label: 'Study habits',
    points: studyPts,
    max: WEIGHTS.study,
    note:
      a.study_habits === b.study_habits
        ? `Both prefer ${a.study_habits} study time`
        : `Different study styles (${a.study_habits} vs ${b.study_habits})`,
  });

  // Noise tolerance (5) — 1..5 scale
  const noiseDiff = Math.abs(a.noise_tolerance - b.noise_tolerance);
  const noisePts = noiseDiff === 0 ? 5 : noiseDiff === 1 ? 3 : 1;
  total += noisePts;
  factors.push({
    key: 'noise',
    label: 'Noise tolerance',
    points: noisePts,
    max: WEIGHTS.noise,
    note:
      noiseDiff === 0
        ? 'Same noise tolerance'
        : noiseDiff === 1
          ? 'Close on noise tolerance'
          : 'Different noise tolerance',
  });

  const strengths = factors.filter((f) => f.points >= f.max * 0.8).map((f) => f.note);
  const watchOuts = factors.filter((f) => f.points <= f.max * 0.2).map((f) => f.note);

  return { score: total, factors, strengths, watchOuts };
}

module.exports = { scorePair, WEIGHTS };
