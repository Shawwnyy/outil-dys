/* Outil Dys — Repérage dans l'espace : mises en situation, gauche/droite, trajets, quadrillage, points cardinaux, mots de position.
   Mises en situation générées par calcul (rien n'est écrit à la main : les bonnes réponses sont calculées). */
'use strict';

const Repere = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const mk = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); kids.forEach(c => e.append(c)); return e; };
  const pick = a => a[Sub.rnd(0, a.length - 1)];
  // Directions SUR L'ÉCRAN (y vers le bas). Tourner à gauche = quart de tour dans le sens inverse des aiguilles d'une montre.
  const FACE = [{ dx: 0, dy: -1, n: 'vers le haut' }, { dx: 1, dy: 0, n: 'vers la droite' }, { dx: 0, dy: 1, n: 'vers le bas' }, { dx: -1, dy: 0, n: 'vers la gauche' }];
  const left = f => ({ dx: f.dy, dy: -f.dx }), right = f => ({ dx: -f.dy, dy: f.dx });
  const scr = v => v.dx === 0 ? (v.dy < 0 ? 'en haut' : 'en bas') : (v.dx > 0 ? 'à droite' : 'à gauche');
  const relVec = (f, rel) => rel === 'left' ? left(f) : rel === 'right' ? right(f) : rel === 'front' ? f : { dx: -f.dx, dy: -f.dy };
  const ARROW = ['▲', '▶', '▼', '◀'];
  const score = () => { const s = { n: 0, ok: 0 }; const el = h('p', { class: 'muted', 'aria-live': 'polite' }); return { el, add: ok => { s.n++; if (ok) s.ok++; el.textContent = `Score : ${s.ok} bonne(s) réponse(s) sur ${s.n}.`; Sub.logEx('repere', ok); } }; };
  const say = (b, getText) => Sub.speakBtn(getText, '🔊 Écouter la consigne');

  // ---------------------------------------------------------------- 1. gauche / droite
  const tabGD = b => {
    const sc = score(); const box = h('div', { style: 'text-align:center' }); const fb = h('p', { 'aria-live': 'polite' }); const qEl = h('p'); const ans = h('div', { class: 'row' }); let st, helpMe = false, showGD = true;
    const REL = [['left', 'à sa gauche'], ['right', 'à sa droite'], ['front', 'devant lui'], ['back', 'derrière lui']];
    const newQ = () => { st = { fi: Sub.rnd(0, 3), rel: pick(REL)[0], item: pick(['🍎', '⚽', '🔑', '🎒', '📕', '🧢']), done: false }; fb.textContent = ''; draw(); };
    const question = () => `${st.item} est posé sur le sol. Où se trouve-t-il par rapport au personnage ?`;
    const draw = () => {
      qEl.textContent = question(); const fi = helpMe ? 0 : st.fi, f = FACE[fi], v = relVec(f, st.rel); const cell = 64, c = 2; const ix = c + 2 * v.dx, iy = c + 2 * v.dy;
      const svg = mk('svg', { viewBox: '0 0 320 320', width: 320, height: 320, role: 'img', style: 'max-width:100%;height:auto', 'aria-label': `Le personnage regarde ${FACE[st.fi].n} de l’écran. ${question()}` });
      for (let i = 0; i <= 5; i++) { svg.append(mk('line', { x1: i * cell, y1: 0, x2: i * cell, y2: 320, stroke: '#9ca3af', 'stroke-width': 1 }), mk('line', { x1: 0, y1: i * cell, x2: 320, y2: i * cell, stroke: '#9ca3af', 'stroke-width': 1 })); }
      const it = mk('text', { x: (ix + .5) * cell, y: (iy + .5) * cell, 'font-size': 34, 'text-anchor': 'middle', 'dominant-baseline': 'central' }); it.textContent = st.item; svg.append(it);
      const ang = fi * 90; const g = mk('g', { transform: `translate(160 160) rotate(${ang})` });
      const hand = (x, label, col) => { const hg = mk('g', { transform: `translate(${x} 0)` }, mk('circle', { r: 11, fill: col, stroke: '#111827', 'stroke-width': 1.5 })); if (showGD) { const t = mk('text', { 'font-size': 13, 'font-weight': 700, 'text-anchor': 'middle', 'dominant-baseline': 'central', fill: '#fff', transform: `rotate(${-ang})` }); t.textContent = label; hg.append(t); } return hg; };
      g.append(mk('circle', { r: 20, fill: '#93c5fd', stroke: '#111827', 'stroke-width': 1.5 }), mk('polygon', { points: '0,-34 -10,-18 10,-18', fill: '#1d4ed8' }), mk('circle', { cx: -7, cy: -7, r: 3, fill: '#fff', stroke: '#111827' }), mk('circle', { cx: 7, cy: -7, r: 3, fill: '#fff', stroke: '#111827' }), hand(-31, 'G', '#2563eb'), hand(31, 'D', '#dc2626'));
      svg.append(g); box.replaceChildren(svg);
    };
    const reply = rel => { if (st.done) return; st.done = true; const ok = rel === st.rel; sc.add(ok); const f = FACE[st.fi]; const name = REL.find(r => r[0] === st.rel)[1]; fb.replaceChildren(h('b', null, ok ? '✅ Bien vu ! ' : '❌ Pas tout à fait. '), `Le personnage regarde ${f.n} de l’écran. Sa gauche est ${scr(left(f))} de l’écran, sa droite est ${scr(right(f))} de l’écran. ${st.item} est ${name}.`); };
    REL.forEach(([k, l]) => ans.append(h('button', { class: 'btn sec', onclick: () => reply(k) }, l)));
    const ck1 = h('input', { type: 'checkbox', onchange: ev => { helpMe = ev.target.checked; draw(); } }), ck2 = h('input', { type: 'checkbox', checked: true, onchange: ev => { showGD = ev.target.checked; draw(); } });
    b.append(Sub.notice('secondary', h('b', null, 'Mise en situation : '), 'tu vois la scène d’en haut. Le personnage regarde dans la direction de son nez (le triangle). Sa main gauche (G, bleue) et sa main droite (D, rouge) sont les siennes, pas les tiennes.'),
      h('h3', { style: 'margin-top:0' }, 'Gauche et droite du personnage'), qEl, box, h('div', { class: 'row' }, h('label', { class: 'chk' }, ck1, 'Me mettre à sa place (la scène tourne : il regarde vers le haut, comme moi)'), h('label', { class: 'chk' }, ck2, 'Écrire G et D sur ses mains')), ans, fb, sc.el, h('div', { class: 'row' }, h('button', { class: 'btn', onclick: newQ }, 'Nouvelle situation'), Sub.speakBtn(() => question(), '🔊 Écouter la consigne'))); newQ();
  };

  // ---------------------------------------------------------------- 2. suivre un trajet
  const tabTrajet = b => {
    const N = 6, cell = 54; const sc = score(); const gridBox = h('div'); const steps = h('ol'); const fb = h('p', { 'aria-live': 'polite' }); const sit = h('p'); let st, sim, over;
    const SIT = ['Tu marches dans le couloir de l’école.', 'Tu guides un ami dans le parc.', 'Tu cherches la bibliothèque dans le quartier.', 'Un robot-jouet doit rejoindre sa base.', 'Tu suis un plan donné par un voisin.'];
    const label = s => s.fwd ? `Avance de ${s.fwd} case${s.fwd > 1 ? 's' : ''}.` : `Tourne à ${s.turn === 'left' ? 'gauche' : 'droite'} (un quart de tour).`;
    const make = () => { for (let t = 0; t < 300; t++) { let x = Sub.rnd(0, N - 1), y = Sub.rnd(0, N - 1), fi = Sub.rnd(0, 3); const start = { x, y, fi }; const list = [], trace = [{ x, y }]; let good = true; const nSeg = Sub.rnd(2, 3);
      for (let s = 0; s < nSeg && good; s++) { if (s > 0) { const turn = pick(['left', 'right']); fi = (fi + (turn === 'right' ? 1 : 3)) % 4; list.push({ turn }); } const k = Sub.rnd(1, 3); const nx = x + FACE[fi].dx * k, ny = y + FACE[fi].dy * k; if (nx < 0 || ny < 0 || nx >= N || ny >= N) { good = false; break; } list.push({ fwd: k }); for (let j = 1; j <= k; j++) trace.push({ x: x + FACE[fi].dx * j, y: y + FACE[fi].dy * j }); x = nx; y = ny; }
      if (good && list.length >= 3) return { start, list, trace, end: { x, y }, endFi: fi }; } return null; };
    const newQ = () => { st = make(); sim = { x: st.start.x, y: st.start.y, fi: st.start.fi, p: 0, seen: [{ x: st.start.x, y: st.start.y }] }; over = false; fb.textContent = ''; sit.textContent = pick(SIT); steps.replaceChildren(...st.list.map((s, i) => h('li', { id: 'st' + i }, label(s)))); draw(); };
    const draw = (reveal) => {
      const g = h('div', { style: `display:grid;grid-template-columns:repeat(${N},${cell}px);gap:3px;justify-content:center` }); const seen = new Set(sim.seen.map(c => c.x + ',' + c.y));
      for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const here = sim.x === x && sim.y === y; const isEnd = reveal && st.end.x === x && st.end.y === y;
        g.append(h('button', { class: 'scell' + (isEnd ? ' ok' : seen.has(x + ',' + y) && (sim.p > 0 || reveal) ? ' hint' : ''), style: `width:${cell}px;height:${cell}px;font-size:${cell * .5}px`, 'aria-label': `case colonne ${x + 1}, ligne ${y + 1}${here ? ', le personnage est ici, il regarde ' + FACE[sim.fi].n : ''}`, onclick: () => answer(x, y) }, isEnd ? '🏁' : here ? ARROW[sim.fi] : '')); }
      gridBox.replaceChildren(g);
    };
    const answer = (x, y) => { if (over) return; over = true; const ok = x === st.end.x && y === st.end.y; sc.add(ok); sim = { x: st.end.x, y: st.end.y, fi: st.endFi, p: st.list.length, seen: st.trace }; fb.replaceChildren(h('b', null, ok ? '✅ Bravo, tu arrives bien sur la case 🏁. ' : '❌ Ce n’est pas la bonne case. '), ok ? '' : 'La case jaune montre le vrai trajet, 🏁 est l’arrivée.'); draw('end'); };
    const stepOnce = () => { if (over || sim.p >= st.list.length) return; const s = st.list[sim.p]; if (s.turn) sim.fi = (sim.fi + (s.turn === 'right' ? 1 : 3)) % 4; else for (let j = 0; j < s.fwd; j++) { sim.x += FACE[sim.fi].dx; sim.y += FACE[sim.fi].dy; sim.seen.push({ x: sim.x, y: sim.y }); } document.querySelectorAll('#main ol li').forEach((li, i) => li.style.fontWeight = i === sim.p ? '700' : ''); sim.p++; draw(); };
    const text = () => st.list.map(label).join(' ');
    b.append(Sub.notice('secondary', h('b', null, 'Mise en situation : '), 'tu pars de la case où se trouve la flèche. La flèche montre où tu regardes. « Tourne à gauche » = un quart de tour vers TA gauche. Clique sur la case d’arrivée. Le bouton « Pas à pas » rejoue le trajet une consigne à la fois.'), h('h3', { style: 'margin-top:0' }, 'Suivre un trajet'), sit, h('p', null, h('b', null, 'Consignes :')), steps, gridBox, fb, sc.el,
      h('div', { class: 'row' }, h('button', { class: 'btn sec', onclick: stepOnce }, '👣 Pas à pas'), Sub.speakBtn(text, '🔊 Écouter les consignes'), h('button', { class: 'btn', onclick: newQ }, 'Nouveau trajet'))); newQ();
  };

  // ---------------------------------------------------------------- 3. quadrillage
  const tabCoord = b => {
    const N = 6, L = 'ABCDEF', cell = 52; const sc = score(); const area = h('div'); const fb = h('p', { 'aria-live': 'polite' }); const ask = h('p', { style: 'font-weight:700' }); let mode = 'place', aid = true, st;
    const ref = (x, y) => L[x] + (y + 1);
    const build = (onCell, mark, tgt, wrong) => {
      const g = h('div', { style: `display:grid;grid-template-columns:repeat(${N + 1},${cell}px);gap:3px;justify-content:center` }); const cells = [];
      const hl = (x, y, on) => { if (!aid) return; cells.forEach(c => c.el.classList.toggle('on', on && (c.x === x || c.y === y))); };
      g.append(h('span')); for (let x = 0; x < N; x++) g.append(h('b', { style: 'text-align:center;align-self:center' }, L[x]));
      for (let y = 0; y < N; y++) { g.append(h('b', { style: 'text-align:center;align-self:center' }, String(y + 1))); for (let x = 0; x < N; x++) { const isT = tgt && tgt.x === x && tgt.y === y; const el = h('button', { class: 'scell' + (isT ? ' ok' : wrong && (wrong.x === x || wrong.y === y) ? ' hint' : ''), style: `width:${cell}px;height:${cell}px;font-size:${cell * .5}px`, 'aria-label': `case ${ref(x, y)}`, onclick: () => onCell && onCell(x, y) }, mark && mark.x === x && mark.y === y ? '⭐' : ''); el.addEventListener('pointerenter', () => hl(x, y, true)); el.addEventListener('pointerleave', () => hl(x, y, false)); cells.push({ el, x, y }); g.append(el); } }
      return g;
    };
    const newQ = () => { fb.textContent = ''; const x = Sub.rnd(0, N - 1), y = Sub.rnd(0, N - 1); st = { x, y, done: false };
      if (mode === 'place') { ask.textContent = `Clique sur la case ${ref(x, y)} (colonne ${L[x]}, ligne ${y + 1}).`; area.replaceChildren(build((cx, cy) => { if (st.done) return; st.done = true; const ok = cx === x && cy === y; sc.add(ok); fb.replaceChildren(h('b', null, ok ? '✅ Bravo ! ' : '❌ Pas cette case. '), `${ref(x, y)} = colonne ${L[x]} (la lettre, en haut) + ligne ${y + 1} (le chiffre, à gauche).`); area.replaceChildren(build(null, null, { x, y }, ok ? null : { x, y })); }, null)); }
      else { ask.textContent = 'Quelle est la case de l’étoile ⭐ ? (la lettre d’abord, puis le chiffre)'; const opts = new Set([ref(x, y), ref(x, (y + Sub.rnd(1, N - 1)) % N), ref((x + Sub.rnd(1, N - 1)) % N, y)]); while (opts.size < 4) opts.add(ref(Sub.rnd(0, N - 1), Sub.rnd(0, N - 1))); const row = h('div', { class: 'row' }, Sub.shuffle([...opts]).map(o => h('button', { class: 'btn sec', onclick: () => { if (st.done) return; st.done = true; const ok = o === ref(x, y); sc.add(ok); fb.replaceChildren(h('b', null, ok ? '✅ Exact ! ' : '❌ Non. '), `L’étoile est dans la colonne ${L[x]} et la ligne ${y + 1} : ${ref(x, y)}.`); area.replaceChildren(build(null, { x, y }, { x, y }, null), row); } }, o)));
        area.replaceChildren(build(null, { x, y }, null, null), row); }
    };
    const sel = (m, l) => h('button', { class: 'btn sec', onclick: () => { mode = m; newQ(); } }, l);
    const ck = h('input', { type: 'checkbox', checked: true, onchange: ev => { aid = ev.target.checked; } });
    b.append(Sub.notice('secondary', h('b', null, 'Comme sur une feuille quadrillée ou une bataille navale : '), 'la colonne se lit en haut (lettre), la ligne à gauche (chiffre, la ligne 1 est tout en haut). On dit toujours la lettre, puis le chiffre.'), h('h3', { style: 'margin-top:0' }, 'Se repérer sur un quadrillage'), h('div', { class: 'row' }, sel('place', '🖱️ Placer une case'), sel('read', '⭐ Lire une case'), h('label', { class: 'chk' }, ck, 'Surligner la colonne et la ligne quand je survole une case')), ask, area, fb, sc.el, h('div', { class: 'row' }, h('button', { class: 'btn', onclick: newQ }, 'Question suivante'), Sub.speakBtn(() => ask.textContent, '🔊 Écouter la consigne'))); newQ();
  };

  // ---------------------------------------------------------------- 4. points cardinaux
  const tabCardinaux = b => {
    const N = 6, cell = 52; const sc = score(); const area = h('div'); const fb = h('p', { 'aria-live': 'polite' }); const ask = h('p', { style: 'font-weight:700' }); let st;
    const PL = [['🏫', 'l’école'], ['🏊', 'la piscine'], ['🌳', 'le parc'], ['🏪', 'la boulangerie'], ['📚', 'la bibliothèque']];
    const DIR = [['Nord', 0, -1], ['Est', 1, 0], ['Sud', 0, 1], ['Ouest', -1, 0]];
    const newQ = () => { fb.textContent = ''; const [a, bb] = Sub.shuffle(PL.slice()).slice(0, 2); let A, B;
      for (let t = 0; t < 300; t++) { A = { x: Sub.rnd(0, N - 1), y: Sub.rnd(0, N - 1) }; const d = pick(DIR); const k = Sub.rnd(2, 4); B = { x: A.x + d[1] * k, y: A.y + d[2] * k }; if (B.x >= 0 && B.y >= 0 && B.x < N && B.y < N) { st = { a, b: bb, A, B, ans: d[0], done: false }; break; } }
      ask.textContent = `Tu pars de ${a[1]} ${a[0]} et tu vas jusqu’à ${bb[1]} ${bb[0]}. Dans quelle direction marches-tu ?`;
      const draw = (line) => { const g = h('div', { style: `display:grid;grid-template-columns:repeat(${N},${cell}px);gap:3px;justify-content:center` }); const on = new Set(); if (line) { const dx = Math.sign(B.x - A.x), dy = Math.sign(B.y - A.y); for (let x = A.x, y = A.y; ; x += dx, y += dy) { on.add(x + ',' + y); if (x === B.x && y === B.y) break; } }
        for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) g.append(h('div', { class: 'scell' + (on.has(x + ',' + y) ? ' hint' : ''), style: `width:${cell}px;height:${cell}px;font-size:${cell * .5}px;cursor:default`, role: 'img', 'aria-label': x === A.x && y === A.y ? a[1] : x === B.x && y === B.y ? bb[1] : 'case vide' }, x === A.x && y === A.y ? a[0] : x === B.x && y === B.y ? bb[0] : ''));
        return h('div', { style: 'display:flex;gap:1rem;justify-content:center;align-items:center;flex-wrap:wrap' }, h('table', { class: 't', 'aria-label': 'Rose des vents : nord en haut, sud en bas, est à droite, ouest à gauche', style: 'text-align:center;width:auto' }, h('tbody', null, h('tr', null, h('td'), h('td', null, h('b', null, 'N ↑')), h('td')), h('tr', null, h('td', null, h('b', null, 'O ←')), h('td', null, '✚'), h('td', null, h('b', null, 'E →'))), h('tr', null, h('td'), h('td', null, h('b', null, 'S ↓')), h('td')))), g); };
      const row = h('div', { class: 'row' }, DIR.map(d => h('button', { class: 'btn sec', onclick: () => { if (st.done) return; st.done = true; const ok = d[0] === st.ans; sc.add(ok); fb.replaceChildren(h('b', null, ok ? '✅ Exact ! ' : '❌ Non. '), `Sur la carte, le haut est le nord, le bas le sud, la droite l’est, la gauche l’ouest. Pour aller de ${a[1]} à ${bb[1]}, tu vas vers le ${st.ans.toLowerCase()}.`); area.replaceChildren(draw(true), row); } }, d[0])));
      area.replaceChildren(draw(false), row);
    };
    b.append(Sub.notice('secondary', h('b', null, 'Sur une carte, '), 'on place en général le nord en haut (sauf indication contraire sur la carte). Dans la vraie vie, le Soleil se lève environ à l’est et se couche environ à l’ouest : cela aide à garder le cap dehors.'), h('h3', { style: 'margin-top:0' }, 'Les points cardinaux'), ask, area, fb, sc.el, h('div', { class: 'row' }, h('button', { class: 'btn', onclick: newQ }, 'Nouvelle carte'), Sub.speakBtn(() => ask.textContent, '🔊 Écouter la consigne'))); newQ();
  };

  // ---------------------------------------------------------------- 5. mots de position
  const WORDS = [
    { id: 'sur', w: 'sur', g: 0, s: 'La balle est sur la boîte.', tip: 'ça touche, par-dessus' }, { id: 'audessus', w: 'au-dessus de', g: 0, s: 'La balle est au-dessus de la boîte.', tip: 'plus haut, ça ne touche pas' },
    { id: 'sous', w: 'sous', g: 1, s: 'La balle est sous la table.', tip: 'ça touche presque, par-dessous' }, { id: 'endessous', w: 'en dessous de', g: 1, s: 'La balle est en dessous de la boîte.', tip: 'plus bas, ça ne touche pas' },
    { id: 'dans', w: 'dans', g: 2, s: 'La balle est dans la boîte.', tip: 'à l’intérieur' }, { id: 'devant', w: 'devant', g: 3, s: 'La balle est devant la boîte.', tip: 'on la voit en entier, la boîte est derrière' },
    { id: 'derriere', w: 'derrière', g: 4, s: 'La balle est derrière la boîte.', tip: 'la boîte la cache un peu' }, { id: 'gauche', w: 'à gauche de', g: 5, s: 'La balle est à gauche de la boîte.', tip: 'du côté de ta main gauche' },
    { id: 'droite', w: 'à droite de', g: 6, s: 'La balle est à droite de la boîte.', tip: 'du côté de ta main droite' }, { id: 'entre', w: 'entre', g: 7, s: 'La balle est entre les deux boîtes.', tip: 'au milieu de deux choses' }];
  const wordSVG = id => {
    const svg = mk('svg', { viewBox: '0 0 200 200', width: 160, height: 160, role: 'img', 'aria-label': WORDS.find(w => w.id === id).s, style: 'max-width:100%;height:auto' }); svg.append(mk('line', { x1: 10, y1: 135, x2: 190, y2: 135, stroke: '#6b7280', 'stroke-width': 2 }));
    const box = (x = 75, y = 85, w = 50, hh = 50) => mk('rect', { x, y, width: w, height: hh, fill: '#fcd34d', stroke: '#111827', 'stroke-width': 2 }); const ball = (cx, cy, r = 14) => mk('circle', { cx, cy, r, fill: '#ef4444', stroke: '#111827', 'stroke-width': 2 });
    if (id === 'sur') svg.append(box(), ball(100, 71)); else if (id === 'audessus') svg.append(box(), ball(100, 38));
    else if (id === 'sous') svg.append(mk('rect', { x: 62, y: 85, width: 76, height: 12, fill: '#fcd34d', stroke: '#111827', 'stroke-width': 2 }), mk('rect', { x: 66, y: 97, width: 7, height: 38, fill: '#a16207' }), mk('rect', { x: 127, y: 97, width: 7, height: 38, fill: '#a16207' }), ball(100, 121));
    else if (id === 'endessous') svg.append(box(75, 40, 50, 50), ball(100, 168));
    else if (id === 'dans') svg.append(ball(100, 121), mk('path', { d: 'M75 85 V135 H125 V85', fill: 'none', stroke: '#111827', 'stroke-width': 4 }), mk('path', { d: 'M77 87 V133 H123 V87', fill: 'none', stroke: '#fcd34d', 'stroke-width': 4 }));
    else if (id === 'devant') svg.append(box(), ball(100, 128, 17)); else if (id === 'derriere') svg.append(ball(100, 82), box());
    else if (id === 'gauche') svg.append(box(), ball(48, 121)); else if (id === 'droite') svg.append(box(), ball(152, 121));
    else if (id === 'entre') svg.append(box(25, 95, 40, 40), box(135, 95, 40, 40), ball(100, 121));
    return svg;
  };
  const tabMots = b => {
    const sc = score(); const quiz = h('div'); const fb = h('p', { 'aria-live': 'polite' }); let st;
    const cards = h('div', { class: 'grid g3' }, WORDS.map(w => h('div', { class: 'card', style: 'text-align:center' }, wordSVG(w.id), h('div', null, h('b', null, w.w)), h('div', { class: 'muted' }, w.tip))));
    const newQ = () => { fb.textContent = ''; const good = pick(WORDS); const others = Sub.shuffle(WORDS.filter(w => w.g !== good.g)); const seenG = new Set([good.g]); const opts = [good]; others.forEach(w => { if (opts.length < 4 && !seenG.has(w.g)) { seenG.add(w.g); opts.push(w); } }); st = { good, done: false };
      quiz.replaceChildren(h('div', { style: 'text-align:center' }, wordSVG(good.id)), h('p', null, 'La balle 🔴 est … la boîte. Quel mot choisis-tu ?'), h('div', { class: 'row' }, Sub.shuffle(opts).map(o => h('button', { class: 'btn sec', onclick: () => { if (st.done) return; st.done = true; const ok = o === good; sc.add(ok); fb.replaceChildren(h('b', null, ok ? '✅ Oui ! ' : '❌ Non. '), good.s, ` (${good.tip})`); } }, o.w)))); };
    b.append(Sub.notice('secondary', 'Les mots de position (sur, sous, dans, devant, derrière…) se ressemblent. Chaque mot est dessiné. Retiens la différence : « sur » touche, « au-dessus de » ne touche pas ; « sous » touche presque, « en dessous de » ne touche pas.'), h('h3', { style: 'margin-top:0' }, 'Les mots pour se situer'), cards, h('h3', null, 'Entraîne-toi'), quiz, fb, sc.el, h('div', { class: 'row' }, h('button', { class: 'btn', onclick: newQ }, 'Autre image'))); newQ();
  };


  // ---------------------------------------------------------------- 0. mises en situation : un plan vu d'en haut, la personne est le rond « Toi »
  // Tout est calculé à partir des positions (aucune réponse écrite à la main) : si la figure montre la porte à gauche, la réponse attendue est « à ta gauche ».
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
  const SITS = [
    { id: 'chambre', t: 'Ta chambre', intro: 'Tu es dans ta chambre.', obj: [['🚪', 'la porte'], ['🪟', 'la fenêtre'], ['🛏️', 'le lit'], ['📚', 'l’étagère'], ['🪑', 'le bureau'], ['🧸', 'le coffre à jouets']] },
    { id: 'classe', t: 'La classe', intro: 'Tu es dans la salle de classe.', obj: [['🚪', 'la porte'], ['🪟', 'la fenêtre'], ['🟩', 'le tableau'], ['📚', 'la bibliothèque'], ['🗑️', 'la poubelle'], ['🧑‍🏫', 'le bureau du professeur']] },
    { id: 'cuisine', t: 'La cuisine', intro: 'Tu es dans la cuisine.', obj: [['🚪', 'la porte'], ['🧊', 'le frigo'], ['🚰', 'l’évier'], ['🍳', 'la cuisinière'], ['🪑', 'la table'], ['🗑️', 'la poubelle']] },
    { id: 'parc', t: 'Le parc', intro: 'Tu te promènes dans un parc.', obj: [['⛲', 'la fontaine'], ['🌳', 'l’arbre'], ['🛝', 'le toboggan'], ['🪑', 'le banc'], ['🚲', 'le vélo'], ['🌷', 'le massif de fleurs']] }];
  const SEC = ['devant toi', 'à ta droite', 'derrière toi', 'à ta gauche'], SECC = ['#2a78d6', '#6250d6', '#eb6834', '#1baf7a'];
  const faceOf = v => FACE.find(x => x.dx === v.dx && x.dy === v.dy);
  // 0 devant, 1 droite, 2 derrière, 3 gauche ; -1 si l'objet est pile sur une diagonale (ambigu : on ne pose jamais cette question)
  const sector = (a, f, o) => { const dx = o.x - a.x, dy = o.y - a.y, fw = dx * f.dx + dy * f.dy, r = right(f), rg = dx * r.dx + dy * r.dy; if (Math.abs(fw) === Math.abs(rg)) return -1; return Math.abs(fw) > Math.abs(rg) ? (fw > 0 ? 0 : 2) : (rg > 0 ? 1 : 3); };
  const CELL = 62, PAD = 6, NN = 5;
  const newScene = sid => { const S = sid ? SITS.find(x => x.id === sid) : pick(SITS), cells = Sub.shuffle([...Array(NN * NN).keys()]), take = () => { const c = cells.pop(); return { x: c % NN, y: Math.floor(c / NN) }; };
    const a = take(), objs = Sub.shuffle(S.obj).slice(0, 5).map(o => ({ e: o[0], n: o[1], ...take() })); return { S, a, objs, f: pick(FACE) }; };
  const plan = (sc, o = {}) => {
    const W = NN * CELL + PAD * 2, f = o.f || sc.f, r = right(f), cx = p => PAD + (p.x + .5) * CELL, cy = p => PAD + (p.y + .5) * CELL, id = 'cp' + Math.random().toString(36).slice(2, 7);
    const svg = mk('svg', { viewBox: `0 0 ${W} ${W}`, width: '100%', role: 'img', style: 'max-width:380px;display:block;margin:0 auto', 'aria-label': 'Plan vu d’en haut. ' + sc.S.intro + ' Le rond « Toi » regarde ' + f.n + '. ' + (sc.objs || []).map(x => x.n + ' : colonne ' + (x.x + 1) + ', ligne ' + (x.y + 1)).join(' ; ') });
    svg.append(mk('defs', {}, mk('clipPath', { id }, mk('rect', { x: PAD, y: PAD, width: NN * CELL, height: NN * CELL }))));
    for (let y = 0; y < NN; y++) for (let x = 0; x < NN; x++) svg.append(mk('rect', { x: PAD + x * CELL, y: PAD + y * CELL, width: CELL, height: CELL, fill: 'var(--panel)', stroke: 'var(--line)', 'stroke-width': 1 }));
    if (o.help) { const c = { x: cx(sc.a), y: cy(sc.a) }, F = 1200, pt = (v, w) => (c.x + F * (v.dx + w.dx)) + ',' + (c.y + F * (v.dy + w.dy)), nf = { dx: -f.dx, dy: -f.dy }, nr = { dx: -r.dx, dy: -r.dy };
      const wedge = (v, a1, a2, col, i) => mk('polygon', { points: `${c.x},${c.y} ${pt(v, a1)} ${pt(v, a2)}`, fill: col, opacity: .2, 'clip-path': `url(#${id})` });
      svg.append(wedge(f, nr, r, SECC[0]), wedge(r, f, nf, SECC[1]), wedge(nf, r, nr, SECC[2]), wedge(nr, nf, f, SECC[3]));
      [[f, 'devant', 0], [r, 'droite', 1], [nf, 'derrière', 2], [nr, 'gauche', 3]].forEach(([v, tx, i]) => { const x = Math.max(PAD + 24, Math.min(PAD + NN * CELL - 24, c.x + v.dx * 2 * CELL)), y = Math.max(PAD + 10, Math.min(PAD + NN * CELL - 6, c.y + v.dy * 2 * CELL)); const t = mk('text', { x, y, 'text-anchor': 'middle', 'font-size': 13, 'font-weight': 700, fill: 'currentColor', stroke: 'var(--panel)', 'stroke-width': 3, 'paint-order': 'stroke', 'pointer-events': 'none' }); t.textContent = tx; svg.append(t); }); }
    (sc.objs || []).forEach(x => { const t = mk('text', { x: cx(x), y: cy(x) + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 32 }); t.textContent = x.e; svg.append(t); });
    if (o.path) svg.append(mk('polyline', { points: o.path.map(p => cx(p) + ',' + cy(p)).join(' '), fill: 'none', stroke: '#15803d', 'stroke-width': 5, 'stroke-dasharray': '2 9', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }));
    if (o.star) { const t = mk('text', { x: cx(o.star), y: cy(o.star) + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 36 }); t.textContent = '⭐'; svg.append(t); }
    const a = sc.a, tip = [cx(a) + f.dx * 29, cy(a) + f.dy * 29], b1 = [cx(a) + f.dx * 15 + r.dx * 11, cy(a) + f.dy * 15 + r.dy * 11], b2 = [cx(a) + f.dx * 15 - r.dx * 11, cy(a) + f.dy * 15 - r.dy * 11];
    svg.append(mk('polygon', { points: [tip, b1, b2].map(q => q.join(',')).join(' '), fill: '#1d4ed8', stroke: '#fff', 'stroke-width': 2, 'stroke-linejoin': 'round' }), mk('circle', { cx: cx(a), cy: cy(a), r: 16, fill: '#1d4ed8', stroke: '#fff', 'stroke-width': 2.5 }));
    const tt = mk('text', { x: cx(a), y: cy(a) + 1, 'text-anchor': 'middle', 'dominant-baseline': 'central', 'font-size': 11, 'font-weight': 700, fill: '#fff' }); tt.textContent = 'Toi'; svg.append(tt); return svg; };
  const genRoute = () => { for (let t = 0; t < 300; t++) { const a = { x: Sub.rnd(0, NN - 1), y: Sub.rnd(0, NN - 1) }, f0 = pick(FACE), k1 = Sub.rnd(1, 3), k2 = Sub.rnd(1, 3), turn = pick(['left', 'right']), f1 = turn === 'left' ? left(f0) : right(f0), m = { x: a.x + f0.dx * k1, y: a.y + f0.dy * k1 }, e = { x: m.x + f1.dx * k2, y: m.y + f1.dy * k2 }; if ([m, e].every(q => q.x >= 0 && q.x < NN && q.y >= 0 && q.y < NN)) return { a, f0, k1, k2, turn, m, e }; } };
  const endOf = (a, f0, k1, k2, turn) => { const f1 = turn === 'left' ? left(f0) : right(f0); return { x: a.x + f0.dx * k1 + f1.dx * k2, y: a.y + f0.dy * k1 + f1.dy * k2 }; };
  const routeTxt = (k1, turn, k2) => `Avance de ${k1} case${k1 > 1 ? 's' : ''}, tourne à ${turn === 'left' ? 'gauche' : 'droite'}, puis avance de ${k2} case${k2 > 1 ? 's' : ''}.`;
  const tabSit = b => {
    const sc = score(), prefs = Store.get('repere.sit', { mode: 'where', help: false, set: '' }); let mode = prefs.mode, help = !!prefs.help, setId = prefs.set || '', st = null;
    const MODES = [['where', 'Où est… ?'], ['turn', 'Je me retourne'], ['see', 'Que vois-tu ?'], ['route', 'Quel chemin ?']];
    const modeRow = h('div', { class: 'row', role: 'group', 'aria-label': 'Type de situation' }), view = h('div'), fb = h('p', { 'aria-live': 'polite' });
    const sel = h('select', { 'aria-label': 'Lieu', onchange: ev => { setId = ev.target.value; save(); newQ(); } }, h('option', { value: '' }, 'Lieu au hasard'), SITS.map(x => h('option', { value: x.id, selected: x.id === setId }, x.t)));
    const chk = h('input', { type: 'checkbox', checked: help, onchange: ev => { help = ev.target.checked; save(); if (st && !st.done) draw(); } });
    const save = () => Store.set('repere.sit', { mode, help, set: setId });
    const paintModes = () => modeRow.replaceChildren(...MODES.map(m => h('button', { class: 'btn ' + (m[0] === mode ? '' : 'sec'), type: 'button', 'aria-pressed': String(m[0] === mode), onclick: () => { mode = m[0]; save(); paintModes(); newQ(); } }, m[1])));
    const legend = sc2 => h('p', { class: 'muted', style: 'text-align:center;margin:.3rem 0' }, sc2.objs.map(x => x.e + ' ' + x.n).join('  ·  '));
    const answer = (ok, msg, revealSvg) => { st.done = true; sc.add(ok); fb.replaceChildren(h('b', null, ok ? '✅ Oui ! ' : '❌ Pas tout à fait. '), msg); if (revealSvg) st.box.replaceChildren(revealSvg, ...(st.legend ? [st.legend] : [])); };
    const draw = () => { st.box.replaceChildren(plan(st.sc, { f: st.f, help }), ...(st.legend ? [st.legend] : [])); };
    const newQ = () => { fb.textContent = ''; const sc1 = newScene(setId); let q = '', opts = [], tellOK = null, f = sc1.f, extra = '';
      const box = h('div'), qEl = h('p', { style: 'font-weight:600;font-size:1.1em' }), ans = h('div', { class: 'row', style: 'justify-content:center' });
      st = { sc: sc1, f, done: false, box, legend: null };
      if (mode === 'route') { const R = genRoute(); st.sc = { S: sc1.S, a: R.a, f: R.f0, objs: [] }; st.f = R.f0; st.R = R;
        const good = routeTxt(R.k1, R.turn, R.k2), flip = R.turn === 'left' ? 'right' : 'left', cand = [[R.k1, flip, R.k2], [R.k2, R.turn, R.k1], [R.k2, flip, R.k1], [Math.min(3, R.k1 + 1), R.turn, R.k2], [R.k1, R.turn, Math.min(3, R.k2 + 1)]];
        const seen = new Set([good]), wrong = []; Sub.shuffle(cand).forEach(c => { const t = routeTxt(...c), e = endOf(R.a, R.f0, c[0], c[2], c[1]); if (!seen.has(t) && !(e.x === R.e.x && e.y === R.e.y)) { seen.add(t); wrong.push(t); } });
        opts = Sub.shuffle([good, ...wrong.slice(0, 2)]); q = `${sc1.S.intro} Tu veux aller jusqu’à l’étoile ⭐. Le rond « Toi » regarde ${R.f0.n}. Quelle consigne te mène à l’étoile ?`;
        qEl.textContent = q; box.append(plan(st.sc, { f: R.f0, help, star: R.e }));
        opts.forEach(t => ans.append(h('button', { class: 'btn sec', type: 'button', style: 'text-align:left', onclick: () => { if (st.done) return; const ok = t === good; answer(ok, ok ? 'Tu avances, tu tournes du bon côté, puis tu avances encore.' : `La bonne consigne : « ${good} » Le chemin vert montre le trajet.`, plan(st.sc, { f: R.f0, help: false, star: R.e, path: [R.a, R.m, R.e] })); } }, t)));
      } else {
        const ok = x => x.filter(o => sector(sc1.a, f, o) >= 0);
        if (mode === 'where') { const o = pick(ok(sc1.objs)) || sc1.objs[0]; const s = sector(sc1.a, f, o); q = `${sc1.S.intro} Tu regardes ${f.n} (la flèche). Où se trouve ${o.n} ${o.e} ?`; st.legend = legend(sc1);
          opts = SEC.map((t, i) => [t, i === s]); tellOK = () => `${cap(o.n)} est ${SEC[s]} : tu regardes ${f.n}, donc ta droite est ${scr(right(f))} sur le plan et ta gauche ${scr(left(f))}.`; }
        if (mode === 'turn') { const T = pick([['Tu fais demi-tour', { dx: -f.dx, dy: -f.dy }], ['Tu tournes d’un quart de tour à droite', right(f)], ['Tu tournes d’un quart de tour à gauche', left(f)]]), nf = faceOf(T[1]); const c = sc1.objs.filter(o => { const a = sector(sc1.a, f, o), z = sector(sc1.a, nf, o); return z >= 0 && a >= 0 && z !== a; }); const o = pick(c.length ? c : ok(sc1.objs)) || sc1.objs[0];
          const s = sector(sc1.a, nf, o); q = `${sc1.S.intro} Tu regardes ${f.n}. ${T[0]}. Où se trouve maintenant ${o.n} ${o.e} ?`; st.legend = legend(sc1); opts = SEC.map((t, i) => [t, i === s]); st.after = nf;
          tellOK = () => `Après ce mouvement, tu regardes ${nf.n}. ${cap(o.n)} est ${SEC[s]}.`; }
        if (mode === 'see') { let cnt, cand; for (let t = 0; t < 80; t++) { cnt = i => sc1.objs.filter(o => sector(sc1.a, f, o) === i); cand = [0, 1, 2, 3].filter(i => cnt(i).length === 1); if (cand.length) break; Object.assign(sc1, newScene(setId)); f = sc1.f; st.sc = sc1; st.f = f; } // il faut un côté où il n'y a qu'UN objet, sinon la question serait ambiguë
          const s = pick(cand), o = cnt(s)[0];
          q = `${sc1.S.intro} Tu regardes ${f.n}. Quel objet se trouve ${SEC[s]} ?`; const others = Sub.shuffle(sc1.objs.filter(x => x !== o)).slice(0, 3); opts = Sub.shuffle([o, ...others]).map(x => [x.e + ' ' + x.n, x === o]); tellOK = () => `C’est ${o.n} ${o.e} : il est ${SEC[s]}.`; st.legend = null; }
        qEl.textContent = q; box.append(plan(sc1, { f, help }), ...(st.legend ? [st.legend] : []));
        opts.forEach(([t, good]) => ans.append(h('button', { class: 'btn sec', type: 'button', onclick: () => { if (st.done) return; answer(good, tellOK(), plan(sc1, { f: st.after || f, help: true })); } }, cap(t))));
      }
      st.box = box; st.q = q; view.replaceChildren(box, qEl, h('div', { class: 'row', style: 'justify-content:center' }, Sub.speakBtn(() => st.q, '🔊 Écouter la consigne')), ans); };
    b.append(Sub.notice('secondary', h('b', null, 'Mises en situation : '), 'un plan vu d’en haut, comme sur une feuille. Tu es le rond bleu « Toi » ; la flèche montre là où tu regardes. Prends ton temps : il n’y a pas de chronomètre. Les bonnes réponses sont calculées à partir du plan, jamais écrites à la main.'),
      h('div', { class: 'row', style: 'align-items:center' }, modeRow, sel, h('label', { class: 'chk', title: 'Colorie les zones devant / à droite / derrière / à gauche autour de toi' }, chk, 'Aide : montrer les zones')), view, fb, sc.el, h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: newQ }, 'Autre situation')));
    paintModes(); newQ(); };

  App.reg({ id: 'mode-spatial', title: 'Repérage dans l’espace', group: 'modes', icon: '🧭', learn: true, render(el) {
    el.append(h('h1', null, '🧭 Repérage dans l’espace'), Sub.notice('secondary', h('b', null, 'Pour qui ? '), 'pour toute personne qui veut s’entraîner à se repérer : mises en situation (ta chambre, la classe, la cuisine, le parc), gauche et droite, suivre un plan, lire un quadrillage, utiliser les points cardinaux. C’est un entraînement facultatif : il ne pose aucun diagnostic et n’est pas une solution valable pour tout le monde. Les situations sont générées au hasard et les réponses sont calculées.'));
    Sub.tabs(el, [['Mises en situation', tabSit], ['Gauche / droite', tabGD], ['Suivre un trajet', tabTrajet], ['Quadrillage', tabCoord], ['Points cardinaux', tabCardinaux], ['Mots de position', tabMots]]);
  } });
  return { FACE, left, right, relVec, scr };
})();
