/* Outil Dys — Mathématiques visuelles (aide à la dyscalculie et à tous). Tout est calculé ici, rien n'est inventé. */
'use strict';

const MathX = (() => {
  const U = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize'];
  const T = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante'];
  const b100 = (n, fin) => {
    if (n < 17) return U[n]; if (n < 20) return 'dix-' + U[n - 10];
    if (n < 70) { const t = Math.floor(n / 10), u = n % 10; return u === 0 ? T[t] : u === 1 ? T[t] + ' et un' : T[t] + '-' + U[u]; }
    if (n < 80) { const u = n - 60; return u === 11 ? 'soixante et onze' : 'soixante-' + b100(u, fin); }
    if (n === 80) return 'quatre-vingt' + (fin ? 's' : ''); return 'quatre-vingt-' + b100(n - 80, fin);
  };
  const g3 = (n, fin) => { const hh = Math.floor(n / 100), r = n % 100; const p = []; if (hh) p.push(hh === 1 ? 'cent' : U[hh] + ' cent' + (r === 0 && fin ? 's' : '')); if (r) p.push(b100(r, fin)); return p.join(' '); };
  const words = n => {
    n = BigInt(n); if (n < 0n || n > 999999999999n) throw new Error('Nombre entre 0 et 999 999 999 999.'); if (n === 0n) return 'zéro';
    const bil = Number(n / 1000000000n), mil = Number((n / 1000000n) % 1000n), mi = Number((n / 1000n) % 1000n), un = Number(n % 1000n); const p = [];
    if (bil) p.push(bil === 1 ? 'un milliard' : g3(bil, true) + ' milliards'); if (mil) p.push(mil === 1 ? 'un million' : g3(mil, true) + ' millions');
    if (mi) p.push(mi === 1 ? 'mille' : g3(mi, false) + ' mille'); if (un) p.push(g3(un, true)); return p.join(' ');
  };
  const COL = ['les unités', 'les dizaines', 'les centaines', 'les unités de mille', 'les dizaines de mille', 'les centaines de mille', 'les unités de million', 'les dizaines de million', 'les centaines de million', 'les unités de milliard', 'les dizaines de milliard', 'les centaines de milliard'];
  const col = i => COL[i] || `la colonne ${i + 1}`;
  const dig = n => n.toString().split('').reverse().map(Number);
  const big = s => { const t = String(s).replace(/[\s ]/g, ''); if (!/^\d{1,12}$/.test(t)) throw new Error('Écris un nombre entier positif (12 chiffres au maximum, sans virgule).'); return BigInt(t); };
  const posed = (rows, width) => rows.map(r => r.padStart(width, ' ')).join('\n');
  function add(A, B) {
    const a = big(A), b = big(B), da = dig(a), db = dig(b), n = Math.max(da.length, db.length); let c = 0; const out = [], steps = [], carries = [];
    for (let i = 0; i < n; i++) { const x = da[i] || 0, y = db[i] || 0, s = x + y + c; steps.push(`Je calcule ${col(i)} : ${x} + ${y}${c ? ' + ' + c + ' (retenue)' : ''} = ${s}. ${s >= 10 ? `J’écris ${s % 10} et je retiens 1.` : `J’écris ${s}.`}`); carries[i + 1] = s >= 10 ? 1 : 0; out.push(s % 10); c = s >= 10 ? 1 : 0; }
    if (c) { out.push(1); steps.push('Il reste une retenue : je l’écris à gauche.'); }
    const res = BigInt(out.reverse().join('')); if (res !== a + b) throw new Error('Erreur interne de calcul.');
    const w = res.toString().length + 2; let car = ''; for (let j = n - 1; j >= 0; j--) car += carries[j] ? '1' : ' ';
    return { steps, result: res, text: posed([...(car.trim() ? [car] : []), a.toString(), '+ ' + b.toString(), '─'.repeat(w), res.toString()], w), expr: `${a} + ${b} = ${res}` };
  }
  function sub(A, B) {
    let a = big(A), b = big(B), neg = false; const steps = []; if (a < b) { neg = true;[a, b] = [b, a]; steps.push(`${A} est plus petit que ${B} : le résultat sera négatif. Je calcule ${B} − ${A}, puis j’ajoute le signe « − ».`); }
    const da = dig(a), db = dig(b), out = []; let br = 0;
    for (let i = 0; i < da.length; i++) { const x = da[i], y = db[i] || 0; const x2 = x - br; if (x2 < y) { out.push(x2 + 10 - y); steps.push(`Je calcule ${col(i)} : ${x}${br ? ' − 1 (retenue)' : ''} − ${y} : impossible, j’ajoute 10 → ${x2 + 10} − ${y} = ${x2 + 10 - y}. Je retiens 1 pour la colonne suivante.`); br = 1; } else { out.push(x2 - y); steps.push(`Je calcule ${col(i)} : ${x}${br ? ' − 1 (retenue)' : ''} − ${y} = ${x2 - y}.`); br = 0; } }
    const res = BigInt(out.reverse().join('')); if (res !== a - b) throw new Error('Erreur interne de calcul.'); const w = Math.max(a.toString().length, res.toString().length) + 2;
    return { steps, result: neg ? -res : res, text: posed([a.toString(), '− ' + b.toString(), '─'.repeat(w), res.toString()], w), expr: neg ? `${A} − ${B} = −${res}` : `${a} − ${b} = ${res}` };
  }
  function mul(A, B) {
    const a = big(A), b = big(B), db = dig(b); const steps = [], parts = []; let tot = 0n;
    db.forEach((d, k) => { if (d === 0) { steps.push(`Chiffre des ${col(k).replace('les ', '')} de ${b} : 0 → le produit est 0, je passe.`); return; } const p = a * BigInt(d); const sh = p * 10n ** BigInt(k); parts.push(p.toString() + '0'.repeat(k)); tot += sh; steps.push(`Je multiplie ${a} par ${d} (${col(k)} de ${b}) : ${a} × ${d} = ${p}.${k ? ` Je décale de ${k} rang${k > 1 ? 's' : ''} (j’ajoute ${k} zéro${k > 1 ? 's' : ''}) : ${sh}.` : ''}`); });
    if (parts.length > 1) steps.push(`J’additionne les produits : ${parts.join(' + ')} = ${tot}.`); if (tot !== a * b) throw new Error('Erreur interne de calcul.');
    const w = tot.toString().length + 2; return { steps, result: tot, text: posed([a.toString(), '× ' + b.toString(), '─'.repeat(w), ...parts, ...(parts.length > 1 ? ['─'.repeat(w), tot.toString()] : [])], w), expr: `${a} × ${b} = ${tot}` };
  }
  function div(A, B) {
    const a = big(A), b = big(B); if (b === 0n) throw new Error('On ne peut pas diviser par 0.'); const s = a.toString(); let rem = 0n; const q = [], steps = [];
    for (let i = 0; i < s.length; i++) { rem = rem * 10n + BigInt(s[i]); const qd = rem / b, r = rem % b; q.push(qd.toString()); steps.push(qd === 0n ? `Je descends ${s[i]} : j’ai ${rem}. ${rem} est plus petit que ${b} : 0 fois. Reste ${r}.` : `Je descends ${s[i]} : j’ai ${rem}. Dans ${rem}, combien de fois ${b} ? ${qd} fois, car ${qd} × ${b} = ${qd * b}. Reste ${rem} − ${qd * b} = ${r}.`); rem = r; }
    const quo = BigInt(q.join('')); if (quo * b + rem !== a) throw new Error('Erreur interne de calcul.'); steps.push(`Résultat : quotient ${quo}, reste ${rem}. Vérification : ${b} × ${quo} + ${rem} = ${a}.`);
    return { steps, result: quo, rem, text: `${a} ÷ ${b}\nquotient : ${quo}\nreste : ${rem}\n${a} = ${b} × ${quo} + ${rem}`, expr: `${a} ÷ ${b} → quotient ${quo}, reste ${rem}` };
  }
  const gcd = (a, b) => { a = Math.abs(a); b = Math.abs(b); while (b) [a, b] = [b, a % b]; return a; };
  const lcm = (a, b) => a / gcd(a, b) * b;
  function decimal(a, b) { // développement décimal exact ou périodique
    const ip = Math.floor(a / b); let r = a % b; const seen = new Map(); const ds = []; while (r && !seen.has(r) && ds.length < 80) { seen.set(r, ds.length); r *= 10; ds.push(Math.floor(r / b)); r %= b; }
    if (!r) return { exact: true, text: ds.length ? `${ip},${ds.join('')}` : String(ip) }; const k = seen.get(r); return { exact: false, text: `${ip},${ds.slice(0, k).join('')}(${ds.slice(k).join('')})`, approx: `${ip},${ds.slice(0, Math.max(6, k + ds.length - k)).slice(0, 6).join('')}…` };
  }
  // décalage de la virgule sur une écriture décimale (exact, sans flottants)
  function shiftDec(str, k) {
    const m = /^(-?)(\d*)(?:[.,](\d*))?$/.exec(String(str).trim()); if (!m || (m[2] === '' && !m[3])) throw new Error('Écris un nombre (ex. 12,5).'); let digits = m[2] + (m[3] || ''); let pt = m[2].length + k; if (pt <= 0) { digits = '0'.repeat(1 - pt) + digits; pt = 1; } else if (pt > digits.length) digits += '0'.repeat(pt - digits.length);
    let i = digits.slice(0, pt).replace(/^0+(?=\d)/, ''), f = digits.slice(pt).replace(/0+$/, ''); return (m[1] && (i !== '0' || f) ? '-' : '') + i + (f ? ',' + f : '');
  }
  const UNITS = { longueur: ['km', 'hm', 'dam', 'm', 'dm', 'cm', 'mm'], masse: ['kg', 'hg', 'dag', 'g', 'dg', 'cg', 'mg'], capacité: ['kL', 'hL', 'daL', 'L', 'dL', 'cL', 'mL'] };
  const unitNames = { km: 'kilomètre', hm: 'hectomètre', dam: 'décamètre', m: 'mètre', dm: 'décimètre', cm: 'centimètre', mm: 'millimètre', kg: 'kilogramme', hg: 'hectogramme', dag: 'décagramme', g: 'gramme', dg: 'décigramme', cg: 'centigramme', mg: 'milligramme', kL: 'kilolitre', hL: 'hectolitre', daL: 'décalitre', L: 'litre', dL: 'décilitre', cL: 'centilitre', mL: 'millilitre' };
  function convert(val, kind, from, to) { const u = UNITS[kind]; const i = u.indexOf(from), j = u.indexOf(to); const k = j - i; const r = shiftDec(val, k); return { k, result: r, text: k === 0 ? 'Même unité : rien à changer.' : k > 0 ? `De ${from} à ${to} : je descends de ${k} colonne${k > 1 ? 's' : ''} du tableau → le nombre devient 10^${k} = ${'1' + '0'.repeat(k)} fois plus grand : je décale la virgule de ${k} rang${k > 1 ? 's' : ''} vers la droite.` : `De ${from} à ${to} : je monte de ${-k} colonne${k < -1 ? 's' : ''} du tableau → le nombre devient ${'1' + '0'.repeat(-k)} fois plus petit : je décale la virgule de ${-k} rang${k < -1 ? 's' : ''} vers la gauche.` }; }
  const DUR = { j: 86400, h: 3600, min: 60, s: 1 };
  function convertDur(val, from, to) { const v = parseFloat(String(val).replace(',', '.')); if (isNaN(v)) throw new Error('Écris un nombre.'); const r = v * DUR[from] / DUR[to]; const f = DUR[from] / DUR[to]; return { result: String(+r.toPrecision(12)).replace('.', ','), text: f >= 1 ? `1 ${from} = ${f} ${to} : je multiplie par ${f}.` : `1 ${to} = ${DUR[to] / DUR[from]} ${from} : je divise par ${DUR[to] / DUR[from]}.` }; }
  return { words, add, sub, mul, div, gcd, lcm, decimal, shiftDec, convert, convertDur, UNITS, unitNames, big, dig, col };
})();
if (typeof module !== 'undefined') module.exports = MathX;

