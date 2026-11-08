/*
 * PDF du mois, sans bibliothèque externe.
 * Chaque page est dessinée dans un canvas (le navigateur gère bien l'arabe),
 * puis enregistrée en image JPEG et placée dans un fichier PDF format A4.
 */
(function (root) {
  'use strict';

  const W = 1240; // A4 à 150 points par pouce
  const H = 1754;
  const M = 80; // marges
  const FONT = 'system-ui, -apple-system, "Segoe UI", Roboto, "Noto Sans Arabic", "Geeza Pro", Tahoma, Arial, sans-serif';
  const COLORS = { text: '#1c2430', muted: '#5b6675', line: '#d9e0e7', head: '#dcebf5', box: '#eef6f5', accent: '#0b7a75', ot: '#b4480b' };

  function font(size, weight) {
    return (weight || 400) + ' ' + size + 'px ' + FONT;
  }

  function fit(ctx, text, maxW) {
    text = String(text);
    if (ctx.measureText(text).width <= maxW) return text;
    let s = text;
    while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1);
    return s + '…';
  }

  /** Mise en page sur plusieurs pages. */
  function layout(rep, I) {
    const rtl = rep.rtl;
    const pages = [];
    let ctx;
    let y;

    function newPage() {
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      canvas.setAttribute('dir', rtl ? 'rtl' : 'ltr');
      ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.direction = rtl ? 'rtl' : 'ltr';
      ctx.textBaseline = 'middle';
      pages.push(canvas);
      y = M;
    }

    /** Texte aligné au début de la ligne (à droite en arabe, à gauche en français). */
    function textStart(str, x, yy, maxW, f, color) {
      ctx.font = f;
      ctx.fillStyle = color || COLORS.text;
      ctx.textAlign = rtl ? 'right' : 'left';
      const px = rtl ? W - x : x;
      ctx.fillText(fit(ctx, str, maxW), px, yy);
    }
    /** Texte aligné à la fin de la ligne (à gauche en arabe, à droite en français). */
    function textEnd(str, x, yy, maxW, f, color) {
      ctx.font = f;
      ctx.fillStyle = color || COLORS.text;
      ctx.textAlign = rtl ? 'left' : 'right';
      const px = rtl ? W - x : x;
      ctx.fillText(fit(ctx, str, maxW), px, yy);
    }
    function rect(x, yy, w, h, color) {
      ctx.fillStyle = color;
      ctx.fillRect(rtl ? W - x - w : x, yy, w, h);
    }
    function ensure(h) {
      if (y + h > H - M - 40) newPage();
    }

    function table(cols, headers, rows, opts) {
      opts = opts || {};
      const rowH = 46;
      const drawHead = () => {
        rect(M, y, W - 2 * M, rowH, COLORS.head);
        let x = M;
        cols.forEach((c, i) => {
          const f = font(20, 700);
          if (c.align === 'end') textEnd(headers[i], x + c.w - 12, y + rowH / 2, c.w - 24, f);
          else textStart(headers[i], x + 12, y + rowH / 2, c.w - 24, f);
          x += c.w;
        });
        y += rowH;
      };
      ensure(rowH * 2);
      drawHead();
      rows.forEach((r) => {
        if (y + rowH > H - M - 40) {
          newPage();
          drawHead();
        }
        if (r.bold) rect(M, y, W - 2 * M, rowH, COLORS.box);
        let x = M;
        cols.forEach((c, i) => {
          const f = font(20, r.bold ? 700 : 400);
          const color = r.colors && r.colors[i] ? r.colors[i] : COLORS.text;
          if (c.align === 'end') textEnd(r.cells[i], x + c.w - 12, y + rowH / 2, c.w - 24, f, color);
          else textStart(r.cells[i], x + 12, y + rowH / 2, c.w - 24, f, color);
          x += c.w;
        });
        ctx.fillStyle = COLORS.line;
        ctx.fillRect(M, y + rowH - 1, W - 2 * M, 1);
        y += rowH;
      });
      y += opts.after != null ? opts.after : 36;
    }

    function heading(str) {
      ensure(110);
      textStart(str, M, y + 20, W - 2 * M, font(28, 700), COLORS.accent);
      y += 54;
    }

    newPage();

    // En-tête
    textStart(rep.title, M, y + 26, W - 2 * M, font(46, 700));
    y += 70;
    const sub = [rep.name, rep.contractLine].filter(Boolean).join('  ·  ');
    if (sub) {
      textStart(sub, M, y + 14, W - 2 * M, font(24, 400), COLORS.muted);
      y += 46;
    }
    y += 16;

    // Résumé du mois
    const sumRows = rep.summary.length + rep.money.length;
    const boxH = 30 + sumRows * 48;
    rect(M, y, W - 2 * M, boxH, COLORS.box);
    let yy = y + 15 + 24;
    rep.summary.forEach((r, i) => {
      const color = i > 0 && r.min > 0 ? COLORS.ot : COLORS.text;
      textStart(r.label, M + 24, yy, 640, font(26, i === 0 ? 700 : 400));
      textEnd(I.dur(r.min) + '   (' + I.num(C2(r.min)) + ')', W - M - 24, yy, 380, font(26, i === 0 ? 700 : 400), color);
      yy += 48;
    });
    rep.money.forEach((m) => {
      textStart(m.label, M + 24, yy, 640, font(26, m.strong ? 700 : 400));
      textEnd(I.money(m.value), W - M - 24, yy, 380, font(26, m.strong ? 700 : 400));
      yy += 48;
    });
    y += boxH + 44;

    // Détail par semaine
    if (rep.weekMode && rep.weeks.length) {
      heading(I.t('byWeek'));
      const cols = [{ w: 290 }, { w: 160, align: 'end' }, { w: 160, align: 'end' }, { w: 470 }];
      const rows = rep.weeks.map((w) => ({
        cells: [w.label, I.dur(w.total), w.over ? I.dur(w.over) : '—', w.over > 0 && !w.counted ? I.t('countedIn', { m: w.countedIn }) : w.over > 0 ? I.t('otDetail', { a: I.dur(w.t1), b: I.dur(w.t2), p1: rep.p1, p2: rep.p2 }) : ''],
        colors: [null, null, w.over ? COLORS.ot : COLORS.muted, COLORS.muted],
      }));
      table(cols, [I.t('xWeek'), I.t('xWeekTotal'), I.t('xOt'), ''], rows);
    }

    // Détail des créneaux
    heading(I.t('xDetail'));
    const cols = [{ w: 140 }, { w: 130 }, { w: 360 }, { w: 170 }, { w: 150, align: 'end' }, { w: 130 }];
    const rows = rep.shifts.map((s) => ({ cells: [s.date, s.day, s.range, s.place || '—', I.dur(s.min), s.note] }));
    rows.push({ cells: [I.t('xTotal'), '', '', '', I.dur(rep.totalMin), ''], bold: true });
    table(cols, [I.t('xDate'), I.t('xDay'), I.t('xStart') + ' / ' + I.t('xEnd'), I.t('xPlace'), I.t('xHours'), I.t('xNote')], rows, { after: 0 });

    // Pied de page sur chaque page
    pages.forEach((canvas, i) => {
      const c = canvas.getContext('2d');
      c.direction = rtl ? 'rtl' : 'ltr';
      c.textBaseline = 'middle';
      c.font = font(20, 400);
      c.fillStyle = COLORS.muted;
      c.textAlign = rtl ? 'right' : 'left';
      c.fillText(rep.generated, rtl ? W - M : M, H - M + 10);
      c.textAlign = rtl ? 'left' : 'right';
      c.fillText((i + 1) + ' / ' + pages.length, rtl ? M : W - M, H - M + 10);
    });

    return pages;
  }

  const C2 = (min) => Math.round((min / 60) * 100) / 100;

  function canvasToJpeg(canvas) {
    return new Promise((resolve, reject) => {
      if (canvas.toBlob) {
        canvas.toBlob((blob) => {
          if (!blob) return reject(new Error('jpeg'));
          blob.arrayBuffer().then((buf) => resolve(new Uint8Array(buf)), reject);
        }, 'image/jpeg', 0.9);
      } else {
        const b64 = canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
        const bin = atob(b64);
        const out = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
        resolve(out);
      }
    });
  }

  /** Assemble un PDF à partir d'images JPEG (une par page, format A4). */
  function pdfFromJpegs(images) {
    const enc = new TextEncoder();
    const parts = [];
    const offsets = [];
    let offset = 0;
    const push = (x) => {
      const b = typeof x === 'string' ? enc.encode(x) : x;
      parts.push(b);
      offset += b.length;
    };
    const obj = (num, body) => {
      offsets[num] = offset;
      push(num + ' 0 obj\n');
      body();
      push('\nendobj\n');
    };

    push('%PDF-1.4\n%');
    push(new Uint8Array([0xe2, 0xe3, 0xcf, 0xd3, 0x0a]));

    const n = images.length;
    obj(1, () => push('<< /Type /Catalog /Pages 2 0 R >>'));
    obj(2, () => push('<< /Type /Pages /Kids [' + images.map((_, i) => (3 + 3 * i) + ' 0 R').join(' ') + '] /Count ' + n + ' >>'));
    images.forEach((img, i) => {
      const page = 3 + 3 * i;
      const content = 4 + 3 * i;
      const image = 5 + 3 * i;
      obj(page, () => push('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595.28 841.89] /Resources << /XObject << /Im' + i + ' ' + image + ' 0 R >> >> /Contents ' + content + ' 0 R >>'));
      const draw = 'q 595.28 0 0 841.89 0 0 cm /Im' + i + ' Do Q';
      obj(content, () => {
        push('<< /Length ' + draw.length + ' >>\nstream\n');
        push(draw);
        push('\nendstream');
      });
      obj(image, () => {
        push('<< /Type /XObject /Subtype /Image /Width ' + img.w + ' /Height ' + img.h + ' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + img.bytes.length + ' >>\nstream\n');
        push(img.bytes);
        push('\nendstream');
      });
    });

    const size = 3 + 3 * n;
    const xrefAt = offset;
    let xref = 'xref\n0 ' + size + '\n0000000000 65535 f \n';
    for (let k = 1; k < size; k++) xref += String(offsets[k]).padStart(10, '0') + ' 00000 n \n';
    push(xref);
    push('trailer\n<< /Size ' + size + ' /Root 1 0 R >>\nstartxref\n' + xrefAt + '\n%%EOF\n');

    const out = new Uint8Array(offset);
    let p = 0;
    parts.forEach((b) => { out.set(b, p); p += b.length; });
    return out;
  }

  async function build(rep, I) {
    const pages = layout(rep, I);
    const images = [];
    for (const canvas of pages) images.push({ bytes: await canvasToJpeg(canvas), w: canvas.width, h: canvas.height });
    return new Blob([pdfFromJpegs(images)], { type: 'application/pdf' });
  }

  root.HMPdf = { build, layout, pdfFromJpegs };
})(typeof self !== 'undefined' ? self : this);
