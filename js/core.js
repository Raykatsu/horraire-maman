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

  /**
   * Lit une durée écrite comme « 18h15 », « 18:15 », « 18,25 » ou « 79 » → minutes (NaN si illisible).
   */
  function parseDuration(v) {
    if (typeof v === 'number') return isFinite(v) && v >= 0 ? Math.round(v * 60) : NaN;
    const s = String(v == null ? '' : v).trim().toLowerCase().replace(/\s+/g, '');
    if (!s) return NaN;
    let m = s.match(/^(\d{1,3})(?:h|:)(\d{1,2})?$/);
    if (m) {
      const mm = m[2] ? Number(m[2]) : 0;
      return mm < 60 ? Number(m[1]) * 60 + mm : NaN;
    }
    m = s.match(/^(\d{1,3})(?:[.,](\d+))?$/);
    if (m) return Math.round(Number(m[1] + '.' + (m[2] || '0')) * 60);
    return NaN;
  }

  /** Lit un montant « 1 234,56 » ou « 1234.56 » → nombre (0 si vide ou illisible). */
  function parseMoney(v) {
    const n = Number(String(v == null ? '' : v).replace(/[\s  €]/g, '').replace(',', '.'));
    return isFinite(n) && n > 0 ? n : 0;
  }

  /* ---------- Nuit, dimanche, jours fériés ---------- */

  const NIGHT_START = 21 * 60; // 21:00
  const NIGHT_END = 6 * 60; // 06:00

  function bounds(s) {
    const a = toMin(s.start);
    return [a, a + durationMin(s.start, s.end)];
  }
  function overlap(a1, a2, b1, b2) {
    return Math.max(0, Math.min(a2, b2) - Math.max(a1, b1));
  }
  /** Minutes du créneau entre 21h et 6h. */
  function nightMin(s) {
    const [a, e] = bounds(s);
    let t = 0;
    for (let k = -1; k <= 1; k++) t += overlap(a, e, NIGHT_START + k * 1440, NIGHT_END + (k + 1) * 1440);
    return t;
  }
  /** Découpe un créneau par jour du calendrier (un créneau de nuit déborde sur le lendemain). */
  function daySegments(s) {
    const [a, e] = bounds(s);
    if (e <= 1440) return [{ date: s.date, min: e - a }];
    return [{ date: s.date, min: 1440 - a }, { date: addDays(s.date, 1), min: e - 1440 }];
  }

  /** Dimanche de Pâques (calcul grégorien). */
  function easterSunday(y) {
    const a = y % 19;
    const b = Math.floor(y / 100);
    const c = y % 100;
    const d = Math.floor(b / 4);
    const e = b % 4;
    const f = Math.floor((b + 8) / 25);
    const g = Math.floor((b - f + 1) / 3);
    const h = (19 * a + b - d - g + 15) % 30;
    const i = Math.floor(c / 4);
    const k = c % 4;
    const l = (32 + 2 * e + 2 * i - h - k) % 7;
    const m = Math.floor((a + 11 * h + 22 * l) / 451);
    const month = Math.floor((h + l - 7 * m + 114) / 31);
    const day = ((h + l - 7 * m + 114) % 31) + 1;
    return y + '-' + pad(month) + '-' + pad(day);
  }
  const holidayCache = {};
  /** Jours fériés en France métropolitaine. */
  function holidaysOf(y) {
    if (!holidayCache[y]) {
      const e = easterSunday(y);
      holidayCache[y] = new Set([
        y + '-01-01', addDays(e, 1), y + '-05-01', y + '-05-08', addDays(e, 39), addDays(e, 50),
        y + '-07-14', y + '-08-15', y + '-11-01', y + '-11-11', y + '-12-25',
      ]);
    }
    return holidayCache[y];
  }
  function isHoliday(date) {
    return holidaysOf(Number(String(date).slice(0, 4))).has(date);
  }
  /** Heures du dimanche (un dimanche férié compte seulement comme jour férié). */
  function sundayMin(s) {
    return daySegments(s).filter((g) => weekday(g.date) === 6 && !isHoliday(g.date)).reduce((t, g) => t + g.min, 0);
  }
  function holidayMin(s) {
    return daySegments(s).filter((g) => isHoliday(g.date)).reduce((t, g) => t + g.min, 0);
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

  /** Heures prévues au contrat sur un mois (minutes). */
  function monthlyContractMin(settings) {
    const h = settings.contractPeriod === 'month' ? settings.contractHours : settings.monthlyHours;
    return Math.round((Number(h) || 0) * 60);
  }

  /** Taux horaire : calculé depuis le salaire de base s'il est rempli, sinon le taux saisi. */
  function hourlyRate(settings) {
    const base = parseMoney(settings.baseSalary);
    const mMin = monthlyContractMin(settings);
    if (base > 0 && mMin > 0) return base / (mMin / 60);
    return parseMoney(settings.rate);
  }

  /**
   * Salaire brut estimé du mois, ligne par ligne.
   * - Avec un salaire de base (salaire mensualisé) : base + heures supp payées en entier avec leur majoration.
   * - Sans salaire de base : toutes les heures × taux + majorations des heures supp.
   * - Dans les deux cas : majorations de nuit, du dimanche et des jours fériés.
   */
  function pay(m, settings) {
    const rate = hourlyRate(settings);
    if (!(rate > 0)) return null;
    const base = parseMoney(settings.baseSalary);
    const mMin = monthlyContractMin(settings);
    const monthly = base > 0 && mMin > 0;
    const pct = (k) => (Number(settings[k]) || 0) / 100;
    const amount = (min, factor) => round2((min / 60) * rate * factor);
    const lines = [];
    if (monthly) {
      lines.push({ key: 'base', min: mMin, amount: round2(base) });
      if (m.ot.t1) lines.push({ key: 'hc', min: m.ot.t1, pct: Number(settings.maj1) || 0, amount: amount(m.ot.t1, 1 + pct('maj1')) });
      if (m.ot.t2) lines.push({ key: 'hc', min: m.ot.t2, pct: Number(settings.maj2) || 0, amount: amount(m.ot.t2, 1 + pct('maj2')) });
    } else {
      lines.push({ key: 'hours', min: m.total, amount: amount(m.total, 1) });
      if (m.ot.t1 && pct('maj1')) lines.push({ key: 'hcMaj', min: m.ot.t1, pct: Number(settings.maj1), amount: amount(m.ot.t1, pct('maj1')) });
      if (m.ot.t2 && pct('maj2')) lines.push({ key: 'hcMaj', min: m.ot.t2, pct: Number(settings.maj2), amount: amount(m.ot.t2, pct('maj2')) });
    }
    [['night', 'nightMaj'], ['sunday', 'sundayMaj'], ['holiday', 'holidayMaj']].forEach(([k, s]) => {
      if (m[k] && pct(s)) lines.push({ key: k, min: m[k], pct: Number(settings[s]), amount: amount(m[k], pct(s)) });
    });
    const total = round2(lines.reduce((t, l) => t + l.amount, 0));
    return { rate, monthly, lines, total };
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
    const weekly = settings.contractPeriod === 'week';
    const ot = weekly ? splitOvertime(total, contractMin(settings)) : { over: 0, t1: 0, t2: 0 };
    // Limite légale des heures complémentaires : 1/3 des heures du contrat
    const limit = weekly ? Math.round(contractMin(settings) / 3) : 0;
    // Une semaine à cheval sur deux mois est comptée dans le mois où elle se termine (le dimanche).
    return {
      start: wStart, end: wEnd, days, shifts: list, total, ot,
      limit, overLimit: weekly && limit > 0 && ot.over > limit,
      countedIn: monthKey(wEnd),
    };
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

    const sum = (fn) => list.reduce((t, s) => t + fn(s), 0);
    const night = sum(nightMin);
    const m = {
      month: mk, first, last, shifts: list, total, ot, weeks, days,
      night,
      sunday: sum(sundayMin),
      holiday: sum(holidayMin),
      // Repos compensateur des travailleurs de nuit (propreté) : 2 % des heures de nuit
      nightRest: Math.round(night * 0.02),
      contractMonth: monthlyContractMin(settings),
    };
    m.pay = pay(m, settings);
    return m;
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

  // Réglages par défaut : contrat de 18h15 par semaine (79 h par mois),
  // majorations de la convention collective de la propreté.
  const DEFAULT_SETTINGS = {
    settingsVersion: 2,
    lang: 'ar',
    name: '',
    contractHours: 18.25,
    contractPeriod: 'week',
    monthlyHours: 79,
    baseSalary: '',
    rate: '',
    maj1: 10,
    maj2: 25,
    nightMaj: 20,
    sundayMaj: 25,
    holidayMaj: 50,
    lastBackup: '',
    favorites: DEFAULT_FAVORITES,
  };
  const NUMBER_SETTINGS = ['contractHours', 'monthlyHours', 'maj1', 'maj2', 'nightMaj', 'sundayMaj', 'holidayMaj'];

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
    const rawSettings = raw.settings && typeof raw.settings === 'object' ? raw.settings : {};
    const settings = Object.assign(clone(DEFAULT_SETTINGS), rawSettings);
    // Version 1 → 2 : les 24 h provisoires sont remplacées par les heures du contrat (18h15)
    if (!(Number(rawSettings.settingsVersion) >= 2)) {
      if (rawSettings.contractHours == null || Number(rawSettings.contractHours) === 24) {
        settings.contractHours = DEFAULT_SETTINGS.contractHours;
        settings.contractPeriod = 'week';
      }
      settings.settingsVersion = 2;
    }
    NUMBER_SETTINGS.forEach((k) => {
      const n = Number(String(settings[k]).replace(',', '.'));
      settings[k] = isFinite(n) && n >= 0 ? n : DEFAULT_SETTINGS[k];
    });
    settings.rate = String(settings.rate == null ? '' : settings.rate);
    settings.baseSalary = String(settings.baseSalary == null ? '' : settings.baseSalary);
    settings.name = String(settings.name == null ? '' : settings.name);
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
    parseDuration, parseMoney, nightMin, sundayMin, holidayMin, isHoliday, easterSunday,
    contractMin, monthlyContractMin, hourlyRate, splitOvertime, pay, weekSummary, monthSummary,
    uid, DEFAULT_SETTINGS, DEFAULT_FAVORITES, SEED, initialState, normalizeState, knownPlaces,
  };
});
