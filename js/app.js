/* Outil Dys — noyau : état, préférences, profil, adaptations, navigation, surlignage, voix, correcteur. 100 % local. */
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const h = (tag, a, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(a || {})) {
    if (v === false || v == null) continue;
    if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k === 'value') e.value = v; else if (v === true) e.setAttribute(k, ''); else e.setAttribute(k, v);
  }
  kids.flat(Infinity).forEach(c => { if (c == null || c === false) return; e.append(c.nodeType ? c : document.createTextNode(c)); });
  return e;
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const Store = {
  get(k, d) { try { const v = localStorage.getItem('dys.' + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem('dys.' + k, JSON.stringify(v)); } catch { /* stockage indisponible */ } },
  clear() { try { Object.keys(localStorage).filter(k => k.startsWith('dys.')).forEach(k => localStorage.removeItem(k)); } catch { } }
};

const FONTS = {
  system: ['Police du système', 'system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif'],
  arial: ['Arial', 'Arial,Helvetica,sans-serif'], verdana: ['Verdana', 'Verdana,Geneva,sans-serif'], tahoma: ['Tahoma', 'Tahoma,Verdana,sans-serif'],
  trebuchet: ['Trebuchet MS', '"Trebuchet MS",Arial,sans-serif'], comic: ['Comic Sans MS / Comic Neue', '"Comic Sans MS","Comic Neue",cursive,Arial'],
  opendys: ['OpenDyslexic (si installée)', 'OpenDyslexic,"Open Dyslexic",Verdana,Arial,sans-serif'], lexend: ['Lexend (si installée)', 'Lexend,Verdana,Arial,sans-serif'],
  georgia: ['Georgia', 'Georgia,serif'], mono: ['Chasse fixe', '"Courier New",monospace']
};
const DEFAULT_PREFS = { colors: {}, font: 'system', size: 18, letterSp: 0, wordSp: 0, paraSp: 1, lineH: 1.6, theme: 'auto', ttsRate: 1, voice: '', lang: 'fr', simplLevel: 'simple', explainLevel: 'court', showCorrect: true, showIcons: true, minSlideFont: 18, autoAnalyse: true, softTypo: true, timerMin: 25, showBar: true };
const PROFILES = [
  { g: 'Troubles spécifiques des apprentissages', items: [['dyslexie', 'Dyslexie'], ['dysortho', 'Dysorthographie'], ['dysgraphie', 'Dysgraphie'], ['dyscalculie', 'Dyscalculie'], ['dyspraxie', 'Dyspraxie / trouble développemental de la coordination'], ['dysphasie', 'Dysphasie / trouble développemental du langage'], ['associes', 'Troubles associés']] },
  { g: 'Autres profils et besoins', items: [['tdah', 'TDAH'], ['hpi', 'HPI'], ['concentration', 'Difficultés de concentration'], ['memo', 'Difficultés de mémorisation'], ['lecture', 'Difficultés de lecture'], ['ecriture', "Difficultés d'écriture"], ['compre', 'Difficultés de compréhension'], ['organisation', "Difficultés d'organisation"], ['spatial', 'Difficultés de repérage spatial'], ['visuel', 'Sensibilité aux stimulations visuelles'], ['simplifie', 'Besoin de supports simplifiés'], ['consignes', 'Besoin de consignes courtes'], ['repetitions', 'Besoin de répétitions'], ['audio', "Besoin d'accompagnement audio"]] }
];
const FEATURES = {
  fontDys: 'Police adaptée (lisible)', spacing: 'Espacement des lettres et des mots', airy: 'Textes aérés (interligne et paragraphes)', ruler: 'Règle de lecture', syllables: 'Surlignage syllabique (approximatif) dans la lecture',
  audio: 'Boutons « écouter » mis en avant', detailCorr: 'Correction détaillée : explication de chaque erreur ouverte', bigTargets: 'Grandes zones cliquables', simpleNav: 'Navigation simplifiée (menu replié)', shortcuts: 'Raccourcis clavier (Alt+1…9, Alt+A, Alt+L, Alt+C ; Alt+R lit le texte sélectionné et Échap arrête la lecture, sans réglage)',
  voiceInput: 'Saisie vocale mise en avant', focus: 'Mode concentration au démarrage', timer: 'Minuteur visible', shortText: 'Consignes courtes', calmVisual: 'Interface calme (pas d’animations)', deeper: 'Défis et approfondissement mis en avant', mathVisual: 'Aides visuelles pour les nombres ouvertes par défaut'
};
const SUGGEST = {
  dyslexie: ['fontDys', 'spacing', 'airy', 'ruler', 'syllables', 'audio'], dysortho: ['detailCorr'], dysgraphie: ['voiceInput', 'detailCorr'], dyscalculie: ['mathVisual', 'shortText'], dyspraxie: ['bigTargets', 'simpleNav', 'shortcuts', 'voiceInput'],
  dysphasie: ['shortText', 'audio'], tdah: ['focus', 'timer', 'shortText', 'calmVisual'], hpi: ['deeper'], concentration: ['focus', 'timer'], memo: ['shortText'], lecture: ['fontDys', 'spacing', 'airy', 'ruler', 'audio'], ecriture: ['voiceInput', 'detailCorr'],
  compre: ['shortText', 'audio'], organisation: ['timer', 'simpleNav'], spatial: ['simpleNav'], visuel: ['calmVisual', 'airy'], simplifie: ['shortText'], consignes: ['shortText'], repetitions: ['audio'], audio: ['audio'], associes: []
};

const App = {
  mods: [], current: null, prefs: Object.assign({}, DEFAULT_PREFS, Store.get('prefs', {})),
  profile: Object.assign({ none: false, custom: false, picks: [], features: {} }, Store.get('profile', {})),
  ws: Object.assign({ text: '', title: 'Sans titre', kind: 'texte' }, Store.get('ws', {})),
  stats: Object.assign({ counts: { texts: 0, docs: 0, slides: 0, errors: 0, dictations: 0, exercises: 0, fiches: 0, reports: 0 }, byCat: {}, daily: {}, timeSec: { app: 0, learn: 0 }, exos: [], hist: [] }, Store.get('stats', {})),
  ignored: new Set(), engines: {}, learning: false, hidden: new Set(),

  reg(m) { this.mods.push(m); },
  groups: [['home', 'Accueil'], ['espace', 'Mon espace'], ['outils', 'Mes outils'], ['matieres', 'Mes matières'], ['modes', "Mes modes d'apprentissage"], ['activites', 'Mes activités'], ['params', 'Paramètres']],

  // ---------------------------------------------------------------- préférences et adaptation
  savePrefs() { Store.set('prefs', this.prefs); this.adapt(); },
  saveProfile() { Store.set('profile', this.profile); this.adapt(); },
  saveWs() { Store.set('ws', this.ws); const el = $('#wsInfo'); if (el) el.textContent = this.ws.text.trim() ? `📄 ${this.ws.title} · ${Corrector.countWords(this.ws.text)} mots` : ''; },
  saveStats() { Store.set('stats', this.stats); },
  feat(k) { return !!this.profile.features[k]; },
  color(cat) { return this.prefs.colors[cat] || CAT[cat].def; },
  setText(t, title, kind) { this.ws.text = t; if (title) this.ws.title = title; if (kind) this.ws.kind = kind; this.saveWs(); },
  send(text, modId, title, kind) { this.setText(text, title, kind); this.go(modId); },
  copy(t) { return (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject(new Error('no clipboard'))).catch(() => { const ta = h('textarea', { style: 'position:fixed;opacity:0' }); ta.value = t; document.body.append(ta); ta.select(); try { document.execCommand('copy'); } catch { /* copie impossible */ } ta.remove(); }); },
  toast(msg) { const t = h('div', null, msg); $('#toast').append(t); setTimeout(() => t.remove(), 3500); },
  download(blob, name) { const a = h('a', { href: URL.createObjectURL(blob), download: name }); document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); },
  adapt() {
    const p = this.prefs, r = document.documentElement.style, root = document.documentElement;
    let font = p.font, ls = p.letterSp, ws = p.wordSp, lh = p.lineH, ps = p.paraSp;
    if (this.feat('fontDys') && font === 'system') font = 'lexend';
    if (this.feat('spacing')) { ls = Math.max(ls, 0.06); ws = Math.max(ws, 0.16); }
    if (this.feat('airy')) { lh = Math.max(lh, 1.9); ps = Math.max(ps, 1.6); }
    r.setProperty('--font', FONTS[font][1]); r.setProperty('--fs', p.size + 'px'); r.setProperty('--ls', ls + 'em'); r.setProperty('--ws', ws + 'em'); r.setProperty('--lh', lh); r.setProperty('--ps', ps);
    const dark = p.theme === 'dark' || (p.theme === 'auto' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    root.dataset.theme = dark ? 'dark' : 'light';
    r.setProperty('--c-correct', this.color('correct'));
    document.body.classList.toggle('big', this.feat('bigTargets'));
    document.body.classList.toggle('calm', this.feat('calmVisual'));
    const ruler = $('#ruler'); if (ruler) ruler.hidden = !this.feat('ruler');
    const ib = $('#infobar'); if (ib) ib.hidden = p.showBar === false;
    const tb = $('#timerBox'); if (tb) tb.hidden = !this.feat('timer') && !this.timerOn;
    if (this.feat('timer') && !this.timerOn) this.timerStart(true);
  },
  setFeature(k, v) { this.profile.features[k] = v; this.saveProfile(); },
  togglePick(id, on) {
    const picks = new Set(this.profile.picks); on ? picks.add(id) : picks.delete(id); this.profile.picks = [...picks]; if (on) this.profile.none = false;
    const wanted = new Set(); this.profile.picks.forEach(pid => (SUGGEST[pid] || []).forEach(f => wanted.add(f)));
    (SUGGEST[id] || []).forEach(f => { if (on) this.profile.features[f] = true; else if (!wanted.has(f)) this.profile.features[f] = false; });
    this.saveProfile();
  },
  resetPrefs() { this.prefs = Object.assign({}, DEFAULT_PREFS); Store.set('prefs', this.prefs); this.adapt(); },

  // ---------------------------------------------------------------- navigation
  go(id) { location.hash = '#/' + id; },
  // route(refresh) : navigation vers le module du lien. refresh=true : on redessine le MÊME module sans perdre la position ni le focus
  // (c'est ce qui faisait remonter la page en haut à chaque case cochée).
  route(refresh) {
    const id = (location.hash.replace(/^#\//, '') || 'home').split('?')[0];
    const mod = this.mods.find(m => m.id === id) || this.mods.find(m => m.id === 'home');
    const keep = refresh === true && this.current && this.current.id === mod.id;
    const main = $('#main'); const y = window.scrollY;
    const fsel = 'input,button,select,textarea,summary,a[href]'; const ae = document.activeElement; const fidx = keep && ae && main.contains(ae) ? [...main.querySelectorAll(fsel)].indexOf(ae) : -1;
    this.current = mod; this.learning = !!mod.learn;
    main.replaceChildren();
    this.stopSpeak(); this.hidePop();
    try { mod.render(main); } catch (e) { console.error(e); main.append(h('div', { class: 'notice bad' }, `Erreur dans ce module : ${e.message}`)); }
    $$('#nav a').forEach(a => { if (a.dataset.id === mod.id) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
    document.title = mod.title + ' — Outil Dys';
    { const cur = $('#nav a[aria-current]'); const d = cur && cur.closest('details'); if (d) d.open = true; if (!keep && this.narrowNav) this.narrowNav(); }
    if (keep) { if (fidx >= 0) { const el = main.querySelectorAll(fsel)[fidx]; if (el) el.focus({ preventScroll: true }); } window.scrollTo(0, y); }
    else { main.focus({ preventScroll: true }); window.scrollTo(0, 0); }
  },
  refresh() { this.route(true); },
  buildNav() {
    const nav = $('#nav'); nav.replaceChildren();
    const simple = this.feat('simpleNav');
    for (const [g, label] of this.groups) {
      const mods = this.mods.filter(m => m.group === g && !m.hidden);
      if (!mods.length) continue;
      if (g === 'home') { const m = mods[0]; nav.append(h('a', { href: '#/' + m.id, 'data-id': m.id, class: 'home' }, '🏠 ', m.title)); continue; }
      const d = h('details', { open: !simple || mods.some(m => this.current && m.id === this.current.id) }, h('summary', null, label));
      mods.forEach(m => d.append(h('a', { href: '#/' + m.id, 'data-id': m.id }, m.icon ? m.icon + ' ' : '', m.title)));
      nav.append(d);
    }
  },
  start() {
    // petit écran : menu replié au départ (sinon 2 500 px de menu avant le contenu), il s'ouvre avec ☰ et se referme au choix d'une page
    const mq = window.matchMedia('(max-width:900px)'); const setNav = hide => { document.body.classList.toggle('nav-hidden', hide); $('#menuBtn').setAttribute('aria-expanded', String(!hide)); };
    this.narrowNav = () => { if (mq.matches) setNav(true); }; setNav(mq.matches); mq.addEventListener('change', e => setNav(e.matches));
    this.mods.sort((a, b) => this.groups.findIndex(g => g[0] === a.group) - this.groups.findIndex(g => g[0] === b.group));
    this.adapt(); this.buildNav(); this.saveWs();
    window.addEventListener('hashchange', () => { if (location.hash === '' || location.hash.startsWith('#/')) this.route(); });
    $('#menuBtn').addEventListener('click', () => { const hide = document.body.classList.toggle('nav-hidden'); $('#menuBtn').setAttribute('aria-expanded', String(!hide)); });
    $('#focusBtn').addEventListener('click', () => this.toggleFocus());
    const bump = d => { const n = Math.max(14, Math.min(32, (+this.prefs.size || 18) + d)); this.prefs.size = n; this.savePrefs(); this.toast('Taille du texte : ' + n + ' px' + (n === 14 || n === 32 ? ' (limite)' : '')); };
    $('#aMinus').addEventListener('click', () => bump(-2)); $('#aPlus').addEventListener('click', () => bump(2)); this.initReadSel(); this.initBar();
    if (this.feat('focus')) document.body.classList.add('focus');
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { this.hidePop(); this.stopSpeak(); }
      if (e.altKey && e.key.toLowerCase() === 'r') { e.preventDefault(); this.readSelection(); return; }
      if (!e.altKey || !this.feat('shortcuts')) { if (e.altKey && e.key.toLowerCase() === 'c') this.toggleFocus(); return; }
      const k = e.key.toLowerCase(); const order = ['home', 'correcteur', 'dictee', 'lecture', 'simplif', 'slides', 'analyse', 'maths', 'exercices'];
      if (/^[1-9]$/.test(k)) { this.go(order[+k - 1] || 'home'); e.preventDefault(); }
      if (k === 'a') { const b = $('[data-act="analyse"]'); if (b) b.click(); e.preventDefault(); }
      if (k === 'l') { const b = $('[data-act="listen"]'); if (b) b.click(); e.preventDefault(); }
    });
    document.addEventListener('mousemove', e => { const r = $('#ruler'); if (r && !r.hidden) r.style.top = Math.max(0, e.clientY - 18) + 'px'; });
    document.addEventListener('click', e => { const p = $('#pop'); if (!p.hidden && !p.contains(e.target) && !e.target.closest('.seg,[data-pop]')) this.hidePop(); });
    setInterval(() => { if (document.hidden) return; this.stats.timeSec.app++; if (this.learning) this.stats.timeSec.learn++; if (this.stats.timeSec.app % 15 === 0) this.saveStats(); this.timerTick(); }, 1000);
    this.detectEngines(); this.route();
  },
  // 🔊 lire la sélection : sélectionne du texte n'importe où (page, zone de texte), un bouton « Lire » apparaît ; Alt+R fait la même chose ; Échap arrête
  selectedText() { const a = document.activeElement; if (a && /^(TEXTAREA|INPUT)$/.test(a.tagName) && typeof a.selectionStart === 'number' && a.selectionStart !== a.selectionEnd) return a.value.slice(a.selectionStart, a.selectionEnd).trim(); const s = window.getSelection(); return s && !s.isCollapsed ? s.toString().trim() : ''; },
  readSelection() { const t = this.selectedText(); if (!t) return this.toast('Sélectionne d’abord du texte, puis touche « 🔊 Lire » (ou Alt+R). Échap arrête la lecture.'); if (!('speechSynthesis' in window)) return this.toast('La lecture à voix haute n’est pas disponible dans ce navigateur.'); this.stopSpeak(); this.speak(t.slice(0, 4000)); },
  initReadSel() {
    const b = h('button', { id: 'readSel', class: 'btn', type: 'button', 'aria-label': 'Lire à voix haute le texte sélectionné', style: 'position:fixed;display:none;z-index:60;min-height:0;padding:.3rem .7rem;box-shadow:0 2px 10px rgba(0,0,0,.4)', onmousedown: e => e.preventDefault(), onclick: () => { this.readSelection(); b.style.display = 'none'; } }, '🔊 Lire'); document.body.append(b);
    let t = 0; const upd = () => { const txt = this.selectedText(); if (txt.length < 2 || !('speechSynthesis' in window)) { b.style.display = 'none'; return; } const a = document.activeElement; let r; if (a && /^(TEXTAREA|INPUT)$/.test(a.tagName) && a.selectionStart !== a.selectionEnd) r = a.getBoundingClientRect(); else { const s = getSelection(); if (!s.rangeCount) return; r = s.getRangeAt(0).getBoundingClientRect(); if (!r.width && !r.height) { b.style.display = 'none'; return; } } b.style.display = 'block'; b.style.left = Math.max(8, Math.min(innerWidth - 90, r.left)) + 'px'; b.style.top = Math.max(8, Math.min(innerHeight - 44, r.bottom + 8)) + 'px'; };
    const later = () => { clearTimeout(t); t = setTimeout(upd, 250); }; document.addEventListener('selectionchange', later); document.addEventListener('mouseup', later); document.addEventListener('keyup', later); document.addEventListener('scroll', () => { b.style.display = 'none'; }, true);
  },
  toggleFocus() { const on = document.body.classList.toggle('focus'); this.toast(on ? 'Mode concentration activé : menu masqué.' : 'Mode concentration désactivé.'); },
  async detectEngines() {
    const e = this.engines;
    e.tts = 'speechSynthesis' in window; e.stt = !!(window.SpeechRecognition || window.webkitSpeechRecognition); e.zip = typeof DecompressionStream !== 'undefined' && typeof CompressionStream !== 'undefined'; e.pdflib = typeof PDFLib !== 'undefined';
    const local = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
    e.hosted = location.protocol !== 'file:' && !local; // version en ligne (GitHub Pages…) : pas de serveur local, donc pas d'OCR
    try { if (location.protocol === 'file:' || e.hosted) throw new Error('pas de serveur local'); const r = await fetch('api/status'); const j = await r.json(); e.server = true; e.ocr = j.ocr; } catch { e.server = false; e.ocr = { available: false, reason: e.hosted ? "dans la version en ligne, l'OCR n'existe pas (il demande un moteur installé sur ton ordinateur : Tesseract). Télécharge l'outil et lance-le avec « node server.js » pour l'avoir." : "L'application n'est pas lancée avec « node server.js » : le moteur OCR est inactif." }; }
    try { const r = await fetch('libs/pdf.min.mjs', { method: 'HEAD' }); e.pdfjs = r.ok && (e.server || e.hosted); } catch { e.pdfjs = false; }
  },

  // ---------------------------------------------------------------- minuteur
  timerLeft: 0, timerOn: false, timerPaused: false,
  timerStart(quiet) { this.timerOn = true; this.timerPaused = false; this.timerLeft = this.prefs.timerMin * 60; const b = $('#timerBox'); b.hidden = false; this.timerTick(); if (!quiet) this.toast(`Minuteur lancé : ${this.prefs.timerMin} min.`); },
  timerTick() { if (!this.timerOn) return; if (!this.timerPaused && !document.hidden) this.timerLeft = Math.max(0, this.timerLeft - 1); const b = $('#timerBox'); const m = Math.floor(this.timerLeft / 60), s = this.timerLeft % 60; b.textContent = `⏱ ${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; if (this.timerLeft === 0 && !this.timerPaused) { this.timerPaused = true; this.toast('⏱ Temps écoulé : fais une petite pause !'); } },
  timerStop() { this.timerOn = false; const b = $('#timerBox'); b.hidden = !this.feat('timer'); b.textContent = ''; },

  // ---------------------------------------------------------------- statistiques
  log(type, title, info = {}) {
    const s = this.stats; const day = new Date().toISOString().slice(0, 10);
    s.daily[day] = s.daily[day] || { analyses: 0, errors: 0 }; s.daily[day].analyses++;
    const n = (info.errors || []).length; s.counts.errors += n; s.daily[day].errors += n;
    (info.errors || []).forEach(e => s.byCat[e.cat] = (s.byCat[e.cat] || 0) + 1);
    if (info.count) s.counts[info.count] = (s.counts[info.count] || 0) + (info.amount || 1);
    s.hist.unshift({ ts: Date.now(), type, title: String(title).slice(0, 80), errors: n }); s.hist.length = Math.min(s.hist.length, 200); this.saveStats();
  },

  // ---------------------------------------------------------------- surlignage
  rgba(hex, a) { const m = /^#?([\da-f]{2})([\da-f]{2})([\da-f]{2})$/i.exec(hex); if (!m) return hex; return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`; },
  markHTML(text, errors, opt = {}) {
    const showOk = opt.showCorrect ?? this.prefs.showCorrect, icons = opt.icons ?? this.prefs.showIcons;
    const pts = new Set([0, text.length]); errors.forEach(e => { pts.add(e.start); pts.add(e.end); });
    const P = [...pts].sort((a, b) => a - b); const startsAt = new Map();
    errors.forEach(e => { if (!startsAt.has(e.start)) startsAt.set(e.start, []); startsAt.get(e.start).push(e); });
    let out = '';
    for (let i = 0; i < P.length - 1; i++) {
      const a = P[i], b = P[i + 1]; if (a === b) continue;
      const seg = text.slice(a, b); const cover = errors.filter(e => e.start <= a && e.end >= b);
      let pre = '';
      if (icons) (startsAt.get(a) || []).forEach(e => { pre += `<i class="ico" aria-hidden="true" style="background:${this.color(e.cat)}">${esc(CAT[e.cat].icone)}</i>`; });
      if (!cover.length) { out += pre + (showOk ? esc(seg).replace(/([\p{L}\p{M}][\p{L}\p{M}'’\-]*)/gu, '<span class="ok">$1</span>') : esc(seg)); continue; }
      const sorted = cover.slice().sort((x, y) => (x.end - x.start) - (y.end - y.start)); const prim = sorted[0], big = sorted[sorted.length - 1];
      const isGrp = (prim.end - prim.start) > 22 && /\s/.test(text.slice(prim.start, prim.end).trim());
      const c = this.color(prim.cat);
      let style = isGrp ? `background:${this.rgba(c, .16)};border-bottom:3px dotted ${c}` : `background:${this.rgba(c, .4)};border-bottom:3px solid ${c}`;
      if (big !== prim) style += `;text-decoration:underline dotted ${this.color(big.cat)} 3px;text-underline-offset:5px`;
      const label = cover.map(e => CAT[e.cat].nom + ' : ' + e.msg).join(' / ');
      out += `${pre}<span class="seg ${isGrp ? 'grp' : 'wrd'}" tabindex="0" role="button" data-e="${cover.map(e => e.id).join(',')}" style="${style}" title="${esc(label)}">${esc(seg)}</span>`;
    }
    return out;
  },
  hidePop() { const p = $('#pop'); if (p) p.hidden = true; },
  showPop(anchor, node) {
    const p = $('#pop'); p.replaceChildren(h('button', { class: 'btn small sec', style: 'float:right', onclick: () => this.hidePop(), 'aria-label': 'Fermer' }, '✕'), node); p.hidden = false;
    const r = anchor.getBoundingClientRect(); const w = p.offsetWidth, hh = p.offsetHeight;
    let x = Math.min(Math.max(8, r.left), innerWidth - w - 8), y = r.bottom + 8; if (y + hh > innerHeight - 8) y = Math.max(8, r.top - hh - 8);
    p.style.left = x + 'px'; p.style.top = y + 'px';
  },
  errCard(e, handlers) {
    const c = CAT[e.cat];
    const d = h('div', null,
      h('div', null, h('span', { class: 'tagbox', style: `background:${this.color(e.cat)}` }, `${c.icone} ${c.nom}`), ' ', h('b', null, c.libelle)),
      h('p', null, e.msg), h('p', { class: 'muted' }, `« ${e.orig.length > 90 ? e.orig.slice(0, 90) + '…' : e.orig} »`));
    const row = h('div', { class: 'row' });
    e.sugg.slice(0, 4).forEach(s => row.append(h('button', { class: 'btn small', onclick: () => handlers.accept(e, s) }, s === '' ? 'Supprimer' : `Accepter : ${s.length > 40 ? s.slice(0, 40) + '…' : s}`)));
    row.append(h('button', { class: 'btn small sec', onclick: () => handlers.ignore(e) }, 'Ignorer'));
    d.append(row); return d;
  },
  errKey(e) { return e.cat + '|' + e.orig + '|' + e.rule; },

  // ---------------------------------------------------------------- comparaison avant / après
  diffHTML(a, b) {
    const tok = s => s.match(/\s+|[\p{L}\p{M}\d]+(?:['’\-][\p{L}\p{M}\d]+)*|./gsu) || [];
    const A = tok(a), B = tok(b); let i0 = 0; while (i0 < A.length && i0 < B.length && A[i0] === B[i0]) i0++;
    let ea = A.length, eb = B.length; while (ea > i0 && eb > i0 && A[ea - 1] === B[eb - 1]) { ea--; eb--; }
    const a2 = A.slice(i0, ea), b2 = B.slice(i0, eb); let out = esc(A.slice(0, i0).join(''));
    if (a2.length * b2.length > 4e6) out += `<del>${esc(a2.join(''))}</del><ins>${esc(b2.join(''))}</ins>`;
    else {
      const n = a2.length, m = b2.length; const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
      for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = a2[i] === b2[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
      let i = 0, j = 0, del = '', ins = '';
      const flush = () => { if (del) out += `<del>${esc(del)}</del>`; if (ins) out += `<ins>${esc(ins)}</ins>`; del = ins = ''; };
      while (i < n || j < m) {
        if (i < n && j < m && a2[i] === b2[j]) { flush(); out += esc(a2[i]); i++; j++; }
        else if (j < m && (i === n || L[i][j + 1] >= L[i + 1][j])) { ins += b2[j++]; } else { del += a2[i++]; }
      }
      flush();
    }
    return out + esc(A.slice(ea).join(''));
  },

  // ---------------------------------------------------------------- voix
  voices(all) { if (!('speechSynthesis' in window)) return []; const v = speechSynthesis.getVoices(); return all ? v : v.filter(x => /^fr/i.test(x.lang)); },
  // voix choisie dans « Lecture audio » ou « Paramètres » ; sinon une voix française installée sur l'appareil (plutôt qu'une voix en ligne)
  pickVoice() { const all = this.voices(true), fr = all.filter(x => /^fr/i.test(x.lang)); return all.find(x => x.name === this.prefs.voice) || fr.find(x => x.localService) || fr[0] || null; },
  // panneau « Choisir la voix » : toutes les voix que le navigateur propose (sous Windows : celles installées dans Windows, et sous Edge les voix « Natural » en ligne)
  voicePanel() {
    const SAMPLE = 'Bonjour ! Voici ma voix. Je peux lire tes textes à voix haute, doucement ou plus vite.', ui = Object.assign({ other: false, online: false }, Store.get('voice.ui', {}));
    const box = h('div', { class: 'card' }), list = h('div'); const langName = c => { try { return new Intl.DisplayNames(['fr'], { type: 'language' }).of(c.replace('_', '-')); } catch (e) { return c; } };
    const preview = v => { speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(SAMPLE); u.voice = v; u.lang = v.lang; u.rate = this.prefs.ttsRate; speechSynthesis.speak(u); };
    const draw = () => {
      const all = this.voices(true); const rank = v => { const i = ['fr-FR', 'fr-BE', 'fr-CA', 'fr-CH'].indexOf(v.lang.replace('_', '-')); return /^fr/i.test(v.lang) ? (i < 0 ? 4 : i) : 9; };
      const shown = all.filter(v => (ui.other || /^fr/i.test(v.lang)) && (ui.online || v.localService)).sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name, 'fr'));
      const hidden = all.filter(v => (ui.other || /^fr/i.test(v.lang)) && !ui.online && !v.localService).length, cur = this.pickVoice();
      list.replaceChildren(
        !('speechSynthesis' in window) ? h('div', { class: 'notice bad' }, 'La lecture à voix haute n’est pas disponible dans ce navigateur.') : '',
        h('p', { class: 'muted', role: 'status' }, shown.length ? `${shown.length} voix affichée${shown.length > 1 ? 's' : ''}${hidden ? ` · ${hidden} voix en ligne masquée${hidden > 1 ? 's' : ''}` : ''}. Voix utilisée : ` : 'Aucune voix à afficher pour l’instant. ', shown.length ? h('b', null, cur ? cur.name : 'celle du navigateur') : ''),
        ...shown.map(v => { const on = cur && cur.name === v.name; return h('div', { class: 'row', style: 'padding:.4rem 0;border-bottom:1px solid var(--line)' }, h('div', { style: 'flex:1;min-width:12rem' }, h('b', null, v.name), h('div', { class: 'muted' }, langName(v.lang) + ' · ' + (v.localService ? '🔒 sur cet appareil' : '☁️ en ligne : le texte est envoyé au fournisseur de la voix'))),
          h('button', { class: 'btn sec', onclick: () => preview(v), 'aria-label': 'Écouter la voix ' + v.name }, '▶ Écouter'), h('button', { class: 'btn' + (on ? '' : ' sec'), 'aria-pressed': String(!!on), 'aria-label': 'Utiliser la voix ' + v.name, onclick: () => { this.prefs.voice = v.name; this.savePrefs(); draw(); this.toast('Voix choisie : ' + v.name); } }, on ? '✓ Voix choisie' : 'Choisir')); }));
    };
    const ck = (t, key) => h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: ui[key], onchange: ev => { ui[key] = ev.target.checked; Store.set('voice.ui', ui); draw(); } }), t);
    box.append(h('h2', { style: 'margin-top:0' }, '🎙️ Choisir la voix'), h('p', { class: 'muted' }, 'Ces voix viennent de ton navigateur et de ton système : je ne peux pas savoir à l’avance lesquelles tu as. Écoute-les et choisis celle qui te convient.'), h('div', { class: 'row' }, ck('Voix d’autres langues', 'other'), ck('Voix en ligne (le texte quitte l’ordinateur)', 'online')), list,
      h('details', null, h('summary', null, 'Ajouter d’autres voix sous Windows'), h('p', { class: 'muted' }, 'Dans Windows : Paramètres → Heure et langue → Voix (ou Parole) → Ajouter des voix, et choisis le français. Les noms exacts des menus changent selon la version de Windows. Redémarre ensuite le navigateur pour qu’il les voie. Dans Microsoft Edge, des voix « Natural » en ligne peuvent aussi apparaître : elles sont masquées par défaut parce que le texte est alors envoyé à Microsoft pour être lu.')));
    draw(); if ('speechSynthesis' in window) { speechSynthesis.addEventListener('voiceschanged', () => { if (box.isConnected) draw(); }); setTimeout(() => { if (box.isConnected) draw(); }, 600); } return box;
  },
  // bandeau du haut : date, heure à la seconde, citation du jour (proverbes, voir js/citations.js)
  initBar() {
    const bar = $('#infobar'); if (!bar || typeof CITATIONS === 'undefined') return;
    const fd = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), ft = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateEl = h('span', { class: 'ib-date' }), timeEl = h('time', { class: 'ib-time', role: 'timer', 'aria-label': 'Heure' }), q = h('span', { class: 'ib-quote' });
    const minute = () => Math.floor(Date.now() / 60000), N = CITATIONS.length, step = [7, 11, 13, 5, 3, 1].find(k => { let x = k, y = N; while (y) [x, y] = [y, x % y]; return x === 1; }); let shift = 0, lastMin = -1; // une nouvelle citation chaque minute, dans un ordre mélangé
    const quote = () => { const [t, a] = CITATIONS[(minute() * step + shift) % N]; q.replaceChildren('« ' + t + ' »', h('span', { class: 'ib-src' }, ' — ' + a)); };
    const tick = () => { const d = new Date(), ds = fd.format(d); const dd = ds.charAt(0).toUpperCase() + ds.slice(1); if (dateEl.textContent !== dd) dateEl.textContent = dd; const mk = minute(); if (mk !== lastMin) { lastMin = mk; shift = 0; quote(); } timeEl.textContent = ft.format(d); };
    const loop = () => { tick(); setTimeout(loop, 1000 - (Date.now() % 1000) + 8); };
    bar.replaceChildren(h('span', { class: 'ib-when' }, h('span', { 'aria-hidden': 'true' }, '📅 '), dateEl, h('span', { class: 'ib-sep', 'aria-hidden': 'true' }, ' · '), h('span', { 'aria-hidden': 'true' }, '🕘 '), timeEl), q, h('button', { class: 'btn ghost ib-next', title: 'La citation change toute seule chaque minute. Touche pour en voir une autre tout de suite.', 'aria-label': 'Voir une autre citation', onclick: () => { shift++; quote(); } }, '↻'));
    loop(); document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  },
  speak(text, o = {}) {
    if (!('speechSynthesis' in window)) { this.toast("La lecture à voix haute n'est pas disponible dans ce navigateur."); return null; }
    speechSynthesis.cancel(); const u = new SpeechSynthesisUtterance(text); u.lang = 'fr-FR'; u.rate = o.rate || this.prefs.ttsRate;
    const pick = this.pickVoice(); if (pick) { u.voice = pick; u.lang = pick.lang || 'fr-FR'; }
    if (o.onBoundary) u.onboundary = o.onBoundary; u.onend = u.onerror = () => { o.onEnd && o.onEnd(); }; speechSynthesis.speak(u); return u;
  },
  stopSpeak() { if ('speechSynthesis' in window) speechSynthesis.cancel(); },
  listenBtn(getText, label = '🔊 Écouter') { return h('button', { class: 'btn sec', 'data-act': 'listen', onclick: () => { const t = getText(); if (!t || !t.trim()) return this.toast('Rien à lire.'); this.speak(t); } }, label); },
  stopBtn() { return h('button', { class: 'btn sec', onclick: () => this.stopSpeak() }, '⏹ Arrêter'); },
  mic(ta, label = '🎤 Dicter') {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return h('button', { class: 'btn sec', disabled: true, title: "La reconnaissance vocale n'est pas disponible dans ce navigateur." }, label);
    let rec = null;
    const b = h('button', { class: 'btn sec', title: "Attention : dans Chrome et Edge, l'audio est envoyé à un service en ligne du navigateur pour être transcrit (ce n'est pas 100 % local)." }, label);
    b.addEventListener('click', () => {
      if (rec) { rec.stop(); return; }
      rec = new SR(); rec.lang = 'fr-FR'; rec.interimResults = false; rec.continuous = true; b.textContent = '⏹ Arrêter la dictée';
      rec.onresult = ev => { for (let i = ev.resultIndex; i < ev.results.length; i++) if (ev.results[i].isFinal) { ta.value += (ta.value && !/\s$/.test(ta.value) ? ' ' : '') + ev.results[i][0].transcript.trim(); ta.dispatchEvent(new Event('input')); } };
      rec.onend = () => { rec = null; b.textContent = label; }; rec.onerror = e => { this.toast('Dictée : ' + (e.error === 'not-allowed' ? 'micro refusé.' : e.error)); };
      rec.start();
    });
    return b;
  },
  micWarn() { return h('p', { class: 'muted' }, '🎤 La dictée utilise la reconnaissance vocale de ton navigateur. Dans Chrome et Edge, l’audio est transcrit par un service en ligne : ce n’est donc pas 100 % local. Tes textes, eux, ne quittent pas cet ordinateur.'); },

  // ---------------------------------------------------------------- fichiers
  async readFile(file) {
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    if (['txt', 'md', 'csv'].includes(ext)) return { text: await file.text(), kind: ext };
    if (ext === 'docx') return { text: await Zip.docxText(file), kind: 'docx' };
    if (ext === 'odt') return { text: await Zip.odtText(file), kind: 'odt' };
    if (ext === 'pdf') return { text: await this.pdfText(file), kind: 'pdf' };
    if (ext === 'pptx') { const s = await Pptx.load(file); return { text: Pptx.allText(s), kind: 'pptx' }; }
    throw new Error(`Format « .${ext} » non pris en charge ici (acceptés : txt, md, docx, odt, pdf, pptx).`);
  },
  async pdfjs() {
    if (!this.engines.pdfjs) throw new Error(this.engines.hosted ? "PDF.js n'est pas disponible dans cette version en ligne." : "PDF.js n'est pas disponible : lance l'application avec « node server.js ».");
    if (!this._pdfjs) { this._pdfjs = await import(new URL('libs/pdf.min.mjs', document.baseURI).href); this._pdfjs.GlobalWorkerOptions.workerSrc = new URL('libs/pdf.worker.min.mjs', document.baseURI).href; }
    return this._pdfjs;
  },
  async pdfText(file) {
    const lib = await this.pdfjs(); const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise; let out = [];
    for (let p = 1; p <= pdf.numPages; p++) { const c = await (await pdf.getPage(p)).getTextContent(); let line = '', y = null; for (const it of c.items) { const yy = Math.round(it.transform[5]); if (y !== null && Math.abs(yy - y) > 3) { out.push(line.trim()); line = ''; } line += it.str + (it.hasEOL ? '\n' : ' '); y = yy; } out.push(line.trim(), ''); }
    const text = out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
    if (!text) throw new Error("Ce PDF ne contient pas de texte sélectionnable (PDF scanné ?). Utilise l'outil « Images et OCR ».");
    return text;
  }
};
App.reg({ id: 'placeholder', title: '', group: 'none', hidden: true, render() { } });

// ====================================================================================================
// Accueil
App.reg({
  id: 'home', title: 'Accueil', group: 'home', render(el) {
    const hr = new Date().getHours(), hello = hr < 5 || hr >= 18 ? 'Bonsoir' : 'Bonjour';
    el.append(h('h1', null, 'Bienvenue dans Outil Dys'));
    const nDue = typeof Rev !== 'undefined' ? Rev.dueList().length : 0;
    const sections = [
      ['✍️ Écrire, lire, réviser', [['correcteur', '✍️', 'Corriger un texte', 'Les fautes sont colorées selon 15 catégories, avec explications.'], ['revision', '🔁', 'Réviser mes dictées', nDue ? `${nDue} mot${nDue > 1 ? 's' : ''} à réviser maintenant.` : 'Garde les mots ratés en dictée et révise-les en courtes séances.'], ['lecture', '🔊', 'Écouter un texte', 'Lecture à voix haute avec la voix de ton choix, syllabes, règle de lecture.'], ['dico', '📖', 'Dictionnaire', 'Chercher un mot, mots nouveaux 2026-2027, mots qui se ressemblent.'], ['dictee', '🎤', 'Dictée vocale', 'Dicte ton texte ou compare ta dictée à un modèle.']]],
      ['🧭 Me repérer', [['mode-spatial', '🧭', 'Repérage dans l’espace', 'Gauche et droite, trajets pas à pas, quadrillage, points cardinaux.'], ['maths', '🔢', 'Mathématiques visuelles', 'Calculs étape par étape, droite numérique, fractions.'], ['matieres', '📚', 'Mes matières', 'Géographie, histoire, langues, sciences, informatique…']]],
      ['📚 Comprendre mes cours', [['analyse', '📚', 'Comprendre mon cours', 'Importe un cours : passages difficiles, définitions, version simple.'], ['simplif', '🧩', 'Simplifier', 'Phrases plus courtes, mots expliqués, liste, tableau.'], ['fiches', '🗂️', 'Fiches, cartes mentales, quiz', 'À partir de n’importe quel document.'], ['slides', '📊', 'Analyser un PowerPoint', 'Fautes, lisibilité, contrastes, mise en page — et export corrigé.']]],
      ['🌱 Mon espace', [['profil', '🧭', 'Mes besoins et préférences', 'Police, espacements, règle, concentration…'], ['sante', '🩺', 'Trouver un professionnel de santé', 'Carte de France par région, recherche par nom ou téléphone, carnet privé.'], ['defis', '🧩', 'Défis (facultatif)', 'Suites logiques, nombres premiers, estimations.']]]
    ];
    const norm = t => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const tiles = []; const grid = h('div');
    sections.forEach(([title, items]) => { const sec = h('section', { class: 'home-sec' }, h('h2', null, title)), g = h('div', { class: 'grid g3' }); items.forEach(([id, ic, t, d]) => { const a = h('a', { class: 'card tile', href: '#/' + id }, h('span', { class: 'ic', 'aria-hidden': 'true' }, ic), h('span', null, h('b', null, t), h('small', null, d))); tiles.push([a, norm(t + ' ' + d), sec]); g.append(a); }); sec.append(g); grid.append(sec); });
    const none = h('p', { class: 'muted', hidden: true, role: 'status' }, 'Aucun outil ne correspond. Essaie un autre mot (« lire », « mot », « carte »…).');
    const find = h('input', { type: 'search', id: 'homeFind', placeholder: 'ex. corriger, lire, dictionnaire, carte, voix…', style: 'width:100%;max-width:34rem', 'aria-label': 'Chercher un outil', oninput: ev => { const q = norm(ev.target.value.trim()); let n = 0; tiles.forEach(([a, tx]) => { const ok = !q || tx.includes(q); a.hidden = !ok; if (ok) n++; }); grid.querySelectorAll('.home-sec').forEach(sec => { sec.hidden = ![...sec.querySelectorAll('.tile')].some(a => !a.hidden); }); none.hidden = n > 0; } });
    el.append(h('div', { class: 'hero' }, h('h2', { style: 'margin:.1rem 0 .3rem' }, hello + ' ! Que veux-tu faire ?'), h('p', { class: 'muted', style: 'margin:.2rem 0 .6rem' }, 'Un espace pour écrire, lire, comprendre et apprendre à ton rythme. Tout fonctionne sur cet appareil : tes textes ne sont envoyés nulle part.'), h('label', { for: 'homeFind', class: 'sr' }, 'Chercher un outil'), find), none, grid,
      h('div', { class: 'notice ok' }, 'Tout est facultatif. Tu choisis les aides qui te conviennent dans « Mes besoins et préférences ». Aucun diagnostic n’est demandé ni posé.'));
    const e = App.engines; const badge = (ok, y, n) => h('span', { class: 'badge ' + (ok ? 'ok' : 'warn') }, ok ? y : n);
    const box = h('div', { class: 'card secondary' }, h('h2', { style: 'margin-top:0' }, 'État des moteurs (ce qui fonctionne vraiment ici)'));
    const t = h('table', { class: 't' }, h('tr', null, h('th', null, 'Moteur'), h('th', null, 'État'), h('th', null, 'Détail')));
    const rows = [['Correcteur à règles', true, 'Intégré. Fautes fréquentes seulement : il n’a pas de dictionnaire complet.'], ['Lecture à voix haute', e.tts, 'Voix du navigateur / du système.'], ['Dictée vocale', e.stt, 'Navigateur : peut passer par un service en ligne (non 100 % local).'], ['Lecture PDF (PDF.js)', e.pdfjs, e.pdfjs ? 'Module local.' : 'Nécessite « node server.js ».'], ['Lecture/écriture PPTX, ODP, DOCX', e.zip, 'Lecteur ZIP intégré (API du navigateur).'], ['Rapports et fiches PDF (pdf-lib)', e.pdflib, 'Module local.'], ['OCR (images)', e.ocr && e.ocr.available, e.ocr ? (e.ocr.available ? e.ocr.version + ' (français)' : e.ocr.reason) : 'Vérification…']];
    rows.forEach(([n, ok, d]) => t.append(h('tr', null, h('td', null, n), h('td', null, badge(ok, 'Disponible', 'Indisponible')), h('td', null, d))));
    box.append(t, h('p', { class: 'muted' }, 'Non disponibles : import audio et vidéo (aucun moteur de transcription local), Tesseract.js, Mammoth.js, jsPDF (téléchargement impossible dans l’environnement de construction).'));
    el.append(box);
    if (!e.server) setTimeout(() => App.detectEngines().then(() => { const f = $('#homeFind'); if (App.current.id === 'home' && !(f && f.value)) App.refresh(); }), 600);
  }
});

// ====================================================================================================
// Mon profil d'apprentissage
App.reg({
  id: 'profil', title: 'Mes besoins et préférences', group: 'espace', icon: '🧭', render(el) {
    const P = App.profile;
    el.append(h('h1', null, 'Mes besoins et préférences'),
      h('div', { class: 'notice' }, 'Tout est facultatif. Outil Dys ne pose aucun diagnostic et ne cherche pas à savoir si tu es dys, HPI ou autre. Cocher une case active seulement des options de confort que tu peux régler une par une ci-dessous. Une même option ne convient pas à toutes les personnes d’un même profil.'));
    const none = h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: P.none, onchange: ev => { P.none = ev.target.checked; if (P.none) { P.picks = []; P.features = {}; P.custom = false; } App.saveProfile(); App.refresh(); } }), 'Aucun profil renseigné');
    const custom = h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: P.custom, onchange: ev => { P.custom = ev.target.checked; if (P.custom) P.none = false; App.saveProfile(); App.refresh(); } }), 'Profil personnalisé (je choisis moi-même chaque option plus bas)');
    el.append(h('div', { class: 'card' }, none, custom, h('p', { class: 'muted' }, 'Tu peux cocher plusieurs profils à la fois, les décocher ou changer d’avis à tout moment.')));
    PROFILES.forEach(g => {
      el.append(h('h2', null, g.g)); const grid = h('div', { class: 'grid g2' });
      g.items.forEach(([id, label]) => grid.append(h('label', { class: 'chk card', style: 'margin:0' }, h('input', { type: 'checkbox', checked: P.picks.includes(id), onchange: ev => { App.togglePick(id, ev.target.checked); App.refresh(); } }), label)));
      el.append(grid);
    });
    el.append(h('h2', null, 'Adaptations actives'), h('p', { class: 'muted' }, 'Activées par tes cases, ou à ta main. Chaque option se règle librement.'));
    const fl = h('div', { class: 'grid g2' });
    Object.entries(FEATURES).forEach(([k, label]) => fl.append(h('label', { class: 'chk card', style: 'margin:0' }, h('input', { type: 'checkbox', checked: !!P.features[k], onchange: ev => { App.setFeature(k, ev.target.checked); if (k === 'simpleNav') App.buildNav(); if (k === 'focus') document.body.classList.toggle('focus', ev.target.checked); } }), label)));
    el.append(fl, h('div', { class: 'row', style: 'margin-top:1rem' }, h('a', { class: 'btn sec', href: '#/settings' }, 'Régler la police, les couleurs, l’audio…'), h('a', { class: 'btn sec', href: '#/modes' }, 'Voir mes modes d’apprentissage')));
  }
});

