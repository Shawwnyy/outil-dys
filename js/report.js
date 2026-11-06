/* Outil Dys — rapports PDF (pdf-lib), progression, exercices de couleurs, concentration, modes d'apprentissage. */
'use strict';

// ====================================================================================================  moteur PDF
const Rep = (() => {
  const { PDFDocument, StandardFonts, rgb } = PDFLib; const PW = 595.28, PH = 841.89, M = 48;
  const col = h => { const m = /^#?(..)(..)(..)$/.exec(h); return rgb(parseInt(m[1], 16) / 255, parseInt(m[2], 16) / 255, parseInt(m[3], 16) / 255); };
  const light = (h, a) => { const m = /^#?(..)(..)(..)$/.exec(h); const f = x => (parseInt(x, 16) * (1 - a) + 255 * a) / 255; return rgb(f(m[1]), f(m[2]), f(m[3])); };
  class Doc {
    static async create() { const pdf = await PDFDocument.create(); const d = new Doc(pdf); d.f = await pdf.embedFont(StandardFonts.Helvetica); d.fb = await pdf.embedFont(StandardFonts.HelveticaBold); d.cs = new Set(d.f.getCharacterSet()); d.page(); return d; }
    constructor(pdf) { this.pdf = pdf; }
    page() { this.p = this.pdf.addPage([PW, PH]); this.y = PH - M; }
    safe(s) { return [...String(s).replace(/[   ]/g, ' ').replace(/→/g, '->').replace(/≠/g, '!=').replace(/[✓✔]/g, 'v').replace(/✗/g, 'x').replace(/↺/g, 'R').replace(/∅/g, 'M').replace(/␣/g, '_').replace(/≈/g, '~').replace(/★/g, '*').replace(/▢/g, '[ ]').replace(/[‑‐]/g, '-')].map(ch => (ch === '\n' || this.cs.has(ch.codePointAt(0))) ? ch : '?').join(''); }
    ensure(h) { if (this.y - h < M + 14) this.page(); }
    lines(str, size, width, font) { const out = []; String(this.safe(str)).split('\n').forEach(par => { let line = ''; par.split(/\s+/).forEach(w => { const t = line ? line + ' ' + w : w; if (font.widthOfTextAtSize(t, size) > width && line) { out.push(line); line = w; } else line = t; }); out.push(line); }); return out; }
    text(str, o = {}) { const size = o.size || 10.5, font = o.bold ? this.fb : this.f, ind = o.indent || 0; const L = this.lines(str, size, PW - 2 * M - ind, font); L.forEach(l => { this.ensure(size + 5); this.y -= size + 3; this.p.drawText(l, { x: M + ind, y: this.y, size, font, color: o.color ? col(o.color) : rgb(.12, .13, .18) }); }); this.y -= o.after ?? 4; }
    h1(t) { this.text(t, { size: 20, bold: true, color: '#1d4ed8', after: 8 }); }
    h2(t) { this.y -= 8; this.text(t, { size: 13.5, bold: true, color: '#111827', after: 4 }); }
    bullets(a, o = {}) { a.forEach(x => this.text('•  ' + x, { indent: 10, ...o, after: 2 })); this.y -= 4; }
    rule() { this.ensure(10); this.y -= 6; this.p.drawLine({ start: { x: M, y: this.y }, end: { x: PW - M, y: this.y }, thickness: .8, color: rgb(.8, .8, .8) }); this.y -= 6; }
    legend() {
      this.h2('Légende des couleurs'); this.text('Chaque catégorie a une couleur, une icône et un nom. Les erreurs qui touchent plusieurs mots ou une phrase sont surlignées plus légèrement.', { size: 9.5, color: '#4b5563' });
      CATS.forEach(c => { const L = this.lines(`${c.libelle} — ${c.expl}`, 9.5, PW - 2 * M - 70, this.f); this.ensure(L.length * 12 + 8); const top = this.y; this.p.drawRectangle({ x: M, y: top - 13, width: 52, height: 13, color: col(App.color(c.id)) }); this.p.drawText(this.safe(`${c.icone} ${c.nom}`), { x: M + 3, y: top - 10.5, size: 8.5, font: this.fb, color: rgb(1, 1, 1) }); L.forEach((l, i) => this.p.drawText(l, { x: M + 62, y: top - 10 - i * 12, size: 9.5, font: this.f, color: rgb(.12, .13, .18) })); this.y -= Math.max(16, L.length * 12 + 4); });
    }
    rich(text, errors, o = {}) {
      const size = o.size || 10.5, lh = size + 6, right = PW - M; const pts = new Set([0, text.length]); errors.forEach(e => { pts.add(e.start); pts.add(e.end); }); const P = [...pts].sort((a, b) => a - b); const toks = [];
      for (let i = 0; i < P.length - 1; i++) { const a = P[i], b = P[i + 1]; const cover = errors.filter(e => e.start <= a && e.end >= b).sort((x, y) => (x.end - x.start) - (y.end - y.start)); const c = cover.length ? App.color(cover[0].cat) : null; const seg = this.safe(text.slice(a, b)); const parts = seg.split(/(\n|\s+)/); parts.forEach(w => { if (w === '') return; toks.push({ t: w, c }); }); }
      let x = M; this.ensure(lh); this.y -= size; const sw = this.f.widthOfTextAtSize(' ', size);
      toks.forEach((k, i) => {
        if (k.t === '\n') { this.y -= lh; this.ensure(lh); x = M; return; }
        if (/^\s+$/.test(k.t)) { const w = sw * k.t.length; if (k.c && toks[i + 1] && toks[i + 1].c === k.c && toks[i + 1].t !== '\n') this.p.drawRectangle({ x, y: this.y - 3, width: w, height: size + 3, color: light(k.c, .6) }); x += w; return; }
        const w = this.f.widthOfTextAtSize(k.t, size); if (x + w > right && x > M) { this.y -= lh; this.ensure(lh); x = M; }
        if (k.c) { this.p.drawRectangle({ x: x - 1, y: this.y - 3, width: w + 2, height: size + 3, color: light(k.c, .6) }); this.p.drawLine({ start: { x: x - 1, y: this.y - 3 }, end: { x: x + w + 1, y: this.y - 3 }, thickness: 1.4, color: col(k.c) }); }
        this.p.drawText(k.t, { x, y: this.y, size, font: this.f, color: k.c || !o.okBlue ? rgb(.1, .1, .12) : rgb(.1, .25, .65) }); x += w;
      }); this.y -= lh;
    }
    table(head, rows, widths) {
      const size = 9, W = PW - 2 * M; const ws = widths.map(w => w * W); const draw = (cells, bold, bg) => { const L = cells.map((c, i) => this.lines(c, size, ws[i] - 8, bold ? this.fb : this.f)); const hh = Math.max(...L.map(l => l.length)) * (size + 3) + 8; this.ensure(hh); const top = this.y; if (bg) this.p.drawRectangle({ x: M, y: top - hh, width: W, height: hh, color: rgb(.93, .94, .97) }); let x = M; L.forEach((l, i) => { l.forEach((ln, j) => this.p.drawText(ln, { x: x + 4, y: top - 4 - size - j * (size + 3) + 1, size, font: bold ? this.fb : this.f, color: rgb(.12, .13, .18) })); x += ws[i]; }); this.p.drawLine({ start: { x: M, y: top - hh }, end: { x: M + W, y: top - hh }, thickness: .5, color: rgb(.75, .75, .75) }); this.y -= hh; };
      draw(head, true, true); rows.forEach(r => draw(r, false, false)); this.y -= 6;
    }
    async save(title) { const n = this.pdf.getPageCount(); try { const r = await fetch('img/humanix.png'); if (r.ok) { const im = await this.pdf.embedPng(await r.arrayBuffer()); this.pdf.getPages().forEach(p => p.drawImage(im, { x: PW - M - 76, y: PH - 14 - 21.7, width: 76, height: 21.7 })); } } catch (e) { /* logo facultatif : sans lui le PDF reste complet */ } this.pdf.getPages().forEach((p, i) => p.drawText(this.safe(`Outil Dys — ${title || ''} — page ${i + 1}/${n}`), { x: M, y: 22, size: 8, font: this.f, color: rgb(.45, .45, .5) })); const b = await this.pdf.save(); return new Blob([b], { type: 'application/pdf' }); }
  }
  const head = async (title, sub, note) => { const d = await Doc.create(); d.h1(title); d.text(`${sub || ''}${sub ? ' · ' : ''}${new Date().toLocaleString('fr-FR')}`, { size: 9.5, color: '#6b7280' }); d.text(note || 'Rapport produit localement par Outil Dys (correcteur à règles : il ne détecte pas toutes les erreurs).', { size: 9, color: '#6b7280' }); d.rule(); return d; };
  const errTable = (d, errors) => { if (!errors.length) return d.text('Aucune erreur détectée.'); d.table(['Catégorie', 'Extrait', 'Explication', 'Correction'], errors.map(e => [CAT[e.cat].nom + ' — ' + CAT[e.cat].libelle, e.orig.length > 60 ? e.orig.slice(0, 60) + '…' : e.orig, e.msg, e.sugg[0] !== undefined ? (e.sugg[0] === '' ? '(supprimer)' : e.sugg.slice(0, 2).join(' / ')) : '—']), [.2, .2, .4, .2]); };
  const summary = (d, errors) => { const c = {}; errors.forEach(e => c[e.cat] = (c[e.cat] || 0) + 1); const rows = CATS.filter(x => c[x.id]).map(x => [`${x.icone} ${x.nom} — ${x.libelle}`, String(c[x.id])]); if (rows.length) d.table(['Catégorie', 'Nombre'], rows, [.8, .2]); };
  return {
    Doc, head,
    async text(kind, title, text, errors) {
      const d = await head(({ phrase: 'Rapport — une phrase', texte: 'Rapport — texte', document: 'Rapport — document complet' })[kind] || 'Rapport', title);
      d.h2('Résumé'); d.text(`${Corrector.countWords(text)} mots · ${errors.length} point(s) relevé(s).`); summary(d, errors); d.legend();
      d.h2(kind === 'phrase' ? 'Phrase analysée' : 'Texte analysé'); d.rich(text, errors, { okBlue: true });
      d.h2('Erreurs et corrections'); errTable(d, errors); const fx = Corrector.applyFixes(text, Corrector.pickErrors(errors, 'safe').map(e => ({ start: e.start, end: e.end, text: e.sugg[0] })));
      d.h2('Version avec les corrections certaines appliquées'); d.text(fx.text); return d.save(title);
    },
    async cours(title, text) {
      const res = Corrector.analyze(text); const d = await head('Rapport — cours', title); const heads = TX.headings(text), defs = TX.definitions(text), hw = TX.hardWords(text).filter(w => w.known);
      d.h2('Vue d’ensemble'); d.text(`${res.stats.words} mots · ${res.stats.sentences} phrases · ${heads.length} titre(s) · ${defs.length} définition(s).`); d.legend();
      d.h2('Plan repéré'); heads.length ? d.bullets(heads.map(x => '   '.repeat(x.level - 1) + x.text)) : d.text('Aucun titre repéré.');
      d.h2('Définitions'); defs.length ? d.bullets(defs.map(x => `${x.term} : ${x.def}`)) : d.text('Aucune définition repérée.');
      d.h2('Mots expliqués (glossaire intégré)'); hw.length ? d.table(['Mot', 'Explication'], hw.map(w => [w.w, w.d]), [.25, .75]) : d.text('Aucun mot du glossaire.');
      d.h2('Texte avec corrections'); d.rich(text, res.errors, { okBlue: true }); d.h2('Erreurs et corrections'); errTable(d, res.errors);
      d.h2('Version simplifiée (niveau « simple »)'); d.text(Simp.simplify(text, 'simple').text); return d.save(title);
    },
    async dictee(dt) {
      const d = await head('Rapport — dictée', dt.train ? 'Entraînement' : 'Transcription'); d.legend(); d.h2(dt.train ? 'Ce que tu as écrit' : 'Transcription'); d.rich(dt.text || '(vide)', dt.errors || [], { okBlue: true });
      d.h2('Version corrigée / référence'); d.text(dt.fixed || ''); if (dt.report) { d.h2(`Comparaison : ${dt.report.score} % de mots justes`); dt.report.items.length ? d.table(['Catégorie', 'Explication'], dt.report.items.map(i => [`${CAT[i.cat].icone} ${CAT[i.cat].nom}`, i.msg]), [.25, .75]) : d.text('Aucune différence.'); }
      d.h2('Erreurs détectées dans la transcription'); errTable(d, dt.errors || []); return d.save('Dictée');
    },
    async exercices() {
      const d = await head('Rapport — série d’exercices', 'Exercices'); const ex = App.stats.exos; d.legend(); d.h2('Résultats'); if (!ex.length) { d.text('Aucun exercice réalisé pour l’instant.'); return d.save('Exercices'); }
      const by = {}; ex.forEach(e => { const b = by[e.cat] = by[e.cat] || { n: 0, ok: 0 }; b.n++; if (e.ok1 && e.ok2) b.ok++; });
      d.table(['Catégorie', 'Exercices', 'Réussis', 'Taux'], Object.entries(by).map(([k, v]) => [CAT[k] ? `${CAT[k].icone} ${CAT[k].nom} — ${CAT[k].libelle}` : k, String(v.n), String(v.ok), Math.round(v.ok / v.n * 100) + ' %']), [.5, .15, .15, .2]);
      d.h2('Derniers exercices'); d.table(['Date', 'Type', 'Résultat'], ex.slice(-25).reverse().map(e => [new Date(e.ts).toLocaleString('fr-FR'), CAT[e.cat] ? CAT[e.cat].nom : e.cat, e.ok1 && e.ok2 ? 'Réussi' : 'À revoir']), [.4, .3, .3]); return d.save('Exercices');
    },
    async fiche(title, f) {
      const d = await head('Fiche de révision', title); d.h2('À retenir'); d.bullets(f.summary); if (f.defs.length) { d.h2('Définitions'); d.table(['Notion', 'Définition'], f.defs.slice(0, 15).map(x => [x.term, x.def]), [.25, .75]); }
      d.h2('Mots importants'); d.text(f.kw.map(k => k.w).join('  ·  ')); if (f.heads.length) { d.h2('Plan'); d.bullets(f.heads.map(x => '   '.repeat(x.level - 1) + x.text)); } d.h2('Pour réviser'); d.bullets(['Lis les définitions à voix haute.', 'Cache la colonne de droite et retrouve chaque définition.', 'Refais le quiz dans Outil Dys.']); return d.save('Fiche');
    }
  };
})();

App.reg({
  id: 'rapports', title: 'Rapports PDF', group: 'outils', icon: '📄', render(el) {
    el.append(h('h1', null, 'Rapports PDF'), h('p', { class: 'muted' }, 'Chaque rapport contient la légende complète des couleurs, les erreurs et les corrections. Il est fabriqué sur cet ordinateur.'));
    const types = [['phrase', 'Une phrase'], ['texte', 'Un texte'], ['document', 'Un document complet'], ['cours', 'Un cours'], ['presentation', 'Une présentation PowerPoint'], ['dictee', 'Une dictée'], ['exercices', 'Une série d’exercices']];
    const sel = h('select', { 'aria-label': 'Type de rapport' }, types.map(([v, l]) => h('option', { value: v }, l))); const ta = textArea(App.ws.text, 6); const sentSel = h('select', { 'aria-label': 'Choisir la phrase' }); const info = h('p', { class: 'muted' }); const out = h('div');
    const refresh = () => {
      const k = sel.value; ta.style.display = ['phrase', 'texte', 'document', 'cours'].includes(k) ? '' : 'none'; sentSel.style.display = k === 'phrase' ? '' : 'none';
      sentSel.replaceChildren(...TX.sentences(ta.value).map((s, i) => h('option', { value: i }, s.length > 90 ? s.slice(0, 90) + '…' : s)));
      info.textContent = { presentation: App.slides ? `Présentation chargée : ${App.slides.name} (${App.slides.slides.length} diapositives).` : 'Aucune présentation chargée : va dans « Analyse PowerPoint » d’abord.', dictee: App.lastDictee ? 'Dernière dictée prête.' : 'Aucune dictée analysée : utilise « Dictée vocale ».', exercices: `${App.stats.exos.length} exercice(s) enregistré(s).` }[k] || '';
    };
    sel.onchange = refresh; ta.addEventListener('input', refresh);
    const go = async () => {
      try {
        const k = sel.value; let blob, name = k; const t = ta.value; App.setText(t);
        if (['phrase', 'texte', 'document'].includes(k)) { if (!t.trim()) return App.toast('Aucun texte.'); const txt = k === 'phrase' ? TX.sentences(t)[+sentSel.value || 0] : t; const r = Corrector.analyze(txt); blob = await Rep.text(k, App.ws.title, txt, r.errors); }
        else if (k === 'cours') { if (!t.trim()) return App.toast('Aucun texte.'); blob = await Rep.cours(App.ws.title, t); }
        else if (k === 'presentation') { if (!App.slides) return App.toast('Charge d’abord une présentation.'); blob = await Slides.report(); }
        else if (k === 'dictee') { if (!App.lastDictee) return App.toast('Analyse d’abord une dictée.'); blob = await Rep.dictee(App.lastDictee); }
        else blob = await Rep.exercices();
        App.download(blob, `rapport-${name}.pdf`); App.log('rapport', k, { count: 'reports' }); out.replaceChildren(h('div', { class: 'notice ok' }, 'Rapport téléchargé.'));
      } catch (e) { out.replaceChildren(h('div', { class: 'notice bad' }, 'Impossible de créer le rapport : ' + e.message)); }
    };
    el.append(h('label', null, 'Type de rapport'), sel, info, ta, sentSel, h('div', { class: 'row', style: 'margin:.5rem 0' }, h('button', { class: 'btn', onclick: go }, '📄 Générer le PDF')), out); refresh();
  }
});

// ====================================================================================================  Ma progression
App.reg({
  id: 'prog', title: 'Ma progression', group: 'espace', icon: '📈', render(el) {
    const s = App.stats; el.append(h('h1', null, 'Ma progression'));
    const cnt = [['Textes analysés', s.counts.texts], ['Documents importés / analysés', s.counts.docs], ['Diapositives analysées', s.counts.slides], ['Erreurs détectées', s.counts.errors], ['Dictées', s.counts.dictations], ['Exercices faits', s.counts.exercises], ['Fiches créées', s.counts.fiches], ['Rapports PDF', s.counts.reports]];
    el.append(h('div', { class: 'grid g3' }, cnt.map(([l, v]) => h('div', { class: 'card', style: 'text-align:center;margin:0' }, h('div', { style: 'font-size:2rem;font-weight:700;color:var(--accent)' }, String(v || 0)), h('div', { class: 'muted' }, l)))));
    const m = x => Math.round(x / 60);
    el.append(h('div', { class: 'card' }, h('b', null, 'Temps passé : '), `${m(s.timeSec.app)} min dans l’application, dont ${m(s.timeSec.learn)} min consacrées à l’apprentissage (exercices, dictée, quiz, matières).`));
    const hist = h('div'); let filter = null;
    const drawHist = () => { hist.replaceChildren(h('h2', null, 'Historique' + (filter ? ` — ${CAT[filter].nom}` : '')), filter ? h('button', { class: 'btn small sec', onclick: () => { filter = null; drawHist(); } }, 'Voir tout') : '', ...(s.hist.length ? [h('table', { class: 't' }, h('tr', null, h('th', null, 'Date'), h('th', null, 'Activité'), h('th', null, 'Document'), h('th', null, 'Erreurs')), s.hist.slice(0, 40).map(x => h('tr', null, h('td', null, new Date(x.ts).toLocaleString('fr-FR')), h('td', null, x.type), h('td', null, x.title), h('td', null, String(x.errors)))))] : [h('p', { class: 'muted' }, 'Rien pour l’instant.')])); };
    const cats = CATS.filter(c => c.id !== 'correct').map(c => [c, s.byCat[c.id] || 0]).sort((a, b) => b[1] - a[1]); const max = Math.max(1, ...cats.map(c => c[1]));
    const bars = h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Catégories d’erreurs les plus fréquentes'), h('p', { class: 'muted' }, 'Clique sur une barre pour filtrer l’historique.'), cats.map(([c, n]) => h('button', { class: 'row', style: 'width:100%;background:none;border:0;padding:.15rem 0;font:inherit;color:inherit;cursor:pointer;text-align:left', 'aria-label': `${c.libelle} : ${n}`, onclick: () => { filter = c.id; drawHist(); } }, h('span', { style: 'width:14rem' }, `${c.emoji} ${c.libelle}`), h('span', { class: 'bar grow', style: 'min-width:6rem' }, h('i', { style: `width:${n / max * 100}%;background:${App.color(c.id)}` })), h('b', null, String(n)))));
    el.append(bars);
    const days = []; for (let i = 13; i >= 0; i--) { const d = new Date(Date.now() - i * 864e5).toISOString().slice(0, 10); days.push([d, s.daily[d] || { analyses: 0, errors: 0 }]); }
    const mx = Math.max(1, ...days.map(d => d[1].analyses)); const pts = days.map((d, i) => [20 + i * 46, 110 - d[1].analyses / mx * 90]);
    el.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Activité des 14 derniers jours'), h('div', { html: `<svg viewBox="0 0 680 140" width="100%" role="img" aria-label="Nombre d'analyses par jour"><polyline fill="none" stroke="var(--accent)" stroke-width="3" points="${pts.map(p => p.join(',')).join(' ')}"/>${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="5" fill="var(--accent)"><title>${days[i][0]} : ${days[i][1].analyses} analyse(s), ${days[i][1].errors} erreur(s)</title></circle>`).join('')}${days.map((d, i) => `<text x="${20 + i * 46}" y="134" font-size="9" text-anchor="middle" fill="currentColor">${d[0].slice(8)}</text>`).join('')}</svg>` })));
    const ex = s.exos; const by = {}; ex.forEach(e => { const b = by[e.cat] = by[e.cat] || { n: 0, ok: 0 }; b.n++; if (e.ok1 && e.ok2) b.ok++; });
    el.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Résultats des exercices'), ex.length ? h('table', { class: 't' }, h('tr', null, h('th', null, 'Sujet'), h('th', null, 'Faits'), h('th', null, 'Réussis'), h('th', null, 'Taux')), Object.entries(by).map(([k, v]) => h('tr', null, h('td', null, CAT[k] ? CAT[k].libelle : k), h('td', null, String(v.n)), h('td', null, String(v.ok)), h('td', null, Math.round(v.ok / v.n * 100) + ' %')))) : h('p', { class: 'muted' }, 'Aucun exercice pour l’instant. Essaie « Apprendre les couleurs ».')));
    el.append(hist, h('div', { class: 'row', style: 'margin-top:1rem' }, h('button', { class: 'btn sec', onclick: () => App.download(new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' }), 'progression-outil-dys.json') }, 'Exporter mes données (JSON)'), h('button', { class: 'btn danger', onclick: () => { if (confirm('Remettre toutes les statistiques à zéro ?')) { Store.set('stats', null); location.reload(); } } }, 'Remettre à zéro')));
    drawHist();
  }
});
App.reg({ id: 'histo', title: 'Mon historique', group: 'espace', icon: '🕘', render() { location.hash = '#/prog'; } });

// ====================================================================================================  Apprendre les couleurs
App.reg({
  id: 'exercices', title: 'Apprendre les couleurs', group: 'activites', icon: '🎓', learn: true, render(el) {
    el.append(h('h1', null, 'Apprendre à reconnaître les erreurs'), h('p', { class: 'muted' }, 'Un passage apparaît en couleur. 1) Trouve la catégorie d’erreur. 2) Choisis la bonne correction. 3) Lis la règle. Les exercices s’adaptent : les catégories où tu te trompes le plus reviennent plus souvent.'));
    const st = Store.get('learn', { level: 1, hist: [] }); let level = st.level; let session = { n: 0, ok: 0 }; const area = h('div'); const bar = h('p', { class: 'muted' });
    const pick = () => {
      const pool = EXERCICES.filter(e => e[0] <= level); const by = {}; App.stats.exos.forEach(x => { const b = by[x.cat] = by[x.cat] || { n: 0, bad: 0 }; b.n++; if (!(x.ok1 && x.ok2)) b.bad++; });
      const w = pool.map(e => 1 + (by[e[1]] ? (by[e[1]].bad / by[e[1]].n) * 3 : 0.5) + ((App.stats.byCat[e[1]] || 0) > 0 ? 1 : 0) + (e[0] === level ? 1 : 0)); let r = Math.random() * w.reduce((a, b) => a + b, 0), i = 0; while ((r -= w[i]) > 0 && i < pool.length - 1) i++; return pool[i];
    };
    const shuffle = a => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
    const next = () => {
      const [lvl, cat, before, err, after, good, wrongs, rule] = pick(); const c = CAT[cat]; bar.textContent = `Niveau ${level} · ${session.ok} / ${session.n} réussis dans cette séance`;
      const text = before + err + after; const fake = [{ id: 'x', start: before.length, end: before.length + err.length, cat, msg: '', sugg: [], orig: err, rule: 'x', kind: 'info' }];
      const catOpts = shuffle([cat, ...shuffle(CATS.filter(x => x.id !== cat && x.id !== 'correct').map(x => x.id)).slice(0, 3)]); let ok1 = false;
      const card = h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Que vois-tu ?'), h('div', { class: 'marked', style: 'font-size:1.2em', html: App.markHTML(text, cat === 'correct' ? [] : fake, { showCorrect: false, icons: true }).replace(esc(err), cat === 'correct' ? `<span class="seg" style="background:${App.rgba(App.color('correct'), .25)};border-bottom:3px solid ${App.color('correct')}">${esc(err)}</span>` : esc(err)) }), h('p', null, 'Quelle est la catégorie de ce passage ?'));
      const q1 = h('div', { class: 'grid g2' }); const fb = h('div'); const q2 = h('div');
      catOpts.forEach(id => q1.append(h('button', { class: 'btn sec', style: 'text-align:left', onclick: () => { $$('button', q1).forEach(b => b.disabled = true); ok1 = id === cat; fb.replaceChildren(h('p', null, ok1 ? `✅ Oui : ${c.emoji} ${c.libelle}.` : `❌ C’était : ${c.emoji} ${c.libelle}.`)); step2(); } }, `${CAT[id].emoji} ${CAT[id].icone} ${CAT[id].libelle}`)));
      const step2 = () => {
        const opts = shuffle([good, ...wrongs]); const isBlue = cat === 'correct'; q2.replaceChildren(h('p', null, isBlue ? 'Faut-il changer ce mot ?' : 'Quelle est la bonne correction ?'), h('div', { class: 'grid g3' }, opts.map(o => h('button', { class: 'btn sec', onclick: () => { $$('button', q2).forEach(b => b.disabled = true); const ok2 = o === good; session.n++; if (ok1 && ok2) session.ok++; App.stats.exos.push({ ts: Date.now(), cat, ok1, ok2, lvl }); App.stats.counts.exercises++; App.saveStats();
          const recent = App.stats.exos.filter(x => x.lvl === level).slice(-6); if (recent.length >= 6 && recent.filter(x => x.ok1 && x.ok2).length >= 5 && level < 3) { level++; Store.set('learn', { level }); App.toast(`Bravo ! Passage au niveau ${level}.`); }
          fb.append(h('p', null, ok2 ? '✅ Bonne correction.' : `❌ La bonne correction : « ${good} ».`), h('div', { class: 'notice' }, h('b', null, 'La règle : '), rule), h('div', { class: 'row' }, App.listenBtn(() => rule, '🔊 Écouter la règle'), h('button', { class: 'btn', onclick: next }, 'Exercice suivant ▶'))); } }, o))));
      };
      card.append(q1, fb, q2); area.replaceChildren(card);
    };
    el.append(h('div', { class: 'row' }, h('label', { style: 'margin:0' }, 'Niveau : '), h('select', { 'aria-label': 'Niveau', onchange: ev => { level = +ev.target.value; Store.set('learn', { level }); next(); } }, [1, 2, 3].map(n => h('option', { value: n, selected: n === level }, 'Niveau ' + n))), h('a', { class: 'btn sec', onclick: () => App.showPop($('#main'), legendDialog()), href: '#/exercices' }, '🎨 Légende')), bar, area); next();
  }
});

// ====================================================================================================  Concentration et organisation
App.reg({
  id: 'concentration', title: 'Concentration et organisation', group: 'activites', icon: '🎯', learn: true, render(el) {
    const D = Store.get('conc', { tasks: [], goals: [], notes: '', plan: [] }); const save = () => Store.set('conc', D);
    el.append(h('h1', null, 'Concentration et organisation'), h('p', { class: 'muted' }, 'Découper un devoir, suivre ses tâches, un minuteur avec pauses, des objectifs courts, des notes. Le bouton « Concentration » en haut masque le menu.'));
    // minuteur
    const tm = h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, '⏱ Minuteur'));
    const work = h('input', { type: 'number', min: 1, max: 120, value: App.prefs.timerMin, 'aria-label': 'Minutes de travail', style: 'width:6rem', onchange: ev => { App.prefs.timerMin = Math.max(1, +ev.target.value || 25); App.savePrefs(); } }); const brk = h('input', { type: 'number', min: 1, max: 30, value: 5, 'aria-label': 'Minutes de pause', style: 'width:6rem' });
    tm.append(h('div', { class: 'row' }, h('label', { style: 'margin:0' }, 'Travail (min)'), work, h('label', { style: 'margin:0' }, 'Pause (min)'), brk), h('div', { class: 'row', style: 'margin-top:.5rem' }, h('button', { class: 'btn', onclick: () => App.timerStart() }, '▶ Démarrer le travail'), h('button', { class: 'btn sec', onclick: () => { const m = Math.max(1, +brk.value || 5); App.timerOn = true; App.timerPaused = false; App.timerLeft = m * 60; $('#timerBox').hidden = false; App.timerTick(); App.toast(`Pause de ${m} min.`); } }, '☕ Démarrer une pause'), h('button', { class: 'btn sec', onclick: () => { App.timerPaused = !App.timerPaused; } }, '⏯ Pause / reprise'), h('button', { class: 'btn sec', onclick: () => App.timerStop() }, '⏹ Arrêter')), h('p', { class: 'muted' }, 'Le minuteur reste visible en haut de la page si l’option « Minuteur visible » est cochée dans ton profil.'));
    // découpage
    const tk = h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, '🧩 Découper un devoir en étapes')); const consigne = h('textarea', { rows: 3, placeholder: 'Colle la consigne du devoir : je la découpe en petites étapes.', 'aria-label': 'Consigne du devoir' }); const name = h('input', { type: 'text', placeholder: 'Nom du devoir (ex. : Rédaction de français)', 'aria-label': 'Nom du devoir' }); const list = h('div');
    const drawTasks = () => { list.replaceChildren(); D.tasks.forEach((t, ti) => { const done = t.steps.filter(s => s.d).length; list.append(h('div', { class: 'card' }, h('div', { class: 'row' }, h('b', null, t.name), h('span', { class: 'badge' }, `${done}/${t.steps.length}`), h('span', { class: 'grow' }), h('button', { class: 'btn small danger', onclick: () => { D.tasks.splice(ti, 1); save(); drawTasks(); } }, 'Supprimer')), h('div', { class: 'bar', style: 'margin:.3rem 0' }, h('i', { style: `width:${t.steps.length ? done / t.steps.length * 100 : 0}%` })), t.steps.map(s => h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: s.d, onchange: ev => { s.d = ev.target.checked; save(); drawTasks(); } }), s.t)))); }); if (!D.tasks.length) list.append(h('p', { class: 'muted' }, 'Aucune tâche pour l’instant.')); };
    tk.append(name, consigne, h('div', { class: 'row', style: 'margin:.4rem 0' }, h('button', { class: 'btn', onclick: () => { const c = consigne.value.trim(); if (!c && !name.value.trim()) return App.toast('Écris un nom ou colle une consigne.'); const parts = TX.sentences(c).flatMap(s => s.split(/\s*;\s*|\s+puis\s+|\s+ensuite\s+/i)).map(s => capFirst(s.replace(/[.]$/, ''))).filter(s => s.length > 3); const steps = ['Lire la consigne en entier', 'Préparer le matériel (cahier, livre, stylo)', ...parts, 'Relire mon travail', 'Ranger mes affaires'].map(t => ({ t, d: false })); D.tasks.unshift({ name: name.value.trim() || 'Devoir', steps }); save(); name.value = ''; consigne.value = ''; drawTasks(); } }, 'Découper en étapes'), App.mic(consigne)), list); drawTasks();
    // objectifs + notes + révisions
    const goals = h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, '🎯 Objectifs courts')); const gl = h('div'); const gi = h('input', { type: 'text', placeholder: 'Un objectif pour aujourd’hui (ex. : relire la leçon 3)', 'aria-label': 'Nouvel objectif' });
    const drawGoals = () => { gl.replaceChildren(...D.goals.map((g, i) => h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: g.d, onchange: ev => { g.d = ev.target.checked; save(); } }), g.t, h('button', { class: 'btn small sec', 'aria-label': 'Supprimer', onclick: () => { D.goals.splice(i, 1); save(); drawGoals(); } }, '✕')))); };
    goals.append(h('div', { class: 'row' }, gi, h('button', { class: 'btn', onclick: () => { if (gi.value.trim()) { D.goals.push({ t: gi.value.trim(), d: false }); gi.value = ''; save(); drawGoals(); } } }, 'Ajouter')), gl); drawGoals();
    const plan = h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, '📅 Organiser mes révisions')); const pd = h('input', { type: 'date', 'aria-label': 'Date' }), pm = h('input', { type: 'text', placeholder: 'Matière / chapitre', 'aria-label': 'Matière' }), pt = h('input', { type: 'number', min: 5, step: 5, value: 25, 'aria-label': 'Durée en minutes', style: 'width:6rem' }); const pl = h('div');
    const drawPlan = () => { D.plan.sort((a, b) => a.d.localeCompare(b.d)); pl.replaceChildren(D.plan.length ? h('table', { class: 't' }, h('tr', null, h('th', null, 'Fait'), h('th', null, 'Date'), h('th', null, 'Matière'), h('th', null, 'Durée'), h('th', null, '')), D.plan.map((p, i) => h('tr', null, h('td', null, h('input', { type: 'checkbox', checked: p.ok, 'aria-label': 'Fait', onchange: ev => { p.ok = ev.target.checked; save(); } })), h('td', null, p.d), h('td', null, p.m), h('td', null, p.t + ' min'), h('td', null, h('button', { class: 'btn small sec', onclick: () => { D.plan.splice(i, 1); save(); drawPlan(); } }, '✕'))))) : h('p', { class: 'muted' }, 'Aucune séance prévue.')); };
    plan.append(h('div', { class: 'row' }, pd, pm, pt, h('button', { class: 'btn', onclick: () => { if (pd.value && pm.value.trim()) { D.plan.push({ d: pd.value, m: pm.value.trim(), t: +pt.value || 25, ok: false }); save(); drawPlan(); } else App.toast('Choisis une date et une matière.'); } }, 'Ajouter')), pl); drawPlan();
    const notes = h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, '🗒 Mes notes'), (() => { const t = h('textarea', { rows: 5, 'aria-label': 'Mes notes' }); t.value = D.notes; t.oninput = () => { D.notes = t.value; save(); }; return t; })(), h('div', { class: 'row', style: 'margin-top:.4rem' }, h('button', { class: 'btn sec', onclick: () => { App.setText(D.notes, 'Mes notes'); App.go('correcteur'); } }, 'Corriger mes notes')));
    el.append(tm, tk, goals, plan, notes);
  }
});

