// Recherche dans l'en-tête : un seul champ pour trouver un OUTIL ou un MOT (touche « / » ou Ctrl+K pour y aller).
// Mots : d'abord ce qui est déjà dans l'outil (mots nouveaux 2026-2027, mots qui se ressemblent, mots des proverbes, mes mots à réviser) ;
// pour TOUS les autres mots, le Wiktionnaire en ligne — seulement si la personne clique (ou a coché l'option dans le dictionnaire) : le mot est alors envoyé à fr.wiktionary.org.
const Recherche = (() => {
  const nrm = s => String(s || '').normalize('NFD').replace(/\p{M}/gu, '').replace(/’/g, "'").toLowerCase().trim();
  const online = () => Store.get('dico.online', false) === true;

  const init = () => {
    const top = document.querySelector('#top'); if (!top || document.querySelector('#gsearch')) return;
    const input = h('input', { id: 'gsq', type: 'search', placeholder: 'Chercher un mot ou un outil', 'aria-label': 'Chercher un mot ou un outil (raccourci : touche /)', autocomplete: 'off', spellcheck: 'false', enterkeyhint: 'search' });
    const res = h('div', { id: 'gsres', class: 'gs-res', hidden: true, role: 'region', 'aria-label': 'Résultats de la recherche' }), status = h('p', { class: 'sr', role: 'status', 'aria-live': 'polite' });
    const form = h('form', { id: 'gsearch', class: 'gs', role: 'search', onsubmit: ev => { ev.preventDefault(); enter(); } }, h('span', { class: 'gs-ico', 'aria-hidden': 'true' }, '🔎'), input, res, status);
    const brand = document.querySelector('#brand'); brand.after(form);
    let tk = 0, timer = 0, firstLink = null, last = '';
    const close = () => { res.hidden = true; res.replaceChildren(); };
    const openDico = w => { Store.set('dico.pre', w); close(); if (location.hash === '#/dico') location.reload(); else App.go('dico'); };
    const enter = () => { const w = input.value.trim(); if (!w) return; if (firstLink) { firstLink.click(); return; } openDico(w); };

    const localWords = q => {
      const out = [], seen = new Set(), add = (w, def, tag) => { const k = nrm(w) + '|' + tag; if (seen.has(k) || out.length >= 8) return; seen.add(k); out.push({ w, def, tag }); };
      if (typeof Dico !== 'undefined') {
        Dico.NEW.forEach(x => { if (nrm(x[0]).includes(q)) add(x[0], x[2], 'mot nouveau 2026-2027'); });
        Dico.SIM.forEach(g => { if (nrm(g[0]).includes(q) || g[1].some(m => nrm(m[0]) === q)) add(g[0], g[1].map(m => m[0] + ' : ' + m[1]).join(' · '), 'mots qui se ressemblent'); });
      }
      if (typeof Bandeau !== 'undefined') Object.values(Bandeau.MOTS).forEach(m => { if (nrm(m[0]).includes(q)) add(m[0], m[1], 'mot des citations'); });
      if (typeof Rev !== 'undefined' && Rev.D && Rev.D.words) Object.values(Rev.D.words).forEach(x => { if (x.w && nrm(x.w).includes(q)) add(x.w, 'Dans mes mots à réviser.', 'mes mots'); });
      return out;
    };
    const wordRow = r => h('div', { class: 'gs-w' }, h('div', null, h('b', null, r.w), h('span', { class: 'muted' }, ' · ' + r.tag)), h('div', null, r.def), h('button', { class: 'btn ghost small', type: 'button', 'aria-label': 'Écouter ' + r.w, onclick: () => App.speak(r.w) }, '🔊'));

    const run = async () => {
      const raw = input.value.trim(); const q = nrm(raw); last = raw; const my = ++tk; firstLink = null;
      if (q.length < 1) { close(); status.textContent = ''; return; }
      const mods = App.mods.filter(m => !m.hidden && m.title && (nrm(m.title).includes(q) || nrm(m.keywords || '').includes(q))).slice(0, 6);
      const words = localWords(q), box = h('div');
      if (mods.length) { box.append(h('h3', { class: 'gs-h' }, '🧰 Outils'), h('ul', { class: 'gs-l' }, mods.map(m => { const a = h('a', { href: '#/' + m.id, onclick: () => { close(); input.value = ''; } }, (m.icon || '▫️') + ' ' + m.title); if (!firstLink) firstLink = a; return h('li', null, a); }))); }
      if (words.length) box.append(h('h3', { class: 'gs-h' }, '📖 Mots (déjà dans l’outil)'), ...words.map(wordRow));
      // tous les autres mots : le dictionnaire (Wiktionnaire en ligne) — un clic, ou automatique si l'option est cochée
      const word = /^[\p{L}\p{M}'’-]{2,40}$/u.test(raw) ? raw : '', dic = h('div', { class: 'gs-d' });
      if (word) {
        const online1 = async () => { dic.replaceChildren(h('p', { class: 'muted' }, 'Recherche dans le Wiktionnaire…')); try { let d = await Dico.define(word); if (d.missing && word !== word.toLowerCase()) d = await Dico.define(word.toLowerCase()); if (my !== tk) return;
            const sec = d.sections && d.sections[0]; dic.replaceChildren(sec ? h('div', { class: 'gs-w' }, h('div', null, h('b', null, d.title), h('span', { class: 'muted' }, ' · ' + sec.type + ' · Wiktionnaire')), h('ol', null, sec.defs.slice(0, 3).map(x => h('li', null, x))), h('button', { class: 'btn ghost small', type: 'button', 'aria-label': 'Écouter ' + d.title, onclick: () => App.speak(d.title) }, '🔊')) : h('p', { class: 'muted' }, 'Aucune définition trouvée pour « ' + word + ' » dans le Wiktionnaire (vérifie l’orthographe ; un mot très récent ou très rare peut manquer).')); } catch (e) { if (my === tk) dic.replaceChildren(h('p', { class: 'muted' }, 'La recherche en ligne n’a pas abouti (pas de connexion, ou accès bloqué).')); } };
        if (online()) { setTimeout(() => { if (my === tk) online1(); }, 300); dic.append(h('p', { class: 'muted' }, 'Recherche en ligne activée…')); }
        else dic.append(h('button', { class: 'btn', type: 'button', onclick: online1 }, '🌐 Définition de « ' + word + ' » en ligne'), h('p', { class: 'muted' }, 'Rien n’est envoyé sur internet tant que tu ne cliques pas : le mot part alors à fr.wiktionary.org.'));
      }
      const all = h('p', null, h('a', { href: '#/dico', class: 'btn sec', onclick: ev => { ev.preventDefault(); openDico(raw); } }, '📖 Ouvrir le dictionnaire' + (word ? ' pour « ' + word + ' »' : '')));
      if (!mods.length && !words.length) box.append(h('p', { class: 'muted' }, 'Rien dans l’outil pour « ' + raw + ' ».'));
      box.append(word ? dic : '', all); res.replaceChildren(box); res.hidden = false;
      status.textContent = (mods.length + words.length) + ' résultat(s) dans l’outil.';
    };
    input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 140); });
    input.addEventListener('focus', () => { if (input.value.trim()) run(); });
    form.addEventListener('keydown', ev => {
      if (ev.key === 'Escape') { if (!res.hidden) { close(); ev.stopPropagation(); } else input.blur(); return; }
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') { const els = [input, ...res.querySelectorAll('a,button')], i = els.indexOf(document.activeElement); const n = els[Math.max(0, Math.min(els.length - 1, i + (ev.key === 'ArrowDown' ? 1 : -1)))]; if (n) { n.focus(); ev.preventDefault(); } }
    });
    document.addEventListener('click', ev => { const path = ev.composedPath ? ev.composedPath() : []; if (!path.includes(form) && !form.contains(ev.target)) close(); }); // composedPath : le bouton cliqué a pu être retiré de la page avant ce test
    document.addEventListener('keydown', ev => { const a = document.activeElement, typing = a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable); if ((ev.key === '/' && !typing && !ev.ctrlKey && !ev.metaKey && !ev.altKey) || ((ev.ctrlKey || ev.metaKey) && ev.key.toLowerCase() === 'k')) { ev.preventDefault(); input.focus(); input.select(); } });
  };
  return { init };
})();
