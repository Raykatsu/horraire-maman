/* Heures maman — textes en arabe et en français */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.HMI18n = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  const STRINGS = {
    fr: {
      appTitle: 'Mes heures',
      switchLang: 'عربي',
      tabWeek: 'Semaine',
      tabMonth: 'Mois',
      tabPay: 'Salaire',
      payDetail: 'Détail',
      tabSettings: 'Réglages',
      today: "Aujourd'hui",
      prevWeek: 'Semaine précédente',
      nextWeek: 'Semaine suivante',
      prevMonth: 'Mois précédent',
      nextMonth: 'Mois suivant',
      weekRange: 'Du {a} au {b}',
      weekTotal: 'Total de la semaine',
      ofContract: 'sur {c} prévues au contrat',
      overtime: 'Heures supp',
      otLabel: 'Heures supp : {d}',
      otDetail: '{a} à +{p1} % · {b} à +{p2} %',
      noOvertime: "Pas d'heures supp",
      addHours: 'Ajouter des heures',
      editHours: 'Modifier les heures',
      quickAdd: 'En 1 clic',
      manual: 'Ou à la main',
      date: 'Date',
      start: 'Début',
      end: 'Fin',
      place: 'Lieu',
      note: 'Note (facultatif)',
      notePh: 'Ex : remplacement',
      save: 'Enregistrer',
      cancel: 'Annuler',
      delete: 'Supprimer',
      confirmDelete: 'Supprimer ces heures ?',
      added: 'Ajouté ✓',
      saved: 'Enregistré ✓',
      deleted: 'Supprimé',
      undo: 'Annuler',
      range: '{a} → {b}',
      nextDay: 'finit le lendemain',
      duration: 'Durée : {d}',
      errMissing: 'Remplis la date, le début et la fin.',
      errSame: 'Le début et la fin sont identiques.',
      noPlace: 'Lieu non précisé',
      monthTotal: 'Heures travaillées',
      salary: 'Salaire brut estimé',
      needRate: 'Ajoute le taux horaire dans Réglages pour voir le salaire.',
      byWeek: 'Détail par semaine',
      countedIn: 'heures supp comptées en {m}',
      weekShort: '{a} – {b}',
      calendarHelp: 'Appuie sur un jour pour voir sa semaine.',
      send: 'Envoyer le mois',
      sendHelp: 'Pour comparer avec la fiche de paie ou l’envoyer sur WhatsApp.',
      excel: 'Excel',
      pdf: 'PDF',
      fileReady: 'Fichier prêt',
      share: 'Partager',
      download: 'Télécharger',
      close: 'Fermer',
      language: 'Langue',
      yourName: 'Nom (affiché sur les fichiers)',
      contract: 'Contrat',
      contractHours: 'Heures prévues au contrat',
      perWeek: 'par semaine',
      perMonth: 'par mois',
      rate: 'Taux horaire brut (€)',
      ratePh: 'Ex : 12,02',
      maj1: 'Heures supp : 1er taux (%)',
      maj2: 'Heures supp : 2e taux (%)',
      otRule: 'Les heures au-delà du contrat (chaque semaine) sont des heures supp : jusqu’à 1/10 du contrat ({cap}) au 1er taux, au-delà au 2e taux. Limite : 1/3 du contrat ({lim}) par semaine. Une semaine à cheval sur deux mois compte dans le mois où elle se termine.',
      contractHoursPh: 'Ex : 18h15',
      badHours: 'Durée illisible (ex : 18h15).',
      badAmount: 'Montant illisible (ex : 1 000,00).',
      monthlyHours: 'Heures par mois au contrat',
      monthlyHoursHelp: 'Sert au salaire de base (ex : 79h).',
      baseSalary: 'Salaire de base brut par mois (€)',
      basePh: 'Ex : 1 000,00',
      rateAuto: 'Soit {r} de l’heure (calculé avec le salaire de base).',
      rateManual: 'Remplis le salaire de base (ou sinon le taux horaire).',
      majTitle: 'Majorations (%)',
      majHc1: 'Heures supp (jusqu’à 1/10)',
      majHc2: 'Heures supp (au-delà)',
      majNight: 'Nuit (21h–6h)',
      majSunday: 'Dimanche',
      majHoliday: 'Jour férié',
      majHelp: 'Convention collective de la propreté : dimanche prévu au planning +25 % (+100 % s’il est exceptionnel), jour férié prévu +50 % (+100 % s’il est exceptionnel). Le contrat prévoit +20 % pour les heures de nuit. Un dimanche férié compte seulement comme férié.',
      vsMore: '{d} de plus que les {c} du contrat',
      vsLess: '{d} de moins que les {c} du contrat',
      vsEqual: 'Exactement les {c} du contrat',
      extrasTitle: 'Heures spéciales',
      nightHours: 'Nuit (21h–6h)',
      sundayHours: 'Dimanche',
      holidayHours: 'Jours fériés',
      nightRest: 'Repos compensateur de nuit (2 %) : {d}',
      overLimit: 'Plus que la limite de {l} d’heures supp par semaine (1/3 du contrat).',
      holiday: 'Férié',
      payLine_base: 'Salaire de base ({h})',
      payLine_hours: 'Heures travaillées × taux ({h})',
      payLine_hc: 'Heures supp à +{p} % ({h})',
      payLine_hcMaj: 'Majoration heures supp +{p} % ({h})',
      payLine_night: 'Majoration nuit +{p} % ({h})',
      payLine_sunday: 'Majoration dimanche +{p} % ({h})',
      payLine_holiday: 'Majoration férié +{p} % ({h})',
      payNote: 'Estimation brute (avant cotisations), à comparer avec la fiche de paie.',
      shouldBePaid: 'Elle devrait toucher ce mois-ci',
      netEst: 'Environ {n} net (estimation)',
      otPay: 'Heures supp : {d} → {a}',
      otWeekPay: 'Ces heures supp rapportent {a} brut',
      netPct: 'Net ≈ % du brut',
      netHelp: 'Pour estimer le net : environ 78 % du brut. À ajuster avec une fiche de paie.',
      rateLine: 'Taux horaire : {r}',
      xContractMonth: 'Heures prévues au contrat (mois)',
      favorites: 'Créneaux favoris',
      favoritesHelp: 'Ils apparaissent quand tu ajoutes des heures : un seul appui suffit.',
      addFavorite: 'Ajouter ce favori',
      removeFavorite: 'Retirer',
      backup: 'Sauvegarde',
      backupHelp: 'Les heures sont gardées sur ce téléphone. Fais une sauvegarde une fois par mois (envoie-la sur WhatsApp ou garde-la dans Fichiers).',
      makeBackup: 'Faire une sauvegarde',
      restore: 'Restaurer une sauvegarde',
      restoreConfirm: 'Remplacer toutes les heures par celles de la sauvegarde ?',
      restored: 'Sauvegarde restaurée ✓',
      badFile: 'Ce fichier n’est pas une sauvegarde valable.',
      lastBackup: 'Dernière sauvegarde : {d}',
      never: 'jamais',
      backupReminder: 'Pense à faire une sauvegarde (Réglages).',
      install: 'Installer sur le téléphone',
      installIos: 'iPhone : ouvre le lien dans Safari → bouton Partager → « Sur l’écran d’accueil ».',
      installAndroid: 'Android : ouvre le lien dans Chrome → menu ⋮ → « Ajouter à l’écran d’accueil ».',
      hoursUnit: 'h',
      // Exports
      xTitle: 'Heures de travail – {m}',
      xDate: 'Date',
      xDay: 'Jour',
      xStart: 'Début',
      xEnd: 'Fin',
      xPlace: 'Lieu',
      xHours: 'Heures',
      xHoursDec: 'Heures (décimal)',
      xNote: 'Note',
      xWeek: 'Semaine',
      xWeekTotal: 'Total semaine',
      xOt: 'Heures supp',
      xOt1: 'Supp +{p} %',
      xOt2: 'Supp +{p} %',
      xCounted: 'Compté en',
      xSummary: 'Résumé du mois',
      xDetail: 'Détail des heures',
      xTotal: 'Heures travaillées',
      xRate: 'Taux horaire brut',
      xBase: 'Heures × taux',
      xMaj: 'Majorations heures supp',
      xSalary: 'Salaire brut estimé',
      xContract: 'Contrat : {c} {p}',
      xGenerated: 'Créé le {d} avec l’appli « Mes heures »',
      xNextDay: '(lendemain)',
      sheetName: 'Heures',
    },
    ar: {
      appTitle: 'ساعات عملي',
      switchLang: 'Français',
      tabWeek: 'الأسبوع',
      tabMonth: 'الشهر',
      tabPay: 'الراتب',
      payDetail: 'التفاصيل',
      tabSettings: 'الإعدادات',
      today: 'اليوم',
      prevWeek: 'الأسبوع السابق',
      nextWeek: 'الأسبوع التالي',
      prevMonth: 'الشهر السابق',
      nextMonth: 'الشهر التالي',
      weekRange: 'من {a} إلى {b}',
      weekTotal: 'مجموع الأسبوع',
      ofContract: 'من أصل {c} في العقد',
      overtime: 'ساعات إضافية',
      otLabel: 'ساعات إضافية: {d}',
      otDetail: '{a} بزيادة {p1}% · {b} بزيادة {p2}%',
      noOvertime: 'لا توجد ساعات إضافية',
      addHours: 'إضافة ساعات عمل',
      editHours: 'تعديل الساعات',
      quickAdd: 'بنقرة واحدة',
      manual: 'أو يدويًا',
      date: 'التاريخ',
      start: 'البداية',
      end: 'النهاية',
      place: 'المكان',
      note: 'ملاحظة (اختياري)',
      notePh: 'مثلاً: تعويض زميلة',
      save: 'حفظ',
      cancel: 'إلغاء',
      delete: 'حذف',
      confirmDelete: 'حذف هذه الساعات؟',
      added: 'تمت الإضافة ✓',
      saved: 'تم الحفظ ✓',
      deleted: 'تم الحذف',
      undo: 'تراجع',
      range: 'من {a} إلى {b}',
      nextDay: 'ينتهي في اليوم التالي',
      duration: 'المدة: {d}',
      errMissing: 'أدخلي التاريخ ووقت البداية والنهاية.',
      errSame: 'وقت البداية والنهاية متساويان.',
      noPlace: 'المكان غير محدد',
      monthTotal: 'ساعات العمل',
      salary: 'الراتب الخام التقديري',
      needRate: 'أدخلي الأجر في الساعة في الإعدادات لرؤية الراتب.',
      byWeek: 'التفاصيل حسب الأسبوع',
      countedIn: 'الساعات الإضافية تُحسب في {m}',
      weekShort: '{a} – {b}',
      calendarHelp: 'اضغطي على يوم لرؤية أسبوعه.',
      send: 'إرسال الشهر',
      sendHelp: 'للمقارنة مع كشف الراتب أو للإرسال عبر واتساب.',
      excel: 'Excel',
      pdf: 'PDF',
      fileReady: 'الملف جاهز',
      share: 'مشاركة',
      download: 'تحميل',
      close: 'إغلاق',
      language: 'اللغة',
      yourName: 'الاسم (يظهر في الملفات)',
      contract: 'العقد',
      contractHours: 'عدد ساعات العقد',
      perWeek: 'في الأسبوع',
      perMonth: 'في الشهر',
      rate: 'الأجر الخام في الساعة (€)',
      ratePh: 'مثلاً: 12,02',
      maj1: 'الساعات الإضافية: النسبة الأولى (%)',
      maj2: 'الساعات الإضافية: النسبة الثانية (%)',
      otRule: 'الساعات التي تتجاوز العقد (كل أسبوع) ساعات إضافية: حتى عُشر العقد ({cap}) بالنسبة الأولى، وما بعدها بالنسبة الثانية. الحد الأقصى: ثلث العقد ({lim}) في الأسبوع. الأسبوع المشترك بين شهرين يُحسب في الشهر الذي ينتهي فيه.',
      contractHoursPh: 'مثلاً: 18h15',
      badHours: 'مدة غير مفهومة (مثلاً: 18h15).',
      badAmount: 'مبلغ غير مفهوم (مثلاً: 1000,00).',
      monthlyHours: 'ساعات العقد في الشهر',
      monthlyHoursHelp: 'تُستعمل لحساب الراتب الأساسي (مثلاً: 79h).',
      baseSalary: 'الراتب الأساسي الخام في الشهر (€)',
      basePh: 'مثلاً: 1000,00',
      rateAuto: 'أي {r} للساعة (محسوب من الراتب الأساسي).',
      rateManual: 'أدخلي الراتب الأساسي (أو الأجر في الساعة).',
      majTitle: 'نسب الزيادة (%)',
      majHc1: 'ساعات إضافية (حتى العُشر)',
      majHc2: 'ساعات إضافية (بعد العُشر)',
      majNight: 'الليل (21:00–6:00)',
      majSunday: 'الأحد',
      majHoliday: 'يوم عطلة رسمية',
      majHelp: 'الاتفاقية الجماعية لقطاع التنظيف: الأحد المبرمج في الجدول بزيادة 25% (100% إذا كان استثنائيًا)، ويوم العطلة المبرمج بزيادة 50% (100% إذا كان استثنائيًا). العقد ينص على زيادة 20% لساعات الليل. الأحد الذي يوافق عطلة رسمية يُحسب كعطلة فقط.',
      vsMore: 'أكثر من ساعات العقد ({c}) بـ {d}',
      vsLess: 'أقل من ساعات العقد ({c}) بـ {d}',
      vsEqual: 'تمامًا ساعات العقد ({c})',
      extrasTitle: 'ساعات خاصة',
      nightHours: 'الليل (21:00–6:00)',
      sundayHours: 'الأحد',
      holidayHours: 'أيام العطل الرسمية',
      nightRest: 'راحة تعويضية عن الليل (2%): {d}',
      overLimit: 'تجاوزتِ الحد المسموح: {l} ساعات إضافية في الأسبوع (ثلث العقد).',
      holiday: 'عطلة رسمية',
      payLine_base: 'الراتب الأساسي ({h})',
      payLine_hours: 'ساعات العمل × الأجر ({h})',
      payLine_hc: 'ساعات إضافية بزيادة {p}% ({h})',
      payLine_hcMaj: 'زيادة الساعات الإضافية {p}% ({h})',
      payLine_night: 'زيادة الليل {p}% ({h})',
      payLine_sunday: 'زيادة الأحد {p}% ({h})',
      payLine_holiday: 'زيادة العطلة الرسمية {p}% ({h})',
      payNote: 'تقدير خام (قبل الاقتطاعات)، للمقارنة مع كشف الراتب.',
      shouldBePaid: 'ما يجب أن تتقاضاه هذا الشهر',
      netEst: 'حوالي {n} صافي (تقدير)',
      otPay: 'ساعات إضافية: {d} ← {a}',
      otWeekPay: 'هذه الساعات الإضافية تساوي {a} خام',
      netPct: 'الصافي ≈ % من الخام',
      netHelp: 'لتقدير الصافي: حوالي 78% من الخام. يمكن تعديله حسب كشف الراتب.',
      rateLine: 'الأجر في الساعة: {r}',
      xContractMonth: 'ساعات العقد في الشهر',
      favorites: 'الأوقات المفضلة',
      favoritesHelp: 'تظهر عند إضافة الساعات: نقرة واحدة تكفي.',
      addFavorite: 'إضافة هذا الوقت',
      removeFavorite: 'إزالة',
      backup: 'نسخة احتياطية',
      backupHelp: 'الساعات محفوظة في هذا الهاتف. اصنعي نسخة احتياطية مرة في الشهر (أرسليها في واتساب أو احفظيها في الملفات).',
      makeBackup: 'صنع نسخة احتياطية',
      restore: 'استرجاع نسخة احتياطية',
      restoreConfirm: 'استبدال كل الساعات بالساعات الموجودة في النسخة الاحتياطية؟',
      restored: 'تم الاسترجاع ✓',
      badFile: 'هذا الملف ليس نسخة احتياطية صالحة.',
      lastBackup: 'آخر نسخة: {d}',
      never: 'أبدًا',
      backupReminder: 'لا تنسي صنع نسخة احتياطية (الإعدادات).',
      install: 'التثبيت على الهاتف',
      installIos: 'آيفون: افتحي الرابط في Safari ← زر المشاركة ← «إضافة إلى الشاشة الرئيسية».',
      installAndroid: 'أندرويد: افتحي الرابط في Chrome ← القائمة ⋮ ← «إضافة إلى الشاشة الرئيسية».',
      hoursUnit: 'س',
      xTitle: 'ساعات العمل – {m}',
      xDate: 'التاريخ',
      xDay: 'اليوم',
      xStart: 'البداية',
      xEnd: 'النهاية',
      xPlace: 'المكان',
      xHours: 'الساعات',
      xHoursDec: 'الساعات (عشري)',
      xNote: 'ملاحظة',
      xWeek: 'الأسبوع',
      xWeekTotal: 'مجموع الأسبوع',
      xOt: 'ساعات إضافية',
      xOt1: 'إضافية +{p}%',
      xOt2: 'إضافية +{p}%',
      xCounted: 'تُحسب في',
      xSummary: 'ملخص الشهر',
      xDetail: 'تفاصيل الساعات',
      xTotal: 'ساعات العمل',
      xRate: 'الأجر الخام في الساعة',
      xBase: 'الساعات × الأجر',
      xMaj: 'زيادة الساعات الإضافية',
      xSalary: 'الراتب الخام التقديري',
      xContract: 'العقد: {c} {p}',
      xGenerated: 'أُنشئ في {d} بتطبيق «ساعات عملي»',
      xNextDay: '(اليوم التالي)',
      sheetName: 'الساعات',
    },
  };

  const DAYS = {
    fr: ['lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi', 'dimanche'],
    ar: ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'],
  };
  const DAYS_SHORT = {
    fr: ['L', 'M', 'M', 'J', 'V', 'S', 'D'],
    ar: ['ن', 'ث', 'ر', 'خ', 'ج', 'س', 'ح'],
  };
  const MONTHS = {
    fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'],
    // Noms des mois utilisés en Algérie
    ar: ['جانفي', 'فيفري', 'مارس', 'أفريل', 'ماي', 'جوان', 'جويلية', 'أوت', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
  };
  const MONTHS_SHORT = {
    fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
    ar: MONTHS.ar,
  };

  function make(lang) {
    const L = STRINGS[lang] ? lang : 'fr';
    const S = STRINGS[L];

    function t(key, vars) {
      let s = S[key] != null ? S[key] : STRINGS.fr[key] != null ? STRINGS.fr[key] : key;
      if (vars) Object.keys(vars).forEach((k) => { s = s.split('{' + k + '}').join(vars[k]); });
      return s;
    }
    const parts = (date) => {
      const [y, m, d] = date.split('-').map(Number);
      return { y, m, d };
    };
    const wd = (date) => {
      const [y, m, d] = date.split('-').map(Number);
      return (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7;
    };

    return {
      lang: L,
      dir: L === 'ar' ? 'rtl' : 'ltr',
      t,
      dayName: (date) => DAYS[L][wd(date)],
      dayShort: (i) => DAYS_SHORT[L][i],
      monthName: (m) => MONTHS[L][m - 1],
      /** « jeudi 1 octobre » / « الخميس 1 أكتوبر » */
      dateLong(date) {
        const p = parts(date);
        return DAYS[L][wd(date)] + ' ' + p.d + ' ' + MONTHS[L][p.m - 1];
      },
      /** « 1 oct. » / « 1 أكتوبر » */
      dateShort(date) {
        const p = parts(date);
        return p.d + ' ' + MONTHS_SHORT[L][p.m - 1];
      },
      /** « 01/10/2026 » */
      dateNum(date) {
        const p = parts(date);
        return String(p.d).padStart(2, '0') + '/' + String(p.m).padStart(2, '0') + '/' + p.y;
      },
      /** « octobre 2026 » */
      monthTitle(mk) {
        const [y, m] = mk.split('-').map(Number);
        return MONTHS[L][m - 1] + ' ' + y;
      },
      /** Plage d'une semaine : « Du 5 au 11 octobre » ou « Du 26 oct. au 1 nov. » */
      weekRange(a, b) {
        const pa = parts(a);
        const pb = parts(b);
        const left = pa.m === pb.m ? String(pa.d) : pa.d + ' ' + MONTHS_SHORT[L][pa.m - 1];
        const right = pa.m === pb.m ? pb.d + ' ' + MONTHS[L][pb.m - 1] : pb.d + ' ' + MONTHS_SHORT[L][pb.m - 1];
        return t('weekRange', { a: left, b: right });
      },
      /** Durée lisible : « 3h30 » / « 3 س 30 د » */
      dur(min) {
        const h = Math.floor(min / 60);
        const m = min % 60;
        if (L === 'ar') return m ? h + ' س ' + m + ' د' : h + ' س';
        return m ? h + 'h' + String(m).padStart(2, '0') : h + 'h';
      },
      /** Durée courte pour les cases du calendrier : « 6h30 » / « 6:30 » */
      durCompact(min) {
        const h = Math.floor(min / 60);
        const m = min % 60;
        if (L === 'ar') return h + ':' + String(m).padStart(2, '0');
        return m ? h + 'h' + String(m).padStart(2, '0') : h + 'h';
      },
      money(x) {
        return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(x);
      },
      num(x) {
        return new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(x);
      },
    };
  }

  return { make, STRINGS };
});
