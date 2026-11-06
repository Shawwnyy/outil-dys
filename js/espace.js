/* Outil Dys — Astronomie et espace (données NASA datées) + Défis et approfondissement. Aucune donnée inventée. */
'use strict';

const SPACE = {
  source: 'NASA — Planetary Fact Sheet (NSSDCA)', url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/index.html', updated: '18 mars 2025', consulted: '5 novembre 2026',
  C_KM_S: 299792.458, // vitesse de la lumière dans le vide : valeur exacte par définition du mètre
  // nom, type, masse (10^24 kg), diamètre (km), masse volumique (kg/m³), gravité (m/s²), vitesse de libération (km/s), rotation (h), durée du jour (h), distance au Soleil (10^6 km), période orbitale (jours), température moyenne (°C), lunes, anneaux, couleur illustrative
  P: [
    ['Mercure', 'rocheuse', 0.330, 4879, 5429, 3.7, 4.3, 1407.6, 4222.6, 57.9, 88.0, 167, 0, false, '#9ca3af'],
    ['Vénus', 'rocheuse', 4.87, 12104, 5243, 8.9, 10.4, -5832.5, 2802.0, 108.2, 224.7, 464, 0, false, '#e9c46a'],
    ['Terre', 'rocheuse', 5.97, 12756, 5514, 9.8, 11.2, 23.9, 24.0, 149.6, 365.2, 15, 1, false, '#3b82f6'],
    ['Mars', 'rocheuse', 0.642, 6792, 3934, 3.7, 5.0, 24.6, 24.7, 228.0, 687.0, -65, 2, false, '#dc2626'],
    ['Jupiter', 'géante gazeuse', 1898, 142984, 1326, 23.1, 59.5, 9.9, 9.9, 778.5, 4331, -110, 95, true, '#d97706'],
    ['Saturne', 'géante gazeuse', 568, 120536, 687, 9.0, 35.5, 10.7, 10.7, 1432.0, 10747, -140, 274, true, '#ca8a04'],
    ['Uranus', 'géante de glaces', 86.8, 51118, 1270, 8.7, 21.3, -17.2, 17.2, 2867.0, 30589, -195, 28, true, '#06b6d4'],
    ['Neptune', 'géante de glaces', 102, 49528, 1638, 11.0, 23.5, 16.1, 16.1, 4515.0, 59800, -200, 16, true, '#4338ca']
  ].map((r, i) => ({ i, nom: r[0], type: r[1], mass: r[2], diam: r[3], dens: r[4], g: r[5], esc: r[6], rot: r[7], day: r[8], dist: r[9], per: r[10], temp: r[11], moons: r[12], rings: r[13], color: r[14] })),
  lightMin(p) { return p.dist * 1e6 / SPACE.C_KM_S / 60; }
};
if (typeof module !== 'undefined') module.exports = SPACE;

