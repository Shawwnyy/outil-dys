// Deux entraînements, tout reste sur l'appareil (rien n'est envoyé sur internet) :
//  1) Dictée orale : un narrateur (la voix du navigateur) lit un texte groupe de mots par groupe de mots ; la personne écrit ;
//     quand elle pense avoir fini, correction détaillée (faute par faute, avec l'explication et un conseil).
//  2) Dactylographie : écrire le plus vite possible, puis correction détaillée et touches à retravailler.
// Les textes ci-dessous sont des textes ORIGINAUX écrits pour l'outil (pas des extraits d'auteurs). Les niveaux sont indicatifs : ce n'est pas un programme officiel.
const Dictees = (() => {
  const nrm = s => String(s).replace(/’/g, "'");
  const TEXTES = [
    [1, 'Le marché', "Samedi matin, je vais au marché avec ma grand-mère. Elle achète des pommes, du pain et un gros fromage. Moi, je porte le panier. Nous rentrons à la maison avant midi."],
    [1, 'Le petit chien', "Mon petit chien s'appelle Pixel. Il aime courir dans le jardin et jouer avec une balle jaune. Quand il est fatigué, il dort sur le tapis du salon."],
    [1, 'La pluie', "Ce matin, il pleut sur la ville. Les enfants mettent leurs bottes et leurs manteaux. Ils sautent dans les flaques d'eau en riant."],
    [1, 'À la bibliothèque', "Léa choisit un livre à la bibliothèque. Elle s'installe près de la fenêtre et commence à lire. Le temps passe vite quand l'histoire est passionnante."],
    [2, 'La sortie scolaire', "Hier, notre classe est partie en sortie au bord de la rivière. Les élèves ont observé des canards et des poissons. Ils ont aussi ramassé des feuilles de toutes les couleurs. À la fin de la journée, tout le monde était fatigué mais content."],
    [2, 'Le vélo', "Mon frère a appris à faire du vélo l'été dernier. Il est tombé plusieurs fois, mais il n'a jamais abandonné. Maintenant, il roule vite et il se promène avec ses amis sur les chemins du village."],
    [2, 'Une recette', "Pour préparer un gâteau au chocolat, il faut d'abord casser trois œufs. Ensuite, on ajoute le sucre, la farine et le beurre fondu. Quand la pâte est lisse, on la verse dans un moule et on la fait cuire pendant trente minutes."],
    [2, 'Le jardin', "Les fleurs que ma voisine a plantées au printemps ont beaucoup poussé. Certaines sont rouges, d'autres sont jaunes. Les abeilles viennent chaque jour y chercher du nectar."],
    [3, 'Les saisons', "Les feuilles, qui étaient restées vertes tout l'été, sont tombées en quelques jours. Bien que le soleil brille encore, les matins sont devenus froids. Il faut que nous préparions nos vêtements chauds avant que l'hiver arrive."],
    [3, 'Les chercheurs', "Les chercheurs que nous avons rencontrés hier nous ont expliqué leur travail. Ils se sont passionnés pour les oiseaux dès leur enfance. Quoique le ciel soit souvent nuageux, ils ont réussi à photographier plusieurs espèces rares."],
    [3, 'Le vieux pont', "Le vieux pont, que les habitants avaient restauré avec soin, relie les deux rives de la rivière. Des centaines de visiteurs, venus de toute la région, l'ont traversé cet été. Personne n'imaginait qu'il serait aussi populaire."],
    [3, 'Une nouvelle école', "Quand elle est arrivée dans sa nouvelle école, Inès était timide et inquiète. Pourtant, ses camarades l'ont accueillie avec gentillesse et lui ont proposé de jouer avec eux. Elle s'est vite sentie à l'aise."]
  ];
  const NIV = { 1: 'Niveau 1 (facile)', 2: 'Niveau 2 (accords et homophones)', 3: 'Niveau 3 (difficile)' };
  const fmtN = n => String(n).replace('.', ',');

  // ── découpage en « groupes de souffle » : phrases, puis virgules, puis pas plus de ~8 mots ──
  const segments = text => {
    const out = [];
    nrm(text).replace(/\s+/g, ' ').trim().split(/(?<=[.!?…])\s+/).forEach(sent => {
      const pieces = [];
      sent.split(/(?<=[,;:])\s+/).forEach(p => { const w = p.split(' '); if (w.length > 9) { const k = Math.ceil(w.length / 7), size = Math.ceil(w.length / k); for (let i = 0; i < w.length; i += size) pieces.push(w.slice(i, i + size).join(' ')); } else pieces.push(p); });
      let cur = ''; pieces.forEach(p => { if (!cur) cur = p; else if ((cur + ' ' + p).split(' ').length <= 8 && !/[.!?…]$/.test(cur)) cur += ' ' + p; else { out.push(cur); cur = p; } }); if (cur) out.push(cur);
    });
    return out;
  };
  const PUNCT = [[/\.{3}|…/g, ' points de suspension '], [/\?/g, ' point d’interrogation '], [/!/g, ' point d’exclamation '], [/;/g, ' point-virgule '], [/:/g, ' deux-points '], [/,/g, ' virgule '], [/\./g, ' point '], [/«/g, ' ouvrez les guillemets '], [/»/g, ' fermez les guillemets ']];
  const spoken = (seg, withPunct) => { if (!withPunct) return seg; let s = seg; PUNCT.forEach(([re, w]) => { s = s.replace(re, w); }); return s.replace(/\s+/g, ' ').trim(); };

  // ── tableau de correction (partagé par la dictée et la dactylographie) ──
  const TIPS = { ortho: 'Relis chaque mot lentement : accents et lettres muettes.', homo: 'Pour un homophone, essaie de remplacer le mot (a / avait, à / à la, et / était, son / sont, ces / ses, ce / se…) et vérifie que la phrase garde son sens.', gram: 'Accord : cherche le sujet (qui fait l’action ?), accorde le verbe, puis le nom et son adjectif.', typo: 'Majuscule au début de chaque phrase et pour les noms propres.', ponct: 'Écoute les pauses du narrateur : virgule, point… Relis ta dictée en respirant aux virgules.', manque: 'Relis en comptant les groupes de mots : il en manque un.', synt: 'Relis phrase par phrase, à voix basse : est-ce bien ce que tu as entendu ?' };
  const errTable = items => { const tb = h('table', { class: 't' }, h('tr', null, h('th', null, '#'), h('th', null, 'Ta version'), h('th', null, 'Correction'), h('th', null, 'Type'), h('th', null, 'Pourquoi')));
    items.forEach((i, k) => { const o = i.o, mine = o.t === 'del' ? '(oublié)' : o.b, good = o.t === 'ins' ? '(à enlever)' : o.a; const c = CAT[i.cat] || { icone: '•', nom: i.cat };
      tb.append(h('tr', null, h('td', null, String(k + 1)), h('td', null, mine), h('td', null, h('b', null, good)), h('td', null, h('span', { class: 'tagbox', style: `background:${App.color(i.cat)}` }, c.icone + ' ' + c.nom)), h('td', null, i.msg))); });
    return tb; };
  const tipsFor = items => { const by = {}; items.forEach(i => { by[i.cat] = (by[i.cat] || 0) + 1; }); const ids = Object.keys(by).sort((a, b) => by[b] - by[a]); if (!ids.length) return null;
    return h('ul', null, ids.map(id => h('li', null, h('b', null, ((CAT[id] || {}).nom || id) + ' (' + by[id] + ') : '), TIPS[id] || 'Relis calmement.'))); };

  // ──────────────────────────────── 1) DICTÉE ORALE ────────────────────────────────
  const PAUSE = { courte: 1100, normale: 1700, longue: 2400 }; // millisecondes d'attente par mot, pour écrire
  const dictation = el => {
    const O = Object.assign({ id: 0, speed: 'normale', punct: true, auto: true, pause: 'normale' }, Store.get('dictorale.opts', {})); const save = () => Store.set('dictorale.opts', O);
    el.append(h('h1', null, 'Dictée orale avec narrateur'), Sub.notice('secondary', h('b', null, 'Comment ça marche : '), 'un narrateur lit d’abord le texte en entier, puis groupe de mots par groupe de mots (il dit « virgule », « point »…), puis le relit. Tu écris sur la feuille ci-dessous, sans voir le texte. Quand tu penses avoir fini, touche « J’ai terminé » : la correction est détaillée, faute par faute. La voix est celle de ton navigateur (tu peux la changer plus bas). Les textes sont écrits pour l’outil ; les niveaux sont indicatifs.'));
    if (!('speechSynthesis' in window)) el.append(Sub.notice('warn', 'La lecture à voix haute n’est pas disponible dans ce navigateur : le narrateur ne pourra pas parler. Tu peux coller ton texte et le faire lire par une autre personne.'));
    const sel = h('select', { 'aria-label': 'Texte de la dictée', onchange: ev => { O.id = ev.target.value === 'perso' ? 'perso' : +ev.target.value; save(); ownBox.open = O.id === 'perso'; stopAll(); phase = 'idle'; idx = -1; setStatus('Prêt.'); loadDraft(); } },
      [1, 2, 3].map(l => h('optgroup', { label: NIV[l] }, TEXTES.map((t, i) => t[0] === l ? h('option', { value: String(i), selected: String(O.id) === String(i) }, t[1]) : null))), h('optgroup', { label: 'Autre' }, h('option', { value: 'perso', selected: O.id === 'perso' }, 'Mon propre texte')));
    const own = h('textarea', { rows: 4, 'aria-label': 'Mon propre texte à dicter', placeholder: 'Colle ici le texte à dicter (un parent ou un enseignant peut le faire).' }); own.value = Store.get('dictorale.own', ''); own.addEventListener('input', () => { Store.set('dictorale.own', own.value); sel.value = 'perso'; O.id = 'perso'; save(); });
    const ownBox = h('details', { open: O.id === 'perso' }, h('summary', null, 'Mon propre texte'), own);
    const opt = (label, key, list) => h('label', null, label, h('select', { 'aria-label': label, onchange: ev => { O[key] = ev.target.value; save(); } }, list.map(([v, t]) => h('option', { value: v, selected: O[key] === v }, t))));
    const chk = (label, key) => h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: O[key], onchange: ev => { O[key] = ev.target.checked; save(); } }), label);
    const status = h('p', { role: 'status', 'aria-live': 'polite', style: 'font-weight:600;min-height:1.6em' }, 'Prêt.'); const setStatus = t => { status.textContent = t; };
    const ta = h('textarea', { id: 'dictIn', rows: 9, 'aria-label': 'Ta dictée : écris ici ce que tu entends', placeholder: 'Écris ici ce que le narrateur dicte…', spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off' });
    const out = h('div'), histBox = h('div');
    const getText = () => O.id === 'perso' ? own.value.trim() : (TEXTES[+O.id] || TEXTES[0])[2];
    const getTitle = () => O.id === 'perso' ? 'Mon texte' : (TEXTES[+O.id] || TEXTES[0])[1];
    const getLevel = () => O.id === 'perso' ? 0 : (TEXTES[+O.id] || TEXTES[0])[0];
    const loadDraft = () => { const d = Store.get('dictorale.draft', null); ta.value = d && d.k === String(O.id) ? d.v : ''; out.replaceChildren(); done = false; };
    let t0 = 0; ta.addEventListener('input', () => { clearTimeout(t0); t0 = setTimeout(() => Store.set('dictorale.draft', { k: String(O.id), v: ta.value }), 400); });

    // ── le narrateur ──
    let S = [], idx = -1, tok = 0, timer = 0, phase = 'idle', paused = false, done = false;
    const alive = () => el.isConnected; const clear = () => { clearTimeout(timer); timer = 0; };
    const stopAll = () => { tok++; clear(); App.stopSpeak(); };
    const rate = () => Math.max(0.5, Math.min(1.6, (App.prefs.ttsRate || 1) * ({ lente: .75, normale: 1, rapide: 1.15 }[O.speed] || 1)));
    const say = (txt, then) => { const my = ++tok; App.speak(txt, { rate: rate(), onEnd: () => { if (my === tok && alive() && then) then(); } }); };
    const wait = (ms, fn) => { clear(); timer = setTimeout(() => { if (alive()) fn(); }, ms); };
    const pauseMs = seg => Math.max(3000, seg.split(' ').length * (PAUSE[O.pause] || PAUSE.normale));
    const upd = () => { const n = S.length; prog.textContent = phase === 'seg' && n ? `Groupe de mots ${idx + 1} sur ${n}` : phase === 'intro' ? 'Écoute le texte en entier' : phase === 'outro' ? 'Dernière lecture' : ''; };
    const go = i => { if (i >= S.length) return outro(); idx = Math.max(0, i); phase = 'seg'; upd(); setStatus(`Écris ce que tu entends… (groupe ${idx + 1} sur ${S.length})`);
      const seg = S[idx]; say(spoken(seg, O.punct), () => { if (O.auto) { setStatus('À toi d’écrire… le narrateur continue tout seul (touche « Répéter » si besoin).'); wait(pauseMs(seg), () => go(idx + 1)); } else setStatus('Quand tu as écrit, touche « Suivant ». « Répéter » relit ce groupe.'); }); };
    const outro = () => { phase = 'outro'; upd(); setStatus('Dernière lecture du texte en entier : relis-toi.'); say(nrm(getText()), () => { phase = 'idle'; upd(); setStatus('La dictée est finie. Relis-toi, corrige si tu veux, puis touche « J’ai terminé ».'); }); };
    const start = () => { const text = getText(); if (!text) return App.toast('Choisis un texte, ou colle le tien.'); if (!('speechSynthesis' in window)) return App.toast('Le narrateur n’est pas disponible dans ce navigateur.'); stopAll(); paused = false; pb.textContent = '⏸ Pause'; S = segments(text); idx = -1; phase = 'intro'; ownBox.open = false; out.replaceChildren(); done = false; upd(); setStatus('Écoute d’abord le texte en entier. N’écris pas encore.');
      say(nrm(text), () => { setStatus('Maintenant, la dictée commence.'); wait(1500, () => go(0)); }); ta.focus(); };
    const repeat = () => { if (idx < 0) return App.toast('Touche d’abord « Commencer ».'); paused = false; pb.textContent = '⏸ Pause'; stopAll(); go(idx); };
    const next = () => { if (idx < 0 && phase !== 'intro') return App.toast('Touche d’abord « Commencer ».'); paused = false; pb.textContent = '⏸ Pause'; stopAll(); go(idx + 1); };
    const prev = () => { if (idx < 0) return; paused = false; pb.textContent = '⏸ Pause'; stopAll(); go(idx - 1); };
    const stop = () => { stopAll(); phase = 'idle'; paused = false; pb.textContent = '⏸ Pause'; upd(); setStatus('Arrêté.'); };
    const togglePause = () => { if (phase === 'idle') return App.toast('Rien n’est en cours.'); if (!paused) { paused = true; stopAll(); pb.textContent = '▶ Reprendre'; setStatus('En pause. Touche « Reprendre » pour relire le groupe en cours.'); } else { paused = false; pb.textContent = '⏸ Pause'; if (idx >= 0) go(idx); else start(); } };
    const all = () => { stopAll(); phase = 'idle'; upd(); setStatus('Lecture du texte en entier…'); say(nrm(getText())); };

    // ── la correction ──
    const finish = () => {
      const mine = ta.value.trim(); if (!mine) return App.toast('Écris d’abord ta dictée, puis touche « J’ai terminé ».'); stopAll(); phase = 'idle'; upd(); const ref = getText(); if (!ref) return App.toast('Aucun texte de référence.');
      const r = Dict.report(mine, nrm(ref)); const cost = i => (/^Accent/.test(i.msg) || i.cat === 'ponct' || i.cat === 'typo') ? .5 : 1; const lost = r.items.reduce((s, i) => s + cost(i), 0); const note = Math.max(0, Math.round((20 - lost) * 2) / 2);
      if (!done) { done = true; const nw = typeof Rev !== 'undefined' ? Rev.capture(r, nrm(ref)) : 0; if (nw) App.toast(`${nw} mot(s) ajouté(s) à « Réviser mes dictées ».`);
        App.stats.counts.dictations = (App.stats.counts.dictations || 0) + 1; App.stats.exos.push({ ts: Date.now(), cat: 'dictee', ok1: r.items.length === 0, ok2: r.items.length === 0, lvl: getLevel() || 1, score: r.score }); App.saveStats(); App.log('dictée orale', getTitle(), { errors: r.items.map(i => ({ cat: i.cat })) });
        const hist = Store.get('dictorale.hist', []); hist.push({ ts: Date.now(), title: getTitle(), level: getLevel(), note, pct: r.score, errs: r.items.length }); Store.set('dictorale.hist', hist.slice(-100)); Store.set('dictorale.draft', null); drawHist(); }
      const tips = tipsFor(r.items);
      out.replaceChildren(h('div', { class: 'card', 'aria-live': 'polite' }, h('h2', { style: 'margin-top:0' }, 'Correction de ta dictée'),
        h('p', { style: 'font-size:1.3em;margin:.2rem 0' }, h('b', null, fmtN(note) + ' / 20'), h('span', { class: 'muted' }, ` · ${r.score} % de mots justes · ${r.items.length} faute${r.items.length > 1 ? 's' : ''}`)),
        h('p', { class: 'muted' }, 'Note indicative : 20 moins 1 point par faute (0,5 pour un accent, une majuscule ou une ponctuation). Ton professeur peut compter autrement.'),
        r.items.length ? h('div', null, h('h3', null, 'Ta dictée, avec les fautes marquées'), h('div', { class: 'marked', html: r.html }), h('p', { class: 'muted' }, 'Un carré ▢ avec un mot en petit = mot oublié. Passe la souris sur une faute pour lire l’explication.'), h('h3', null, 'Le détail des fautes'), errTable(r.items), h('h3', null, 'Conseils'), tips)
          : h('p', null, '🎉 Aucune faute : bravo !'),
        h('h3', null, 'Le texte exact'), h('div', { class: 'marked' }, ref),
        h('div', { class: 'row', style: 'margin-top:.6rem' }, h('button', { class: 'btn sec', type: 'button', onclick: () => App.speak(nrm(ref)) }, '🔊 Réécouter le texte exact'), h('button', { class: 'btn sec', type: 'button', onclick: () => App.speak(nrm(mine)) }, '🔊 Écouter ce que j’ai écrit'), App.stopBtn ? App.stopBtn() : null,
          h('button', { class: 'btn sec', type: 'button', onclick: () => App.copy(ref).then(() => App.toast('Texte copié.')) }, '📋 Copier le texte exact'), h('button', { class: 'btn', type: 'button', onclick: again }, '🔁 Refaire cette dictée'), h('button', { class: 'btn sec', type: 'button', onclick: other }, '➡ Une autre dictée'))));
      out.scrollIntoView({ block: 'start', behavior: 'auto' }); };
    const again = () => { ta.value = ''; Store.set('dictorale.draft', null); out.replaceChildren(); done = false; idx = -1; S = []; phase = 'idle'; upd(); setStatus('Prêt. Touche « Commencer ».'); window.scrollTo(0, 0); };
    const other = () => { const lv = getLevel() || 1, pool = TEXTES.map((t, i) => [t, i]).filter(([t, i]) => t[0] === lv && i !== +O.id); const pick = pool.length ? pool[Math.floor(Math.random() * pool.length)][1] : 0; O.id = pick; save(); sel.value = String(pick); again(); };
    const drawHist = () => { const hs = Store.get('dictorale.hist', []); if (!hs.length) { histBox.replaceChildren(); return; } const last = hs.slice(-8).reverse(); const avg = hs.slice(-5).reduce((s, x) => s + x.note, 0) / Math.min(5, hs.length), best = Math.max(...hs.map(x => x.note));
      histBox.replaceChildren(h('div', { class: 'card secondary' }, h('h2', { style: 'margin-top:0' }, 'Mes dictées'), h('p', { class: 'muted' }, `${hs.length} dictée${hs.length > 1 ? 's' : ''} sur cet appareil · moyenne des 5 dernières : ${fmtN(Math.round(avg * 10) / 10)} / 20 · meilleure note : ${fmtN(best)} / 20. Pas de classement : tu te compares seulement à toi-même.`),
        h('table', { class: 't' }, h('tr', null, h('th', null, 'Date'), h('th', null, 'Texte'), h('th', null, 'Note'), h('th', null, 'Fautes')), last.map(x => h('tr', null, h('td', null, new Date(x.ts).toLocaleDateString('fr-FR')), h('td', null, x.title), h('td', null, fmtN(x.note) + ' / 20'), h('td', null, String(x.errs))))),
        h('div', { class: 'row' }, h('button', { class: 'btn sec small', type: 'button', onclick: () => { if (confirm('Effacer l’historique de tes dictées orales ?')) { Store.set('dictorale.hist', []); drawHist(); } } }, 'Effacer cet historique')))); };

    const prog = h('p', { class: 'muted', style: 'margin:.2rem 0' }); const pb = h('button', { class: 'btn sec', type: 'button', onclick: togglePause }, '⏸ Pause');
    el.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, '1. Choisis la dictée'), h('label', null, 'Texte', sel), ownBox,
      h('div', { class: 'grid g2' }, opt('Vitesse du narrateur', 'speed', [['lente', 'Lente'], ['normale', 'Normale'], ['rapide', 'Rapide']]), opt('Temps pour écrire (si le narrateur enchaîne seul)', 'pause', [['courte', 'Court'], ['normale', 'Normal'], ['longue', 'Long']])),
      chk('Dire la ponctuation (virgule, point…), comme dans une dictée à l’école', 'punct'), chk('Le narrateur enchaîne tout seul (sinon, je touche « Suivant »)', 'auto')),
      h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, '2. Écoute et écris'), h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: start }, '▶ Commencer la dictée'), h('button', { class: 'btn sec', type: 'button', onclick: repeat }, '🔁 Répéter'), h('button', { class: 'btn sec', type: 'button', onclick: prev }, '⏮ Précédent'), h('button', { class: 'btn sec', type: 'button', onclick: next }, '⏭ Suivant'), pb, h('button', { class: 'btn sec', type: 'button', onclick: stop }, '⏹ Arrêter'), h('button', { class: 'btn ghost', type: 'button', onclick: all }, '🔊 Tout relire')), prog, status,
        h('label', { for: 'dictIn' }, 'Ta dictée'), ta, h('p', { class: 'muted', style: 'margin:.2rem 0' }, 'Le correcteur automatique du navigateur est coupé : c’est toi qui écris. Ton brouillon est gardé sur cet appareil.'),
        h('div', { class: 'row', style: 'margin-top:.5rem' }, App.mic ? App.mic(ta, '🎤 Dicter (si tu ne peux pas écrire)') : null, h('button', { class: 'btn', type: 'button', onclick: finish }, '✅ J’ai terminé : corriger'))),
      out, histBox, App.voicePanel ? App.voicePanel() : null);
    loadDraft(); drawHist();
  };

  // ──────────────────────────────── 2) DACTYLOGRAPHIE ────────────────────────────────
  const MOTS = 'maison jardin école livre cahier crayon fenêtre matin soir lumière chaleur montagne rivière forêt oiseau chocolat voiture bicyclette ordinateur clavier souris musique histoire géographie question réponse devoir exercice vacances été hiver printemps automne famille ami voisin cousin chanson fromage boulangerie marché pharmacie bibliothèque cinéma théâtre jouer courir sauter nager lire écrire dessiner chanter écouter regarder travailler apprendre comprendre répéter terminer commencer'.split(' ');
  const ACC = 'été élève père mère frère forêt fête être déjà côté ça garçon leçon où août maïs théâtre crêpe pâtes goûter bâton îlot hôpital français café réussir précis général élégant tête fenêtre'.split(' ');
  const PHR = ["Le soleil se lève derrière la colline.", "Nous avons préparé un gâteau pour l'anniversaire de Camille.", "Il faut savoir attendre pour réussir.", "Ma tante habite à côté de la bibliothèque.", "Les élèves écoutent attentivement leur professeur.", "Demain, nous irons au parc si le temps est beau.", "Elle range ses crayons de couleur dans une boîte rouge.", "Le train de huit heures quarante est déjà parti.", "Où as-tu mis mes lunettes et mon écharpe ?", "J'aime lire des histoires drôles avant de dormir.", "La mer est calme ce matin et les mouettes volent haut.", "Pour apprendre à taper vite, il faut d'abord taper juste.", "Mon voisin répare les vélos du quartier le samedi.", "Ils ont partagé la pizza en quatre parts égales.", "Ce soir, la lune éclaire tout le jardin.", "Un petit effort chaque jour vaut mieux qu'un gros effort une fois."];
  const REP = 'qsdf jklm fj dk sl qm fgh jkl dfgh jklm sdfg hjkl fj fj dk dk sl sl qm qm gh gh fj fj sdf jkl sdf jkl';
  const MODES = [['rep', 'Rangée de repos (Q S D F  J K L M)'], ['mots', 'Mots courants'], ['acc', 'Mots avec accents'], ['phr', 'Phrases'], ['texte', 'Un texte'], ['perso', 'Mon propre texte'], ['chrono', 'Chrono : 1 minute']];
  const pick = (a, n) => Sub.shuffle(a).slice(0, n);
  const charDiff = (want, got) => { const m = want.length, n = got.length, d = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]); for (let j = 1; j <= n; j++) d[0][j] = j; for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (want[i - 1] === got[j - 1] ? 0 : 1));
    const miss = []; let i = m, j = n; while (i > 0 || j > 0) { if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + (want[i - 1] === got[j - 1] ? 0 : 1)) { if (want[i - 1] !== got[j - 1]) miss.push(want[i - 1]); i--; j--; } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) { miss.push(want[i - 1]); i--; } else { j--; } } return miss; };
  const measure = (typed, target, ms) => { const ref = target.slice(0, typed.length); const r = Dict.report(typed.trim(), ref.trim()); let ok = 0; r.ops.forEach(o => { const w = /[\p{L}\p{M}\d]/u.test(o.a || o.b || '') ? 1 : 0; if (o.t === 'eq') ok += o.a.length + w; else if (o.t === 'sub') ok += Math.max(0, Math.max(o.a.length, o.b.length) - Dict.lev(o.a, o.b)) + w; }); ok = Math.min(ok, typed.length); /* une faute = un caractère perdu (pas tout le mot) */ ok = Math.min(ok, typed.length);
    const min = Math.max(ms, 1000) / 60000, missed = {}; r.ops.forEach(o => { if (o.t === 'sub') charDiff(o.a, o.b).forEach(c => { if (/\S/.test(c)) missed[c] = (missed[c] || 0) + 1; }); });
    return { r, ok, n: typed.length, acc: typed.length ? Math.round(ok / typed.length * 100) : 0, wpm: Math.round(ok / 5 / min * 10) / 10, gross: Math.round(typed.length / 5 / min * 10) / 10, missed, sec: Math.round(ms / 100) / 10 }; };
  const spark = pts => { if (pts.length < 2) return null; const W = 320, H = 90, p = 8, mx = Math.max(...pts, 1), mn = Math.min(...pts, 0); const X = i => p + i * (W - 2 * p) / (pts.length - 1), Y = v => H - p - (v - mn) / ((mx - mn) || 1) * (H - 2 * p);
    const ns = 'http://www.w3.org/2000/svg'; const svg = document.createElementNS(ns, 'svg'); svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.setAttribute('width', '100%'); svg.setAttribute('style', 'max-width:26rem'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', `Vitesse nette sur tes ${pts.length} derniers essais : de ${fmtN(pts[0])} à ${fmtN(pts[pts.length - 1])} mots par minute`);
    const pl = document.createElementNS(ns, 'polyline'); pl.setAttribute('points', pts.map((v, i) => X(i).toFixed(1) + ',' + Y(v).toFixed(1)).join(' ')); pl.setAttribute('fill', 'none'); pl.setAttribute('stroke', 'var(--accent)'); pl.setAttribute('stroke-width', '2.5'); svg.append(pl);
    pts.forEach((v, i) => { const c = document.createElementNS(ns, 'circle'); c.setAttribute('cx', X(i)); c.setAttribute('cy', Y(v)); c.setAttribute('r', 3.5); c.setAttribute('fill', 'var(--accent)'); c.setAttribute('stroke', 'var(--panel)'); c.setAttribute('stroke-width', 1.5); svg.append(c); }); return svg; };

  const typing = el => {
    const O = Object.assign({ mode: 'mots', hide: false }, Store.get('dactylo.opts', {})); const save = () => Store.set('dactylo.opts', O);
    el.append(h('h1', null, 'Dactylographie : écrire vite et juste'), Sub.notice('secondary', h('b', null, 'Comment ça marche : '), 'choisis un exercice, tape le texte affiché dans la zone en dessous. Le chrono démarre à ta première touche. À la fin, tu vois ta vitesse, ta précision, ta correction détaillée et les touches à retravailler. Vise d’abord la précision : la vitesse vient ensuite. Pas de classement ni de comparaison avec les autres.'),
      h('details', null, h('summary', null, 'Où poser les doigts ? (clavier AZERTY)'), h('p', null, 'Les doigts de repos sont sur Q S D F (main gauche) et J K L M (main droite). Les index sont sur F et J : ces deux touches ont un petit repère que tu sens avec le doigt. Les pouces restent sur la barre d’espace. Chaque doigt s’occupe des touches au-dessus et en dessous de lui, puis revient à sa place.'),
        h('p', null, 'Sur un clavier AZERTY de Windows : é, è, à, ç, ù ont leur propre touche ; pour ê, â, î, ô, û, tape d’abord ^ puis la voyelle ; pour une majuscule accentuée (É, À), active Verr. Maj. puis tape la touche. Sur Mac ou sur téléphone, ces gestes changent.')));
    const modeSel = h('select', { 'aria-label': 'Type d’exercice', onchange: ev => { O.mode = ev.target.value; save(); persoBox.hidden = O.mode !== 'perso'; fresh(); } }, MODES.map(([v, t]) => h('option', { value: v, selected: O.mode === v }, t)));
    const perso = h('textarea', { rows: 3, 'aria-label': 'Mon propre texte à taper', placeholder: 'Colle ici le texte à taper…' }); perso.value = Store.get('dactylo.own', '') || ''; perso.addEventListener('change', () => { Store.set('dactylo.own', perso.value); fresh(); }); const persoBox = h('div', { hidden: O.mode !== 'perso' }, perso);
    const hideCk = h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: O.hide, onchange: ev => { O.hide = ev.target.checked; save(); live.hidden = O.hide; } }), 'Cacher le chrono et la vitesse pendant l’exercice (moins de pression)');
    const target = h('div', { class: 'dk-target', role: 'group', 'aria-label': 'Texte à taper', lang: 'fr' }); const live = h('p', { class: 'dk-live', 'aria-live': 'off', hidden: O.hide }, '0,0 s');
    const ta = h('textarea', { id: 'dkIn', rows: 3, 'aria-label': 'Zone de frappe : tape ici le texte affiché au-dessus', placeholder: 'Tape ici. Le chrono démarre à la première touche.', spellcheck: 'false', autocomplete: 'off', autocapitalize: 'off', autocorrect: 'off' });
    const out = h('div'), histBox = h('div'); let T = '', cs = [], t0 = 0, running = false, ended = false, backs = 0, timer = 0, custom = null; const LIMIT = 60000;
    const text = () => { if (custom) return custom; const m = O.mode; return m === 'rep' ? REP : m === 'mots' ? pick(MOTS, 14).join(' ') : m === 'acc' ? pick(ACC, 12).join(' ') : m === 'phr' ? pick(PHR, 3).join(' ') : m === 'texte' ? TEXTES[Math.floor(Math.random() * TEXTES.length)][2] : m === 'chrono' ? pick(PHR, 12).join(' ') : (perso.value.trim().replace(/\s+/g, ' ') || 'Colle ton texte dans la zone « Mon propre texte ».'); };
    const build = () => { cs = []; target.replaceChildren(); nrm(T).split(/(?<= )/).forEach(tokn => { const w = h('span', { class: 'dk-w' }); [...tokn].forEach(ch => { const c = h('span', { class: 'dk-c pend' + (ch === ' ' ? ' sp' : '') }, ch); cs.push(c); w.append(c); }); target.append(w); }); };
    const paint = typed => { cs.forEach((c, k) => { const base = 'dk-c' + (T[k] === ' ' ? ' sp' : ''); c.className = base + (k < typed.length ? (typed[k] === T[k] ? ' ok' : ' bad') : k === typed.length && !ended ? ' cur' : ' pend'); }); };
    const fresh = () => { clearInterval(timer); running = false; ended = false; backs = 0; t0 = 0; T = nrm(text()); custom = null; ta.value = ''; ta.disabled = false; out.replaceChildren(); live.textContent = '0,0 s'; build(); paint(''); };
    const tickTxt = () => { const ms = performance.now() - t0, typed = ta.value; const m = measure(typed, T, ms); live.textContent = `${fmtN((ms / 1000).toFixed(1))} s` + (ms >= 4000 ? ` · ${fmtN(m.wpm)} mots/min` : '') + (O.mode === 'chrono' ? ` · reste ${Math.max(0, Math.ceil((LIMIT - ms) / 1000))} s` : ''); };
    const begin = () => { running = true; t0 = performance.now(); timer = setInterval(() => { if (!el.isConnected) { clearInterval(timer); return; } if (!O.hide) tickTxt(); if (O.mode === 'chrono' && performance.now() - t0 >= LIMIT) end(); }, 250); };
    const end = () => { if (ended) return; ended = true; running = false; clearInterval(timer); const ms = Math.min(performance.now() - t0, O.mode === 'chrono' ? LIMIT : 1e9); ta.disabled = true; const typed = ta.value; paint(typed); result(typed, ms); };
    ta.addEventListener('beforeinput', ev => { if (ev.inputType === 'insertFromPaste' || ev.inputType === 'insertFromDrop') { ev.preventDefault(); App.toast('Coller est désactivé : c’est un exercice de frappe.'); } if (ev.inputType && ev.inputType.startsWith('deleteContent')) backs++; });
    ta.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); if (running && O.mode !== 'chrono') end(); } if (['ArrowLeft', 'ArrowUp', 'Home', 'PageUp'].includes(ev.key)) ev.preventDefault(); });
    ta.addEventListener('click', () => ta.setSelectionRange(ta.value.length, ta.value.length));
    ta.addEventListener('input', () => { if (ended) return; const typed = ta.value; if (!running && typed.length) begin(); paint(typed); if (typed.length >= T.length) end(); });

    const result = (typed, ms) => { const m = measure(typed, T, ms), items = m.r.items; const hist = Store.get('dactylo.hist', []); hist.push({ ts: Date.now(), mode: O.mode, wpm: m.wpm, acc: m.acc, sec: m.sec, chars: m.n }); Store.set('dactylo.hist', hist.slice(-200));
      App.stats.exos.push({ ts: Date.now(), cat: 'dactylo', ok1: m.acc >= 95, ok2: m.acc >= 95, lvl: 1, score: m.acc }); App.stats.counts.exercises = (App.stats.counts.exercises || 0) + 1; App.saveStats();
      const keys = Object.entries(m.missed).sort((a, b) => b[1] - a[1]).slice(0, 6); const tips = tipsFor(items);
      const verdict = m.acc >= 97 ? 'Très précis : tu peux maintenant essayer d’aller un peu plus vite.' : m.acc >= 90 ? 'Bonne précision. Reste régulier, ne cherche pas à aller trop vite.' : 'Ralentis un peu : taper juste est plus important que taper vite.';
      out.replaceChildren(h('div', { class: 'card', 'aria-live': 'polite' }, h('h2', { style: 'margin-top:0' }, 'Résultat'),
        h('div', { class: 'grid g3' }, h('div', { class: 'card' }, h('div', { class: 'muted' }, 'Vitesse nette'), h('b', { style: 'font-size:1.6em' }, fmtN(m.wpm)), ' mots/min'), h('div', { class: 'card' }, h('div', { class: 'muted' }, 'Précision'), h('b', { style: 'font-size:1.6em' }, m.acc + ' %')), h('div', { class: 'card' }, h('div', { class: 'muted' }, 'Temps'), h('b', { style: 'font-size:1.6em' }, fmtN(m.sec) + ' s'))),
        h('p', null, verdict), h('p', { class: 'muted' }, `Vitesse nette = caractères justes ÷ 5 ÷ minutes (1 mot = 5 caractères, règle habituelle). Vitesse brute (tout ce que tu as tapé) : ${fmtN(m.gross)} mots/min. Retours en arrière (effacements) : ${backs}.`),
        items.length ? h('div', null, h('h3', null, 'Ta frappe, avec les fautes marquées'), h('div', { class: 'marked', html: m.r.html }), h('h3', null, 'Le détail des fautes'), errTable(items), h('h3', null, 'Conseils'), tips) : h('p', null, '🎉 Aucune faute de frappe : bravo !'),
        keys.length ? h('div', null, h('h3', null, 'Touches à retravailler'), h('p', null, keys.map(([c, n]) => h('span', { style: 'margin-right:.8rem' }, h('kbd', null, c), ' × ' + n))), h('button', { class: 'btn', type: 'button', onclick: () => { const ks = keys.map(k => k[0].toLowerCase()); const w = [...new Set([...MOTS, ...ACC])].filter(x => ks.some(k => x.toLowerCase().includes(k))); custom = (w.length >= 4 ? pick(w, 12) : pick(ACC, 12)).join(' '); modeSel.value = O.mode; fresh(); ta.focus(); window.scrollTo(0, 0); } }, '🎯 S’entraîner sur ces touches')) : null,
        h('div', { class: 'row', style: 'margin-top:.6rem' }, h('button', { class: 'btn', type: 'button', onclick: () => { fresh(); ta.focus(); window.scrollTo(0, 0); } }, '🔁 Un nouvel exercice'), h('button', { class: 'btn sec', type: 'button', onclick: () => { const same = T; fresh(); custom = null; T = same; build(); paint(''); ta.focus(); window.scrollTo(0, 0); } }, '↻ Refaire le même texte'))));
      drawHist(); out.scrollIntoView({ block: 'start', behavior: 'auto' }); };
    const drawHist = () => { const hs = Store.get('dactylo.hist', []); if (!hs.length) { histBox.replaceChildren(); return; } const last = hs.slice(-8).reverse(), best = Math.max(...hs.map(x => x.wpm)), avg = hs.slice(-5).reduce((s, x) => s + x.wpm, 0) / Math.min(5, hs.length), sp = spark(hs.slice(-20).map(x => x.wpm)); const nm = Object.fromEntries(MODES);
      histBox.replaceChildren(h('div', { class: 'card secondary' }, h('h2', { style: 'margin-top:0' }, 'Mes essais'), h('p', { class: 'muted' }, `${hs.length} essai${hs.length > 1 ? 's' : ''} sur cet appareil · moyenne des 5 derniers : ${fmtN(Math.round(avg * 10) / 10)} mots/min · record : ${fmtN(best)} mots/min. Tu te compares seulement à toi-même.`), sp,
        h('table', { class: 't' }, h('tr', null, h('th', null, 'Date'), h('th', null, 'Exercice'), h('th', null, 'Mots/min'), h('th', null, 'Précision')), last.map(x => h('tr', null, h('td', null, new Date(x.ts).toLocaleDateString('fr-FR')), h('td', null, (nm[x.mode] || x.mode).replace(/ \(.*\)/, '')), h('td', null, fmtN(x.wpm)), h('td', null, x.acc + ' %')))),
        h('div', { class: 'row' }, h('button', { class: 'btn sec small', type: 'button', onclick: () => { if (confirm('Effacer l’historique de tes essais de frappe ?')) { Store.set('dactylo.hist', []); drawHist(); } } }, 'Effacer cet historique')))); };
    el.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Exercice'), h('label', null, 'Type d’exercice', modeSel), persoBox, hideCk, h('div', { class: 'row' }, h('button', { class: 'btn sec', type: 'button', onclick: () => { fresh(); ta.focus(); } }, '🔁 Nouvel exercice')),
      target, live, ta, h('div', { class: 'row', style: 'margin-top:.4rem' }, h('button', { class: 'btn', type: 'button', onclick: () => { if (running && ta.value) end(); else App.toast('Tape d’abord quelque chose (touche Entrée pour terminer).'); } }, '✅ J’ai terminé'))), out, histBox);
    fresh(); drawHist();
  };

  App.reg({ id: 'dictee-orale', title: 'Dictée orale (narrateur)', group: 'outils', icon: '🎧', learn: true, render: dictation });
  App.reg({ id: 'dactylo', title: 'Dactylographie', group: 'outils', icon: '⌨️', learn: true, render: typing });
  return { TEXTES, segments, spoken, measure, charDiff };
})();
