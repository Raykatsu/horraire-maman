/* Heures maman — interface */
(function () {
  'use strict';

  const C = window.HMCore;
  const STORE_KEY = 'heures-maman:v1';
  const VERSION = '1.3.0';

  /* ---------- Données ---------- */

  function load() {
    let raw = null;
    try {
      raw = localStorage.getItem(STORE_KEY);
    } catch (e) {
      raw = null;
    }
    if (raw) {
      try {
        const st = C.normalizeState(JSON.parse(raw));
        if (st) return st;
      } catch (e) {
        /* données illisibles : on les met de côté au lieu de les effacer */
      }
      try {
        localStorage.setItem(STORE_KEY + ':illisible:' + Date.now(), raw);
      } catch (e) { /* rien */ }
    }
    const st = C.initialState();
    persist(st);
    return st;
  }

  function persist(st) {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(st));
      return true;
    } catch (e) {
      return false;
    }
  }

  let state = load();
  let I = HMI18n.make(state.settings.lang);

  function save() {
    if (!persist(state)) toast(state.settings.lang === 'ar' ? 'تعذر الحفظ في الهاتف' : "Impossible d'enregistrer sur ce téléphone");
  }

  if (navigator.storage && navigator.storage.persist) {
    navigator.storage.persist().catch(() => {});
  }

  const today = () => C.todayStr();
  const ui = {
    tab: 'week',
    week: C.weekStart(today()),
    month: C.monthKey(today()),
  };

  /* ---------- Outils ---------- */

  const $ = (sel, el) => (el || document).querySelector(sel);
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  const bdi = (s) => '<bdi>' + esc(s) + '</bdi>';
  /** 18.25 → « 18h15 », 79 → « 79h » (pour les champs des réglages) */
  const hoursInput = (h) => {
    const min = Math.round((Number(h) || 0) * 60);
    return Math.floor(min / 60) + 'h' + (min % 60 ? String(min % 60).padStart(2, '0') : '');
  };

  const ICONS = {
    week: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4M7 13h10M7 17h6"/></svg>',
    month: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="4" width="18" height="17" rx="3"/><path d="M3 9h18M8 2v4M16 2v4M8 13h.01M12 13h.01M16 13h.01M8 17h.01M12 17h.01M16 17h.01"/></svg>',
    settings: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    pay: '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="6" width="20" height="13" rx="2"/><circle cx="12" cy="12.5" r="3"/><path d="M6 10v5M18 10v5"/></svg>',
    prev: '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>',
    next: '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 18l6-6-6-6"/></svg>',
    plus: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14"/></svg>',
    close: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>',
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/></svg>',
  };

  function rangeHtml(s) {
    const night = C.endsNextDay(s.start, s.end);
    return I.t('range', { a: bdi(s.start), b: bdi(s.end) })
      + (night ? ' <span class="badge" dir="ltr" title="' + esc(I.t('nextDay')) + '">+1</span>' : '');
  }

  function otText(ot) {
    if (!ot.over) return '';
    return I.t('otDetail', {
      a: I.dur(ot.t1),
      b: I.dur(ot.t2),
      p1: esc(state.settings.maj1),
      p2: esc(state.settings.maj2),
    });
  }

  function needsBackupReminder() {
    if (!state.shifts.length) return false;
    const last = state.settings.lastBackup;
    if (!last || !C.isDate(last)) return true;
    const days = (C.parseDate(today()) - C.parseDate(last)) / 86400000;
    return days > 31;
  }

  /* ---------- Rendu général ---------- */

  function applyLang() {
    I = HMI18n.make(state.settings.lang);
    document.documentElement.lang = I.lang;
    document.documentElement.dir = I.dir;
    document.title = I.t('appTitle');
  }

  function render() {
    applyLang();
    $('#title').textContent = I.t('appTitle');
    const langBtn = $('#lang-btn');
    langBtn.textContent = I.t('switchLang');
    langBtn.setAttribute('lang', I.lang === 'ar' ? 'fr' : 'ar');

    document.querySelectorAll('.tab').forEach((b) => {
      const tab = b.dataset.tab;
      b.classList.toggle('active', tab === ui.tab);
      b.setAttribute('aria-current', tab === ui.tab ? 'page' : 'false');
      b.innerHTML = ICONS[tab] + '<span>' + esc(I.t({ week: 'tabWeek', month: 'tabMonth', pay: 'tabPay', settings: 'tabSettings' }[tab])) + '</span>';
    });

    const view = $('#view');
    if (ui.tab === 'week') view.innerHTML = renderWeek();
    else if (ui.tab === 'month') view.innerHTML = renderMonth();
    else if (ui.tab === 'pay') view.innerHTML = renderPay();
    else view.innerHTML = renderSettings();
  }

  /* ---------- Semaine ---------- */

  function renderWeek() {
    const st = state.settings;
    const w = C.weekSummary(state.shifts, ui.week, st);
    const isCurrent = ui.week === C.weekStart(today());
    const cMin = C.contractMin(st);
    let html = '';

    if (needsBackupReminder()) {
      html += '<button class="banner" data-action="go-settings">' + esc(I.t('backupReminder')) + '</button>';
    }

    html += '<div class="nav-row">'
      + '<button class="icon-btn" data-action="week-prev" aria-label="' + esc(I.t('prevWeek')) + '">' + ICONS.prev + '</button>'
      + '<div class="nav-title"><div class="nav-main">' + esc(I.weekRange(w.start, w.end)) + '</div>'
      + (isCurrent ? '' : '<button class="link-btn" data-action="week-today">' + esc(I.t('today')) + '</button>')
      + '</div>'
      + '<button class="icon-btn" data-action="week-next" aria-label="' + esc(I.t('nextWeek')) + '">' + ICONS.next + '</button>'
      + '</div>';

    // Résumé
    html += '<section class="card summary">'
      + '<div class="sum-label">' + esc(I.t('weekTotal')) + '</div>'
      + '<div class="sum-big">' + esc(I.dur(w.total)) + '</div>';
    if (st.contractPeriod === 'week' && cMin > 0) {
      const pct = Math.min(100, Math.round((w.total / cMin) * 100));
      html += '<div class="sum-sub">' + esc(I.t('ofContract', { c: I.dur(cMin) })) + '</div>'
        + '<div class="bar' + (w.ot.over ? ' over' : '') + '"><div class="fill" style="width:' + pct + '%"></div></div>';
      html += w.ot.over
        ? '<div class="ot"><strong>' + esc(I.t('otLabel', { d: I.dur(w.ot.over) })) + '</strong><small>' + otText(w.ot) + '</small>'
          + (w.overLimit ? '<small class="warn">' + esc(I.t('overLimit', { l: I.dur(w.limit) })) + '</small>' : '')
          + '</div>'
        : '<div class="ot none">' + esc(I.t('noOvertime')) + '</div>';
    }
    html += '</section>';

    // Jours
    html += '<section class="days">';
    w.days.forEach((d) => {
      const isToday = d.date === today();
      html += '<article class="day' + (isToday ? ' today' : '') + (d.shifts.length ? '' : ' empty') + '" id="day-' + d.date + '">'
        + '<div class="day-head"><div><div class="day-name">' + esc(I.dayName(d.date))
        + (isToday ? ' <span class="pill">' + esc(I.t('today')) + '</span>' : '')
        + (C.isHoliday(d.date) ? ' <span class="pill hol">' + esc(I.t('holiday')) + '</span>' : '') + '</div>'
        + '<div class="day-date">' + esc(I.dateShort(d.date)) + '</div></div>'
        + '<div class="day-total">' + (d.total ? esc(I.dur(d.total)) : '—') + '</div></div>';
      if (d.shifts.length) {
        html += '<ul class="shifts">';
        d.shifts.forEach((s) => {
          html += '<li><button class="shift" data-action="edit" data-id="' + esc(s.id) + '">'
            + '<span class="s-main"><span class="s-time">' + rangeHtml(s) + '</span>'
            + '<span class="s-place">' + esc(s.place || I.t('noPlace')) + (s.note ? ' · ' + esc(s.note) : '') + '</span></span>'
            + '<span class="s-dur">' + esc(I.dur(C.durationMin(s.start, s.end))) + '</span>'
            + '</button></li>';
        });
        html += '</ul>';
      }
      html += '<button class="add-btn" data-action="add" data-date="' + d.date + '">' + ICONS.plus + '<span>' + esc(I.t('addHours')) + '</span></button>'
        + '</article>';
    });
    html += '</section>';
    return html;
  }

  function monthNav() {
    return '<div class="nav-row">'
      + '<button class="icon-btn" data-action="month-prev" aria-label="' + esc(I.t('prevMonth')) + '">' + ICONS.prev + '</button>'
      + '<div class="nav-title"><div class="nav-main cap">' + esc(I.monthTitle(ui.month)) + '</div>'
      + (ui.month === C.monthKey(today()) ? '' : '<button class="link-btn" data-action="month-today">' + esc(I.t('today')) + '</button>')
      + '</div>'
      + '<button class="icon-btn" data-action="month-next" aria-label="' + esc(I.t('nextMonth')) + '">' + ICONS.next + '</button>'
      + '</div>';
  }

  /* ---------- Salaire ---------- */

  function renderPay() {
    const m = C.monthSummary(state.shifts, ui.month, state.settings);
    let html = monthNav();
    if (!m.pay) {
      return html + '<section class="card"><button class="hint" data-action="go-settings">' + esc(I.t('needRate')) + '</button></section>';
    }
    html += '<section class="card summary"><div class="sum-label">' + esc(I.t('shouldBePaid')) + '</div>'
      + '<div class="sum-big">' + esc(I.money(m.pay.total)) + '</div>'
      + '<div class="sum-sub">' + esc(I.lang === 'ar' ? 'خام' : 'brut') + '</div>'
      + (m.pay.net ? '<div class="net big-net">' + esc(I.t('netEst', { n: I.money(m.pay.net) })) + '</div>' : '')
      + '</section>';
    html += '<section class="card"><div class="pay-ot">'
      + '<span>' + esc(I.t('overtime')) + '</span><strong>' + esc(I.dur(m.ot.over)) + '</strong>'
      + '<strong class="pay-ot-amount">' + esc(I.money(m.pay.hcAmount)) + '</strong></div></section>';
    html += '<section class="card"><h2>' + esc(I.t('payDetail')) + '</h2><ul class="pay-lines">'
      + m.pay.lines.map((l) => '<li><span>' + esc(I.t('payLine_' + l.key, { p: l.pct, h: I.dur(l.min) })) + '</span><strong>' + esc(I.money(l.amount)) + '</strong></li>').join('')
      + '<li class="pay-total"><span>' + esc(I.t('salary')) + '</span><strong>' + esc(I.money(m.pay.total)) + '</strong></li>'
      + '</ul><p class="help">' + esc(I.t('rateLine', { r: I.money(m.pay.rate) })) + ' · ' + esc(I.t('payNote')) + '</p></section>';
    return html;
  }

  /* ---------- Mois ---------- */

  function renderMonth() {
    const st = state.settings;
    const m = C.monthSummary(state.shifts, ui.month, st);
    const cMin = C.contractMin(st);
    let html = '';

    html += '<div class="nav-row">'
      + '<button class="icon-btn" data-action="month-prev" aria-label="' + esc(I.t('prevMonth')) + '">' + ICONS.prev + '</button>'
      + '<div class="nav-title"><div class="nav-main cap">' + esc(I.monthTitle(ui.month)) + '</div>'
      + (ui.month === C.monthKey(today()) ? '' : '<button class="link-btn" data-action="month-today">' + esc(I.t('today')) + '</button>')
      + '</div>'
      + '<button class="icon-btn" data-action="month-next" aria-label="' + esc(I.t('nextMonth')) + '">' + ICONS.next + '</button>'
      + '</div>';

    // Résumé
    const cm = m.contractMonth;
    html += '<section class="card summary">'
      + '<div class="sum-label">' + esc(I.t('monthTotal')) + '</div>'
      + '<div class="sum-big">' + esc(I.dur(m.total)) + '</div>';
    if (cm > 0) {
      const diff = m.total - cm;
      const pct = Math.min(100, Math.round((m.total / cm) * 100));
      html += '<div class="sum-sub">' + esc(I.t(diff > 0 ? 'vsMore' : diff < 0 ? 'vsLess' : 'vsEqual', { d: I.dur(Math.abs(diff)), c: I.dur(cm) })) + '</div>'
        + '<div class="bar' + (diff > 0 ? ' over' : '') + '"><div class="fill" style="width:' + pct + '%"></div></div>';
    }
    html += m.ot.over
      ? '<div class="ot"><strong>' + esc(I.t('otLabel', { d: I.dur(m.ot.over) })) + '</strong><small>' + otText(m.ot) + '</small></div>'
      : '<div class="ot none">' + esc(I.t('noOvertime')) + '</div>';

    // Heures de nuit, du dimanche et des jours fériés
    const extra = (key, min) => '<div class="extra"><span>' + esc(I.t(key)) + '</span><strong>' + esc(I.dur(min)) + '</strong></div>';
    html += '<div class="extras">' + extra('nightHours', m.night) + extra('sundayHours', m.sunday) + extra('holidayHours', m.holiday) + '</div>';
    if (m.nightRest) html += '<small class="note-line">' + esc(I.t('nightRest', { d: I.dur(m.nightRest) })) + '</small>';

    html += '</section>';

    // Calendrier
    html += '<section class="card"><div class="cal" role="grid">';
    for (let i = 0; i < 7; i++) html += '<div class="cal-h">' + esc(I.dayShort(i)) + '</div>';
    const offset = C.weekday(m.first);
    for (let i = 0; i < offset; i++) html += '<div class="cal-c blank"></div>';
    for (let d = m.first; d <= m.last; d = C.addDays(d, 1)) {
      const min = m.days[d] || 0;
      html += '<button class="cal-c' + (min ? ' has' : '') + (d === today() ? ' today' : '') + (C.isHoliday(d) ? ' hol' : '') + '" data-action="open-day" data-date="' + d + '">'
        + '<span class="cal-d">' + Number(d.slice(8)) + '</span>'
        + '<span class="cal-v">' + (min ? esc(I.durCompact(min)) : '') + '</span></button>';
    }
    html += '</div><p class="help">' + esc(I.t('calendarHelp')) + '</p></section>';

    // Détail par semaine
    if (st.contractPeriod === 'week') {
      html += '<section class="card"><h2>' + esc(I.t('byWeek')) + '</h2><ul class="weeks">';
      m.weeks.forEach((w) => {
        const partial = w.inMonth !== w.total;
        html += '<li><button class="week-row" data-action="open-week" data-week="' + w.start + '">'
          + '<span class="w-label">' + esc(I.t('weekShort', { a: I.dateShort(w.start), b: I.dateShort(w.end) })) + '</span>'
          + '<span class="w-total">' + esc(I.dur(w.total)) + '</span>'
          + '<span class="w-ot' + (w.ot.over ? ' on' : '') + '">' + (w.ot.over ? (I.lang === 'fr' ? '+' : '') + esc(I.dur(w.ot.over)) : '—') + '</span>';
        if (w.ot.over && !w.counted) {
          html += '<small class="w-note">' + esc(I.t('countedIn', { m: I.monthTitle(w.countedIn) })) + '</small>';
        } else if (partial && w.total) {
          html += '<small class="w-note">' + esc(I.monthTitle(ui.month)) + ' : ' + esc(I.dur(w.inMonth)) + '</small>';
        }
        html += '</button></li>';
      });
      html += '</ul></section>';
    }

    // Envoyer
    html += '<section class="card"><h2>' + esc(I.t('send')) + '</h2><p class="help">' + esc(I.t('sendHelp')) + '</p>'
      + '<div class="btn-row"><button class="btn" data-action="export-xlsx">' + esc(I.t('excel')) + '</button>'
      + '<button class="btn" data-action="export-pdf">' + esc(I.t('pdf')) + '</button></div></section>';
    return html;
  }

  /* ---------- Réglages ---------- */

  function renderSettings() {
    const st = state.settings;
    const places = C.knownPlaces(state);
    const cMin = C.contractMin(st);
    let html = '';

    html += '<section class="card"><h2>' + esc(I.t('language')) + '</h2><div class="seg">'
      + '<button class="' + (I.lang === 'ar' ? 'on' : '') + '" data-action="set-lang" data-lang="ar" lang="ar">العربية</button>'
      + '<button class="' + (I.lang === 'fr' ? 'on' : '') + '" data-action="set-lang" data-lang="fr" lang="fr">Français</button>'
      + '</div>'
      + '<label class="field"><span>' + esc(I.t('yourName')) + '</span><input type="text" data-setting="name" value="' + esc(st.name) + '" autocomplete="name"></label>'
      + '</section>';

    const rate = C.hourlyRate(st);
    const autoRate = C.parseMoney(st.baseSalary) > 0 && C.monthlyContractMin(st) > 0;
    html += '<section class="card"><h2>' + esc(I.t('contract')) + '</h2>'
      + '<label class="field"><span>' + esc(I.t('contractHours')) + '</span><div class="inline">'
      + '<input type="text" autocomplete="off" data-setting="contractHours" data-kind="duration" placeholder="' + esc(I.t('contractHoursPh')) + '" value="' + esc(hoursInput(st.contractHours)) + '">'
      + '<select data-setting="contractPeriod"><option value="week"' + (st.contractPeriod === 'week' ? ' selected' : '') + '>' + esc(I.t('perWeek')) + '</option>'
      + '<option value="month"' + (st.contractPeriod === 'month' ? ' selected' : '') + '>' + esc(I.t('perMonth')) + '</option></select></div></label>';
    if (st.contractPeriod === 'week') {
      html += '<label class="field"><span>' + esc(I.t('monthlyHours')) + '</span>'
        + '<input type="text" autocomplete="off" data-setting="monthlyHours" data-kind="duration" value="' + esc(hoursInput(st.monthlyHours)) + '"></label>'
        + '<p class="help">' + esc(I.t('monthlyHoursHelp')) + '</p>';
    }
    html += '<label class="field"><span>' + esc(I.t('baseSalary')) + '</span>'
      + '<input type="text" inputmode="decimal" autocomplete="off" data-setting="baseSalary" data-kind="money" placeholder="' + esc(I.t('basePh')) + '" value="' + esc(st.baseSalary) + '"></label>'
      + '<label class="field"><span>' + esc(I.t('rate')) + '</span>'
      + '<input type="text" inputmode="decimal" autocomplete="off" data-setting="rate" data-kind="money" placeholder="' + esc(I.t('ratePh')) + '" value="'
      + esc(autoRate ? I.num(C.round2(rate)) : st.rate) + '"' + (autoRate ? ' disabled' : '') + '></label>'
      + '<p class="help">' + esc(autoRate ? I.t('rateAuto', { r: I.money(rate) }) : I.t('rateManual')) + '</p>'
      + '<p class="help">' + esc(I.t('otRule', { cap: I.dur(Math.round(cMin / 10)), lim: I.dur(Math.round(cMin / 3)) })) + '</p>'
      + '</section>';

    const majField = (key, label) => '<label class="field"><span>' + esc(I.t(label)) + '</span>'
      + '<input type="number" inputmode="decimal" min="0" step="1" data-setting="' + key + '" value="' + esc(st[key]) + '"></label>';
    html += '<section class="card"><h2>' + esc(I.t('majTitle')) + '</h2><div class="two">'
      + majField('maj1', 'majHc1') + majField('maj2', 'majHc2')
      + majField('nightMaj', 'majNight') + majField('sundayMaj', 'majSunday')
      + majField('holidayMaj', 'majHoliday') + majField('netPct', 'netPct')
      + '</div><p class="help">' + esc(I.t('majHelp')) + '</p><p class="help">' + esc(I.t('netHelp')) + '</p></section>';

    html += '<section class="card"><h2>' + esc(I.t('favorites')) + '</h2><p class="help">' + esc(I.t('favoritesHelp')) + '</p><ul class="favs">';
    st.favorites.forEach((f) => {
      html += '<li><span class="fav-txt"><strong>' + esc(f.place || I.t('noPlace')) + '</strong> ' + rangeHtml(f) + '</span>'
        + '<button class="small-btn" data-action="fav-remove" data-id="' + esc(f.id) + '">' + esc(I.t('removeFavorite')) + '</button></li>';
    });
    html += '</ul><form id="fav-form" class="fav-form">'
      + '<label class="field"><span>' + esc(I.t('place')) + '</span><input type="text" name="place" list="places-list" autocomplete="off"></label>'
      + '<div class="two"><label class="field"><span>' + esc(I.t('start')) + '</span><input type="time" name="start" required></label>'
      + '<label class="field"><span>' + esc(I.t('end')) + '</span><input type="time" name="end" required></label></div>'
      + '<div class="form-error" id="fav-error" role="alert"></div>'
      + '<button type="submit" class="btn">' + ICONS.star + '<span>' + esc(I.t('addFavorite')) + '</span></button>'
      + '</form>'
      + '<datalist id="places-list">' + places.map((p) => '<option value="' + esc(p) + '">').join('') + '</datalist>'
      + '</section>';

    html += '<section class="card"><h2>' + esc(I.t('backup')) + '</h2><p class="help">' + esc(I.t('backupHelp')) + '</p>'
      + '<p class="muted">' + esc(I.t('lastBackup', { d: st.lastBackup && C.isDate(st.lastBackup) ? I.dateNum(st.lastBackup) : I.t('never') })) + '</p>'
      + '<div class="btn-col"><button class="btn primary" data-action="backup">' + esc(I.t('makeBackup')) + '</button>'
      + '<button class="btn" data-action="restore">' + esc(I.t('restore')) + '</button></div>'
      + '<input type="file" id="restore-input" accept=".json,application/json" hidden>'
      + '</section>';

    html += '<section class="card"><h2>' + esc(I.t('install')) + '</h2>'
      + '<p class="help">' + esc(I.t('installIos')) + '</p><p class="help">' + esc(I.t('installAndroid')) + '</p></section>';

    html += '<p class="version">v' + VERSION + '</p>';
    return html;
  }

  /* ---------- Fenêtre d'ajout / modification ---------- */

  let sheetCtx = null;

  function openSheet(opts) {
    // opts: { date } pour ajouter, { id } pour modifier
    const editing = opts.id ? state.shifts.find((s) => s.id === opts.id) : null;
    if (opts.id && !editing) return;
    sheetCtx = { id: editing ? editing.id : null, date: editing ? editing.date : opts.date };
    const st = state.settings;
    const places = C.knownPlaces(state);
    const v = editing || { date: opts.date, start: '', end: '', place: '', note: '' };

    let html = '<div class="sheet-backdrop" data-action="close-sheet"></div>'
      + '<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-title" tabindex="-1">'
      + '<div class="sheet-head"><div><h2 id="sheet-title">' + esc(I.t(editing ? 'editHours' : 'addHours')) + '</h2>'
      + '<div class="sheet-date">' + esc(I.dateLong(v.date)) + '</div></div>'
      + '<button class="icon-btn" data-action="close-sheet" aria-label="' + esc(I.t('close')) + '">' + ICONS.close + '</button></div>';

    if (!editing && st.favorites.length) {
      html += '<h3>' + esc(I.t('quickAdd')) + '</h3><div class="chips">';
      st.favorites.forEach((f) => {
        html += '<button class="chip" data-action="quick" data-fav="' + esc(f.id) + '">'
          + '<strong>' + esc(f.place || I.t('noPlace')) + '</strong><span>' + rangeHtml(f) + '</span>'
          + '<em>' + esc(I.dur(C.durationMin(f.start, f.end))) + '</em></button>';
      });
      html += '</div><h3>' + esc(I.t('manual')) + '</h3>';
    }

    html += '<form id="shift-form" novalidate>'
      + '<label class="field"><span>' + esc(I.t('date')) + '</span><input type="date" name="date" value="' + esc(v.date) + '" required></label>'
      + '<div class="two"><label class="field"><span>' + esc(I.t('start')) + '</span><input type="time" name="start" value="' + esc(v.start) + '" required></label>'
      + '<label class="field"><span>' + esc(I.t('end')) + '</span><input type="time" name="end" value="' + esc(v.end) + '" required></label></div>'
      + '<div class="preview" id="preview" aria-live="polite"></div>'
      + '<label class="field"><span>' + esc(I.t('place')) + '</span><input type="text" name="place" value="' + esc(v.place) + '" autocomplete="off"></label>';
    if (places.length) {
      html += '<div class="place-chips">' + places.slice(0, 6).map((p) => '<button type="button" class="place-chip" data-action="pick-place" data-place="' + esc(p) + '">' + esc(p) + '</button>').join('') + '</div>';
    }
    html += '<label class="field"><span>' + esc(I.t('note')) + '</span><input type="text" name="note" value="' + esc(v.note) + '" placeholder="' + esc(I.t('notePh')) + '"></label>'
      + '<div class="form-error" id="form-error" role="alert"></div>'
      + '<div class="sheet-actions"><button type="submit" class="btn primary">' + esc(I.t('save')) + '</button>'
      + (editing ? '<button type="button" class="btn danger" data-action="delete">' + esc(I.t('delete')) + '</button>' : '<button type="button" class="btn" data-action="close-sheet">' + esc(I.t('cancel')) + '</button>')
      + '</div></form></div>';

    const root = $('#sheet-root');
    root.innerHTML = html;
    root.hidden = false;
    document.body.classList.add('no-scroll');
    updatePreview();
    // On place le focus sur la fenêtre elle-même (pas sur un champ, pour ne pas ouvrir le clavier)
    const sheet = root.querySelector('.sheet');
    if (sheet && sheet.focus) sheet.focus({ preventScroll: true });
  }

  function closeSheet() {
    const root = $('#sheet-root');
    root.innerHTML = '';
    root.hidden = true;
    sheetCtx = null;
    document.body.classList.remove('no-scroll');
  }

  function updatePreview() {
    const form = $('#shift-form');
    const out = $('#preview');
    if (!form || !out) return;
    const start = form.start.value;
    const end = form.end.value;
    if (C.isTime(start) && C.isTime(end) && start !== end) {
      out.textContent = I.t('duration', { d: I.dur(C.durationMin(start, end)) }) + (C.endsNextDay(start, end) ? ' · ' + I.t('nextDay') : '');
    } else {
      out.textContent = '';
    }
  }

  function submitShift(form) {
    const date = form.date.value;
    const start = form.start.value;
    const end = form.end.value;
    const err = $('#form-error');
    if (!C.isDate(date) || !C.isTime(start) || !C.isTime(end)) {
      err.textContent = I.t('errMissing');
      return;
    }
    if (start === end) {
      err.textContent = I.t('errSame');
      return;
    }
    const data = { date, start, end, place: form.place.value.trim(), note: form.note.value.trim() };
    if (sheetCtx && sheetCtx.id) {
      const s = state.shifts.find((x) => x.id === sheetCtx.id);
      if (s) Object.assign(s, data);
      save();
      closeSheet();
      showWeekOf(date);
      toast(I.t('saved'));
    } else {
      const s = Object.assign({ id: C.uid() }, data);
      state.shifts.push(s);
      save();
      closeSheet();
      showWeekOf(date);
      toast(I.t('added'), I.t('undo'), () => removeShift(s.id, true));
    }
  }

  function quickAdd(favId) {
    const f = state.settings.favorites.find((x) => x.id === favId);
    if (!f || !sheetCtx) return;
    const s = { id: C.uid(), date: sheetCtx.date, start: f.start, end: f.end, place: f.place, note: '' };
    state.shifts.push(s);
    save();
    closeSheet();
    showWeekOf(s.date);
    toast(I.t('added') + ' · ' + (f.place ? f.place + ' ' : '') + f.start + '–' + f.end, I.t('undo'), () => removeShift(s.id, true));
  }

  function removeShift(id, silent) {
    const idx = state.shifts.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const [removed] = state.shifts.splice(idx, 1);
    save();
    render();
    if (!silent) {
      toast(I.t('deleted'), I.t('undo'), () => {
        state.shifts.push(removed);
        save();
        render();
      });
    }
  }

  function showWeekOf(date) {
    ui.tab = 'week';
    ui.week = C.weekStart(date);
    render();
    const el = document.getElementById('day-' + date);
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  /* ---------- Messages ---------- */

  let toastTimer = null;
  function toast(msg, actionLabel, action) {
    const el = $('#toast');
    el.innerHTML = '<span>' + esc(msg) + '</span>' + (actionLabel ? '<button type="button">' + esc(actionLabel) + '</button>' : '');
    el.hidden = false;
    el.classList.add('show');
    if (actionLabel) {
      el.querySelector('button').onclick = () => {
        hideToast();
        action();
      };
    }
    clearTimeout(toastTimer);
    toastTimer = setTimeout(hideToast, actionLabel ? 6000 : 3000);
  }
  function hideToast() {
    const el = $('#toast');
    el.classList.remove('show');
    el.hidden = true;
  }

  /* ---------- Fichiers (export, sauvegarde) ---------- */

  function downloadBlob(blob, name) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }

  function canShareFile(file) {
    try {
      return !!(navigator.canShare && navigator.share && navigator.canShare({ files: [file] }));
    } catch (e) {
      return false;
    }
  }

  /** Propose d'abord le partage (WhatsApp, Fichiers…), sinon télécharge le fichier. */
  async function deliver(blob, name) {
    const file = new File([blob], name, { type: blob.type });
    if (canShareFile(file)) {
      try {
        await navigator.share({ files: [file], title: name });
        return;
      } catch (e) {
        if (e && e.name === 'AbortError') return;
        // Le partage direct a été bloqué (fichier long à préparer) : on propose un bouton.
        return showFileReady(blob, name, file);
      }
    }
    downloadBlob(blob, name);
  }

  function showFileReady(blob, name, file) {
    const root = $('#sheet-root');
    root.innerHTML = '<div class="sheet-backdrop" data-action="close-sheet"></div>'
      + '<div class="sheet small" role="dialog" aria-modal="true"><div class="sheet-head"><h2>' + esc(I.t('fileReady')) + '</h2>'
      + '<button class="icon-btn" data-action="close-sheet" aria-label="' + esc(I.t('close')) + '">' + ICONS.close + '</button></div>'
      + '<p class="muted"><bdi>' + esc(name) + '</bdi></p><div class="btn-col">'
      + '<button class="btn primary" id="fr-share">' + esc(I.t('share')) + '</button>'
      + '<button class="btn" id="fr-download">' + esc(I.t('download')) + '</button></div></div>';
    root.hidden = false;
    $('#fr-share').onclick = () => {
      navigator.share({ files: [file], title: name }).catch(() => {}).finally(closeSheet);
    };
    $('#fr-download').onclick = () => {
      downloadBlob(blob, name);
      closeSheet();
    };
  }

  async function exportMonth(kind) {
    const rep = HMReport.build(state, ui.month, I);
    try {
      if (kind === 'xlsx') {
        const bytes = HMReport.toXlsx(rep, I);
        const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        await deliver(blob, 'heures-' + ui.month + '.xlsx');
      } else {
        const blob = await HMPdf.build(rep, I);
        await deliver(blob, 'heures-' + ui.month + '.pdf');
      }
    } catch (e) {
      console.error(e);
      toast(I.lang === 'ar' ? 'حدث خطأ' : 'Une erreur est survenue');
    }
  }

  async function makeBackup() {
    const data = JSON.stringify({ app: 'heures-maman', exportedAt: new Date().toISOString(), version: 1, shifts: state.shifts, settings: state.settings }, null, 1);
    const blob = new Blob([data], { type: 'application/json' });
    state.settings.lastBackup = today();
    save();
    render();
    await deliver(blob, 'heures-maman-sauvegarde-' + today() + '.json');
  }

  function restoreFrom(file) {
    const reader = new FileReader();
    reader.onload = () => {
      let st = null;
      try {
        st = C.normalizeState(JSON.parse(String(reader.result)));
      } catch (e) {
        st = null;
      }
      if (!st) {
        toast(I.t('badFile'));
        return;
      }
      if (!window.confirm(I.t('restoreConfirm'))) return;
      state = st;
      save();
      render();
      toast(I.t('restored'));
    };
    reader.readAsText(file);
  }

  /* ---------- Événements ---------- */

  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-action]');
    if (!el) return;
    const a = el.dataset.action;
    switch (a) {
      case 'toggle-lang':
        state.settings.lang = state.settings.lang === 'ar' ? 'fr' : 'ar';
        save();
        render();
        break;
      case 'set-lang':
        state.settings.lang = el.dataset.lang;
        save();
        render();
        break;
      case 'tab':
        ui.tab = el.dataset.tab;
        render();
        window.scrollTo(0, 0);
        break;
      case 'week-prev': ui.week = C.addDays(ui.week, -7); render(); break;
      case 'week-next': ui.week = C.addDays(ui.week, 7); render(); break;
      case 'week-today': ui.week = C.weekStart(today()); render(); break;
      case 'month-prev': ui.month = C.addMonths(ui.month, -1); render(); break;
      case 'month-next': ui.month = C.addMonths(ui.month, 1); render(); break;
      case 'month-today': ui.month = C.monthKey(today()); render(); break;
      case 'open-day': showWeekOf(el.dataset.date); break;
      case 'open-week':
        ui.tab = 'week';
        ui.week = el.dataset.week;
        render();
        window.scrollTo(0, 0);
        break;
      case 'go-settings':
        ui.tab = 'settings';
        render();
        window.scrollTo(0, 0);
        break;
      case 'add': openSheet({ date: el.dataset.date }); break;
      case 'edit': openSheet({ id: el.dataset.id }); break;
      case 'close-sheet': closeSheet(); break;
      case 'quick': quickAdd(el.dataset.fav); break;
      case 'pick-place': {
        const input = $('#shift-form input[name="place"]');
        if (input) input.value = el.dataset.place;
        break;
      }
      case 'delete':
        if (sheetCtx && sheetCtx.id && window.confirm(I.t('confirmDelete'))) {
          const id = sheetCtx.id;
          closeSheet();
          removeShift(id);
        }
        break;
      case 'fav-remove':
        state.settings.favorites = state.settings.favorites.filter((f) => f.id !== el.dataset.id);
        save();
        render();
        break;
      case 'export-xlsx': exportMonth('xlsx'); break;
      case 'export-pdf': exportMonth('pdf'); break;
      case 'backup': makeBackup(); break;
      case 'restore': $('#restore-input').click(); break;
      default: break;
    }
  });

  document.addEventListener('submit', (e) => {
    if (e.target.id === 'shift-form') {
      e.preventDefault();
      submitShift(e.target);
    } else if (e.target.id === 'fav-form') {
      e.preventDefault();
      const f = e.target;
      const start = f.start.value;
      const end = f.end.value;
      const err = $('#fav-error');
      if (!C.isTime(start) || !C.isTime(end)) {
        err.textContent = I.t('errMissing');
        return;
      }
      if (start === end) {
        err.textContent = I.t('errSame');
        return;
      }
      state.settings.favorites.push({ id: C.uid(), place: f.place.value.trim(), start, end });
      save();
      render();
      toast(I.t('saved'));
    }
  });

  document.addEventListener('input', (e) => {
    if (e.target.closest('#shift-form')) {
      updatePreview();
      const err = $('#form-error');
      if (err) err.textContent = '';
    }
  });

  document.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'restore-input') {
      if (t.files && t.files[0]) restoreFrom(t.files[0]);
      t.value = '';
      return;
    }
    const key = t.dataset && t.dataset.setting;
    if (!key) return;
    const kind = t.dataset.kind;
    let val = t.value;
    if (kind === 'duration') {
      const min = C.parseDuration(val);
      if (!(min > 0)) {
        toast(I.t('badHours'));
        render();
        return;
      }
      val = min / 60;
    } else if (kind === 'money') {
      val = String(val).trim();
      if (val && !C.parseMoney(val)) {
        toast(I.t('badAmount'));
        render();
        return;
      }
    } else if (['maj1', 'maj2', 'nightMaj', 'sundayMaj', 'holidayMaj', 'netPct'].indexOf(key) >= 0) {
      const n = Number(String(val).replace(',', '.'));
      val = isFinite(n) && n >= 0 ? n : 0;
    }
    state.settings[key] = val;
    save();
    if (['contractPeriod', 'contractHours', 'monthlyHours', 'baseSalary', 'rate'].indexOf(key) >= 0) render();
    toast(I.t('saved'));
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !$('#sheet-root').hidden) closeSheet();
  });

  // Autre onglet ou fenêtre : on recharge les données
  window.addEventListener('storage', (e) => {
    if (e.key === STORE_KEY && e.newValue) {
      try {
        const st = C.normalizeState(JSON.parse(e.newValue));
        if (st) {
          state = st;
          render();
        }
      } catch (err) { /* rien */ }
    }
  });

  // Quand l'appli revient au premier plan un autre jour, « aujourd'hui » change
  let lastDay = today();
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && today() !== lastDay) {
      if (ui.week === C.weekStart(lastDay)) ui.week = C.weekStart(today());
      if (ui.month === C.monthKey(lastDay)) ui.month = C.monthKey(today());
      lastDay = today();
      render();
    }
  });

  render();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
  }
})();
