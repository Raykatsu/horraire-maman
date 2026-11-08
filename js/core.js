/*
 * Heures maman — logique de calcul (aucune interface ici).
 * Toutes les durées sont en minutes pour éviter les erreurs d'arrondi.
 * Un créneau qui finit après minuit (ex : 22:00 → 01:00) compte pour le jour où il commence.
 * Les semaines vont du lundi au dimanche.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HMCore = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const pad = (n) => String(n).padStart(2, '0');
  const round2 = (x) => Math.round(x * 100) / 100;

  /* ---------- Dates (format AAAA-MM-JJ, calculs en UTC pour éviter les changements d'heure) ---------- */

  function parseDate(s) {
    const [y, m, d] = String(s).split('-').map(Number);
    return new Date(Date.UTC(y, m - 1, d));
  }
  function fmtDate(dt) {
    return dt.getUTCFullYear() + '-' + pad(dt.getUTCMonth() + 1) + '-' + pad(dt.getUTCDate());
  }
  function isDate(s) {
    return /^\d{4}-\d{2}-\d{2}$/.test(String(s)) && fmtDate(parseDate(s)) === s;
  }
  function addDays(s, n) {
    const d = parseDate(s);
    d.setUTCDate(d.getUTCDate() + n);
    return fmtDate(d);
  }
  /** 0 = lundi … 6 = dimanche */
  function weekday(s) {
    return (parseDate(s).getUTCDay() + 6) % 7;
  }
  function weekStart(s) {
    return addDays(s, -weekday(s));
  }
  function todayStr(now) {
    const d = now || new Date();
    return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
  }
  function monthKey(s) {
    return String(s).slice(0, 7);
  }
  function monthFirst(mk) {
    return mk + '-01';
  }
  function monthLast(mk) {
    const [y, m] = mk.split('-').map(Number);
    return fmtDate(new Date(Date.UTC(y, m, 0)));
  }
  function addMonths(mk, n) {
    const [y, m] = mk.split('-').map(Number);
    const d = new Date(Date.UTC(y, m - 1 + n, 1));
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1);
  }

  /* ---------- Heures ---------- */

  function isTime(t) {
    return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(t));
  }
  function toMin(t) {
    const [h, m] = String(t).split(':').map(Number);
    return h * 60 + m;
  }
  /** Si la fin est avant le début, le créneau se termine le lendemain. */
  function endsNextDay(start, end) {
    return toMin(end) <= toMin(start);
  }
  function durationMin(start, end) {
    let d = toMin(end) - toMin(start);
    if (d <= 0) d += 1440;
    return d;
  }

  function sortShifts(list) {
    return list.slice().sort((a, b) => (a.date + a.start).localeCompare(b.date + b.start));
  }
  function inRange(list, from, to) {
    return list.filter((s) => s.date >= from && s.date <= to);
  }
  function sumMin(list) {
    return list.reduce((acc, s) => acc + durationMin(s.start, s.end), 0);
  }

  /* ---------- Heures supp ---------- */

  function contractMin(settings) {
    return Math.round((Number(settings.contractHours) || 0) * 60);
  }

  /**
   * Heures au-delà du contrat, en deux paliers :
   * jusqu'à 1/10 des heures du contrat → 1er taux (10 % par défaut), au-delà → 2e taux (25 % par défaut).
   */
  function splitOvertime(totalMin, cMin) {
    if (!(cMin > 0)) return { over: 0, t1: 0, t2: 0 };
    const over = Math.max(0, totalMin - cMin);
    const cap1 = Math.round(cMin / 10);
    const t1 = Math.min(over, cap1);
    return { over, t1, t2: over - t1 };
  }

  function pay(totalMin, ot, settings) {
    const rate = Number(String(settings.rate).replace(',', '.'));
    if (!(rate > 0)) return null;
    const base = round2((totalMin / 60) * rate);
    const m1 = round2((ot.t1 / 60) * rate * (Number(settings.maj1) || 0) / 100);
    const m2 = round2((ot.t2 / 60) * rate * (Number(settings.maj2) || 0) / 100);
    return { rate, base, maj1: m1, maj2: m2, total: round2(base + m1 + m2) };
  }

  /** Résumé d'une semaine (lundi → dimanche). */
  function weekSummary(shifts, wStart, settings) {
    const wEnd = addDays(wStart, 6);
    const list = sortShifts(inRange(shifts, wStart, wEnd));
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = addDays(wStart, i);
      const ds = list.filter((s) => s.date === date);
      days.push({ date, shifts: ds, total: sumMin(ds) });
    }
    const total = sumMin(list);
    const ot = settings.contractPeriod === 'week'
      ? splitOvertime(total, contractMin(settings))
      : { over: 0, t1: 0, t2: 0 };
    // Une semaine à cheval sur deux mois est comptée dans le mois où elle se termine (le dimanche).
    return { start: wStart, end: wEnd, days, shifts: list, total, ot, countedIn: monthKey(wEnd) };
  }

  /** Résumé d'un mois (mk = "AAAA-MM"). */
  function monthSummary(shifts, mk, settings) {
    const first = monthFirst(mk);
    const last = monthLast(mk);
    const list = sortShifts(inRange(shifts, first, last));
    const total = sumMin(list);

    const weeks = [];
    for (let ws = weekStart(first); ws <= last; ws = addDays(ws, 7)) {
      const w = weekSummary(shifts, ws, settings);
      w.inMonth = sumMin(inRange(w.shifts, first, last));
      w.counted = w.countedIn === mk;
      weeks.push(w);
    }

    let ot;
    if (settings.contractPeriod === 'month') {
      ot = splitOvertime(total, contractMin(settings));
    } else {
      ot = { over: 0, t1: 0, t2: 0 };
      weeks.filter((w) => w.counted).forEach((w) => {
        ot.over += w.ot.over;
        ot.t1 += w.ot.t1;
        ot.t2 += w.ot.t2;
      });
    }

    const days = {};
    list.forEach((s) => {
      days[s.date] = (days[s.date] || 0) + durationMin(s.start, s.end);
    });

    return { month: mk, first, last, shifts: list, total, ot, weeks, days, pay: pay(total, ot, settings) };
  }

  /* ---------- Données ---------- */

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  const DEFAULT_FAVORITES = [
    { id: 'f1', place: 'Déols', start: '22:00', end: '01:00' },
    { id: 'f2', place: 'Déols', start: '06:00', end: '09:00' },
    { id: 'f3', place: 'Saint-Maur', start: '06:00', end: '08:00' },
    { id: 'f4', place: 'Saint-Maur', start: '19:00', end: '22:30' },
  ];

  const DEFAULT_SETTINGS = {
    lang: 'ar',
    name: '',
    contractHours: 24,
    contractPeriod: 'week',
    rate: '',
    maj1: 10,
    maj2: 25,
    lastBackup: '',
    favorites: DEFAULT_FAVORITES,
  };

  // Heures d'octobre et du début de novembre 2026, recopiées des feuilles papier.
  const SEED = [
    ['2026-10-01', '06:00', '08:00', 'Saint-Maur'],
    ['2026-10-01', '22:00', '01:00', 'Déols'],
    ['2026-10-02', '06:00', '08:00', 'Saint-Maur'],
    ['2026-10-03', '06:00', '08:00', ''],
    ['2026-10-04', '06:00', '09:00', 'Déols'],
    ['2026-10-04', '19:00', '22:30', 'Saint-Maur'],
    ['2026-10-05', '06:00', '08:00', 'Saint-Maur'],
    ['2026-10-05', '22:00', '01:00', 'Déols'],
    ['2026-10-06', '22:00', '01:00', 'Déols'],
    ['2026-10-07', '22:00', '01:00', 'Déols'],
    ['2026-10-08', '22:00', '01:00', 'Déols'],
    ['2026-10-10', '06:00', '09:00', 'Déols'],
    ['2026-10-11', '06:00', '13:30', 'Déols'],
    ['2026-10-11', '19:00', '22:30', 'Saint-Maur'],
    ['2026-10-12', '22:00', '01:00', 'Déols'],
    ['2026-10-13', '22:00', '01:00', 'Déols'],
    ['2026-10-14', '22:00', '01:00', 'Déols'],
    ['2026-10-15', '22:00', '01:00', 'Déols'],
    ['2026-10-18', '06:00', '09:00', 'Déols'],
    ['2026-10-19', '22:00', '01:00', 'Déols'],
    ['2026-10-20', '22:00', '01:00', 'Déols'],
    ['2026-10-21', '22:00', '01:00', 'Déols'],
    ['2026-10-22', '22:00', '01:00', 'Déols'],
    ['2026-10-24', '06:00', '09:00', 'Déols'],
    ['2026-10-25', '06:00', '09:00', 'Déols'],
    ['2026-10-26', '15:00', '18:00', 'Châteauroux'],
    ['2026-10-26', '22:00', '01:00', 'Déols'],
    ['2026-10-27', '22:00', '01:00', 'Déols'],
    ['2026-10-28', '22:00', '01:00', 'Déols'],
    ['2026-10-29', '22:00', '01:00', 'Déols'],
    ['2026-10-30', '06:00', '13:00', 'Déols'],
    ['2026-10-31', '06:00', '09:00', 'Déols'],
    ['2026-11-01', '06:00', '09:00', 'Déols'],
    ['2026-11-02', '22:00', '01:00', 'Déols'],
    ['2026-11-04', '22:00', '01:00', 'Déols'],
    ['2026-11-05', '22:00', '01:00', 'Déols'],
  ];

  const clone = (x) => JSON.parse(JSON.stringify(x));

  function initialState() {
    return {
      version: 1,
      shifts: SEED.map(([date, start, end, place], i) => ({ id: 's' + (i + 1), date, start, end, place, note: '' })),
      settings: clone(DEFAULT_SETTINGS),
    };
  }

  /** Vérifie et complète des données (chargées du téléphone ou d'une sauvegarde). Renvoie null si inutilisable. */
  function normalizeState(raw) {
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.shifts)) return null;
    const settings = Object.assign(clone(DEFAULT_SETTINGS), raw.settings && typeof raw.settings === 'object' ? raw.settings : {});
    if (!Array.isArray(settings.favorites)) settings.favorites = clone(DEFAULT_FAVORITES);
    settings.favorites = settings.favorites
      .filter((f) => f && isTime(f.start) && isTime(f.end) && f.start !== f.end)
      .map((f) => ({ id: String(f.id || uid()), place: String(f.place || ''), start: f.start, end: f.end }));
    if (settings.contractPeriod !== 'week' && settings.contractPeriod !== 'month') settings.contractPeriod = 'week';
    if (settings.lang !== 'ar' && settings.lang !== 'fr') settings.lang = 'ar';
    const shifts = raw.shifts
      .filter((s) => s && isDate(s.date) && isTime(s.start) && isTime(s.end) && s.start !== s.end)
      .map((s) => ({
        id: String(s.id || uid()),
        date: s.date,
        start: s.start,
        end: s.end,
        place: String(s.place || ''),
        note: String(s.note || ''),
      }));
    return { version: 1, shifts, settings };
  }

  /** Lieux déjà utilisés, du plus fréquent au moins fréquent. */
  function knownPlaces(state) {
    const count = {};
    state.shifts.forEach((s) => { if (s.place) count[s.place] = (count[s.place] || 0) + 1; });
    state.settings.favorites.forEach((f) => { if (f.place) count[f.place] = (count[f.place] || 0) + 1; });
    return Object.keys(count).sort((a, b) => count[b] - count[a] || a.localeCompare(b));
  }

  return {
    pad, round2,
    parseDate, fmtDate, isDate, addDays, weekday, weekStart, todayStr,
    monthKey, monthFirst, monthLast, addMonths,
    isTime, toMin, endsNextDay, durationMin, sortShifts, inRange, sumMin,
    contractMin, splitOvertime, pay, weekSummary, monthSummary,
    uid, DEFAULT_SETTINGS, DEFAULT_FAVORITES, SEED, initialState, normalizeState, knownPlaces,
  };
});
