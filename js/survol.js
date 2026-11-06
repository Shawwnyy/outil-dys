// Définitions au survol, dans TOUTES les pages :
//  1) un outil (menu, tuile, carte) : passe la souris (ou Tab) dessus → à quoi il sert ;
//  2) un mot du texte : passe la souris dessus → sa définition (dictionnaire de l'outil : vocabulaire de l'école, repérage, mots nouveaux 2026-2027, mots des citations).
//     Pour les autres mots : si « Autoriser la recherche en ligne » est coché dans le Dictionnaire, la définition vient du Wiktionnaire ; sinon, sélectionne le mot et touche « 📖 Définition ».
// Les définitions sont courtes, en mots simples (sens courant), écrites pour l'outil. Rien ne part sur internet sans l'accord de la personne.
const Survol = (() => {
  const nrm = s => String(s || '').toLowerCase().replace(/’/g, "'");
  const on = () => !(typeof App !== 'undefined' && App.prefs && App.prefs.hoverDef === false);
  const online = () => Store.get('dico.online', false) === true;

  // ── à quoi sert chaque outil (description fidèle de ce qu'il fait ; pas un diagnostic) ──
  const ADAPT = ' C’est une adaptation, pas un diagnostic : rien ne dit qu’une personne a ce trouble.';
  const DESC = {
    home: 'La page de départ : tous les outils, rangés par thème, avec une recherche.',
    profil: 'Régler la police, les espacements, la règle de lecture et la concentration selon tes besoins.',
    prefs: 'Les réglages d’affichage et de lecture : police, couleurs, voix, taille.',
    docs: 'Tes textes et documents, gardés sur cet appareil.',
    prog: 'Fautes les plus fréquentes, activité des 14 derniers jours et résultats des exercices, gardés sur cet appareil.',
    histo: 'Ton historique d’activité : il s’ouvre dans « Ma progression ».',
    sante: 'Carte de France par région, recherche de professionnels de santé (données publiques, incomplètes) et carnet privé.',
    correcteur: 'Repère les fautes et les explique, colorées selon 15 catégories.',
    lecture: 'Lit ton texte à voix haute avec la voix de ton choix, avec les syllabes et une règle de lecture.',
    simplif: 'Rend un texte plus simple : phrases plus courtes, mots expliqués, liste ou tableau.',
    lisibilite: 'Mesure si un texte est facile à lire et donne des conseils.',
    dictee: 'Tu dictes ton texte avec ta voix, ou tu compares ta dictée à un modèle.',
    analyse: 'Importe un cours : passages difficiles, définitions et version simple.',
    redaction: 'T’aide à écrire un texte pas à pas.',
    ocr: 'Lit le texte d’une image, si le moteur de lecture est installé sur l’ordinateur.',
    rapports: 'Crée des rapports PDF à partir de ton texte.',
    slides: 'Analyse un PowerPoint : fautes, lisibilité, contrastes, mise en page, avec un export corrigé.',
    expose: 'T’aide à préparer un exposé étape par étape.',
    revision: 'Garde les mots ratés en dictée et te les fait réviser en courtes séances.',
    'dictee-orale': 'Un narrateur lit un texte groupe de mots par groupe de mots ; tu écris ; quand tu as fini, correction détaillée faute par faute avec une note indicative sur 20.',
    presentation: 'À quoi sert Outil Dys, ce qu’il contient, ses règles (local, privé, pas de diagnostic, données sourcées) et comment commencer.',
    entrainer: 'La page de départ pour t’entraîner : ce qui est à faire maintenant (cartes et dictées à réviser, prochaine date, emploi du temps) et tous les outils d’entraînement au même endroit.',
    conjugueur: 'Écris un verbe à l’infinitif : tous les temps s’affichent (présent, passé composé, futur…), avec les terminaisons en couleur, et un entraînement.',
    ortho: 'Exercices courts : choisir le bon homophone (a / à, et / est…) avec l’astuce, et classer des mots dans l’ordre alphabétique.',
    calcmental: 'Calculs rapides avec astuces, lecture de l’heure sur une horloge à aiguilles, et rendre la monnaie en euros.',
    memo: 'Cartes question → réponse que tu écris toi-même. Les cartes réussies reviennent plus tard, les ratées reviennent vite (méthode de Leitner).',
    orga: 'Emploi du temps de la semaine, compte à rebours avant un contrôle ou un exposé, et check-list à cocher avant de rendre un devoir.',
    dactylo: 'T’entraîner à écrire vite et juste au clavier : vitesse, précision, correction détaillée et touches à retravailler.',
    dico: 'Cherche un mot : écoute-le, syllabes, définition. Mots nouveaux 2026-2027 et mots qui se ressemblent.',
    matieres: 'Géographie, histoire, langues, sciences, informatique… toutes les matières.',
    'm-francais': 'Outils de lecture, de simplification et de correction pour le français, et les homophones à ne pas confondre.', 'm-sciences': 'Outils de cours et un compte rendu d’expérience guidé, corrigé ensuite.', 'm-langues': 'Tes propres cartes de vocabulaire, avec entraînement.',
    'm-culture': 'Tes fiches de culture générale (cartes de définitions) et les outils de cours.', 'm-autres': 'Tes fiches pour les autres matières et les outils de cours.', 'm-info': 'Convertisseur de bases (binaire, hexadécimal…) avec les étapes, et les outils de cours.', 'm-histoire': 'Repères, frise chronologique et calcul de siècles et de durées (sans dates préremplies).', 'm-geo': 'Repères, latitude et longitude, jeu des capitales, et tes propres données (avec année et source).',
    maths: 'Calcul pas à pas, droite numérique, fractions, quantités, tables et unités.',
    'mode-dyslexie': 'Des outils souvent utiles quand la lecture est difficile.' + ADAPT, 'mode-dysorthographie': 'Des outils souvent utiles quand l’orthographe est difficile.' + ADAPT,
    'mode-dyspraxie': 'Des outils souvent utiles pour s’organiser, écrire et se repérer.' + ADAPT, 'mode-dyscalculie': 'Des outils souvent utiles pour les nombres et le calcul.' + ADAPT,
    'mode-dysphasie': 'Des outils souvent utiles pour l’expression et la compréhension du langage.' + ADAPT, 'mode-dysgraphie': 'Des outils souvent utiles quand écrire à la main est difficile.' + ADAPT,
    'mode-tdah': 'Des outils souvent utiles pour garder son attention et s’organiser.' + ADAPT, 'mode-hpi': 'Des défis et de l’approfondissement, à ton rythme.' + ADAPT,
    'mode-concentrationmode': 'Des outils pour rester concentré.', 'mode-memorisation': 'Des outils pour retenir et réviser.', 'mode-libre': 'Compose toi-même ton mode : choisis les aides que tu veux.',
    apprendre: 'Plusieurs façons d’apprendre : lire, écouter, dessiner, s’exercer.',
    'mode-spatial': 'T’entraîner à te repérer : mises en situation (chambre, classe, cuisine, parc), gauche et droite, trajets, quadrillage, points cardinaux.',
    fiches: 'Fiches, cartes mentales et quiz à partir de n’importe quel document.', cartes: 'Cartes mentales à partir d’un texte.', quiz: 'Un quiz fait à partir d’un document.',
    exercices: 'Exercices progressifs d’orthographe.', concentration: 'Minuteur de travail et de pause, devoir découpé en étapes, objectifs courts, organisation des révisions et notes.', jeux: 'Le coin des jeux : couleurs, capitales, tables, repérage, vocabulaire, dictée… sans chrono ni classement.',
    defis: 'Défis facultatifs : suites logiques, nombres premiers, estimations.', settings: 'Les réglages de l’application : affichage, voix, données.'
  };

  // ── vocabulaire de l'école et du repérage : sens courant, en mots simples ──
  const G = {
    gauche: ['gauche', 'L’un des deux côtés de ton corps, l’opposé de la droite. En français, on commence à lire par la gauche de la page.'],
    droite: ['droite', 'L’un des deux côtés de ton corps, l’opposé de la gauche. En français, on lit et on écrit en allant vers la droite.'],
    devant: ['devant', 'Du côté où tu regardes.'], derrière: ['derrière', 'Du côté opposé à celui où tu regardes : dans ton dos.'],
    dessus: ['dessus', 'La partie haute d’une chose, ou ce qui est placé en haut. « Au-dessus de » : plus haut, sans toucher.'], dessous: ['dessous', 'La partie basse d’une chose. « Au-dessous de » : plus bas.'],
    dedans: ['dedans', 'À l’intérieur.'], dehors: ['dehors', 'À l’extérieur.'], entre: ['entre', 'Au milieu de deux choses.'], côté: ['côté', 'Une partie à droite, à gauche, devant ou derrière. « À côté de » : tout près.'],
    nord: ['nord', 'Une des quatre directions principales. Sur la plupart des cartes, le nord est vers le haut.'], sud: ['sud', 'La direction opposée au nord. Sur la plupart des cartes, c’est vers le bas.'],
    ouest: ['ouest', 'La direction où le soleil se couche (à peu près). Sur la plupart des cartes, c’est vers la gauche.'],
    quadrillage: ['quadrillage', 'Des lignes qui se croisent pour former des cases, comme sur une feuille de cahier.'], trajet: ['trajet', 'Le chemin qu’on suit pour aller d’un endroit à un autre.'], chemin: ['chemin', 'Le passage qu’on suit pour aller quelque part.'],
    plan: ['plan', 'Dessin d’un lieu vu d’en haut (une pièce, une ville…).'], carte: ['carte', 'Dessin d’une région, d’un pays ou du monde, vu d’en haut.'], boussole: ['boussole', 'Instrument dont l’aiguille montre le nord.'],
    flèche: ['flèche', 'Signe qui montre une direction : →'], case: ['case', 'Un petit carré d’un quadrillage ou d’un tableau.'], colonne: ['colonne', 'Les cases alignées de haut en bas.'], ligne: ['ligne', 'Les cases alignées de gauche à droite.'],
    coordonnées: ['coordonnées', 'Les deux repères (colonne et ligne) qui disent où se trouve une case.'], légende: ['légende', 'Liste qui explique les signes ou les couleurs d’un plan ou d’un graphique.'],
    syllabe: ['syllabe', 'Groupe de sons qu’on prononce d’un seul coup. « chat » : 1 syllabe ; « cha-peau » : 2 syllabes.'], voyelle: ['voyelle', 'Lettre a, e, i, o, u ou y : elle fait un son qu’on peut chanter.'], consonne: ['consonne', 'Lettre qui n’est pas une voyelle (b, c, d, f…).'],
    majuscule: ['majuscule', 'Grande lettre, comme au début d’une phrase ou pour un nom propre.'], minuscule: ['minuscule', 'Petite lettre, comme dans « chat ».'], ponctuation: ['ponctuation', 'Les signes qui rythment une phrase : point, virgule, point d’interrogation…'],
    accent: ['accent', 'Petit signe sur une lettre (é, è, à, ô…) qui change parfois le son.'], apostrophe: ['apostrophe', 'Le signe ’ qui remplace une lettre qui manque : l’école.'], virgule: ['virgule', 'Le signe « , » : une petite pause dans la phrase.'],
    phrase: ['phrase', 'Suite de mots qui a un sens, avec une majuscule au début et un point à la fin.'], paragraphe: ['paragraphe', 'Un bloc de phrases sur une même idée.'], verbe: ['verbe', 'Mot qui dit ce qu’on fait ou ce qui arrive : manger, être, il pleut.'],
    nom: ['nom', 'Mot qui désigne une personne, un animal, une chose ou une idée : chat, école, joie.'], adjectif: ['adjectif', 'Mot qui dit comment est quelqu’un ou quelque chose : un grand chat.'], adverbe: ['adverbe', 'Mot qui ne change pas et qui précise un verbe : il marche lentement.'],
    pronom: ['pronom', 'Petit mot qui remplace un nom : il, elle, nous.'], synonyme: ['synonyme', 'Mot de sens presque pareil : content et heureux.'], antonyme: ['antonyme', 'Mot de sens contraire : grand et petit.'],
    homophone: ['homophone', 'Mots qui se prononcent pareil mais s’écrivent autrement : vert, verre, ver.'], pluriel: ['pluriel', 'Quand il y en a plusieurs : des chats.'], singulier: ['singulier', 'Quand il n’y en a qu’un : un chat.'],
    féminin: ['féminin', 'Le genre des mots qu’on accompagne de « la » ou « une » : la table.'], masculin: ['masculin', 'Le genre des mots qu’on accompagne de « le » ou « un » : le chat.'],
    conjugaison: ['conjugaison', 'Les formes d’un verbe selon qui fait l’action et quand : je mange, nous mangions.'], grammaire: ['grammaire', 'Les règles qui expliquent comment on construit les phrases.'], orthographe: ['orthographe', 'La façon correcte d’écrire les mots.'],
    dictée: ['dictée', 'Exercice où on écrit un texte que quelqu’un lit à voix haute.'], consigne: ['consigne', 'Ce qu’on te demande de faire dans un exercice.'], résumé: ['résumé', 'Version courte d’un texte qui garde les idées importantes.'],
    vocabulaire: ['vocabulaire', 'L’ensemble des mots qu’on connaît.'], définition: ['définition', 'Phrase qui explique le sens d’un mot.'], diagnostic: ['diagnostic', 'Quand un professionnel de santé dit de quoi souffre une personne. Cet outil n’en fait jamais.'],
    adaptation: ['adaptation', 'Un changement qui rend une tâche plus facile à faire.'], concentration: ['concentration', 'Le fait de garder son attention sur une seule chose.'], mémorisation: ['mémorisation', 'Le fait de retenir quelque chose pour s’en souvenir plus tard.'],
    révision: ['révision', 'Le fait de relire ou de refaire pour mieux retenir.'], exposé: ['exposé', 'Présentation d’un sujet devant les autres.'], fiche: ['fiche', 'Feuille courte qui résume l’essentiel.'], quiz: ['quiz', 'Série de petites questions pour tester ce qu’on sait.'],
    diapositive: ['diapositive', 'Une page d’une présentation (PowerPoint).'], lisibilité: ['lisibilité', 'Le fait qu’un texte soit facile à lire.'], contraste: ['contraste', 'La différence entre deux couleurs, par exemple entre le texte et le fond.'],
    police: ['police', 'Le style des lettres d’un texte (Arial, Verdana…).'], interligne: ['interligne', 'L’espace entre deux lignes de texte.'], navigateur: ['navigateur', 'Le programme qui ouvre les sites internet (Chrome, Edge, Firefox…).'],
    ocr: ['OCR', 'Technique qui lit le texte écrit sur une image.'], syllabes: ['syllabe', 'Groupe de sons qu’on prononce d’un seul coup.']
  };
  let NEWMAP = null;
  const newMap = () => { if (!NEWMAP) { NEWMAP = {}; if (typeof Dico !== 'undefined') Dico.NEW.forEach(x => { NEWMAP[nrm(x[0])] = x; }); } return NEWMAP; };
  const forms = w => { const c = [w]; if (/aux$/.test(w)) c.push(w.slice(0, -3) + 'al'); if (/(es|ée|ées)$/.test(w)) c.push(w.replace(/(es|ée|ées)$/, ''), w.replace(/(es|ée|ées)$/, 'e')); if (/[sxe]$/.test(w)) c.push(w.slice(0, -1)); return c; };
  const local = raw => { const w = nrm(raw);
    for (const f of forms(w)) {
      if (G[f]) return { t: G[f][0], d: G[f][1], tag: 'Dictionnaire de l’outil' };
      if (typeof Bandeau !== 'undefined' && Bandeau.MOTS[f]) return { t: Bandeau.MOTS[f][0], d: Bandeau.MOTS[f][1], tag: 'Mot des citations' };
      const n = newMap()[f]; if (n) return { t: n[0], d: n[2].charAt(0).toUpperCase() + n[2].slice(1) + '.', tag: 'Mot nouveau (' + n[1] + ')' };
    } return null; };
  const cache = new Map();
  const remote = async w => { const k = nrm(w); if (cache.has(k)) return cache.get(k); let r = null; try { let d = await Dico.define(w); if (d.missing && w !== w.toLowerCase()) d = await Dico.define(w.toLowerCase()); const s = d.sections && d.sections[0]; if (s && s.defs[0]) r = { t: d.title, d: s.defs[0], tag: s.type + ' · Wiktionnaire' }; } catch (e) { r = null; } cache.set(k, r); return r; };

  // ── mot sous la souris ──
  const wordAt = (x, y) => {
    let node, off;
    if (document.caretPositionFromPoint) { const p = document.caretPositionFromPoint(x, y); if (p) { node = p.offsetNode; off = p.offset; } }
    else if (document.caretRangeFromPoint) { const r = document.caretRangeFromPoint(x, y); if (r) { node = r.startContainer; off = r.startOffset; } }
    if (!node || node.nodeType !== 3) return null;
    const t = node.nodeValue, isW = c => /[\p{L}\p{M}'’-]/u.test(c); let a = Math.min(off, t.length), b = a;
    while (a > 0 && isW(t[a - 1])) a--; while (b < t.length && isW(t[b])) b++;
    const word = t.slice(a, b).replace(/^[-'’]+|[-'’]+$/g, ''); if (word.length < 3 || word.length > 40) return null;
    const rg = document.createRange(); rg.setStart(node, a); rg.setEnd(node, b); const rects = [...rg.getClientRects()].filter(r => r.width);
    const hit = rects.find(r => x >= r.left - 2 && x <= r.right + 2 && y >= r.top - 2 && y <= r.bottom + 2); if (!hit) return null;
    return { word, rect: hit };
  };
  const EXCL = 'input,textarea,select,option,svg,[contenteditable="true"],#defTip,.defw,.etat-chip,.ib-time,#gsres';
  let cur = null, timer = 0, lx = 0, ly = 0, tk = 0;
  const anchor = r => ({ getBoundingClientRect: () => r, setAttribute() { }, removeAttribute() { }, contains: () => false });
  const hide = () => { cur = null; tk++; if (typeof Bandeau !== 'undefined') Bandeau.hideTip(); };
  const resolve = async () => {
    const x = lx, y = ly, el = document.elementFromPoint(x, y); if (!el || el.closest(EXCL) || !on()) return; const my = ++tk;
    // 1) un outil (lien du menu, tuile, carte)
    const a = el.closest('a[href^="#/"]');
    if (a) { const id = a.getAttribute('href').slice(2).split('?')[0], m = App.mods.find(x1 => x1.id === id), d = DESC[id]; if (m && d && m.title) { cur = { rect: a.getBoundingClientRect() }; Bandeau.showTip(anchor(cur.rect), (m.icon ? m.icon + ' ' : '') + m.title, d); return; } }
    // 2) un mot du texte
    const w = wordAt(x, y); if (!w) { if (cur) hide(); return; }
    let r = local(w.word); const show = rr => { if (my !== tk) return; cur = { rect: w.rect, word: w.word }; Bandeau.showTip(anchor(w.rect), rr.t, rr.d + '  (' + rr.tag + ')'); };
    if (r) return show(r);
    if (online() && /^[\p{L}\p{M}'’-]{3,40}$/u.test(w.word)) { r = await remote(w.word); if (r) show(r); }
  };
  const out = (x, y) => !cur || !(x >= cur.rect.left - 6 && x <= cur.rect.right + 6 && y >= cur.rect.top - 6 && y <= cur.rect.bottom + 6);
  const init = () => {
    document.addEventListener('mousemove', e => { if (e.buttons || (e.sourceCapabilities && e.sourceCapabilities.firesTouchEvents)) return; lx = e.clientX; ly = e.clientY; if (cur && out(lx, ly)) hide(); clearTimeout(timer); if (!cur) timer = setTimeout(resolve, 380); else if (out(lx, ly)) timer = setTimeout(resolve, 380); }, { passive: true });
    document.addEventListener('mousedown', hide); document.addEventListener('keydown', e => { if (e.key === 'Escape') hide(); });
    // au clavier : Tab sur un lien d'outil = sa description
    document.addEventListener('focusin', e => { const a = e.target.closest && e.target.closest('a[href^="#/"]'); if (!a || !on()) return; const id = a.getAttribute('href').slice(2).split('?')[0], m = App.mods.find(x => x.id === id); if (m && DESC[id]) { cur = { rect: a.getBoundingClientRect() }; Bandeau.showTip(anchor(cur.rect), (m.icon ? m.icon + ' ' : '') + m.title, DESC[id]); } });
    document.addEventListener('focusout', e => { if (e.target.closest && e.target.closest('a[href^="#/"]')) hide(); });
  };
  return { init, local, DESC, G };
})();