// ====================================================================================================  Modes d'apprentissage
const MODE_DEFS = [
  ['dyslexie', 'Dyslexie', 'Options pour lire plus confortablement : police lisible, espacement, règle de lecture, lecture audio, découpage en syllabes, textes aérés.', ['fontDys', 'spacing', 'airy', 'ruler', 'syllables', 'audio'], [['lecture', 'Lecture audio et syllabes'], ['correcteur', 'Correcteur'], ['simplif', 'Simplificateur']]],
  ['dysorthographie', 'Dysorthographie', 'Correction détaillée, explication de chaque erreur, exercices d’orthographe et comparaison avant / après.', ['detailCorr'], [['correcteur', 'Correcteur (avant / après)'], ['exercices', 'Exercices : apprendre les couleurs'], ['dictee', 'Dictée et entraînement']]],
  ['dyspraxie', 'Dyspraxie', 'Grandes zones cliquables, navigation simple et prévisible, raccourcis clavier, saisie vocale pour moins taper.', ['bigTargets', 'simpleNav', 'shortcuts', 'voiceInput'], [['dictee', 'Dictée vocale'], ['correcteur', 'Correcteur'], ['redaction', 'Assistant de rédaction (guidé)']]],
  ['dyscalculie', 'Dyscalculie', 'Calculs étape par étape, droite numérique, fractions, quantités, tables visuelles, conversion d’unités.', ['mathVisual', 'shortText'], [['maths', 'Mathématiques visuelles']]],
  ['dysphasie', 'Dysphasie', 'Consignes courtes, phrases simples, vocabulaire expliqué, possibilité d’écouter.', ['shortText', 'audio'], [['simplif', 'Simplificateur'], ['lecture', 'Lecture audio'], ['analyse', 'Comprendre mon cours']]],
  ['dysgraphie', 'Dysgraphie', 'Saisie vocale, correction détaillée et assistant de rédaction pas à pas pour réduire l’effort d’écriture.', ['voiceInput', 'detailCorr'], [['dictee', 'Dictée vocale'], ['redaction', 'Assistant de rédaction'], ['correcteur', 'Correcteur']]],
  ['tdah', 'TDAH', 'Mode concentration, tâches découpées, minuteur personnalisable, objectifs courts, interface calme.', ['focus', 'timer', 'shortText', 'calmVisual'], [['concentration', 'Concentration et organisation']]],
  ['hpi', 'HPI', 'Défis, approfondissement et connexions entre matières, à ton rythme. Rien n’est imposé.', ['deeper'], [['defis', 'Défis et approfondissement'], ['espace', 'À la découverte de l’espace']]],
  ['concentrationmode', 'Concentration', 'Masquer le superflu, avancer par petites étapes, mesurer son temps.', ['focus', 'timer'], [['concentration', 'Concentration et organisation']]],
  ['memorisation', 'Mémorisation', 'Fiches, flashcards, cartes mentales et quiz fabriqués à partir de tes cours, avec écoute possible.', ['shortText'], [['fiches', 'Fiches, flashcards, quiz'], ['exercices', 'Exercices']]],
  ['libre', 'Personnalisation libre', 'Choisis toi-même chaque option, sans passer par un profil.', Object.keys(FEATURES), [['settings', 'Police, couleurs, audio'], ['profil', 'Mes besoins et préférences']]]
];
MODE_DEFS.forEach(([id, title, desc, feats, tools]) => App.reg({
  id: 'mode-' + id, title, group: 'modes', render(el) {
    el.append(h('h1', null, 'Mode : ' + title), h('p', null, desc), h('div', { class: 'notice' }, 'Ce sont des options de confort et d’apprentissage, pas des règles associées à un diagnostic : active seulement celles qui t’aident. Aucune information médicale n’est demandée.'));
    el.append(h('h2', null, 'Options de ce mode'), h('div', { class: 'grid g2' }, feats.map(k => h('label', { class: 'chk card', style: 'margin:0' }, h('input', { type: 'checkbox', checked: !!App.profile.features[k], onchange: ev => { App.setFeature(k, ev.target.checked); if (k === 'simpleNav') App.buildNav(); if (k === 'focus') document.body.classList.toggle('focus', ev.target.checked); } }), FEATURES[k]))), h('h2', null, 'Outils utiles'), h('div', { class: 'row' }, tools.map(([t, l]) => h('a', { class: 'btn', href: '#/' + t }, l))));
  }
}));
