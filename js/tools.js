/* Outil Dys — outils de texte : lecture, simplification, lisibilité, dictée, cours, fiches, rédaction, OCR. Règles locales, aucun modèle de langage. */
'use strict';

// ====================================================================================================  utilitaires texte
const TX = {
  sentences: t => Corrector.splitSentences(t).map(s => s.text),
  words: t => Corrector.words(t).map(w => w.w),
  paragraphs: t => t.split(/\n\s*\n/).map(s => s.trim()).filter(Boolean),
  stemKey: w => w.toLowerCase().replace(/(s|x)$/, ''),
  keywords(text, n = 12) {
    const c = new Map(); TX.words(text).forEach(w => { const k = w.toLowerCase(); if (k.length < 5 || STOP.has(k) || /\d/.test(k)) return; const s = TX.stemKey(k); const e = c.get(s) || { w: k, n: 0 }; e.n++; c.set(s, e); });
    return [...c.values()].sort((a, b) => b.n - a.n || b.w.length - a.w.length).slice(0, n);
  },
  hardWords(text) {
    const seen = new Map();
    TX.words(text).forEach(w => { const k = w.toLowerCase(); if (STOP.has(k) || seen.has(k)) return; const g = GLOSSAIRE[k] || GLOSSAIRE[k.replace(/s$/, '')]; if (g || k.replace(/['’\-]/g, '').length >= 10) seen.set(k, g || (MORPHO.find(m => m[0].test(k)) ? 'Indice : ' + MORPHO.find(m => m[0].test(k))[1] + '.' : null)); });
    return [...seen.entries()].map(([w, d]) => ({ w, d, known: !!(GLOSSAIRE[w] || GLOSSAIRE[w.replace(/s$/, '')]) }));
  },
  definitions(text) {
    const out = []; const bad = /^(il|elle|ils|elles|ce|cela|ça|on|nous|je|tu|vous|ceci|c|qui|que|cet|cette|ces)$/i; const det = /^(?:un|une|le|la|les|l['’]|des|du|de la)\s*/i;
    for (const s of TX.sentences(text)) {
      let m;
      if ((m = /^(?:d[ée]finition|à retenir|retenir)\s*:\s*(.{4,})$/i.exec(s))) { out.push({ term: '(définition)', def: m[1], s }); continue; }
      if ((m = /^On appelle\s+(.{2,50}?)\s+(?:le|la|les|l['’]|un|une|des|ce qui|tout)\s+(.+)$/i.exec(s))) { out.push({ term: m[1].replace(det, ''), def: s, s }); continue; }
      m = /^((?:[^\s,.;:]+\s+){0,3}[^\s,.;:]+?)\s+(?:est|sont|désigne|désignent|signifie|correspond à|se définit comme|permet de|consiste à)\s+(.{8,})$/i.exec(s);
      if (m) { const term = m[1].replace(det, '').trim(); const first = term.split(/\s+/)[0]; if (term.length >= 3 && !bad.test(first) && !bad.test(term)) out.push({ term: term.charAt(0).toUpperCase() + term.slice(1), def: s, s }); }
      else if ((m = /^([^:.]{3,40})\s*:\s*(.{8,})$/.exec(s)) && m[1].split(/\s+/).length <= 4 && !/^(exemple|attention|remarque|note)/i.test(m[1])) out.push({ term: m[1].trim(), def: m[2], s });
    }
    const seen = new Set(); return out.filter(d => { const k = d.term.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
  },
  headings(text) {
    const lines = text.split('\n'); const out = [];
    lines.forEach((ln, i) => {
      const t = ln.trim(); if (!t || t.length > 80 || /[.!?…,;]$/.test(t)) return; const wc = t.split(/\s+/).length; if (wc > 10) return;
      const prevBlank = i === 0 || !lines[i - 1].trim(); const nextBlank = i === lines.length - 1 || !lines[i + 1].trim();
      const numbered = /^(\d+(?:\.\d+)*[.)]?|[IVX]+[.)]|[A-D][.)])\s+\S/.test(t); const kw = /^(chapitre|partie|section|titre|introduction|conclusion|d[ée]finition|le[çc]on|cours)\b/i.test(t);
      const upper = t === t.toUpperCase() && /\p{L}{3}/u.test(t); const md = /^#{1,4}\s/.test(t);
      if (numbered || kw || upper || md || (prevBlank && nextBlank === false && /^\p{Lu}/u.test(t) && wc <= 7)) {
        let lvl = 1; const nm = /^(\d+(?:\.\d+)*)/.exec(t); if (nm) lvl = nm[1].split('.').length; else if (md) lvl = (/^#+/.exec(t)[0].length); else if (!upper && !kw) lvl = 2;
        out.push({ text: t.replace(/^#{1,4}\s*/, ''), level: Math.min(lvl, 3), line: i });
      }
    });
    return out;
  },
  summarize(text, k) {
    const S = TX.sentences(text); if (S.length <= (k || 1)) return S;
    const freq = new Map(); TX.words(text).forEach(w => { const l = w.toLowerCase(); if (l.length < 4 || STOP.has(l)) return; const s = TX.stemKey(l); freq.set(s, (freq.get(s) || 0) + 1); });
    const sc = S.map((s, i) => { const ws = TX.words(s).filter(w => w.length >= 4 && !STOP.has(w.toLowerCase())); const v = ws.reduce((a, w) => a + (freq.get(TX.stemKey(w.toLowerCase())) || 0), 0) / Math.sqrt(ws.length + 3); return { i, s, v: v * (i === 0 ? 1.25 : 1) * (TX.words(s).length > 40 ? 0.6 : 1) }; });
    k = k || Math.max(1, Math.round(S.length / 3));
    return sc.sort((a, b) => b.v - a.v).slice(0, k).sort((a, b) => a.i - b.i).map(x => x.s);
  },
  difficulty(s) {
    const w = TX.words(s); const n = w.length || 1; const long = w.filter(x => x.length >= 9).length; const commas = (s.match(/,/g) || []).length; const sub = (s.match(/(?<![\p{L}])(que|qui|dont|lorsque|puisque|bien que|afin que|quoique|tandis que)(?![\p{L}])/giu) || []).length; const gl = w.filter(x => GLOSSAIRE[x.toLowerCase()]).length;
    return n / 12 + (long / n) * 5 + commas * 0.3 + sub * 0.5 + gl * 0.6;
  }
};
const capFirst = s => s.replace(/^(\s*)(\p{Ll})/u, (m, a, b) => a + b.toUpperCase());

// ====================================================================================================  syllabes (approximatif)
function syllabify(word) {
  const V = 'aeiouyàâäéèêëîïôöùûüœæ'; const w = word; const lw = w.toLowerCase(); if (lw.length <= 3) return [w];
  const isV = c => V.includes(c); const groups = []; let i = 0;
  while (i < lw.length) { if (isV(lw[i]) || (lw[i] === 'u' && lw[i - 1] === 'q')) { let j = i; while (j < lw.length && isV(lw[j])) j++; groups.push([i, j]); i = j; } else i++; }
  if (groups.length <= 1) return [w];
  const cuts = []; const inseparable = /^(bl|br|ch|cl|cr|dr|fl|fr|gl|gn|gr|ph|pl|pr|th|tr|vr|qu|sc|sp|st)$/;
  for (let g = 0; g < groups.length - 1; g++) {
    const a = groups[g][1], b = groups[g + 1][0]; const cons = b - a;
    if (cons === 0) cuts.push(b); else if (cons === 1) cuts.push(a); else { const last2 = lw.slice(b - 2, b); cuts.push(inseparable.test(last2) ? b - 2 : b - 1); }
  }
  let parts = []; let prev = 0; cuts.forEach(c => { parts.push(w.slice(prev, c)); prev = c; }); parts.push(w.slice(prev));
  const last = parts[parts.length - 1].toLowerCase(); if (parts.length > 1 && /^[^aeiouyàâäéèêëîïôöùûü]*(e|es|ent)$/.test(last) && !/[éèê]/.test(last)) { parts[parts.length - 2] += parts.pop(); }
  return parts.filter(Boolean);
}
const syllHTML = text => esc(text).replace(/[\p{L}\p{M}]+(?:['’][\p{L}\p{M}]+)*/gu, m => `<span class="syl">${syllabify(m).map(p => `<span>${p}</span>`).join('')}</span>`);

// ====================================================================================================  moteur de simplification
const Simp = {
  N: { courant: 1, simple: 2, tres: 3 }, MAX: { courant: 28, simple: 18, tres: 12 },
  _re: {},
  table(n) {
    if (this._re[n]) return this._re[n];
    const map = {}; SIMPLE_MAP.filter(e => e[2] <= n).forEach(e => map[e[0].toLowerCase()] = e[1]);
    const keys = Object.keys(map).sort((a, b) => b.length - a.length).map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+').replace(/'/g, "['’]"));
    return this._re[n] = { re: new RegExp(`(?<![\\p{L}\\p{M}])(?:${keys.join('|')})(?![\\p{L}\\p{M}])`, 'giu'), map };
  },
  words(text, level) {
    const t = this.table(this.N[level]); const changes = [];
    let out = text.replace(t.re, m => { const k = m.toLowerCase().replace(/\s+/g, ' ').replace(/’/g, "'"); const r = t.map[k]; if (r === undefined) return m; changes.push([m, r]); return Corrector.mc(m, r); });
    out = out.replace(/\b(beaucoup|assez|trop|peu) de ([aeiouyhéèêàâîïôû])/giu, (m, a, b) => `${a} d’${b}`).replace(/\bque (il|elle|ils|on|un|une)\b/giu, (m, a) => (a.toLowerCase() === 'ils' ? m : `qu’${a}`));
    return { text: out, changes };
  },
  splitSentence(s, maxW) {
    let parts = [s];
    const rules = [[/\s*;\s+/g, '. '], [/,\s+mais\s+/g, '. Mais '], [/,\s+donc\s+/g, '. Donc '], [/,\s+puis\s+/g, '. Ensuite, '], [/,\s+car\s+/g, '. En effet, '], [/,\s+ce qui\s+/g, '. Cela '], [/,\s+or\s+/g, '. Or ']];
    let t = s; rules.forEach(([re, rep]) => { t = t.replace(re, rep); });
    parts = t.split(/(?<=[.!?…])\s+/).map(p => p.trim()).filter(Boolean).map(capFirst);
    const out = [];
    parts.forEach(p => {
      const w = TX.words(p).length;
      if (w > maxW && p.includes(',')) { const idx = []; let m; const re = /,\s+/g; while ((m = re.exec(p))) idx.push(m.index); let best = -1, bd = 1e9; idx.forEach(i => { const l = TX.words(p.slice(0, i)).length, r = w - l; if (l >= 5 && r >= 5 && Math.abs(l - r) < bd) { bd = Math.abs(l - r); best = i; } }); if (best >= 0) { out.push(p.slice(0, best).trim() + '.', capFirst(p.slice(best + 1).trim())); return; } }
      out.push(p);
    });
    return out.map(x => (/[.!?…»]$/.test(x) ? x : x + '.'));
  },
  shorten(text, level) { return TX.paragraphs(text).map(p => TX.sentences(p).flatMap(s => this.splitSentence(s, this.MAX[level])).join(' ')).join('\n\n'); },
  simplify(text, level) { const a = this.words(text, level); return { text: this.shorten(a.text, level), changes: a.changes }; },
  rephrase(text, level) { return this.words(text, level); },
  toList(text) { return TX.sentences(text).flatMap(s => s.split(/\s*;\s+/)).map(s => '• ' + capFirst(s.replace(/[.]$/, ''))).join('\n'); },
  toTable(text) {
    const seps = [' : ', ' désigne ', ' signifie ', ' correspond à ', ' est ', ' sont ', ' permet de ', ' consiste à ']; const rows = [];
    TX.sentences(text).forEach((s, i) => { let hit = null; for (const sep of seps) { const k = s.indexOf(sep); if (k > 2 && k < 60) { hit = [s.slice(0, k), (sep.trim() === ':' ? '' : sep.trim() + ' ') + s.slice(k + sep.length)]; break; } } rows.push(hit ? [capFirst(hit[0]), capFirst(hit[1])] : ['Idée ' + (i + 1), s]); });
    return rows;
  },
  decompose(sentence, level = 'simple') { return this.splitSentence(sentence, this.MAX[level]); },
  explain(text) { return TX.hardWords(text); }
};

function textArea(initial, rows = 8, label = 'Texte') { const ta = h('textarea', { rows, 'aria-label': label }); ta.value = initial; ta.addEventListener('input', () => App.setText(ta.value)); return ta; }
function fileInput(accept, onFile) { const i = h('input', { type: 'file', accept, 'aria-label': 'Choisir un fichier' }); i.addEventListener('change', async () => { const f = i.files[0]; if (f) { try { await onFile(f); } catch (e) { App.toast('Impossible : ' + e.message); } } }); return i; }

// ====================================================================================================  Lecture audio
App.reg({
  id: 'lecture', title: 'Lecture audio', group: 'outils', icon: '🔊', render(el) {
    el.append(h('h1', null, 'Lecture audio'), h('p', { class: 'muted' }, 'Écoute ton texte, suis les mots qui s’éclairent, ou découpe les mots en syllabes (découpage approximatif, fait par règles).'));
    const ta = textArea(App.ws.text, 6); const view = h('div', { class: 'marked', style: 'font-size:1.15em' }); let mode = App.feat('syllables') ? 'syl' : 'plain';
    const draw = (hi) => {
      const t = ta.value; if (mode === 'syl') { view.innerHTML = syllHTML(t); return; }
      if (hi == null) { view.textContent = t; return; }
      const ws = Corrector.words(t); const w = ws.find(x => hi >= x.start && hi < x.end) || null; view.innerHTML = w ? esc(t.slice(0, w.start)) + `<mark style="background:#fde047;color:#000">${esc(t.slice(w.start, w.end))}</mark>` + esc(t.slice(w.end)) : esc(t);
    };
    const play = () => { const t = ta.value; if (!t.trim()) return App.toast('Rien à lire.'); App.setText(t); draw(null); App.speak(t, { onBoundary: ev => { if (ev.name === 'word' || ev.charIndex != null) draw(ev.charIndex); }, onEnd: () => draw(null) }); };
    ta.addEventListener('input', () => draw(null));
    el.append(ta, h('div', { class: 'row', style: 'margin:.5rem 0' }, h('button', { class: 'btn', 'data-act': 'listen', onclick: play }, '▶ Lire'), h('button', { class: 'btn sec', type: 'button', 'aria-pressed': 'false', onclick: ev => { const b = ev.currentTarget; if (!('speechSynthesis' in window)) return App.toast('La lecture à voix haute n’est pas disponible dans ce navigateur.'); const sp = speechSynthesis; if (sp.paused) { sp.resume(); b.textContent = '⏸ Pause'; b.setAttribute('aria-pressed', 'false'); } else if (sp.speaking) { sp.pause(); b.textContent = '▶ Reprendre'; b.setAttribute('aria-pressed', 'true'); } else App.toast('Rien n’est en cours de lecture : touche d’abord « Lire ».'); } }, '⏸ Pause'),
      h('button', { class: 'btn sec', onclick: ev => { App.stopSpeak(); draw(null); const pb = ev.currentTarget.previousElementSibling; if (pb && pb.getAttribute('aria-pressed') === 'true') { pb.textContent = '⏸ Pause'; pb.setAttribute('aria-pressed', 'false'); } } }, '⏹ Arrêter'),
      h('button', { class: 'btn sec', 'aria-pressed': String(mode === 'syl'), onclick: ev => { mode = mode === 'syl' ? 'plain' : 'syl'; ev.target.setAttribute('aria-pressed', String(mode === 'syl')); ev.target.textContent = mode === 'syl' ? '✓ Syllabes affichées' : 'Afficher les syllabes'; draw(null); } }, mode === 'syl' ? '✓ Syllabes affichées' : 'Afficher les syllabes'),
      h('label', { class: 'chk' }, 'Vitesse ', h('input', { type: 'range', min: 0.5, max: 1.6, step: 0.1, value: App.prefs.ttsRate, 'aria-label': 'Vitesse de lecture', onchange: ev => { App.prefs.ttsRate = +ev.target.value; App.savePrefs(); } }))),
      h('label', null, 'Importer un fichier à lire'), fileInput('.txt,.md,.docx,.odt,.pdf,.pptx', async f => { const r = await App.readFile(f); ta.value = r.text; App.setText(r.text, f.name.replace(/\.[^.]+$/, ''), r.kind); draw(null); }), view, App.voicePanel());
    draw(null);
  }
});

// ====================================================================================================  Simplificateur
App.reg({
  id: 'simplif', title: 'Simplificateur de texte', group: 'outils', icon: '🧩', learn: false, render(el) {
    el.append(h('h1', null, 'Simplificateur de texte'), h('div', { class: 'notice' }, h('b', null, 'Honnêteté : '), 'la simplification se fait par règles (phrases coupées aux conjonctions, mots courants à la place de mots rares, glossaire scolaire). Aucun modèle de langage n’est installé. Compare toujours avec l’original : le sens doit rester le même.'));
    const ta = textArea(App.ws.text, 7); const lvl = h('select', { 'aria-label': 'Niveau', onchange: ev => { App.prefs.simplLevel = ev.target.value; App.savePrefs(); } }, [['tres', 'Très simple'], ['simple', 'Simple'], ['courant', 'Langage courant']].map(([v, l]) => h('option', { value: v, selected: App.prefs.simplLevel === v }, l)));
    const out = h('div');
    const showText = (title, res, changes) => {
      const box = h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, title)); const rt = h('textarea', { rows: 8, 'aria-label': 'Résultat' }); rt.value = res;
      box.append(rt, h('div', { class: 'row', style: 'margin:.5rem 0' }, h('button', { class: 'btn', onclick: () => { ta.value = rt.value; App.setText(rt.value); App.toast('Résultat utilisé comme texte en cours.'); } }, 'Utiliser comme texte en cours'), App.listenBtn(() => rt.value), h('button', { class: 'btn sec', onclick: () => App.copy(rt.value).then(() => App.toast('Copié.')) }, 'Copier')),
        h('h3', null, 'Ce qui a changé'), h('div', { class: 'marked diff', html: App.diffHTML(ta.value, res) }), changes && changes.length ? h('p', { class: 'muted' }, 'Mots remplacés : ' + [...new Set(changes.map(c => `${c[0]} → ${c[1]}`))].join(' · ')) : '');
      out.replaceChildren(box); App.log('simplification', title, { count: 'fiches', amount: 0 });
    };
    const need = () => { if (!ta.value.trim()) { App.toast('Écris ou colle d’abord un texte.'); return false; } App.setText(ta.value); return true; };
    const L = () => lvl.value;
    const ops = [
      ['Simplifier le texte', () => { const r = Simp.simplify(ta.value, L()); showText('Texte simplifié', r.text, r.changes); }],
      ['Raccourcir les phrases', () => showText('Phrases raccourcies', Simp.shorten(ta.value, L()))],
      ['Expliquer les mots compliqués', () => { const ws = Simp.explain(ta.value); const box = h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Mots compliqués')); if (!ws.length) box.append(h('p', null, 'Je n’ai repéré aucun mot compliqué.')); const t = h('table', { class: 't' }, h('tr', null, h('th', null, 'Mot'), h('th', null, 'Explication'))); ws.forEach(w => t.append(h('tr', null, h('td', null, h('b', null, w.w), ' ', h('button', { class: 'btn small sec', onclick: () => App.speak(w.w + '. ' + (w.d || '')), 'aria-label': 'Écouter ' + w.w }, '🔊')), h('td', null, w.d || 'Mot long ou rare : je n’ai pas d’explication intégrée. Cherche-le dans un dictionnaire.')))); box.append(t, h('p', { class: 'muted' }, `Glossaire intégré : ${Object.keys(GLOSSAIRE).length} mots scolaires. Pour les autres, je ne devine pas.`)); out.replaceChildren(box); }],
      ['Reformuler sans changer le sens', () => { const r = Simp.rephrase(ta.value, L()); showText('Reformulation prudente (mots seulement)', r.text, r.changes); }],
      ['Phrases faciles à comprendre', () => { const r = Simp.simplify(ta.value, 'tres'); showText('Phrases faciles', r.text, r.changes); }],
      ['Transformer en liste', () => showText('Liste', Simp.toList(ta.value))],
      ['Transformer en tableau', () => { const rows = Simp.toTable(ta.value); const t = h('table', { class: 't' }, h('tr', null, h('th', null, 'Notion / idée'), h('th', null, 'Explication'))); rows.forEach(r => t.append(h('tr', null, h('td', null, r[0]), h('td', null, r[1])))); out.replaceChildren(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Tableau'), t, h('button', { class: 'btn sec', style: 'margin-top:.5rem', onclick: () => App.copy(rows.map(r => r.join('\t')).join('\n')).then(() => App.toast('Tableau copié (collable dans un tableur).')) }, 'Copier le tableau'))); }],
      ['Résumer un paragraphe', () => showText('Résumé (extrait des phrases les plus importantes)', TX.summarize(ta.value).join(' '))],
      ['Décomposer une longue phrase', () => { const S = TX.sentences(ta.value); const lg = S.slice().sort((a, b) => TX.words(b).length - TX.words(a).length)[0]; const parts = Simp.decompose(lg, L()); out.replaceChildren(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Phrase la plus longue, décomposée'), h('p', { class: 'muted' }, lg), h('ol', null, parts.map(p => h('li', null, p))))); }]
    ];
    el.append(ta, h('div', { class: 'row', style: 'margin:.5rem 0' }, h('label', { style: 'margin:0' }, 'Niveau : '), lvl, App.mic(ta)), h('div', { class: 'grid g3' }, ops.map(([l, f]) => h('button', { class: 'btn sec', onclick: () => { if (need()) f(); } }, l))), out);
  }
});

// ====================================================================================================  Lisibilité
const Read = {
  analyse(text) {
    const S = TX.sentences(text), P = TX.paragraphs(text); const W = TX.words(text); const nW = W.length || 1; const nS = S.length || 1;
    const lens = S.map(s => TX.words(s).length); const avgS = lens.reduce((a, b) => a + b, 0) / nS; const longS = S.filter((s, i) => lens[i] > 25);
    const paraS = P.map(p => TX.sentences(p).length); const avgP = paraS.reduce((a, b) => a + b, 0) / (P.length || 1); const longP = P.filter((p, i) => paraS[i] > 6);
    const longW = W.filter(w => w.length >= 9); const lr = longW.length / nW;
    const content = W.map(w => w.toLowerCase()).filter(w => w.length >= 5 && !STOP.has(w)); const cnt = new Map(); content.forEach(w => cnt.set(w, (cnt.get(w) || 0) + 1));
    const rep = [...cnt.entries()].filter(([, n]) => n >= 3).sort((a, b) => b[1] - a[1]); const repScore = rep.reduce((a, [, n]) => a + n - 2, 0) / (content.length || 1);
    const headings = TX.headings(text); const lists = (text.match(/^\s*(?:[-•*]|\d+[.)])\s+/gm) || []).length;
    const conn = S.filter(s => CONNECTEURS.some(c => new RegExp(`(?<![\\p{L}])${c.replace(/'/g, "['’]")}(?![\\p{L}])`, 'iu').test(s))).length;
    const complex = S.filter(s => (s.match(/,/g) || []).length >= 3 || (s.match(/(?<![\p{L}])que(?![\p{L}])|qu['’]/giu) || []).length >= 3 || /(?:est|sont|était|étaient|a été|ont été)\s+\p{L}+(?:é|ée|és|ées)\s+par\s/iu.test(s));
    const cl = x => Math.max(0, Math.min(10, x));
    const sc = {
      len: cl(10 - Math.max(0, avgS - 12) * 0.5 - (longS.length / nS) * 6), para: P.length ? cl(10 - Math.max(0, avgP - 4) * 1.2 - (longP.length / P.length) * 3) : 7,
      vocab: cl(10 - lr * 30), rep: cl(10 - repScore * 30), struct: nW < 60 ? 7 : cl(4 + (P.length > 1 ? 2 : 0) + (headings.length ? 2 : 0) + (lists ? 2 : 0)),
      trans: nS < 4 ? 7 : cl((conn / nS) * 25 + 1), clar: cl(10 - (complex.length / nS) * 14)
    };
    const W8 = { len: .25, vocab: .15, clar: .2, rep: .1, para: .1, struct: .1, trans: .1 };
    const global = Math.round(Object.entries(W8).reduce((a, [k, w]) => a + sc[k] * w, 0) * 2) / 2;
    const syl = W.reduce((a, w) => a + syllabify(w).length, 0); const km = 207 - 1.015 * avgS - 73.6 * (syl / nW);
    return { S, P, nW, avgS, longS, avgP, longP, lr, rep, headings, lists, conn, complex, sc, global, km, content };
  }
};
App.reg({
  id: 'lisibilite', title: 'Lisibilité', group: 'outils', icon: '📏', render(el) {
    el.append(h('h1', null, 'Analyse de lisibilité'), h('p', { class: 'muted' }, 'La note sur 10 est un repère calculé par règles (longueur des phrases et paragraphes, mots longs, répétitions, structure, transitions, phrases lourdes). Les conseils sont des propositions : rien n’est modifié sans toi.'));
    const ta = textArea(App.ws.text, 7); const out = h('div');
    const run = () => {
      const t = ta.value; App.setText(t); if (Corrector.countWords(t) < 15) return out.replaceChildren(h('div', { class: 'notice' }, 'Texte trop court : écris au moins une quinzaine de mots.'));
      const r = Read.analyse(t); App.log('lisibilité', App.ws.title, { count: 'texts' });
      const col = r.global >= 7 ? 'var(--ok)' : r.global >= 5 ? 'var(--warn)' : 'var(--bad)'; const C = 2 * Math.PI * 45;
      const ring = `<svg viewBox="0 0 120 120" width="130" height="130" role="img" aria-label="Lisibilité ${r.global} sur 10"><circle cx="60" cy="60" r="45" fill="none" stroke="var(--line)" stroke-width="12"/><circle cx="60" cy="60" r="45" fill="none" stroke="${col}" stroke-width="12" stroke-dasharray="${C * r.global / 10} ${C}" transform="rotate(-90 60 60)" stroke-linecap="round"/><text x="60" y="68" text-anchor="middle" font-size="28" font-weight="700" fill="currentColor">${r.global}</text><text x="60" y="88" text-anchor="middle" font-size="12" fill="currentColor">sur 10</text></svg>`;
      const lab = { len: 'Longueur des phrases', para: 'Longueur des paragraphes', vocab: 'Complexité du vocabulaire', rep: 'Répétitions', struct: 'Structure', trans: 'Transitions', clar: 'Clarté des phrases' };
      const det = { len: `${r.avgS.toFixed(1)} mots par phrase en moyenne ; ${r.longS.length} phrase(s) de plus de 25 mots.`, para: `${r.avgP.toFixed(1)} phrases par paragraphe ; ${r.longP.length} paragraphe(s) très long(s).`, vocab: `${(r.lr * 100).toFixed(0)} % de mots de 9 lettres ou plus.`, rep: r.rep.length ? 'Mots très répétés : ' + r.rep.slice(0, 4).map(([w, n]) => `${w} (${n}×)`).join(', ') : 'Pas de répétition marquée.', struct: `${r.P.length} paragraphe(s), ${r.headings.length} titre(s), ${r.lists} élément(s) de liste.`, trans: `${r.conn} phrase(s) sur ${r.S.length} contiennent un mot de liaison.`, clar: `${r.complex.length} phrase(s) lourde(s) (beaucoup de virgules, de « que » ou voix passive).` };
      const card = h('div', { class: 'card' }, h('div', { class: 'row' }, h('div', { html: ring }), h('div', { class: 'grow' }, h('h2', { style: 'margin:0' }, 'Indicateur de lisibilité'), h('p', null, r.global >= 7 ? 'Facile à lire.' : r.global >= 5 ? 'Lisible, avec quelques points à alléger.' : 'Difficile à lire : quelques pistes ci-dessous.'), h('p', { class: 'muted' }, `Indice de Kandel et Moles (repère indicatif, syllabes estimées) : ${r.km.toFixed(0)} — plus il est haut, plus c’est facile.`))));
      Object.keys(lab).forEach(k => card.append(h('div', { style: 'margin:.5rem 0' }, h('div', { class: 'row' }, h('b', null, lab[k]), h('span', { class: 'grow' }), h('b', null, r.sc[k].toFixed(1) + ' / 10')), h('div', { class: 'bar', role: 'img', 'aria-label': `${lab[k]} : ${r.sc[k].toFixed(1)} sur 10` }, h('i', { style: `width:${r.sc[k] * 10}%;background:${r.sc[k] >= 7 ? 'var(--ok)' : r.sc[k] >= 5 ? 'var(--warn)' : 'var(--bad)'}` })), h('div', { class: 'muted' }, det[k]))));
      const tips = []; if (r.sc.len < 7) tips.push('Coupe les phrases de plus de 25 mots (le Simplificateur peut te proposer des coupes).'); if (r.sc.para < 7) tips.push('Aère les très longs paragraphes : une idée par paragraphe.'); if (r.sc.vocab < 7) tips.push('Remplace certains mots longs par des mots plus courants, ou explique-les.'); if (r.sc.rep < 7) tips.push('Varie le vocabulaire : pronoms ou synonymes pour les mots répétés.'); if (r.sc.struct < 7) tips.push('Ajoute des titres, des paragraphes ou une liste pour repérer les idées.'); if (r.sc.trans < 7) tips.push('Ajoute des mots de liaison (d’abord, ensuite, mais, donc, enfin…).'); if (r.sc.clar < 7) tips.push('Simplifie les phrases lourdes : moins de « que », moins de virgules, voix active.');
      card.append(h('h3', null, 'Pistes d’amélioration (facultatives)'), tips.length ? h('ul', null, tips.map(x => h('li', null, x))) : h('p', null, 'Rien de particulier à signaler.'));
      const errs = []; const base = t; r.longS.forEach(s => { const i = base.indexOf(s); if (i >= 0) errs.push({ id: 'l' + i, start: i, end: i + s.length, cat: 'synt', msg: 'Phrase longue', sugg: [], orig: s, rule: 'long', kind: 'info' }); }); r.complex.forEach(s => { const i = base.indexOf(s); if (i >= 0 && !errs.some(e => e.start === i)) errs.push({ id: 'c' + i, start: i, end: i + s.length, cat: 'coh', msg: 'Phrase lourde', sugg: [], orig: s, rule: 'lourde', kind: 'info' }); });
      out.replaceChildren(card, h('h3', null, 'Où sont les passages concernés ?'), h('p', { class: 'muted' }, 'Orange : phrase longue. Turquoise : phrase lourde.'), h('div', { class: 'marked', html: App.markHTML(t, errs, { showCorrect: false, icons: true }) }));
    };
    el.append(ta, h('div', { class: 'row', style: 'margin:.5rem 0' }, h('button', { class: 'btn', onclick: run }, '📏 Analyser la lisibilité'), h('a', { class: 'btn sec', href: '#/simplif' }, 'Simplifier')), out); if (ta.value.trim()) run();
  }
});

// ====================================================================================================  Dictée : comparaison et entraînement
const Dict = {
  tok: s => s.match(/[\p{L}\p{M}\d]+(?:['’\-][\p{L}\p{M}\d]+)*|[^\s\p{L}\p{M}\d]/gu) || [],
  strip: s => s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''),
  lev(a, b) { const m = a.length, n = b.length; const d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; },
  norm: s => s.replace(/’/g, "'"),
  align(user, ref) {
    const A = this.tok(ref), B = this.tok(user); const n = A.length, m = B.length; const eq = (x, y) => this.norm(x) === this.norm(y);
    const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1)); for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = eq(A[i], B[j]) ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const ops = []; let i = 0, j = 0;
    while (i < n || j < m) { if (i < n && j < m && eq(A[i], B[j])) { ops.push({ t: 'eq', a: A[i], b: B[j] }); i++; j++; } else if (j < m && (i === n || L[i][j + 1] >= L[i + 1][j])) ops.push({ t: 'ins', b: B[j++] }); else ops.push({ t: 'del', a: A[i++] }); }
    const out = []; for (let k = 0; k < ops.length; k++) { const o = ops[k]; if (o.t === 'del' && ops[k + 1] && ops[k + 1].t === 'ins') { out.push({ t: 'sub', a: o.a, b: ops[k + 1].b }); k++; } else if (o.t === 'ins' && ops[k + 1] && ops[k + 1].t === 'del') { out.push({ t: 'sub', a: ops[k + 1].a, b: o.b }); k++; } else out.push(o); }
    return out;
  },
  classify(o) {
    const P = /^[^\p{L}\p{M}\d]$/u;
    if (o.t === 'del') return P.test(o.a) ? ['ponct', `Ponctuation oubliée : « ${o.a} ».`] : ['manque', `Mot oublié : « ${o.a} ».`];
    if (o.t === 'ins') return P.test(o.b) ? ['ponct', `Ponctuation en trop : « ${o.b} ».`] : ['synt', `Mot en trop : « ${o.b} ».`];
    const a = o.a, b = o.b; if (P.test(a) || P.test(b)) return ['ponct', `Ponctuation : « ${b} » au lieu de « ${a} ».`];
    if (a.toLowerCase() === b.toLowerCase()) return ['typo', `Majuscule / minuscule : « ${b} » au lieu de « ${a} ».`];
    if (this.strip(a).toLowerCase() === this.strip(b).toLowerCase()) return ['ortho', `Accent : on écrit « ${a} ».`];
    if (HOMOPHONES.some(([x, y]) => (x === a.toLowerCase() && y === b.toLowerCase()) || (y === a.toLowerCase() && x === b.toLowerCase()))) return ['homo', `Homophone : « ${a} » (et non « ${b} »).`];
    if (this.lev(a.toLowerCase(), b.toLowerCase()) <= Math.max(2, Math.floor(a.length / 3))) { const same = a.replace(/s$/i, '') === b.replace(/s$/i, ''); return [same ? 'gram' : 'ortho', same ? `Accord (s final) : on écrit « ${a} ».` : `Orthographe : on écrit « ${a} ».`]; }
    return ['synt', `Mot différent : « ${b} » au lieu de « ${a} ».`];
  },
  report(user, ref) {
    const ops = this.align(user, ref); const items = []; let ok = 0, total = 0; let html = '';
    ops.forEach(o => { if (o.t === 'eq') { ok++; total++; html += esc(o.b) + ' '; return; } if (o.t !== 'ins') total++; const [cat, msg] = this.classify(o); items.push({ cat, msg, o }); const c = App.color(cat); html += o.t === 'del' ? `<span class="seg" style="background:${App.rgba(c, .4)};border-bottom:3px solid ${c}" title="${esc(msg)}">▢<sub>${esc(o.a)}</sub></span> ` : `<span class="seg" style="background:${App.rgba(c, .4)};border-bottom:3px solid ${c}" title="${esc(msg)}">${esc(o.b)}</span> `; });
    return { ops, items, ok, total, score: total ? Math.round(ok / total * 100) : 100, html };
  }
};
App.reg({
  id: 'dictee', title: 'Dictée vocale et comparaison', group: 'outils', icon: '🎤', learn: true, render(el) {
    el.append(h('h1', null, 'Dictée vocale et comparaison'), App.micWarn());
    let tab = 'cmp'; const tabs = h('div', { class: 'row', role: 'tablist' }); const body = h('div');
    const draw = () => { tabs.replaceChildren(...[['cmp', 'Comparer ma dictée'], ['train', 'Entraînement à la dictée']].map(([k, l]) => h('button', { class: 'btn ' + (tab === k ? '' : 'sec'), role: 'tab', 'aria-selected': String(tab === k), onclick: () => { tab = k; draw(); } }, l))); body.replaceChildren(); (tab === 'cmp' ? cmp : train)(body); };
    const cmp = box => {
      const ta = textArea(App.ws.text, 5, 'Ma dictée (transcription)'); const ref = h('textarea', { rows: 3, 'aria-label': 'Texte de référence (facultatif)', placeholder: 'Texte de référence (facultatif) : ce que tu voulais dire ou le texte de la dictée.' }); const out = h('div');
      const go = () => {
        const t = ta.value; if (!t.trim()) return App.toast('Dicte ou écris d’abord quelque chose.'); App.setText(t); const r = Corrector.analyze(t, { typoSpaces: App.prefs.softTypo }); const fixed = Corrector.autoCorrect(t, 'safe').text;
        App.log('dictée', 'Transcription', { errors: r.errors, count: 'dictations' }); App.lastDictee = { text: t, errors: r.errors, fixed, ref: ref.value, report: ref.value.trim() ? Dict.report(t, ref.value) : null }; if (App.lastDictee.report && typeof Rev !== 'undefined') { const nw = Rev.capture(App.lastDictee.report, ref.value); if (nw) App.toast(`${nw} mot(s) ajouté(s) à ta révision.`); }
        const parts = [h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, 'Ma transcription analysée'), h('div', { class: 'marked', html: App.markHTML(t, r.errors) }), h('div', { class: 'row', style: 'margin-top:.5rem' }, App.listenBtn(() => t, '🔊 Écouter ma transcription'), App.stopBtn())),
        h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, 'Dictée / version corrigée'), h('div', { class: 'marked diff', html: App.diffHTML(t, fixed) }), h('div', { class: 'row', style: 'margin-top:.5rem' }, App.listenBtn(() => fixed, '🔊 Écouter la version corrigée')))];
        if (App.lastDictee.report) { const rp = App.lastDictee.report; const tb = h('table', { class: 't' }, h('tr', null, h('th', null, 'Catégorie'), h('th', null, 'Explication'))); rp.items.forEach(i => tb.append(h('tr', null, h('td', null, h('span', { class: 'tagbox', style: `background:${App.color(i.cat)}` }, CAT[i.cat].icone + ' ' + CAT[i.cat].nom)), h('td', null, i.msg)))); parts.push(h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, `Comparaison avec la référence : ${rp.score} % de mots justes`), h('div', { class: 'marked', html: rp.html }), rp.items.length ? tb : h('p', null, 'Aucune différence : bravo !'))); }
        out.replaceChildren(...parts);
      };
      box.append(h('p', { class: 'muted' }, 'Dicte avec le micro (ou écris), puis compare.'), ta, h('div', { class: 'row', style: 'margin:.4rem 0' }, App.mic(ta), h('button', { class: 'btn', onclick: go }, '🔎 Analyser ma transcription')), ref, out);
    };
    const train = box => {
      let lvl = 1, target = '', mode = 'bank'; const input = h('textarea', { rows: 3, 'aria-label': 'Ce que tu as entendu', placeholder: 'Écris ici ce que tu entends…' }); const out = h('div'); const own = h('textarea', { rows: 2, 'aria-label': 'Ton propre texte', placeholder: 'Ou colle ici une phrase de ton choix à dicter…' });
      const next = () => { out.replaceChildren(); input.value = ''; if (own.value.trim()) target = own.value.trim().split(/(?<=[.!?])\s+/)[0]; else { const pool = DICTEES.filter(d => d[0] === lvl); target = pool[Math.floor(Math.random() * pool.length)][1]; } speak(1); };
      const speak = r => { App.speak(target, { rate: App.prefs.ttsRate * r }); };
      const check = () => {
        if (!target) return App.toast('Clique d’abord sur « Nouvelle phrase ».'); const r = Dict.report(input.value, target); const nw = typeof Rev !== 'undefined' ? Rev.capture(r, target) : 0; if (nw) App.toast(`${nw} mot(s) ajouté(s) à ta révision.`); App.stats.counts.dictations++; App.stats.exos.push({ ts: Date.now(), cat: 'dictee', ok1: r.score === 100, ok2: r.score === 100, lvl, score: r.score }); App.log('entraînement dictée', target.slice(0, 40), { errors: r.items.map(i => ({ cat: i.cat })) });
        App.lastDictee = { text: input.value, errors: [], fixed: target, ref: target, report: r, train: true };
        const tb = h('table', { class: 't' }, h('tr', null, h('th', null, 'Catégorie'), h('th', null, 'Explication'))); r.items.forEach(i => tb.append(h('tr', null, h('td', null, h('span', { class: 'tagbox', style: `background:${App.color(i.cat)}` }, CAT[i.cat].icone + ' ' + CAT[i.cat].nom)), h('td', null, i.msg))));
        out.replaceChildren(h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, `Résultat : ${r.score} % de mots justes`), h('div', { class: 'marked', html: r.html }), r.items.length ? tb : h('p', null, '🎉 Parfait !'), h('h3', null, 'La phrase était :'), h('div', { class: 'marked' }, target), h('div', { class: 'row', style: 'margin-top:.5rem' }, App.listenBtn(() => target, '🔊 Réécouter'), h('button', { class: 'btn', onclick: next }, 'Phrase suivante'))));
      };
      box.append(h('p', { class: 'muted' }, 'L’application lit une phrase, tu l’écris, puis tu obtiens une correction détaillée.'), h('div', { class: 'row' }, h('label', { style: 'margin:0' }, 'Niveau'), h('select', { onchange: ev => lvl = +ev.target.value, 'aria-label': 'Niveau' }, [[1, 'Niveau 1 (facile)'], [2, 'Niveau 2'], [3, 'Niveau 3 (difficile)']].map(([v, l]) => h('option', { value: v }, l))), h('button', { class: 'btn', onclick: next }, '▶ Nouvelle phrase'), h('button', { class: 'btn sec', onclick: () => target && speak(1) }, '🔊 Répéter'), h('button', { class: 'btn sec', onclick: () => target && speak(0.6) }, '🐢 Plus lentement'), h('button', { class: 'btn sec', onclick: () => App.stopSpeak() }, '⏹')), own, input, h('div', { class: 'row', style: 'margin:.4rem 0' }, App.mic(input), h('button', { class: 'btn', onclick: check }, '✔ Vérifier')), out);
    };
    el.append(tabs, body); draw();
  }
});

// ====================================================================================================  Analyse de cours / documents
App.reg({
  id: 'analyse', title: 'Analyse de cours et documents', group: 'outils', icon: '📚', learn: true, render(el) {
    el.append(h('h1', null, 'Analyse de cours'), h('div', { class: 'notice' }, h('b', null, 'Honnêteté : '), 'les repérages (titres, définitions, passages difficiles) et les explications sont faits par règles et par un glossaire scolaire de ', String(Object.keys(GLOSSAIRE).length), ' mots. Je n’invente pas d’explication : quand je ne sais pas, je le dis.'));
    const ta = textArea(App.ws.text, 6); const out = h('div');
    const run = () => {
      const t = ta.value; App.setText(t); if (Corrector.countWords(t) < 20) return out.replaceChildren(h('div', { class: 'notice' }, 'Colle ou importe un cours d’au moins 20 mots.'));
      const res = Corrector.analyze(t, { typoSpaces: App.prefs.softTypo }); const S = Corrector.splitSentences(t); const heads = TX.headings(t); const defs = TX.definitions(t); const hw = TX.hardWords(t); const P = TX.paragraphs(t);
      const diff = S.map(s => ({ ...s, d: TX.difficulty(s.text) })).sort((a, b) => b.d - a.d).filter(x => x.d >= 3.2).slice(0, 8); const long = S.filter(s => TX.words(s.text).length > 30);
      App.log('cours', App.ws.title, { errors: res.errors, count: 'docs' });
      const sec = (title, ...kids) => h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, title), ...kids);
      const parts = [];
      parts.push(sec('Vue d’ensemble', h('p', null, `${res.stats.words} mots · ${S.length} phrases · ${P.length} paragraphes · ${heads.length} titre(s) · ${defs.length} définition(s) repérée(s) · ${res.errors.filter(e => e.kind !== 'info' || ['synt', 'manque'].includes(e.cat)).length} remarque(s) du correcteur.`), h('div', { class: 'row' }, h('a', { class: 'btn sec', href: '#/correcteur' }, 'Voir les corrections'), h('a', { class: 'btn sec', href: '#/fiches' }, 'Fiche, carte mentale, quiz'), h('a', { class: 'btn sec', href: '#/lisibilite' }, 'Lisibilité'))));
      parts.push(sec('Titres et sous-titres', heads.length ? h('ul', null, heads.map(x => h('li', { style: `margin-left:${(x.level - 1) * 1.2}rem` }, x.text))) : h('p', null, 'Je n’ai repéré aucun titre (une ligne courte, sans point, numérotée ou en majuscules).')));
      parts.push(sec('Définitions repérées', defs.length ? h('ul', null, defs.map(d => h('li', null, h('b', null, d.term), ' — ', d.def))) : h('p', null, 'Aucune définition repérée (« X est… », « On appelle… », « X : … »).')));
      const dd = h('div'); const explain = s => {
        const bits = []; const short = Simp.simplify(s.text, 'tres').text; const words = TX.hardWords(s.text).filter(w => w.known); const par = P.find(p => p.includes(s.text)); const main = par ? TX.summarize(par, 1)[0] : null;
        bits.push(h('h3', { style: 'margin-top:0' }, '💡 Comprendre ce passage'), h('p', { class: 'muted' }, `« ${s.text} »`), h('h3', null, 'En phrases courtes'), h('p', null, short));
        bits.push(h('h3', null, 'Mots à connaître'), words.length ? h('ul', null, words.map(w => h('li', null, h('b', null, w.w), ' : ', w.d))) : h('p', null, 'Aucun mot du glossaire dans ce passage. Si un mot te bloque, cherche-le dans un dictionnaire.'));
        if (main) bits.push(h('h3', null, 'Idée principale du paragraphe (phrase la plus centrale)'), h('p', null, main));
        bits.push(h('div', { class: 'row' }, App.listenBtn(() => short + ' ' + words.map(w => w.w + ' : ' + w.d).join(' '), '🔊 Écouter l’explication')));
        dd.replaceChildren(h('div', { class: 'card', style: 'border-color:var(--accent)' }, ...bits)); dd.scrollIntoView({ block: 'nearest' });
      };
      parts.push(sec('Passages difficiles — « Comprendre mon cours »', h('p', { class: 'muted' }, 'Clique sur un passage pour l’expliquer avec des mots simples.'), diff.length ? diff.map(s => h('div', { class: 'card', style: 'margin:.4rem 0' }, h('p', { style: 'margin:0 0 .4rem' }, s.text), h('button', { class: 'btn small', onclick: () => explain(s) }, 'Comprendre ce passage'))) : h('p', null, 'Aucun passage ne ressort comme particulièrement difficile.'), dd));
      parts.push(sec('Mots compliqués', hw.length ? h('table', { class: 't' }, h('tr', null, h('th', null, 'Mot'), h('th', null, 'Explication')), hw.slice(0, 40).map(w => h('tr', null, h('td', null, h('b', null, w.w)), h('td', null, w.d || 'Mot long ou rare — à chercher dans un dictionnaire.')))) : h('p', null, 'Aucun mot compliqué repéré.')));
      parts.push(sec('Phrases trop longues', long.length ? h('ul', null, long.map(s => h('li', null, `(${TX.words(s.text).length} mots) `, s.text))) : h('p', null, 'Aucune phrase de plus de 30 mots.')));
      parts.push(sec('Organisation des paragraphes', h('table', { class: 't' }, h('tr', null, h('th', null, '#'), h('th', null, 'Idée principale'), h('th', null, 'Taille')), P.map((p, i) => { const n = TX.sentences(p).length; return h('tr', null, h('td', null, i + 1), h('td', null, TX.summarize(p, 1)[0] || p.slice(0, 80)), h('td', null, `${n} phrase(s)`, n > 6 ? h('span', { class: 'badge warn' }, ' long') : '')); }))));
      const lv = h('select', { 'aria-label': 'Niveau de simplification' }, [['tres', 'Très simple'], ['simple', 'Simple'], ['courant', 'Langage courant']].map(([v, l]) => h('option', { value: v, selected: v === App.prefs.simplLevel }, l))); const sv = h('div');
      const mk = () => { const r = Simp.simplify(t, lv.value); sv.replaceChildren(h('div', { class: 'marked' }, r.text), h('div', { class: 'row', style: 'margin-top:.5rem' }, App.listenBtn(() => r.text, '🔊 Écouter'), h('button', { class: 'btn sec', onclick: () => { App.setText(r.text, App.ws.title + ' (simplifié)'); App.toast('Version simplifiée définie comme document en cours.'); } }, 'Utiliser comme document en cours'))); };
      parts.push(sec('Version simplifiée', h('div', { class: 'row' }, lv, h('button', { class: 'btn', onclick: mk }, 'Générer')), sv));
      out.replaceChildren(...parts);
    };
    el.append(h('label', null, 'Importer un cours (txt, md, docx, odt, pdf, pptx)'), fileInput('.txt,.md,.docx,.odt,.pdf,.pptx', async f => { const r = await App.readFile(f); ta.value = r.text; App.setText(r.text, f.name.replace(/\.[^.]+$/, ''), r.kind); App.toast(`« ${f.name} » importé.`); run(); }), ta, h('div', { class: 'row', style: 'margin:.5rem 0' }, h('button', { class: 'btn', onclick: run }, '📚 Analyser ce cours')), out);
    if (ta.value.trim()) run();
  }
});

// ====================================================================================================  Fiches, cartes mentales, flashcards, quiz
const Fiche = {
  data(text) { const defs = TX.definitions(text); const kw = TX.keywords(text, 12); const heads = TX.headings(text); const summary = TX.summarize(text, Math.max(3, Math.min(6, Math.round(TX.sentences(text).length / 4)))); return { defs, kw, heads, summary, S: TX.sentences(text) }; },
  cloze(d) {
    const items = []; const kws = d.kw.map(k => k.w);
    d.S.filter(s => { const n = TX.words(s).length; return n >= 6 && n <= 30; }).forEach(s => { const k = kws.find(w => new RegExp(`(?<![\\p{L}])${w}(?![\\p{L}])`, 'iu').test(s)); if (k) items.push({ q: s.replace(new RegExp(`(?<![\\p{L}])${k}(?![\\p{L}])`, 'iu'), '_____'), a: k, kws }); });
    return items.slice(0, 8);
  },
  quiz(d) {
    const Q = []; const shuffle = a => a.map(x => [Math.random(), x]).sort((x, y) => x[0] - y[0]).map(x => x[1]);
    if (d.defs.length >= 3) d.defs.slice(0, 6).forEach(df => { const others = shuffle(d.defs.filter(x => x !== df)).slice(0, 2).map(x => x.def.length > 140 ? x.def.slice(0, 140) + '…' : x.def); const right = df.def.length > 140 ? df.def.slice(0, 140) + '…' : df.def; Q.push({ q: `Quelle phrase définit « ${df.term} » ?`, opts: shuffle([right, ...others]), a: right }); });
    const cl = this.cloze(d); cl.forEach(c => { const others = shuffle(c.kws.filter(k => k !== c.a)).slice(0, 3); if (others.length >= 2) Q.push({ q: 'Complète : ' + c.q, opts: shuffle([c.a, ...others]), a: c.a }); });
    return shuffle(Q).slice(0, 10);
  },
  mindmap(title, d, text) {
    const W = 900, H = 560, cx = W / 2, cy = H / 2; let branches = [];
    if (d.heads.length >= 2) { const lines = text.split('\n'); d.heads.forEach((hd, i) => { const end = d.heads[i + 1] ? d.heads[i + 1].line : lines.length; const seg = lines.slice(hd.line + 1, end).join('\n'); branches.push({ label: hd.text, kids: TX.keywords(seg, 3).map(k => k.w) }); }); }
    else { const P = TX.paragraphs(text); branches = P.slice(0, 8).map(p => { const k = TX.keywords(p, 4); return { label: k[0] ? k[0].w : 'idée', kids: k.slice(1).map(x => x.w) }; }); }
    branches = branches.filter(b => b.label).slice(0, 8); if (branches.length < 2) branches = d.kw.slice(0, 6).map(k => ({ label: k.w, kids: [] }));
    const wrap = (s, n) => { const w = s.split(' '); const L = []; let c = ''; w.forEach(x => { if ((c + ' ' + x).trim().length > n) { L.push(c); c = x; } else c = (c + ' ' + x).trim(); }); if (c) L.push(c); return L.slice(0, 3); };
    const box = (x, y, s, fill, fs, n) => { const L = wrap(s, n); const w = Math.max(...L.map(l => l.length)) * fs * .56 + 18, hh = L.length * (fs + 3) + 10; return `<g><rect x="${x - w / 2}" y="${y - hh / 2}" width="${w}" height="${hh}" rx="10" fill="${fill}" stroke="#334155"/>${L.map((l, i) => `<text x="${x}" y="${y - hh / 2 + 5 + (i + 1) * (fs + 3) - 3}" text-anchor="middle" font-size="${fs}" fill="#0f172a">${esc(l)}</text>`).join('')}</g>`; };
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Carte mentale : ${esc(title)}" style="background:#fff;border-radius:12px;border:1px solid var(--line)">`;
    const pal = ['#fecaca', '#fed7aa', '#fef08a', '#bbf7d0', '#a5f3fc', '#bfdbfe', '#ddd6fe', '#fbcfe8']; let lines = '', nodes = '';
    branches.forEach((b, i) => { const ang = (i / branches.length) * Math.PI * 2 - Math.PI / 2; const bx = cx + Math.cos(ang) * 210, by = cy + Math.sin(ang) * 175; lines += `<path d="M${cx} ${cy} Q${(cx + bx) / 2} ${(cy + by) / 2 - 10} ${bx} ${by}" stroke="#64748b" stroke-width="2.5" fill="none"/>`; nodes += box(bx, by, b.label, pal[i % 8], 13, 16); b.kids.forEach((k, j) => { const a2 = ang + (j - (b.kids.length - 1) / 2) * 0.42; const kx = bx + Math.cos(a2) * 125, ky = by + Math.sin(a2) * 85; lines += `<path d="M${bx} ${by} L${kx} ${ky}" stroke="#94a3b8" stroke-width="1.5"/>`; nodes += box(kx, ky, k, '#f8fafc', 11, 14); }); });
    return svg + lines + nodes + box(cx, cy, title || 'Cours', '#fde68a', 16, 18) + '</svg>';
  }
};
App.reg({
  id: 'fiches', title: 'Fiches, cartes mentales, quiz', group: 'activites', icon: '🗂️', learn: true, render(el) {
    el.append(h('h1', null, 'Fiches, cartes mentales, flashcards, quiz'), h('p', { class: 'muted' }, 'À partir du document en cours (importe un cours dans « Mes documents » ou ici). Tout est fabriqué par règles à partir de TON texte : rien n’est ajouté de l’extérieur.'));
    const ta = textArea(App.ws.text, 5); const body = h('div'); let tab = 'fiche'; const tabs = h('div', { class: 'row', role: 'tablist' });
    const TABS = [['resume', 'Résumé'], ['fiche', 'Fiche de révision'], ['cards', 'Flashcards'], ['carte', 'Carte mentale'], ['quiz', 'Questions et quiz'], ['mots', 'Mots importants et définitions']];
    const enough = () => Corrector.countWords(ta.value) >= 40;
    const draw = () => {
      tabs.replaceChildren(...TABS.map(([k, l]) => h('button', { class: 'btn ' + (tab === k ? '' : 'sec'), role: 'tab', 'aria-selected': String(tab === k), onclick: () => { tab = k; draw(); } }, l))); body.replaceChildren(); App.setText(ta.value);
      if (!enough()) return body.append(h('div', { class: 'notice' }, 'Il faut au moins 40 mots pour fabriquer des fiches utiles. Colle un cours ou importe un fichier.'));
      const d = Fiche.data(ta.value); const title = App.ws.title;
      if (tab === 'resume') { const k = h('input', { type: 'range', min: 1, max: Math.max(2, d.S.length - 1), value: Math.max(2, Math.round(d.S.length / 4)) }); const o = h('div', { class: 'marked' }); const f = () => { o.textContent = TX.summarize(ta.value, +k.value).join(' '); }; k.oninput = f; f(); body.append(h('label', null, 'Nombre de phrases du résumé'), k, o, h('div', { class: 'row', style: 'margin-top:.5rem' }, App.listenBtn(() => o.textContent), h('button', { class: 'btn sec', onclick: () => App.copy(o.textContent).then(() => App.toast('Copié.')) }, 'Copier'))); }
      if (tab === 'fiche') {
        body.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Fiche : ' + title), h('h3', null, 'À retenir'), h('ul', null, d.summary.map(s => h('li', null, s))), d.defs.length ? [h('h3', null, 'Définitions'), h('ul', null, d.defs.slice(0, 10).map(x => h('li', null, h('b', null, x.term), ' — ', x.def)))] : '', h('h3', null, 'Mots importants'), h('p', null, d.kw.map(k => k.w).join(' · ')), d.heads.length ? [h('h3', null, 'Plan du cours'), h('ul', null, d.heads.map(x => h('li', { style: `margin-left:${(x.level - 1) * 1.2}rem` }, x.text)))] : ''), h('div', { class: 'row' }, App.listenBtn(() => d.summary.join(' ')), h('button', { class: 'btn', onclick: () => Rep.fiche(title, d).then(b => { App.download(b, 'fiche-' + title.replace(/\W+/g, '-') + '.pdf'); App.log('fiche PDF', title, { count: 'fiches' }); }) }, '📄 Exporter la fiche en PDF')));
      }
      if (tab === 'cards') {
        const deck = [...d.defs.slice(0, 12).map(x => ({ q: x.term, a: x.def })), ...Fiche.cloze(d).map(c => ({ q: c.q, a: c.a }))]; if (!deck.length) return body.append(h('div', { class: 'notice' }, 'Je n’ai trouvé ni définition ni phrase exploitable pour fabriquer des cartes dans ce texte.'));
        let i = 0, shown = false; const known = new Set(); const card = h('div', { class: 'card', style: 'min-height:9rem;text-align:center;font-size:1.2em;cursor:pointer', tabindex: 0, role: 'button' }); const info = h('p', { class: 'muted' });
        const f = () => { const c = deck[i]; card.textContent = shown ? c.a : c.q; card.style.background = shown ? 'var(--soft)' : 'var(--panel)'; info.textContent = `Carte ${i + 1} / ${deck.length} · sues : ${known.size}`; };
        const flip = () => { shown = !shown; f(); }; card.onclick = flip; card.onkeydown = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); flip(); } };
        const go = k => { i = (i + k + deck.length) % deck.length; shown = false; f(); };
        const rate = ok => { App.stats.exos.push({ ts: Date.now(), cat: 'flashcard', ok1: ok, ok2: ok, lvl: 1 }); App.stats.counts.exercises++; if (ok) known.add(i); App.saveStats(); go(1); };
        body.append(info, card, h('div', { class: 'row' }, h('button', { class: 'btn sec', onclick: () => go(-1) }, '◀'), h('button', { class: 'btn', onclick: flip }, 'Retourner la carte'), h('button', { class: 'btn sec', onclick: () => go(1) }, '▶'), App.listenBtn(() => card.textContent), h('button', { class: 'btn', onclick: () => rate(true) }, '✔ Je savais'), h('button', { class: 'btn sec', onclick: () => rate(false) }, '↺ À revoir'))); f();
      }
      if (tab === 'carte') { const svg = Fiche.mindmap(title, d, ta.value); body.append(h('div', { html: svg }), h('div', { class: 'row', style: 'margin-top:.5rem' }, h('button', { class: 'btn', onclick: () => App.download(new Blob([svg], { type: 'image/svg+xml' }), 'carte-mentale.svg') }, 'Télécharger (SVG)')), h('p', { class: 'muted' }, 'Les branches sont les titres du cours (ou, à défaut, les paragraphes) ; les mots viennent de ton texte. Génération automatique : retouche-la si besoin.')); }
      if (tab === 'quiz') {
        const Q = Fiche.quiz(d); if (Q.length < 3) return body.append(h('div', { class: 'notice' }, 'Pas assez de matière pour un quiz (il faut des définitions ou plusieurs phrases avec des mots clés). Ajoute du texte.'));
        let i = 0, score = 0; const area = h('div');
        const show = () => { if (i >= Q.length) { App.log('quiz', title, { count: 'exercises', amount: Q.length }); return area.replaceChildren(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, `Score : ${score} / ${Q.length}`), h('button', { class: 'btn', onclick: () => { i = 0; score = 0; draw(); } }, 'Rejouer avec de nouvelles questions'))); }
          const q = Q[i]; const fb = h('div'); const box = h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, `Question ${i + 1} / ${Q.length}`), h('p', null, q.q), h('div', { class: 'grid' }, q.opts.map(o => h('button', { class: 'btn sec', style: 'text-align:left', onclick: ev => { $$('button', box).forEach(b => b.disabled = true); const ok = o === q.a; if (ok) score++; App.stats.exos.push({ ts: Date.now(), cat: 'quiz', ok1: ok, ok2: ok, lvl: 1 }); App.stats.counts.exercises++; App.saveStats(); fb.replaceChildren(h('p', null, ok ? '✅ Bravo !' : '❌ Pas tout à fait. Bonne réponse : ' + q.a), h('button', { class: 'btn', onclick: () => { i++; show(); } }, 'Suivant')); } }, o))), fb); area.replaceChildren(box); };
        show(); body.append(area);
      }
      if (tab === 'mots') { body.append(h('h3', null, 'Mots importants'), h('p', null, d.kw.map(k => `${k.w} (${k.n})`).join(' · ')), h('h3', null, 'Définitions extraites'), d.defs.length ? h('table', { class: 't' }, h('tr', null, h('th', null, 'Notion'), h('th', null, 'Définition')), d.defs.map(x => h('tr', null, h('td', null, h('b', null, x.term)), h('td', null, x.def)))) : h('p', null, 'Aucune définition repérée.')); }
    };
    el.append(h('label', null, 'Importer un document'), fileInput('.txt,.md,.docx,.odt,.pdf,.pptx', async f => { const r = await App.readFile(f); ta.value = r.text; App.setText(r.text, f.name.replace(/\.[^.]+$/, ''), r.kind); draw(); }), ta, h('div', { class: 'row', style: 'margin:.5rem 0' }, h('button', { class: 'btn', onclick: draw }, 'Fabriquer')), tabs, body); draw();
  }
});
App.reg({ id: 'cartes', title: 'Cartes mentales', group: 'activites', icon: '🧠', render() { location.hash = '#/fiches'; } });
App.reg({ id: 'quiz', title: 'Quiz', group: 'activites', icon: '❓', render() { location.hash = '#/fiches'; } });

// ====================================================================================================  Assistant de rédaction
const REDAC = {
  email: ['Écrire un e-mail', [['dest', 'À qui écris-tu ?', 'Madame Martin, Monsieur le directeur…'], ['objet', 'Quel est le sujet (objet) ?', 'Demande de rendez-vous'], ['but', 'Que veux-tu dire ou demander ?', 'Je voudrais vous rencontrer pour parler de mon projet.'], ['detail', 'Un détail utile (date, lieu, pièce jointe…) ?', 'Je suis disponible mardi ou jeudi après-midi.'], ['nom', 'Ton prénom et ton nom', 'Léa Durand']], v => `Objet : ${v.objet}\n\nBonjour ${v.dest},\n\n${v.but}\n${v.detail}\n\nJe vous remercie par avance de votre réponse.\n\nCordialement,\n${v.nom}`],
  courrier: ['Rédiger un courrier', [['exp', 'Ton nom et ton adresse', 'Léa Durand, 12 rue des Lilas, 30000 Nîmes'], ['dest', 'Destinataire (nom, adresse)', 'Mairie de Nîmes, Place de l’Hôtel de Ville'], ['lieu', 'Lieu et date', 'Nîmes, le 5 novembre'], ['objet', 'Objet', 'Demande d’information'], ['corps', 'Ce que tu veux écrire', 'Je vous écris pour savoir comment inscrire mon fils à la cantine.']], v => `${v.exp}\n\n${v.dest}\n\n${v.lieu}\n\nObjet : ${v.objet}\n\nMadame, Monsieur,\n\n${v.corps}\n\nDans l’attente de votre réponse, je vous prie d’agréer, Madame, Monsieur, l’expression de mes salutations distinguées.\n\n${v.exp.split(',')[0]}`],
  intro: ['Faire une introduction', [['sujet', 'Quel est le sujet ?', 'Le rôle de l’eau dans la vie quotidienne'], ['accroche', 'Une phrase pour attirer l’attention (accroche)', 'Chaque jour, nous utilisons de l’eau sans y penser.'], ['probleme', 'Quelle question te poses-tu (problématique) ?', 'Comment l’eau influence-t-elle notre mode de vie ?'], ['plan', 'Tes grandes parties, séparées par des points-virgules', 'son importance pour la santé ; son usage dans l’industrie']], v => `${v.accroche} Le sujet de ce travail est : ${v.sujet.toLowerCase()}. ${v.probleme}\nPour y répondre, nous verrons d’abord ${v.plan.split(';')[0].trim()}, puis ${(v.plan.split(';')[1] || '').trim()}.`],
  conclusion: ['Faire une conclusion', [['bilan', 'Que retiens-tu de ton travail (bilan) ?', 'L’eau est indispensable à la santé et à l’industrie.'], ['rep', 'Quelle est la réponse à ta question ?', 'Elle structure notre mode de vie.'], ['ouv', 'Une ouverture (autre question possible)', 'Comment mieux la protéger demain ?']], v => `Pour conclure, ${v.bilan.replace(/^./, c => c.toLowerCase())} Ainsi, ${v.rep.replace(/^./, c => c.toLowerCase())} Pour aller plus loin, on peut se demander : ${v.ouv}`],
  expose: ['Rédiger un exposé', [['titre', 'Titre de l’exposé', 'Les volcans'], ['p1', 'Partie 1 : idée et exemple', 'Comment naît un volcan : le magma monte vers la surface.'], ['p2', 'Partie 2 : idée et exemple', 'Les risques : éruptions et coulées de lave.'], ['p3', 'Partie 3 : idée et exemple', 'La surveillance : les scientifiques mesurent les tremblements.']], v => `${v.titre}\n\nIntroduction\nAujourd’hui, je vais vous parler de ${v.titre.toLowerCase()}.\n\nPremière partie\n${v.p1}\n\nDeuxième partie\n${v.p2}\n\nTroisième partie\n${v.p3}\n\nConclusion\nPour résumer, nous avons vu trois points importants. Merci de votre attention.`],
  oral: ['Préparer un oral', [['sujet', 'Sujet de ton oral', 'Mon livre préféré'], ['idees', 'Tes 3 idées, séparées par des points-virgules', 'l’histoire ; les personnages ; pourquoi je l’aime'], ['fin', 'Ta phrase de fin', 'Je vous le recommande.']], v => `Bonjour à tous. Je vais vous présenter : ${v.sujet}.\n${v.idees.split(';').map((x, i) => `${['Tout d’abord', 'Ensuite', 'Enfin'][i] || 'Puis'}, je vais parler de ${x.trim()}.`).join('\n')}\n${v.fin} Merci de m’avoir écouté. Avez-vous des questions ?`],
  resume: ['Rédiger un résumé', [['texte', 'Colle le texte à résumer', ''], ['k', 'Nombre de phrases voulues (1 à 6)', '3']], v => TX.summarize(v.texte, Math.max(1, Math.min(6, +v.k || 3))).join(' ')],
  compte: ['Écrire un compte rendu', [['titre', 'Réunion / sujet', 'Réunion de classe'], ['date', 'Date et lieu', 'Le 5 novembre, en salle 12'], ['pers', 'Personnes présentes', 'Léa, Tom, Mme Martin'], ['points', 'Points abordés (séparés par des points-virgules)', 'la sortie scolaire ; le calendrier des contrôles'], ['dec', 'Décisions prises (séparées par des points-virgules)', 'sortie le 12 décembre ; contrôle reporté']], v => `Compte rendu — ${v.titre}\n${v.date}\nPrésents : ${v.pers}\n\nPoints abordés :\n${v.points.split(';').map(x => '• ' + x.trim()).join('\n')}\n\nDécisions :\n${v.dec.split(';').map(x => '• ' + x.trim()).join('\n')}`],
  motiv: ['Rédiger une lettre de motivation', [['nom', 'Ton nom', 'Léa Durand'], ['poste', 'Poste ou formation visé(e)', 'stage en bibliothèque'], ['orga', 'Organisme', 'la médiathèque de Nîmes'], ['qual', 'Deux qualités', 'sérieuse et organisée'], ['exp', 'Une expérience ou un exemple', 'J’ai aidé à ranger le CDI de mon collège.'], ['pourquoi', 'Pourquoi cet endroit ?', 'J’aime les livres et le contact avec le public.']], v => `Madame, Monsieur,\n\nJe souhaite postuler pour un(e) ${v.poste} à ${v.orga}.\n\n${v.pourquoi} Je suis ${v.qual}. ${v.exp}\n\nJe serais heureuse de vous rencontrer pour vous expliquer ma motivation.\n\nDans l’attente de votre réponse, je vous prie d’agréer, Madame, Monsieur, mes salutations distinguées.\n\n${v.nom}`],
  devoir: ['Améliorer un devoir', null, null]
};
App.reg({
  id: 'redaction', title: 'Assistant de rédaction', group: 'outils', icon: '📝', render(el) {
    el.append(h('h1', null, 'Assistant de rédaction'), h('p', { class: 'muted' }, 'L’assistant te pose des questions pas à pas, puis assemble un brouillon à partir de TES réponses. Le modèle de phrases est fixe (pas d’IA) : relis et personnalise.'));
    const sel = h('select', { 'aria-label': 'Choisir le type de texte' }, Object.entries(REDAC).map(([k, v]) => h('option', { value: k }, v[0]))); const area = h('div');
    const draw = () => {
      const [name, steps, build] = REDAC[sel.value]; area.replaceChildren();
      if (!steps) { // améliorer un devoir : parcours guidé
        const ta = textArea(App.ws.text, 8, 'Ton devoir'); const out = h('div');
        const go = () => { const t = ta.value; if (Corrector.countWords(t) < 15) return App.toast('Colle ton devoir (15 mots minimum).'); const r = Corrector.analyze(t); const rd = Read.analyse(t); const order = ['ortho', 'homo', 'gram', 'conj', 'accord', 'typo', 'ponct', 'manque', 'rep', 'vocab', 'synt', 'coh', 'amelio', 'ambigu']; const by = {}; r.errors.forEach(e => (by[e.cat] = by[e.cat] || []).push(e)); const steps = order.filter(c => by[c]);
          const bits = [h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, 'Étape 1 — Vue d’ensemble'), h('p', null, `${r.stats.words} mots, lisibilité ${rd.global} / 10, ${r.errors.length} point(s) à regarder.`))];
          steps.forEach((c, i) => bits.push(h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, `Étape ${i + 2} — ${CAT[c].emoji} ${CAT[c].libelle} (${by[c].length})`), h('p', { class: 'muted' }, CAT[c].expl), h('ul', null, by[c].slice(0, 6).map(e => h('li', null, `« ${e.orig.slice(0, 60)} » — ${e.msg}`, e.sugg[0] ? h('i', null, ` → ${e.sugg[0]}`) : ''))))));
          bits.push(h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { App.setText(t); App.go('correcteur'); } }, 'Corriger ce devoir dans le correcteur')));
          out.replaceChildren(...bits);
        };
        area.append(h('p', null, 'Colle ton devoir : je te guide catégorie par catégorie, de l’orthographe vers le style.'), ta, h('button', { class: 'btn', style: 'margin:.5rem 0', onclick: go }, 'Commencer'), out); return;
      }
      let k = 0; const vals = {}; const card = h('div', { class: 'card' }); const res = h('div');
      const step = () => {
        if (k >= steps.length) { const text = build(vals); const ta = h('textarea', { rows: 12, 'aria-label': 'Brouillon' }); ta.value = text; card.replaceChildren(h('h2', { style: 'margin-top:0' }, 'Ton brouillon'), ta, h('div', { class: 'row', style: 'margin-top:.5rem' }, h('button', { class: 'btn', onclick: () => { App.setText(ta.value, name); App.go('correcteur'); } }, 'Le corriger'), App.listenBtn(() => ta.value), h('button', { class: 'btn sec', onclick: () => App.copy(ta.value).then(() => App.toast('Copié.')) }, 'Copier'), h('button', { class: 'btn sec', onclick: () => { k = 0; step(); } }, 'Recommencer'))); App.log('rédaction', name, { count: 'texts' }); return; }
        const [key, label, ph] = steps[k]; const inp = key === 'texte' ? h('textarea', { rows: 6 }) : h('input', { type: 'text', placeholder: 'Exemple : ' + ph }); inp.value = vals[key] || (key === 'texte' ? App.ws.text : ''); inp.setAttribute('aria-label', label);
        card.replaceChildren(h('div', { class: 'muted' }, `Étape ${k + 1} sur ${steps.length}`), h('div', { class: 'bar', style: 'margin:.3rem 0' }, h('i', { style: `width:${(k) / steps.length * 100}%` })), h('label', null, label), inp, h('div', { class: 'row', style: 'margin-top:.5rem' }, k > 0 ? h('button', { class: 'btn sec', onclick: () => { vals[key] = inp.value; k--; step(); } }, '◀ Précédent') : '', App.mic(inp), h('button', { class: 'btn', onclick: () => { vals[key] = inp.value.trim() || ph; k++; step(); } }, k === steps.length - 1 ? 'Voir le brouillon' : 'Suivant ▶')));
        inp.focus();
      };
      area.append(card, res); step();
    };
    sel.onchange = draw; el.append(h('label', null, 'Que veux-tu écrire ?'), sel, area); draw();
  }
});

