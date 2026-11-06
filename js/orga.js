// Organisation : emploi du temps de la semaine, compte à rebours (contrôles, examens, sorties) et check-list avant de rendre un devoir.
// Tout est écrit par la personne et reste sur l'appareil ; aucune donnée n'est inventée ni envoyée.
const Orga = (() => {
  const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
  const hue = t => { let x = 0; for (const c of noAccent(t)) x = (x * 31 + c.charCodeAt(0)) % 360; return x; };
  const noAccent = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
  const todayMid = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), d.getDate()); };
  const parseDate = s => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || ''); if (!m) return null; const d = new Date(+m[1], +m[2] - 1, +m[3]); return isNaN(d) ? null : d; };
  const daysTo = s => { const d = parseDate(s); return d ? Math.round((d - todayMid()) / 86400000) : null; };
  const label = n => n === 0 ? 'Aujourd’hui !' : n === 1 ? 'Demain' : n > 1 ? `J-${n} · dans ${n} jours${n >= 14 ? ' (environ ' + Math.round(n / 7) + ' semaines)' : ''}` : n === -1 ? 'Hier' : `Passé depuis ${-n} jours`;
  const fmtD = s => { const d = parseDate(s); return d ? d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : s; };

  function edt(box) {
    const E = Object.assign({ from: 8, to: 17, we: false, cells: {} }, Store.get('orga.edt', {})); E.cells = E.cells || {}; const save = () => Store.set('orga.edt', E);
    const area = h('div'); const now = new Date(); const jNow = (now.getDay() + 6) % 7, hNow = now.getHours();
    const draw = () => {
      area.replaceChildren(); const days = E.we ? 7 : 5; const hours = []; for (let x = E.from; x <= E.to; x++) hours.push(x);
      const nowTxt = (() => { const cur = E.cells[jNow + '-' + hNow]; let nxt = null; for (let x = hNow + 1; x <= E.to; x++) if (E.cells[jNow + '-' + x]) { nxt = [x, E.cells[jNow + '-' + x]]; break; } if (jNow >= days) return 'Aujourd’hui, ce n’est pas affiché dans le tableau (active le week-end pour le voir).'; return (cur ? `Maintenant (${hNow} h) : ${cur}. ` : `Maintenant (${hNow} h) : rien de noté. `) + (nxt ? `Ensuite (${nxt[0]} h) : ${nxt[1]}.` : 'Plus rien de prévu aujourd’hui.'); })();
      const tb = h('table', { class: 't edt', style: 'width:100%;table-layout:fixed' }, h('tr', null, h('th', { style: 'width:3.6rem' }, ''), JOURS.slice(0, days).map((j, i) => h('th', { style: i === jNow ? 'background:var(--accent);color:var(--accent-ink,#fff)' : '' }, j))));
      hours.forEach(x => tb.append(h('tr', null, h('th', { style: x === hNow ? 'background:var(--accent);color:var(--accent-ink,#fff)' : '' }, x + ' h'), JOURS.slice(0, days).map((j, i) => { const key = i + '-' + x, v = E.cells[key] || ''; const inp = h('input', { type: 'text', value: v, maxlength: 40, 'aria-label': `${j} ${x} h`, style: 'width:100%;min-width:0;border:0;background:transparent;color:inherit;font-size:.95rem;padding:.25rem', onchange: ev => { const t = ev.target.value.trim(); if (t) E.cells[key] = t; else delete E.cells[key]; save(); draw(); } }); return h('td', { style: `padding:0;${v ? `background:hsl(${hue(v)} 70% 88%);color:#1a1a1a` : ''}${i === jNow ? ';outline:2px solid var(--accent);outline-offset:-2px' : ''}` }, inp); }))));
      area.append(h('div', { class: 'notice', role: 'status' }, '🕘 ' + nowTxt), h('div', { style: 'overflow-x:auto' }, tb));
    };
    const sel = (id, lab, val, from, to, on) => h('span', { class: 'row', style: 'align-items:center;margin:0' }, h('label', { for: id, style: 'margin:0' }, lab), h('select', { id, onchange: ev => on(+ev.target.value) }, Array.from({ length: to - from + 1 }, (_, i) => from + i).map(v => h('option', { value: v, selected: v === val }, v + ' h'))));
    box.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Mon emploi du temps'), h('p', { class: 'muted' }, 'Écris dans une case (maths, sport, piano…). Les cases qui ont le même texte ont la même couleur. Aujourd’hui est entouré.'), h('div', { class: 'row', style: 'align-items:center' }, sel('edF', 'De', E.from, 5, 12, v => { E.from = Math.min(v, E.to); save(); draw(); }), sel('edT', 'à', E.to, 12, 22, v => { E.to = Math.max(v, E.from); save(); draw(); }), h('label', { class: 'chk', style: 'margin:0' }, h('input', { type: 'checkbox', checked: E.we, onchange: ev => { E.we = ev.target.checked; save(); draw(); } }), 'Afficher le week-end'), h('button', { class: 'btn sec small', onclick: () => window.print() }, '🖨 Imprimer'), h('button', { class: 'btn ghost small', onclick: () => { if (Object.keys(E.cells).length && !window.__edtConfirm) { window.__edtConfirm = 1; App.toast('Touche encore une fois « Tout effacer » pour confirmer.'); setTimeout(() => { window.__edtConfirm = 0; }, 4000); return; } E.cells = {}; save(); draw(); window.__edtConfirm = 0; } }, 'Tout effacer')), area));
    draw();
  }

  function countdown(box) {
    const L = Store.get('orga.events', []); const save = () => Store.set('orga.events', L); const area = h('div');
    const draw = () => {
      area.replaceChildren(); L.sort((a, b) => a.date.localeCompare(b.date));
      if (!L.length) { area.append(h('p', { class: 'muted' }, 'Aucune date pour l’instant. Ajoute un contrôle, un exposé, une sortie…')); return; }
      const up = L.filter(e => daysTo(e.date) >= 0), past = L.filter(e => daysTo(e.date) < 0);
      const row = e => { const n = daysTo(e.date); const plan = h('p', { class: 'muted', style: 'margin:.2rem 0' }); const upd = () => { const k = parseInt(e.n, 10); if (!(k > 0) || n < 0) { plan.textContent = ''; return; } if (n === 0) plan.textContent = 'C’est aujourd’hui : respire, tu as déjà fait ce que tu pouvais.'; else if (n === 1) plan.textContent = `C’est demain : relis tes ${k} leçon(s) rapidement et repose-toi.`; else { const d = n - 1; plan.textContent = k >= d ? `Il te reste ${d} jour(s) de travail (le dernier jour sert à tout relire) : environ ${Math.ceil(k / d)} leçon(s) par jour.` : `Il te reste ${d} jour(s) de travail : une leçon tous les ${Math.floor(d / k)} jour(s) suffit, avec le dernier jour pour tout relire.`; } };
        const nIn = h('input', { type: 'number', min: 1, max: 99, value: e.n || '', 'aria-label': 'Nombre de leçons à réviser pour ' + e.title, style: 'width:5rem', onchange: ev => { e.n = ev.target.value; save(); upd(); } });
        upd(); return h('div', { class: 'card', style: n < 0 ? 'opacity:.7' : '' }, h('div', { class: 'row', style: 'align-items:center;justify-content:space-between' }, h('div', null, h('b', { style: 'font-size:1.15rem' }, e.title), h('div', { class: 'muted' }, fmtD(e.date))), h('div', { style: 'text-align:right' }, h('span', { class: 'badge ' + (n < 0 ? '' : n <= 3 ? 'warn' : 'ok'), style: 'font-size:1.05rem' }, label(n)), ' ', h('button', { class: 'btn ghost small', 'aria-label': 'Supprimer ' + e.title, onclick: () => { L.splice(L.indexOf(e), 1); save(); draw(); } }, '🗑'))), n >= 0 ? h('div', { class: 'row', style: 'align-items:center;margin-top:.3rem' }, h('label', { style: 'margin:0' }, 'Nombre de leçons à réviser'), nIn) : null, plan); };
      area.append(...up.map(row)); if (past.length) area.append(h('details', null, h('summary', null, `Dates passées (${past.length})`), ...past.map(row)));
    };
    const t = h('input', { type: 'text', placeholder: 'ex. Contrôle de maths', 'aria-label': 'Titre', maxlength: 60, style: 'max-width:20rem' }), d = h('input', { type: 'date', 'aria-label': 'Date' });
    const addIt = () => { if (!t.value.trim() || !parseDate(d.value)) { App.toast('Écris un titre et choisis une date.'); return; } L.push({ id: Date.now(), title: t.value.trim(), date: d.value }); save(); t.value = ''; draw(); };
    t.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); addIt(); } });
    box.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Compte à rebours'), h('p', { class: 'muted' }, 'Pour voir combien de jours il reste avant un contrôle, un exposé ou une sortie, et répartir les révisions.'), h('div', { class: 'row', style: 'align-items:center' }, t, d, h('button', { class: 'btn', onclick: addIt }, '➕ Ajouter'))), area); draw();
  }

  const CHECK = [
    ['Comprendre', ['J’ai relu la consigne et je sais ce qu’on me demande.', 'J’ai répondu à toutes les questions (ou à tous les points demandés).']],
    ['Le sens', ['Mon texte a un début, un milieu et une fin.', 'Chaque phrase se comprend quand je la lis seul(e).', 'J’ai enlevé les répétitions (« et puis… et puis… »).']],
    ['Les phrases', ['Chaque phrase commence par une majuscule et finit par un point (ou ? !).', 'J’ai trouvé le verbe de chaque phrase et son sujet.']],
    ['L’orthographe', ['J’ai vérifié les accords : le/la/les, les adjectifs, le pluriel.', 'J’ai vérifié les homophones : a/à, et/est, on/ont, son/sont, ces/ses, c’est/s’est.', 'J’ai vérifié les participes passés et les infinitifs (-é / -er).', 'J’ai cherché dans le dictionnaire les mots dont je ne suis pas sûr(e).']],
    ['Les outils', ['J’ai lancé le correcteur et lu ses suggestions (je décide, pas lui).', 'Je me suis écouté(e) avec « Lecture audio » pour repérer ce qui sonne bizarre.']],
    ['Avant de rendre', ['Mon nom et la date sont écrits.', 'C’est lisible et bien présenté (titre, paragraphes).', 'J’ai fait une pause avant la dernière relecture : on voit mieux les erreurs après.']]
  ];
  const LINKS = { 'Les outils': [['correcteur', '✍️ Correcteur'], ['lecture', '🔊 Lecture audio'], ['dico', '📖 Dictionnaire'], ['ortho', '🧠 S’entraîner']] };
  function check(box) {
    let S = Store.get('orga.check', {}); const save = () => Store.set('orga.check', S); const total = CHECK.reduce((n, [, a]) => n + a.length, 0); const prog = h('p', { class: 'muted', role: 'status', 'aria-live': 'polite' });
    const upd = () => { const k = Object.values(S).filter(Boolean).length; prog.textContent = `${k} / ${total} vérifications faites` + (k === total ? ' — 🎉 Ton devoir est prêt à être rendu !' : ''); };
    box.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Check-list avant de rendre un devoir'), h('p', { class: 'muted' }, 'Coche ce que tu as vérifié. Un conseil : fais une passe par type d’erreur (d’abord les majuscules, puis les accords…) plutôt que tout à la fois.'), prog, h('button', { class: 'btn ghost small', onclick: () => { S = {}; save(); box.querySelectorAll('input[type=checkbox]').forEach(i => { i.checked = false; }); upd(); } }, '↺ Tout décocher')), ...CHECK.map(([t, items]) => h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, t), items.map(txt => { const id = t + '|' + txt; return h('label', { class: 'chk', style: 'display:flex;gap:.5rem;align-items:flex-start;margin:.3rem 0' }, h('input', { type: 'checkbox', checked: !!S[id], onchange: ev => { if (ev.target.checked) S[id] = 1; else delete S[id]; save(); upd(); } }), h('span', null, txt)); }), LINKS[t] ? h('p', null, LINKS[t].map(([id, l]) => h('a', { class: 'btn sec small', href: '#/' + id, style: 'margin:.15rem' }, l))) : null))); upd();
  }

  App.reg({ id: 'orga', title: 'Organisation', group: 'entrainer', icon: '🗓️', learn: true, render(el) {
    el.append(h('h1', null, '🗓️ Organisation'), h('p', { class: 'muted' }, 'Emploi du temps, compte à rebours avant un contrôle, et check-list de relecture. Tout est écrit par toi et reste sur cet appareil.'));
    Sub.tabs(el, [['Emploi du temps', edt], ['Compte à rebours', countdown], ['Check-list de relecture', check]]);
  } });
  // Pour le panneau de droite et la page « S’entraîner » : ce qui vient (dates à venir) et ce qu'il y a dans l'emploi du temps maintenant / ensuite.
  const upcoming = () => (Store.get('orga.events', []) || []).filter(e => e && e.date && daysTo(e.date) !== null && daysTo(e.date) >= 0).sort((a, b) => a.date.localeCompare(b.date));
  const soon = () => {
    const E = Object.assign({ from: 8, to: 17, we: false, cells: {} }, Store.get('orga.edt', {})); const cells = E.cells || {}; const now = new Date(); const j = (now.getDay() + 6) % 7, hr = now.getHours(); const days = E.we ? 7 : 5;
    const empty = !Object.values(cells).some(v => v && String(v).trim()); if (empty) return { empty: true };
    if (j >= days) return { off: true };
    const cur = hr >= E.from && hr <= E.to ? cells[j + '-' + hr] || '' : ''; let nxt = null; for (let x = Math.max(hr + 1, E.from); x <= E.to; x++) if (cells[j + '-' + x]) { nxt = [x, cells[j + '-' + x]]; break; }
    return { cur, nxt, hr };
  };
  return { daysTo, label, parseDate, upcoming, soon };
})();
