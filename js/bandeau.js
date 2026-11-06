// Bandeau du haut — (1) bulle de définition au survol, (2) « Comment je me sens ? » (corps, émotions, tête).
// Tout reste dans ce navigateur (Store). Ce n'est ni un test, ni un diagnostic : juste un repère pour la personne.
// Les définitions sont courtes et en langage simple (sens courant), écrites pour l'outil ; elles ne remplacent pas un dictionnaire.
const Bandeau = (() => {
  const norm = w => w.toLowerCase().replace(/’/g, "'");

  // ── mots des proverbes qui peuvent poser question : clé = mot tel qu'il s'écrit dans la citation ──
  const MOTS = {
    forgeant: ['forger', 'Travailler le métal en le chauffant puis en le frappant. Ici : s’entraîner en faisant.'],
    forgeron: ['forgeron', 'Personne qui fabrique des objets en fer en les chauffant et en les frappant.'],
    nid: ['nid', 'Abri que construit un oiseau pour pondre ses œufs et élever ses petits.'],
    rome: ['Rome', 'Capitale de l’Italie, très ancienne ville.'],
    âge: ['âge', 'Nombre d’années qu’une personne a vécu.'],
    ruisseaux: ['ruisseau', 'Tout petit cours d’eau.'],
    rivières: ['rivière', 'Cours d’eau plus grand qu’un ruisseau.'],
    impossible: ['impossible', 'Qu’on ne peut pas faire.'],
    nul: ['nul', 'Ici : personne. « Nul n’est tenu » = personne n’est obligé.'],
    tenu: ['tenu', 'Ici : obligé de faire quelque chose.'],
    vaillant: ['vaillant', 'Courageux, qui ne baisse pas les bras.'],
    erreur: ['erreur', 'Chose qu’on fait ou qu’on dit de travers sans le vouloir.'],
    humaine: ['humain', 'Qui concerne les êtres humains, comme toi et moi.'],
    point: ['à point', 'Ici : au bon moment, ni trop tôt ni trop tard.'],
    attendre: ['attendre', 'Rester en patientant jusqu’à ce que quelque chose arrive.'],
    union: ['union', 'Le fait d’être ensemble et de s’entendre pour agir.'],
    force: ['force', 'Puissance, capacité d’agir ou de résister.'],
    valent: ['valoir', 'Avoir de la valeur. « Valent mieux » = sont meilleures.'],
    ciel: ['ciel', 'L’espace au-dessus de nous, avec les nuages, le soleil et les étoiles. Ici : la chance ou une aide qui vient d’ailleurs.'],
    égaux: ['égal', 'Pareil, de même taille ou de même valeur.'],
    ennemi: ['ennemi', 'Personne ou chose qui est contre toi ou qui te gêne.'],
    conseil: ['conseil', 'Avis qui aide à décider. Ici : une bonne idée qui vient en y réfléchissant.'],
    paroles: ['parole', 'Mots qu’on dit à voix haute.'],
    envolent: ['s’envoler', 'Partir dans les airs. Ici : disparaître vite.'],
    écrits: ['écrit', 'Texte qui a été écrit.'],
    pluie: ['pluie', 'Eau qui tombe du ciel en gouttes.'],
    tente: ['tenter', 'Essayer de faire quelque chose.'],
    battre: ['battre', 'Ici : frapper (on frappe le fer chaud pour lui donner une forme).'],
    fer: ['fer', 'Métal dur et gris avec lequel on fabrique beaucoup d’objets.'],
    piano: ['piano', 'Mot italien : doucement.'],
    sano: ['sano', 'Mot italien : sain, en bonne santé. Ici : sans danger, sûrement.'],
    remets: ['remettre', 'Ici : repousser à plus tard.'],
    demain: ['demain', 'Le jour qui vient après aujourd’hui.'],
    faute: ['faute', 'Erreur ou mauvaise action.'],
    avouée: ['avouer', 'Reconnaître la vérité, dire qu’on a fait quelque chose.'],
    pardonnée: ['pardonner', 'Ne plus en vouloir à quelqu’un.'],
    moitié: ['moitié', 'Une des deux parties égales d’un tout.'],
    coûte: ['coûter', 'Demander de l’argent ou un effort. Ici : être difficile.'],
    patience: ['patience', 'Capacité d’attendre calmement, sans s’énerver.'],
    vertus: ['vertu', 'Belle qualité de caractère, comme le courage ou la patience.'],
    pleurer: ['pleurer', 'Verser des larmes.'],
    habit: ['habit', 'Vêtement.'],
    moine: ['moine', 'Homme qui vit selon une religion, souvent dans un monastère.'],
    échaudé: ['échaudé', 'Brûlé par de l’eau chaude. Ici : qui a déjà eu une mauvaise expérience.'],
    craint: ['craindre', 'Avoir peur de quelque chose.'],
    omelette: ['omelette', 'Plat fait d’œufs battus, cuits à la poêle.'],
    œufs: ['œuf', 'Ce que pondent les poules et d’autres animaux ; on peut le manger.'],
    coutume: ['coutume', 'Habitude, manière de faire qu’on répète.'],
    médaille: ['médaille', 'Petit disque de métal avec une image. Il a deux faces : l’avers et le revers.'],
    revers: ['revers', 'Le côté opposé, l’autre face d’une chose.'],
    maux: ['mal (au pluriel : maux)', 'Souffrances, problèmes, douleurs.'],
    remèdes: ['remède', 'Ce qui sert à soigner ou à régler un problème.'],
    suffit: ['suffire', 'Être assez.'],
    peine: ['peine', 'Ici : ce qui est difficile ou ce qui fait souffrir, un souci.'],
    appétit: ['appétit', 'Envie de manger.'],
    comptes: ['compte', 'Calcul de ce qu’on se doit les uns aux autres, surtout en argent.'],
    fous: ['fou', 'Ici : des gens qui s’amusent sans se prendre au sérieux.'],
    accompagné: ['accompagné', 'Avec quelqu’un d’autre.'],
    argent: ['argent', 'Métal précieux gris et brillant. Ça veut aussi dire « la monnaie ».'],
    silence: ['silence', 'Absence de bruit ; le fait de ne pas parler.'],
    or: ['or', 'Métal précieux jaune, très cher.'],
    amasse: ['amasser', 'Rassembler en grande quantité.'],
    mousse: ['mousse', 'Petite plante verte et douce qui pousse sur les pierres humides.'],
    lieues: ['lieue', 'Ancienne mesure de distance : environ 4 kilomètres.'],
    voyage: ['voyage', 'Déplacement vers un endroit éloigné.'],
    mille: ['mille', 'Le nombre 1 000.'],
    tard: ['tard', 'Après le moment prévu ou habituel.'],
    jamais: ['jamais', 'À aucun moment.'],
    finit: ['finir', 'Arriver à la fin.'],
    tourner: ['tourner sa langue', 'Expression : bien réfléchir avant de parler, au lieu de dire la première chose qui vient.'],
    veut: ['vouloir', 'Avoir envie de faire quelque chose et décider de le faire.'],
    peut: ['pouvoir', 'Être capable de faire quelque chose.'],
    chose: ['chose', 'Ce qui existe et qu’on ne nomme pas précisément : un objet, une idée, une action.'],
    rien: ['rien', 'Aucune chose.']
  };

  // ── bulle de définition (survol à la souris, focus au clavier, toucher sur téléphone) ──
  let tipEl = null, tipFor = null, tipAt = 0, tipTimer = 0, lastTouch = 0;
  const tipNode = () => { if (!tipEl) { tipEl = h('div', { id: 'defTip', role: 'tooltip', hidden: true }); document.body.appendChild(tipEl); } return tipEl; };
  const hideTip = () => { clearTimeout(tipTimer); if (tipEl) tipEl.hidden = true; if (tipFor) { tipFor.removeAttribute('aria-describedby'); tipFor = null; } };
  const showTip = (target, term, def) => {
    const t = tipNode(); t.replaceChildren(h('b', null, term), h('span', null, ' — ' + def)); t.hidden = false; tipFor = target; target.setAttribute('aria-describedby', 'defTip'); tipAt = Date.now();
    const r = target.getBoundingClientRect(), tw = t.offsetWidth, th = t.offsetHeight, vw = document.documentElement.clientWidth, vh = window.innerHeight;
    let x = Math.min(Math.max(8, r.left), Math.max(8, vw - tw - 8)), y = r.bottom + 8; if (y + th > vh - 8 && r.top - th - 8 > 8) y = r.top - th - 8;
    t.style.left = x + 'px'; t.style.top = Math.max(8, y) + 'px';
  };
  const attach = (el, term, def, onTap) => {
    el.addEventListener('mouseenter', () => showTip(el, term, def)); el.addEventListener('mouseleave', () => { if (Date.now() - lastTouch > 1500) hideTip(); });
    el.addEventListener('focus', () => showTip(el, term, def)); el.addEventListener('blur', hideTip);
    if (onTap) el.addEventListener('click', () => { showTip(el, term, def); onTap(); clearTimeout(tipTimer); tipTimer = setTimeout(() => { if (tipFor === el) hideTip(); }, 7000); }); // sur téléphone il n'y a pas de « sortie de souris » : la bulle se ferme seule
  };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') hideTip(); });
  window.addEventListener('touchstart', e => { lastTouch = Date.now(); if (tipFor && !tipFor.contains(e.target)) hideTip(); }, { capture: true, passive: true }); // toucher ailleurs ferme la bulle
  window.addEventListener('scroll', () => { if (Date.now() - tipAt > 500) hideTip(); }, true); window.addEventListener('resize', hideTip);

  // met en forme une citation : les mots de MOTS deviennent survolables (et lisibles à voix haute au clic / Entrée)
  const quoteNodes = text => {
    const out = []; let last = 0; const re = /[\p{L}]+(?:-[\p{L}]+)*/gu; let m;
    while ((m = re.exec(text))) {
      const d = MOTS[norm(m[0])]; if (!d) continue;
      if (m.index > last) out.push(text.slice(last, m.index));
      const w = h('span', { class: 'defw', tabindex: '0', role: 'button', 'aria-label': m[0] + ' : définition' }, m[0]);
      attach(w, d[0], d[1], () => App.speak(d[0] + ' : ' + d[1]));
      w.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); w.click(); } });
      out.push(w); last = m.index + m[0].length;
    }
    if (last < text.length) out.push(text.slice(last)); return out;
  };

  // ── « Comment je me sens ? » : un mot par ligne (corps, émotions, tête) + une note de 1 à 10 par ligne ──
  const DIMS = [
    { k: 'p', s: 'sp', ico: '💪', t: 'Mon corps', v: '--sv-p', opts: [
      ['⚡', 'En forme', 'Tu as de l’énergie et ton corps va bien.'],
      ['😴', 'Fatigué(e)', 'Tu manques d’énergie, tu as besoin de te reposer.'],
      ['😬', 'Tendu(e)', 'Tes muscles sont raides ou crispés (épaules, nuque, mâchoire…).'],
      ['🤕', 'Mal quelque part', 'Tu as une douleur (tête, ventre, dos…).'],
      ['🥤', 'Faim ou soif', 'Ton corps te demande à manger ou à boire.']] },
    { k: 'e', s: 'se', ico: '💛', t: 'Mes émotions', v: '--sv-e', opts: [
      ['😊', 'Content(e)', 'Tu te sens bien, de bonne humeur.'],
      ['😌', 'Calme', 'Tu es tranquille, sans agitation.'],
      ['😰', 'Stressé(e)', 'Tu te sens sous pression : tout va trop vite ou tu as peur de ne pas y arriver.'],
      ['😠', 'Énervé(e)', 'Tu ressens de la colère ou de l’agacement.'],
      ['😢', 'Triste', 'Tu as de la peine, tu n’as pas le moral.'],
      ['😞', 'Découragé(e)', 'Tu as envie d’abandonner parce que c’est difficile.']] },
    { k: 'm', s: 'sm', ico: '🧠', t: 'Ma tête', v: '--sv-m', opts: [
      ['🎯', 'Concentré(e)', 'Ton attention reste sur ce que tu fais.'],
      ['💡', 'Motivé(e)', 'Tu as envie de t’y mettre et d’avancer.'],
      ['🌫️', 'Dispersé(e)', 'Ton attention part dans tous les sens.'],
      ['🤯', 'Débordé(e)', 'Tu as trop de choses à faire ou à penser en même temps.'],
      ['❓', 'Perdu(e)', 'Tu ne comprends pas ou tu ne sais pas par où commencer.']] }
  ];
  const find = (k, label) => { const d = DIMS.find(x => x.k === k); return d && d.opts.find(o => o[1] === label); };
  const today = t => t && new Date(t).toDateString() === new Date().toDateString();
  const curState = () => { const c = Store.get('etat.cur', null); return c && today(c.t) ? c : null; };
  const mean = c => { const v = c ? DIMS.map(d => c[d.s]).filter(x => typeof x === 'number') : []; return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const fm = n => (Math.round(n * 10) / 10).toString().replace('.', ',');
  const summary = c => { if (!c) return ''; const em = DIMS.map(d => { const o = c[d.k] && find(d.k, c[d.k]); return o ? o[0] : '·'; }), any = em.some(x => x !== '·'), g = mean(c); return (any ? em.join(' ') : '') + (g != null ? (any ? ' · ' : '') + fm(g) + '/10' : ''); };
  const words = c => c ? DIMS.map(d => c[d.k] || typeof c[d.s] === 'number' ? d.t + ' : ' + [c[d.k], typeof c[d.s] === 'number' ? c[d.s] + '/10' : null].filter(Boolean).join(' ') : '').filter(Boolean).join(' · ') : '';
  const fmtTime = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  const advice = c => {
    const out = [], has = (k, arr) => c[k] && arr.includes(c[k]);
    if (has('p', ['Fatigué(e)', 'Tendu(e)'])) out.push('Une petite pause peut aider : change de position, étire-toi, respire.');
    if (has('p', ['Faim ou soif'])) out.push('Un verre d’eau ou une collation peut aider à retrouver de l’énergie.');
    if (has('p', ['Mal quelque part'])) out.push('Si tu as mal, dis-le à un adulte. Si la douleur dure ou t’inquiète, parles-en à un professionnel de santé.');
    if (has('e', ['Stressé(e)', 'Énervé(e)'])) out.push('Souffle un moment : inspire doucement par le nez, expire lentement par la bouche, plusieurs fois.');
    if (has('e', ['Triste', 'Découragé(e)'])) out.push('C’est permis de ne pas aller bien. Tu peux en parler à une personne de confiance, et avancer par tout petits pas.');
    if (has('m', ['Dispersé(e)', 'Débordé(e)'])) out.push('Essaie de ne faire qu’une seule chose à la fois. Le mode concentration cache le menu pour t’aider.');
    if (has('m', ['Perdu(e)'])) out.push('Découpe la tâche en petites étapes ; l’outil « Simplifier » peut t’aider à comprendre un texte difficile.');
    if (DIMS.some(d => typeof c[d.s] === 'number' && c[d.s] <= 3)) out.push('Une note basse, ça arrive. Si c’est comme ça depuis plusieurs jours, parles-en à un adulte de confiance ou à un professionnel.');
    if (!out.length && (c.p || c.e || c.m || mean(c) != null)) out.push('C’est noté. Tu peux continuer à ton rythme.');
    return out;
  };

  const mount = bar => {
    const open = h('button', { class: 'btn ib-etat', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'etatPanel' });
    const label = () => { const c = curState(); open.replaceChildren(h('span', { 'aria-hidden': 'true' }, '💬 '), c && (words(c)) ? h('span', null, 'Mon état ', h('span', { class: 'ib-emo', 'aria-hidden': 'true' }, summary(c))) : 'Comment je me sens ?'); open.setAttribute('aria-label', c && words(c) ? 'Mon état du moment : ' + words(c) + '. Modifier.' : 'Comment je me sens ? Dire mon état : corps, émotions, tête, avec une note sur 10.'); open.title = c && words(c) ? words(c) : 'Dire comment je me sens : corps, émotions, tête, avec une note sur 10'; };
    const panel = h('section', { id: 'etatPanel', class: 'etat-panel', hidden: true, 'aria-label': 'Mon état du moment' });
    const defLine = h('p', { class: 'etat-def', 'aria-live': 'polite' }), tips = h('div', { class: 'etat-tips', 'aria-live': 'polite' }), hist = h('div');
    const DEF0 = 'Passe la souris sur un mot (ou touche-le) pour voir ce qu’il veut dire.';
    const sel = Object.assign({ p: null, e: null, m: null, sp: null, se: null, sm: null }, curState() || {});
    const ui = {}; const gNum = h('b', { class: 'etat-gnum' }), gFill = h('span', { class: 'etat-gfill' });
    const hm = typeof Humeur !== 'undefined' ? Humeur.mount() : null;

    const paintGlobal = () => { const g = mean(sel); gNum.textContent = g == null ? '–' : fm(g); gNum.style.opacity = g == null ? '.4' : '1'; gFill.style.width = g == null ? '0%' : g * 10 + '%'; };
    const syncAll = () => { DIMS.forEach(d => { ui[d.k].chips.forEach(x => x.setAttribute('aria-pressed', String(x.dataset.v === sel[d.k]))); ui[d.k].scores.forEach(x => x.setAttribute('aria-pressed', String(+x.dataset.n === sel[d.s]))); ui[d.k].out.textContent = typeof sel[d.s] === 'number' ? sel[d.s] + ' / 10' : '— / 10'; }); paintGlobal(); };
    const save = () => {
      const any = DIMS.some(d => sel[d.k] || typeof sel[d.s] === 'number'); const rec = { p: sel.p, e: sel.e, m: sel.m, sp: sel.sp, se: sel.se, sm: sel.sm };
      Store.set('etat.cur', any ? { ...rec, t: Date.now() } : null);
      if (any) { const log = Store.get('etat.log', []); const e = { t: Date.now(), ...rec }; if (log.length && e.t - log[log.length - 1].t < 120000) log[log.length - 1] = e; else log.push(e); Store.set('etat.log', log.slice(-5000)); }
      label(); paintHist(); paintTips(); paintGlobal(); if (hm) hm.refresh();
    };
    const paintTips = () => {
      const a = advice(sel); tips.replaceChildren(...a.map(t => h('p', null, '💡 ' + t)));
      if (a.length && (sel.m === 'Dispersé(e)' || sel.m === 'Débordé(e)')) tips.append(h('button', { class: 'btn sec', type: 'button', onclick: () => { hide(); App.toggleFocus(); } }, '🎯 Mode concentration'));
      if (a.length && sel.m === 'Perdu(e)') tips.append(h('button', { class: 'btn sec', type: 'button', onclick: () => { hide(); App.go('simplif'); } }, '🧩 Simplifier un texte'));
    };
    const paintHist = () => {
      const log = Store.get('etat.log', []).slice().reverse(); const rows = log.slice(0, 15);
      hist.replaceChildren(h('details', { class: 'etat-histd' }, h('summary', null, 'Mon historique (' + log.length + ')'),
        rows.length ? h('ul', { class: 'etat-hist' }, rows.map(e => h('li', null, h('b', null, fmtTime.format(new Date(e.t))), ' — ' + words(e)))) : h('p', { class: 'muted' }, 'Rien pour l’instant.'),
        rows.length ? h('div', { class: 'row' },
          h('button', { class: 'btn sec', type: 'button', onclick: () => App.copy(log.map(e => fmtTime.format(new Date(e.t)) + ' — ' + words(e)).join('\n')).then(() => App.toast('Historique copié.')) }, '📋 Copier'),
          h('button', { class: 'btn sec', type: 'button', onclick: () => { if (confirm('Effacer tout l’historique (et les courbes) de mon état sur cet appareil ?')) { Store.set('etat.log', []); paintHist(); if (hm) hm.refresh(); } } }, '🗑 Effacer l’historique')) : null));
    };
    const setDef = (o, on) => { defLine.textContent = on ? o[0] + ' ' + o[1] + ' : ' + o[2] : DEF0; };

    const cards = DIMS.map(d => {
      const out = h('span', { class: 'etat-out' }), id = 'etatC' + d.k;
      const chips = d.opts.map(o => {
        const b = h('button', { class: 'etat-chip', type: 'button', 'aria-pressed': String(sel[d.k] === o[1]) }, h('span', { 'aria-hidden': 'true' }, o[0] + ' '), o[1]); b.dataset.v = o[1];
        attach(b, o[1], o[2]); b.addEventListener('mouseenter', () => setDef(o, true)); b.addEventListener('focus', () => setDef(o, true));
        b.addEventListener('click', () => { sel[d.k] = sel[d.k] === o[1] ? null : o[1]; setDef(o, !!sel[d.k]); syncAll(); save(); }); return b;
      });
      const scores = Array.from({ length: 10 }, (_, i) => { const n = i + 1, b = h('button', { class: 'etat-sc', type: 'button', 'aria-pressed': String(sel[d.s] === n), 'aria-label': 'Note ' + n + ' sur 10' }, String(n)); b.dataset.n = n; b.addEventListener('click', () => { sel[d.s] = sel[d.s] === n ? null : n; syncAll(); save(); }); return b; });
      ui[d.k] = { chips, scores, out };
      return h('div', { class: 'etat-card', role: 'group', 'aria-labelledby': id, style: '--c:var(' + d.v + ')' },
        h('div', { class: 'etat-ch' }, h('span', { class: 'etat-ico', 'aria-hidden': 'true' }, d.ico), h('b', { id }, d.t), out),
        h('div', { class: 'etat-chips' }, chips),
        h('div', { class: 'etat-scl' }, h('span', null, 'Ma note sur 10'), h('span', { class: 'muted' }, '1 = très mal · 10 = très bien')),
        h('div', { class: 'etat-scores', role: 'group', 'aria-label': 'Note de ' + d.t.toLowerCase() + ' sur 10' }, scores));
    });
    const hide = () => { panel.hidden = true; open.setAttribute('aria-expanded', 'false'); hideTip(); };
    const show = () => { panel.hidden = false; open.setAttribute('aria-expanded', 'true'); defLine.textContent = DEF0; syncAll(); paintTips(); paintHist(); if (hm) hm.refresh(); };
    panel.append(
      h('div', { class: 'etat-top' },
        h('div', null, h('h2', { class: 'etat-h' }, 'Comment je me sens maintenant ?'), h('p', { class: 'muted etat-sub' }, 'Un mot et une note par ligne (ou rien). Ça reste sur cet appareil ; ce n’est ni un test ni un diagnostic.')),
        h('div', { class: 'etat-g', role: 'group', 'aria-label': 'Ma note du moment' }, h('span', { class: 'etat-gl' }, 'Ma note du moment'), h('span', { class: 'etat-gv' }, gNum, h('span', null, ' / 10')), h('span', { class: 'etat-gt', 'aria-hidden': 'true' }, gFill)),
        h('button', { class: 'btn ghost', type: 'button', 'aria-label': 'Fermer', onclick: () => { hide(); open.focus(); } }, '✕ Fermer')),
      h('div', { class: 'etat-grid' }, ...cards), defLine, tips,
      h('div', { class: 'row etat-actions' }, h('button', { class: 'btn sec', type: 'button', onclick: () => { Object.keys(sel).forEach(k => { sel[k] = null; }); defLine.textContent = DEF0; syncAll(); save(); } }, 'Effacer mon choix')),
      hm ? hm.el : null, hist);
    open.addEventListener('click', () => panel.hidden ? show() : hide());
    panel.addEventListener('keydown', e => { if (e.key === 'Escape') { hide(); open.focus(); } });
    document.addEventListener('click', e => { const path = e.composedPath ? e.composedPath() : []; if (!panel.hidden && !path.includes(panel) && !path.includes(open) && !panel.contains(e.target) && !open.contains(e.target)) hide(); }); // composedPath : le bouton cliqué peut avoir été retiré de la page avant ce test
    label(); paintGlobal(); bar.append(open, panel);
  };

  return { MOTS, quoteNodes, mount, attach, showTip, hideTip, DIMS };
})();