// ====================================================================================================
// Paramètres
App.reg({
  id: 'settings', title: 'Paramètres', group: 'params', icon: '⚙️', render(el) {
    const p = App.prefs; el.append(h('h1', null, 'Paramètres'));
    const sel = (key, opts, onch) => h('select', { onchange: ev => { p[key] = isNaN(+ev.target.value) || key === 'font' || key === 'theme' || key === 'simplLevel' || key === 'explainLevel' || key === 'voice' || key === 'lang' ? ev.target.value : +ev.target.value; App.savePrefs(); onch && onch(); } }, opts.map(([v, l]) => h('option', { value: v, selected: String(p[key]) === String(v) }, l)));
    const range = (key, min, max, step, unit) => { const out = h('output', null, p[key] + unit); const i = h('input', { type: 'range', min, max, step, value: p[key], 'aria-label': { size: 'Taille du texte (px)', letterSp: 'Espacement des lettres (em)', wordSp: 'Espacement des mots (em)', lineH: 'Interligne', paraSp: 'Espacement des paragraphes' }[key] || key, style: 'width:100%', oninput: ev => { p[key] = +ev.target.value; out.textContent = p[key] + unit; App.savePrefs(); } }); return h('div', null, i, out); };
    const fontOK = n => { try { const c = document.createElement('canvas').getContext('2d'); const t = 'mmmmmmmmmmlli'; c.font = '40px monospace'; const w0 = c.measureText(t).width; c.font = `40px "${n}",monospace`; return c.measureText(t).width !== w0; } catch { return false; } };
    el.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Accessibilité et police'),
      h('label', null, 'Police'), sel('font', Object.entries(FONTS).map(([k, v]) => [k, v[0]])),
      h('p', { class: 'muted' }, `OpenDyslexic : ${fontOK('OpenDyslexic') ? 'installée ✔' : 'non installée'} · Lexend : ${fontOK('Lexend') ? 'installée ✔' : 'non installée'}. Ces polices ne sont pas fournies avec l’application : installe-les sur l’ordinateur pour les utiliser, sinon une police de secours lisible est employée.`),
      h('label', null, 'Taille du texte (px)'), range('size', 14, 32, 1, ' px'), h('label', null, 'Espacement des lettres (em)'), range('letterSp', 0, 0.2, 0.01, ' em'),
      h('label', null, 'Espacement des mots (em)'), range('wordSp', 0, 0.5, 0.02, ' em'), h('label', null, 'Interligne'), range('lineH', 1.2, 2.4, 0.1, ''), h('label', null, 'Espacement des paragraphes'), range('paraSp', 1, 3, 0.1, ''),
      h('label', null, 'Thème'), sel('theme', [['auto', 'Automatique'], ['light', 'Clair'], ['dark', 'Sombre']]),
      h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: p.showIcons, onchange: ev => { p.showIcons = ev.target.checked; App.savePrefs(); } }), 'Afficher une icône à côté de chaque erreur (la couleur ne doit pas être le seul repère)'),
      h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: p.showCorrect, onchange: ev => { p.showCorrect = ev.target.checked; App.savePrefs(); } }), 'Colorer en bleu les mots corrects'),
      h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: p.showBar !== false, onchange: ev => { p.showBar = ev.target.checked; App.savePrefs(); } }), 'Afficher le bandeau du haut (date, heure à la seconde, citation du jour)'),
      h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: p.softTypo, onchange: ev => { p.softTypo = ev.target.checked; App.savePrefs(); } }), 'Signaler l’espace avant « ! ? ; : » (règle de typographie française)')));
    const cg = h('div', { class: 'grid g2' });
    CATS.forEach(c => cg.append(h('div', { class: 'row' }, h('input', { type: 'color', value: App.color(c.id), 'aria-label': 'Couleur ' + c.nom, onchange: ev => { p.colors[c.id] = ev.target.value; App.savePrefs(); } }), h('span', null, `${c.emoji} ${c.icone} `, h('b', null, c.libelle)))));
    el.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Couleurs des catégories'), cg, h('div', { class: 'row', style: 'margin-top:.6rem' }, h('button', { class: 'btn sec', onclick: () => { p.colors = {}; App.savePrefs(); App.refresh(); } }, 'Remettre les couleurs d’origine'))));
    const voices = App.voices();
    el.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Langue et audio'),
      h('label', null, 'Langue'), sel('lang', [['fr', 'Français (seule langue du correcteur et des cours)']]), h('p', { class: 'muted' }, 'Le correcteur, la simplification et les exercices ne fonctionnent qu’en français. Aucune autre langue n’est proposée tant qu’elle n’est pas réellement prise en charge.'),
      h('label', null, 'Vitesse de lecture à voix haute'), range('ttsRate', 0.5, 1.6, 0.1, '×'), h('label', null, 'Voix'), sel('voice', [['', voices.length ? 'Voix française par défaut' : 'Aucune voix française trouvée']].concat(voices.map(v => [v.name, v.name]))),
      h('label', null, 'Niveau de simplification par défaut'), sel('simplLevel', [['tres', 'Très simple'], ['simple', 'Simple'], ['courant', 'Langage courant']]), h('label', null, 'Niveau d’explication'), sel('explainLevel', [['court', 'Court'], ['detail', 'Détaillé']]),
      h('label', null, 'Durée du minuteur (minutes)'), range('timerMin', 5, 60, 5, ' min'),
      h('div', { class: 'row', style: 'margin-top:.6rem' }, h('button', { class: 'btn sec', onclick: () => App.speak('Bonjour, voici un exemple de lecture à voix haute.') }, '🔊 Tester la voix'))));
    el.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Confidentialité'),
      h('p', null, 'Tes textes, documents et résultats restent sur cet ordinateur (dans le stockage du navigateur). Le serveur local n’écoute que cet ordinateur (127.0.0.1) et n’envoie rien sur Internet.'),
      h('p', null, 'Exception à connaître : la dictée vocale du navigateur (Chrome/Edge) peut envoyer l’audio à un service en ligne.'),
      h('div', { class: 'row' }, h('button', { class: 'btn danger', onclick: () => { if (confirm('Effacer TOUTES les données d’Outil Dys (profil, préférences, documents, statistiques) ?')) { Store.clear(); location.reload(); } } }, 'Effacer toutes mes données'))));
    el.append(h('div', { class: 'row' }, h('button', { class: 'btn danger', onclick: () => { if (confirm('Réinitialiser tes préférences d’affichage, de couleurs et d’audio ? (Ton profil et tes documents sont conservés.)')) { App.resetPrefs(); App.refresh(); App.toast('Préférences réinitialisées.'); } } }, 'Réinitialiser mes préférences')));
  }
});
App.reg({ id: 'prefs', title: 'Mes préférences', group: 'espace', icon: '🎨', render(el) { location.hash = '#/settings'; } });

