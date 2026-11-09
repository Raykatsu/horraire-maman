/*
 * Prépare le contenu d'un mois pour les exports (Excel et PDF),
 * dans la langue choisie dans l'appli.
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./core.js'), require('./xlsx.js'));
  } else {
    root.HMReport = factory(root.HMCore, root.HMXlsx);
  }
})(typeof self !== 'undefined' ? self : this, function (C, X) {
  'use strict';

  const dec = (min) => C.round2(min / 60);

  function build(state, mk, I, now) {
    const st = state.settings;
    const sum = C.monthSummary(state.shifts, mk, st);
    const period = st.contractPeriod === 'month' ? I.t('perMonth') : I.t('perWeek');
    const contractMin = C.contractMin(st);
    const p1 = Number(st.maj1) || 0;
    const p2 = Number(st.maj2) || 0;

    const shifts = sum.shifts.map((s) => {
      const min = C.durationMin(s.start, s.end);
      return {
        date: I.dateNum(s.date),
        day: I.dayName(s.date),
        start: s.start,
        end: s.end,
        endLabel: C.endsNextDay(s.start, s.end) ? s.end + ' ' + I.t('xNextDay') : s.end,
        range: I.t('range', { a: s.start, b: s.end }) + (C.endsNextDay(s.start, s.end) ? ' ' + I.t('xNextDay') : ''),
        place: s.place || '',
        note: s.note || '',
        min,
      };
    });

    const weeks = sum.weeks
      .filter((w) => w.total > 0 || w.ot.over > 0)
      .map((w) => ({
        label: I.t('weekShort', { a: I.dateShort(w.start), b: I.dateShort(w.end) }),
        total: w.total,
        inMonth: w.inMonth,
        over: w.ot.over,
        t1: w.ot.t1,
        t2: w.ot.t2,
        countedIn: I.monthTitle(w.countedIn),
        counted: w.counted,
      }));

    const summary = [{ label: I.t('xTotal'), min: sum.total, strong: true }];
    if (sum.contractMonth > 0) summary.push({ label: I.t('xContractMonth'), min: sum.contractMonth });
    summary.push(
      { label: I.t('xOt1', { p: p1 }), min: sum.ot.t1, ot: true },
      { label: I.t('xOt2', { p: p2 }), min: sum.ot.t2, ot: true },
      { label: I.t('nightHours'), min: sum.night },
      { label: I.t('sundayHours'), min: sum.sunday },
      { label: I.t('holidayHours'), min: sum.holiday }
    );
    const money = [];
    if (sum.pay) {
      money.push({ label: I.t('xRate'), value: C.round2(sum.pay.rate) });
      sum.pay.lines.forEach((l) => money.push({ label: I.t('payLine_' + l.key, { p: l.pct, h: I.dur(l.min) }), value: l.amount }));
      money.push({ label: I.t('xSalary'), value: sum.pay.total, strong: true });
    }

    const today = C.todayStr(now);
    return {
      month: mk,
      rtl: I.dir === 'rtl',
      title: I.t('xTitle', { m: I.monthTitle(mk) }),
      name: String(st.name || '').trim(),
      contractLine: contractMin > 0 ? I.t('xContract', { c: I.dur(contractMin), p: period }) : '',
      generated: I.t('xGenerated', { d: I.dateNum(today) }),
      weekMode: st.contractPeriod !== 'month',
      p1, p2,
      shifts, weeks, summary, money,
      totalMin: sum.total,
    };
  }

  /** Fichier Excel du mois → Uint8Array */
  function toXlsx(rep, I) {
    const rows = [];
    const H = (v) => ({ v, s: 'header' });
    rows.push([{ v: rep.title, s: 'title' }]);
    if (rep.name) rows.push([rep.name]);
    if (rep.contractLine) rows.push([rep.contractLine]);
    rows.push([]);

    // Résumé du mois
    rows.push([{ v: I.t('xSummary'), s: 'bold' }]);
    rep.summary.forEach((r) => rows.push([r.label, { v: dec(r.min), s: r.strong ? 'decBold' : 'dec' }, I.dur(r.min)]));
    rep.money.forEach((m) => rows.push([m.label, { v: m.value, s: m.strong ? 'moneyBold' : 'money' }]));
    rows.push([]);

    // Détail des créneaux
    rows.push([H(I.t('xDate')), H(I.t('xDay')), H(I.t('xStart')), H(I.t('xEnd')), H(I.t('xPlace')), H(I.t('xHoursDec')), H(I.t('xHours')), H(I.t('xNote'))]);
    rep.shifts.forEach((s) => rows.push([s.date, s.day, s.start, s.endLabel, s.place, { v: dec(s.min), s: 'dec' }, I.dur(s.min), s.note]));
    rows.push([{ v: I.t('xTotal'), s: 'bold' }, null, null, null, null, { v: dec(rep.totalMin), s: 'decBold' }, { v: I.dur(rep.totalMin), s: 'bold' }]);
    rows.push([]);

    // Détail par semaine
    if (rep.weekMode && rep.weeks.length) {
      rows.push([H(I.t('xWeek')), H(I.t('xWeekTotal')), H(I.t('xOt')), H(I.t('xOt1', { p: rep.p1 })), H(I.t('xOt2', { p: rep.p2 })), H(I.t('xCounted'))]);
      rep.weeks.forEach((w) => rows.push([
        w.label,
        { v: dec(w.total), s: 'dec' },
        { v: dec(w.over), s: 'dec' },
        { v: dec(w.t1), s: 'dec' },
        { v: dec(w.t2), s: 'dec' },
        w.over > 0 ? w.countedIn : '',
      ]));
      rows.push([]);
    }
    rows.push([rep.generated]);

    return X.build({
      sheetName: I.t('sheetName') + ' ' + rep.month,
      rtl: rep.rtl,
      cols: [26, 14, 12, 20, 16, 16, 12, 24],
      rows,
    });
  }

  return { build, toXlsx };
});
