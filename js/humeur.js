// Courbes de « comment je me sens » : note sur 10, par heure, jour, semaine, mois, année.
// Les points viennent UNIQUEMENT des notes que la personne a données (Store 'etat.log', sur cet appareil). Rien n'est inventé ni complété.
// Palette validée (scripts/validate_palette.js, clair + sombre) ; couleur = identité (jamais la couleur seule : formes de points, légende, tableau des chiffres).
const Humeur = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const sv = (tag, a = {}, ...kids) => { const e = document.createElementNS(NS, tag); for (const [k, v] of Object.entries(a)) e.setAttribute(k, v); kids.forEach(c => c != null && e.append(c)); return e; };
  const SER = [
    { k: 'g', t: 'Global', v: '--sv-g', shape: 'circle' },
    { k: 'p', t: 'Corps', v: '--sv-p', shape: 'square' },
    { k: 'e', t: 'Émotions', v: '--sv-e', shape: 'triangle' },
    { k: 'm', t: 'Tête', v: '--sv-m', shape: 'diamond' }];
  const PER = [['h', 'Heures', '24 dernières heures'], ['d', 'Jours', '14 derniers jours'], ['w', 'Semaines', '12 dernières semaines'], ['mo', 'Mois', '12 derniers mois'], ['y', 'Années', '5 dernières années']];
  const MODES = [['g', 'Global', ['g']], ['p', 'Corps', ['p']], ['e', 'Émotions', ['e']], ['m', 'Tête', ['m']], ['3', 'Les trois', ['p', 'e', 'm']]];
  const fmt = n => (Math.round(n * 10) / 10).toString().replace('.', ',');
  const F = o => new Intl.DateTimeFormat('fr-FR', o);
  const f = { h: F({ hour: 'numeric' }), day: F({ weekday: 'short', day: 'numeric' }), dayL: F({ weekday: 'long', day: 'numeric', month: 'long' }), dm: F({ day: 'numeric', month: 'short' }), mon: F({ month: 'short' }), monL: F({ month: 'long', year: 'numeric' }), hL: F({ weekday: 'short', day: 'numeric', month: 'short' }) };
  const sers = k => SER.find(s => s.k === k);

  const val = (e, k) => {
    if (k !== 'g') { const x = e['s' + k]; return typeof x === 'number' ? x : null; }
    const v = ['sp', 'se', 'sm'].map(x => e[x]).filter(x => typeof x === 'number'); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
  };
  const hasScore = e => ['sp', 'se', 'sm'].some(x => typeof e[x] === 'number');

  const buckets = per => {
    const n = new Date(), Y = n.getFullYear(), M = n.getMonth(), D = n.getDate(), H = n.getHours(), out = [];
    if (per === 'h') for (let i = 23; i >= 0; i--) { const a = new Date(Y, M, D, H - i), b = new Date(Y, M, D, H - i + 1); out.push({ a: +a, b: +b, l: a.getHours() % 3 === 0 ? a.getHours() + ' h' : '', full: f.hL.format(a) + ', ' + a.getHours() + ' h' }); }
    if (per === 'd') for (let i = 13; i >= 0; i--) { const a = new Date(Y, M, D - i), b = new Date(Y, M, D - i + 1); out.push({ a: +a, b: +b, l: f.day.format(a), full: f.dayL.format(a) }); }
    if (per === 'w') { const mon = D - ((n.getDay() + 6) % 7); for (let i = 11; i >= 0; i--) { const a = new Date(Y, M, mon - 7 * i), b = new Date(Y, M, mon - 7 * i + 7), z = new Date(+b - 864e5); out.push({ a: +a, b: +b, l: f.dm.format(a), full: 'Semaine du ' + f.dm.format(a) + ' au ' + f.dm.format(z) }); } }
    if (per === 'mo') for (let i = 11; i >= 0; i--) { const a = new Date(Y, M - i, 1), b = new Date(Y, M - i + 1, 1); out.push({ a: +a, b: +b, l: f.mon.format(a) + (a.getMonth() === 0 || i === 11 ? ' ' + String(a.getFullYear()).slice(2) : ''), full: f.monL.format(a) }); }
    if (per === 'y') for (let i = 4; i >= 0; i--) { const a = new Date(Y - i, 0, 1), b = new Date(Y - i + 1, 0, 1); out.push({ a: +a, b: +b, l: String(a.getFullYear()), full: 'Année ' + a.getFullYear() }); }
    return out;
  };
  // moyenne par case de temps, pour chaque série ; n = nombre de fois où la personne a noté
  const aggregate = (log, per) => {
    const B = buckets(per), L = log.filter(hasScore);
    B.forEach(b => { const es = L.filter(e => e.t >= b.a && e.t < b.b); b.n = es.length; b.v = {}; SER.forEach(s => { const xs = es.map(e => val(e, s.k)).filter(x => x != null); b.v[s.k] = xs.length ? xs.reduce((p, q) => p + q, 0) / xs.length : null; }); });
    return B;
  };

  const marker = (shape, x, y, color, r = 5) => {
    const a = { fill: color, stroke: 'var(--panel)', 'stroke-width': 2 };
    if (shape === 'square') return sv('rect', { ...a, x: x - r + .5, y: y - r + .5, width: 2 * r - 1, height: 2 * r - 1, rx: 1.5 });
    if (shape === 'triangle') return sv('path', { ...a, d: `M${x} ${y - r - 1}L${x + r + 1} ${y + r - 1}L${x - r - 1} ${y + r - 1}Z`, 'stroke-linejoin': 'round' });
    if (shape === 'diamond') return sv('path', { ...a, d: `M${x} ${y - r - 1}L${x + r + 1} ${y}L${x} ${y + r + 1}L${x - r - 1} ${y}Z`, 'stroke-linejoin': 'round' });
    return sv('circle', { ...a, cx: x, cy: y, r });
  };

  const mount = () => {
    let st = Object.assign({ per: 'd', mode: 'g' }, Store.get('etat.chart', {}) || {}); if (!PER.some(p => p[0] === st.per)) st.per = 'd'; if (!MODES.some(m => m[0] === st.mode)) st.mode = 'g';
    const root = h('section', { class: 'hm', 'aria-labelledby': 'hmTitle' });
    const perBtns = h('div', { class: 'hm-seg', role: 'group', 'aria-label': 'Période' }), serBtns = h('div', { class: 'hm-seg', role: 'group', 'aria-label': 'Ce qu’on affiche' });
    const body = h('div', { class: 'hm-body' }), stats = h('div', { class: 'hm-stats' }), legend = h('div', { class: 'hm-legend' }), table = h('details', { class: 'hm-table' });
    root.append(h('div', { class: 'hm-head' }, h('h3', { id: 'hmTitle' }, '📈 Mon évolution'), h('p', { class: 'muted' }, 'Ta note sur 10, moyenne par période. Seulement ce que tu as noté.')),
      h('div', { class: 'hm-filters' }, perBtns, serBtns), legend, body, stats, table,
      h('p', { class: 'hm-note' }, 'Global = moyenne des notes que tu as données à chaque fois. Ces courbes restent sur cet appareil ; elles ne mesurent pas ta santé et ne remplacent pas un professionnel.'));
    const tip = h('div', { class: 'hm-tip', role: 'status', hidden: true });

    const draw = () => {
      const log = Store.get('etat.log', []), B = aggregate(log, st.per), mode = MODES.find(m => m[0] === st.mode), keys = mode[2], active = keys.map(sers);
      const per = PER.find(p => p[0] === st.per), total = B.reduce((a, b) => a + b.n, 0), everything = log.some(hasScore);
      perBtns.replaceChildren(...PER.map(p => h('button', { type: 'button', class: 'hm-b', 'aria-pressed': String(p[0] === st.per), onclick: () => { st.per = p[0]; Store.set('etat.chart', st); draw(); } }, p[1])));
      serBtns.replaceChildren(...MODES.map(m => { const s = m[0] === '3' ? null : sers(m[0]); return h('button', { type: 'button', class: 'hm-b', 'aria-pressed': String(m[0] === st.mode), onclick: () => { st.mode = m[0]; Store.set('etat.chart', st); draw(); } }, s ? h('i', { class: 'hm-dot', style: 'background:var(' + s.v + ')', 'aria-hidden': 'true' }) : null, m[1]); }));
      legend.replaceChildren(...active.map(s => h('span', { class: 'hm-key' }, svgKey(s), s.t)), h('span', { class: 'muted' }, '· ' + per[2]));
      body.replaceChildren(); stats.replaceChildren(); table.replaceChildren();
      if (!everything) { body.append(h('div', { class: 'hm-empty' }, h('b', null, 'Pas encore de note.'), h('span', null, 'Choisis une note de 1 à 10 plus haut : elle apparaîtra ici, avec l’heure et le jour. Rien n’est affiché tant que tu n’as rien noté.'))); return; }
      const wrap = h('div', { class: 'hm-wrap' }); body.append(wrap);
      const W = Math.max(280, Math.round(wrap.getBoundingClientRect().width || body.getBoundingClientRect().width || 640)), Ht = W < 460 ? 250 : 290, L = 34, R = 16, T = 16, Bm = 36, pw = W - L - R, ph = Ht - T - Bm, n = B.length;
      const X = i => L + (i + .5) * pw / n, Y = v => T + ph - (v / 10) * ph;
      const svg = sv('svg', { width: W, height: Ht, viewBox: `0 0 ${W} ${Ht}`, class: 'hm-svg', tabindex: '0', role: 'group', 'aria-label': `Courbe de ${active.map(s => s.t).join(', ')} sur 10, ${per[2]}. ${total} note(s). Flèches gauche et droite pour parcourir ; le tableau des chiffres est juste en dessous.` });
      [0, 2, 4, 6, 8, 10].forEach(t => { svg.append(sv('line', { x1: L, x2: W - R, y1: Y(t), y2: Y(t), class: 'hm-grid' })); svg.append(sv('text', { x: L - 8, y: Y(t) + 4, 'text-anchor': 'end', class: 'hm-ax' }, String(t))); });
      const step = Math.max(1, Math.ceil(Math.max(...B.map(b => b.l.length)) * 7.5 / (pw / n))); B.forEach((b, i) => { if (b.l && (n - 1 - i) % step === 0) svg.append(sv('text', { x: X(i), y: Ht - 12, 'text-anchor': 'middle', class: 'hm-ax' }, b.l)); });
      const cross = sv('line', { y1: T, y2: T + ph, class: 'hm-cross', visibility: 'hidden' }), dots = sv('g');
      svg.append(cross);
      active.forEach(s => {
        const color = `var(${s.v})`; let run = []; const runs = [];
        B.forEach((b, i) => { const v = b.v[s.k]; if (v == null) { if (run.length) runs.push(run); run = []; } else run.push([X(i), Y(v), v]); }); if (run.length) runs.push(run);
        runs.forEach(r => { if (r.length > 1) { const d = r.map((p, j) => (j ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(''); if (active.length === 1) svg.append(sv('path', { d: d + `L${r[r.length - 1][0]} ${T + ph}L${r[0][0]} ${T + ph}Z`, fill: color, opacity: .1 })); svg.append(sv('path', { d, fill: 'none', stroke: color, 'stroke-width': 2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' })); } });
        runs.flat().forEach(p => dots.append(marker(s.shape, +p[0].toFixed(1), +p[1].toFixed(1), color)));
        const last = runs.flat().pop(); if (last && active.length === 1) dots.append(sv('text', { x: last[0], y: last[1] - 12, 'text-anchor': 'middle', class: 'hm-val' }, fmt(last[2])));
      });
      svg.append(dots);
      const hit = sv('rect', { x: L, y: T, width: pw, height: ph, fill: 'transparent', class: 'hm-hit' }); svg.append(hit);
      let cur = -1;
      const show = i => {
        cur = i; if (i < 0) { cross.setAttribute('visibility', 'hidden'); tip.hidden = true; return; }
        const b = B[i]; cross.setAttribute('x1', X(i)); cross.setAttribute('x2', X(i)); cross.setAttribute('visibility', 'visible');
        tip.replaceChildren(h('div', { class: 'hm-tt' }, b.full), ...(b.n ? [...active.map(s => h('div', { class: 'hm-tr' }, svgKey(s), h('b', null, b.v[s.k] == null ? '—' : fmt(b.v[s.k]) + ' / 10'), h('span', null, ' ' + s.t))), h('div', { class: 'hm-tn' }, b.n + (b.n > 1 ? ' notes' : ' note'))] : [h('div', { class: 'hm-tn' }, 'Pas de note')]));
        tip.hidden = false; const tw = tip.offsetWidth, x = X(i); tip.style.left = Math.max(4, Math.min(W - tw - 4, x + 14 + tw > W ? x - tw - 14 : x + 14)) + 'px'; tip.style.top = '10px';
      };
      const idx = ev => { const r = svg.getBoundingClientRect(); return Math.max(0, Math.min(n - 1, Math.floor((ev.clientX - r.left - L) / (pw / n)))); };
      hit.addEventListener('pointermove', ev => show(idx(ev))); hit.addEventListener('pointerdown', ev => show(idx(ev))); svg.addEventListener('pointerleave', () => { if (document.activeElement !== svg) show(-1); });
      svg.addEventListener('keydown', ev => { if (ev.key === 'ArrowRight') { show(Math.min(n - 1, cur < 0 ? 0 : cur + 1)); ev.preventDefault(); } else if (ev.key === 'ArrowLeft') { show(Math.max(0, cur < 0 ? n - 1 : cur - 1)); ev.preventDefault(); } else if (ev.key === 'Home') { show(0); ev.preventDefault(); } else if (ev.key === 'End') { show(n - 1); ev.preventDefault(); } else if (ev.key === 'Escape' && cur >= 0) { show(-1); ev.stopPropagation(); } });
      svg.addEventListener('blur', () => show(-1));
      wrap.append(svg, tip); tip.hidden = true;
      if (!total) wrap.append(h('div', { class: 'hm-none' }, 'Aucune note sur cette période.'));
      // chiffres clés (pour la première série affichée) : valeurs réelles seulement
      const s0 = active[0], withV = B.filter(b => b.v[s0.k] != null), all = log.filter(e => hasScore(e) && B.length && e.t >= B[0].a && e.t < B[n - 1].b).map(e => val(e, s0.k)).filter(x => x != null);
      if (withV.length) { const best = withV.reduce((a, b) => b.v[s0.k] > a.v[s0.k] ? b : a), low = withV.reduce((a, b) => b.v[s0.k] < a.v[s0.k] ? b : a), mean = all.reduce((p, q) => p + q, 0) / all.length;
        const tile = (t, v, sub) => h('div', { class: 'hm-tile' }, h('span', { class: 'hm-tl' }, t), h('b', { class: 'hm-tv' }, v), sub ? h('span', { class: 'hm-ts' }, sub) : null);
        stats.append(tile('Moyenne (' + s0.t + ')', fmt(mean) + ' / 10', all.length + (all.length > 1 ? ' notes' : ' note')), tile('Meilleure période', fmt(best.v[s0.k]) + ' / 10', best.full), tile('Plus basse', fmt(low.v[s0.k]) + ' / 10', low.full)); }
      // tableau des chiffres (toujours accessible sans survol)
      table.append(h('summary', null, 'Voir les chiffres (tableau)'), h('div', { class: 'hm-scroll' }, h('table', null, h('thead', null, h('tr', null, ['Période', 'Global', 'Corps', 'Émotions', 'Tête', 'Notes'].map(x => h('th', { scope: 'col' }, x)))), h('tbody', null, B.filter(b => b.n).map(b => h('tr', null, h('th', { scope: 'row' }, b.full), ...['g', 'p', 'e', 'm'].map(k => h('td', null, b.v[k] == null ? '—' : fmt(b.v[k]))), h('td', null, String(b.n))))))));
      if (!B.some(b => b.n)) table.append(h('p', { class: 'muted' }, 'Aucune note sur cette période.'));
    };
    const svgKey = s => { const k = sv('svg', { width: 22, height: 14, viewBox: '0 0 22 14', 'aria-hidden': 'true', class: 'hm-keysvg' }); k.append(sv('line', { x1: 0, x2: 22, y1: 7, y2: 7, stroke: `var(${s.v})`, 'stroke-width': 2, 'stroke-linecap': 'round' }), marker(s.shape, 11, 7, `var(${s.v})`, 4)); return k; };
    let rt = 0; window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { if (root.offsetParent) draw(); }, 150); });
    return { el: root, refresh: draw };
  };
  return { mount, aggregate, buckets, val, fmt, SER };
})();
