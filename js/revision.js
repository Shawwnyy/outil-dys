/* Outil Dys — Révision des dictées : mots ratés gardés en mémoire, révision espacée (boîtes de Leitner),
   dictée de texte lue à voix haute (avec la ponctuation), liste de mots, progrès, rappel quotidien (.ics).
   100 % local : tout reste dans ce navigateur (localStorage « dys.rev »). Aucune donnée n'est envoyée. */
'use strict';

const Rev = (() => {
  const DAY = 864e5, MIN = 6e4;
  // Délais entre deux révisions d'un mot, selon sa « boîte » (1 à 6). Valeurs choisies par l'application (méthode de Leitner),
  // pas mesurées sur toi : ce sont des repères, pas une règle universelle.
  const INT = [10 * MIN, DAY, 3 * DAY, 7 * DAY, 14 * DAY, 30 * DAY];
  const INT_LAB = ['10 min', '1 jour', '3 jours', '7 jours', '14 jours', '30 jours'];
  const D = Object.assign({ words: {}, texts: [], hist: [], opts: {} }, Store.get('rev', {}));
  D.opts = Object.assign({ cloze: true, punct: true, twice: true, chunks: true, rate: 0.85, wait: 'long', hour: '18:00', len: 10 }, D.opts);
  const save = () => Store.set('rev', D);

  // ---------------------------------------------------------------- petits outils
  const keyOf = w => String(w).normalize('NFC').toLowerCase().replace(/’/g, "'").trim();
  const reEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const sentences = t => (String(t).replace(/\s+/g, ' ').trim().match(/[^.!?…]+[.!?…]+["»”)]*|[^.!?…]+$/g) || []).map(s => s.trim()).filter(Boolean);
  const ctxOf = (ref, w) => { const nw = Dict.norm(w).toLowerCase(); for (const s of sentences(ref)) if (Dict.tok(s).some(t => Dict.norm(t).toLowerCase() === nw)) return s; return ''; };
  const blank = (ctx, w) => { if (!ctx) return null; const p = reEsc(w).replace(/['’]/g, "['’]"); const re = new RegExp('(?<![\\p{L}\\p{M}\\d])' + p + '(?![\\p{L}\\p{M}\\d])', 'iu'); return re.test(ctx) ? ctx.replace(re, '_____') : null; };
  const same = (typed, w, cat) => { const a = Dict.norm(typed.trim().replace(/\s+/g, ' ')), b = Dict.norm(w); return cat === 'typo' ? a === b : a.toLowerCase() === b.toLowerCase(); };
  const when = ts => { const d = ts - Date.now(); if (d <= 0) return 'maintenant'; if (d < 36e5) return `dans ${Math.max(1, Math.round(d / MIN))} min`; if (d < DAY) return `dans ${Math.round(d / 36e5)} h`; return `dans ${Math.round(d / DAY)} j`; };
  const dueList = () => Object.values(D.words).filter(x => x.due <= Date.now()).sort((a, b) => a.due - b.due);
  const topCat = it => Object.entries(it.cats || {}).sort((a, b) => b[1] - a[1]).map(x => x[0])[0] || 'ortho';
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const day = ts => new Date(ts).toISOString().slice(0, 10);

  // Astuces d'école usuelles (substitutions), par mot juste. Repères généraux : ils ne remplacent pas un enseignant.
  const MEMO = {
    'a': '« a » (verbe avoir) : on peut le remplacer par « avait ».', 'à': '« à » (préposition) : on ne peut pas dire « avait ».',
    'et': '« et » : on peut dire « et puis ».', 'est': '« est » (verbe être) : on peut dire « était ».',
    'ou': '« ou » : on peut dire « ou bien ».', 'où': '« où » : lieu ou moment (Où est-il ? Le jour où…).',
    'son': '« son » : on peut dire « mon » (son livre / mon livre).', 'sont': '« sont » (verbe être) : on peut dire « étaient ».',
    'on': '« on » : on peut dire « il ».', 'ont': '« ont » (verbe avoir) : on peut dire « avaient ».',
    'ses': '« ses » : on peut dire « mes » (ses livres / mes livres).', 'ces': '« ces » : désigne des choses qu’on montre ; au singulier : ce / cet / cette.',
    'ce': '« ce » : devant un nom, au pluriel : « ces ».', 'mes': '« mes » : on peut dire « tes » ou « ses ».', 'mais': '« mais » : on peut dire « pourtant ».',
    'la': '« la » : article, on peut dire « une » (la maison / une maison).', 'là': '« là » : lieu, on peut dire « ici ».',
    'peu': '« peu » : veut dire « pas beaucoup ».', 'peut': '« peut » (verbe pouvoir) : on peut dire « pouvait ».',
    'leur': '« leur » devant un verbe : on peut dire « lui » (je leur parle / je lui parle) ; « leurs » devant un nom pluriel prend un s.',
    'leurs': '« leurs » : devant un nom au pluriel (leurs livres).', "c'est": '« c’est » : on peut dire « cela est ».', "s'est": '« s’est » : on peut dire « s’était ».',
    'quand': '« quand » : on peut dire « lorsque » ; « quant à » = « en ce qui concerne ».', 'quant': '« quant à » : veut dire « en ce qui concerne ».',
    'quel': '« quel » : s’accorde avec le nom (quel garçon, quelle fille).', 'quelle': '« quelle » : s’accorde avec le nom féminin (quelle fille).',
    "t'a": '« t’a » : on peut dire « t’avait ».', 'ta': '« ta » : on peut dire « ma » (ta table / ma table).', "n'y": '« n’y » : négation + y (Il n’y a pas).', 'ni': '« ni… ni » : deux choses niées.'
  };
  const TIP = {
    ortho: 'Épelle le mot lettre par lettre à voix haute ; cherche un mot de la même famille (chant → chanter) ; vérifie les accents.',
    gram: 'Cherche le mot auquel il se rapporte (le nom ou le sujet) et accorde-le : genre (masculin / féminin) et nombre (un / plusieurs).',
    homo: 'Deux mots qui sonnent pareil : remplace-les par l’astuce du mémo (avait, était, mon, mes…) pour choisir le bon.',
    typo: 'Une phrase commence par une majuscule ; les noms propres aussi.',
    manque: 'Relis en suivant chaque mot avec le doigt : il manque peut-être un petit mot (de, le, la, ne).',
    synt: 'Relis la phrase à voix haute : un mot est peut-être en trop ou à la place d’un autre.',
    ponct: 'Un point à la fin de chaque phrase, une virgule quand la voix fait une petite pause.',
    accord: 'Pour le participe passé : cherche le COD ; s’il est placé avant le verbe avec « avoir », on accorde.',
    conj: 'Trouve le sujet, puis le temps : l’infinitif (-er, -ir…) ou le participe (-é, -i…) ?'
  };
  const memoFor = it => { const m = MEMO[keyOf(it.w)]; return m ? `Astuce : ${m}` : (TIP[topCat(it)] ? `Conseil : ${TIP[topCat(it)]}` : ''); };

  // ---------------------------------------------------------------- mémoire des mots
  /** Garde les mots ratés d'un rapport Dict.report(user, ref). Retourne le nombre de NOUVEAUX mots. */
  const capture = (rep, ref) => {
    if (!rep || !rep.ops) return 0; let n = 0; const now = Date.now();
    rep.ops.forEach(o => {
      if (o.t !== 'sub' && o.t !== 'del') return; const a = o.a; if (!a || !/\p{L}/u.test(a)) return;
      const cat = Dict.classify(o)[0]; if (cat === 'ponct') return;
      const k = keyOf(a); let it = D.words[k];
      if (!it) { it = D.words[k] = { w: a, ctx: '', cats: {}, wrongs: [], box: 0, due: now, seen: 0, ok: 0, ko: 0, errs: 0, added: now, manual: false }; n++; } else { it.box = 0; it.due = now; }
      it.w = a; it.errs = (it.errs || 0) + 1; it.cats[cat] = (it.cats[cat] || 0) + 1; if (!it.ctx) it.ctx = ctxOf(ref, a);
      if (o.t === 'sub' && o.b && !it.wrongs.includes(o.b)) it.wrongs = [...it.wrongs, o.b].slice(-5);
    });
    save(); return n;
  };
  const grade = (it, ok) => { it.seen = (it.seen || 0) + 1; it.last = Date.now(); if (ok) { it.ok = (it.ok || 0) + 1; it.box = Math.min(5, (it.box || 0) + 1); } else { it.ko = (it.ko || 0) + 1; it.box = 0; } it.due = Date.now() + INT[it.box]; save(); };
  const addManual = (w, ctx) => { w = w.trim(); if (!w) return false; const k = keyOf(w); const now = Date.now(); const it = D.words[k] || (D.words[k] = { w, ctx: '', cats: {}, wrongs: [], box: 0, due: now, seen: 0, ok: 0, ko: 0, errs: 0, added: now, manual: true }); it.w = w; if (ctx && ctx.trim()) it.ctx = ctx.trim(); it.due = Math.min(it.due, now); save(); return true; };
  const hist = (kind, title, n, ok) => { D.hist.unshift({ ts: Date.now(), kind, title, n, ok }); D.hist.length = Math.min(D.hist.length, 200); save(); };
  const logEx = ok => { App.stats.exos.push({ ts: Date.now(), cat: 'dictee', ok1: ok, ok2: ok, lvl: 0 }); App.stats.counts.exercises = (App.stats.counts.exercises || 0) + 1; };

  // différence lettre à lettre (LCS) : lettres justes / fautes
  const letters = (typed, right) => {
    const A = [...right], B = [...typed.trim()], n = A.length, m = B.length; const L = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = A[i].toLowerCase() === B[j].toLowerCase() ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
    const mA = Array(n).fill(false), mB = Array(m).fill(false); let i = 0, j = 0;
    while (i < n && j < m) { if (A[i].toLowerCase() === B[j].toLowerCase()) { mA[i] = mB[j] = true; i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
    const c = App.color('ortho'), bad = App.rgba(c, .4);
    const fmt = (arr, ok) => arr.map((ch, k) => ok[k] ? esc(ch) : `<span style="background:${bad};border-bottom:3px solid ${c};border-radius:3px">${esc(ch)}</span>`).join('');
    return { you: fmt(B, mB), right: fmt(A, mA) };
  };

  // ---------------------------------------------------------------- voix
  const SAY = [[/\s*(\.\.\.|…)\s*/g, ' points de suspension '], [/\s*;\s*/g, ' point-virgule '], [/\s*:\s*/g, ' deux-points '], [/\s*\?\s*/g, ' point d’interrogation '], [/\s*!\s*/g, ' point d’exclamation '], [/\s*,\s*/g, ' virgule '], [/\s*\.\s*/g, ' point '], [/«\s*/g, ' ouvrez les guillemets '], [/\s*»/g, ' fermez les guillemets ']];
  const dictable = (t, punct) => punct ? SAY.reduce((s, [re, r]) => s.replace(re, r), t).replace(/\s+/g, ' ').trim() : t;
  const say = (text, rate) => new Promise(res => {
    let done = false; const fin = () => { if (!done) { done = true; res(); } };
    const words = text.split(/\s+/).length; const u = App.speak(text, { rate: rate || D.opts.rate, onEnd: fin }); if (!u) { fin(); return; }
    setTimeout(fin, Math.max(4000, words * 900 / (rate || D.opts.rate) + 3000)); // filet : certaines voix ne signalent jamais la fin
  });
  const WAIT = { court: 700, normal: 1200, long: 2000 };
  const units = (t, chunks) => { const out = [];
    sentences(t).forEach(s => { if (!chunks) { out.push(s); return; } let cur = '';
      s.split(/(?<=[,;:])\s+/).forEach(p => { cur = cur ? cur + ' ' + p : p; if (cur.split(/\s+/).length >= 3) { out.push(cur); cur = ''; } });
      if (cur) { if (out.length && !/[.!?…»”]$/.test(out[out.length - 1])) out[out.length - 1] += ' ' + cur; else out.push(cur); } });
    return out; };

  // Textes de dictée écrits pour l'application (originaux). Niveaux 1 à 3.
  const TEXTS = [
    [1, 'La matinée de Léa', 'Le matin, Léa prend son petit déjeuner. Elle mange du pain avec de la confiture et elle boit un verre de lait. Ensuite, elle met son manteau et elle part à l’école.'],
    [1, 'Dans le jardin', 'Dans le jardin, les oiseaux chantent. Un chat gris dort près de la porte. Les enfants jouent au ballon pendant que leur grand-mère arrose les fleurs.'],
    [2, 'Au marché', 'Hier, nous sommes allés au marché avec ma tante. Elle a acheté des pommes, des poires et un gros melon. Mes cousins ont choisi des fraises, car ils les aiment beaucoup. Sur le chemin du retour, il a commencé à pleuvoir.'],
    [2, 'Les clés', 'Où sont les clés de la voiture ? Mon père ne les trouve plus. Il pense qu’elles sont tombées de son sac ou qu’elles sont restées sur la table de la cuisine. Ses enfants cherchent partout, mais ils ne les voient pas.'],
    [3, 'Les lettres', 'Les lettres que Camille avait écrites ont mis plusieurs jours à arriver. Bien qu’elle les ait postées lundi, ses amies ne les ont reçues que vendredi. Elles se sont dit que la poste devrait aller plus vite.'],
    [3, 'Le rangement', 'Quelques élèves, que le professeur avait félicités, sont restés pour ranger la salle. Quoiqu’ils soient fatigués, ils ont rangé les chaises et ils ont éteint les lumières. Quant à Inès, elle est rentrée tout de suite.']
  ];

  // ================================================================ onglet 1 : réviser mes mots
  const tabReview = b => {
    const view = h('div'); let Q = [], i = 0, okN = 0, ans = [];
    const head = () => { const n = dueList().length, tot = Object.keys(D.words).length; return h('p', { 'aria-live': 'polite' }, h('b', null, `${n} mot${n > 1 ? 's' : ''} à réviser maintenant`), ` · ${tot} mot${tot > 1 ? 's' : ''} gardé${tot > 1 ? 's' : ''} au total`); };
    const home = () => {
      const n = dueList().length; const lenSel = h('select', { 'aria-label': 'Nombre de mots par séance', onchange: ev => { D.opts.len = +ev.target.value; save(); } }, [5, 10, 20, 40].map(v => h('option', { value: v, selected: v === D.opts.len }, `${v} mots`)));
      const cl = h('input', { type: 'checkbox', checked: D.opts.cloze, onchange: ev => { D.opts.cloze = ev.target.checked; save(); } });
      view.replaceChildren(head(),
        Object.keys(D.words).length ? '' : Sub.notice('secondary', h('b', null, 'Rien à réviser pour l’instant. '), 'Les mots que tu rates dans une dictée (onglet « Dictée de texte », ou « Entraînement » de l’outil Dictée) sont gardés ici automatiquement. Tu peux aussi ajouter un mot toi-même dans l’onglet « Mes mots ».'),
        h('div', { class: 'row' }, h('label', { style: 'margin:0' }, 'Séance de ', lenSel), h('label', { style: 'margin:0;display:flex;gap:.4rem;align-items:center' }, cl, 'Montrer la phrase à trous (sinon : écoute seulement)')),
        h('div', { class: 'row', style: 'margin-top:.6rem' }, h('button', { class: 'btn', disabled: !n, onclick: () => start(dueList()) }, `▶ Réviser ${Math.min(n, D.opts.len)} mot${Math.min(n, D.opts.len) > 1 ? 's' : ''}`), h('button', { class: 'btn sec', disabled: !Object.keys(D.words).length, onclick: () => start(Object.values(D.words)) }, '🔁 S’entraîner sur tous mes mots')),
        h('p', { class: 'muted' }, 'Principe : un mot réussi passe dans une boîte suivante et revient plus tard (10 min → 1 j → 3 j → 7 j → 14 j → 30 j). Un mot raté revient dans la première boîte. Ces délais sont des repères choisis par l’application, pas une mesure de ta mémoire : tu peux réviser quand tu veux.'));
    };
    const start = list => { const pool = Sub.shuffle(list).slice(0, D.opts.len); if (!pool.length) return App.toast('Aucun mot à réviser.'); Q = pool; i = 0; okN = 0; ans = []; show(); };
    const show = () => {
      if (i >= Q.length) return finish(); const it = Q[i]; const cz = D.opts.cloze ? blank(it.ctx, it.w) : null;
      const inp = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false', 'aria-label': 'Ta réponse : le mot à écrire', style: 'font-size:1.3rem;max-width:20rem' });
      const fb = h('div', { 'aria-live': 'polite' }); let done = false;
      const sayCtx = r => App.speak(it.ctx || it.w, { rate: App.prefs.ttsRate * r }), sayWord = r => App.speak(it.w, { rate: App.prefs.ttsRate * r });
      const check = () => {
        if (done) return; if (!inp.value.trim()) return App.toast('Écris ta réponse d’abord.'); done = true; inp.disabled = true; btn.disabled = true;
        const ok = same(inp.value, it.w, topCat(it)); grade(it, ok); logEx(ok); if (ok) okN++; ans.push([it.w, ok]);
        const d = letters(inp.value, it.w);
        fb.replaceChildren(ok ? Sub.notice('ok', h('b', null, '✅ Bien écrit. '), `Le mot passe en boîte ${it.box + 1} : il reviendra ${when(it.due)}.`)
          : Sub.notice('bad', h('b', null, '✖ Pas tout à fait. '), 'Tu as écrit : ', h('span', { class: 'marked', style: 'display:inline;padding:.1rem .4rem', html: d.you }), ' — on écrit : ', h('span', { class: 'marked', style: 'display:inline;padding:.1rem .4rem', html: d.right }), h('div', { class: 'muted' }, `Il revient dans la boîte 1 (${when(it.due)}).`)),
          it.ctx ? h('div', { class: 'card' }, h('b', null, 'La phrase : '), it.ctx) : '', memoFor(it) ? h('p', { class: 'muted' }, memoFor(it)) : '',
          h('div', { class: 'row' }, App.listenBtn(() => it.w, '🔊 Réécouter le mot'), h('button', { class: 'btn', onclick: () => { i++; show(); } }, i + 1 < Q.length ? 'Mot suivant ➜' : 'Voir le résultat'))); const nx = fb.querySelector('.btn:not(.sec)'); if (nx) nx.focus();
      };
      const btn = h('button', { class: 'btn', onclick: check }, '✔ Valider');
      inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); check(); } });
      view.replaceChildren(h('p', null, h('b', null, `Mot ${i + 1} / ${Q.length}`), h('progress', { max: Q.length, value: i, style: 'margin-left:.6rem', 'aria-label': 'Avancement' })),
        h('div', { class: 'card' }, h('p', { style: 'margin-top:0' }, cz ? 'Écoute la phrase, puis écris le mot qui manque :' : 'Écoute, puis écris le mot (ou la suite de mots) que tu entends :'), cz ? h('div', { class: 'marked' }, cz) : '',
          h('div', { class: 'row', style: 'margin:.5rem 0' }, h('button', { class: 'btn sec', onclick: () => cz ? sayCtx(1) : sayWord(1) }, '🔊 Écouter'), h('button', { class: 'btn sec', onclick: () => cz ? sayCtx(.6) : sayWord(.6) }, '🐢 Plus lentement'), cz ? h('button', { class: 'btn sec', onclick: () => sayWord(.8) }, '🔊 Le mot seul') : '', App.stopBtn()), inp, h('div', { class: 'row', style: 'margin-top:.5rem' }, btn)), fb);
      inp.focus(); setTimeout(() => { if (view.isConnected && !done) (cz ? sayCtx : sayWord)(1); }, 250);
    };
    const finish = () => {
      hist('mots', 'Révision des mots', Q.length, okN); App.saveStats();
      const pct = Math.round(okN / Q.length * 100);
      view.replaceChildren(h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, `Séance terminée : ${okN} / ${Q.length} (${pct} %)`), h('ul', null, ans.map(([w, ok]) => h('li', null, ok ? '✅ ' : '✖ ', h('b', null, w)))), h('p', { class: 'muted' }, ok0(pct)), h('div', { class: 'row' }, h('button', { class: 'btn', onclick: home }, 'Retour'), dueList().length ? h('button', { class: 'btn sec', onclick: () => start(dueList()) }, 'Encore une séance') : '')));
    };
    const ok0 = p => p === 100 ? 'Tous les mots sont réussis : ils reviendront plus tard.' : 'Les mots ratés reviennent dans la première boîte : tu les reverras bientôt.';
    b.append(view); home();
  };

  // ================================================================ onglet 2 : dictée de texte
  const tabText = b => {
    const cfg = { src: 'bank', lvl: 1, own: '', title: '' }; const view = h('div'); let U = [], pos = 0, auto = false, ref = '';
    const sel = (label, val, opts, on) => h('label', null, label, ' ', h('select', { onchange: ev => on(ev.target.value) }, opts.map(([v, l]) => h('option', { value: v, selected: String(v) === String(val) }, l))));
    const ck = (label, key) => h('label', { style: 'display:flex;gap:.4rem;align-items:center;margin:.2rem 0' }, h('input', { type: 'checkbox', checked: D.opts[key], onchange: ev => { D.opts[key] = ev.target.checked; save(); } }), label);
    const text0 = () => {
      if (cfg.src === 'bank') { const p = TEXTS.filter(t => t[0] === +cfg.lvl); const t = p[Math.floor(Math.random() * p.length)]; return { title: t[1], text: t[2] }; }
      if (cfg.src === 'mine') { const t = D.texts.find(x => String(x.id) === String(cfg.mine)); return t ? { title: t.title, text: t.text } : null; }
      if (cfg.src === 'errors') { const ss = [...new Set(Object.values(D.words).filter(w => w.ctx).sort((a, b) => a.due - b.due).map(w => w.ctx))].slice(0, 8); return ss.length ? { title: 'Mes erreurs (phrases de mes dictées)', text: ss.join(' ') } : null; }
      return cfg.own.trim() ? { title: cfg.title.trim() || 'Mon texte', text: cfg.own.trim() } : null;
    };
    const setup = () => {
      const own = h('textarea', { rows: 4, 'aria-label': 'Mon texte à dicter', placeholder: 'Colle ici le texte d’une dictée (par exemple celle que ton enseignant t’a donnée, une fois corrigée).', oninput: ev => { cfg.own = ev.target.value; } }); own.value = cfg.own;
      const ttl = h('input', { type: 'text', 'aria-label': 'Titre du texte', placeholder: 'Titre (facultatif)', oninput: ev => { cfg.title = ev.target.value; } }); ttl.value = cfg.title;
      const mineOpts = D.texts.length ? D.texts.map(t => [t.id, `${t.title} (${t.last != null ? 'dernier score ' + t.last + ' %' : 'jamais fait'})`]) : [['', '(aucun texte enregistré)']];
      if (cfg.src === 'mine' && !cfg.mine && D.texts[0]) cfg.mine = D.texts[0].id;
      view.replaceChildren(
        h('div', { class: 'grid g2' }, sel('Texte', cfg.src, [['bank', 'Un texte de l’application'], ['errors', 'Mes erreurs : phrases où j’ai fait des fautes'], ['mine', 'Un de mes textes enregistrés'], ['own', 'Mon texte (je le colle)']], v => { cfg.src = v; setup(); }),
          cfg.src === 'bank' ? sel('Niveau', cfg.lvl, [[1, 'Niveau 1 (facile)'], [2, 'Niveau 2'], [3, 'Niveau 3 (difficile)']], v => { cfg.lvl = +v; }) : '', cfg.src === 'mine' ? sel('Mes textes', cfg.mine, mineOpts, v => { cfg.mine = v; }) : ''),
        cfg.src === 'own' ? h('div', null, ttl, own, h('div', { class: 'row', style: 'margin-top:.3rem' }, h('button', { class: 'btn sec', onclick: () => { if (!cfg.own.trim()) return App.toast('Colle d’abord un texte.'); D.texts.unshift({ id: Date.now(), title: cfg.title.trim() || 'Mon texte', text: cfg.own.trim(), last: null }); save(); App.toast('Texte enregistré dans « Mes textes ».'); } }, '💾 Enregistrer ce texte'))) : '',
        cfg.src === 'mine' && D.texts.length ? h('div', { class: 'row' }, h('button', { class: 'btn small danger', onclick: () => { const k = D.texts.findIndex(x => String(x.id) === String(cfg.mine)); if (k >= 0) { D.texts.splice(k, 1); save(); cfg.mine = ''; setup(); } } }, 'Supprimer ce texte')) : '',
        h('div', { class: 'card' }, h('b', null, 'Réglages de la lecture'), ck('Dire la ponctuation à voix haute (« virgule », « point »…), comme dans une dictée', 'punct'), ck('Lire chaque groupe de mots deux fois', 'twice'), ck('Découper aux virgules (groupes de mots courts)', 'chunks'),
          h('div', { class: 'grid g2' }, sel('Vitesse de la voix', D.opts.rate, [[0.6, 'Très lente'], [0.75, 'Lente'], [0.85, 'Un peu lente'], [1, 'Normale']], v => { D.opts.rate = +v; save(); }), sel('Temps pour écrire', D.opts.wait, [['court', 'Court'], ['normal', 'Normal'], ['long', 'Long']], v => { D.opts.wait = v; save(); })),
          h('p', { class: 'muted', style: 'margin:.3rem 0 0' }, 'Ces réglages sont à ajuster : ils ne conviennent pas à tout le monde. Le texte reste caché pendant la dictée.')),
        h('button', { class: 'btn', style: 'font-size:1.1rem', onclick: begin }, '▶ Commencer la dictée'));
    };
    const begin = () => { const t = text0(); if (!t) return App.toast(cfg.src === 'errors' ? 'Aucune phrase d’erreur gardée pour l’instant : fais d’abord une dictée.' : 'Choisis ou colle un texte.'); ref = null; run(t); };
    const run = t => {
      U = units(t.text, D.opts.chunks); ref = U.join(' '); pos = 0; auto = false; const cur = h('b', null); const ta = h('textarea', { rows: 8, spellcheck: 'false', autocapitalize: 'off', 'aria-label': 'Ma dictée : écris ici ce que tu entends', placeholder: 'Écris ici ce que tu entends…' });
      const upd = () => { cur.textContent = `Groupe de mots ${Math.min(pos + 1, U.length)} / ${U.length}`; };
      const one = async (k, r) => { if (!view.isConnected) return; await say(dictable(U[k], D.opts.punct), r); };
      const stop = () => { auto = false; App.stopSpeak(); };
      const play = async (r) => { stop(); await sleep(60); if (pos < U.length) one(pos, r); };
      const autoRun = async () => { stop(); await sleep(60); auto = true; const mine = ++runId; const alive = () => auto && mine === runId && view.isConnected;
        while (alive() && pos < U.length) { upd(); await one(pos, D.opts.rate); if (!alive()) break; if (D.opts.twice) { await sleep(900); if (!alive()) break; await one(pos, D.opts.rate); }
          if (!alive()) break; await sleep(1500 + U[pos].split(/\s+/).length * WAIT[D.opts.wait]); if (!alive()) break; pos++; }
        if (alive()) { auto = false; upd(); App.speak('Fin de la dictée. Relis-toi tranquillement, puis clique sur Corriger.', { rate: 1 }); } else if (!view.isConnected) { auto = false; App.stopSpeak(); } };
      const fin = () => {
        stop(); if (!ta.value.trim()) return App.toast('Écris d’abord ta dictée.'); const r = Dict.report(ta.value, ref); const n = capture(r, ref); const pct = r.score;
        App.stats.counts.dictations++; App.stats.exos.push({ ts: Date.now(), cat: 'dictee', ok1: pct === 100, ok2: pct === 100, lvl: cfg.src === 'bank' ? +cfg.lvl : 0, score: pct }); App.log('dictée de texte', t.title.slice(0, 40), { errors: r.items.map(i => ({ cat: i.cat })) });
        App.lastDictee = { text: ta.value, errors: [], fixed: ref, ref, report: r, train: true }; hist('dictee', t.title, r.total, r.ok); if (cfg.src === 'mine') { const sv = D.texts.find(x => String(x.id) === String(cfg.mine)); if (sv) { sv.last = pct; save(); } }
        const tb = h('table', { class: 't' }, h('tr', null, h('th', null, 'Catégorie'), h('th', null, 'Explication')), r.items.map(i => h('tr', null, h('td', null, h('span', { class: 'tagbox', style: `background:${App.color(i.cat)}` }, CAT[i.cat].icone + ' ' + CAT[i.cat].nom)), h('td', null, i.msg))));
        out.replaceChildren(h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, `Résultat : ${pct} % de mots justes (${r.ok} / ${r.total})`), h('div', { class: 'marked', html: r.html }), r.items.length ? tb : h('p', null, '🎉 Aucune différence : bravo !'),
          h('h3', null, 'Le texte était :'), h('div', { class: 'marked' }, ref),
          h('p', null, n ? `✚ ${n} nouveau${n > 1 ? 'x' : ''} mot${n > 1 ? 's' : ''} ajouté${n > 1 ? 's' : ''} à tes mots à réviser.` : (r.items.length ? 'Les mots ratés sont déjà dans tes mots à réviser (ils reviennent dans la première boîte).' : '')),
          h('div', { class: 'row' }, App.listenBtn(() => ref, '🔊 Réécouter le texte'), h('button', { class: 'btn', onclick: () => { const t0 = document.querySelector('#main [role="tab"]'); if (t0) t0.click(); } }, '🔁 Réviser mes mots maintenant'), h('button', { class: 'btn sec', onclick: () => { setup(); } }, 'Nouvelle dictée'))));
        out.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      };
      const out = h('div');
      view.replaceChildren(h('p', null, cur, h('span', { class: 'muted' }, ` · « ${t.title} »`)),
        h('div', { class: 'row' }, h('button', { class: 'btn', onclick: autoRun }, '▶ Lecture automatique'), h('button', { class: 'btn sec', onclick: () => play(D.opts.rate) }, '🔊 Répéter ce groupe'), h('button', { class: 'btn sec', onclick: () => play(.6) }, '🐢 Plus lentement'),
          h('button', { class: 'btn sec', onclick: () => { stop(); if (pos > 0) pos--; upd(); play(D.opts.rate); } }, '⏮ Précédent'), h('button', { class: 'btn sec', onclick: () => { stop(); if (pos < U.length - 1) pos++; upd(); play(D.opts.rate); } }, '⏭ Suivant'), h('button', { class: 'btn sec', onclick: stop }, '⏹ Arrêter')),
        ta, h('details', null, h('summary', null, '✔ Checklist de relecture (repères généraux)'), h('ul', null, h('li', null, 'Chaque phrase commence par une majuscule et finit par un point.'), h('li', null, 'J’ai relu en suivant les mots avec le doigt.'), h('li', null, 'J’ai vérifié les accords (le mot s’accorde avec quoi ?).'), h('li', null, 'J’ai pensé aux astuces : avait, était, mon, mes…'))),
        h('div', { class: 'row', style: 'margin:.5rem 0' }, h('button', { class: 'btn', onclick: fin }, '✔ J’ai fini : corriger'), h('button', { class: 'btn sec', onclick: () => { stop(); setup(); } }, '✖ Abandonner')), out);
      upd(); play(D.opts.rate);
    };
    let runId = 0; b.append(view); setup();
  };

  // ================================================================ onglet 3 : mes mots
  const download = (text, name, type) => App.download(new Blob([text], { type: type || 'text/plain;charset=utf-8' }), name);
  const tabWords = b => {
    let flt = 'all', q = ''; const list = h('div');
    const draw = () => {
      let a = Object.values(D.words); if (flt === 'due') a = a.filter(x => x.due <= Date.now()); else if (flt === 'done') a = a.filter(x => x.box >= 5); if (q) a = a.filter(x => keyOf(x.w + ' ' + (x.ctx || '')).includes(keyOf(q)));
      a.sort((x, y) => x.due - y.due || x.w.localeCompare(y.w, 'fr'));
      list.replaceChildren(a.length ? h('div', { style: 'overflow-x:auto' }, h('table', { class: 't' }, h('tr', null, ['Mot', 'Phrase', 'Fautes', 'Boîte', 'Prochaine révision', ''].map(x => h('th', null, x))), a.map(it => h('tr', null, h('td', null, h('b', null, it.w), h('div', { class: 'muted' }, (it.wrongs || []).length ? 'écrit : ' + it.wrongs.join(', ') : '')), h('td', null, it.ctx || h('span', { class: 'muted' }, '—')), h('td', null, String(it.errs || 0)), h('td', null, `${(it.box || 0) + 1} / 6`), h('td', null, when(it.due)),
        h('td', null, h('button', { class: 'btn small sec', 'aria-label': 'Écouter ' + it.w, onclick: () => App.speak(it.w) }, '🔊'), ' ', h('button', { class: 'btn small danger', 'aria-label': 'Supprimer ' + it.w, onclick: () => { delete D.words[keyOf(it.w)]; save(); draw(); } }, '🗑')))))) : h('p', { class: 'muted' }, Object.keys(D.words).length ? 'Aucun mot ne correspond.' : 'Aucun mot pour l’instant.'));
    };
    const w = h('input', { type: 'text', 'aria-label': 'Mot à retenir', placeholder: 'Un mot (ou une expression)', autocomplete: 'off', spellcheck: 'false' }), c = h('input', { type: 'text', 'aria-label': 'Phrase d’exemple (facultatif)', placeholder: 'Phrase d’exemple (facultatif) — le mot sera caché à la révision', style: 'width:100%' });
    const csv = () => ['mot;phrase;fautes;boite;prochaine_revision', ...Object.values(D.words).map(it => [it.w, it.ctx || '', it.errs || 0, (it.box || 0) + 1, new Date(it.due).toISOString()].map(x => '"' + String(x).replace(/"/g, '""') + '"').join(';'))].join('\n');
    const pdf = async () => { const a = Object.values(D.words).sort((x, y) => x.w.localeCompare(y.w, 'fr')); if (!a.length) return App.toast('Aucun mot.'); const d = await Rep.head('Ma fiche de révision', 'Mots à retenir', 'Liste écrite par Outil Dys à partir de mes dictées et de mes ajouts. Astuces : repères généraux.'); a.forEach(it => { d.h2(it.w); const L = []; if (it.ctx) L.push('Phrase : ' + it.ctx); if (MEMO[keyOf(it.w)]) L.push(MEMO[keyOf(it.w)]); if ((it.wrongs || []).length) L.push('Je l’ai écrit : ' + it.wrongs.join(', ')); d.bullets(L.length ? L : ['(pas de détail)']); }); App.download(await d.save('Fiche de révision'), 'fiche-revision-dictees.pdf'); };
    const imp = h('input', { type: 'file', accept: '.json', hidden: true, onchange: async ev => { const f = ev.target.files[0]; if (!f) return; try { const j = JSON.parse(await f.text()); let n = 0; Object.entries(j.words || {}).forEach(([k, v]) => { if (v && v.w && !D.words[k]) { D.words[k] = Object.assign({ ctx: '', cats: {}, wrongs: [], box: 0, due: Date.now(), seen: 0, ok: 0, ko: 0, errs: 0, added: Date.now() }, v); n++; } }); (j.texts || []).forEach(t => { if (t && t.text && !D.texts.some(x => x.id === t.id)) D.texts.push(t); }); save(); draw(); App.toast(`${n} mot(s) importé(s).`); } catch (e) { App.toast('Fichier illisible : choisis un export « .json » d’Outil Dys.'); } ev.target.value = ''; } });
    b.append(h('div', { class: 'card' }, h('b', null, 'Ajouter un mot'), h('div', { class: 'row' }, w, h('button', { class: 'btn', onclick: () => { if (addManual(w.value, c.value)) { w.value = ''; c.value = ''; draw(); App.toast('Mot ajouté.'); } else App.toast('Écris un mot.'); } }, '➕ Ajouter')), c),
      h('div', { class: 'row' }, h('label', { style: 'margin:0' }, 'Afficher ', h('select', { 'aria-label': 'Filtrer les mots', onchange: ev => { flt = ev.target.value; draw(); } }, [['all', 'Tous'], ['due', 'À réviser maintenant'], ['done', 'Maîtrisés (boîte 6)']].map(([v, l]) => h('option', { value: v }, l)))), h('input', { type: 'search', 'aria-label': 'Chercher un mot', placeholder: 'Chercher…', oninput: ev => { q = ev.target.value; draw(); } })),
      list, h('div', { class: 'row', style: 'margin-top:.6rem' }, h('button', { class: 'btn sec', onclick: pdf }, '📄 Ma fiche (PDF)'), h('button', { class: 'btn sec', onclick: () => download('﻿' + csv(), 'mots-a-reviser.csv', 'text/csv;charset=utf-8') }, '⬇ CSV'), h('button', { class: 'btn sec', onclick: () => download(JSON.stringify({ words: D.words, texts: D.texts }, null, 2), 'revision-dictees.json', 'application/json') }, '⬇ Sauvegarde (JSON)'), h('button', { class: 'btn sec', onclick: () => imp.click() }, '⬆ Importer une sauvegarde'), imp,
        h('button', { class: 'btn danger', onclick: () => { if (confirm('Effacer tous mes mots, textes et résultats de révision ? (Les autres données de l’application sont conservées.)')) { D.words = {}; D.texts = []; D.hist = []; save(); draw(); } } }, 'Tout effacer'))); draw();
  };

  // ================================================================ onglet 4 : progrès
  const tabProg = b => {
    const ws = Object.values(D.words), n = ws.length; const byBox = [0, 1, 2, 3, 4, 5].map(k => ws.filter(x => (x.box || 0) === k).length); const mx = Math.max(1, ...byBox);
    const cats = {}; ws.forEach(it => Object.entries(it.cats || {}).forEach(([c, v]) => cats[c] = (cats[c] || 0) + v)); const top = Object.entries(cats).sort((a, b2) => b2[1] - a[1]).slice(0, 4);
    const hrs = h('input', { type: 'time', value: D.opts.hour, 'aria-label': 'Heure du rappel quotidien', onchange: ev => { D.opts.hour = ev.target.value || '18:00'; save(); } });
    const ics = () => { const [hh, mm] = (D.opts.hour || '18:00').split(':'); const t = new Date(); t.setDate(t.getDate() + 1); const p = x => String(x).padStart(2, '0'); const ds = `${t.getFullYear()}${p(t.getMonth() + 1)}${p(t.getDate())}T${hh}${mm}00`; const st = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
      download(['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Outil Dys//Revision des dictees//FR', 'BEGIN:VEVENT', `UID:revision-${Date.now()}@outil-dys.local`, `DTSTAMP:${st}`, `DTSTART:${ds}`, 'DURATION:PT10M', 'RRULE:FREQ=DAILY', 'SUMMARY:Réviser mes mots (Outil Dys)', 'DESCRIPTION:10 minutes de révision des mots de dictée. Ouvre Outil Dys > Révision des dictées.', 'END:VEVENT', 'END:VCALENDAR'].join('\r\n'), 'rappel-revision-dictees.ics', 'text/calendar;charset=utf-8'); App.toast('Fichier calendrier téléchargé : ouvre-le pour l’ajouter à ton agenda.'); };
    const H = D.hist.slice(0, 10);
    b.append(h('div', { class: 'grid g3' }, [['Mots gardés', n], ['À réviser maintenant', dueList().length], ['Maîtrisés (boîte 6)', byBox[5]]].map(([l, v]) => h('div', { class: 'card', style: 'text-align:center;margin:0' }, h('div', { style: 'font-size:2rem;font-weight:700;color:var(--accent)' }, String(v)), h('div', { class: 'muted' }, l)))),
      h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, 'Mes mots par boîte'), byBox.map((v, k) => h('div', { class: 'row', style: 'gap:.5rem;margin:.2rem 0' }, h('span', { style: 'width:11rem' }, `Boîte ${k + 1} (${INT_LAB[k]})`), h('div', { role: 'img', 'aria-label': `${v} mot(s)`, style: `height:16px;border-radius:4px;background:var(--accent);width:${Math.max(2, v / mx * 55)}%` }), h('b', null, String(v))))),
      h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, 'Ce qui revient le plus'), top.length ? h('ul', null, top.map(([c, v]) => h('li', null, h('span', { class: 'tagbox', style: `background:${App.color(c)}` }, CAT[c].icone + ' ' + CAT[c].nom), ` ${CAT[c].libelle} : ${v} fois`, TIP[c] ? h('div', { class: 'muted' }, 'Conseil : ' + TIP[c]) : ''))) : h('p', { class: 'muted' }, 'Pas encore de données : fais une dictée.')),
      h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, 'Mes dernières séances'), H.length ? h('table', { class: 't' }, h('tr', null, ['Date', 'Activité', 'Résultat'].map(x => h('th', null, x))), H.map(x => h('tr', null, h('td', null, new Date(x.ts).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })), h('td', null, x.kind === 'mots' ? 'Révision de mots' : 'Dictée : ' + x.title), h('td', null, `${x.ok} / ${x.n} (${x.n ? Math.round(x.ok / x.n * 100) : 0} %)`)))) : h('p', { class: 'muted' }, 'Aucune séance pour l’instant.')),
      h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, 'Rappel quotidien'), h('p', { class: 'muted' }, 'L’application ne peut pas t’envoyer de notification (tout reste local). Elle crée un fichier calendrier : ton agenda (téléphone, ordinateur) te rappellera chaque jour.'), h('div', { class: 'row' }, h('label', { style: 'margin:0' }, 'Heure ', hrs), h('button', { class: 'btn sec', onclick: ics }, '📅 Télécharger le rappel (.ics)'))));
  };

  // ---------------------------------------------------------------- module
  const mount = (box, which) => { const t = { review: tabReview, text: tabText, words: tabWords, prog: tabProg }[which]; t(box); };
  App.reg({
    id: 'revision', title: 'Révision des dictées', group: 'outils', icon: '🔁', learn: true, render(el) {
      el.append(h('h1', null, '🔁 Révision des dictées'), Sub.notice('secondary', h('b', null, 'Comment ça marche : '), 'les mots que tu ratés en dictée sont gardés ici (dans ce navigateur seulement). Tu les révises en courtes séances, ils reviennent de plus en plus tard quand tu les réussis. La voix est celle de ton navigateur ; la correction compare ton texte à l’original mot à mot. Aucune donnée n’est envoyée.'));
      Sub.tabs(el, [['Réviser mes mots', tabReview], ['Dictée de texte', tabText], ['Mes mots', tabWords], ['Progrès', tabProg]]);
    }
  });
  return { capture, dueList, D, units, dictable, blank, letters, keyOf, addManual, grade, sentences };
})();
