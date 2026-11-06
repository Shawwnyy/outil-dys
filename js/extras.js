// Extras : favoris ⭐, pages récentes, « Reprendre », mot du jour, sauvegarde et restauration des données,
// aide des raccourcis clavier (touche « ? »), mode hors ligne (service worker). Tout reste sur l'appareil.
const Extras = (() => {
  const modOf = id => App.mods.find(m => m.id === id && !m.hidden && m.title);
  const NOTRACK = new Set(['home', 'settings', 'prefs', 'espace']);
  const favs = () => (Store.get('fav', []) || []).filter(modOf);
  const recent = () => (Store.get('recent', []) || []).filter(modOf);
  const label = m => (m.icon ? m.icon + ' ' : '') + m.title;
  const toggleFav = id => { const f = favs(); const i = f.indexOf(id); if (i >= 0) f.splice(i, 1); else f.unshift(id); Store.set('fav', f.slice(0, 24)); return i < 0; };

  // appelé après chaque affichage de page : mémorise la page et ajoute le bouton ☆ à côté du titre
  const afterRoute = (mod, main) => {
    if (!mod || NOTRACK.has(mod.id) || mod.hidden) return;
    const r = (Store.get('recent', []) || []).filter(x => x !== mod.id); r.unshift(mod.id); Store.set('recent', r.slice(0, 12));
    const t = main.querySelector('h1'); if (!t || t.querySelector('.favbtn')) return;
    const paint = b => { const on = favs().includes(mod.id); b.textContent = on ? '⭐ Favori' : '☆ Favori'; b.setAttribute('aria-pressed', String(on)); b.title = on ? 'Retirer des favoris (ils apparaissent sur l’accueil)' : 'Ajouter aux favoris (ils apparaissent sur l’accueil)'; };
    const b = h('button', { class: 'btn ghost small favbtn', type: 'button', 'aria-label': 'Favori : ' + mod.title, onclick: () => { const on = toggleFav(mod.id); paint(b); App.toast(on ? 'Ajouté aux favoris : ' + mod.title : 'Retiré des favoris.'); } });
    paint(b); t.append(' ', b);
  };

  // mot du jour : un mot nouveau (Petit Larousse / Petit Robert 2027), choisi d'après la date — aucune donnée inventée, source affichée
  const dayIndex = () => { const d = new Date(); return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(2026, 0, 1)) / 864e5); };
  const wordOfDay = () => { if (typeof Dico === 'undefined' || !Dico.NEW.length) return null; const n = Dico.NEW.length; const e = Dico.NEW[((dayIndex() % n) + n) % n]; return { w: e[0], ed: e[1], def: e[2], src: Dico.SRC && Dico.SRC[e[3]] }; };
  const wodCard = () => { const x = wordOfDay(); if (!x) return null; const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    return h('div', { class: 'card secondary wod' }, h('h2', { style: 'margin-top:0' }, '📖 Mot du jour'),
      h('p', { style: 'margin:.2rem 0' }, h('b', { style: 'font-size:1.25em' }, x.w), h('span', { class: 'muted' }, ' · mot nouveau, ' + x.ed)), h('p', { style: 'margin:.3rem 0' }, cap(x.def) + '.'),
      h('div', { class: 'row' }, h('button', { class: 'btn sec small', type: 'button', 'aria-label': 'Écouter ' + x.w, onclick: () => App.speak(x.w + '. ' + x.def) }, '🔊 Écouter'), h('button', { class: 'btn sec small', type: 'button', onclick: () => { Store.set('dico.pre', x.w); App.go('dico'); } }, '📖 Voir dans le dictionnaire')),
      x.src ? h('p', { class: 'muted', style: 'font-size:.85em;margin:.4rem 0 0' }, 'Source : ', h('a', { href: x.src[1], target: '_blank', rel: 'noopener noreferrer' }, x.src[0]), ' (le lien s’ouvre seulement si tu cliques).') : null);
  };

  // bloc du haut de l'accueil : reprendre, favoris, récents (le mot du jour est en bas de l'accueil)
  const resumeBtn = () => { const rc = recent(); if (!rc.length) return null; const m = modOf(rc[0]); return h('a', { class: 'btn', href: '#/' + m.id }, '▶ Reprendre : ' + label(m)); };
  const homeTop = () => {
    const box = h('div', { class: 'home-top' }); const rc = recent(), fv = favs();
    if (fv.length) box.append(h('section', { class: 'home-sec' }, h('h2', null, '⭐ Mes favoris'), h('div', { class: 'row' }, fv.map(id => { const m = modOf(id); return h('a', { class: 'btn sec', href: '#/' + id }, label(m)); }))));
    const rr = rc.filter(id => !fv.includes(id)).slice(0, 5); if (rr.length) box.append(h('section', { class: 'home-sec' }, h('h2', null, '🕘 Récemment ouverts'), h('div', { class: 'row' }, rr.map(id => h('a', { class: 'btn ghost', href: '#/' + id }, label(modOf(id)))))));
    return box;
  };

  // ── sauvegarde / restauration ──
  const keys = () => { try { return Object.keys(localStorage).filter(k => /^dys\.[\w.-]+$/.test(k)); } catch { return []; } };
  const size = () => { let n = 0; keys().forEach(k => { try { n += k.length + (localStorage.getItem(k) || '').length; } catch { /* ignoré */ } }); return n; };
  const kb = n => n < 1024 ? n + ' o' : n < 1048576 ? (n / 1024).toFixed(n < 10240 ? 1 : 0).replace('.', ',') + ' Ko' : (n / 1048576).toFixed(1).replace('.', ',') + ' Mo';
  const exportData = () => { const data = {}; keys().forEach(k => { try { data[k] = localStorage.getItem(k); } catch { /* ignoré */ } });
    const d = new Date(), pad = x => String(x).padStart(2, '0'), stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    App.download(new Blob([JSON.stringify({ app: 'outil-dys', version: 2, date: d.toISOString(), data }, null, 1)], { type: 'application/json' }), `outil-dys-sauvegarde-${stamp}.json`); return Object.keys(data).length; };
  // lit et vérifie un fichier de sauvegarde ; renvoie { entries, date } ou lève une erreur lisible
  const parseBackup = txt => { let j; try { j = JSON.parse(txt); } catch { throw new Error('Ce fichier n’est pas une sauvegarde Outil Dys (il est illisible).'); }
    if (!j || j.app !== 'outil-dys' || !j.data || typeof j.data !== 'object' || Array.isArray(j.data)) throw new Error('Ce fichier n’est pas une sauvegarde Outil Dys.');
    const entries = []; let skipped = 0;
    for (const [k, v] of Object.entries(j.data)) { if (!/^dys\.[\w.-]+$/.test(k) || typeof v !== 'string') { skipped++; continue; } try { JSON.parse(v); } catch { skipped++; continue; } entries.push([k, v]); }
    if (!entries.length) throw new Error('Cette sauvegarde ne contient aucune donnée utilisable.'); return { entries, skipped, date: j.date || '' }; };
  const restore = ({ entries }) => { keys().forEach(k => localStorage.removeItem(k)); entries.forEach(([k, v]) => localStorage.setItem(k, v)); };

  // ── hors ligne ──
  const swSupported = () => 'serviceWorker' in navigator && /^https?:$/.test(location.protocol);
  const initSW = () => { if (swSupported()) navigator.serviceWorker.register('sw.js').catch(() => { /* pas de mode hors ligne : l'outil marche quand même */ }); };
  const offlineInfo = async () => { if (!swSupported()) return { ok: false, why: 'Le mode hors ligne n’est pas disponible quand le fichier est ouvert directement (file://). Il marche avec « node server.js » (http://127.0.0.1:8765) ou la version en ligne.' };
    try { const ks = (await caches.keys()).filter(k => k.startsWith('outil-dys-')); let n = 0; for (const k of ks) n += (await (await caches.open(k)).keys()).length; const reg = await navigator.serviceWorker.getRegistration(); return n > 5 && reg ? { ok: true, n } : { ok: false, why: 'Pas encore prêt : recharge la page une fois, puis réessaie.' }; } catch { return { ok: false, why: 'La mémoire hors ligne n’est pas accessible dans ce navigateur.' }; } };

  // ── fenêtre des raccourcis ──
  const SHORT = [['/', 'ou', 'Ctrl + K', 'Chercher un outil ou un mot'], ['?', '', '', 'Afficher cette aide'], ['Alt + R', '', '', 'Lire à voix haute le texte sélectionné'], ['Échap', '', '', 'Arrêter la lecture, fermer une bulle ou une fenêtre'], ['Alt + C', '', '', 'Mode concentration (menu masqué)'], ['Tab', '', '', 'Passer d’un outil à l’autre (une bulle explique chaque outil)'], ['Alt + 1 … 9', '', '', 'Aller à un outil (si « raccourcis » est activé dans Mes besoins)'], ['Ctrl + P', '', '', 'Imprimer la page (menu et boutons masqués)']];
  let dlg = null;
  const help = () => { if (dlg && dlg.open) return; dlg = h('dialog', { class: 'xdlg', 'aria-labelledby': 'xdlgT' }, h('h2', { id: 'xdlgT', style: 'margin-top:0' }, '⌨️ Raccourcis clavier'),
      h('table', { class: 't' }, h('tbody', null, SHORT.map(([a, mid, b, d]) => h('tr', null, h('td', null, h('kbd', null, a), mid ? ' ' + mid + ' ' : '', b ? h('kbd', null, b) : null), h('td', null, d))))),
      h('div', { class: 'row', style: 'margin-top:.8rem' }, h('button', { class: 'btn', type: 'button', onclick: () => dlg.close() }, 'Fermer')));
    dlg.addEventListener('close', () => { dlg.remove(); dlg = null; }); document.body.append(dlg); if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', ''); };

  // ── cartes ajoutées aux Paramètres ──
  const settingsCards = el => {
    const info = h('p', { class: 'muted', 'aria-live': 'polite' }), st = h('p', { role: 'status', 'aria-live': 'polite' });
    const refresh = () => { info.textContent = `Sur cet appareil : ${keys().length} élément(s), environ ${kb(size())} (profil, préférences, documents, notes d’état, dictées à réviser…).`; }; refresh();
    const file = h('input', { type: 'file', accept: '.json,application/json', 'aria-label': 'Choisir un fichier de sauvegarde à restaurer', onchange: async ev => { const f = ev.target.files[0]; ev.target.value = ''; if (!f) return;
      if (f.size > 25 * 1048576) { st.textContent = 'Ce fichier est trop gros pour une sauvegarde Outil Dys.'; return; }
      try { const b = parseBackup(await f.text()); const when = b.date ? ' du ' + new Date(b.date).toLocaleDateString('fr-FR') : '';
        if (!confirm(`Remplacer tes données actuelles par cette sauvegarde${when} (${b.entries.length} élément(s)${b.skipped ? ', ' + b.skipped + ' ignoré(s) car illisibles' : ''}) ?\n\nTes données actuelles seront effacées. Pense à en télécharger une sauvegarde avant si tu hésites.`)) return;
        restore(b); st.textContent = 'Sauvegarde restaurée. La page se recharge…'; setTimeout(() => location.reload(), 700);
      } catch (e) { st.textContent = '✘ ' + e.message; } } });
    el.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, '💾 Mes données : sauvegarde et restauration'), info,
      h('p', null, 'Télécharge un fichier avec tout ce qui est gardé sur cet appareil (utile avant de changer d’ordinateur ou de vider le navigateur). Il reste sur ton ordinateur : rien n’est envoyé sur internet. Il contient tes textes et tes notes : garde-le en lieu sûr.'),
      h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => { const n = exportData(); st.textContent = `Sauvegarde téléchargée (${n} élément(s)).`; } }, '💾 Télécharger une sauvegarde')),
      h('label', null, 'Restaurer depuis une sauvegarde (fichier .json)'), file, st));
    const off = h('p', { class: 'muted', 'aria-live': 'polite' }, 'Vérification…'), clr = h('button', { class: 'btn sec', type: 'button', hidden: true, onclick: async () => { for (const k of await caches.keys()) if (k.startsWith('outil-dys-')) await caches.delete(k); off.textContent = 'Mémoire hors ligne vidée. Elle se reconstruit à la prochaine visite.'; clr.hidden = true; } }, '🗑️ Vider la mémoire hors ligne');
    offlineInfo().then(r => { off.textContent = r.ok ? `✔ Prêt pour le hors ligne : ${r.n} fichiers gardés dans le navigateur. L’outil s’ouvre même sans internet (les définitions en ligne, elles, demandent internet).` : r.why; clr.hidden = !r.ok; });
    el.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, '📴 Utilisation hors ligne'), off, clr));
    el.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Confort'),
      h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: App.prefs.reduceMotion === true, onchange: ev => { App.prefs.reduceMotion = ev.target.checked; App.savePrefs(); } }), 'Réduire les animations et les mouvements'),
      h('div', { class: 'row', style: 'margin-top:.4rem' }, h('button', { class: 'btn sec', type: 'button', onclick: help }, '⌨️ Voir les raccourcis clavier (touche ?)'))));
    el.append(aboutCard());
  };

  const VERSION = 'Outil Dys V2.4 — 6 novembre 2026';
  const aboutCard = () => h('div', { class: 'card secondary' }, h('h2', { style: 'margin-top:0' }, 'ℹ️ À propos'), h('p', null, VERSION + '. Outil local et privé : tes textes restent sur cet appareil.'),
    h('ul', null, h('li', null, 'Les aides proposées sont des adaptations, pas des diagnostics : l’outil ne dit jamais si une personne a un trouble.'), h('li', null, 'Le correcteur fonctionne par règles : il rate des fautes et peut se tromper. Relis toujours.'), h('li', null, 'Les données (santé, mots nouveaux…) viennent de sources publiques datées ; elles peuvent être incomplètes ou changer.'), h('li', null, 'Rien ne part sur internet sans ton clic (définitions en ligne, liens externes).')),
    h('p', { class: 'muted' }, 'Code : ', h('a', { href: 'https://github.com/Shawwnyy/outil-dys', target: '_blank', rel: 'noopener noreferrer' }, 'github.com/Shawwnyy/outil-dys'), ' (le lien s’ouvre seulement si tu cliques).'));
  const init = () => {
    document.addEventListener('keydown', e => { if (e.key !== '?' || e.ctrlKey || e.metaKey || e.altKey) return; const a = document.activeElement; if (a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable)) return; e.preventDefault(); help(); });
    initSW();
  };
  return { init, afterRoute, homeTop, resumeBtn, wodCard, settingsCards, help, favs, recent, toggleFav, wordOfDay, exportData, parseBackup, restore, keys, offlineInfo };
})();
