// « Panneau » de droite (qu'on peut fermer ou rouvrir) + page « S’entraîner : vue d’ensemble ».
// Il utilise la place libre à droite de la page et résume, sans rien inventer, ce qui est gardé sur cet appareil :
// statistiques de l'application, cartes et dictées à réviser, prochaine date, emploi du temps (maintenant / ensuite),
// mot du jour, favoris, pages récentes et raccourcis. Aucune donnée ne quitte l'appareil.
const Cote = (() => {
  const modOf = id => App.mods.find(m => m.id === id && !m.hidden && m.title);
  const plural = (n, s, p) => n + ' ' + (n > 1 ? (p || s + 's') : s);
  const safe = (f, d) => { try { const v = f(); return v === undefined ? d : v; } catch (e) { return d; } };
  const lab = m => (m.icon ? m.icon + ' ' : '') + m.title;
  const rem = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 18;
  const entrainIds = () => App.mods.filter(m => m.group === 'entrainer' && m.id !== 'entrainer' && !m.hidden).map(m => m.id);

  // ── données lues (jamais modifiées ici) ──
  const memoInfo = () => safe(() => { const D = Memo.load(); let due = 0, total = 0; D.decks.forEach(d => { const c = Memo.counts(d); due += c.due; total += c.total; }); return { due, total, decks: D.decks.length }; }, { due: 0, total: 0, decks: 0 });
  const revInfo = () => safe(() => ({ due: Rev.dueList().length, total: Object.keys(Rev.D.words).length }), { due: 0, total: 0 });

  // ── « à faire maintenant » : liste de lignes {ic, t, s, href, st} (st : 'todo' = à faire, 'done' = à jour) ──
  const todo = () => {
    const rows = []; const m = memoInfo(), r = revInfo();
    if (!m.total) rows.push({ ic: '🃏', t: 'Cartes mémoire', s: 'Aucune carte pour l’instant : crée les tiennes ou charge un paquet d’exemple.', href: '#/memo' });
    else if (m.due) rows.push({ ic: '🃏', t: plural(m.due, 'carte') + ' à réviser', s: 'sur ' + plural(m.total, 'carte') + ' au total', href: '#/memo', st: 'todo' });
    else rows.push({ ic: '🃏', t: '✔ Cartes à jour', s: 'Rien à réviser maintenant (' + plural(m.total, 'carte') + ').', href: '#/memo', st: 'done' });
    if (r.total) rows.push(r.due ? { ic: '🔁', t: plural(r.due, 'mot') + ' de dictée à réviser', s: 'sur ' + plural(r.total, 'mot') + ' gardés', href: '#/revision', st: 'todo' } : { ic: '🔁', t: '✔ Mots de dictée à jour', s: 'Rien à réviser maintenant.', href: '#/revision', st: 'done' });
    const ev = safe(() => Orga.upcoming(), []);
    if (ev.length) { const e = ev[0], n = Orga.daysTo(e.date); const d = Orga.parseDate(e.date); rows.push({ ic: '⏳', t: e.title, s: Orga.label(n) + (d ? ' · ' + d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : ''), href: '#/orga', st: n <= 3 ? 'todo' : null }); }
    else rows.push({ ic: '⏳', t: 'Aucune date notée', s: 'Note un contrôle ou un exposé : tu verras le compte à rebours ici.', href: '#/orga' });
    const so = safe(() => Orga.soon(), null);
    if (so) {
      if (so.empty) rows.push({ ic: '🗓️', t: 'Emploi du temps vide', s: 'Remplis-le : tu verras ici ce qui est maintenant et ensuite.', href: '#/orga' });
      else if (so.off) rows.push({ ic: '🗓️', t: 'Emploi du temps', s: 'Aujourd’hui n’est pas dans ton tableau (active le week-end pour le voir).', href: '#/orga' });
      else rows.push({ ic: '🗓️', t: 'Maintenant (' + so.hr + ' h) : ' + (so.cur || 'rien de noté'), s: so.nxt ? 'Ensuite à ' + so.nxt[0] + ' h : ' + so.nxt[1] : 'Rien d’autre de noté aujourd’hui.', href: '#/orga' });
    }
    return rows;
  };
  const rowEl = r => h('a', { class: 'cote-row' + (r.st ? ' ' + r.st : ''), href: r.href }, h('span', { class: 'ic', 'aria-hidden': 'true' }, r.ic), h('span', null, h('b', null, r.t), r.s ? h('small', null, r.s) : null));

  // ── mes chiffres (compteurs de l'application, depuis le début sur cet appareil) ──
  const statsEl = () => {
    const s = App.stats || {}, c = s.counts || {}, t = s.timeSec || {}; const today = (s.daily || {})[new Date().toISOString().slice(0, 10)] || {};
    const tile = (v, l) => h('div', { class: 'cote-stat' }, h('b', null, String(v || 0)), h('span', null, l));
    return h('div', null, h('div', { class: 'cote-stats' }, tile(c.texts, 'textes analysés'), tile(c.exercises, 'exercices faits'), tile(c.dictations, 'dictées'), tile(Math.round((t.learn || 0) / 60), 'min d’apprentissage')),
      h('p', { class: 'muted cote-note' }, today.analyses ? `Aujourd’hui : ${plural(today.analyses, 'analyse')}. ` : '', 'Compté depuis le début sur cet appareil. ', h('a', { href: '#/prog' }, 'Voir ma progression')));
  };

  const wodEl = () => { const x = safe(() => Extras.wordOfDay(), null); if (!x) return null; const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    return h('div', { class: 'cote-wod' }, h('b', { style: 'font-size:1.15em' }, x.w), h('span', { class: 'muted' }, ' · mot nouveau, ' + x.ed), h('p', { style: 'margin:.25rem 0' }, cap(x.def) + '.'),
      h('div', { class: 'row', style: 'gap:.4rem' }, h('button', { class: 'btn sec small', type: 'button', 'aria-label': 'Écouter ' + x.w, onclick: () => App.speak(x.w + '. ' + x.def) }, '🔊'), h('a', { class: 'btn sec small', href: '#/dico', onclick: () => Store.set('dico.pre', x.w) }, '📖 Dictionnaire')));
  };

  const chips = ids => { const l = ids.map(modOf).filter(Boolean); return l.length ? h('div', { class: 'cote-chips' }, l.map(m => h('a', { class: 'cote-chip', href: '#/' + m.id }, lab(m)))) : null; };

  // ── contenu complet du panneau ──
  const sec = (title, ...kids) => h('section', { class: 'cote-sec' }, h('h3', null, title), ...kids);
  const body = () => {
    const fv = safe(() => Extras.favs(), []), rc = safe(() => Extras.recent(), []).filter(id => !fv.includes(id)).slice(0, 5);
    const w = wodEl();
    return [
      sec('⏰ À faire maintenant', ...todo().map(rowEl)),
      sec('🧠 S’entraîner', chips(['entrainer', ...entrainIds()])),
      sec('📊 Mes chiffres', statsEl()),
      w ? sec('📖 Mot du jour', w) : null,
      fv.length ? sec('⭐ Favoris', chips(fv.slice(0, 8))) : null,
      rc.length ? sec('🕘 Récemment ouverts', chips(rc)) : null
    ];
  };

  // ── ouverture / fermeture ──
  let aside, bodyEl, btn, dock = null, timer = 0;
  const isOpen = () => document.body.classList.contains('aside-on');
  const paint = force => { if (!aside || !isOpen()) return; if (!force && aside.contains(document.activeElement)) return; const y = aside.scrollTop; bodyEl.replaceChildren(...body().filter(Boolean)); aside.scrollTop = y; };
  const later = () => { clearTimeout(timer); timer = setTimeout(() => paint(false), 500); };
  const stored = () => Store.get('aside', null);
  const want = () => { const s = stored(); return s ? s === 'open' : innerWidth >= rem() * 80; };
  const setOpen = (open, user) => {
    document.body.classList.toggle('aside-on', open); aside.hidden = !open; btn.setAttribute('aria-expanded', String(open));
    btn.title = open ? 'Fermer le panneau de droite (Alt+P)' : 'Ouvrir le panneau de droite : à faire, chiffres, mot du jour… (Alt+P)';
    if (user && dock) Store.set('aside', open ? 'open' : 'closed');
    if (open) paint(true);
  };
  // « dock » : assez de place pour afficher le panneau À CÔTÉ de la page ; sinon il glisse par-dessus (tiroir) et se referme tout seul
  const layout = () => {
    const top = $('#top'); if (top) document.body.classList.toggle('top-free', top.offsetHeight > innerHeight * 0.3); // en-tête trop haut pour l'écran : il défile avec la page au lieu de la manger
    const sticky = !!top && getComputedStyle(top).position === 'sticky';
    document.documentElement.style.setProperty('--top-h', sticky ? top.offsetHeight + 'px' : '0px');
    const d = innerWidth >= rem() * 72; document.body.classList.toggle('aside-dock', d);
    if (d !== dock) { dock = d; setOpen(d ? want() : false, false); }
  };
  const toggle = user => { const open = !isOpen(); setOpen(open, user); if (open && !dock) { const c = $('#asideClose'); if (c) c.focus(); } else if (!open) { const a = document.activeElement; if (a && aside.contains(a)) btn.focus(); } };

  const init = () => {
    aside = $('#aside'); btn = $('#asideBtn'); if (!aside || !btn) return;
    bodyEl = h('div', { id: 'asideBody' });
    aside.append(h('div', { class: 'cote-head' }, h('h2', { id: 'asideT' }, 'Mon panneau'), h('button', { id: 'asideClose', class: 'btn ghost small', type: 'button', 'aria-label': 'Fermer le panneau de droite', onclick: () => toggle(true) }, '✕ Fermer')), bodyEl,
      h('p', { class: 'muted cote-note' }, 'Ce panneau ne montre que ce qui est gardé sur cet appareil. Tu peux le fermer et le rouvrir avec le bouton 📊 en haut (ou Alt+P).'));
    btn.addEventListener('click', () => toggle(true));
    aside.addEventListener('click', ev => { if (!dock && ev.target.closest && ev.target.closest('a[href^="#/"]')) setOpen(false, false); });
    document.addEventListener('keydown', ev => {
      if (ev.altKey && !ev.ctrlKey && !ev.metaKey && ev.key.toLowerCase() === 'p') { ev.preventDefault(); toggle(true); return; }
      if (ev.key === 'Escape' && isOpen() && !dock && aside.contains(document.activeElement)) { setOpen(false, false); btn.focus(); }
    });
    window.addEventListener('resize', () => layout());
    window.addEventListener('hashchange', () => setTimeout(() => paint(true), 60));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) paint(false); });
    ['aMinus', 'aPlus'].forEach(id => { const b = document.getElementById(id); if (b) b.addEventListener('click', () => setTimeout(layout, 80)); });
    const prev = Store.onSet; Store.onSet = k => { if (prev) prev(k); if (/^(stats|memo|rev|orga|fav|recent|prefs)/.test(k)) { if (k.startsWith('prefs')) setTimeout(layout, 50); later(); } };
    if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => layout()).observe($('#top'));
    layout();
  };

  // ── page « S’entraîner : vue d’ensemble » ──
  const extraIds = ['revision', 'dactylo', 'dictee-orale', 'exercices', 'jeux', 'defis'];
  const hub = el => {
    el.append(h('h1', null, '🧠 S’entraîner'), h('p', { class: 'muted' }, 'Des outils pour t’entraîner un peu chaque jour, à ton rythme. Rien n’est noté et rien ne part sur internet : c’est pour toi.'));
    el.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, '⏰ À faire maintenant'), h('div', { class: 'cote-hubrows' }, todo().map(rowEl))));
    const m = memoInfo(); const tile = (id, extra) => { const x = modOf(id); if (!x) return null; const d = (typeof Survol !== 'undefined' && Survol.DESC && Survol.DESC[id]) || ''; return h('a', { class: 'card tile', href: '#/' + id }, h('span', { class: 'ic', 'aria-hidden': 'true' }, x.icon || '•'), h('span', null, h('b', null, x.title), h('small', null, extra ? extra + ' ' : '', d))); };
    el.append(h('section', { class: 'home-sec' }, h('h2', null, 'Mes outils d’entraînement'), h('div', { class: 'grid g3' }, entrainIds().map(id => tile(id, id === 'memo' && m.due ? '(' + plural(m.due, 'carte') + ' à réviser)' : '')))));
    const others = extraIds.filter(modOf); if (others.length) el.append(h('section', { class: 'home-sec' }, h('h2', null, 'Autres façons de s’entraîner'), h('div', { class: 'grid g3' }, others.map(id => tile(id)))));
    el.append(h('div', { class: 'notice' }, 'Les cartes « à réviser » reviennent de plus en plus tard quand tu les réussis : c’est la méthode de Leitner, une méthode de révision connue. Ce n’est pas une garantie de réussite : va à ton rythme.'));
  };
  App.reg({ id: 'entrainer', title: 'S’entraîner : vue d’ensemble', group: 'entrainer', icon: '🧠', learn: true, render: hub });
  return { init, todo, toggle, isOpen, layout, paint };
})();