// ====================================================================================================  interface
if (typeof App !== 'undefined') {
  const SVGNS = 'http://www.w3.org/2000/svg';
  const svgEl = (w, hgt, label) => { const s = document.createElementNS(SVGNS, 'svg'); s.setAttribute('viewBox', `0 0 ${w} ${hgt}`); s.setAttribute('role', 'img'); s.setAttribute('aria-label', label); s.style.cssText = 'width:100%;max-width:' + w + 'px;height:auto'; return s; };
  const fmtN = x => String(+x.toFixed(6)).replace('.', ',');
  const parseN = s => { const v = parseFloat(String(s).replace(/\s/g, '').replace(',', '.')); return isNaN(v) ? null : v; };

  // ---- 1. calcul pas à pas
  const tabCalc = b => {
    const a = h('input', { type: 'text', inputmode: 'numeric', value: '347', 'aria-label': 'Premier nombre' }), c = h('input', { type: 'text', inputmode: 'numeric', value: '86', 'aria-label': 'Deuxième nombre' });
    const op = h('select', { 'aria-label': 'Opération' }, [['add', '+  addition'], ['sub', '−  soustraction'], ['mul', '×  multiplication'], ['div', '÷  division euclidienne']].map(([v, l]) => h('option', { value: v }, l)));
    const out = h('div', { 'aria-live': 'polite' }); let shown = 0, R = null; const reveal = h('div'); const pre = h('pre', { style: 'font-size:1.25em;line-height:1.35;background:var(--panel);color:var(--ink);border:1px solid var(--line);padding:.6rem;border-radius:8px;overflow:auto;display:inline-block;min-width:8ch' });
    const stepsBox = h('ol');
    const drawSteps = () => { stepsBox.replaceChildren(...R.steps.slice(0, shown).map((s, i) => h('li', { style: i === shown - 1 ? 'font-weight:700' : '' }, s))); nxt.disabled = shown >= R.steps.length; resBox.hidden = shown < R.steps.length; };
    const nxt = h('button', { class: 'btn', onclick: () => { shown = Math.min(R.steps.length, shown + 1); drawSteps(); } }, 'Étape suivante'); const all = h('button', { class: 'btn sec', onclick: () => { shown = R.steps.length; drawSteps(); } }, 'Tout afficher');
    const resBox = h('p', { style: 'font-size:1.2em;font-weight:700' });
    const go = () => { out.replaceChildren(); try { R = MathX[op.value](a.value, c.value); } catch (e) { return out.append(Sub.notice('bad', e.message)); } shown = 1; pre.textContent = R.text; resBox.textContent = '✅ ' + R.expr; out.append(h('p', { class: 'muted' }, 'Pose l’opération avec les chiffres bien alignés (unités sous les unités).'), pre, h('h3', null, 'Étapes'), stepsBox, h('div', { class: 'row' }, nxt, all, Sub.speakBtn(() => R.steps.join(' ') + ' ' + R.expr, '🔊 Écouter les étapes')), resBox); drawSteps(); };
    b.append(Sub.notice('secondary', 'Entiers positifs jusqu’à 12 chiffres. Les étapes sont affichées une par une, à ton rythme ; le calcul est vérifié par l’ordinateur.'), h('div', { class: 'row' }, a, op, c, h('button', { class: 'btn', onclick: go }, 'Calculer pas à pas')), out); go();
  };
  // ---- 2. droite numérique
  const tabLine = b => {
    const mi = h('input', { type: 'text', value: '0', 'aria-label': 'Début' }), ma = h('input', { type: 'text', value: '10', 'aria-label': 'Fin' }), st = h('input', { type: 'text', value: '1', 'aria-label': 'Graduation' }), pts = h('input', { type: 'text', value: '2,5 ; 7', 'aria-label': 'Nombres à placer (séparés par ;)', style: 'min-width:14ch' }); const out = h('div');
    const go = () => { out.replaceChildren(); const lo = parseN(mi.value), hi = parseN(ma.value), s = parseN(st.value); if (lo == null || hi == null || s == null || hi <= lo || s <= 0 || (hi - lo) / s > 200) return out.append(Sub.notice('bad', 'Il faut début < fin, une graduation positive, et moins de 200 graduations.'));
      const P = pts.value.split(';').map(x => parseN(x)).filter(x => x != null); const W = 800, X = v => 30 + (v - lo) / (hi - lo) * (W - 60); const svg = svgEl(W, 150, 'Droite numérique'); let html = `<line x1="30" y1="70" x2="${W - 30}" y2="70" stroke="currentColor" stroke-width="3"/><polygon points="${W - 30},70 ${W - 42},64 ${W - 42},76" fill="currentColor"/>`; const n = Math.round((hi - lo) / s); const lab = Math.max(1, Math.ceil(n / 20));
      for (let i = 0; i <= n; i++) { const v = lo + i * s; const big = i % lab === 0; html += `<line x1="${X(v)}" y1="${big ? 58 : 63}" x2="${X(v)}" y2="${big ? 82 : 77}" stroke="currentColor" stroke-width="2"/>`; if (big) html += `<text x="${X(v)}" y="104" text-anchor="middle" font-size="14" fill="currentColor">${fmtN(v)}</text>`; }
      P.forEach((p, i) => { if (p < lo || p > hi) return; const col = ['#7c3aed', '#dc2626', '#059669', '#d97706'][i % 4]; html += `<circle cx="${X(p)}" cy="70" r="7" fill="${col}" stroke="#fff" stroke-width="2"/><text x="${X(p)}" y="${i % 2 ? 128 : 44}" text-anchor="middle" font-size="15" font-weight="700" fill="${col}">${fmtN(p)}</text>`; }); svg.innerHTML = html; out.append(svg);
      const ins = P.filter(p => p >= lo && p <= hi); if (P.length > ins.length) out.append(Sub.notice('warn', 'Un ou plusieurs nombres sont en dehors de la droite : change le début ou la fin.')); if (ins.length >= 2) { const sr = ins.slice().sort((x, y) => x - y); out.append(h('p', null, h('b', null, 'Du plus petit au plus grand : '), sr.map(fmtN).join(' < '))); out.append(Sub.speakBtn(() => 'Du plus petit au plus grand : ' + sr.map(fmtN).join(', '))); } };
    b.append(h('div', { class: 'row' }, h('label', null, 'Début ', mi), h('label', null, 'Fin ', ma), h('label', null, 'Graduation ', st), h('label', null, 'Nombres (séparés par « ; ») ', pts), h('button', { class: 'btn', onclick: go }, 'Dessiner')), out, h('p', { class: 'muted' }, 'Plus un nombre est à droite, plus il est grand. Les décimaux se placent entre deux graduations.')); go();
  };
  // ---- 3. fractions
  const bar = (num, den) => { const rows = Math.min(6, Math.max(1, Math.ceil(num / den))); const cells = Math.min(den, 24); const W = 640, cw = (W - 20) / cells; const svg = svgEl(W, rows * 44 + 10, `Fraction ${num} sur ${den}`); let html = '', left = num; for (let r = 0; r < rows; r++) { for (let i = 0; i < cells; i++) { const full = left > 0; html += `<rect x="${10 + i * cw}" y="${8 + r * 44}" width="${cw - 2}" height="36" rx="3" fill="${full ? '#2563eb' : 'none'}" stroke="#2563eb" stroke-width="2"/>`; left -= 1; } if (den > 24) { left = Math.max(0, left); } } svg.innerHTML = html; return svg; };
  const tabFrac = b => {
    const a = h('input', { type: 'number', min: 0, max: 1000, value: 3, 'aria-label': 'Numérateur' }), d = h('input', { type: 'number', min: 1, max: 1000, value: 4, 'aria-label': 'Dénominateur' }), c = h('input', { type: 'number', min: 0, max: 1000, value: 2, 'aria-label': 'Numérateur 2' }), e = h('input', { type: 'number', min: 1, max: 1000, value: 3, 'aria-label': 'Dénominateur 2' });
    const op = h('select', { 'aria-label': 'Opération' }, [['none', 'Aucune (une seule fraction)'], ['cmp', 'Comparer'], ['add', 'Additionner'], ['sub', 'Soustraire']].map(([v, l]) => h('option', { value: v }, l))); const out = h('div', { 'aria-live': 'polite' });
    const go = () => { out.replaceChildren(); const n = Math.round(+a.value), m = Math.round(+d.value), n2 = Math.round(+c.value), m2 = Math.round(+e.value); if (!(m >= 1) || !(n >= 0) || (op.value !== 'none' && !(m2 >= 1 && n2 >= 0))) return out.append(Sub.notice('bad', 'Numérateur ≥ 0 et dénominateur ≥ 1.')); const g = MathX.gcd(n, m) || 1; const dec = MathX.decimal(n, m); const L = [];
      out.append(h('h3', null, `${n}/${m}`), bar(n, m)); if (m > 24) out.append(h('p', { class: 'muted' }, 'Dessin limité à 24 parts.'));
      L.push(`Le dénominateur (${m}) dit en combien de parts égales on coupe le tout ; le numérateur (${n}) dit combien on en prend.`); if (g > 1) L.push(`Fraction simplifiée : ${n}/${m} = ${n / g}/${m / g} (on divise en haut et en bas par ${g}).`); else L.push('Cette fraction est déjà simplifiée.'); if (n >= m) L.push(`${n}/${m} = ${Math.floor(n / m)} ${n % m ? 'et ' + (n % m) + '/' + m : ''} (plus que 1 entier).`);
      L.push(`En écriture décimale : ${dec.exact ? dec.text.replace('.', ',') : dec.text.replace('.', ',') + ' (les chiffres entre parenthèses se répètent à l’infini)'}`); L.push(`En pourcentage : ${fmtN(n / m * 100)} %.`);
      if (op.value !== 'none') { const l = MathX.lcm(m, m2), x = n * (l / m), y = n2 * (l / m2); L.push(`— Avec ${n2}/${m2} —`); L.push(`Dénominateur commun : ${l} (le plus petit nombre dans les tables de ${m} et de ${m2}).`); L.push(`${n}/${m} = ${x}/${l} et ${n2}/${m2} = ${y}/${l}.`);
        if (op.value === 'cmp') L.push(x === y ? `Elles sont égales : ${n}/${m} = ${n2}/${m2}.` : `${x} ${x < y ? '<' : '>'} ${y}, donc ${n}/${m} ${x < y ? '<' : '>'} ${n2}/${m2}.`); else { const r = op.value === 'add' ? x + y : x - y; const g2 = MathX.gcd(Math.abs(r), l) || 1; L.push(`${x}/${l} ${op.value === 'add' ? '+' : '−'} ${y}/${l} = ${r}/${l}${g2 > 1 && r !== 0 ? ` = ${r / g2}/${l / g2} (simplifiée)` : ''}.`); } }
      out.append(h('ul', null, L.map(t => h('li', null, t))), Sub.speakBtn(() => L.join(' '), '🔊 Écouter')); };
    b.append(h('div', { class: 'row' }, h('label', null, 'Fraction ', a, ' / ', d), op, h('label', null, 'avec ', c, ' / ', e), h('button', { class: 'btn', onclick: go }, 'Montrer')), out); go();
  };
  // ---- 4. quantités et valeur de position
  const tabQty = b => {
    const v = h('input', { type: 'text', inputmode: 'numeric', value: '3 254', 'aria-label': 'Nombre entier' }); const out = h('div', { 'aria-live': 'polite' });
    const go = () => { out.replaceChildren(); let n; try { n = MathX.big(v.value); } catch (e) { return out.append(Sub.notice('bad', e.message)); } const ds = MathX.dig(n); const names = ['unités', 'dizaines', 'centaines', 'milliers', 'dizaines de mille', 'centaines de mille', 'millions', 'dizaines de million', 'centaines de million', 'milliards', 'dizaines de milliard', 'centaines de milliard'];
      const colors = ['#16a34a', '#2563eb', '#dc2626', '#7c3aed', '#d97706', '#0891b2', '#be185d', '#4b5563', '#65a30d', '#0f766e', '#b45309', '#1d4ed8'];
      out.append(h('p', { style: 'font-size:1.2em' }, h('b', null, MathX.words(n))), Sub.speakBtn(() => MathX.words(n), '🔊 Lire le nombre'), h('p', { class: 'muted' }, 'Orthographe traditionnelle : traits d’union seulement entre les dizaines et les unités (la réforme de 1990 accepte aussi des traits d’union partout).'));
      const t = h('table', { class: 't' }, h('thead', null, h('tr', null, ds.slice().reverse().map((_, i) => h('th', { style: `background:${colors[ds.length - 1 - i]}22` }, names[ds.length - 1 - i])))), h('tbody', null, h('tr', null, ds.slice().reverse().map((d, i) => h('td', { style: `font-size:1.6em;text-align:center;font-weight:700;color:${colors[ds.length - 1 - i]}` }, d))))); out.append(h('div', { style: 'overflow:auto' }, t));
      out.append(h('p', null, h('b', null, 'Décomposition : '), ds.map((d, i) => d ? `${d} × ${Sub.fmt(10n ** BigInt(i))}` : null).filter(Boolean).reverse().join(' + ') || '0'));
      if (n <= 9999n) { const W = 700; const svg = svgEl(W, 120, `Représentation de ${n} avec des blocs`); let x = 10, html = ''; const k = Number(n); const cnt = [Math.floor(k / 1000), Math.floor(k / 100) % 10, Math.floor(k / 10) % 10, k % 10]; const lab = ['milliers', 'centaines', 'dizaines', 'unités'];
        cnt.forEach((c, gi) => { html += `<text x="${x}" y="14" font-size="12" fill="currentColor">${c} ${lab[gi]}</text>`; for (let i = 0; i < c; i++) { if (gi === 0) { html += `<rect x="${x + i * 36}" y="24" width="32" height="32" fill="#7c3aed" stroke="#fff"/>`; } else if (gi === 1) { html += `<rect x="${x + (i % 5) * 22}" y="${24 + Math.floor(i / 5) * 22}" width="20" height="20" fill="#dc2626" stroke="#fff"/>`; } else if (gi === 2) { html += `<rect x="${x + i * 12}" y="24" width="9" height="48" fill="#2563eb"/>`; } else html += `<rect x="${x + (i % 5) * 14}" y="${24 + Math.floor(i / 5) * 14}" width="11" height="11" fill="#16a34a"/>`; } x += gi === 0 ? Math.max(120, c * 36 + 20) : 165; }); svg.innerHTML = html; out.append(h('div', { style: 'overflow:auto' }, svg), h('p', { class: 'muted' }, 'Grand carré violet = 1 000 · carré rouge = 100 · barre bleue = 10 · petit carré vert = 1.')); } else out.append(h('p', { class: 'muted' }, 'Le dessin en blocs est limité aux nombres jusqu’à 9 999.')); };
    b.append(h('div', { class: 'row' }, h('label', null, 'Nombre ', v), h('button', { class: 'btn', onclick: go }, 'Montrer')), out); v.addEventListener('keydown', e => e.key === 'Enter' && go()); go();
  };
  // ---- 5. tables
  const tabTables = b => {
    let n = 7, m = 8; const top = h('div'), grid = h('div'), pr = h('div');
    const HINT = { 2: 'Les résultats sont toujours pairs (finissent par 0, 2, 4, 6 ou 8).', 5: 'Les résultats finissent par 0 ou par 5.', 9: 'De 9 × 1 à 9 × 10, la somme des chiffres du résultat fait 9 (18 → 1 + 8 = 9).', 10: 'On ajoute un zéro à droite.', 11: 'De 11 × 1 à 11 × 9, on répète le chiffre : 33, 44, 55…', 4: 'C’est le double du double : 4 × 7 = 2 × (2 × 7).', 3: 'Les résultats suivent un cycle des unités : 3, 6, 9, 2, 5, 8, 1, 4, 7, 0.' };
    const draw = () => { top.replaceChildren(h('div', { class: 'row' }, h('b', null, 'Table de : '), Array.from({ length: 12 }, (_, i) => i + 1).map(i => h('button', { class: 'btn small ' + (i === n ? '' : 'sec'), 'aria-pressed': String(i === n), onclick: () => { n = i; m = Math.min(m, 10); draw(); } }, i)))); grid.replaceChildren(h('div', { class: 'grid g2' }, h('table', { class: 't' }, h('tbody', null, Array.from({ length: 10 }, (_, i) => i + 1).map(i => h('tr', { style: i === m ? 'background:#fde68a55' : '', onclick: () => { m = i; draw(); }, tabindex: 0, onkeydown: e => e.key === 'Enter' && (m = i, draw()), 'aria-label': `${n} fois ${i} égale ${n * i}` }, h('td', null, `${n} × ${i}`), h('td', null, h('b', null, n * i)))))), (() => { const svg = svgEl(Math.max(260, m * 26 + 20), n * 26 + 20, `${n} lignes de ${m} points`); let html = ''; for (let r = 0; r < n; r++) for (let c = 0; c < m; c++) html += `<circle cx="${18 + c * 26}" cy="${18 + r * 26}" r="9" fill="${r % 2 ? '#2563eb' : '#7c3aed'}"/>`; svg.innerHTML = html; return h('div', null, h('p', null, h('b', null, `${n} × ${m} = ${n * m}`), ` : ${n} lignes de ${m} points`), svg); })()), HINT[n] ? h('p', { class: 'notice' }, 'Astuce : ' + HINT[n]) : ''); };
    const train = () => { const q = [Sub.rnd(1, 10), Sub.rnd(1, 10)]; const t = Sub.rnd(2, 10) === 0 ? n : n; const x = Math.random() < .6 ? n : Sub.rnd(2, 10), y = Sub.rnd(1, 10); const inp = h('input', { type: 'number', 'aria-label': `${x} fois ${y}`, style: 'width:8ch' }); const fb = h('p', { 'aria-live': 'polite' }); let done = false; const chk = () => { if (done || inp.value === '') return; done = true; const ok = +inp.value === x * y; Sub.logEx('tables', ok); fb.textContent = ok ? '✅ Juste !' : `❌ ${x} × ${y} = ${x * y}  (${y} fois ${x} : ${Array.from({ length: y }, () => x).join(' + ')})`; pr.append(h('button', { class: 'btn', onclick: train }, 'Suivant')); }; inp.addEventListener('keydown', e => e.key === 'Enter' && chk()); pr.replaceChildren(h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, `${x} × ${y} = ?`), inp, h('button', { class: 'btn', style: 'margin-left:.4rem', onclick: chk }, 'Vérifier'), fb)); inp.focus(); };
    b.append(top, grid, h('h3', null, 'S’entraîner'), h('p', { class: 'muted' }, 'Pas de chrono. Si tu bloques, la réponse montre l’addition répétée.'), h('button', { class: 'btn', onclick: train }, '▶ Une question'), pr); draw();
  };
  // ---- 6. unités
  const tabUnits = b => {
    const kind = h('select', { 'aria-label': 'Grandeur' }, ['longueur', 'masse', 'capacité', 'durée'].map(k => h('option', { value: k }, k))); const val = h('input', { type: 'text', value: '12,5', 'aria-label': 'Valeur' }); const from = h('select', { 'aria-label': 'Unité de départ' }), to = h('select', { 'aria-label': 'Unité d’arrivée' }); const out = h('div', { 'aria-live': 'polite' });
    const fill = () => { const u = kind.value === 'durée' ? ['j', 'h', 'min', 's'] : MathX.UNITS[kind.value]; [from, to].forEach((s, i) => { s.replaceChildren(...u.map(x => h('option', { value: x }, x + (MathX.unitNames[x] ? ' — ' + MathX.unitNames[x] : '')))); s.value = u[i === 0 ? Math.min(2, u.length - 1) : Math.min(u.length - 1, kind.value === 'durée' ? 2 : 5)]; }); };
    const go = () => { out.replaceChildren(); try { if (kind.value === 'durée') { const r = MathX.convertDur(val.value, from.value, to.value); out.append(h('p', { style: 'font-size:1.2em' }, h('b', null, `${val.value} ${from.value} = ${r.result} ${to.value}`)), h('p', null, r.text)); return; } const r = MathX.convert(val.value, kind.value, from.value, to.value); const u = MathX.UNITS[kind.value]; const dsa = val.value.trim().replace(/^-/, '').split(/[.,]/); const ip = dsa[0] || '0', fp = dsa[1] || ''; const i0 = u.indexOf(from.value);
        const cells = u.map((x, i) => { let s = ''; const off = i0 - i; if (off >= 0 && off < ip.length) s = ip[ip.length - 1 - off]; else if (i > i0 && i - i0 <= fp.length) s = fp[i - i0 - 1]; return s; });
        out.append(h('p', { style: 'font-size:1.2em' }, h('b', null, `${val.value} ${from.value} = ${r.result} ${to.value}`)), h('div', { style: 'overflow:auto' }, h('table', { class: 't' }, h('thead', null, h('tr', null, u.map(x => h('th', { style: x === from.value ? 'background:#bbf7d0' : x === to.value ? 'background:#bfdbfe' : '' }, x)))), h('tbody', null, h('tr', null, cells.map(c => h('td', { style: 'text-align:center;font-size:1.3em' }, c)))))), h('p', null, r.text), h('p', { class: 'muted' }, 'Tableau de conversion : la colonne verte est l’unité de départ (le chiffre des unités s’y place), la bleue est l’unité d’arrivée.'), Sub.speakBtn(() => `${val.value} ${unitFull(from.value)} égale ${r.result} ${unitFull(to.value)}`)); } catch (e) { out.append(Sub.notice('bad', e.message)); } };
    const unitFull = x => MathX.unitNames[x] || ({ j: 'jours', h: 'heures', min: 'minutes', s: 'secondes' }[x]);
    kind.addEventListener('change', () => { fill(); go(); }); fill(); b.append(h('div', { class: 'row' }, kind, h('label', null, 'Valeur ', val), h('label', null, 'de ', from), h('label', null, 'vers ', to), h('button', { class: 'btn', onclick: go }, 'Convertir')), out, h('p', { class: 'muted' }, 'Durées : 1 jour = 24 h, 1 h = 60 min, 1 min = 60 s.')); go();
  };
  // ---- 7. vocabulaire
  const GLOS = [['somme', 'Résultat d’une addition.'], ['terme', 'Un nombre que l’on additionne (dans 3 + 5, les termes sont 3 et 5).'], ['différence', 'Résultat d’une soustraction.'], ['produit', 'Résultat d’une multiplication.'], ['facteur', 'Un nombre que l’on multiplie (dans 3 × 5, les facteurs sont 3 et 5).'], ['quotient', 'Résultat d’une division.'], ['dividende', 'Le nombre que l’on divise (dans 17 ÷ 5, c’est 17).'], ['diviseur', 'Le nombre par lequel on divise (dans 17 ÷ 5, c’est 5).'], ['reste', 'Ce qui reste après une division euclidienne (17 = 5 × 3 + 2 : le reste est 2).'], ['multiple', 'Résultat dans la table de multiplication d’un nombre (les multiples de 4 : 0, 4, 8, 12…).'], ['nombre pair', 'Multiple de 2 (finit par 0, 2, 4, 6 ou 8).'], ['nombre impair', 'Nombre qui n’est pas pair (finit par 1, 3, 5, 7 ou 9).'], ['numérateur', 'Nombre du haut d’une fraction : combien de parts on prend.'], ['dénominateur', 'Nombre du bas d’une fraction : en combien de parts égales le tout est coupé.'], ['périmètre', 'Longueur du tour d’une figure.'], ['aire', 'Mesure de la surface d’une figure.'], ['angle droit', 'Angle de 90°, comme le coin d’une feuille.'], ['pourcentage', 'Fraction de dénominateur 100 : 25 % = 25/100 = 1/4.']];
  const tabWords = b => b.append(h('table', { class: 't' }, h('thead', null, h('tr', null, h('th', null, 'Mot'), h('th', null, 'Ce que ça veut dire'), h('th', null, ''))), h('tbody', null, GLOS.map(([w, d]) => h('tr', null, h('td', null, h('b', null, w)), h('td', null, d), h('td', null, Sub.speakBtn(() => `${w} : ${d}`, '🔊')))))));

  App.reg({ id: 'maths', title: 'Mathématiques', group: 'matieres', icon: '🔢', learn: true, render(el) {
    el.append(h('h1', null, '🔢 Mathématiques visuelles'), h('p', null, 'Des outils pour voir les nombres : calcul étape par étape, droite numérique, fractions dessinées, valeur de position, tables en points, conversions.'), Sub.notice('secondary', 'Tout est calculé par l’ordinateur à partir de ce que tu écris : aucun exercice n’est copié d’un livre. Aucune adaptation n’est une solution universelle : utilise ce qui t’aide.'), Sub.courseBox('maths'));
    Sub.tabs(el, [['Calcul pas à pas', tabCalc], ['Droite numérique', tabLine], ['Fractions', tabFrac], ['Quantités et nombres en lettres', tabQty], ['Tables de multiplication', tabTables], ['Unités', tabUnits], ['Vocabulaire', tabWords]]);
  } });
}