// ====================================================================================================  Images et OCR
App.ocrLow = []; App.postAnalyse = [];
App.reg({
  id: 'ocr', title: 'Images et OCR', group: 'outils', icon: '🖼️', render(el) {
    const e = App.engines; el.append(h('h1', null, 'Texte dans une image (OCR)'));
    el.append(h('div', { class: 'notice ' + (e.ocr && e.ocr.available ? 'ok' : 'bad') }, e.ocr && e.ocr.available ? `Moteur OCR local : ${e.ocr.version}, français disponible. L’image reste sur cet ordinateur.` : 'Moteur OCR indisponible : ' + (e.ocr ? e.ocr.reason : 'vérification en cours…') + (e.hosted ? '' : ' Installe Tesseract (avec la langue française) puis relance « node server.js ».')));
    const cv = h('canvas', { style: 'max-width:100%;border:1px solid var(--line);cursor:crosshair;touch-action:none', 'aria-label': 'Image : glisse pour sélectionner une zone' }); const ctx = cv.getContext('2d'); let img = null, sel = null, drag = null, blob = null; const out = h('div');
    const draw = () => { if (!img) return; ctx.drawImage(img, 0, 0); if (sel) { ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, 0, cv.width, cv.height); ctx.drawImage(img, sel.x, sel.y, sel.w, sel.h, sel.x, sel.y, sel.w, sel.h); ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = Math.max(2, cv.width / 300); ctx.strokeRect(sel.x, sel.y, sel.w, sel.h); } };
    const pos = ev => { const r = cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) * cv.width / r.width, y: (ev.clientY - r.top) * cv.height / r.height }; };
    cv.addEventListener('pointerdown', ev => { if (!img) return; drag = pos(ev); sel = null; cv.setPointerCapture(ev.pointerId); });
    cv.addEventListener('pointermove', ev => { if (!drag) return; const p = pos(ev); sel = { x: Math.min(drag.x, p.x), y: Math.min(drag.y, p.y), w: Math.abs(p.x - drag.x), h: Math.abs(p.y - drag.y) }; draw(); });
    cv.addEventListener('pointerup', () => { drag = null; if (sel && (sel.w < 10 || sel.h < 10)) { sel = null; draw(); } });
    const load = f => new Promise((res, rej) => { if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) return rej(new Error('Formats acceptés : PNG, JPG, JPEG, WEBP.')); const i = new Image(); i.onload = () => { img = i; cv.width = i.naturalWidth; cv.height = i.naturalHeight; sel = null; draw(); res(); }; i.onerror = () => rej(new Error('Image illisible.')); i.src = URL.createObjectURL(f); });
    const read = async whole => {
      if (!img) return App.toast('Choisis d’abord une image.'); if (!(e.ocr && e.ocr.available)) return App.toast('Moteur OCR indisponible.');
      const c = document.createElement('canvas'); const r = (!whole && sel) ? sel : { x: 0, y: 0, w: img.naturalWidth, h: img.naturalHeight }; c.width = r.w; c.height = r.h; c.getContext('2d').drawImage(img, r.x, r.y, r.w, r.h, 0, 0, r.w, r.h);
      out.replaceChildren(h('p', null, '⏳ Lecture en cours…')); const b = await new Promise(res => c.toBlob(res, 'image/png'));
      try { const resp = await fetch('api/ocr?lang=fra&psm=' + (whole || !sel ? 3 : 6), { method: 'POST', body: b }); const j = await resp.json(); if (j.error) throw new Error(j.error); App.ocrLow = j.lowConf.map(x => x.text);
        const ta = h('textarea', { rows: 8, 'aria-label': 'Texte lu' }); ta.value = j.text; App.log('OCR', 'Image', { count: 'docs' });
        out.replaceChildren(h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, 'Texte lu'), ta, j.lowConf.length ? h('p', { class: 'muted' }, `${j.lowConf.length} mot(s) lu(s) avec peu de certitude : ils seront marqués en gris dans le correcteur (${j.lowConf.slice(0, 8).map(x => x.text).join(', ')}…).`) : '', h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => App.send(ta.value, 'correcteur', 'Texte lu dans une image', 'ocr') }, 'Analyser avec le correcteur'), App.listenBtn(() => ta.value), h('button', { class: 'btn sec', onclick: () => { App.setText(ta.value, 'Texte lu dans une image', 'ocr'); App.toast('Défini comme document en cours.'); } }, 'Utiliser comme document'))));
      } catch (err) { out.replaceChildren(h('div', { class: 'notice bad' }, 'Lecture impossible : ' + err.message)); }
    };
    App.postAnalyse.push((res, t) => { if (!App.ocrLow.length) return; const low = new Set(App.ocrLow.map(w => w.toLowerCase())); Corrector.words(t).forEach(w => { if (low.has(w.w.toLowerCase()) && !res.errors.some(x => x.start === w.start && x.cat === 'ambigu')) res.errors.push({ id: 'o' + w.start, start: w.start, end: w.end, cat: 'ambigu', msg: 'Mot lu avec peu de certitude par l’OCR : compare avec l’image.', sugg: [], orig: w.w, rule: 'ocr', kind: 'info' }); }); res.errors.sort((a, b) => a.start - b.start); });
    el.append(h('label', null, 'Image (PNG, JPG, JPEG, WEBP) ou capture d’écran'), fileInput('image/png,image/jpeg,image/webp', f => load(f)), h('p', { class: 'muted' }, 'Tu peux glisser la souris (ou le doigt) sur l’image pour ne lire qu’une zone.'), cv, h('div', { class: 'row', style: 'margin:.5rem 0' }, h('button', { class: 'btn', onclick: () => read(true) }, 'Lire toute l’image'), h('button', { class: 'btn sec', onclick: () => read(false) }, 'Lire la zone sélectionnée'), h('button', { class: 'btn sec', onclick: () => { sel = null; draw(); } }, 'Effacer la sélection')), out);
  }
});
