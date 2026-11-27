// SKYBOUND — stats: flight log kept per session, shown on the end screen.
// Tracks a few simple records so free flight has a sense of progression.
const KEY = 'skybound.stats';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
}

function save(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode */ }
}

export function recordFlight({ distanceKm, maxAltitude, topSpeed, landings }) {
  const s = load();
  s.flights = (s.flights || 0) + 1;
  s.totalKm = Math.round(((s.totalKm || 0) + distanceKm) * 10) / 10;
  s.bestAltitude = Math.max(s.bestAltitude || 0, Math.round(maxAltitude));
  s.topSpeed = Math.max(s.topSpeed || 0, Math.round(topSpeed));
  s.landings = (s.landings || 0) + (landings || 0);
  save(s);
  return s;
}

export function summaryLines() {
  const s = load();
  if (!s.flights) return 'No flights logged yet.';
  return [
    `${s.flights} flights · ${s.totalKm} km total`,
    `best altitude ${s.bestAltitude} m · top speed ${s.topSpeed} m/s`,
    `${s.landings} landing${s.landings === 1 ? '' : 's'} logged`,
  ].join('<br>');
}
