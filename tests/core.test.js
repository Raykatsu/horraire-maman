/* Vérifications des calculs — lancer avec : node tests/core.test.js */
const assert = require('assert');
const C = require('../js/core.js');
const X = require('../js/xlsx.js');
const R = require('../js/report.js');
const I18n = require('../js/i18n.js');

const st = C.initialState();
const s = st.settings;

// Durées, y compris après minuit
assert.strictEqual(C.durationMin('22:00', '01:00'), 180);
assert.strictEqual(C.durationMin('06:00', '13:30'), 450);
assert.strictEqual(C.durationMin('19:00', '22:30'), 210);
assert.ok(C.endsNextDay('22:00', '01:00'));
assert.ok(!C.endsNextDay('06:00', '09:00'));

// Saisie des durées du contrat
assert.strictEqual(C.parseDuration('18h15'), 1095);
assert.strictEqual(C.parseDuration('18:15'), 1095);
assert.strictEqual(C.parseDuration('18,25'), 1095);
assert.strictEqual(C.parseDuration('79h'), 4740);
assert.ok(isNaN(C.parseDuration('18h75')));
assert.strictEqual(C.parseMoney('1 000,50 €'), 1000.5);
assert.strictEqual(C.parseMoney(''), 0);

// Semaines du lundi au dimanche
assert.strictEqual(C.weekStart('2026-11-08'), '2026-11-02');
assert.strictEqual(C.weekStart('2026-10-01'), '2026-09-28');

// Heures de nuit (21h → 6h)
assert.strictEqual(C.nightMin({ start: '22:00', end: '01:00' }), 180);
assert.strictEqual(C.nightMin({ start: '19:00', end: '22:30' }), 90);
assert.strictEqual(C.nightMin({ start: '18:45', end: '01:00' }), 240);
assert.strictEqual(C.nightMin({ start: '04:00', end: '07:00' }), 120);
assert.strictEqual(C.nightMin({ start: '06:00', end: '09:00' }), 0);

// Jours fériés et dimanches
assert.strictEqual(C.easterSunday(2026), '2026-04-05');
assert.strictEqual(C.easterSunday(2027), '2027-03-28');
assert.ok(C.isHoliday('2026-11-11') && C.isHoliday('2026-04-06') && C.isHoliday('2026-05-14'));
assert.ok(!C.isHoliday('2026-11-12'));
// Samedi 22h → dimanche 1h : 1 h le dimanche
assert.strictEqual(C.sundayMin({ date: '2026-10-10', start: '22:00', end: '01:00' }), 60);
// Dimanche 1er novembre (férié) : compté comme férié, pas comme dimanche
assert.strictEqual(C.sundayMin({ date: '2026-11-01', start: '06:00', end: '09:00' }), 0);
assert.strictEqual(C.holidayMin({ date: '2026-11-01', start: '06:00', end: '09:00' }), 180);
// Mercredi 11 novembre 22h → 1h : 2 h fériées (le 12 n'est pas férié)
assert.strictEqual(C.holidayMin({ date: '2026-11-11', start: '22:00', end: '01:00' }), 120);

// Totaux des feuilles papier
const oct = C.monthSummary(st.shifts, '2026-10', s);
const nov = C.monthSummary(st.shifts, '2026-11', s);
assert.strictEqual(oct.total, 101 * 60 + 30, 'octobre = 101h30');
assert.strictEqual(nov.total, 12 * 60, 'novembre = 12h');
assert.strictEqual(oct.night, 54 * 60);
assert.strictEqual(oct.sunday, 23 * 60 + 30);
assert.strictEqual(nov.holiday, 180);
assert.strictEqual(oct.contractMonth, 79 * 60);

// Heures supp au-delà de 18h15 par semaine (1/10 du contrat ≈ 1h50 au 1er taux)
const w = C.weekSummary(st.shifts, '2026-10-05', s);
assert.strictEqual(w.total, 28 * 60);
assert.deepStrictEqual(w.ot, { over: 585, t1: 110, t2: 475 });
assert.strictEqual(w.limit, 365); // 1/3 du contrat = 6h05
assert.ok(w.overLimit);
// La semaine du 26 oct. au 1er nov. compte en novembre
assert.strictEqual(oct.ot.over, 585);
assert.strictEqual(nov.ot.over, 585);

