/* Outil Dys — correcteur français À RÈGLES, 100 % local.
   Honnêteté : ce n'est pas un correcteur complet. Il détecte des fautes fréquentes (table d'orthographe,
   homophones, accords courants, conjugaison de verbes courants, typographie, ponctuation, style).
   Il n'a pas de dictionnaire complet : un mot absent des règles n'est PAS vérifié. */
'use strict';

const Corrector = (() => {
  const LET = '\\p{L}\\p{M}';
  const R = (src, flags = 'giud') => new RegExp(src.replace(/<B>/g, `(?<![${LET}])`).replace(/<A>/g, `(?![${LET}])`).replace(/<W>/g, `[${LET}]+`), flags);
  const esc = k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/ /g, '\\s+').replace(/'/g, "['’]");
  const norm = s => s.toLowerCase().replace(/\s+/g, ' ').replace(/’/g, "'");
  const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
  function mc(orig, repl) {
    if (!orig || !repl) return repl;
    const t = orig.trim(); if (!t) return repl;
    if (t.length > 1 && t === t.toUpperCase() && /\p{L}/u.test(t)) return repl.toUpperCase();
    if (/^\p{Lu}/u.test(t)) return cap(repl);
    return repl;
  }
  function compileTable(map) {
    const keys = Object.keys(map).sort((a, b) => b.length - a.length);
    return { re: new RegExp(`(?<![${LET}])(?:${keys.map(esc).join('|')})(?![${LET}])`, 'giu'), map };
  }
  const T_ORTHO = compileTable(MISSPELL), T_CONF = compileTable(CONFUSIONS), T_CONJ = compileTable(CONJ_TABLE), T_PLEO = compileTable(PLEONASMES);
  const SOFT = ['tellement', 'les gens', 'franchement', 'carrément', 'bref', 'beaucoup de monde'];
  const INF_HARD = {}, INF_SOFT = {};
  Object.keys(INFORMAL).forEach(k => (SOFT.includes(k) ? INF_SOFT : INF_HARD)[k] = INFORMAL[k]);
  const T_INF = compileTable(Object.fromEntries(Object.keys(INF_HARD).map(k => [k, '1'])));
  const T_INF_SOFT = compileTable(Object.fromEntries(Object.keys(INF_SOFT).map(k => [k, '1'])));
  const T_STYLE = compileTable(Object.fromEntries(Object.keys(STYLE_UP).map(k => [k, '1'])));
  const CONSTR = parseMap("pallier à>pallier|palier à>pallier|se rappeler de>se rappeler|se rappelle de>se rappelle|je me rappelle de>je me rappelle|tu te rappelles de>tu te rappelles|aller au docteur>aller chez le docteur|aller au médecin>aller chez le médecin|aller au dentiste>aller chez le dentiste|aller au coiffeur>aller chez le coiffeur|malgré que>bien que|après que il>après qu'il");
  const T_CONSTR = compileTable(CONSTR);

  // ------------------------------------------------------------ phrases / mots
  const ABBR = new Set('m mme mlle dr pr st ste etc cf ex p pp vs env av apr fig art ch no n°  tel www'.split(' '));
  function splitSentences(text) {
    const out = []; let start = 0; const n = text.length;
    const push = (s, e) => { while (s < e && /\s/.test(text[s])) s++; while (e > s && /\s/.test(text[e - 1])) e--; if (e > s) out.push({ start: s, end: e, text: text.slice(s, e) }); };
    for (let i = 0; i < n; i++) {
      const c = text[i];
      if (c === '\n') { push(start, i); start = i + 1; continue; }
      if ('.!?…'.includes(c)) {
        let j = i; while (j + 1 < n && '.!?…'.includes(text[j + 1])) j++;
        const next = text[j + 1];
        if (j + 1 >= n || /\s/.test(next)) {
          if (c === '.' && j === i) {
            const before = text.slice(start, i).match(/([\p{L}\p{M}°]+)$/u); const w = before ? before[1].toLowerCase() : '';
            const after = text.slice(j + 1).match(/^\s*(\S)/);
            if (ABBR.has(w) || (w.length === 1) || (after && /\p{Ll}/u.test(after[1]) && w.length <= 3)) { i = j; continue; }
          }
          push(start, j + 1); start = j + 1; i = j;
        } else i = j;
      }
    }
    push(start, n); return out;
  }
  const wordRe = () => new RegExp(`[${LET}]+(?:['’\\-][${LET}]+)*`, 'gu');
  function words(text) { const r = []; let m; const re = wordRe(); while ((m = re.exec(text))) r.push({ w: m[0], start: m.index, end: m.index + m[0].length }); return r; }
  const countWords = t => (t.match(wordRe()) || []).length;
  const NOUN_PLURALIZABLE = w => !/[sxz]$/.test(w);
  const EPI = new Set(['élève', 'enfant', 'ami', 'professeur']);
  const PRON_S = '(?:je|j[\'’]|tu|il|elle|on|ils|elles|nous|vous)';

  // verbes : conjugaison
  const ER_OK = VERBES_ER;
  const ptc = v => v.slice(0, -2) + 'é';
  const nousForm = v => v.endsWith('ger') ? v.slice(0, -2) + 'eons' : v.endsWith('cer') ? v.slice(0, -3) + 'çons' : v.slice(0, -2) + 'ons';
  const subjForm = (s, v) => ({ je: v.slice(0, -1), "j'": v.slice(0, -1), 'j’': v.slice(0, -1), il: v.slice(0, -1), elle: v.slice(0, -1), on: v.slice(0, -1), tu: v.slice(0, -1) + 's', ils: v.slice(0, -2) + 'ent', elles: v.slice(0, -2) + 'ent', vous: v.slice(0, -2) + 'ez', nous: nousForm(v) }[s.toLowerCase()]);
  const ETRE_INF = { aller: 'allé', arriver: 'arrivé', tomber: 'tombé', rester: 'resté', entrer: 'entré', monter: 'monté', rentrer: 'rentré', retourner: 'retourné', sortir: 'sorti', partir: 'parti', venir: 'venu', descendre: 'descendu' };
  const PLURAL_FIX = { est: 'sont', a: 'ont', va: 'vont', fait: 'font', doit: 'doivent', peut: 'peuvent', dit: 'disent', prend: 'prennent', vient: 'viennent', veut: 'veulent', sait: 'savent' };
  const ADJ_PL = { proche: 'proches', rapide: 'rapides', lent: 'lents', chaud: 'chauds', froid: 'froids', beau: 'beaux', nouveau: 'nouveaux', gentil: 'gentils', petit: 'petits', grand: 'grands', content: 'contents', joli: 'jolis', bon: 'bons', long: 'longs', court: 'courts', fort: 'forts', faible: 'faibles', haut: 'hauts', lourd: 'lourds', blanc: 'blancs', noir: 'noirs' };
  const GENRE_FIX_M = { le: 'la', un: 'une', ce: 'cette', mon: 'ma', ton: 'ta', son: 'sa' };
  const GENRE_FIX_F = { la: 'le', une: 'un', cette: 'ce', ma: 'mon', ta: 'ton', sa: 'son' };
  const A_LIEU = { école: "à l'école", cantine: 'à la cantine', marché: 'au marché', piscine: 'à la piscine', bibliothèque: 'à la bibliothèque', boulangerie: 'à la boulangerie', collège: 'au collège', lycée: 'au lycée', travail: 'au travail', maison: 'à la maison', magasin: 'au magasin', parc: 'au parc', cinéma: 'au cinéma', gare: 'à la gare', plage: 'à la plage', campagne: 'à la campagne', montagne: 'à la montagne', mer: 'à la mer' };
  const ENDS_FUNC = new Set('le la les un une des de du à au aux et ou mais que qui dans sur par ce cette ces son sa ses mon ma mes notre leur leurs se ne je tu il on ils chez vers car'.split(' ')); // « nous, vous, elle, elles » peuvent finir une phrase : « avec nous », « sur elle »
  const NEG2 = new RegExp(`<B>(?:pas|plus|jamais|rien|que|qu['’]|guère|personne|aucun|aucune|nul|nulle|ni|point|nullement|aucunement|nullepart)<A>|n['’]importe|ne serait-ce|nulle part`.replace(/<B>/g, `(?<![${LET}])`).replace(/<A>/g, `(?![${LET}])`), 'iu');

  const RE_NE = R(String.raw`<B>(?<t>ne<A>|n['’](?=[${LET}]))`);
  const MOIS = { janvier: 31, février: 29, mars: 31, avril: 30, mai: 31, juin: 30, juillet: 31, août: 31, septembre: 30, octobre: 31, novembre: 30, décembre: 31 };

  // ------------------------------------------------------------ règles à motif (homophones, grammaire, conjugaison…)
  const RULES = [];
  const rule = (cat, src, msg, to, extra = {}) => RULES.push({ cat, re: R(src), msg, to, ...extra });

  // V2 : erreurs très fréquentes à l'écrit rapide (« he m'appelle », « m'appel », prénom sans majuscule)
  rule('ortho', String.raw`<B>(?<t>he)\s+(?=m['’]|t['’]|l['’]|n['’]|(?:suis|vais|veux|peux|dois|fais|sais|vois|pense|crois|ai|me|ne|ne)<A>)`, '« he » n’est pas un pronom français : pour parler de toi, on écrit « je ».', () => 'je', { kind: 'fix' });
  rule('conj', String.raw`<B>(?<t>[ms]['’]appel)<A>`, 'Le verbe « appeler » prend deux « l » + un « e » ici : « je m’appelle », « il s’appelle ».', (m, t, g) => [g.t[0] + '’appelle'], { kind: 'fix' });
  rule('conj', String.raw`<B>(?<t>t['’]appel)<A>`, 'Avec « tu », le verbe prend un « s » : « tu t’appelles ».', () => 't’appelles', { kind: 'fix' });
  rule('typo', String.raw`<B>[mst]['’]appel(?:les?)?\s+(?<t>\p{Ll}[\p{L}'’-]*)<A>`, 'Un prénom commence par une majuscule.', (m, t, g) => [g.t[0].toUpperCase() + g.t.slice(1)], { kind: 'fix', skip: g => g.t[0] === g.t[0].toUpperCase() || /^(pas|plus|aussi|bien|déjà|toujours|jamais|comme|ainsi|alors|donc|et|ou|mais|car|que|qui|le|la|les|un|une|des|ça|cela|ce|à|de|du)$/i.test(g.t) });
  rule('conj', String.raw`<B>(?:ils|elles)\s+ne\s+(?<t>sait|sais|veut|veux|peut|peux|voit|vois)<A>`, 'Avec « ils / elles », le verbe se met au pluriel.', (m, t, g) => [({ sait: 'savent', sais: 'savent', veut: 'veulent', veux: 'veulent', peut: 'peuvent', peux: 'peuvent', voit: 'voient', vois: 'voient' })[g.t.toLowerCase()]], { kind: 'fix' });
  rule('accord', String.raw`<B>(?:des|les|ces|mes|tes|ses|nos|vos|leurs|plusieurs|quelques)\s+(?<t>pomme|poire|planète|étoile|fleur|livre|cahier|stylo|crayon|table|chaise|maison|voiture|ami|amie|copain|copine|chat|chien|arbre|fruit|légume|élève|professeur|enfant|garçon|fille|jour|année|heure|minute|mot|phrase|texte|image|photo|film|jeu|devoir|exercice|question|réponse|idée|problème|erreur|faute|lettre|nombre|chiffre|ligne|page|ville|rue|route|montagne|rivière|lune|couleur|forme)<A>`, 'Accord en nombre : après un déterminant pluriel, le nom prend un « s ».', (m, t, g) => [g.t + 's'], { kind: 'fix' });
  // Homophones (lavande)
  rule('homo', String.raw`<B>(?:il|elle|on|ça|cela|qui)\s+(?<t>à)<A>`, '« à » (préposition) ou « a » (verbe avoir) ? Après « il / elle / on », on écrit « a » (il avait).', () => 'a');
  rule('homo', String.raw`(?<!tout\s)(?<t>à)\s+(?:été|eu|fait|dit|pris|mis|vu|pu|su|voulu|dû|mangé|parlé|joué|regardé|fini|oublié|perdu|donné|trouvé|acheté|lu|écrit)<A>`, 'Ici, c’est le verbe avoir : on écrit « a » (sans accent).', () => 'a');
  rule('homo', String.raw`<B>[${LET}]+(?:é|ée|és|ées|er|ir)\s+(?<t>a)\s+(?:l['’]|(?:la|le|les|un|une|mon|ma|mes|ton|ta|son|sa|notre|votre|leur|Paris|Lyon|Marseille|Nîmes|midi|demain|bientôt)<A>)`, 'Ici, c’est la préposition « à » (avec accent) : on peut dire « à ce moment-là ».', () => 'à', { skip: (g, m) => /^(a|ai|as)\s/i.test(m[0]) });
  rule('homo', String.raw`<B>(?:partis?|parties?|arrivée?s?|allée?s?|rentrée?s?|retournée?s?|venue?s?|restée?s?|montée?s?|descendue?s?)\s+(?<t>a)\s+(?:l['’]|(?:la|le|les|un|une|mon|ma|mes|ton|ta|son|sa|notre|votre|leur|Paris|Lyon|Marseille|Nîmes|midi|demain|bientôt)<A>)`, 'Ici, c’est la préposition « à » (avec accent).', () => 'à');
  rule('homo', String.raw`<B>(?:ils|elles)\s+(?<t>on)<A>`, 'Avec « ils / elles », c’est le verbe avoir : « ont ».', () => 'ont');
  rule('homo', String.raw`<B>tu\s+(?<t>à)<A>`, 'Avec « tu », c’est le verbe avoir : « tu as ».', () => 'as');
  rule('homo', String.raw`<B>(?:vais|vas|va|allons|allez|vont)\s+(?<t>a)\s+(?:l['’]|(?:la|le|les|un|une|mon|ma|mes|ton|ta|son|sa|notre|votre|leur|Paris|Lyon|Marseille|Nîmes|midi|demain|bientôt)<A>)`, 'Après « aller », c’est la préposition « à » (avec accent) : « je vais à la plage ».', () => 'à');
  rule('typo', String.raw`<B>(?<t>(?:c|j|n|s|l|d|qu)\s+(?:est|était|étaient|ai|avais|étais|en|y|il|elle|on|eau|école|homme|un|une|autre|autres|abord|accord|ailleurs))<A>`, 'Il manque l’apostrophe : on écrit « c’est », « j’ai », « l’école »… (la lettre seule et le mot sont collés par une apostrophe).', (m, t, g) => [g.t.replace(/\s+/, '’')], { kind: 'fix', skip: (g, m, txt) => /^[cdl]\s+(?:en|y)$/i.test(g.t) || /(?:^|\s)(?:un|le|la|lettre|plan|vitamine|point|option|type|groupe|rayon|étape|figure|partie)\s+$/i.test(txt.slice(Math.max(0, m.index - 14), m.index)) });
  rule('homo', String.raw`<B>(?:ils|elles)\s+(?<t>son)<A>`, 'Avec « ils / elles », c’est le verbe être : « sont ».', () => 'sont');
  rule('homo', String.raw`<B>(?<t>ont)\s+(?:va|peut|veut|doit|sait|dit|pense|croit|verra|fera)<A>`, '« on » (pronom) et non « ont » (avoir).', () => 'on');
  rule('homo', String.raw`<B>(?:il|elle|on|c['’]|ce)\s*(?<t>et)\s+(?:parti|arrivé|allé|venu|tombé|resté|né|mort|devenu|sorti|rentré|entré|monté|descendu|passé|fatigué|content|grand|petit|beau|bon|tard|tôt)<A>`, 'Ici, c’est le verbe être : « est » (il était).', () => 'est');
  rule('homo', String.raw`<B>(?<t>ou)\s+(?:est|sont|vas|va|allez|vont|habites|habite|se trouve|se trouvent|étais|était)<A>`, '« où » (lieu) prend un accent grave. « ou » veut dire « ou bien ».', () => 'où');
  rule('homo', String.raw`<B>(?:il|elle|on)\s+(?<t>peu)<A>`, 'Ici, c’est le verbe pouvoir : « peut ».', () => 'peut');
  rule('homo', String.raw`<B>(?:je|tu)\s+(?<t>peu)<A>`, 'Ici, c’est le verbe pouvoir : « peux ».', () => 'peux');
  rule('homo', String.raw`<B>(?<t>sa)\s+(?:va|veut|fait|sert|vient)<A>`, '« ça » (cela) et non « sa » (à lui / à elle).', () => 'ça');
  rule('homo', String.raw`<B>(?<t>ça)\s+(?:mère|père|maison|voiture|famille|sœur|soeur|tête|vie|classe|chambre|copine|bouche|main|mains|robe|chemise|fille|femme|amie)<A>`, '« sa » (à elle / à lui) et non « ça » (cela).', () => 'sa');
  rule('homo', String.raw`<B>(?<t>se)\s+(?:que|qui|matin|soir|jour|film|week-end|garçon|cahier|texte)<A>`, 'On écrit « ce » (démonstratif) : « ce que », « ce matin ».', () => 'ce');
  rule('homo', String.raw`<B>(?<t>ce)\s+(?:passe|trouve|souvient|rappelle|déroule|termine|passait|passera|trouvent|passent)<A>(?!-)`, 'Avec un verbe pronominal, on écrit « se » : « il se passe ».', () => 'se');
  rule('homo', String.raw`<B>(?:il|elle|on|qui)\s+(?<t>c['’]est)\s+<W>(?:é|ée|i|u|is|ie)<A>`, 'Verbe pronominal au passé composé : « s’est » (il s’est passé).', () => "s'est");
  rule('homo', String.raw`<B>(?<t>mais|met)\s+(?:amis|parents|affaires|cahiers|livres|enfants|frères|sœurs|amies|devoirs)<A>`, 'Possessif pluriel : « mes ».', () => 'mes');
  rule('homo', String.raw`<B>(?<t>ces)\s+(?:un|une|le|la|les|des|beau|bon|difficile|facile|vrai|normal|possible|important|simple)<A>`, 'Ici, c’est « c’est » (cela est).', () => "c'est");
  // Grammaire : genre et nombre (vert)
  const nounsM = NOUNS_M, nounsF = NOUNS_F;
  rule('gram', String.raw`<B>(?<d>le|un|ce|mon|ton|son)\s+(?<t>${nounsF.join('|')})<A>`, 'Accord en genre : ce nom est féminin.', (m, txt, g) => {
    const d = g.d.toLowerCase(), noun = g.t; const vowel = /^[aeiouyhéèêâîôû]/i.test(noun);
    if (['mon', 'ton', 'son'].includes(d) && vowel) return null;
    return null; // la suggestion remplace le déterminant : voir le champ « fixDet »
  }, { det: g => { const d = g.d.toLowerCase(); if (['mon', 'ton', 'son'].includes(d) && /^[aeiouyhéèêâîôû]/i.test(g.t)) return null; return GENRE_FIX_M[d]; } });
  rule('gram', String.raw`<B>(?<d>la|une|cette|ma|ta|sa)\s+(?<t>${nounsM.filter(n => !EPI.has(n)).join('|')})<A>`, 'Accord en genre : ce nom est masculin.', null, { det: g => GENRE_FIX_F[g.d.toLowerCase()] });
  rule('gram', String.raw`<B>(?<d>les|des|ces|mes|tes|ses|nos|vos|leurs|plusieurs|quelques|deux|trois|quatre|cinq|six|sept|huit|neuf|dix)\s+(?<t>${[...nounsM, ...nounsF].filter(NOUN_PLURALIZABLE).join('|')})<A>`, 'Accord en nombre : après un déterminant pluriel, le nom prend un « s ».', (m, txt, g) => g.t + 's');
  rule('gram', String.raw`<B>(?<d>le|la|un|une|ce|cette|mon|ma|ton|ta|son|sa|chaque)\s+(?<t>${[...nounsM, ...nounsF].filter(NOUN_PLURALIZABLE).map(n => n + 's').join('|')})<A>`, 'Accord en nombre : après un déterminant singulier, le nom reste au singulier.', (m, txt, g) => g.t.slice(0, -1));
  // Conjugaison (violet)
  rule('conj', String.raw`<B>(?<s>les|des|ces|mes|tes|ses|nos|vos|leurs)\s+(?<n>[${LET}]+s)\s+(?<t>${VERBES_3SG.join('|')})<A>`, 'Accord du verbe avec un sujet pluriel : le verbe se termine par « -nt ».', (m, txt, g) => g.t + 'nt');
  rule('conj', String.raw`<B>(?<s>les|des|ces|mes|tes|ses|nos|vos|leurs)\s+(?<n>(?!plus|moins|temps|fois|gens)[${LET}]+s)\s+(?<t>est|a|va|fait|doit|peut|dit|prend|vient|veut|sait)<A>`, 'Accord du verbe avec un sujet pluriel (les enfants → sont, ont, vont…).', (m, txt, g) => PLURAL_FIX[g.t.toLowerCase()]);
  rule('conj', String.raw`<B>(?<s>je|tu|il|elle|on)\s+(?<t>[${LET}]{3,}ent)<A>`, 'Avec ce sujet singulier, le verbe ne se termine pas par « -ent ».', (m, txt, g) => (g.s.toLowerCase() === 'tu' ? g.t.slice(0, -3) + 'es' : g.t.slice(0, -3) + 'e'), { skip: g => /ment$/i.test(g.t) || ['souvent', 'vent', 'lent', 'moment', 'comment', 'argent', 'agent', 'serpent', 'client', 'talent', 'parent', 'dent', 'cent', 'gent', 'urgent', 'récent', 'présent', 'absent', 'prudent', 'patient', 'président', 'accident', 'document', 'instrument', 'monument', 'gouvernement', 'événement', 'sentiment', 'jument', 'changement'].includes(g.t.toLowerCase()) });
  rule('conj', String.raw`<B>(?<s>ils|elles)\s+(?<t>${VERBES_3SG.join('|')})<A>`, 'Avec « ils / elles », le verbe se termine par « -nt ».', (m, txt, g) => g.t + 'nt');
  rule('conj', String.raw`<B>(?<s>tu)\s+(?<t>${VERBES_3SG.join('|')})<A>`, 'Avec « tu », le verbe se termine par « -s ».', (m, txt, g) => g.t + 's');
  rule('conj', String.raw`<B>(?<s>je|tu|il|elle|on|ils|elles|vous|nous)\s+(?<t>${ER_OK.join('|')})<A>`, 'Un verbe à l’infinitif ne s’emploie pas directement après le sujet : il faut le conjuguer.', (m, txt, g) => subjForm(g.s, g.t));
  rule('conj', String.raw`<B>(?:ai|as|a|avons|avez|ont)\s+(?<t>${ER_OK.join('|')})<A>`, 'Après « avoir », on utilise le participe passé (-é), pas l’infinitif (-er).', (m, txt, g) => ptc(g.t));
  rule('conj', String.raw`<B>(?:vais|vas|va|allons|allez|vont|veux|veut|voulons|voulez|veulent|peux|peut|pouvons|pouvez|peuvent|dois|doit|devons|devez|doivent)\s+(?<t>${ER_OK.map(ptc).join('|')})<A>`, 'Après ce verbe (aller, vouloir, pouvoir, devoir), on utilise l’infinitif (-er), pas le participe (-é).', (m, txt, g) => g.t.slice(0, -1) + 'er');
  rule('conj', String.raw`<B>(?:je suis|tu es|nous sommes|vous êtes|ils sont|elles sont|j['’]étais|il était|elle était|on était|nous étions)\s+(?<t>${Object.keys(ETRE_INF).join('|')})<A>`, 'Après « être », on utilise le participe passé, pas l’infinitif.', (m, txt, g) => ETRE_INF[g.t.toLowerCase()]);
  rule('conj', String.raw`<B>si\s+(?:je|tu|il|elle|on|nous|vous|ils|elles|j['’])\s*(?<t>[${LET}]+(?:rais|rait|rions|riez|raient))<A>`, 'Après « si » (condition), on n’utilise pas le conditionnel : on emploie l’imparfait.', () => null, { ctxSkip: /(demand\p{L}*|sav\p{L}*|sais|saur\p{L}*|voir|vois|vérifi\p{L}*|regard\p{L}*|dis-moi|dire|essay\p{L}*|ignor\p{L}*|curieux|comme)\s*$/iu });
  // Accords complexes (bordeaux)
  rule('accord', String.raw`<B>(?:les|mes|tes|ses|nos|vos|leurs|ces)\s+(?<n>[${LET}]+s)\s+que\s+(?:j['’]|je\s+|tu\s+|il\s+|elle\s+|on\s+|nous\s+|vous\s+|ils\s+|elles\s+)(?:ai|as|a|avons|avez|ont)\s+(?<t>[${LET}]+é)<A>`, 'Le mot « que » reprend un groupe placé avant le verbe avoir : le participe passé s’accorde avec ce groupe (genre et nombre).', (m, txt, g) => { const sing = g.n.slice(0, -1).toLowerCase(); return NOUNS_F.includes(sing) ? [g.t + 'es', g.t + 's'] : [g.t + 's', g.t + 'es']; });
  rule('accord', String.raw`<B>(?:les|des|ces|mes|tes|ses|nos|vos|leurs)\s+(?<n>[${LET}]+)\s+(?:sont|étaient|seront|furent)\s+(?<t>[${LET}]+[éiu])<A>`, 'Avec « être », le participe passé s’accorde avec le sujet pluriel.', (m, txt, g) => { const sing = g.n.replace(/s$/, '').toLowerCase(); return NOUNS_F.includes(sing) ? [g.t + 'es', g.t + 's'] : [g.t + 's', g.t + 'es']; }, { skip: g => /^(ici|aussi|ainsi|parmi|merci|midi|oui|ni|si|ci|lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|joli|poli|ennui|bref|nu|cru|dru|aigu|ambigu|menu|vu)$/i.test(g.t) });
  rule('accord', String.raw`<B>(?:ils|elles)\s+(?:sont|étaient|seront)\s+(?:très\s+|trop\s+|assez\s+|bien\s+|si\s+|plus\s+|moins\s+)?(?<t>${Object.keys(ADJ_PL).join('|')})<A>`, 'L’adjectif attribut s’accorde avec le sujet pluriel.', (m, txt, g) => ADJ_PL[g.t.toLowerCase()]);
  rule('gram', String.raw`(?<!<B>ils\s)(?<!<B>elles\s)<B>[${LET}]+s\s+(?<t>on)\s+pas<A>`, 'Il manque « ne » et le verbe est « avoir » : « ils n’ont pas ». (« on » ne peut pas se trouver là.)', () => "n'ont");
  rule('accord', String.raw`<B>(?:les|des|ces|mes|tes|ses|nos|vos|leurs)\s+[${LET}]+s\s+(?:sont|étaient|seront)\s+(?<t>${Object.keys(ADJ_PL).join('|')})<A>`, 'L’adjectif attribut s’accorde avec le sujet pluriel.', (m, txt, g) => ADJ_PL[g.t.toLowerCase()]);
  // Mots manquants (rose)
  rule('manque', String.raw`<B>(?:vais|vas|va|allons|allez|vont)\s+(?<t>${Object.keys(A_LIEU).join('|')})<A>`, 'Il manque un mot : après « aller », on a besoin de « à / au / à la / à l’ ».', (m, txt, g) => A_LIEU[g.t.toLowerCase()]);
  // Ponctuation (corail)
  rule('ponct', String.raw`[${LET}\d](?<t>\s+mais)<A>`, 'Il manque probablement une virgule avant « mais ».', () => ', mais', { kind: 'style', skip: (g, m, txt) => /non\s+seulement/i.test(txt.slice(Math.max(0, m.index - 80), m.index)) });
  rule('ponct', String.raw`(?<=^|[.!?…]\s+|\n)(?<t>Cependant|Pourtant|Toutefois|Néanmoins|Premièrement|Deuxièmement|Troisièmement|En effet|Par exemple|De plus|En conclusion|En revanche|Par ailleurs|En outre|D['’]abord)(?=\s+[${LET}])`, 'Il manque probablement une virgule après ce mot de liaison.', (m, txt, g) => g.t + ',', { flags: 'gimud' });
  rule('ponct', String.raw`(?<t>,\s*,)`, 'Deux virgules à la suite : il en faut une seule.', () => ',');
  rule('ponct', String.raw`[${LET}](?<t>\.\.)(?!\.)`, 'Deux points à la suite : il en faut un seul (ou trois pour « … »).', () => '.');
  rule('ponct', String.raw`(?<t>(?<=^|[.!?…]\s+|\n)(?:Est-ce que|Pourquoi|Comment|Combien|Où (?:est|sont|vas|va|allez|habites|habite|se|peut|puis)|Qui est|Que fais|Que fait)[^.!?\n]*)\.(?=\s|$)`, 'Cette phrase est une question : elle se termine par « ? ».', () => null, { flags: 'gimud', questionMark: true });
  // Syntaxe (orange)
  rule('synt', String.raw`<B>(?:sais|sait|demande|demandes|savoir|dis|dire|comprends|comprend|sais-tu|sait-il)\s+(?:pas\s+)?(?:où|quand|comment|pourquoi|ce que|qui)\s+(?<t>est-ce\s+(?:qu['’]|que\s+))`, 'Dans une question indirecte, on ne met pas « est-ce que » : « je ne sais pas où il habite ».', () => '');
  // Cohérence (turquoise)
  rule('coh', String.raw`<B>(?<t>toujours)<A>[^.!?\n]*<B>jamais<A>|<B>(?<t2>jamais)<A>[^.!?\n]*<B>toujours<A>`, 'Contradiction possible : « toujours » et « jamais » dans la même phrase.', () => null);
  // Style (bleu marine) — voix passive
  rule('amelio', String.raw`<B>(?:est|sont|était|étaient|sera|seront|a été|ont été)\s+<W>(?:é|ée|és|ées|i|ie|is|ies|u|ue|us|ues)\s+(?<t>par)\s`, 'Voix passive : tu peux essayer la voix active (« X fait Y »), souvent plus directe.', () => null);

  // ------------------------------------------------------------ analyse principale
  let uid = 0;
  function analyze(text, opts = {}) {
    const o = Object.assign({ typoSpaces: true, caps: true, finalPunct: true, referent: true, repeats: true, longSentence: 35 }, opts);
    const errors = []; const seen = new Set();
    const add = (start, end, cat, msg, sugg, rule, kind) => {
      if (end <= start) return; const key = start + ':' + end + ':' + cat + ':' + rule; if (seen.has(key)) return; seen.add(key);
      const orig = text.slice(start, end);
      const list = (Array.isArray(sugg) ? sugg : sugg ? [sugg] : []).filter(s => s != null);
      errors.push({ id: 'e' + (++uid), start, end, cat, msg, sugg: list, rule, orig, kind: kind || (list.length ? 'fix' : 'info') });
    };
    const runTable = (T, cat, msgFn, rname, kind, filter) => {
      T.re.lastIndex = 0; let m;
      while ((m = T.re.exec(text))) {
        const key = norm(m[0]); const val = T.map[key]; if (val === undefined) continue;
        if (filter && !filter(m, key)) continue;
        const s = msgFn(m[0], val, key);
        add(m.index, m.index + m[0].length, cat, s.msg, s.sugg, rname, s.kind || kind);
      }
    };

    // Orthographe, confusions, conjugaison, pléonasmes
    runTable(T_ORTHO, 'ortho', (o_, v) => ({ msg: `Orthographe : « ${o_} » s’écrit « ${v} ».`, sugg: [mc(o_, v)] }), 'ortho-table');
    runTable(T_CONF, 'homo', (o_, v) => ({ msg: `Confusion ou mot mal écrit : on écrit « ${v} ».`, sugg: [mc(o_, v)] }), 'confusion-table');
    runTable(T_CONJ, 'conj', (o_, v) => ({ msg: `Conjugaison : on écrit « ${v} ».`, sugg: [mc(o_, v)] }), 'conj-table');
    runTable(T_PLEO, 'rep', (o_, v) => ({ msg: `Redite (pléonasme) : « ${o_} » peut se dire « ${v} ».`, sugg: [mc(o_, v)], kind: 'style' }), 'pleonasme');
    runTable(T_CONSTR, 'synt', (o_, v) => ({ msg: `Construction à corriger : on dit « ${v} ».`, sugg: [mc(o_, v)] }), 'construction');
    runTable(T_INF, 'vocab', (o_, v, key) => ({ msg: `Vocabulaire familier ou vague : « ${o_} ». À l’écrit, préfère un mot plus précis.`, sugg: (INF_HARD[key] || []).map(s => mc(o_, s)), kind: 'style' }), 'vocab-familier', 'style', (m, key) => {
      if (key === 'chose' || key === 'choses') { const b = text.slice(Math.max(0, m.index - 12), m.index).toLowerCase(); if (/(quelque|autre|autres|même|mêmes|grand|toute|toutes)\s*-?\s*$/.test(b)) return false; }
      return true;
    });
    runTable(T_INF_SOFT, 'amelio', (o_, v, key) => ({ msg: `Registre : « ${o_} » est courant à l’oral. Dans un texte soigné, tu peux choisir autre chose.`, sugg: (INF_SOFT[key] || []).map(s => mc(o_, s)), kind: 'style' }), 'registre', 'style');
    runTable(T_STYLE, 'amelio', (o_, v, key) => ({ msg: 'Amélioration facultative : une formulation plus précise est possible.', sugg: (STYLE_UP[key] || []).map(s => mc(o_, s)), kind: 'style' }), 'style-up', 'style', (m, key) => {
      if (key === 'il y a') { const b = text.slice(0, m.index); return /(^|[.!?…]\s*|\n\s*)$/.test(b); }
      return true;
    });

    // Règles à motif
    for (const r of RULES) {
      r.re.lastIndex = 0; let m;
      while ((m = r.re.exec(text))) {
        if (m[0].length === 0) { r.re.lastIndex++; continue; }
        const g = m.groups || {}; const ind = m.indices && m.indices.groups ? m.indices.groups : {};
        if (r.skip && r.skip(g, m, text)) continue;
        if (r.ctxSkip && r.ctxSkip.test(text.slice(Math.max(0, m.index - 30), m.index))) continue;
        let tkey = g.t !== undefined ? 't' : (g.t2 !== undefined ? 't2' : null);
        let s, e;
        if (r.questionMark) { s = m.indices[0][1] - 1; e = m.indices[0][1]; add(s, e, r.cat, r.msg, ' ?', r.cat + '-question', 'fix'); continue; }
        if (tkey && ind[tkey]) { [s, e] = ind[tkey]; } else { s = m.index; e = m.index + m[0].length; }
        if (r.cat === 'coh') { const sent = splitSentences(text).find(x => x.start <= m.index && x.end >= m.index); if (sent) { s = sent.start; e = sent.end; } }
        let sugg;
        if (r.det) { const d = r.det(g); if (d && ind.d) { add(ind.d[0], ind.d[1], r.cat, r.msg, [mc(text.slice(ind.d[0], ind.d[1]), d)], 'det-genre', 'fix'); } else if (!d) { /* pas de suggestion sûre */ } continue; }
        else if (r.to) { sugg = r.to(m, text, g); if (sugg === null) sugg = []; }
        else sugg = [];
        const orig = text.slice(s, e);
        const list = (Array.isArray(sugg) ? sugg : [sugg]).filter(x => x !== undefined && x !== null).map(x => (/^\s/.test(orig) ? x : mc(orig, x)));
        add(s, e, r.cat, r.msg, list, r.cat + '-regle', r.kind);
      }
    }
    // Déterminant + nom : accord (suggestion par remplacement du déterminant)
    // (traité dans la boucle ci-dessus via r.det)

    // Mots répétés à la suite
    { const re = R(String.raw`<B>(?<w>[${LET}]+)\s+\k<w><A>`); let m; while ((m = re.exec(text))) { const w = m.groups.w.toLowerCase(); if (['nous', 'vous'].includes(w)) continue; add(m.index, m.index + m[0].length, 'rep', `Le mot « ${m.groups.w} » est répété deux fois de suite.`, [m.groups.w], 'mot-double', 'fix'); } }

    // Gris : mots inhabituels
    for (const w of words(text)) {
      const t = w.w; const letters = t.replace(/['’\-]/g, '');
      if (letters.length >= 4 && /[^aeiouyàâäéèêëîïôöùûüœæ'’\-\d\s]{5,}/i.test(letters.replace(/[A-Z]{2,}/g, 'a'))) add(w.start, w.end, 'ambigu', `Mot inhabituel : « ${t} » ne ressemble pas à un mot français. À vérifier.`, [], 'mot-inhabituel', 'info');
      else if (/(.)\1\1/i.test(letters) && letters.length >= 4 && !/^(www|hhh)/i.test(letters)) add(w.start, w.end, 'ambigu', `Lettre répétée trois fois dans « ${t} » : faute de frappe ? À vérifier.`, [], 'lettres-triples', 'info');
      else if (/\p{Ll}\p{Lu}/u.test(letters) && !/^(Mc|Mac)/.test(letters)) add(w.start, w.end, 'ambigu', `Majuscule au milieu du mot « ${t} » : à vérifier.`, [], 'majuscule-milieu', 'info');
      else if (letters.length > 26) add(w.start, w.end, 'ambigu', `Mot très long (« ${t} ») : à vérifier.`, [], 'mot-long', 'info');
    }

    // Typographie (cyan)
    {
      let m;
      const re1 = /(?<=\S)( {2,})(?=\S)/g; while ((m = re1.exec(text))) add(m.index, m.index + m[0].length, 'typo', 'Espaces en trop : une seule espace suffit.', [' '], 'espaces-doubles', 'fix');
      const re2 = /(?<=\S)( +)(?=[,.](?:\s|$))/g; while ((m = re2.exec(text))) add(m.index, m.index + m[0].length, 'typo', 'Pas d’espace avant une virgule ou un point.', [''], 'espace-avant-virgule', 'fix');
      const re3 = new RegExp(`([${LET}])(?<t>[,;])(?=[${LET}])`, 'gu'); while ((m = re3.exec(text))) add(m.index + 1, m.index + 2, 'typo', `Il manque une espace après « ${m[2]} ».`, [m[2] + ' '], 'espace-apres-ponct', 'fix');
      const re3b = new RegExp(`([${LET}]{2,})(\\.)(?=[A-ZÀ-ÝÉ][a-zà-ÿ])`, 'gu'); while ((m = re3b.exec(text))) { if (/^(www|http)/i.test(m[1])) continue; add(m.index + m[1].length, m.index + m[1].length + 1, 'typo', 'Il manque une espace après le point.', ['. '], 'espace-apres-point', 'fix'); }
      if (o.typoSpaces) {
        const re4 = new RegExp(`([${LET}\\d»\\)])([!?;])(?=\\s|$|[»”\\)])`, 'gu'); while ((m = re4.exec(text))) add(m.index + 1, m.index + 2, 'typo', `En français, on met une espace avant « ${m[2]} » (espace insécable idéalement).`, [' ' + m[2]], 'espace-avant-double', 'fix');
        const re5 = new RegExp(`([${LET}\\)])(:)(?=\\s)`, 'gu'); while ((m = re5.exec(text))) add(m.index + 1, m.index + 2, 'typo', 'En français, on met une espace avant « : ».', [' :'], 'espace-avant-deux-points', 'fix');
      }
      const re6 = /"([^"\n]{1,200})"/g; while ((m = re6.exec(text))) add(m.index, m.index + m[0].length, 'typo', 'En français, on utilise les guillemets « … ».', ['« ' + m[1] + ' »'], 'guillemets', 'fix');
      const re7 = /\betc\.\.+/gi; while ((m = re7.exec(text))) add(m.index, m.index + m[0].length, 'typo', '« etc. » ne se termine que par un seul point.', ['etc.'], 'etc-points', 'fix');
      if (o.caps) {
        const re8 = new RegExp(`([${LET}]{4,}[.!?…])(\\s+)(\\p{Ll})`, 'gu');
        while ((m = re8.exec(text))) { const w = m[1].toLowerCase().replace(/[.!?…]/g, ''); if (ABBR.has(w) || /^(etc|env|suiv)$/.test(w)) continue; const pos = m.index + m[1].length + m[2].length; add(pos, pos + 1, 'typo', 'Une phrase commence par une majuscule.', [m[3].toUpperCase()], 'majuscule-phrase', 'fix'); }
        const re9 = new RegExp(`(?:^|\\n)([ \\t]*)(\\p{Ll})(?=[${LET}'’])`, 'gu');
        while ((m = re9.exec(text))) { const pos = m.index + m[0].length - 1; const prev = text.slice(0, m.index).replace(/\s+$/, ''); if (prev && !/[.!?…:»]$/.test(prev)) continue; add(pos, pos + 1, 'typo', 'Le début d’une phrase prend une majuscule.', [m[2].toUpperCase()], 'majuscule-debut', 'fix'); }
      }
    }
    // Phrases : syntaxe, ponctuation, mots manquants, cohérence
    const sents = splitSentences(text);
    for (const s of sents) {
      const wl = words(s.text); const n = wl.length;
      if (o.longSentence && n > o.longSentence) add(s.start, s.end, 'synt', `Phrase trop longue (${n} mots) : essaie de la couper en phrases plus courtes.`, [], 'phrase-longue', 'info');
      const nq = (s.text.match(/(?<![\p{L}\p{M}])que(?![\p{L}\p{M}])|qu['’]/giu) || []).length;
      if (nq >= 3) add(s.start, s.end, 'synt', `Il y a ${nq} « que » dans cette phrase : la construction est lourde.`, [], 'trop-de-que', 'info');
      // phrase inachevée
      if (n >= 3 && wl.length) {
        const last = wl[wl.length - 1]; const lw = last.w.toLowerCase();
        const tail = s.text.slice(last.end).replace(/\s+/g, '');
        if (ENDS_FUNC.has(lw) && (tail === '' || /^[.!?…]+$/.test(tail))) add(s.start + (wl[Math.max(0, n - 3)].start), s.end, 'manque', `La phrase semble s’arrêter trop tôt (elle finit par « ${last.w} ») : un mot manque peut-être.`, [], 'phrase-inachevee', 'info');
      }
      // négation incomplète
      RE_NE.lastIndex = 0;
      const neM = RE_NE.exec(s.text);
      if (neM && !NEG2.test(s.text)) { add(s.start + neM.index, s.start + neM.index + neM[0].length, 'manque', 'La négation a deux parties : « ne » + « pas / plus / jamais / rien… ». Il en manque une (sauf tournure littéraire).', [], 'negation-incomplete', 'info'); }
    }
    // paragraphes
    {
      const reP = /[^\n]+/g; let m; const paras = [];
      while ((m = reP.exec(text))) if (m[0].trim()) paras.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
      let firstDone = false;
      for (const p of paras) {
        const wl = words(p.text);
        // ponctuation finale manquante
        if (o.finalPunct && wl.length >= 6 && !/[.!?…:;»)"”\]]\s*$/.test(p.text) && !/^\s*(?:[-•*\d]+[.)]?\s)/.test(p.text)) {
          const lw = wl[wl.length - 1]; add(p.start + lw.start, p.start + lw.end, 'ponct', 'Il manque une ponctuation à la fin de la phrase.', [lw.w + '.'], 'ponct-finale', 'fix');
        }
        // parenthèses
        const st = []; for (let i = 0; i < p.text.length; i++) { const c = p.text[i]; if (c === '(') st.push(i); else if (c === ')') { if (st.length) st.pop(); else add(p.start + i, p.start + i + 1, 'ponct', 'Parenthèse fermante sans parenthèse ouvrante.', [], 'parenthese', 'info'); } }
        st.forEach(i => add(p.start + i, p.start + i + 1, 'ponct', 'Parenthèse ouvrante jamais fermée.', [], 'parenthese', 'info'));
        // répétitions de mots
        if (o.repeats) {
          const cnt = new Map();
          for (const w of wl) { const k = w.w.toLowerCase(); if (k.length < 5 || STOP.has(k) || /\d/.test(k)) continue; if (!cnt.has(k)) cnt.set(k, []); cnt.get(k).push(w); }
          const thr = wl.length > 150 ? 4 : 3;
          for (const [k, arr] of cnt) if (arr.length >= thr) arr.slice(1).forEach(w => add(p.start + w.start, p.start + w.end, 'rep', `Le mot « ${k} » revient ${arr.length} fois dans ce passage : essaie un synonyme ou un pronom.`, [], 'mot-repete', 'info'));
        }
        // phrases commençant pareil (3 de suite)
        const ps = sents.filter(s => s.start >= p.start && s.end <= p.end + 1);
        for (let i = 2; i < ps.length; i++) { const f = x => (x.text.match(wordRe()) || [''])[0].toLowerCase(); const a = f(ps[i - 2]), b = f(ps[i - 1]), c = f(ps[i]); if (a && a === b && b === c && a.length > 1) { const w = words(ps[i].text)[0]; add(ps[i].start + w.start, ps[i].start + w.end, 'rep', `Trois phrases de suite commencent par « ${w.w} » : varie le début.`, [], 'debut-repete', 'info'); } }
        // référent peu clair (début du document)
        if (o.referent && !firstDone) { firstDone = true; const fw = (p.text.match(wordRe()) || [''])[0]; if (/^(il|elle|ils|elles|cela|ça|ceci|celui-ci|celle-ci)$/i.test(fw) && p.text.indexOf(fw) < 3 && !/^(il\s+(y\s+a|faut|fait|pleut|neige|s['’]agit|est\s+(?:\d|midi|minuit|tard|tôt|temps|possible|important|interdit))|ça\s+va|cela\s+(?:dit|fait))/i.test(p.text.trim())) add(p.start + p.text.indexOf(fw), p.start + p.text.indexOf(fw) + fw.length, 'ambigu', `Le texte commence par « ${fw} » : de qui ou de quoi parle-t-on ? À préciser.`, [], 'referent-debut', 'info'); }
        // cohérence : énumérations incomplètes
        const lower = p.text.toLowerCase();
        [[/d['’]une part/, /d['’]autre part/, 'D’une part… : il manque « d’autre part ».'], [/premièrement/, /deuxièmement|ensuite|puis|enfin|en second lieu/, 'Premièrement… : il manque la suite (deuxièmement, ensuite…).'], [/en premier lieu/, /en second lieu|ensuite|enfin|en deuxième lieu/, 'En premier lieu… : il manque « en second lieu ».']].forEach(([a, b, msg]) => {
          const ma = a.exec(lower); if (ma && !b.test(text.toLowerCase().slice(p.start + ma.index))) add(p.start + ma.index, p.start + ma.index + ma[0].length, 'coh', msg, [], 'enumeration', 'info');
        });
      }
    }
    // cohérence : dates impossibles, intervalles inversés
    { let m; const reD = new RegExp(`(\\d{1,2})\\s+(janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)(?:\\s+(\\d{4}))?`, 'giu');
      while ((m = reD.exec(text))) { const d = +m[1], mo = m[2].toLowerCase(); let max = MOIS[mo]; if (mo === 'février' && m[3]) { const y = +m[3]; max = ((y % 4 === 0 && y % 100 !== 0) || y % 400 === 0) ? 29 : 28; } if (d < 1 || d > max) add(m.index, m.index + m[0].length, 'coh', `Date impossible : il n'y a pas de ${d} ${mo}${mo === 'février' && m[3] ? ' ' + m[3] : ''}.`, [], 'date-impossible', 'info'); }
      const reI = /entre\s+(\d{4})\s+et\s+(\d{4})/gi; while ((m = reI.exec(text))) if (+m[1] > +m[2]) add(m.index, m.index + m[0].length, 'coh', 'Intervalle à l’envers : la première date est plus récente que la seconde.', [`entre ${m[2]} et ${m[1]}`], 'intervalle-inverse', 'fix'); }

    errors.sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
    const wl = words(text);
    return { errors, stats: { words: wl.length, sentences: sents.length, chars: text.length } };
  }

  // ------------------------------------------------------------ corrections
  const SAFE_CATS = new Set(['ortho', 'gram', 'conj', 'homo', 'accord', 'typo', 'ponct', 'manque', 'synt', 'coh']);
  function pickErrors(errors, mode = 'safe') {
    // mode : 'safe' (fautes certaines) | 'style' (fautes + formulation)
    return errors.filter(e => e.sugg.length && ((e.kind === 'fix' && SAFE_CATS.has(e.cat)) || (mode === 'style' && (e.kind === 'style' || (e.kind === 'fix' && e.cat === 'rep')))));
  }
  function applyFixes(text, fixes) {
    // fixes : [{start,end,text}] ; ignore les chevauchements
    const sorted = fixes.slice().sort((a, b) => a.start - b.start || (b.end - b.start) - (a.end - a.start));
    let out = '', pos = 0; const applied = [];
    for (const f of sorted) { if (f.start < pos) continue; out += text.slice(pos, f.start) + f.text; pos = f.end; applied.push(f); }
    return { text: out + text.slice(pos), applied };
  }
  function autoCorrect(text, mode = 'safe') {
    const { errors } = analyze(text, { longSentence: 0 });
    const fixes = pickErrors(errors, mode).map(e => ({ start: e.start, end: e.end, text: e.sugg[0] }));
    return applyFixes(text, fixes);
  }

  return { analyze, autoCorrect, pickErrors, applyFixes, splitSentences, words, countWords, mc };
})();
