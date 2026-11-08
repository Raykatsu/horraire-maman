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

// Semaines du lundi au dimanche
assert.strictEqual(C.weekStart('2026-11-08'), '2026-11-02');
assert.strictEqual(C.weekStart('2026-10-01'), '2026-09-28');

// Totaux des feuilles papier
const oct = C.monthSummary(st.shifts, '2026-10', s);
const nov = C.monthSummary(st.shifts, '2026-11', s);
assert.strictEqual(oct.total, 101 * 60 + 30, 'octobre = 101h30');
assert.strictEqual(nov.total, 12 * 60, 'novembre = 12h');

// Heures supp au-delà de 24h par semaine (1/10 du contrat = 2h24 au 1er taux)
const w = C.weekSummary(st.shifts, '2026-10-05', s);
assert.strictEqual(w.total, 28 * 60);
assert.deepStrictEqual(w.ot, { over: 240, t1: 144, t2: 96 });
// La semaine du 26 oct. au 1er nov. compte en novembre
assert.strictEqual(oct.ot.over, 240);
assert.strictEqual(nov.ot.over, 240);

// Contrat au mois
const monthly = Object.assign({}, s, { contractPeriod: 'month', contractHours: 104 });
assert.deepStrictEqual(C.monthSummary(st.shifts, '2026-10', monthly).ot, { over: 0, t1: 0, t2: 0 });
const small = Object.assign({}, s, { contractPeriod: 'month', contractHours: 90 });
assert.deepStrictEqual(C.monthSummary(st.shifts, '2026-10', small).ot, { over: 690, t1: 540, t2: 150 });

// Salaire
const paid = Object.assign({}, s, { rate: '12,02' });
const pay = C.monthSummary(st.shifts, '2026-10', paid).pay;
assert.strictEqual(pay.base, 1220.03);
assert.strictEqual(pay.total, 1227.72);

// Données abîmées : on garde ce qui est valable
const fixed = C.normalizeState({ shifts: [{ date: '2026-10-01', start: '06:00', end: '08:00' }, { date: 'x' }], settings: { lang: 'zz' } });
assert.strictEqual(fixed.shifts.length, 1);
assert.strictEqual(fixed.settings.lang, 'ar');
assert.strictEqual(C.normalizeState({}), null);

// Fichier Excel : une archive ZIP valable
const bytes = R.toXlsx(R.build(st, '2026-10', I18n.make('fr')), I18n.make('fr'));
assert.strictEqual(bytes[0], 0x50); // « P »
assert.strictEqual(bytes[1], 0x4b); // « K »
assert.strictEqual(X.crc32(new TextEncoder().encode('123456789')), 0xcbf43926);

console.log('Tous les calculs sont bons ✓');