if (typeof App !== 'undefined') {
  const fmt = (x, d = 1) => (+x.toFixed(d)).toLocaleString('fr-FR', { maximumFractionDigits: d });
  const srcNote = () => h('p', { class: 'muted', style: 'font-size:.9em' }, 'Source : ', h('a', { href: SPACE.url, target: '_blank', rel: 'noopener noreferrer' }, SPACE.source), ` — données mises à jour par la NASA le ${SPACE.updated} ; consultées le ${SPACE.consulted}. Les valeurs sont arrondies par la source. Le nombre de lunes change régulièrement avec les découvertes : vérifie une source récente.`);
  const SVGNS = 'http://www.w3.org/2000/svg';

  // ---- onglet : système solaire animé (schématique)
  const tabSystem = b => {
    const calm = App.feat('calmVisual') || (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches); let speed = 5, playing = !calm; let sel = 2;
    const wrap = h('div'), info = h('div', { class: 'card' });
    const render = () => {
      wrap.replaceChildren(); const W = 520, H = 440, cx = W / 2, cy = H / 2; const svg = document.createElementNS(SVGNS, 'svg'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Schéma du système solaire : les huit planètes sur leurs orbites, distances non à l’échelle'); svg.style.cssText = 'width:100%;max-width:520px;height:auto;background:#0b1020;border-radius:10px;display:block;margin:auto';
      let s = `<circle cx="${cx}" cy="${cy}" r="20" fill="#f59e0b"/><text x="${cx}" y="${cy + 4}" font-size="10" text-anchor="middle" fill="#111" font-weight="700">Soleil</text>`;
      SPACE.P.forEach((p, i) => { const r = 42 + i * 24, sz = [3, 5, 5, 4, 10, 8, 6, 6][i]; const dur = (p.per / SPACE.P[2].per) * 10 / speed; s += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#475569" stroke-dasharray="3 4"/>`; s += `<g><circle cx="${cx + r}" cy="${cy}" r="${sz}" fill="${p.color}" stroke="${i === sel ? '#fff' : 'none'}" stroke-width="2"/>${p.rings ? `<ellipse cx="${cx + r}" cy="${cy}" rx="${sz * 1.9}" ry="${sz * .5}" fill="none" stroke="${p.color}" stroke-width="1.5" opacity=".8"/>` : ''}<animateTransform attributeName="transform" type="rotate" from="0 ${cx} ${cy}" to="360 ${cx} ${cy}" dur="${dur}s" repeatCount="indefinite"/></g>`; });
      svg.innerHTML = s; wrap.append(svg); if (!playing) setTimeout(() => svg.pauseAnimations && svg.pauseAnimations(), 0);
      wrap.append(h('div', { class: 'row', style: 'margin-top:.5rem' }, h('button', { class: 'btn', 'aria-pressed': String(playing), onclick: () => { playing = !playing; if (playing) svg.unpauseAnimations(); else svg.pauseAnimations(); render(); } }, playing ? '⏸ Pause' : '▶ Lancer l’animation'), h('label', null, 'Vitesse ', h('select', { onchange: ev => { speed = +ev.target.value; render(); } }, [1, 5, 20, 100].map(v => h('option', { value: v, selected: v === speed }, '× ' + v)))), h('span', { class: 'muted' }, 'Choisis une planète : ', SPACE.P.map(p => h('button', { class: 'chip', 'aria-pressed': String(p.i === sel), style: `border-color:${p.color}`, onclick: () => { sel = p.i; render(); } }, p.nom)))));
      wrap.append(h('p', { class: 'notice secondary' }, h('b', null, 'À l’échelle : '), `la durée d’une révolution (1 an terrestre = 10 s ÷ vitesse). `, h('b', null, 'Pas à l’échelle : '), 'les distances entre orbites, les tailles des planètes et leurs couleurs (illustratives). Les orbites sont dessinées en cercles (elles sont en réalité de légères ellipses).'));
      info.replaceChildren(...fiche(SPACE.P[sel]));
    }; b.append(wrap, info); render();
  };
  const fiche = p => {
    const dir = p.rot < 0 ? ' (rotation rétrograde : dans le sens inverse des autres planètes)' : '';
    const rows = [['Type', p.type], ['Diamètre', `${fmt(p.diam, 0)} km (${fmt(p.diam / 12756, 2)} × la Terre)`], ['Masse', `${p.mass} × 10²⁴ kg`], ['Masse volumique', `${fmt(p.dens, 0)} kg/m³`], ['Gravité à la surface', `${p.g} m/s²`], ['Vitesse de libération', `${p.esc} km/s`], ['Durée de rotation sur elle-même', `${fmt(Math.abs(p.rot), 1)} h${dir}`], ['Durée d’un jour solaire', `${fmt(p.day, 1)} h`], ['Distance moyenne au Soleil', `${fmt(p.dist, 1)} millions de km (${fmt(p.dist / SPACE.P[2].dist, 2)} fois la distance Terre–Soleil)`], ['Durée d’une année (période orbitale)', `${fmt(p.per, 1)} jours terrestres`], ['Température moyenne', `${p.temp} °C`], ['Nombre de lunes', String(p.moons)], ['Anneaux', p.rings ? 'oui' : 'non']];
    const txt = `${p.nom}. ${p.type}. Diamètre ${fmt(p.diam, 0)} kilomètres. Distance moyenne au Soleil ${fmt(p.dist, 1)} millions de kilomètres. Une année dure ${fmt(p.per, 1)} jours terrestres. Température moyenne ${p.temp} degrés. ${p.moons} lune${p.moons > 1 ? 's' : ''}.`;
    return [h('h3', { style: 'margin-top:0' }, `${p.nom} — fiche`), h('table', { class: 't' }, h('tbody', null, rows.map(([k, v]) => h('tr', null, h('th', { scope: 'row', style: 'text-align:left' }, k), h('td', null, v))))), h('p', null, h('b', null, 'Calculé : '), `la lumière du Soleil met environ ${fmt(SPACE.lightMin(p), 1)} minutes pour arriver jusqu’à ${p.nom}.`), h('div', { class: 'row' }, Sub.speakBtn(() => txt, '🔊 Lire la fiche')), srcNote()];
  };
  const tabFiche = b => { let sel = 0; const box = h('div'); const draw = () => { box.replaceChildren(h('div', { class: 'row' }, SPACE.P.map(p => h('button', { class: 'btn small ' + (p.i === sel ? '' : 'sec'), 'aria-pressed': String(p.i === sel), onclick: () => { sel = p.i; draw(); } }, p.nom))), h('div', { class: 'card' }, ...fiche(SPACE.P[sel]))); }; b.append(box); draw(); };
  const tabCompare = b => {
    const s1 = h('select', { 'aria-label': 'Planète A' }, SPACE.P.map(p => h('option', { value: p.i, selected: p.i === 2 }, p.nom))), s2 = h('select', { 'aria-label': 'Planète B' }, SPACE.P.map(p => h('option', { value: p.i, selected: p.i === 3 }, p.nom))); const out = h('div');
    const go = () => { const A = SPACE.P[+s1.value], B = SPACE.P[+s2.value]; const rows = [['Diamètre (km)', 'diam', 0], ['Gravité (m/s²)', 'g', 1], ['Distance au Soleil (millions de km)', 'dist', 1], ['Année (jours terrestres)', 'per', 1], ['Température moyenne (°C)', 'temp', 0], ['Lunes', 'moons', 0]]; out.replaceChildren(h('table', { class: 't' }, h('thead', null, h('tr', null, h('th', null, ''), h('th', null, A.nom), h('th', null, B.nom), h('th', null, `${A.nom} ÷ ${B.nom}`))), h('tbody', null, rows.map(([l, k, d]) => h('tr', null, h('td', null, l), h('td', null, fmt(A[k], d)), h('td', null, fmt(B[k], d)), h('td', null, B[k] > 0 && A[k] >= 0 && k !== 'temp' ? '× ' + fmt(A[k] / B[k], 2) : '—'))))), srcNote()); }; s1.addEventListener('change', go); s2.addEventListener('change', go);
    b.append(h('div', { class: 'row' }, h('label', null, 'A ', s1), h('label', null, 'B ', s2)), out); go();
  };
  const tabOrder = b => {
    const box = h('div'); let ord, k, errors = 0; const start = () => { ord = Sub.shuffle(SPACE.P.slice()); k = 0; errors = 0; draw(); };
    const draw = () => { box.replaceChildren(h('p', null, h('b', null, k < 8 ? `Clique la planète n° ${k + 1} en partant du Soleil.` : `Bravo ! Ordre complet${errors ? ` (${errors} erreur(s))` : ' sans erreur'}.`)), h('div', { class: 'row' }, ord.map(p => { const done = p.i < k; return h('button', { class: 'btn ' + (done ? '' : 'sec'), disabled: done, onclick: () => { if (p.i === k) { k++; if (k === 8) Sub.logEx('planetes', errors === 0); draw(); } else { errors++; App.toast('Pas encore : cherche une planète plus proche du Soleil.'); } } }, done ? `${p.i + 1}. ${p.nom}` : p.nom); })), h('div', { class: 'row' }, h('button', { class: 'btn sec', onclick: start }, 'Recommencer')), k === 8 ? h('p', null, 'Ordre depuis le Soleil : ' + SPACE.P.map(p => p.nom).join(' → ') + '. Pluton est classée planète naine depuis 2006 (décision de l’Union astronomique internationale).') : ''); }; b.append(box); start();
  };
  const QDEFS = [['Quelle planète a le plus grand diamètre ?', 'diam', 1], ['Quelle planète a le plus petit diamètre ?', 'diam', -1], ['Quelle planète est la plus chaude (température moyenne) ?', 'temp', 1], ['Quelle planète est la plus froide (température moyenne) ?', 'temp', -1], ['Quelle planète est la plus proche du Soleil ?', 'dist', -1], ['Quelle planète est la plus éloignée du Soleil ?', 'dist', 1], ['Sur quelle planète une année dure-t-elle le plus longtemps ?', 'per', 1], ['Sur quelle planète une année dure-t-elle le moins longtemps ?', 'per', -1], ['Sur quelle planète la gravité à la surface est-elle la plus forte ?', 'g', 1], ['Quelle planète a le plus de lunes (selon la NASA, ' + '18 mars 2025) ?', 'moons', 1], ['Quelle planète tourne le plus vite sur elle-même ?', 'rot', -1]];
  const tabQuiz = b => {
    const box = h('div'); let sc = { ok: 0, n: 0 };
    const val = (p, k) => k === 'rot' ? Math.abs(p.rot) : p[k];
    const next = () => { const cand = QDEFS.filter(([, k, d]) => { const v = SPACE.P.map(p => val(p, k)); const ex = d > 0 ? Math.max(...v) : Math.min(...v); return v.filter(x => x === ex).length === 1; }); const [q, k, d] = cand[Sub.rnd(0, cand.length - 1)]; const v = SPACE.P.map(p => val(p, k)); const ex = d > 0 ? Math.max(...v) : Math.min(...v); const good = SPACE.P.find(p => val(p, k) === ex); const opts = Sub.shuffle([good, ...Sub.shuffle(SPACE.P.filter(p => p !== good)).slice(0, 3)]); const fb = h('p', { 'aria-live': 'polite' });
      box.replaceChildren(h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, q), h('div', { class: 'grid g2' }, opts.map(p => h('button', { class: 'btn sec', onclick: ev => { const ok = p === good; sc.n++; if (ok) sc.ok++; Sub.logEx('espace', ok); fb.textContent = ok ? '✅ Exact !' : `❌ La bonne réponse : ${good.nom}.`; $$('button', ev.target.parentNode).forEach(x => x.disabled = true); box.firstChild.append(h('button', { class: 'btn', onclick: next }, 'Question suivante')); } }, p.nom))), fb, h('p', { class: 'muted' }, `Score : ${sc.ok} / ${sc.n}`)), srcNote()); };
    b.append(Sub.notice('secondary', 'Les questions sont fabriquées à partir des données NASA ci-dessous ; les bonnes réponses sont calculées (maximum ou minimum), pas écrites à la main.'), box); next();
  };
  const tabCalc = b => {
    const m = h('input', { type: 'number', value: 40, min: 1, max: 300, 'aria-label': 'Ta masse en kilogrammes' }); const out = h('div'); const out2 = h('div');
    const go = () => { const kg = +m.value; if (!(kg > 0)) return; out.replaceChildren(h('table', { class: 't' }, h('thead', null, h('tr', null, ['Planète', 'Gravité (m/s²)', 'Ton poids (N)', 'Une balance terrestre indiquerait'].map(x => h('th', null, x)))), h('tbody', null, SPACE.P.map(p => h('tr', null, h('td', null, p.nom), h('td', null, p.g), h('td', null, fmt(kg * p.g, 0)), h('td', null, h('b', null, fmt(kg * p.g / SPACE.P[2].g, 1) + ' kg'))))))); };
    m.addEventListener('input', go);
    out2.append(h('table', { class: 't' }, h('thead', null, h('tr', null, ['Planète', 'Distance (millions de km)', 'Temps de la lumière'].map(x => h('th', null, x)))), h('tbody', null, SPACE.P.map(p => { const mn = SPACE.lightMin(p); return h('tr', null, h('td', null, p.nom), h('td', null, fmt(p.dist, 1)), h('td', null, mn < 60 ? `${fmt(mn, 1)} min` : `${fmt(mn / 60, 2)} h`)); }))));
    b.append(h('h3', { style: 'margin-top:0' }, 'Ton poids sur chaque planète'), h('p', null, 'Ta masse (en kg) ne change pas d’une planète à l’autre. Ton poids (une force, en newtons) = masse × gravité.'), h('label', null, 'Ta masse (kg) ', m), out, h('p', { class: 'muted' }, 'Gravités arrondies à 0,1 m/s² par la source : les résultats sont approximatifs.'), h('h3', null, 'Le voyage de la lumière'), h('p', null, `La lumière va à ${fmt(SPACE.C_KM_S, 3)} km/s dans le vide (valeur exacte par définition du mètre). Temps = distance ÷ vitesse.`), out2, srcNote()); go();
  };

  // ====================================================== V2 : Lune, saisons, éclipses, voyage guidé
  // Constantes NASA (fiches Lune du 11 janvier 2024 et Terre du 15 novembre 2024, consultées le 5 novembre 2026)
  const NASA2 = { synodic: 29.53, moonInc: 5.145, obliq: 23.44, moonUrl: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html', earthUrl: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html' };
  const src2 = (...which) => h('p', { class: 'muted', style: 'font-size:.9em' }, 'Sources : ', ...which.flatMap((w, i) => [i ? ' · ' : '', h('a', { href: w === 'moon' ? NASA2.moonUrl : NASA2.earthUrl, target: '_blank', rel: 'noopener noreferrer' }, w === 'moon' ? 'NASA Moon Fact Sheet (mise à jour 11 janv. 2024)' : 'NASA Earth Fact Sheet (mise à jour 15 nov. 2024)')]), '. Consultées le 5 novembre 2026.');
  const mk = (tag, attrs = {}, ...kids) => { const e = document.createElementNS(SVGNS, tag); Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v)); kids.forEach(k => e.append(k)); return e; };
  const MOON_PHASES = [[0, 'Nouvelle Lune'], [3.69, 'Premier croissant'], [7.38, 'Premier quartier'], [11.07, 'Gibbeuse croissante'], [14.77, 'Pleine Lune'], [18.46, 'Gibbeuse décroissante'], [22.15, 'Dernier quartier'], [25.84, 'Dernier croissant']];
  const moonName = d => { const T = NASA2.synodic; const near = MOON_PHASES.find(([x]) => Math.abs(d - x) < .6) || (d > T - .6 ? MOON_PHASES[0] : null); if (near) return near[1]; let best = MOON_PHASES[0]; MOON_PHASES.forEach(m => { if (d >= m[0]) best = m; }); return best[1] + ' (entre deux phases principales)'; };
  const tabLune = b => {
    const T = NASA2.synodic; const sl = h('input', { type: 'range', min: 0, max: T, step: 0.1, value: 3.7, style: 'width:100%', 'aria-label': 'Jour du cycle lunaire' }); const svgBox = h('div', { style: 'text-align:center' }); const info = h('p', { 'aria-live': 'polite' });
    const draw = () => {
      const d = +sl.value, wax = d <= T / 2, dd = wax ? d : T - d, th = 2 * Math.PI * dd / T, k = Math.cos(th), f = (1 - k) / 2; const r = 90, cx = 110, cy = 110;
      const lit = `M ${cx} ${cy - r} A ${r} ${r} 0 0 1 ${cx} ${cy + r} A ${Math.max(.01, r * Math.abs(k))} ${r} 0 0 ${k > 0 ? 0 : 1} ${cx} ${cy - r} Z`;
      const svg = mk('svg', { viewBox: '0 0 220 220', width: 220, height: 220, role: 'img', 'aria-label': `Lune au jour ${fmt(d, 1)} du cycle : ${moonName(d)}, environ ${Math.round(f * 100)} % éclairée` }, mk('circle', { cx, cy, r, fill: '#1f2937', stroke: '#6b7280' }), mk('path', { d: lit, fill: '#f3f4f6', transform: wax ? '' : `translate(${2 * cx} 0) scale(-1 1)` }));
      svgBox.replaceChildren(svg);
      info.replaceChildren(h('b', null, moonName(d)), ` — jour ${fmt(d, 1)} sur ${fmt(T, 2)} · environ ${Math.round(f * 100)} % du disque éclairé (calcul : (1 − cos(2π × jour ÷ ${fmt(T, 2)})) ÷ 2).`);
    }; sl.addEventListener('input', draw);
    const btns = h('div', { class: 'row' }, MOON_PHASES.map(([x, n]) => h('button', { class: 'btn small sec', onclick: () => { sl.value = x; draw(); } }, n)));
    b.append(Sub.notice('secondary', 'Vue depuis l’hémisphère nord : dans l’hémisphère sud, la partie éclairée apparaît inversée. La Lune ne produit pas de lumière : on voit la moitié éclairée par le Soleil, sous un angle qui change.'), h('h3', { style: 'margin-top:0' }, 'Les phases de la Lune'), h('p', null, `Un cycle complet dure environ ${fmt(T, 2)} jours (période synodique). Déplace le curseur ou clique sur une phase.`), btns, svgBox, sl, info, src2('moon')); draw();
  };
  const tabSaisons = b => {
    const day = h('input', { type: 'range', min: 1, max: 365, value: 172, style: 'width:100%', 'aria-label': 'Jour de l’année' }); const lat = h('input', { type: 'range', min: -90, max: 90, value: 45, style: 'width:100%', 'aria-label': 'Latitude en degrés' }); const out = h('p', { 'aria-live': 'polite' }); const box = h('div');
    const rad = x => x * Math.PI / 180; const decl = N => -NASA2.obliq * Math.cos(2 * Math.PI * (N + 10) / 365);
    const dayLen = (phi, N) => { const x = -Math.tan(rad(phi)) * Math.tan(rad(decl(N))); return x >= 1 ? 0 : x <= -1 ? 24 : 24 / Math.PI * Math.acos(x); };
    const DATE = N => { const dt = new Date(2025, 0, N); return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }); };
    const season = (N, phi) => { const nord = N >= 80 && N < 172 ? 'printemps' : N >= 172 && N < 266 ? 'été' : N >= 266 && N < 355 ? 'automne' : 'hiver'; const sud = { printemps: 'automne', été: 'hiver', automne: 'printemps', hiver: 'été' }[nord]; return phi >= 0 ? nord : sud; };
    const draw = () => {
      const N = +day.value, phi = +lat.value; const W = 520, H = 200, L = 36, B = 28, pw = W - L - 10, ph = H - B - 10; const pts = []; for (let n = 1; n <= 365; n += 4) pts.push(`${L + pw * (n - 1) / 364},${10 + ph * (1 - dayLen(phi, n) / 24)}`);
      const svg = mk('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Durée du jour au cours de l’année à la latitude choisie', style: 'width:100%;max-width:560px' }, mk('rect', { x: L, y: 10, width: pw, height: ph, fill: 'none', stroke: '#9ca3af' }), mk('polyline', { points: pts.join(' '), fill: 'none', stroke: '#2563eb', 'stroke-width': 2.5 }), mk('line', { x1: L + pw * (N - 1) / 364, x2: L + pw * (N - 1) / 364, y1: 10, y2: 10 + ph, stroke: '#dc2626', 'stroke-width': 2 }));
      [0, 12, 24].forEach(v => { const t = mk('text', { x: 4, y: 10 + ph * (1 - v / 24) + 4, 'font-size': 11, fill: 'currentColor' }); t.textContent = v + ' h'; svg.append(t); });
      [['janv.', 1], ['avr.', 91], ['juil.', 182], ['oct.', 274]].forEach(([m, n]) => { const t = mk('text', { x: L + pw * (n - 1) / 364, y: H - 8, 'font-size': 11, fill: 'currentColor' }); t.textContent = m; svg.append(t); });
      box.replaceChildren(svg);
      const dl = dayLen(phi, N), hh = Math.floor(dl), mm = Math.round((dl - hh) * 60);
      out.replaceChildren(h('b', null, `${DATE(N)}`), ` · latitude ${phi}° ${phi >= 0 ? 'nord' : 'sud'} · saison : `, h('b', null, season(N, phi)), h('br'), `Déclinaison du Soleil ≈ ${fmt(decl(N), 1)}° · durée du jour ≈ ${dl === 0 ? 'nuit polaire (le Soleil ne se lève pas)' : dl === 24 ? 'jour polaire (le Soleil ne se couche pas)' : hh + ' h ' + String(mm).padStart(2, '0')}.`);
    }; day.addEventListener('input', draw); lat.addEventListener('input', draw);
    b.append(Sub.notice('secondary', h('b', null, 'À retenir : '), `les saisons viennent de l’inclinaison de l’axe de la Terre (${fmt(NASA2.obliq, 2)}°), pas de la distance au Soleil. Quand l’hémisphère nord est incliné vers le Soleil, c’est l’été au nord et l’hiver au sud.`), h('h3', { style: 'margin-top:0' }, 'Durée du jour selon la saison et la latitude'), h('label', null, 'Jour de l’année ', day), h('label', null, 'Latitude (−90° pôle sud … 90° pôle nord) ', lat), out, box,
      h('p', { class: 'muted' }, 'Calcul : approximation astronomique standard (déclinaison ≈ −23,44° × cos(2π × (jour + 10) ÷ 365)). Les dates exactes des équinoxes et solstices (≈ 20 mars, 21 juin, 22 septembre, 21 décembre) varient d’un jour selon les années ; la courbe est une estimation, pas un almanach.'), src2('earth'));
    draw();
  };
  const tabEclipses = b => {
    let mode = 'solaire', tilt = false; const box = h('div', { style: 'text-align:center' }); const txt = h('div');
    const draw = () => {
      const W = 520, H = 190; const sun = mk('circle', { cx: 60, cy: 95, r: 42, fill: '#f59e0b' }); const earth = mk('circle', { cx: 440, cy: 95, r: 20, fill: '#3b82f6' }); const mx = mode === 'solaire' ? 360 : 520 - 20; const moon = mk('circle', { cx: mode === 'solaire' ? 360 : 500, cy: 95 + (tilt ? 24 : 0), r: 8, fill: '#d1d5db', stroke: '#6b7280' });
      const svg = mk('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': mode === 'solaire' ? 'Éclipse de Soleil : la Lune est entre le Soleil et la Terre' : 'Éclipse de Lune : la Terre est entre le Soleil et la Lune', style: 'width:100%;max-width:560px' }, mk('line', { x1: 60, y1: 95, x2: 500, y2: 95, stroke: '#9ca3af', 'stroke-dasharray': '4 4' }), sun, earth, moon);
      [['Soleil', 60, 150], ['Terre', 440, 135], ['Lune', mode === 'solaire' ? 360 : 500, 60]].forEach(([n, x, y]) => { const t = mk('text', { x, y, 'text-anchor': 'middle', 'font-size': 13, fill: 'currentColor' }); t.textContent = n; svg.append(t); });
      if (tilt) { const t = mk('text', { x: 260, y: 182, 'text-anchor': 'middle', 'font-size': 12, fill: 'currentColor' }); t.textContent = 'Lune un peu au-dessus ou au-dessous de la ligne : pas d’éclipse ce mois-ci'; svg.append(t); }
      box.replaceChildren(svg);
      txt.replaceChildren(mode === 'solaire' ? h('p', null, h('b', null, 'Éclipse de Soleil'), ' : la Lune passe entre le Soleil et la Terre, pendant une Nouvelle Lune. Son ombre tombe sur une petite partie de la Terre.') : h('p', null, h('b', null, 'Éclipse de Lune'), ' : la Terre passe entre le Soleil et la Lune, pendant une Pleine Lune. La Lune entre dans l’ombre de la Terre.'), tilt ? h('p', null, `Pourquoi pas une éclipse à chaque mois ? L’orbite de la Lune est inclinée d’environ ${fmt(NASA2.moonInc, 3)}° par rapport au plan de l’orbite de la Terre : le plus souvent, la Lune passe un peu au-dessus ou au-dessous de l’alignement. Sur ce schéma, l’écart est exagéré pour qu’on le voie.`) : h('p', { class: 'muted' }, 'Coche « inclinaison de l’orbite lunaire » pour comprendre pourquoi les éclipses sont rares.'));
    };
    const bS = h('button', { class: 'btn', onclick: () => { mode = 'solaire'; draw(); } }, '☀️ Éclipse de Soleil'); const bL = h('button', { class: 'btn', onclick: () => { mode = 'lunaire'; draw(); } }, '🌕 Éclipse de Lune'); const ck = h('input', { type: 'checkbox', onchange: ev => { tilt = ev.target.checked; draw(); } });
    b.append(Sub.notice('secondary', 'Schémas pas à l’échelle (les distances et les tailles réelles sont bien plus grandes). Aucune date d’éclipse n’est donnée ici : elles demandent un almanach astronomique à jour.'), h('h3', { style: 'margin-top:0' }, 'Les éclipses'), h('div', { class: 'row' }, bS, bL, h('label', { class: 'chk' }, ck, 'inclinaison de l’orbite lunaire')), box, txt, src2('moon')); draw();
  };
  const tabVoyage = b => {
    const stops = [{ nom: 'Soleil', soleil: true }, ...SPACE.P]; let i = 0; const card = h('div', { class: 'card', 'aria-live': 'polite' }); const prog = h('p', { class: 'muted' }); const nxt = h('button', { class: 'btn' }, 'Étape suivante ▶'), prv = h('button', { class: 'btn sec' }, '◀ Précédente');
    const AVION = 900; // km/h : ordre de grandeur choisi pour comparer (pas une donnée NASA)
    const show = () => {
      const p = stops[i]; prv.disabled = i === 0; nxt.disabled = i === stops.length - 1; prog.textContent = `Étape ${i + 1} sur ${stops.length}`;
      if (p.soleil) return card.replaceChildren(h('h3', { style: 'margin-top:0' }, '☀️ Départ : le Soleil'), h('p', null, 'Tu pars du Soleil, l’étoile au centre du système solaire. Chaque étape te montre une planète, de la plus proche à la plus lointaine.'), h('p', { class: 'muted' }, `La lumière voyage à ${fmt(SPACE.C_KM_S, 0)} km/s (valeur exacte). On l’utilise pour mesurer les distances : « temps de lumière ».`));
      const mn = SPACE.lightMin(p), yrs = p.dist * 1e6 / AVION / 24 / 365.25;
      card.replaceChildren(h('h3', { style: 'margin-top:0' }, `🪐 ${p.nom}`), h('ul', null, h('li', null, `Type : planète ${p.type}`), h('li', null, `Distance moyenne au Soleil : ${fmt(p.dist, 1)} millions de km`), h('li', null, `Temps de la lumière depuis le Soleil : ${mn < 60 ? fmt(mn, 1) + ' minutes' : fmt(mn / 60, 1) + ' heures'}`), h('li', null, `En avion de ligne (≈ ${AVION} km/h, ordre de grandeur) : environ ${yrs < 100 ? fmt(yrs, 0) : fmt(yrs, 0)} ans sans escale`), h('li', null, `Diamètre : ${fmt(p.diam, 0)} km · température moyenne : ${fmt(p.temp, 0)} °C · lunes connues (fiche NASA) : ${p.moons}`)), i === stops.length - 1 ? h('p', { class: 'notice secondary' }, 'Fin du parcours. Au-delà : ceinture de Kuiper, Voie lactée, autres galaxies, Big Bang… Cette application n’a pas de contenu vérifié et daté sur ces sujets : consulte une source récente (NASA, ESA, CNES).') : '');
    }; nxt.addEventListener('click', () => { i = Math.min(stops.length - 1, i + 1); show(); }); prv.addEventListener('click', () => { i = Math.max(0, i - 1); show(); });
    b.append(Sub.notice('secondary', 'Parcours guidé : une étape à la fois, pour ne pas surcharger l’écran. Données NASA datées du ' + SPACE.updated + '. Le trajet en avion est un calcul de comparaison (distance ÷ 900 km/h), pas une donnée scientifique.'), h('h3', { style: 'margin-top:0' }, 'Voyage dans l’espace'), prog, card, h('div', { class: 'row' }, prv, nxt), srcNote()); show();
  };
  App.reg({ id: 'espace', title: 'Astronomie et espace', group: 'matieres', icon: '🪐', learn: true, render(el) {
    el.append(h('h1', null, '🪐 Astronomie et espace'), Sub.notice('secondary', h('b', null, 'Données vérifiées et datées : '), `valeurs de la fiche planétaire de la NASA (mise à jour du ${SPACE.updated}, consultée le ${SPACE.consulted}). Rien d’autre n’est affiché comme un fait scientifique. Pas d’images de la NASA : aucune n’est fournie localement.`), Sub.courseBox('astronomie'));
    Sub.tabs(el, [['Voyage guidé', tabVoyage], ['Système solaire', tabSystem], ['Phases de la Lune', tabLune], ['Saisons', tabSaisons], ['Éclipses', tabEclipses], ['Fiches des planètes', tabFiche], ['Comparer', tabCompare], ['Ordre des planètes (jeu)', tabOrder], ['Quiz', tabQuiz], ['Calculs : poids, lumière', tabCalc]]);
  } });

  // ====================================================================================================  Défis et approfondissement (facultatif)
  const Seq = {
    gen(level) {
      const r = Sub.rnd; const kinds = level === 1 ? ['ari', 'ari'] : level === 2 ? ['ari', 'geo', 'sq', 'alt'] : ['fib', 'tri', 'inc', 'geo', 'alt'];
      const kind = kinds[r(0, kinds.length - 1)]; let t = [], rule = '';
      if (kind === 'ari') { const a = r(-5, 30), d = r(2, 9) * (level > 1 && Math.random() < .4 ? -1 : 1); t = Array.from({ length: 7 }, (_, i) => a + i * d); rule = `On ${d > 0 ? 'ajoute' : 'retire'} ${Math.abs(d)} à chaque fois.`; }
      else if (kind === 'geo') { const a = r(1, 4), k = r(2, 3); t = Array.from({ length: 7 }, (_, i) => a * k ** i); rule = `On multiplie par ${k} à chaque fois.`; }
      else if (kind === 'sq') { const s = r(1, 6); t = Array.from({ length: 7 }, (_, i) => (s + i) ** 2); rule = `Ce sont les carrés des nombres entiers à partir de ${s} (${s}², ${s + 1}², …).`; }
      else if (kind === 'alt') { const a = r(1, 20), x = r(2, 9), y = r(1, 5); t = [a]; for (let i = 1; i < 7; i++) t.push(t[i - 1] + (i % 2 ? x : -y)); rule = `On alterne : +${x}, puis −${y}, puis +${x}, puis −${y}…`; }
      else if (kind === 'fib') { const a = r(1, 5), b2 = r(1, 6); t = [a, b2]; for (let i = 2; i < 7; i++) t.push(t[i - 1] + t[i - 2]); rule = 'Chaque nombre est la somme des deux précédents.'; }
      else if (kind === 'tri') { const s = r(0, 3); t = Array.from({ length: 7 }, (_, i) => (s + i + 1) * (s + i + 2) / 2); rule = 'Nombres triangulaires : 1, 3, 6, 10, 15… (on ajoute 2, puis 3, puis 4…).'; }
      else { const a = r(1, 10), d0 = r(1, 3); t = [a]; for (let i = 1; i < 7; i++) t.push(t[i - 1] + d0 + i - 1); rule = `On ajoute ${d0}, puis ${d0 + 1}, puis ${d0 + 2}… (l’écart augmente de 1 à chaque fois).`; }
      return { shown: t.slice(0, 5), answer: t.slice(5, 7), rule, kind };
    }
  };
  const tabSeq = b => {
    let lvl = 1; const box = h('div'); const draw = () => {
      const q = Seq.gen(lvl); const a1 = h('input', { type: 'number', 'aria-label': 'Terme suivant' }), a2 = h('input', { type: 'number', 'aria-label': 'Terme d’après' }); const fb = h('p', { 'aria-live': 'polite' }); let done = false; const hint = h('p', { hidden: true, class: 'notice' }, 'Indice : regarde les écarts entre deux nombres qui se suivent, puis leur rapport (÷).');
      const chk = () => { if (done) return; done = true; const ok = +a1.value === q.answer[0] && +a2.value === q.answer[1]; Sub.logEx('suites', ok); fb.textContent = ok ? '✅ Bravo !' : `❌ Réponse : ${q.answer.join(' ; ')}.`; fb.append(h('br'), 'Règle : ' + q.rule); box.firstChild.append(h('button', { class: 'btn', onclick: draw }, 'Une autre suite')); };
      box.replaceChildren(h('div', { class: 'card' }, h('p', { class: 'muted' }, 'Niveau (à toi de choisir) : ', [1, 2, 3].map(l => h('button', { class: 'btn small ' + (l === lvl ? '' : 'sec'), 'aria-pressed': String(l === lvl), onclick: () => { lvl = l; draw(); } }, l))), h('h3', null, q.shown.join('  ,  ') + '  ,  ?  ,  ?'), h('div', { class: 'row' }, a1, a2, h('button', { class: 'btn', onclick: chk }, 'Vérifier'), h('button', { class: 'btn sec', onclick: () => hint.hidden = !hint.hidden }, 'Indice')), hint, fb));
    }; b.append(box); draw();
  };
  const factor = n => { const f = []; let m = n; for (let p = 2; p * p <= m; p++) while (m % p === 0) { f.push(p); m /= p; } if (m > 1) f.push(m); return f; };
  const tabPrime = b => {
    const v = h('input', { type: 'number', min: 2, max: 999999999, value: 91, 'aria-label': 'Nombre à tester' }); const out = h('div', { 'aria-live': 'polite' });
    const go = () => { const n = Math.floor(+v.value); out.replaceChildren(); if (!(n >= 2) || n > 999999999) return out.append(Sub.notice('bad', 'Entre un entier entre 2 et 999 999 999.')); const f = factor(n); const lim = Math.floor(Math.sqrt(n)); const first = (() => { for (let p = 2; p <= lim; p++) if (n % p === 0) return p; return null; })();
      out.append(h('p', { style: 'font-size:1.2em' }, h('b', null, f.length === 1 ? `${n} est un nombre premier.` : `${n} n’est pas premier : ${n} = ${f.join(' × ')}`)), h('p', null, first ? `Le plus petit diviseur (autre que 1) est ${first} : ${n} ÷ ${first} = ${n / first}.` : `Aucun nombre de 2 à ${lim} (la racine carrée arrondie de ${n}) ne divise ${n} : il suffit de tester jusque-là, car un diviseur plus grand serait associé à un diviseur plus petit.`), h('p', { class: 'muted' }, 'Un nombre premier a exactement deux diviseurs : 1 et lui-même.')); };
    v.addEventListener('keydown', e => e.key === 'Enter' && go()); b.append(h('div', { class: 'row' }, h('label', null, 'Nombre ', v), h('button', { class: 'btn', onclick: go }, 'Tester')), out, h('h3', null, 'Le crible d’Ératosthène (jusqu’à 100)'), sieve()); go();
  };
  const sieve = () => {
    const root = h('div'); let crossed, cur, prime; const reset = () => { crossed = new Set([1]); prime = []; cur = 1; draw('Clique sur « Étape suivante » : on garde le plus petit nombre non barré et on barre tous ses multiples.'); };
    const step = () => { let p = cur + 1; while (p <= 100 && crossed.has(p)) p++; if (p > 100) return draw('Terminé : les nombres non barrés sont les nombres premiers.'); if (cur >= 11 || p * p > 100 && false) { } prime.push(p); const mul = []; for (let m = 2 * p; m <= 100; m += p) if (!crossed.has(m)) { crossed.add(m); mul.push(m); } cur = p; draw(`${p} est premier (non barré). Je barre ses multiples : ${mul.length ? mul.join(', ') : 'aucun nouveau'}.` + (p * p > 100 ? ' Comme ' + p + ' × ' + p + ' > 100, tous les nombres non barrés qui restent sont premiers : le crible est terminé.' : '')); };
    const draw = msg => { root.replaceChildren(h('p', { 'aria-live': 'polite' }, msg), h('div', { style: 'display:grid;grid-template-columns:repeat(10,minmax(0,3rem));gap:3px' }, Array.from({ length: 100 }, (_, i) => i + 1).map(n => { const isP = prime.includes(n); const c = crossed.has(n); return h('div', { style: `text-align:center;padding:.25rem 0;border-radius:4px;border:2px solid ${isP ? '#16a34a' : '#ccc'};${c ? 'background:#e5e7eb;color:#6b7280;text-decoration:line-through' : isP ? 'background:#bbf7d0;font-weight:700' : ''}`, 'aria-label': `${n}${isP ? ', premier' : c ? ', barré' : ''}` }, n); })), h('div', { class: 'row', style: 'margin-top:.5rem' }, h('button', { class: 'btn', onclick: step }, 'Étape suivante'), h('button', { class: 'btn sec', onclick: reset }, 'Recommencer'))); };
    reset(); return root;
  };
  const tabLight = b => {
    const p = SPACE.P[Sub.rnd(0, 7)]; let target = p; const inp = h('input', { type: 'number', step: 'any', 'aria-label': 'Ton estimation en minutes' }); const fb = h('p', { 'aria-live': 'polite' });
    const pick = h('select', { 'aria-label': 'Planète', onchange: ev => { target = SPACE.P[+ev.target.value]; q.textContent = text(); fb.textContent = ''; inp.value = ''; } }, SPACE.P.map(x => h('option', { value: x.i, selected: x.i === p.i }, x.nom))); const text = () => `En combien de minutes la lumière du Soleil arrive-t-elle jusqu’à ${target.nom} ?`; const q = h('h3', null, text());
    const chk = () => { const est = +inp.value; if (!(est >= 0)) return; const real = SPACE.lightMin(target); const err = Math.abs(est - real) / real; Sub.logEx('estimation', err <= .15); fb.textContent = `Calcul : ${fmt(target.dist, 1)} millions de km ÷ ${fmt(SPACE.C_KM_S, 3)} km/s = ${fmt(target.dist * 1e6 / SPACE.C_KM_S, 0)} s ≈ ${fmt(real, 1)} min. ${err <= .15 ? '✅ Ton estimation est à moins de 15 %.' : err <= .5 ? '🟡 Ordre de grandeur correct.' : '❌ Loin : regarde le calcul.'}`; };
    b.append(Sub.notice('secondary', 'Défi d’estimation : pense à la Terre (environ 8 minutes), puis ajuste avec la distance. Données NASA datées du ' + SPACE.updated + '.'), h('div', { class: 'card' }, h('label', null, 'Planète ', pick), q, h('div', { class: 'row' }, inp, h('button', { class: 'btn', onclick: chk }, 'Comparer au calcul')), fb), srcNote());
  };
  const tabQuestions = b => {
    const kw = TX.keywords(App.ws.text, 6).map(k => k.w); if (kw.length < 2) return b.append(Sub.notice('', 'Ajoute d’abord un cours (dans « Mon cours » ci-dessus) : je repère ses mots importants pour proposer des questions d’approfondissement.'));
    const T = [w => `Explique « ${w} » avec tes mots, comme à quelqu’un de plus jeune, en trois phrases.`, w => `Donne un exemple et un contre-exemple de « ${w} ».`, (w, v) => `Quel lien vois-tu entre « ${w} » et « ${v} » ?`, w => `Que se passerait-il si « ${w} » n’existait pas ?`, w => `Dans quelle autre matière retrouves-tu « ${w} » ?`, w => `Quelle question te poserais-tu encore sur « ${w} » ?`];
    const qs = T.map((f, i) => f(kw[i % kw.length], kw[(i + 1) % kw.length])); const areas = [];
    b.append(Sub.notice('secondary', 'Ces questions sont des modèles remplis avec les mots importants de ton cours : elles ne viennent pas d’une compréhension du cours, adapte-les. Rien n’est obligatoire.'), ...qs.map((q, i) => { const t = h('textarea', { rows: 3, 'aria-label': 'Ma réponse ' + (i + 1) }); areas.push(t); return h('div', { class: 'card' }, h('b', null, q), t); }), h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { const txt = qs.map((q, i) => `${q}\n${areas[i].value}`).join('\n\n'); App.send(txt, 'correcteur', 'Mes réponses d’approfondissement', 'texte'); } }, 'Corriger mes réponses')));
  };
  const tabLinks = b => b.append(h('p', null, 'Des ponts entre les matières, avec de vrais outils de l’application :'), h('ul', null, [['Maths × Espace', 'Calculer le temps de la lumière ou ton poids sur chaque planète.', 'espace'], ['Histoire × Maths', 'Calculer des durées et des siècles, dessiner une frise à l’échelle.', 'm-histoire'], ['Géographie × Maths', 'Classer et comparer tes propres données (avec leur année et leur source).', 'm-geo'], ['Informatique × Maths', 'Convertir en binaire et en hexadécimal, comprendre les puissances de 2.', 'm-info'], ['Français × toutes les matières', 'Rédiger un compte rendu, une fiche ou un exposé, puis le corriger.', 'redaction']].map(([t, d, id]) => h('li', null, h('a', { href: '#/' + id }, h('b', null, t)), ' — ', d))));
  App.reg({ id: 'defis', title: 'Défis et approfondissement', group: 'activites', icon: '🧩', learn: true, render(el) {
    el.append(h('h1', null, '🧩 Défis et approfondissement'), Sub.notice('secondary', 'Section facultative, à ton rythme, pour aller plus loin si tu en as envie. Tu choisis le niveau. Aucun test n’est fait pour deviner ton « profil ».'), Sub.courseBox('défis'));
    Sub.tabs(el, [['Suites logiques', tabSeq], ['Nombres premiers', tabPrime], ['Estimation : la lumière', tabLight], ['Questions sur mon cours', tabQuestions], ['Liens entre matières', tabLinks]]);
  } });
}
