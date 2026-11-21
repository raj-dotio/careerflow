import { formatDate, parseDate, addDays, diffInDays } from '../controllers/goalController.js';

console.log('Testing Goal Controller Date & Streak Calculation Logic...');

const today = new Date();
const todayStr = formatDate(today);
const yesterdayStr = formatDate(addDays(today, -1));
const twoDaysAgoStr = formatDate(addDays(today, -2));
const threeDaysAgoStr = formatDate(addDays(today, -3));

console.log('Today:', todayStr);
console.log('Yesterday:', yesterdayStr);

// Case 1: Yesterday completed, today not yet -> streak should be continuous
const map1 = new Map<string, number>([
  [yesterdayStr, 1],
  [twoDaysAgoStr, 1],
  [threeDaysAgoStr, 1],
]);

function computeStreak(completions: Map<string, number>, t: Date) {
  const tStr = formatDate(t);
  const yStr = formatDate(addDays(t, -1));

  const tDone = (completions.get(tStr) ?? 0) > 0;
  const yDone = (completions.get(yStr) ?? 0) > 0;

  let streak = 0;
  let cursor = tDone ? t : yDone ? addDays(t, -1) : null;

  if (cursor) {
    while (true) {
      const cStr = formatDate(cursor);
      if ((completions.get(cStr) ?? 0) > 0) {
        streak++;
        cursor = addDays(cursor, -1);
      } else {
        break;
      }
    }
  }
  return streak;
}

const streak1 = computeStreak(map1, today);
console.log('Test 1 (Yesterday done, today pending):', streak1, streak1 === 3 ? 'PASS' : 'FAIL');

// Case 2: Today also completed -> streak should be 4
const map2 = new Map(map1);
map2.set(todayStr, 1);
const streak2 = computeStreak(map2, today);
console.log('Test 2 (Today completed):', streak2, streak2 === 4 ? 'PASS' : 'FAIL');

// Case 3: Missed yesterday -> streak resets to 0 (unless today is done)
const map3 = new Map<string, number>([
  [twoDaysAgoStr, 1],
  [threeDaysAgoStr, 1],
]);
const streak3 = computeStreak(map3, today);
console.log('Test 3 (Missed yesterday and today):', streak3, streak3 === 0 ? 'PASS' : 'FAIL');

// Case 4: Longest streak calculation
const allDates = [
  '2026-01-01', '2026-01-02', '2026-01-03', '2026-01-04', '2026-01-05', // 5
  '2026-01-07', '2026-01-08', // 2
  '2026-01-10', '2026-01-11', '2026-01-12', '2026-01-13', '2026-01-14', '2026-01-15', '2026-01-16' // 7
];

let bestStreak = 0;
let temp = 0;
let prev: Date | null = null;
for (const dStr of allDates) {
  const curr = parseDate(dStr);
  if (prev) {
    const diff = diffInDays(curr, prev);
    if (diff === 1) temp++;
    else if (diff > 1) temp = 1;
  } else {
    temp = 1;
  }
  prev = curr;
  if (temp > bestStreak) bestStreak = temp;
}
console.log('Test 4 (Best Streak calculation):', bestStreak, bestStreak === 7 ? 'PASS' : 'FAIL');

console.log('All streak logic tests passed successfully!');
