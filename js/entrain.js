// Entraînements : 1) Orthographe (homophones, ordre alphabétique)  2) Calcul mental, lecture de l'heure, monnaie.
// Phrases et exercices ORIGINAUX ; les calculs, heures et sommes sont générés puis vérifiés par le programme (rien d'inventé, rien envoyé sur internet).
const Entrain = (() => {
  const nrm = s => String(s).trim().toLowerCase().replace(/’/g, "'");
  const noAcc = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  const pick = a => a[Sub.rnd(0, a.length - 1)];
  const fb = (ok, ...c) => Sub.notice(ok ? 'ok' : 'warn', ...c);
  const summary = (title, score, total, again, extra) => h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, `${title} : ${score} / ${total}`), h('p', null, score === total ? '🎉 Sans faute !' : score >= total * .7 ? '👍 Très bien.' : '💪 Continue : on progresse en s’entraînant. Ce n’est pas un jugement, juste un repère.'), extra || null, h('button', { class: 'btn', onclick: again }, '↻ Nouvelle série'));
  const parseNum = s => { const t = String(s).replace(/\s/g, '').replace(',', '.').replace(/€|euros?|eur/gi, ''); if (!/^-?\d+(\.\d+)?$/.test(t)) return NaN; return parseFloat(t); };
  const eur = c => { const e = Math.floor(c / 100), r = c % 100; return r ? `${e},${String(r).padStart(2, '0')} €` : `${e} €`; };

  // ─────────────── HOMOPHONES ───────────────
  const PAIRS = {
    'a / à': ['a', 'à'], 'et / est': ['et', 'est'], 'on / ont': ['on', 'ont'], 'son / sont': ['son', 'sont'], 'ces / ses': ['ces', 'ses'], 'ce / se': ['ce', 'se'],
    'c’est / s’est': ['c’est', 's’est'], 'la / là / l’a': ['la', 'là', 'l’a'], 'ou / où': ['ou', 'où'], 'mais / mes': ['mais', 'mes'], 'peu / peut': ['peu', 'peut'],
    'sa / ça': ['sa', 'ça'], 'ma / m’a': ['ma', 'm’a'], 'quelle / qu’elle': ['quelle', 'qu’elle'], 'prêt / près': ['prêt', 'près'], 'plutôt / plus tôt': ['plutôt', 'plus tôt']
  };
  const ASTUCE = {
    'a / à': 'Essaie « avait » : si ça marche, c’est le verbe avoir (a). Sinon, c’est la préposition (à).',
    'et / est': 'Essaie « était » : si ça marche, c’est le verbe être (est). Sinon, c’est « et » (et puis).',
    'on / ont': 'Essaie « avaient » : si ça marche, c’est le verbe avoir (ont). Sinon c’est « on » (= nous, quelqu’un).',
    'son / sont': 'Essaie « étaient » : si ça marche, c’est le verbe être (sont). Sinon c’est « son » (à lui, à elle).',
    'ces / ses': 'Essaie « mes » : « ses » veut dire « à lui / à elle ». « ces » sert à montrer (ces livres-là).',
    'ce / se': 'Essaie « me » : si « je me lave » marche, c’est « se » (avec un verbe). « ce » est un déterminant (ce livre) ou un pronom (ce que).',
    'c’est / s’est': 'Essaie « je me suis » : « s’est » va avec un verbe au passé (il s’est levé). « c’est » = cela est.',
    'la / là / l’a': 'Essaie « l’avait » : si ça marche, c’est « l’a ». « là » indique un lieu (ici, là). « la » est un article (la maison).',
    'ou / où': 'Essaie « ou bien » : si ça marche, c’est « ou » sans accent. « où » avec accent parle d’un lieu ou d’un moment.',
    'mais / mes': 'Essaie « pourtant » : « mais » s’oppose. « mes » = à moi (mes clés), au pluriel.',
    'peu / peut': 'Essaie « pouvait » : si ça marche, c’est le verbe pouvoir (peut). « peu » = pas beaucoup.',
    'sa / ça': 'Essaie « cela » : si ça marche, c’est « ça ». « sa » = à lui, à elle (sa trousse).',
    'ma / m’a': 'Essaie « m’avait » : si ça marche, c’est « m’a » (avoir). « ma » = à moi (ma maison).',
    'quelle / qu’elle': 'Essaie « qu’il » : si « qu’il » marche à la place, c’est « qu’elle ». « quelle » sert à interroger ou s’exclamer (quelle heure ?).',
    'prêt / près': '« prêt » = préparé (prête, prêts). « près » = proche (près de la gare).',
    'plutôt / plus tôt': 'Essaie « plus tard » : si ça marche, c’est « plus tôt » (en deux mots). « plutôt » = de préférence.'
  };
  const HI = [
    ['a / à', 'Léa ___ un nouveau vélo.', 'a'], ['a / à', 'Nous allons ___ la piscine.', 'à'], ['a / à', 'Il pense ___ ses vacances.', 'à'], ['a / à', 'Mon frère ___ peur du noir.', 'a'],
    ['et / est', 'Le ciel ___ bleu.', 'est'], ['et / est', 'Elle chante ___ elle danse.', 'et'], ['et / est', 'Mon père ___ cuisinier.', 'est'], ['et / est', 'Du pain ___ du fromage.', 'et'],
    ['on / ont', 'Les enfants ___ fini leurs devoirs.', 'ont'], ['on / ont', '___ part en voyage demain.', 'on'], ['on / ont', 'Ils ___ de la chance.', 'ont'],
    ['son / sont', 'Les élèves ___ attentifs.', 'sont'], ['son / sont', 'Il range ___ cartable.', 'son'], ['son / sont', 'Elles ___ parties tôt.', 'sont'],
    ['ces / ses', 'Regarde ___ nuages, là-bas !', 'ces'], ['ces / ses', 'Paul aime beaucoup ___ grands-parents.', 'ses'], ['ces / ses', 'Tu vois ___ oiseaux dans l’arbre ?', 'ces'], ['ces / ses', 'Elle prête ___ crayons à sa sœur.', 'ses'],
    ['ce / se', 'Il ___ lave les mains.', 'se'], ['ce / se', '___ livre est passionnant.', 'ce'], ['ce / se', 'Elle ___ promène au parc.', 'se'], ['ce / se', 'Je lis ___ texte à voix haute.', 'ce'],
    ['c’est / s’est', '___ une belle journée.', 'c’est'], ['c’est / s’est', 'Il ___ blessé au genou.', 's’est'], ['c’est / s’est', 'Elle ___ levée tôt.', 's’est'], ['c’est / s’est', '___ mon ami d’enfance.', 'c’est'],
    ['la / là / l’a', 'Elle ___ vu hier au marché.', 'l’a'], ['la / là / l’a', 'Mets ton sac ___, sur la chaise.', 'là'], ['la / là / l’a', '___ maîtresse explique la leçon.', 'la'], ['la / là / l’a', 'Il ___ aidée à porter ses courses.', 'l’a'],
    ['ou / où', 'Veux-tu du thé ___ du café ?', 'ou'], ['ou / où', '___ habites-tu ?', 'où'], ['ou / où', 'La ville ___ je suis né est petite.', 'où'], ['ou / où', 'On y va à pied ___ en bus ?', 'ou'],
    ['mais / mes', 'Il pleut, ___ nous sortons.', 'mais'], ['mais / mes', 'J’ai oublié ___ clés.', 'mes'], ['mais / mes', 'Je voulais venir, ___ je suis malade.', 'mais'],
    ['peu / peut', 'Il ___ venir demain.', 'peut'], ['peu / peut', 'J’ai un ___ de temps.', 'peu'], ['peu / peut', 'Ce chien ___ courir très vite.', 'peut'],
    ['sa / ça', '___ va bien ?', 'ça'], ['sa / ça', 'Elle prend ___ trousse.', 'sa'], ['sa / ça', 'Je n’aime pas ___ !', 'ça'],
    ['ma / m’a', 'Il ___ prêté un livre.', 'm’a'], ['ma / m’a', 'Voici ___ maison.', 'ma'], ['ma / m’a', 'Elle ___ téléphoné hier.', 'm’a'],
    ['quelle / qu’elle', '___ belle journée !', 'quelle'], ['quelle / qu’elle', 'Je pense ___ viendra demain.', 'qu’elle'], ['quelle / qu’elle', 'Dis-moi ___ heure il est.', 'quelle'],
    ['prêt / près', 'Je suis ___ à partir.', 'prêt'], ['prêt / près', 'La gare est tout ___ d’ici.', 'près'], ['prêt / près', 'Le repas est ___.', 'prêt'],
    ['plutôt / plus tôt', 'Il est parti ___ que prévu.', 'plus tôt'], ['plutôt / plus tôt', 'Je préfère ___ le thé.', 'plutôt']
  ];
  const capIf = (w, sent) => /^___/.test(sent) ? w[0].toUpperCase() + w.slice(1) : w;

  function homophones(box) {
    const cfg = Object.assign({ pair: 'tous', n: 10 }, Store.get('homo.cfg', {})); const area = h('div');
    const start = () => {
      Store.set('homo.cfg', cfg);
      const pool = HI.filter(x => cfg.pair === 'tous' || x[0] === cfg.pair); const items = Sub.shuffle(pool).slice(0, Math.min(cfg.n, pool.length));
      let pos = 0, score = 0; const by = {};
      const ask = () => {
        area.replaceChildren();
        if (pos >= items.length) { const weak = Object.entries(by).filter(([, v]) => v.bad).map(([k, v]) => h('li', null, h('b', null, k), ' : ', ASTUCE[k])); area.append(summary('Homophones', score, items.length, start, weak.length ? h('div', null, h('p', null, 'À revoir :'), h('ul', null, weak)) : null)); return; }
        const [pair, sent, ans] = items[pos]; const opts = PAIRS[pair]; let done = false; const out = h('div', { role: 'status', 'aria-live': 'polite' });
        const filled = w => sent.replace('___', capIf(w, sent));
        const sentEl = h('p', { style: 'font-size:1.4rem;margin:.5rem 0' }, sent.split('___')[0], h('span', { class: 'blank', style: 'display:inline-block;min-width:3.5em;border-bottom:3px solid var(--accent);text-align:center;font-weight:700' }, ' '), sent.split('___')[1]);
        const nxt = h('button', { class: 'btn', hidden: true, onclick: () => { pos++; ask(); } }, pos + 1 >= items.length ? 'Voir mon résultat' : 'Phrase suivante ➜');
        const btns = opts.map(o => h('button', { class: 'btn sec', style: 'font-size:1.2rem;min-width:4.5em', onclick: () => {
          if (done) return; done = true; const ok = o === ans; by[pair] = by[pair] || { bad: 0 }; if (!ok) by[pair].bad++; else score++; Sub.logEx('Homophones', ok);
          sentEl.querySelector('.blank').textContent = capIf(ans, sent); sentEl.querySelector('.blank').style.color = ok ? 'var(--ok, #0a7a3b)' : 'var(--accent)';
          out.replaceChildren(fb(ok, ok ? '✅ Bien joué ! ' : `❌ C’était « ${ans} ». `, h('br'), '💡 ' + ASTUCE[pair]), h('p', { class: 'muted' }, filled(ans)));
          btns.forEach(b => b.disabled = true); nxt.hidden = false; nxt.focus();
        } }, o));
        area.append(h('div', { class: 'card' }, h('p', { class: 'muted', style: 'margin:0' }, `Phrase ${pos + 1} sur ${items.length}`), sentEl, h('div', { class: 'row' }, btns, h('button', { class: 'btn ghost small', onclick: () => Sub.say(sent.replace('___', 'blanc')) }, '🔊 Lire')), out, nxt));
      };
      ask();
    };
    const cfgUI = () => { area.replaceChildren(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Choisis les mots à travailler'), h('p', { class: 'muted' }, 'Pour chaque phrase, choisis le bon mot. Après la réponse, tu as l’astuce pour ne plus te tromper.'), h('div', { class: 'row' }, h('label', { for: 'hoP', style: 'margin:0' }, 'Mots'), h('select', { id: 'hoP', onchange: ev => { cfg.pair = ev.target.value; } }, [h('option', { value: 'tous', selected: cfg.pair === 'tous' }, 'Tous mélangés'), ...Object.keys(PAIRS).map(k => h('option', { value: k, selected: cfg.pair === k }, k))]), h('label', { for: 'hoN', style: 'margin:0' }, 'Phrases'), h('select', { id: 'hoN', onchange: ev => { cfg.n = +ev.target.value; } }, [5, 10, 15, 20].map(n => h('option', { value: n, selected: cfg.n === n }, n)))), h('p', null, h('button', { class: 'btn', onclick: start }, '▶ Commencer'))), h('div', { class: 'card secondary' }, h('h2', { style: 'margin-top:0' }, 'Les astuces en un coup d’œil'), h('table', { class: 't' }, h('tr', null, h('th', null, 'Mots'), h('th', null, 'Astuce')), Object.entries(ASTUCE).map(([k, v]) => h('tr', null, h('td', null, h('b', null, k)), h('td', null, v)))))); };
    box.append(area); cfgUI();
  }

  // ─────────────── ORDRE ALPHABÉTIQUE ───────────────
  const MOTS = 'abeille arbre avion araignée aiguille assiette ananas banane bateau bibliothèque bonbon bougie balai ballon bureau botte bébé bol boule bouteille boîte cahier camion carotte château chaise cheval chocolat cirque clavier crayon cuisine cerise canard couteau chat chien chapeau cochon coq coussin couverture corde cou couleur collier cartable cadeau cabane dauphin dessin drapeau dinosaure danse dent dragon école éléphant étoile éponge fenêtre fromage fusée fleur forêt fourchette fourmi fraise feuille famille ferme gâteau girafe guitare gomme glace grenouille gant jardin jouet journal lampe lapin lettre livre lune lion lit loup lunettes lac linge maison marteau montagne musée mouton manteau matin miroir moto melon marron main nuage nez nid noix orange ordinateur oreille oiseau pain papillon parapluie pomme poisson porte poule pinceau pirate plage planète poire prairie pantalon passoire panier parc pâtes pont poivre piano pizza piscine pied quartier question rivière robot rocher radio rideau renard riz roue ruche sable salade serpent soleil singe savon sorcière stylo sac salon sapin table tableau tortue train trousse tigre tomate tapis théâtre tulipe trèfle tracteur usine vache valise vélo verre village voiture vague vent vase wagon xylophone yaourt zèbre'.split(' ');
  function alphabet(box) {
    let level = Store.get('alpha.lvl', 1); const area = h('div');
    const make = () => {
      let words;
      if (level === 1) { const byL = {}; MOTS.forEach(w => { (byL[noAcc(w)[0]] = byL[noAcc(w)[0]] || []).push(w); }); const letters = Sub.shuffle(Object.keys(byL)).slice(0, 5); words = letters.map(l => pick(byL[l])); }
      else { const k = level === 2 ? 1 : 2, g = {}; MOTS.forEach(w => { const p = noAcc(w).slice(0, k); (g[p] = g[p] || []).push(w); }); const ok = Object.values(g).filter(a => a.length >= 5); words = Sub.shuffle(pick(ok)).slice(0, 5); }
      return Sub.shuffle(words);
    };
    const start = () => {
      Store.set('alpha.lvl', level); let rounds = 0, score = 0; const N = 6;
      const ask = () => {
        area.replaceChildren(); if (rounds >= N) { area.append(summary('Ordre alphabétique', score, N, start)); return; }
        const words = make(), good = words.slice().sort((a, b) => noAcc(a).localeCompare(noAcc(b), 'fr')), chosen = []; let done = false;
        const out = h('div', { role: 'status', 'aria-live': 'polite' }), line = h('p', { style: 'font-size:1.3rem;min-height:2.2rem;margin:.5rem 0' }), bank = h('div', { class: 'row' });
        const upd = () => { line.replaceChildren(chosen.length ? chosen.map((w, i) => h('span', { class: 'badge', style: 'margin:.15rem;font-size:1em' }, (i + 1) + '. ' + w)) : h('span', { class: 'muted' }, 'Touche les mots dans l’ordre : le premier de l’alphabet d’abord.')); $$('button', bank).forEach(b => b.disabled = chosen.includes(b.dataset.w) || done); chk.disabled = chosen.length < words.length || done; };
        words.forEach(w => bank.append(h('button', { class: 'btn sec', 'data-w': w, style: 'font-size:1.15rem', onclick: () => { chosen.push(w); upd(); } }, w)));
        const chk = h('button', { class: 'btn', disabled: true, onclick: () => {
          done = true; const ok = chosen.every((w, i) => w === good[i]); if (ok) score++; Sub.logEx('Ordre alphabétique', ok);
          const why = good.slice(0, -1).map((a, i) => { const b = good[i + 1], A = noAcc(a), B = noAcc(b); let k = 0; while (k < A.length && k < B.length && A[k] === B[k]) k++; return k < A.length && k < B.length ? `${a} avant ${b} : la lettre n°${k + 1} est « ${A[k]} » avant « ${B[k]} »` : `${a} avant ${b} : ${a} est plus court` });
          out.replaceChildren(fb(ok, ok ? '✅ Bravo, c’est le bon ordre !' : '❌ Pas tout à fait. Bon ordre : ' + good.join(' → ')), h('ul', { class: 'muted' }, why.map(t => h('li', null, t))), h('button', { class: 'btn', onclick: () => { rounds++; ask(); } }, rounds + 1 >= N ? 'Voir mon résultat' : 'Suite ➜')); upd();
        } }, 'Vérifier');
        area.append(h('div', { class: 'card' }, h('p', { class: 'muted', style: 'margin:0' }, `Série ${rounds + 1} sur ${N} — classe ces 5 mots par ordre alphabétique`), line, bank, h('p', null, chk, ' ', h('button', { class: 'btn ghost', onclick: () => { if (!done) { chosen.pop(); upd(); } } }, '↩ Retirer le dernier'), ' ', h('button', { class: 'btn ghost', onclick: () => { if (!done) { chosen.length = 0; upd(); } } }, 'Effacer')), out)); upd();
      };
      ask();
    };
    box.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Classer des mots dans l’ordre du dictionnaire'), h('p', { class: 'muted' }, 'Pour chercher un mot dans un dictionnaire, il faut connaître l’ordre alphabétique. Si deux mots commencent par la même lettre, on regarde la lettre suivante. Les accents ne comptent pas.'), h('div', { class: 'row' }, h('label', { for: 'alLv', style: 'margin:0' }, 'Niveau'), h('select', { id: 'alLv', onchange: ev => { level = +ev.target.value; } }, [[1, '1 — premières lettres différentes'], [2, '2 — même première lettre'], [3, '3 — mêmes deux premières lettres']].map(([v, l]) => h('option', { value: v, selected: v === level }, l))), h('button', { class: 'btn', onclick: start }, '▶ Commencer'))), area);
  }

  App.reg({ id: 'ortho', title: 'Orthographe : s’entraîner', group: 'entrainer', icon: '🧠', learn: true, render(el) {
    el.append(h('h1', null, '🧠 S’entraîner : orthographe'), h('p', { class: 'muted' }, 'Des exercices courts. Le programme te dit tout de suite si c’est juste, et te donne l’astuce. Rien n’est envoyé sur internet.'));
    Sub.tabs(el, [['Homophones (a/à, et/est…)', homophones], ['Ordre alphabétique', alphabet]]);
  } });

  // ─────────────── CALCUL MENTAL ───────────────
  const gen = (op, lvl) => {
    const r = Sub.rnd; let a, b, q, ans, txt, tip;
    if (op === 'add') {
      if (lvl === 1) { a = r(2, 9); b = r(2, 9); } else if (lvl === 2) { a = r(11, 89); b = r(2, 9); } else { a = r(11, 89); b = r(11, 89); }
      ans = a + b; txt = `${a} + ${b}`;
      if (b < 10) { const toTen = 10 - (a % 10); tip = (a % 10) + b > 10 && toTen <= b ? `Complète à la dizaine : ${a} + ${toTen} = ${a + toTen}, puis ajoute ${b - toTen} : ${a + toTen} + ${b - toTen} = ${ans}.` : `Ajoute les unités : ${a} + ${b} = ${ans}.`; }
      else { const t = Math.floor(b / 10) * 10, u = b % 10; tip = `Ajoute d’abord les dizaines : ${a} + ${t} = ${a + t}. Puis les unités : ${a + t} + ${u} = ${ans}.`; }
    } else if (op === 'sub') {
      if (lvl === 1) { a = r(10, 19); b = r(2, 9); } else if (lvl === 2) { a = r(21, 99); b = r(2, 9); } else { a = r(31, 99); b = r(11, a - 1); }
      ans = a - b; txt = `${a} − ${b}`;
      if (b < 10) { tip = (a % 10) < b ? `Passe par la dizaine : ${a} − ${a % 10} = ${a - (a % 10)}, puis retire encore ${b - (a % 10)} : ${a - (a % 10)} − ${b - (a % 10)} = ${ans}.` : `Retire les unités : ${a} − ${b} = ${ans}.`; }
      else { const t = Math.floor(b / 10) * 10, u = b % 10; tip = `Retire d’abord les dizaines : ${a} − ${t} = ${a - t}. Puis les unités : ${a - t} − ${u} = ${ans}.`; }
    } else if (op === 'mul') {
      if (lvl === 1) { a = pick([2, 3, 4, 5, 10]); b = r(2, 10); } else if (lvl === 2) { a = r(2, 9); b = r(2, 9); } else { a = r(11, 19); b = r(3, 9); }
      ans = a * b; txt = `${a} × ${b}`;
      if (lvl === 3) tip = `Sépare ${a} : ${Math.floor(a / 10) * 10} × ${b} = ${Math.floor(a / 10) * 10 * b} et ${a % 10} × ${b} = ${(a % 10) * b}. Additionne : ${Math.floor(a / 10) * 10 * b} + ${(a % 10) * b} = ${ans}.`;
      else if (a === 9 || b === 9) { const o = a === 9 ? b : a; tip = `Pour ×9 : fais ×10 puis retire une fois le nombre : ${o} × 10 = ${o * 10}, ${o * 10} − ${o} = ${ans}.`; }
      else if (a === 5 || b === 5) { const o = a === 5 ? b : a; tip = `Pour ×5 : prends la moitié de ×10 : ${o} × 10 = ${o * 10}, la moitié est ${ans}.`; }
      else if (a === 4 || b === 4) { const o = a === 4 ? b : a; tip = `Pour ×4 : double, puis double encore : ${o * 2}, puis ${ans}.`; }
      else if (a === 10 || b === 10) tip = 'Pour ×10, on ajoute un zéro.';
      else { const s = Math.max(a, b), t = Math.min(a, b); tip = t > 5 ? `Décompose : ${s} × ${t} = ${s} × 5 + ${s} × ${t - 5} = ${s * 5} + ${s * (t - 5)} = ${ans}.` : `Additionne ${t} fois ${s} : ${Array(t).fill(s).join(' + ')} = ${ans}.`; }
    } else { // division exacte
      if (lvl === 1) { b = pick([2, 5, 10]); q = r(2, 10); } else if (lvl === 2) { b = r(2, 9); q = r(2, 9); } else { b = r(3, 9); q = r(11, 19); }
      a = b * q; ans = q; txt = `${a} ÷ ${b}`;
      tip = lvl === 3 ? `Découpe ${a} : ${b * Math.floor(q / 10) * 10} ÷ ${b} = ${Math.floor(q / 10) * 10}, il reste ${b * (q % 10)} ÷ ${b} = ${q % 10}. Additionne : ${q}.` : `Cherche dans la table de ${b} : ${b} × ${q} = ${a}, donc ${a} ÷ ${b} = ${q}.`;
    }
    return { txt, ans, tip, op, lvl };
  };

  function calcul(box) {
    const cfg = Object.assign({ op: 'mix', lvl: 2, mode: 'n10', say: false }, Store.get('calc.cfg', {})); const area = h('div');
    const start = () => {
      Store.set('calc.cfg', cfg); const chrono = cfg.mode === 'chrono'; const N = chrono ? 999 : cfg.mode === 'n20' ? 20 : 10; let n = 0, score = 0, t0 = performance.now(), tmr = 0; const miss = [];
      const endAll = () => { clearInterval(tmr); const s = Math.round((performance.now() - t0) / 1000); area.replaceChildren(summary(chrono ? 'Bonnes réponses en 60 s' : 'Calcul mental', score, chrono ? n : N, start, h('div', null, h('p', { class: 'muted' }, chrono ? `${n} calculs en 60 s.` : `Temps : ${s} s (${(s / N).toFixed(1).replace('.', ',')} s par calcul).`), miss.length ? h('table', { class: 't' }, h('tr', null, h('th', null, 'Calcul'), h('th', null, 'Ta réponse'), h('th', null, 'Réponse'), h('th', null, 'Astuce')), miss.map(m => h('tr', null, h('td', null, m.txt), h('td', null, m.u || '—'), h('td', null, h('b', null, m.ans)), h('td', null, m.tip)))) : null))); };
      const ask = () => {
        if (n >= N) { endAll(); return; } const op = cfg.op === 'mix' ? pick(['add', 'sub', 'mul', 'div']) : cfg.op, q = gen(op, cfg.lvl); let done = false;
        const inp = h('input', { type: 'text', inputmode: 'numeric', autocomplete: 'off', 'aria-label': 'Ta réponse', style: 'width:8rem;font-size:1.6rem' }); const out = h('div', { role: 'status', 'aria-live': 'polite' });
        const nxt = h('button', { class: 'btn', hidden: true, onclick: () => { n++; ask(); } }, 'Suivant ➜');
        const ok1 = () => { if (done) return; const v = parseNum(inp.value); if (isNaN(v)) { App.toast('Écris un nombre.'); return; } done = true; const ok = v === q.ans; Sub.logEx('Calcul mental', ok); if (ok) { score++; out.replaceChildren(fb(true, '✅ Oui !')); n++; setTimeout(() => { if (area.isConnected) ask(); }, chrono ? 250 : 600); } else { miss.push({ txt: q.txt, u: inp.value.trim(), ans: q.ans, tip: q.tip }); out.replaceChildren(fb(false, `❌ ${q.txt} = `, h('b', null, q.ans)), h('p', null, '💡 ' + q.tip)); nxt.hidden = false; nxt.focus(); } inp.disabled = true; };
        inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); if (done) { if (!nxt.hidden) nxt.click(); } else ok1(); } });
        area.replaceChildren(h('div', { class: 'card' }, h('p', { class: 'muted', style: 'margin:0' }, chrono ? h('span', { id: 'cmT' }, '60 s') : `Calcul ${n + 1} sur ${N}`, chrono ? ` — ${score} bonne(s)` : ''), h('p', { style: 'font-size:2.4rem;margin:.4rem 0;font-weight:700' }, q.txt.replace('−', '−') + ' = ?'), h('div', { class: 'row', style: 'align-items:center' }, inp, h('button', { class: 'btn', onclick: ok1 }, 'Valider'), h('button', { class: 'btn ghost', onclick: () => Sub.say(q.txt.replace('×', ' fois ').replace('÷', ' divisé par ').replace('−', ' moins ').replace('+', ' plus ')) }, '🔊')), out, nxt)); inp.focus(); if (cfg.say) Sub.say(q.txt.replace('×', ' fois ').replace('÷', ' divisé par ').replace('−', ' moins ').replace('+', ' plus '));
      };
      if (chrono) tmr = setInterval(() => { const left = 60 - Math.round((performance.now() - t0) / 1000); const e = $('#cmT'); if (!area.isConnected) { clearInterval(tmr); return; } if (e) e.textContent = Math.max(0, left) + ' s'; if (left <= 0) endAll(); }, 250);
      ask();
    };
    area.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Calcul mental'), h('p', { class: 'muted' }, 'Pas de pression : le mode « 10 calculs » n’a pas de limite de temps. Après une erreur, tu vois une astuce pour calculer plus facilement.'), h('div', { class: 'row' },
      h('label', { for: 'cmOp', style: 'margin:0' }, 'Opération'), h('select', { id: 'cmOp', onchange: ev => { cfg.op = ev.target.value; } }, [['mix', 'Mélange'], ['add', 'Additions'], ['sub', 'Soustractions'], ['mul', 'Multiplications'], ['div', 'Divisions (exactes)']].map(([v, l]) => h('option', { value: v, selected: cfg.op === v }, l))),
      h('label', { for: 'cmLv', style: 'margin:0' }, 'Niveau'), h('select', { id: 'cmLv', onchange: ev => { cfg.lvl = +ev.target.value; } }, [[1, '1 — facile'], [2, '2 — moyen'], [3, '3 — difficile']].map(([v, l]) => h('option', { value: v, selected: cfg.lvl === v }, l))),
      h('label', { for: 'cmMo', style: 'margin:0' }, 'Durée'), h('select', { id: 'cmMo', onchange: ev => { cfg.mode = ev.target.value; } }, [['n10', '10 calculs'], ['n20', '20 calculs'], ['chrono', 'Chrono 60 s']].map(([v, l]) => h('option', { value: v, selected: cfg.mode === v }, l)))),
      h('p', null, h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: cfg.say, onchange: ev => { cfg.say = ev.target.checked; } }), 'Lire chaque calcul à voix haute'), ' ', h('button', { class: 'btn', onclick: start }, '▶ Commencer'))));
    box.append(area);
  }

  // ─────────────── LIRE L'HEURE ───────────────
  const UN = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  const nWord = n => { if (n < 20) return UN[n]; const d = Math.floor(n / 10), u = n % 10, T = ['', '', 'vingt', 'trente', 'quarante', 'cinquante'][d]; return u === 0 ? T : u === 1 ? T + ' et un' : T + '-' + UN[u]; };
  const hourWord = h12 => h12 === 0 ? 'minuit' : h12 === 12 ? 'midi' : nWord(h12) + (h12 === 1 ? ' heure' : ' heures');
  const timeWords = (hh, mm) => {
    const H = hh % 24; const hw = x => { const y = x % 24; return y === 0 ? 'minuit' : y === 12 ? 'midi' : (nWord(y % 12 || 12) === 'un' ? 'une heure' : nWord(y % 12 || 12) + ' heures'); };
    if (mm === 0) return hw(H);
    const nm = (H + 1) % 24, half = (H === 0 || H === 12) ? 'demi' : 'demie';
    if (mm === 15) return hw(H) + ' et quart'; if (mm === 30) return hw(H) + ' et ' + half; if (mm === 45) return hw(nm) + ' moins le quart';
    if (mm < 30) return hw(H) + ' ' + nWord(mm); if (mm % 5 === 0) return hw(nm) + ' moins ' + nWord(60 - mm);
    return hw(H) + ' ' + nWord(mm);
  };
  const clockSVG = (hh, mm, big) => {
    const a = (hh % 12) * 30 + mm * .5, b = mm * 6, rad = d => (d - 90) * Math.PI / 180, pt = (d, r) => [100 + r * Math.cos(rad(d)), 100 + r * Math.sin(rad(d))];
    let s = `<svg viewBox="0 0 200 200" width="${big ? 260 : 120}" height="${big ? 260 : 120}" role="img" aria-label="Horloge à aiguilles"><circle cx="100" cy="100" r="95" fill="var(--panel,#fff)" stroke="currentColor" stroke-width="4"/>`;
    for (let i = 0; i < 60; i++) { const [x1, y1] = pt(i * 6, i % 5 ? 88 : 82), [x2, y2] = pt(i * 6, 92); s += `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="currentColor" stroke-width="${i % 5 ? 1 : 3}"/>`; }
    if (big) for (let i = 1; i <= 12; i++) { const [x, y] = pt(i * 30, 68); s += `<text x="${x.toFixed(1)}" y="${(y + 6).toFixed(1)}" text-anchor="middle" font-size="18" font-weight="700" fill="currentColor">${i}</text>`; }
    const [hx, hy] = pt(a, 48), [mx, my] = pt(b, 76);
    s += `<line x1="100" y1="100" x2="${hx.toFixed(1)}" y2="${hy.toFixed(1)}" stroke="currentColor" stroke-width="7" stroke-linecap="round"/><line x1="100" y1="100" x2="${mx.toFixed(1)}" y2="${my.toFixed(1)}" stroke="var(--accent,#1d4ed8)" stroke-width="4" stroke-linecap="round"/><circle cx="100" cy="100" r="5" fill="currentColor"/></svg>`;
    return s;
  };
  function heure(box) {
    const cfg = Object.assign({ lvl: 2, mode: 'lire' }, Store.get('heure.cfg', {})); const area = h('div');
    const rndTime = lvl => { const hh = Sub.rnd(1, 12); const mm = lvl === 1 ? 0 : lvl === 2 ? pick([0, 15, 30, 45]) : lvl === 3 ? Sub.rnd(0, 11) * 5 : Sub.rnd(0, 59); return [hh, mm]; };
    const start = () => {
      Store.set('heure.cfg', cfg); let n = 0, score = 0; const N = 8;
      const ask = () => {
        if (n >= N) { area.replaceChildren(summary('Lire l’heure', score, N, start)); return; }
        const [hh, mm] = rndTime(cfg.lvl); let done = false; const out = h('div', { role: 'status', 'aria-live': 'polite' }); const nxt = h('button', { class: 'btn', hidden: true, onclick: () => { n++; ask(); } }, n + 1 >= N ? 'Voir mon résultat' : 'Suivant ➜');
        const reveal = ok => { done = true; Sub.logEx('Lire l’heure', ok); if (ok) score++; out.replaceChildren(fb(ok, ok ? '✅ Oui ! ' : '❌ Pas tout à fait. ', `Il est ${timeWords(hh, mm)} (${hh} h ${String(mm).padStart(2, '0')}).`), h('p', { class: 'muted' }, 'La petite aiguille donne les heures, la grande aiguille (bleue) donne les minutes : quand elle montre le 3, il y a 15 minutes.')); nxt.hidden = false; nxt.focus(); };
        if (cfg.mode === 'lire') {
          const hI = h('input', { type: 'text', inputmode: 'numeric', 'aria-label': 'Heures', style: 'width:4.5rem;font-size:1.5rem', maxlength: 2 }), mI = h('input', { type: 'text', inputmode: 'numeric', 'aria-label': 'Minutes', style: 'width:4.5rem;font-size:1.5rem', maxlength: 2 });
          const go = () => { if (done) return; const H = parseInt(hI.value, 10), M = parseInt(mI.value === '' ? '0' : mI.value, 10); if (isNaN(H) || isNaN(M)) { App.toast('Écris les heures et les minutes (0 si c’est pile).'); return; } reveal(H % 12 === hh % 12 && M === mm); hI.disabled = mI.disabled = true; };
          [hI, mI].forEach(i => i.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); if (done) nxt.click(); else go(); } }));
          area.replaceChildren(h('div', { class: 'card' }, h('p', { class: 'muted', style: 'margin:0' }, `Horloge ${n + 1} sur ${N} — Quelle heure est-il ?`), h('div', { html: clockSVG(hh, mm, true), style: 'text-align:center;margin:.4rem 0' }), h('div', { class: 'row', style: 'align-items:center;justify-content:center' }, hI, h('span', { style: 'font-size:1.5rem' }, 'h'), mI, h('button', { class: 'btn', onclick: go }, 'Valider'), h('button', { class: 'btn ghost', onclick: () => Sub.say('Il est ' + timeWords(hh, mm)) }, '🔊 Dire l’heure')), h('p', { class: 'muted', style: 'text-align:center;margin:.2rem' }, 'Heures de 1 à 12 ; minutes de 0 à 59.'), out, nxt)); hI.focus();
        } else {
          const opts = new Map(); opts.set(hh * 100 + mm, [hh, mm]); let guard = 0;
          while (opts.size < 4 && guard++ < 50) { const c = pick([[hh % 12 + 1, mm], [hh, (mm + 30) % 60], [hh, mm === 0 ? 30 : (60 - mm) % 60], [(mm / 5 | 0) || 12, hh * 5 % 60], [hh, (mm + 15) % 60], [(hh + 10) % 12 + 1, mm]]); opts.set(c[0] * 100 + c[1], c); }
          const list = Sub.shuffle([...opts.values()]);
          area.replaceChildren(h('div', { class: 'card' }, h('p', { class: 'muted', style: 'margin:0' }, `Question ${n + 1} sur ${N} — Quelle horloge montre cette heure ?`), h('p', { style: 'font-size:2rem;font-weight:700;text-align:center;margin:.4rem 0' }, `${hh} h ${String(mm).padStart(2, '0')}`, h('span', { class: 'muted', style: 'font-size:.6em;font-weight:400' }, ` (${timeWords(hh, mm)})`)), h('div', { class: 'row', style: 'justify-content:center' }, list.map(([H, M], i) => h('button', { class: 'btn sec', style: 'padding:.3rem', 'aria-label': 'Horloge ' + (i + 1), html: clockSVG(H, M, false), onclick: ev => { if (done) return; const ok = H === hh && M === mm; reveal(ok); ev.currentTarget.style.outline = '4px solid ' + (ok ? '#0a7a3b' : '#b91c1c'); $$('button.sec', area).forEach(b => b.disabled = true); } }))), out, nxt));
        }
      };
      ask();
    };
    box.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Lire l’heure sur une horloge à aiguilles'), h('p', { class: 'muted' }, 'La petite aiguille montre l’heure. La grande aiguille (bleue) montre les minutes : chaque petit trait compte 1 minute, chaque chiffre compte 5 minutes.'), h('div', { class: 'row' },
      h('label', { for: 'heM', style: 'margin:0' }, 'Exercice'), h('select', { id: 'heM', onchange: ev => { cfg.mode = ev.target.value; } }, [['lire', 'Je lis l’heure sur l’horloge'], ['choisir', 'Je choisis la bonne horloge']].map(([v, l]) => h('option', { value: v, selected: cfg.mode === v }, l))),
      h('label', { for: 'heL', style: 'margin:0' }, 'Niveau'), h('select', { id: 'heL', onchange: ev => { cfg.lvl = +ev.target.value; } }, [[1, '1 — heures pleines'], [2, '2 — et quart, et demie'], [3, '3 — toutes les 5 minutes'], [4, '4 — à la minute près']].map(([v, l]) => h('option', { value: v, selected: cfg.lvl === v }, l))), h('button', { class: 'btn', onclick: start }, '▶ Commencer'))), area);
  }

  // ─────────────── MONNAIE ───────────────
  const DEN = [[50000, 'billet de 500 €'], [20000, 'billet de 200 €'], [10000, 'billet de 100 €'], [5000, 'billet de 50 €'], [2000, 'billet de 20 €'], [1000, 'billet de 10 €'], [500, 'billet de 5 €'], [200, 'pièce de 2 €'], [100, 'pièce de 1 €'], [50, 'pièce de 50 c'], [20, 'pièce de 20 c'], [10, 'pièce de 10 c'], [5, 'pièce de 5 c'], [2, 'pièce de 2 c'], [1, 'pièce de 1 c']];
  const change = c => { const out = []; let r = c; for (const [v, l] of DEN) { const k = Math.floor(r / v); if (k) { out.push([k, l]); r -= k * v; } } return out; };
  const chip = (v, l, small) => { const note = v >= 500, coin = v < 500; const lab = v >= 100 ? (v / 100) + ' €' : v + ' c'; return h('span', { role: 'img', 'aria-label': l, title: l, style: `display:inline-flex;align-items:center;justify-content:center;margin:.15rem;font-weight:700;border:3px solid ${v >= 100 && v < 500 ? '#b8860b' : v < 100 ? '#a0522d' : '#0f766e'};background:${note ? '#e6f4f1' : v >= 100 ? '#fdf3c4' : '#f6dfce'};color:#222;${note ? 'width:5.2rem;height:2.8rem;border-radius:.3rem' : 'width:3rem;height:3rem;border-radius:50%'};${small ? 'font-size:.9rem' : 'font-size:1.05rem'}` }, lab); };
  const steps = (price, given) => { const R = [1, 5, 10, 50, 100, 500, 1000, 2000, 5000, 10000]; let cur = price; const out = []; while (cur < given) { let nx = given; for (const r of R) { if (cur % r !== 0) { nx = Math.min(Math.ceil(cur / r) * r, given); break; } } out.push([cur, nx]); cur = nx; } return out; };
  const OBJ = ['un cahier', 'une baguette', 'un jus de fruit', 'un stylo', 'une glace', 'un livre', 'un ticket de bus', 'un paquet de bonbons', 'une règle', 'une gomme', 'une pomme', 'un magazine'];
  function monnaie(box) {
    const cfg = Object.assign({ lvl: 2, mode: 'rendre' }, Store.get('monnaie.cfg', {})); const area = h('div');
    const start = () => {
      Store.set('monnaie.cfg', cfg); let n = 0, score = 0; const N = 8;
      const ask = () => {
        if (n >= N) { area.replaceChildren(summary('Monnaie', score, N, start)); return; }
        let q;
        if (cfg.mode === 'rendre') {
          let price, given; const lvl = cfg.lvl;
          if (lvl === 1) { price = Sub.rnd(1, 19) * 100; given = pick([2000, 2000, 1000].filter(g => g > price)) || 2000; }
          else if (lvl === 2) { price = Sub.rnd(1, 19) * 100 + pick([0, 50]); given = pick([500, 1000, 2000].filter(g => g > price)) || 2000; }
          else if (lvl === 3) { price = Sub.rnd(1, 39) * 50 + pick([0, 10, 20, 30, 40].map(x => x)) * 1; price = Math.max(price, 105); price -= price % 5; given = pick([500, 1000, 2000, 5000].filter(g => g > price)) || 5000; }
          else { price = Sub.rnd(101, 2999); given = pick([500, 1000, 2000, 5000].filter(g => g > price)) || 5000; }
          q = { kind: 'rendre', price, given, ans: given - price };
        } else {
          const lvl = cfg.lvl, pool = lvl === 1 ? [100, 200, 500, 1000] : lvl === 2 ? [50, 100, 200, 500, 1000, 20, 10] : DEN.map(d => d[0]).filter(v => v <= 5000); const items = []; let total = 0; const k = Sub.rnd(3, lvl === 1 ? 5 : 7);
          for (let i = 0; i < k; i++) { const v = pick(pool); items.push(v); total += v; }
          q = { kind: 'compter', items: items.sort((a, b) => b - a), ans: total };
        }
        let done = false; const out = h('div', { role: 'status', 'aria-live': 'polite' });
        const inp = h('input', { type: 'text', inputmode: 'decimal', autocomplete: 'off', 'aria-label': 'Ta réponse en euros', placeholder: 'ex. 3,50', style: 'width:9rem;font-size:1.4rem' });
        const nxt = h('button', { class: 'btn', hidden: true, onclick: () => { n++; ask(); } }, n + 1 >= N ? 'Voir mon résultat' : 'Suivant ➜');
        const go = () => { if (done) return; const v = parseNum(inp.value); if (isNaN(v)) { App.toast('Écris un nombre en euros (ex. 3,50).'); return; } done = true; inp.disabled = true; const ok = Math.round(v * 100) === q.ans; Sub.logEx('Monnaie', ok); if (ok) score++;
          if (q.kind === 'rendre') { const st = steps(q.price, q.given); out.replaceChildren(fb(ok, ok ? '✅ Oui, on rend ' : '❌ On rend ', h('b', null, eur(q.ans)), '.'), h('p', null, h('b', null, 'Méthode du complément : '), 'on part du prix et on ajoute jusqu’à la somme donnée. ', st.map(([a, b]) => `${eur(a)} → ${eur(b)} (+ ${eur(b - a)})`).join(' ; ')), h('p', null, 'À rendre : ', change(q.ans).map(([k, l]) => h('span', { style: 'white-space:nowrap' }, k > 1 ? k + ' × ' : '', chip(DEN.find(d => d[1] === l)[0], l, true), ' '))), h('p', { class: 'muted' }, 'Pour vérifier : prix + monnaie rendue = somme donnée.')); }
          else out.replaceChildren(fb(ok, ok ? '✅ Oui : ' : '❌ Le total est ', h('b', null, eur(q.ans)), '.'), h('p', { class: 'muted' }, 'Astuce : additionne d’abord les billets, puis les pièces d’euro, puis les centimes.')); nxt.hidden = false; nxt.focus(); };
        inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); if (done) nxt.click(); else go(); } });
        const head = q.kind === 'rendre' ? h('p', { style: 'font-size:1.3rem;margin:.4rem 0' }, `Tu achètes ${pick(OBJ)} à `, h('b', null, eur(q.price)), '. Tu paies avec ', h('b', null, eur(q.given)), '. Combien le vendeur te rend-il ?') : h('div', null, h('p', { style: 'font-size:1.2rem;margin:.4rem 0' }, 'Combien y a-t-il d’argent en tout ?'), h('div', null, q.items.map(v => chip(v, DEN.find(d => d[0] === v)[1]))));
        area.replaceChildren(h('div', { class: 'card' }, h('p', { class: 'muted', style: 'margin:0' }, `Question ${n + 1} sur ${N}`), head, h('div', { class: 'row', style: 'align-items:center' }, inp, h('span', null, '€'), h('button', { class: 'btn', onclick: go }, 'Valider')), out, nxt)); inp.focus();
      };
      ask();
    };
    box.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'La monnaie en euros'), h('p', { class: 'muted' }, 'Billets : 5, 10, 20, 50, 100, 200, 500 €. Pièces : 1, 2, 5, 10, 20, 50 centimes, 1 € et 2 €. 100 centimes = 1 €. Réponds avec une virgule ou un point (3,50 ou 3.5).'), h('div', { class: 'row' },
      h('label', { for: 'moM', style: 'margin:0' }, 'Exercice'), h('select', { id: 'moM', onchange: ev => { cfg.mode = ev.target.value; } }, [['rendre', 'Rendre la monnaie'], ['compter', 'Compter les billets et pièces']].map(([v, l]) => h('option', { value: v, selected: cfg.mode === v }, l))),
      h('label', { for: 'moL', style: 'margin:0' }, 'Niveau'), h('select', { id: 'moL', onchange: ev => { cfg.lvl = +ev.target.value; } }, [[1, '1 — euros entiers'], [2, '2 — avec 50 centimes'], [3, '3 — centimes (multiples de 5)'], [4, '4 — tous les centimes']].map(([v, l]) => h('option', { value: v, selected: cfg.lvl === v }, l))), h('button', { class: 'btn', onclick: start }, '▶ Commencer'))), area);
  }

  App.reg({ id: 'calcmental', title: 'Calcul mental, heure et monnaie', group: 'entrainer', icon: '🧮', learn: true, render(el) {
    el.append(h('h1', null, '🧮 Calcul mental, heure et monnaie'), h('p', { class: 'muted' }, 'Entraînements courts pour les calculs, la lecture de l’heure et l’argent. Les calculs sont tirés au hasard et corrigés par le programme, avec une astuce quand tu te trompes.'));
    Sub.tabs(el, [['Calcul mental', calcul], ['Lire l’heure', heure], ['Monnaie', monnaie]]);
  } });

  return { timeWords, nWord, gen, change, steps, HI, PAIRS, MOTS };
})();