// ====================================================================================================
// Légende interactive
function legendDialog(counts) {
  const d = h('div', null, h('h3', { style: 'margin-top:0' }, 'Légende des couleurs'), h('p', { class: 'muted' }, 'La couleur ne suffit pas : chaque catégorie a aussi une icône et un nom. Les erreurs qui touchent plusieurs mots ou une phrase entière sont soulignées en pointillés.'));
  const t = h('table', { class: 't' }, h('tr', null, h('th', null, 'Couleur'), h('th', null, 'Icône'), h('th', null, 'Nom'), h('th', null, 'Catégorie'), h('th', null, 'Explication')));
  CATS.forEach(c => t.append(h('tr', null, h('td', null, c.emoji, ' ', h('span', { class: 'sw', style: `background:${App.color(c.id)}` })), h('td', null, h('span', { class: 'tagbox', style: `background:${App.color(c.id)}` }, c.icone)), h('td', null, h('b', null, c.nom), ' — ', c.libelle), h('td', null, c.famille), h('td', null, c.expl))));
  d.append(t); return d;
}
function legendChips(counts, onChange) {
  const wrap = h('div', { class: 'row', role: 'group', 'aria-label': 'Légende interactive : clique pour afficher ou masquer une catégorie' });
  CATS.filter(c => c.id !== 'correct').forEach(c => {
    const n = counts[c.id] || 0;
    const b = h('button', { class: 'chip', 'aria-pressed': String(!App.hidden.has(c.id)), style: `border-color:${App.color(c.id)}`, title: c.expl, onclick: () => { App.hidden.has(c.id) ? App.hidden.delete(c.id) : App.hidden.add(c.id); b.setAttribute('aria-pressed', String(!App.hidden.has(c.id))); onChange(); } }, c.emoji, ' ', c.icone, ' ', h('b', null, c.nom), ' · ', c.libelle, ' ', h('b', null, `(${n})`));
    wrap.append(b);
  });
  return wrap;
}