// Contrat au mois
const monthly = Object.assign({}, s, { contractPeriod: 'month', contractHours: 104 });
assert.deepStrictEqual(C.monthSummary(st.shifts, '2026-10', monthly).ot, { over: 0, t1: 0, t2: 0 });
const small = Object.assign({}, s, { contractPeriod: 'month', contractHours: 90 });
assert.deepStrictEqual(C.monthSummary(st.shifts, '2026-10', small).ot, { over: 690, t1: 540, t2: 150 });

// Salaire sans salaire de base : heures × taux + majorations
const hourly = C.monthSummary(st.shifts, '2026-10', Object.assign({}, s, { baseSalary: '', rate: '12,00' })).pay;
assert.ok(!hourly.monthly);
assert.deepStrictEqual(hourly.lines.map((l) => [l.key, l.amount]), [
  ['hours', 1218], ['hcMaj', 2.2], ['hcMaj', 23.75], ['night', 129.6], ['sunday', 70.5],
]);
assert.strictEqual(hourly.total, 1444.05);

// Salaire mensualisé (exemple fictif : 1 000 € pour 80 h → 12,50 €/h)
const mens = C.monthSummary(st.shifts, '2026-10', Object.assign({}, s, { baseSalary: '1000', monthlyHours: 80 })).pay;
assert.ok(mens.monthly);
assert.strictEqual(mens.rate, 12.5);
assert.deepStrictEqual(mens.lines.map((l) => [l.key, l.amount]), [
  ['base', 1000], ['hc', 25.21], ['hc', 123.7], ['night', 135], ['sunday', 73.44],
]);
assert.strictEqual(mens.total, 1357.35);
assert.strictEqual(C.monthSummary([], '2026-10', Object.assign({}, s, { baseSalary: '' })).pay, null);
// Avec le contrat (993,99 € pour 79 h) : octobre ≈ 1 353,68 € brut, dont 149,88 € d'heures supp
const real = C.monthSummary(st.shifts, '2026-10', s).pay;
assert.strictEqual(real.total, 1353.68);
assert.strictEqual(real.hcAmount, 149.88);
assert.strictEqual(real.net, 1055.87);
assert.strictEqual(C.overtimeAmount(C.weekSummary(st.shifts, '2026-10-05', s).ot, s), 149.88);

// Mise à jour des téléphones qui avaient la 1re version (24 h provisoires)
const old = C.normalizeState({ shifts: [], settings: { contractHours: 24, rate: '12', lang: 'fr' } });
assert.strictEqual(old.settings.contractHours, 18.25);
assert.strictEqual(old.settings.monthlyHours, 79);
assert.strictEqual(old.settings.nightMaj, 20);
assert.strictEqual(old.settings.rate, '12');
assert.strictEqual(old.settings.baseSalary, '993,99');
assert.strictEqual(C.normalizeState({ shifts: [], settings: { settingsVersion: 2, baseSalary: '1000' } }).settings.baseSalary, '1000');
assert.strictEqual(old.settings.lang, 'fr');
assert.strictEqual(C.normalizeState({ shifts: [], settings: { contractHours: 30 } }).settings.contractHours, 30);
assert.strictEqual(C.normalizeState({ shifts: [], settings: { settingsVersion: 2, contractHours: 24 } }).settings.contractHours, 24);

// Données abîmées : on garde ce qui est valable
const fixed = C.normalizeState({ shifts: [{ date: '2026-10-01', start: '06:00', end: '08:00' }, { date: 'x' }], settings: { lang: 'zz' } });
assert.strictEqual(fixed.shifts.length, 1);
assert.strictEqual(fixed.settings.lang, 'ar');
assert.strictEqual(C.normalizeState({}), null);

// Fichier Excel : une archive ZIP valable
const fr = I18n.make('fr');
const bytes = R.toXlsx(R.build(Object.assign({}, st, { settings: Object.assign({}, s, { rate: '12' }) }), '2026-10', fr), fr);
assert.strictEqual(bytes[0], 0x50); // « P »
assert.strictEqual(bytes[1], 0x4b); // « K »
assert.strictEqual(X.crc32(new TextEncoder().encode('123456789')), 0xcbf43926);

// Tous les textes existent dans les deux langues
const kFr = Object.keys(I18n.STRINGS.fr);
const kAr = Object.keys(I18n.STRINGS.ar);
assert.deepStrictEqual(kFr.filter((k) => !kAr.includes(k)), []);
assert.deepStrictEqual(kAr.filter((k) => !kFr.includes(k)), []);

console.log('Tous les calculs sont bons ✓');
