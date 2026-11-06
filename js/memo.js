// Cartes mémoire à répétition espacée (méthode de Leitner). Tout reste sur l'appareil : tes cartes sont dans ce navigateur (jamais envoyées).
// L'effet d'espacement (revoir juste avant d'oublier) est une méthode de révision reconnue ; ce n'est pas une garantie de réussite.
const Memo = (() => {
  const INTERVAL = [0, 1, 3, 7, 14, 30]; // jours avant la prochaine révision selon la boîte (1 à 5)
  const day = () => { const d = new Date(); return Math.floor(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86400000); };
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-3);
  let D = null;
  const load = () => { if (D) return D; const s = Store.get('memo', null); D = s && Array.isArray(s.decks) ? s : { decks: [], opts: { reverse: false } }; D.opts = D.opts || { reverse: false }; return D; };
  const save = () => Store.set('memo', D);
  const due = (c, t = day()) => (c.due == null ? 0 : c.due) <= t;
  const mkCard = (q, a) => ({ id: uid(), q: String(q).trim(), a: String(a).trim(), box: 1, due: day(), n: 0, ok: 0 });
  const counts = deck => { const t = day(); const c = { total: deck.cards.length, due: 0, box: [0, 0, 0, 0, 0, 0] }; deck.cards.forEach(x => { c.box[x.box || 1]++; if (due(x, t)) c.due++; }); return c; };
  const rate = (card, res) => { // res : 'ko' | 'mid' | 'ok'
    card.n = (card.n || 0) + 1; const t = day();
    if (res === 'ok') { card.ok = (card.ok || 0) + 1; card.box = Math.min(5, (card.box || 1) + 1); card.due = t + INTERVAL[card.box]; }
    else if (res === 'mid') { card.due = t + (card.box > 1 ? 1 : 0); }
    else { card.box = 1; card.due = t; }
  };
  // import : une carte par ligne, « question ; réponse » ou « question : réponse » ou « question | réponse » ou tabulation
  const parseLines = text => {
    const ok = [], bad = [];
    String(text).split(/\r?\n/).map(l => l.trim()).filter(Boolean).forEach(l => {
      let m = l.match(/^(.+?)\t+(.+)$/) || l.match(/^(.+?)\s+[;|]\s+(.+)$/) || l.match(/^(.+?)\s*;\s*(.+)$/) || l.match(/^(.+?)\s*\|\s*(.+)$/) || l.match(/^(.+?)\s+[:–—-]\s+(.+)$/) || l.match(/^([^:]{1,60}):\s*(.+)$/);
      if (m && m[1].trim() && m[2].trim()) ok.push([m[1].trim(), m[2].trim()]); else bad.push(l);
    });
    return { ok, bad };
  };
  const EXEMPLES = {
    'Unités et durées (exemple)': [['Combien de mètres dans 1 km ?', '1 000 m'], ['Combien de centimètres dans 1 m ?', '100 cm'], ['Combien de millimètres dans 1 cm ?', '10 mm'], ['Combien de grammes dans 1 kg ?', '1 000 g'], ['Combien de millilitres dans 1 L ?', '1 000 mL'], ['Combien de minutes dans 1 heure ?', '60 min'], ['Combien de secondes dans 1 minute ?', '60 s'], ['Combien d’heures dans 1 jour ?', '24 h'], ['Combien de mois dans 1 an ?', '12 mois'], ['Combien d’années dans 1 siècle ?', '100 ans'], ['Combien de centimes dans 1 euro ?', '100 centimes']],
    'Tables de multiplication 6, 7, 8, 9 (exemple)': (() => { const o = []; for (const a of [6, 7, 8, 9]) for (let b = 2; b <= 9; b++) if (b >= a || ![6, 7, 8, 9].includes(b)) o.push([`${a} × ${b} = ?`, String(a * b)]); return o; })()
  };

  function review(box, goAdd) {
    const d = load(); const area = h('div');
    const cfg = Object.assign({ deck: 'all', n: 20 }, Store.get('memo.cfg', {}));
    const menu = () => {
      area.replaceChildren(); const t = day(); const totalDue = d.decks.reduce((s, k) => s + counts(k).due, 0);
      if (!d.decks.length || !d.decks.some(k => k.cards.length)) { area.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Aucune carte pour l’instant'), h('p', null, 'Crée tes propres cartes (question → réponse) ou charge un paquet d’exemple.'), h('button', { class: 'btn', onclick: goAdd }, '➕ Ajouter des cartes'))); return; }
      const sel = h('select', { id: 'mmDeck', onchange: ev => { cfg.deck = ev.target.value; } }, h('option', { value: 'all', selected: cfg.deck === 'all' }, `Tous les paquets (${totalDue} à réviser)`), d.decks.map(k => h('option', { value: k.id, selected: cfg.deck === k.id }, `${k.name} (${counts(k).due} à réviser)`)));
      const nsel = h('select', { id: 'mmN', onchange: ev => { cfg.n = +ev.target.value; } }, [10, 20, 40, 999].map(n => h('option', { value: n, selected: cfg.n === n }, n === 999 ? 'Toutes' : n)));
      area.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, totalDue ? `📬 ${totalDue} carte${totalDue > 1 ? 's' : ''} à réviser aujourd’hui` : '🎉 Rien à réviser pour le moment'), h('div', { class: 'row' }, h('label', { for: 'mmDeck', style: 'margin:0' }, 'Paquet'), sel, h('label', { for: 'mmN', style: 'margin:0' }, 'Cartes par séance'), nsel, h('label', { class: 'chk', style: 'margin:0' }, h('input', { type: 'checkbox', checked: !!d.opts.reverse, onchange: ev => { d.opts.reverse = ev.target.checked; save(); } }), 'Sens inversé (réponse → question)')), h('p', null, h('button', { class: 'btn', onclick: () => session(false) }, '▶ Réviser'), ' ', h('button', { class: 'btn sec', onclick: () => session(true) }, '🔁 Réviser même si rien n’est dû'))), boxesCard());
    };
    const boxesCard = () => { const tot = [0, 0, 0, 0, 0, 0]; d.decks.forEach(k => k.cards.forEach(c => tot[c.box || 1]++)); const all = tot.reduce((a, b) => a + b, 0) || 1; return h('div', { class: 'card secondary' }, h('h3', { style: 'margin-top:0' }, 'Mes boîtes'), h('p', { class: 'muted' }, 'Une carte réussie monte d’une boîte et revient plus tard (1 jour, 3, 7, 14, 30). Une carte ratée retourne dans la boîte 1.'), [1, 2, 3, 4, 5].map(b => h('div', { class: 'row', style: 'align-items:center;margin:.15rem 0' }, h('span', { style: 'width:5.5rem' }, 'Boîte ' + b), h('span', { role: 'img', 'aria-label': `${tot[b]} carte(s)`, style: `display:inline-block;height:1rem;border-radius:.5rem;background:var(--accent);width:${Math.max(tot[b] ? 4 : 0, Math.round(tot[b] / all * 60))}%` }), h('span', { class: 'muted' }, String(tot[b]))))); };
    const session = force => {
      Store.set('memo.cfg', cfg); const t = day();
      let pool = []; d.decks.forEach(k => { if (cfg.deck === 'all' || cfg.deck === k.id) k.cards.forEach(c => { if (force || due(c, t)) pool.push(c); }); });
      pool = Sub.shuffle(pool).slice(0, cfg.n);
      if (!pool.length) { App.toast('Aucune carte à réviser dans ce paquet.'); return; }
      const queue = pool.slice(), seen = new Set(); let done = 0, good = 0; const total = pool.length; const bad = [];
      const next = () => {
        area.replaceChildren();
        if (!queue.length) { save(); Sub.logEx('Cartes mémoire', good === total); App.stats.counts.cards = (App.stats.counts.cards || 0) + total; App.saveStats && App.saveStats(); area.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, `Séance terminée : ${good} / ${total} réussie${good > 1 ? 's' : ''} du premier coup`), h('p', null, good === total ? '🎉 Bravo !' : '👍 Les cartes ratées reviendront plus vite. Ce n’est pas un jugement : c’est comme ça que la mémoire s’installe.'), bad.length ? h('div', null, h('p', null, 'À revoir :'), h('ul', null, bad.map(c => h('li', null, h('b', null, c.q), ' → ', c.a)))) : null, h('button', { class: 'btn', onclick: menu }, 'Retour'), ' ', h('button', { class: 'btn sec', onclick: () => session(false) }, 'Encore une séance'))); return; }
        const c = queue.shift(); const rev = !!d.opts.reverse; const front = rev ? c.a : c.q, back = rev ? c.q : c.a; let shown = false;
        const ans = h('div', { hidden: true }); const bar = h('div', { class: 'row', hidden: true });
        const show = () => { if (shown) return; shown = true; ans.hidden = false; bar.hidden = false; showBtn.hidden = true; ok.focus(); };
        const res = r => { if (!shown) { show(); return; } const first = !seen.has(c.id); seen.add(c.id); rate(c, r); if (r === 'ok') { if (first) good++; done++; } else { if (first) bad.push(c); queue.push(c); if (r === 'ko') { /* revient en fin de séance */ } } save(); next(); };
        const showBtn = h('button', { class: 'btn', onclick: show }, 'Montrer la réponse (Espace)');
        const ko = h('button', { class: 'btn sec', onclick: () => res('ko') }, '❌ Pas encore (1)'), mid = h('button', { class: 'btn sec', onclick: () => res('mid') }, '😐 Presque (2)'), ok = h('button', { class: 'btn', onclick: () => res('ok') }, '✅ Je savais (3)');
        bar.append(ko, mid, ok); ans.append(h('p', { style: 'font-size:1.5rem;margin:.6rem 0;padding:.6rem;border-left:4px solid var(--accent);background:var(--soft)' }, back), h('button', { class: 'btn ghost small', onclick: () => Sub.say(back) }, '🔊 Réponse'));
        area.append(h('div', { class: 'card', tabindex: -1, id: 'mmCard' }, h('div', { class: 'row', style: 'justify-content:space-between' }, h('span', { class: 'muted' }, `Carte ${Math.min(total, done + 1)} sur ${total} · boîte ${c.box || 1}`), h('button', { class: 'btn ghost small', onclick: menu }, '✖ Arrêter')), h('div', { role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': done, style: 'height:.5rem;border-radius:.3rem;background:var(--soft);margin:.4rem 0' }, h('div', { style: `height:100%;border-radius:.3rem;background:var(--accent);width:${Math.round(done / total * 100)}%` })), h('p', { style: 'font-size:1.8rem;margin:.6rem 0;font-weight:600' }, front), h('button', { class: 'btn ghost small', onclick: () => Sub.say(front) }, '🔊 Question'), ans, h('p', null, showBtn), bar));
        const off = () => document.removeEventListener('keydown', key);
        function key(ev) { if (!area.isConnected) { off(); return; } if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName)) return; if (!shown && ev.key === ' ') { ev.preventDefault(); show(); } else if (shown && ev.key === '1') { off(); res('ko'); } else if (shown && ev.key === '2') { off(); res('mid'); } else if (shown && ev.key === '3') { off(); res('ok'); } }
        ko.addEventListener('click', off); mid.addEventListener('click', off); ok.addEventListener('click', off);
        document.addEventListener('keydown', key); showBtn.focus();
      };
      next();
    };
    box.append(area); menu();
  }

  function decks(box, goAdd) {
    const d = load(); const area = h('div');
    const draw = () => {
      area.replaceChildren();
      if (!d.decks.length) { area.append(h('p', { class: 'muted' }, 'Aucun paquet. Va dans « Ajouter » pour en créer un.'), h('button', { class: 'btn', onclick: goAdd }, '➕ Ajouter')); return; }
      d.decks.forEach(k => {
        const c = counts(k); const list = h('div', { hidden: true }); const nameIn = h('input', { type: 'text', value: k.name, 'aria-label': 'Nom du paquet', style: 'max-width:20rem', onchange: ev => { k.name = ev.target.value.trim() || k.name; save(); } });
        const fill = () => { list.replaceChildren(h('table', { class: 't' }, h('tr', null, h('th', null, 'Question'), h('th', null, 'Réponse'), h('th', null, 'Boîte'), h('th', null, '')), k.cards.map(card => h('tr', null, h('td', null, h('input', { type: 'text', value: card.q, 'aria-label': 'Question', style: 'width:100%', onchange: ev => { card.q = ev.target.value; save(); } })), h('td', null, h('input', { type: 'text', value: card.a, 'aria-label': 'Réponse', style: 'width:100%', onchange: ev => { card.a = ev.target.value; save(); } })), h('td', null, String(card.box || 1)), h('td', null, h('button', { class: 'btn ghost small', 'aria-label': 'Supprimer la carte', onclick: () => { k.cards = k.cards.filter(x => x !== card); save(); draw(); } }, '🗑')))))); };
        let confirm = false; const delBtn = h('button', { class: 'btn ghost small', onclick: () => { if (!confirm) { confirm = true; delBtn.textContent = 'Oui, supprimer le paquet'; return; } d.decks = d.decks.filter(x => x !== k); save(); draw(); App.toast('Paquet supprimé.'); } }, '🗑 Supprimer');
        const toggle = h('button', { class: 'btn sec small', 'aria-expanded': 'false', onclick: () => { list.hidden = !list.hidden; toggle.setAttribute('aria-expanded', String(!list.hidden)); toggle.textContent = list.hidden ? '📋 Voir / modifier les cartes' : '▲ Masquer les cartes'; if (!list.hidden) fill(); } }, '📋 Voir / modifier les cartes');
        const txt = () => k.cards.map(x => `${x.q} ; ${x.a}`).join('\n');
        area.append(h('div', { class: 'card' }, h('div', { class: 'row', style: 'align-items:center' }, nameIn, h('span', { class: 'badge' }, `${c.total} carte${c.total > 1 ? 's' : ''}`), h('span', { class: 'badge ' + (c.due ? 'warn' : 'ok') }, `${c.due} à réviser`)), h('div', { class: 'row', style: 'margin-top:.4rem' }, toggle, h('button', { class: 'btn sec small', onclick: () => App.copy(txt()).then(() => App.toast('Cartes copiées (une par ligne : question ; réponse).')) }, '⧉ Copier'), h('button', { class: 'btn sec small', onclick: () => { const a = h('a', { href: URL.createObjectURL(new Blob([txt()], { type: 'text/plain;charset=utf-8' })), download: k.name.replace(/[^\w-]+/g, '_') + '.txt' }); document.body.append(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); } }, '⬇ Télécharger'), h('button', { class: 'btn ghost small', onclick: () => { k.cards.forEach(x => { x.box = 1; x.due = day(); }); save(); draw(); } }, '↺ Remettre à zéro'), delBtn), list));
      });
    };
    box.append(area); draw();
  }

  function add(box, goReview) {
    const d = load(); const out = h('div', { role: 'status', 'aria-live': 'polite' });
    const deckSel = h('select', { id: 'mmAddDeck', 'aria-label': 'Paquet' }); const fillSel = sel => { deckSel.replaceChildren(...d.decks.map(k => h('option', { value: k.id }, k.name)), h('option', { value: '__new' }, '➕ Nouveau paquet…')); if (sel) deckSel.value = sel; };
    fillSel(d.decks.length ? d.decks[d.decks.length - 1].id : '__new'); const newName = h('input', { type: 'text', placeholder: 'Nom du nouveau paquet', 'aria-label': 'Nom du nouveau paquet', style: 'max-width:18rem' }); const syncNew = () => { newName.hidden = deckSel.value !== '__new'; }; deckSel.addEventListener('change', syncNew); syncNew();
    const target = () => { if (deckSel.value === '__new') { const name = newName.value.trim() || 'Mon paquet'; const k = { id: uid(), name, cards: [] }; d.decks.push(k); fillSel(k.id); newName.value = ''; syncNew(); return k; } return d.decks.find(k => k.id === deckSel.value); };
    const q = h('textarea', { rows: 2, 'aria-label': 'Question ou mot', placeholder: 'Question (ou mot, date, formule…)' }), a = h('textarea', { rows: 2, 'aria-label': 'Réponse', placeholder: 'Réponse' });
    const addOne = () => { if (!q.value.trim() || !a.value.trim()) { App.toast('Écris la question et la réponse.'); return; } const k = target(); k.cards.push(mkCard(q.value, a.value)); save(); q.value = a.value = ''; q.focus(); out.replaceChildren(fb2(`✅ Carte ajoutée au paquet « ${k.name} » (${k.cards.length}).`)); };
    const fb2 = t => h('div', { class: 'notice ok' }, t);
    a.addEventListener('keydown', ev => { if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) { ev.preventDefault(); addOne(); } });
    const bulk = h('textarea', { rows: 6, 'aria-label': 'Importer plusieurs cartes', placeholder: 'une carte par ligne :\nla capitale de la France ; Paris\nle contraire de grand : petit' });
    const doBulk = () => { const r = parseLines(bulk.value); if (!r.ok.length) { out.replaceChildren(Sub.notice('warn', 'Je n’ai trouvé aucune carte. Écris une carte par ligne : question ; réponse')); return; } const k = target(); r.ok.forEach(([x, y]) => k.cards.push(mkCard(x, y))); save(); bulk.value = ''; out.replaceChildren(fb2(`✅ ${r.ok.length} carte(s) ajoutée(s) au paquet « ${k.name} ».` + (r.bad.length ? ` ${r.bad.length} ligne(s) ignorée(s) (pas de séparateur « ; » ou « : »).` : ''))); };
    const course = h('div');
    const scan = () => { const txt = (App.ws && App.ws.text) || ''; const r = parseLines(txt.split(/\r?\n/).filter(l => /[:;–—|]| - /.test(l) && l.length < 200).join('\n')).ok.filter(([x]) => x.split(/\s+/).length <= 8); course.replaceChildren(); if (!txt.trim()) { course.append(h('p', { class: 'muted' }, 'Ton cours est vide : colle un texte dans « Mes documents » ou « Correcteur ».')); return; } if (!r.length) { course.append(h('p', { class: 'muted' }, 'Je n’ai trouvé aucune ligne de la forme « terme : définition ». (Je ne comprends pas le texte : je repère seulement ce format.)')); return; } const checks = r.map(([x, y]) => { const i = h('input', { type: 'checkbox', checked: true }); return [i, x, y]; }); course.append(h('p', null, `${r.length} ligne(s) repérée(s) dans ton cours. Décoche celles que tu ne veux pas :`), h('ul', { style: 'list-style:none;padding:0' }, checks.map(([i, x, y]) => h('li', null, h('label', { class: 'chk' }, i, h('b', null, x), ' → ', y)))), h('button', { class: 'btn', onclick: () => { const k = target(); let n = 0; checks.forEach(([i, x, y]) => { if (i.checked) { k.cards.push(mkCard(x, y)); n++; } }); save(); out.replaceChildren(fb2(`✅ ${n} carte(s) ajoutée(s) au paquet « ${k.name} ».`)); } }, 'Ajouter les cartes cochées')); };
    box.append(
      h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Où ranger les cartes ?'), h('div', { class: 'row', style: 'align-items:center' }, h('label', { for: 'mmAddDeck', style: 'margin:0' }, 'Paquet'), deckSel, newName)),
      h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Une carte'), q, a, h('p', null, h('button', { class: 'btn', onclick: addOne }, '➕ Ajouter la carte'), h('span', { class: 'muted' }, '  (Ctrl + Entrée dans la réponse)'))),
      h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Plusieurs cartes d’un coup'), h('p', { class: 'muted' }, 'Une carte par ligne : question ; réponse (ou « : », « | », tabulation). Tu peux coller depuis un tableur.'), bulk, h('p', null, h('button', { class: 'btn', onclick: doBulk }, 'Importer'))),
      h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Depuis mon cours'), h('p', { class: 'muted' }, 'Repère les lignes « terme : définition » dans le cours partagé avec les autres outils.'), h('button', { class: 'btn sec', onclick: scan }, '🔎 Chercher dans mon cours'), course),
      h('div', { class: 'card secondary' }, h('h2', { style: 'margin-top:0' }, 'Paquets d’exemple'), h('p', { class: 'muted' }, 'Des cartes prêtes à l’emploi (calculées ou vérifiées ; tu peux les modifier).'), Object.keys(EXEMPLES).map(name => h('button', { class: 'btn sec', style: 'margin:.2rem', onclick: () => { let k = d.decks.find(x => x.name === name); if (!k) { k = { id: uid(), name, cards: [] }; d.decks.push(k); } const have = new Set(k.cards.map(c => c.q)); let n = 0; EXEMPLES[name].forEach(([x, y]) => { if (!have.has(x)) { k.cards.push(mkCard(x, y)); n++; } }); save(); fillSel(k.id); syncNew(); out.replaceChildren(fb2(`✅ Paquet « ${name} » : ${n} carte(s) ajoutée(s).`)); } }, '➕ ' + name))),
      out, h('p', null, h('button', { class: 'btn', onclick: goReview }, '▶ Aller réviser')));
  }

  App.reg({ id: 'memo', title: 'Cartes mémoire', group: 'outils', icon: '🃏', learn: true, render(el) {
    el.append(h('h1', null, '🃏 Cartes mémoire'), h('p', { class: 'muted' }, 'Révise tes leçons avec des cartes question → réponse. Les cartes que tu connais reviennent de plus en plus tard, celles que tu rates reviennent vite (boîtes de Leitner). Tout reste dans ce navigateur.'));
    // pour naviguer entre onglets depuis les boutons
    let tabsBar;
    Sub.tabs(el, [['Réviser', b => review(b, () => go(2))], ['Mes paquets', b => decks(b, () => go(2))], ['Ajouter', b => add(b, () => go(0))]]);
    tabsBar = el.querySelector('[role=tablist]'); const go = i => { const b = tabsBar && tabsBar.querySelectorAll('button')[i]; if (b) b.click(); };
  } });
  return { parseLines, rate, counts, due, INTERVAL, load: () => load() };
})();