// ====================================================================================================
// Correcteur intelligent
App.reg({
  id: 'correcteur', title: 'Correcteur intelligent', group: 'outils', icon: '✍️', render(el) {
    el.append(h('h1', null, 'Correcteur intelligent'));
    el.append(h('div', { class: 'notice secondary' }, h('b', null, 'Honnêteté : '), 'ce correcteur fonctionne avec des règles (fautes fréquentes, homophones, accords courants, conjugaison de verbes courants, typographie, ponctuation, style). Il ne connaît pas tous les mots du français : une phrase sans alerte n’est pas forcément parfaite. Relis toujours.'));
    const ta = h('textarea', { id: 'ed', 'aria-label': 'Ton texte', placeholder: 'Écris ou colle ton texte ici…', rows: 8 }); ta.value = App.ws.text;
    const out = h('div', { class: 'marked', 'aria-live': 'polite' }); const chips = h('div'); const stat = h('p', { class: 'muted' }); const listBox = h('div'); const cmp = h('div');
    let res = null, timer = null;
    const visible = () => res.errors.filter(e => !App.hidden.has(e.cat) && !App.ignored.has(App.errKey(e)));
    const analyse = (log) => {
      const t = ta.value; App.setText(t); if (!t.trim()) { out.innerHTML = ''; chips.replaceChildren(); stat.textContent = ''; listBox.replaceChildren(); res = null; return; }
      res = Corrector.analyze(t, { typoSpaces: App.prefs.softTypo }); (App.postAnalyse || []).forEach(f => f(res, t));
      if (log) App.log('texte', App.ws.title, { errors: visible(), count: 'texts' });
      paint();
    };
    const paint = () => {
      if (!res) return; const errs = visible(); const counts = {}; res.errors.filter(e => !App.ignored.has(App.errKey(e))).forEach(e => counts[e.cat] = (counts[e.cat] || 0) + 1);
      out.innerHTML = App.markHTML(ta.value, errs);
      chips.replaceChildren(legendChips(counts, paint));
      const total = res.errors.filter(e => !App.ignored.has(App.errKey(e))).length;
      stat.textContent = `${res.stats.words} mots · ${res.stats.sentences} phrases · ${total} point${total > 1 ? 's' : ''} à regarder`;
      listBox.replaceChildren(); const byCat = {}; errs.forEach(e => (byCat[e.cat] = byCat[e.cat] || []).push(e));
      CATS.forEach(c => { const a = byCat[c.id]; if (!a) return; const d = h('details', { open: App.feat('detailCorr') }, h('summary', null, h('span', { class: 'tagbox', style: `background:${App.color(c.id)}` }, c.icone), ' ', c.libelle, ` (${a.length})`)); a.forEach(e => d.append(h('div', { class: 'card', style: 'margin:.4rem 0' }, App.errCard(e, handlers)))); listBox.append(d); });
    };
    const handlers = {
      accept: (e, s) => { ta.value = ta.value.slice(0, e.start) + s + ta.value.slice(e.end); App.hidePop(); analyse(false); },
      ignore: e => { App.ignored.add(App.errKey(e)); App.hidePop(); paint(); }
    };
    const showSeg = seg => { const ids = seg.dataset.e.split(','); const list = res.errors.filter(e => ids.includes(e.id)); const box = h('div'); list.forEach(e => box.append(h('div', { style: 'margin-bottom:.6rem' }, App.errCard(e, handlers)))); App.showPop(seg, box); };
    out.addEventListener('click', ev => { const s = ev.target.closest('.seg'); if (s) showSeg(s); });
    out.addEventListener('keydown', ev => { if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.classList.contains('seg')) { ev.preventDefault(); showSeg(ev.target); } });
    ta.addEventListener('input', () => { App.setText(ta.value); if (App.prefs.autoAnalyse && ta.value.length < 20000) { clearTimeout(timer); timer = setTimeout(() => analyse(false), 900); } });
    const autoFix = mode => {
      if (!ta.value.trim()) return; const before = ta.value; const r = Corrector.autoCorrect(before, mode);
      if (!r.applied.length) { cmp.replaceChildren(h('div', { class: 'notice ok' }, 'Rien à corriger automatiquement avec les règles actuelles.')); return; }
      cmp.replaceChildren(h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, `Avant / après — ${r.applied.length} correction${r.applied.length > 1 ? 's' : ''}`), h('div', { class: 'marked diff', html: App.diffHTML(before, r.text) }),
        h('div', { class: 'row', style: 'margin-top:.6rem' }, h('button', { class: 'btn', onclick: () => { ta.value = r.text; cmp.replaceChildren(); analyse(false); App.toast('Corrections appliquées.'); } }, '✔ Appliquer ces corrections'), h('button', { class: 'btn sec', onclick: () => cmp.replaceChildren() }, 'Annuler'))));
    };
    const sendSel = h('select', { 'aria-label': 'Envoyer ce texte vers un autre outil', onchange: ev => { if (ev.target.value) { App.setText(ta.value); App.go(ev.target.value); } } }, h('option', { value: '' }, 'Envoyer vers…'), ...[['simplif', 'Simplificateur'], ['lisibilite', 'Lisibilité'], ['lecture', 'Lecture audio'], ['analyse', 'Analyse de cours'], ['fiches', 'Fiches et cartes mentales'], ['rapports', 'Rapport PDF'], ['dictee', 'Dictée et comparaison']].map(([v, l]) => h('option', { value: v }, l)));
    el.append(ta, h('div', { class: 'row', style: 'margin:.5rem 0' },
      h('button', { class: 'btn', 'data-act': 'analyse', onclick: () => analyse(true) }, '🔎 Analyser'),
      h('button', { class: 'btn sec', onclick: () => autoFix('safe') }, '✔ Corriger les fautes certaines'), h('button', { class: 'btn sec', onclick: () => autoFix('style') }, '✨ Corriger + formulation'),
      App.listenBtn(() => ta.value), App.stopBtn(), App.mic(ta), h('button', { class: 'btn sec', onclick: () => App.showPop($('#main'), legendDialog()) }, '🎨 Légende'),
      h('button', { class: 'btn sec', onclick: () => { ta.value = EXEMPLE; analyse(true); } }, 'Exemple'), h('button', { class: 'btn sec', onclick: () => { ta.value = ''; analyse(false); cmp.replaceChildren(); } }, 'Vider'),
      h('button', { class: 'btn sec', onclick: () => App.copy(ta.value).then(() => App.toast('Texte copié.')) }, 'Copier'), sendSel));
    el.append(App.feat('voiceInput') || true ? App.micWarn() : '', stat, chips, cmp, out, h('p', { class: 'muted' }, 'Clique sur un passage coloré : une explication et des corrections à accepter ou ignorer apparaissent.'), listBox);
    if (ta.value.trim()) analyse(false);
  }
});

// ====================================================================================================
// Mes documents
App.reg({
  id: 'docs', title: 'Mes documents', group: 'espace', icon: '📁', render(el) {
    const docs = Store.get('docs', []);
    el.append(h('h1', null, 'Mes documents'), h('p', null, 'Le document en cours est partagé entre tous les outils : ce que tu écris ou importes ici peut être corrigé, simplifié, lu, résumé, transformé en fiche ou en quiz.'));
    const cur = h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Document en cours'));
    const title = h('input', { type: 'text', value: App.ws.title, 'aria-label': 'Titre du document', onchange: ev => { App.ws.title = ev.target.value || 'Sans titre'; App.saveWs(); } });
    const file = h('input', { type: 'file', accept: '.txt,.md,.docx,.odt,.pdf,.pptx', 'aria-label': 'Importer un document' });
    file.addEventListener('change', async () => { const f = file.files[0]; if (!f) return; try { const r = await App.readFile(f); App.setText(r.text, f.name.replace(/\.[^.]+$/, ''), r.kind); App.log('import', f.name, { count: 'docs' }); App.toast(`« ${f.name} » importé (${Corrector.countWords(r.text)} mots).`); App.refresh(); } catch (e) { App.toast('Import impossible : ' + e.message); } });
    cur.append(h('label', null, 'Titre'), title, h('label', null, 'Importer un fichier (txt, md, docx, odt, pdf, pptx)'), file, h('p', { class: 'muted' }, `${Corrector.countWords(App.ws.text)} mots dans le document en cours.`),
      h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { if (!App.ws.text.trim()) return App.toast('Document vide.'); docs.unshift({ id: Date.now(), title: App.ws.title, text: App.ws.text, ts: Date.now() }); Store.set('docs', docs.slice(0, 50)); App.refresh(); } }, '💾 Enregistrer dans mes documents'), h('a', { class: 'btn sec', href: '#/correcteur' }, 'Corriger'), h('a', { class: 'btn sec', href: '#/fiches' }, 'Fiches et quiz')));
    el.append(cur, h('h2', null, 'Documents enregistrés'));
    if (!docs.length) el.append(h('p', { class: 'muted' }, 'Aucun document enregistré.'));
    docs.forEach(d => el.append(h('div', { class: 'card row' }, h('b', null, d.title), h('span', { class: 'muted' }, new Date(d.ts).toLocaleString('fr-FR'), ` · ${Corrector.countWords(d.text)} mots`), h('span', { class: 'grow' }),
      h('button', { class: 'btn small', onclick: () => { App.setText(d.text, d.title); App.go('correcteur'); } }, 'Ouvrir'), h('button', { class: 'btn small sec', onclick: () => App.download(new Blob([d.text], { type: 'text/plain;charset=utf-8' }), d.title + '.txt') }, 'Télécharger'),
      h('button', { class: 'btn small danger', onclick: () => { Store.set('docs', docs.filter(x => x.id !== d.id)); App.refresh(); } }, 'Supprimer'))));
  }
});
