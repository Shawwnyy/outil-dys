// Conjugueur : tout est calculé sur l'appareil avec les règles de la conjugaison française (aucune donnée en ligne).
// Couvre : verbes en -er (avec leurs changements d'orthographe : -cer, -ger, -yer, -eler/-eter, é/e + consonne), 2e groupe (-ir/-issons),
// verbes en -dre réguliers (vendre), une quarantaine de verbes irréguliers fréquents et leurs familles (prendre → apprendre…), verbes
// pronominaux (se laver) et les verbes impersonnels (falloir, pleuvoir). Temps : présent, passé composé, imparfait, plus-que-parfait, futur,
// futur antérieur, conditionnel présent/passé, subjonctif présent/passé, impératif. Le passé simple n'est pas inclus (dit clairement dans la page).
const Conj = (() => {
  const PERS = ['je', 'tu', 'il / elle / on', 'nous', 'vous', 'ils / elles'];
  const ASP_H = new Set(['hurler', 'haïr', 'harceler', 'hausser', 'heurter', 'hisser', 'hacher', 'harponner', 'hocher', 'hanter', 'harasser', 'hennir', 'hâter']);
  const V = /^[aeiouyàâäéèêëîïôöùûüœæ]/i;
  const noAcc = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '');

  // ── verbes irréguliers : p = présent, im = radical d'imparfait (= « nous » du présent sans -ons), fu = radical de futur/conditionnel,
  //    sj = subjonctif (tableau) OU sj3 (je, tu, il, ils) + sj1 (nous, vous), pp = participe passé, ip = impératif [tu, nous, vous]
  const IRR = {
    'être': { p: ['suis', 'es', 'est', 'sommes', 'êtes', 'sont'], im: 'ét', fu: 'ser', sj: ['sois', 'sois', 'soit', 'soyons', 'soyez', 'soient'], pp: 'été', pa: 'étant', ip: ['sois', 'soyons', 'soyez'], g: '3e groupe (verbe très irrégulier)' },
    'avoir': { p: ['ai', 'as', 'a', 'avons', 'avez', 'ont'], im: 'av', fu: 'aur', sj: ['aie', 'aies', 'ait', 'ayons', 'ayez', 'aient'], pp: 'eu', pa: 'ayant', ip: ['aie', 'ayons', 'ayez'], g: '3e groupe (verbe très irrégulier)' },
    'aller': { p: ['vais', 'vas', 'va', 'allons', 'allez', 'vont'], im: 'all', fu: 'ir', sj: ['aille', 'ailles', 'aille', 'allions', 'alliez', 'aillent'], pp: 'allé', aux: 'être', ip: ['va', 'allons', 'allez'], g: '3e groupe' },
    'faire': { p: ['fais', 'fais', 'fait', 'faisons', 'faites', 'font'], im: 'fais', fu: 'fer', sj: ['fasse', 'fasses', 'fasse', 'fassions', 'fassiez', 'fassent'], pp: 'fait', ip: ['fais', 'faisons', 'faites'], g: '3e groupe' },
    'dire': { p: ['dis', 'dis', 'dit', 'disons', 'dites', 'disent'], im: 'dis', fu: 'dir', sj3: 'dis', sj1: 'dis', pp: 'dit', ip: ['dis', 'disons', 'dites'], g: '3e groupe' },
    'pouvoir': { p: ['peux', 'peux', 'peut', 'pouvons', 'pouvez', 'peuvent'], im: 'pouv', fu: 'pourr', sj: ['puisse', 'puisses', 'puisse', 'puissions', 'puissiez', 'puissent'], pp: 'pu', g: '3e groupe', note: 'Pas d’impératif pour ce verbe.' },
    'vouloir': { p: ['veux', 'veux', 'veut', 'voulons', 'voulez', 'veulent'], im: 'voul', fu: 'voudr', sj: ['veuille', 'veuilles', 'veuille', 'voulions', 'vouliez', 'veuillent'], pp: 'voulu', g: '3e groupe', note: 'Impératif rare (« veuillez » est une formule de politesse).' },
    'savoir': { p: ['sais', 'sais', 'sait', 'savons', 'savez', 'savent'], im: 'sav', fu: 'saur', sj: ['sache', 'saches', 'sache', 'sachions', 'sachiez', 'sachent'], pp: 'su', pa: 'sachant', ip: ['sache', 'sachons', 'sachez'], g: '3e groupe' },
    'devoir': { p: ['dois', 'dois', 'doit', 'devons', 'devez', 'doivent'], im: 'dev', fu: 'devr', sj3: 'doiv', sj1: 'dev', pp: 'dû', g: '3e groupe', note: 'Participe passé « dû » : accent seulement au masculin singulier (due, dus, dues).' },
    'voir': { p: ['vois', 'vois', 'voit', 'voyons', 'voyez', 'voient'], im: 'voy', fu: 'verr', sj3: 'voi', sj1: 'voy', pp: 'vu', ip: ['vois', 'voyons', 'voyez'], g: '3e groupe' },
    'venir': { p: ['viens', 'viens', 'vient', 'venons', 'venez', 'viennent'], im: 'ven', fu: 'viendr', sj3: 'vienn', sj1: 'ven', pp: 'venu', aux: 'être', ip: ['viens', 'venons', 'venez'], g: '3e groupe' },
    'tenir': { p: ['tiens', 'tiens', 'tient', 'tenons', 'tenez', 'tiennent'], im: 'ten', fu: 'tiendr', sj3: 'tienn', sj1: 'ten', pp: 'tenu', ip: ['tiens', 'tenons', 'tenez'], g: '3e groupe' },
    'prendre': { p: ['prends', 'prends', 'prend', 'prenons', 'prenez', 'prennent'], im: 'pren', fu: 'prendr', sj3: 'prenn', sj1: 'pren', pp: 'pris', ip: ['prends', 'prenons', 'prenez'], g: '3e groupe' },
    'mettre': { p: ['mets', 'mets', 'met', 'mettons', 'mettez', 'mettent'], im: 'mett', fu: 'mettr', sj3: 'mett', sj1: 'mett', pp: 'mis', ip: ['mets', 'mettons', 'mettez'], g: '3e groupe' },
    'battre': { p: ['bats', 'bats', 'bat', 'battons', 'battez', 'battent'], im: 'batt', fu: 'battr', sj3: 'batt', sj1: 'batt', pp: 'battu', ip: ['bats', 'battons', 'battez'], g: '3e groupe' },
    'lire': { p: ['lis', 'lis', 'lit', 'lisons', 'lisez', 'lisent'], im: 'lis', fu: 'lir', sj3: 'lis', sj1: 'lis', pp: 'lu', ip: ['lis', 'lisons', 'lisez'], g: '3e groupe' },
    'écrire': { p: ['écris', 'écris', 'écrit', 'écrivons', 'écrivez', 'écrivent'], im: 'écriv', fu: 'écrir', sj3: 'écriv', sj1: 'écriv', pp: 'écrit', ip: ['écris', 'écrivons', 'écrivez'], g: '3e groupe' },
    'courir': { p: ['cours', 'cours', 'court', 'courons', 'courez', 'courent'], im: 'cour', fu: 'courr', sj3: 'cour', sj1: 'cour', pp: 'couru', ip: ['cours', 'courons', 'courez'], g: '3e groupe' },
    'boire': { p: ['bois', 'bois', 'boit', 'buvons', 'buvez', 'boivent'], im: 'buv', fu: 'boir', sj3: 'boiv', sj1: 'buv', pp: 'bu', ip: ['bois', 'buvons', 'buvez'], g: '3e groupe' },
    'croire': { p: ['crois', 'crois', 'croit', 'croyons', 'croyez', 'croient'], im: 'croy', fu: 'croir', sj3: 'croi', sj1: 'croy', pp: 'cru', ip: ['crois', 'croyons', 'croyez'], g: '3e groupe' },
    'recevoir': { p: ['reçois', 'reçois', 'reçoit', 'recevons', 'recevez', 'reçoivent'], im: 'recev', fu: 'recevr', sj3: 'reçoiv', sj1: 'recev', pp: 'reçu', ip: ['reçois', 'recevons', 'recevez'], g: '3e groupe' },
    'vivre': { p: ['vis', 'vis', 'vit', 'vivons', 'vivez', 'vivent'], im: 'viv', fu: 'vivr', sj3: 'viv', sj1: 'viv', pp: 'vécu', ip: ['vis', 'vivons', 'vivez'], g: '3e groupe' },
    'suivre': { p: ['suis', 'suis', 'suit', 'suivons', 'suivez', 'suivent'], im: 'suiv', fu: 'suivr', sj3: 'suiv', sj1: 'suiv', pp: 'suivi', ip: ['suis', 'suivons', 'suivez'], g: '3e groupe', note: '« je suis » peut venir de « être » ou de « suivre » : c’est le contexte qui décide.' },
    'connaître': { p: ['connais', 'connais', 'connaît', 'connaissons', 'connaissez', 'connaissent'], im: 'connaiss', fu: 'connaîtr', sj3: 'connaiss', sj1: 'connaiss', pp: 'connu', ip: ['connais', 'connaissons', 'connaissez'], g: '3e groupe', note: 'Accent circonflexe sur le « i » devant « t » (il connaît, je connaîtrai).' },
    'paraître': { p: ['parais', 'parais', 'paraît', 'paraissons', 'paraissez', 'paraissent'], im: 'paraiss', fu: 'paraîtr', sj3: 'paraiss', sj1: 'paraiss', pp: 'paru', ip: ['parais', 'paraissons', 'paraissez'], g: '3e groupe', note: 'Accent circonflexe sur le « i » devant « t » (il paraît, je paraîtrai).' },
    'plaire': { p: ['plais', 'plais', 'plaît', 'plaisons', 'plaisez', 'plaisent'], im: 'plais', fu: 'plair', sj3: 'plais', sj1: 'plais', pp: 'plu', ip: ['plais', 'plaisons', 'plaisez'], g: '3e groupe' },
    'naître': { p: ['nais', 'nais', 'naît', 'naissons', 'naissez', 'naissent'], im: 'naiss', fu: 'naîtr', sj3: 'naiss', sj1: 'naiss', pp: 'né', aux: 'être', ip: ['nais', 'naissons', 'naissez'], g: '3e groupe' },
    'mourir': { p: ['meurs', 'meurs', 'meurt', 'mourons', 'mourez', 'meurent'], im: 'mour', fu: 'mourr', sj3: 'meur', sj1: 'mour', pp: 'mort', aux: 'être', ip: ['meurs', 'mourons', 'mourez'], g: '3e groupe' },
    'rire': { p: ['ris', 'ris', 'rit', 'rions', 'riez', 'rient'], im: 'ri', fu: 'rir', sj3: 'ri', sj1: 'ri', pp: 'ri', ip: ['ris', 'rions', 'riez'], g: '3e groupe' },
    'valoir': { p: ['vaux', 'vaux', 'vaut', 'valons', 'valez', 'valent'], im: 'val', fu: 'vaudr', sj3: 'vaill', sj1: 'val', pp: 'valu', g: '3e groupe', note: 'Impératif rare.' },
    'falloir': { imp: true, p: ['', '', 'faut', '', '', ''], im: 'fall', fu: 'faudr', sj: ['', '', 'faille', '', '', ''], pp: 'fallu', g: '3e groupe (verbe impersonnel : seulement « il »)' },
    'pleuvoir': { imp: true, p: ['', '', 'pleut', '', '', ''], im: 'pleuv', fu: 'pleuvr', sj: ['', '', 'pleuve', '', '', ''], pp: 'plu', g: '3e groupe (verbe impersonnel : seulement « il »)' }
  };
  // verbes en -tir / -mir : [radical du singulier, radical du pluriel]
  const TIR = { partir: ['par', 'part'], sortir: ['sor', 'sort'], dormir: ['dor', 'dorm'], servir: ['ser', 'serv'], sentir: ['sen', 'sent'], mentir: ['men', 'ment'] };
  // familles : base → liste de verbes construits par préfixe (même conjugaison)
  const FAM = {
    prendre: ['apprendre', 'comprendre', 'surprendre', 'reprendre', 'entreprendre'], venir: ['devenir', 'revenir', 'parvenir'],
    tenir: ['retenir', 'obtenir', 'maintenir', 'appartenir', 'soutenir', 'contenir'], mettre: ['permettre', 'promettre', 'remettre', 'admettre', 'soumettre', 'commettre', 'transmettre'],
    connaître: ['reconnaître'], paraître: ['apparaître', 'disparaître'], voir: ['revoir'], lire: ['relire', 'élire'], écrire: ['décrire', 'inscrire', 'réécrire'],
    recevoir: ['apercevoir', 'décevoir', 'concevoir'], suivre: ['poursuivre'], vivre: ['survivre'], courir: ['parcourir', 'secourir'], battre: ['combattre'], rire: ['sourire']
  };
  const ETRE = new Set(['aller', 'venir', 'devenir', 'revenir', 'parvenir', 'partir', 'arriver', 'entrer', 'rentrer', 'rester', 'tomber', 'retourner', 'monter', 'descendre', 'sortir', 'naître', 'mourir', 'repartir']);
  const ETRE_NOTE = { monter: 1, descendre: 1, sortir: 1, rentrer: 1, retourner: 1 };
  const KNOWN_2G = new Set(['finir', 'choisir', 'réussir', 'grandir', 'remplir', 'agir', 'réfléchir', 'obéir', 'punir', 'saisir', 'applaudir', 'bâtir', 'guérir', 'rougir', 'vieillir', 'ralentir', 'démolir', 'établir', 'fournir', 'nourrir', 'définir', 'réunir', 'unir', 'avertir', 'accomplir', 'atterrir', 'blanchir', 'embellir', 'enrichir', 'grossir', 'maigrir', 'mûrir', 'noircir', 'pâlir', 'rafraîchir', 'rajeunir', 'réagir', 'rétrécir', 'salir', 'bondir', 'franchir', 'garnir', 'gémir', 'jaillir', 'périr', 'polir', 'raccourcir', 'investir', 'divertir', 'subir', 'trahir', 'ravir', 'surgir', 'éblouir', 'engloutir', 'interagir']);
  const POPULAIRES = ['être', 'avoir', 'aller', 'faire', 'dire', 'pouvoir', 'vouloir', 'savoir', 'devoir', 'voir', 'venir', 'prendre', 'mettre', 'écrire', 'lire', 'manger', 'parler', 'aimer', 'commencer', 'finir', 'choisir', 'vendre', 'attendre', 'appeler', 'acheter', 'payer', 'préférer', 'se laver'];
  const COMMUNS = ['parler', 'aimer', 'manger', 'commencer', 'chanter', 'jouer', 'regarder', 'écouter', 'travailler', 'habiter', 'donner', 'trouver', 'penser', 'passer', 'demander', 'arriver', 'rester', 'tomber', 'entrer', 'marcher', 'danser', 'cuisiner', 'laver', 'préparer', 'oublier', 'étudier', 'copier', 'nager', 'voyager', 'placer', 'lancer', 'effacer', 'envoyer', 'nettoyer', 'payer', 'essayer', 'employer', 'appeler', 'jeter', 'acheter', 'lever', 'mener', 'peser', 'geler', 'préférer', 'espérer', 'répéter', 'célébrer', 'vendre', 'attendre', 'entendre', 'répondre', 'perdre', 'descendre', 'rendre', 'défendre', 'craindre', 'peindre', 'joindre', 'conduire', 'construire', 'traduire', 'ouvrir', 'offrir', 'couvrir', 'découvrir', 'souffrir', 'se laver', 'se lever', 'se promener', 'se souvenir', 'se réveiller', 's’habiller'];
  const EX2G_ESSAI = KNOWN_2G;

  // ── spécification d'un verbe → { p, im, fu, sj, pp, pa, ip, aux, g, notes } ; les formes en « stem+end » servent à colorer les terminaisons
  const END_IMP = ['ais', 'ais', 'ait', 'ions', 'iez', 'aient'], END_FUT = ['ai', 'as', 'a', 'ons', 'ez', 'ont'];
  const SJ_END = ['e', 'es', 'e', 'ions', 'iez', 'ent'];
  const spec = inf => {
    const notes = []; let s;
    if (IRR[inf]) s = Object.assign({}, IRR[inf]);
    else {
      for (const [base, fam] of Object.entries(FAM)) if (fam.includes(inf)) { const b = IRR[base], pre = inf.slice(0, inf.length - base.length); const P = x => pre + x; s = { p: b.p.map(P), im: P(b.im), fu: P(b.fu), pp: P(b.pp), ip: b.ip && b.ip.map(P), g: b.g, aux: ETRE.has(inf) ? 'être' : 'avoir' }; if (b.sj) s.sj = b.sj.map(P); else { s.sj3 = P(b.sj3); s.sj1 = P(b.sj1); } if (b.note) s.note = b.note; break; }
    }
    if (!s && TIR[inf]) { const [a, b] = TIR[inf]; s = { p: [a + 's', a + 's', a + 't', b + 'ons', b + 'ez', b + 'ent'], im: b, fu: inf, sj3: b, sj1: b, pp: inf.slice(0, -1), ip: [a + 's', b + 'ons', b + 'ez'], g: '3e groupe', aux: ETRE.has(inf) ? 'être' : 'avoir' }; }
    if (!s && /(couvr|ouvr|offr|souffr)ir$/.test(inf)) { const r = inf.slice(0, -2); s = { p: [r + 'e', r + 'es', r + 'e', r + 'ons', r + 'ez', r + 'ent'], im: r, fu: inf, sj3: r, sj1: r, pp: r + 'ert', ip: [r + 'e', r + 'ons', r + 'ez'], g: '3e groupe (se conjugue comme un verbe en -er au présent)' }; }
    if (!s && /uire$/.test(inf) && !/^(nuire|luire)$/.test(inf)) { const r = inf.slice(0, -2); s = { p: [r + 's', r + 's', r + 't', r + 'sons', r + 'sez', r + 'sent'], im: r + 's', fu: r + 'r', sj3: r + 's', sj1: r + 's', pp: r + 't', ip: [r + 's', r + 'sons', r + 'sez'], g: '3e groupe' }; }
    if (!s && /(a|e|o)indre$/.test(inf)) { const r = inf.slice(0, -3), pl = r.slice(0, -1) + 'gn'; s = { p: [r + 's', r + 's', r + 't', pl + 'ons', pl + 'ez', pl + 'ent'], im: pl, fu: inf.slice(0, -1), sj3: pl, sj1: pl, pp: r + 't', ip: [r + 's', pl + 'ons', pl + 'ez'], g: '3e groupe' }; if (/n$/.test(r)) { /* ok */ } }
    if (!s && /(en|on|er|or|ur|an)dre$/.test(inf)) { const r = inf.slice(0, -2); s = { p: [r + 's', r + 's', r, r + 'ons', r + 'ez', r + 'ent'], im: r, fu: inf.slice(0, -1), sj3: r, sj1: r, pp: r + 'u', ip: [r + 's', r + 'ons', r + 'ez'], g: '3e groupe (comme vendre)', aux: ETRE.has(inf) ? 'être' : 'avoir' }; }
    if (!s && /ir$/.test(inf) && inf.length > 3) { const r = inf.slice(0, -2); s = { p: [r + 'is', r + 'is', r + 'it', r + 'issons', r + 'issez', r + 'issent'], im: r + 'iss', fu: inf, sj3: r + 'iss', sj1: r + 'iss', pp: r + 'i', ip: [r + 'is', r + 'issons', r + 'issez'], g: '2e groupe (comme finir)' }; if (!EX2G_ESSAI.has(inf)) notes.push('Je suppose que ce verbe se conjugue comme « finir » (2e groupe : -issons). S’il est irrégulier, vérifie dans un dictionnaire de conjugaison.'); }
    if (!s && /er$/.test(inf) && inf.length > 3) {
      const r = inf.slice(0, -2); let mute = r, fut = r + 'er';
      if (/(oy|uy|ay)er$/.test(inf)) { mute = r.slice(0, -1) + 'i'; fut = mute + 'er'; if (/ayer$/.test(inf)) notes.push('Verbes en -ayer : on peut garder le « y » partout (je paye) ou le remplacer par « i » devant un « e » muet (je paie).'); else notes.push('Verbes en -oyer / -uyer : le « y » devient « i » devant un « e » muet (je nettoie, ils nettoient).'); if (/^(en|ren)voyer$/.test(inf)) { fut = inf.slice(0, -4) + 'err'; notes.push('Futur et conditionnel irréguliers : j’enverrai.'); } }
      else if (/e[lt]er$/.test(inf) && !/(?:é|è)[lt]er$/.test(inf)) {
        const EXC = /^(ach|rach|gel|congel|pel|model|martel|harcel|décel|croch|fur|halet|cel|ciseler|démantel)/; const stem = inf.slice(0, -2);
        if (/^(acheter|racheter|geler|congeler|peler|modeler|marteler|harceler|déceler|crocheter|fureter|haleter|celer|ciseler|démanteler)$/.test(inf)) { mute = r.slice(0, -2) + 'è' + r.slice(-1); fut = mute + 'er'; notes.push('Le « e » devient « è » devant une syllabe muette (j’achète, j’achèterai).'); }
        else { mute = r + r.slice(-1); fut = mute + 'er'; notes.push('La consonne se double devant un « e » muet (j’appelle, je jetterai).'); }
        void EXC; void stem;
      }
      else if (/e[^aeiouyàâäéèêëîïôöùûü]er$/.test(inf)) { mute = r.slice(0, -2) + 'è' + r.slice(-1); fut = mute + 'er'; notes.push('Le « e » devient « è » devant une syllabe muette (je lève, je lèverai).'); }
      else if (/é([^aeiouyàâäéèêëîïôöùûü]|[bcdfgpt][lr]|gu|gn)er$/.test(inf)) { mute = r.replace(/é([^é]*)$/, 'è$1'); notes.push('Le « é » devient « è » devant une syllabe muette au présent (je préfère), mais pas au futur (je préférerai).'); }
      if (/cer$/.test(inf)) notes.push('Verbes en -cer : « c » devient « ç » devant a, o (nous commençons, je commençais).');
      if (/ger$/.test(inf)) notes.push('Verbes en -ger : on ajoute un « e » devant a, o (nous mangeons, je mangeais).');
      const adj = (st, e) => { if (/^[aou]/.test(e)) { if (/cer$/.test(inf) && /c$/.test(st)) return st.slice(0, -1) + 'ç'; if (/ger$/.test(inf)) return st + 'e'; } return st; };
      const nous = adj(r, 'o');
      s = { p: [mute + 'e', mute + 'es', mute + 'e', nous + 'ons', r + 'ez', mute + 'ent'], im: r, fu: fut, sj3: mute, sj1: r, pp: r + 'é', ip: [mute + 'e', nous + 'ons', r + 'ez'], g: '1er groupe', pa: adj(r, 'a') + 'ant', _adj: adj, _er: true };
    }
    if (s) { s.aux = s.aux || (ETRE.has(inf) ? 'être' : 'avoir'); if (ETRE_NOTE[inf]) notes.push('Avec un complément d’objet direct, on utilise « avoir » (j’ai monté la valise).'); if (s.note) notes.push(s.note); }
    return s ? Object.assign(s, { notes }) : null;
  };

  // ── mise en forme : pronom (avec élision j', m', t', s') + forme ──
  const REFL = ['me', 'te', 'se', 'nous', 'vous', 'se'];
  const vowelInit = (f, inf) => V.test(f) || (/^h/i.test(f) && !ASP_H.has(inf));
  // pronom affiché avant `first` (premier mot de la forme) ; subj = « que… »
  const pronOf = (i, first, inf, refl, subj) => {
    const vow = vowelInit(first, inf);
    let sub;
    if (subj) sub = [vow ? 'que j’' : 'que je', 'que tu', 'qu’il / elle / on', 'que nous', 'que vous', 'qu’ils / elles'][i];
    else sub = [vow ? 'j’' : 'je', 'tu', 'il / elle / on', 'nous', 'vous', 'ils / elles'][i];
    if (refl) {
      const r = REFL[i]; const rv = vow || (r === 'nous' || r === 'vous');
      if (i === 0 || i === 1 || i === 2 || i === 5) {
        // « je me lave » / « je m’habille » : le pronom « je » ne s’élide pas devant « m’ »
        const base = subj ? ['que je', 'que tu', 'qu’il / elle / on', '', '', 'qu’ils / elles'][i] : ['je', 'tu', 'il / elle / on', '', '', 'ils / elles'][i];
        return vow ? base + ' ' + r[0] + '’' : base + ' ' + r + ' ';
      }
      void rv; return (subj ? ['', '', '', 'que nous nous ', 'que vous vous ', ''][i] : ['', '', '', 'nous nous ', 'vous vous ', ''][i]);
    }
    return sub + (sub.endsWith('’') ? '' : ' ');
  };
  const addAgree = (pp, i, aux) => { if (aux !== 'être') return pp; return i === 3 ? pp + '(e)s' : i === 4 ? pp + '(e)(s)' : i === 5 ? pp + '(e)s' : pp + '(e)'; };

  const conjugate = raw => {
    let word = String(raw || '').trim().toLowerCase().replace(/’/g, "'").replace(/\s+/g, ' ');
    if (!word) return { err: 'Écris un verbe à l’infinitif (par exemple : manger).' };
    let refl = false; const m = word.match(/^(?:se |s')\s*(.+)$/); if (m) { refl = true; word = m[1].trim(); }
    if (/\s/.test(word)) return { err: 'Un seul verbe à la fois, à l’infinitif (par exemple : « se laver » ou « manger »).' };
    if (!/^[a-zàâäéèêëîïôöùûüœæç-]+$/.test(word)) return { err: 'Je ne reconnais pas ce mot : écris seulement des lettres.' };
    const sp = spec(word);
    if (!sp) return { err: `Je ne sais pas conjuguer « ${word} ». Il me faut un infinitif en -er, -ir ou -re ; certains verbes très rares ne sont pas inclus.`, suggest: suggest(word) };
    const aux = refl ? 'être' : sp.aux, A = aux === 'être' ? IRR['être'] : IRR['avoir'];
    const only3 = !!sp.imp;
    const adjAt = e => sp._adj ? sp._adj(sp.im, e) : sp.im;
    const F = (f, e) => ({ f, e: e || '', s: e ? f.slice(0, f.length - e.length) : f });
    const simple = {};
    let pe = null; // terminaisons connues du présent (pour colorer)
    if (sp._er) pe = ['e', 'es', 'e', 'ons', 'ez', 'ent'];
    else if (/2e groupe/.test(sp.g || '')) pe = ['s', 's', 't', 'ssons', 'ssez', 'ssent'];
    else if (/comme vendre/.test(sp.g || '')) pe = ['s', 's', '', 'ons', 'ez', 'ent'];
    simple.pres = sp.p.map((f, i) => F(f, pe ? pe[i] : ''));
    simple.imparfait = END_IMP.map(e => { const st = adjAt(e); return { f: st + e, e, s: st }; });
    simple.futur = END_FUT.map(e => ({ f: sp.fu + e, e, s: sp.fu }));
    simple.cond = END_IMP.map(e => ({ f: sp.fu + e, e, s: sp.fu }));
    simple.subj = sp.sj ? sp.sj.map(f => F(f)) : SJ_END.map((e, i) => { const st = (i === 3 || i === 4) ? sp.sj1 : sp.sj3; return { f: st + e, e, s: st }; });
    const auxS = { pres: A.p.map(f => F(f)), imparfait: END_IMP.map(e => ({ f: A.im + e, e, s: A.im })), futur: END_FUT.map(e => ({ f: A.fu + e, e, s: A.fu })), cond: END_IMP.map(e => ({ f: A.fu + e, e, s: A.fu })), subj: A.sj.map(f => F(f)) };
    const rowsSimple = (arr, subj) => arr.map((x, i) => (only3 && i !== 2) || !x.f ? { pron: '', form: '—', empty: true } : { pron: only3 ? (subj ? 'qu’il ' : 'il ') : pronOf(i, x.f, word, refl, subj), form: x.f, s: x.s, e: x.e });
    const rowsComp = (t, subj) => auxS[t].map((x, i) => (only3 && i !== 2) ? { pron: '', form: '—', empty: true } : { pron: only3 ? (subj ? 'qu’il ' : 'il ') : pronOf(i, x.f, aux === 'être' ? 'être' : 'avoir', refl, subj), form: x.f + ' ' + addAgree(sp.pp, i, aux), s: '', e: '' });
    const out = { inf: word, refl, aux, g: sp.g, notes: sp.notes || [], pp: sp.pp, pa: only3 ? '' : (sp.pa || (sp.im ? adjAt('a') + 'ant' : '')), only3, tenses: [] };
    const T = (mood, name, rows) => out.tenses.push({ mood, name, rows });
    T('Indicatif', 'Présent', rowsSimple(simple.pres));
    T('Indicatif', 'Passé composé', rowsComp('pres'));
    T('Indicatif', 'Imparfait', rowsSimple(simple.imparfait));
    T('Indicatif', 'Plus-que-parfait', rowsComp('imparfait'));
    T('Indicatif', 'Futur simple', rowsSimple(simple.futur));
    T('Indicatif', 'Futur antérieur', rowsComp('futur'));
    T('Conditionnel', 'Conditionnel présent', rowsSimple(simple.cond));
    T('Conditionnel', 'Conditionnel passé', rowsComp('cond'));
    T('Subjonctif', 'Subjonctif présent', rowsSimple(simple.subj, true));
    T('Subjonctif', 'Subjonctif passé', rowsComp('subj', true));
    if (sp.ip && !only3) T('Impératif', 'Impératif présent', sp.ip.map((f, k) => ({ pron: '', form: refl ? f + '-' + ['toi', 'nous', 'vous'][k] : f, s: '', e: '', imp: ['(tu)', '(nous)', '(vous)'][k] })));
    else T('Impératif', 'Impératif présent', []);
    return out;
  };
  const suggest = w => { const all = [...Object.keys(IRR), ...Object.values(FAM).flat(), ...Object.keys(TIR), ...COMMUNS.filter(x => !x.startsWith('se ') && !x.startsWith('s’')), ...KNOWN_2G]; return all.map(v => [Sub.lev(noAcc(w), noAcc(v)), v]).sort((a, b) => a[0] - b[0]).slice(0, 4).filter(x => x[0] <= 3).map(x => x[1]); };
  return { conjugate, spec, PERS, POPULAIRES, COMMUNS, IRR, FAM, TIR, KNOWN_2G, noAcc, all: () => [...new Set([...Object.keys(IRR), ...Object.values(FAM).flat(), ...Object.keys(TIR), ...KNOWN_2G, ...COMMUNS.filter(x => !/^s[e’' ]/.test(x))])].sort((a, b) => a.localeCompare(b, 'fr')) };
})();


// ───────────────────────── interface ─────────────────────────
(() => {
  const ESSENTIELS = ['Présent', 'Passé composé', 'Imparfait', 'Futur simple', 'Conditionnel présent', 'Subjonctif présent', 'Impératif présent'];
  const render = el => {
    el.append(h('h1', null, '🔠 Conjugueur'), h('p', { class: 'muted' }, 'Tape un verbe à l’infinitif (manger, finir, aller, se laver…) : tous les temps s’affichent, avec les terminaisons en couleur. Tout est calculé ici, rien n’est envoyé sur internet.'));
    Sub.tabs(el, [['Conjuguer', tabConj], ['S’entraîner', tabTrain], ['Mémo : les règles', tabMemo]]);
  };

  function tabConj(box) {
    const out = h('div', { 'aria-live': 'polite' });
    const dl = h('datalist', { id: 'cjList' }, Conj.all().map(v => h('option', { value: v })));
    const inp = h('input', { type: 'text', list: 'cjList', id: 'cjIn', placeholder: 'ex. manger, finir, aller, se laver…', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false', style: 'max-width:22rem', 'aria-label': 'Verbe à conjuguer' });
    let all = Store.get('conj.all', false), color = Store.get('conj.color', true);
    const go = v => { inp.value = v; show(); };
    const show = () => {
      const r = Conj.conjugate(inp.value); out.replaceChildren();
      if (r.err) { out.append(Sub.notice('warn', r.err)); if (r.suggest && r.suggest.length) out.append(h('p', null, 'Tu voulais peut-être : ', r.suggest.map(v => h('button', { class: 'btn sec small', style: 'margin:.15rem', onclick: () => go(v) }, v)))); return; }
      Store.set('conj.last', inp.value.trim());
      const lab = (r.refl ? 'se ' : '') + r.inf;
      const head = h('div', { class: 'card' }, h('h2', { style: 'margin:0 0 .3rem' }, lab), h('p', { style: 'margin:.2rem 0' }, h('span', { class: 'badge' }, r.g), ' ', h('span', { class: 'badge' }, 'auxiliaire : ' + r.aux), ' ', h('span', { class: 'badge' }, 'participe passé : ' + r.pp), r.pa ? [' ', h('span', { class: 'badge' }, 'participe présent : ' + r.pa)] : null), ...(r.notes || []).map(n => h('p', { class: 'muted', style: 'margin:.25rem 0' }, '💡 ' + n)), h('div', { class: 'row' }, Sub.speakBtn(() => lab + '. ' + r.tenses.find(t => t.name === 'Présent').rows.filter(x => !x.empty).map(x => x.pron + x.form).join('. '), '🔊 Écouter le présent')));
      out.append(head);
      const list = r.tenses.filter(t => all || ESSENTIELS.includes(t.name));
      const grid = h('div', { class: 'grid g3' });
      list.forEach(t => {
        const card = h('div', { class: 'card cj-tense', style: 'margin:0' }, h('h3', { style: 'margin:.1rem 0 .2rem' }, t.name), h('div', { class: 'muted', style: 'font-size:.8em;margin-bottom:.3rem' }, t.mood));
        if (!t.rows.length) card.append(h('p', { class: 'muted' }, 'Pas d’impératif pour ce verbe (ou rarement utilisé).'));
        else { const tb = h('table', { class: 'cj-t' }); t.rows.forEach(x => tb.append(h('tr', null, h('td', { class: 'cj-p' }, x.imp || x.pron.trim()), h('td', null, x.empty ? '—' : (color && x.e ? [x.s, h('span', { class: 'cj-end' }, x.e)] : x.form)))));
          // formes composées / sans terminaison colorée : texte complet
          if (color) { /* la coloration n'est faite que si on connaît la partie variable */ }
          card.append(tb, h('div', { class: 'row', style: 'margin-top:.3rem' }, Sub.speakBtn(() => t.rows.filter(x => !x.empty).map(x => (x.imp ? '' : x.pron) + x.form).join('. '), '🔊'), h('button', { class: 'btn sec small', 'aria-label': 'Copier ' + t.name, onclick: () => App.copy(t.rows.filter(x => !x.empty).map(x => (x.imp ? '' : x.pron) + x.form).join('\n')) }, '📋'))); }
        grid.append(card);
      });
      out.append(grid, h('p', { class: 'muted', style: 'margin-top:.6rem' }, 'Passé simple non inclus. Pour un verbe rare ou un cas particulier, vérifie aussi dans un dictionnaire de conjugaison (ex. le Bescherelle).'));
    };
    const chips = h('p', null, h('span', { class: 'muted' }, 'Verbes fréquents : '), Conj.POPULAIRES.map(v => h('button', { class: 'btn sec small', style: 'margin:.15rem', onclick: () => go(v) }, v)));
    box.append(h('div', { class: 'row', style: 'align-items:center' }, inp, h('button', { class: 'btn', onclick: show }, 'Conjuguer'), dl, h('label', { class: 'chk', style: 'margin:0' }, h('input', { type: 'checkbox', checked: all, onchange: ev => { all = ev.target.checked; Store.set('conj.all', all); show(); } }), 'Tous les temps'), h('label', { class: 'chk', style: 'margin:0' }, h('input', { type: 'checkbox', checked: color, onchange: ev => { color = ev.target.checked; Store.set('conj.color', color); show(); } }), 'Terminaisons en couleur')), chips, out);
    inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); show(); } });
    const last = Store.get('conj.last', ''); if (last) { inp.value = last; show(); } else { inp.value = 'manger'; show(); }
  }

  function tabTrain(box) {
    const TENSES = ['Présent', 'Imparfait', 'Futur simple', 'Passé composé', 'Conditionnel présent', 'Subjonctif présent'];
    const HINT = { 'Présent': 'Regarde la terminaison : -e, -es, -e, -ons, -ez, -ent pour les verbes en -er ; -s, -s, -t pour beaucoup d’autres.', 'Imparfait': 'Prends « nous » au présent, enlève -ons, ajoute -ais, -ais, -ait, -ions, -iez, -aient.', 'Futur simple': 'Infinitif (ou radical du futur) + -ai, -as, -a, -ons, -ez, -ont. Le « r » se entend toujours.', 'Passé composé': 'Auxiliaire (avoir ou être) au présent + participe passé.', 'Conditionnel présent': 'Radical du futur + -ais, -ais, -ait, -ions, -iez, -aient.', 'Subjonctif présent': 'Pars de « ils » au présent, enlève -ent, ajoute -e, -es, -e, -ions, -iez, -ent (beaucoup d’exceptions : être, avoir, aller, faire…).' };
    const POOLS = { freq: ['être', 'avoir', 'aller', 'faire', 'dire', 'pouvoir', 'vouloir', 'savoir', 'devoir', 'voir', 'venir', 'prendre', 'mettre', 'finir', 'manger', 'parler'], er: ['parler', 'aimer', 'manger', 'commencer', 'jouer', 'regarder', 'nager', 'placer', 'payer', 'nettoyer', 'appeler', 'acheter', 'préférer', 'étudier', 'lancer', 'voyager'], irr: ['être', 'avoir', 'aller', 'faire', 'dire', 'pouvoir', 'vouloir', 'savoir', 'devoir', 'voir', 'venir', 'tenir', 'prendre', 'mettre', 'lire', 'écrire', 'boire', 'croire', 'recevoir', 'vivre', 'suivre', 'connaître', 'ouvrir', 'partir', 'courir'] };
    const cfg = Object.assign({ pool: 'freq', n: 10, tenses: ['Présent', 'Imparfait', 'Futur simple'] }, Store.get('conj.cfg', {}));
    const area = h('div');
    const strip = s => String(s).toLowerCase().replace(/’/g, "'").replace(/\(e\)\(s\)|\(e\)s|\(e\)/g, '').replace(/\s+/g, ' ').trim();
    const check = (u, row, auxEtre) => {
      const exp = strip(row.pron + row.form), expF = strip(row.form); let a = strip(u).replace(/\s*\/\s*/g, ' / ');
      const eq = x => x === exp || x === expF || x === exp.replace(/ \/ [a-z ]+ \/ /, ' ') || x.replace(/^(que |qu')/, '') === expF;
      const cand = [a, a.replace(/^(que |qu')?(j'|je|tu|il|elle|on|nous|vous|ils|elles) ?/, '')];
      const ok = cand.some(c => c === expF || c === exp || c === strip(row.pron.replace(/ \/ .*$/, ' ') + row.form));
      if (ok) return 2;
      if (auxEtre) { const tk = cand[1].split(' '); const last = tk.pop(); for (const suf of ['es', 's', 'e']) if (last.endsWith(suf) && (tk.concat([last.slice(0, -suf.length)]).join(' ') === expF)) return 2; }
      void eq; if (cand.some(c => Conj.noAcc(c) === Conj.noAcc(expF))) return 1; return 0;
    };
    const start = () => {
      Store.set('conj.cfg', cfg);
      const verbs = POOLS[cfg.pool]; const items = [];
      for (let k = 0; k < cfg.n; k++) {
        for (let tries = 0; tries < 30; tries++) {
          const v = verbs[Sub.rnd(0, verbs.length - 1)], t = cfg.tenses[Sub.rnd(0, cfg.tenses.length - 1)], i = Sub.rnd(0, 5), r = Conj.conjugate(v);
          const T = r.tenses.find(x => x.name === t); if (!T || !T.rows[i] || T.rows[i].empty) continue; if (items.some(q => q.v === v && q.t === t && q.i === i)) continue;
          items.push({ v, t, i, row: T.rows[i], aux: r.aux }); break;
        }
      }
      let pos = 0, score = 0; const miss = [];
      const ask = () => {
        area.replaceChildren();
        if (pos >= items.length) { area.append(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, `Résultat : ${score} / ${items.length}`), h('p', null, score === items.length ? '🎉 Sans faute !' : score >= items.length * .7 ? '👍 Très bien. Regarde les formes à retravailler :' : '💪 Continue : tu progresses en t’entraînant. Formes à retravailler :'), miss.length ? h('table', { class: 't' }, h('tr', null, h('th', null, 'Verbe'), h('th', null, 'Temps'), h('th', null, 'Ta réponse'), h('th', null, 'Correction')), miss.map(m => h('tr', null, h('td', null, m.v), h('td', null, m.t), h('td', null, m.u || '—'), h('td', null, h('b', null, m.good))))) : null, h('button', { class: 'btn', onclick: start }, '↻ Nouvelle série'), ' ', h('button', { class: 'btn sec', onclick: render2 }, 'Changer les réglages'))); return; }
        const q = items[pos]; const inp = h('input', { type: 'text', autocomplete: 'off', autocapitalize: 'none', spellcheck: 'false', 'aria-label': 'Ta réponse', style: 'max-width:20rem;font-size:1.2rem' }); const fb = h('div', { role: 'status', 'aria-live': 'polite' }); let done = false;
        const pron = q.row.pron.trim() || ['', '', '', '', '', ''][0];
        const finish = (res, shown) => { if (done) return; done = true; if (res === 2) { score++; Sub.logEx('Conjugaison', true); fb.replaceChildren(Sub.notice('ok', '✅ Bravo ! ' + pron + ' ' + q.row.form)); } else { Sub.logEx('Conjugaison', false); miss.push({ v: q.v, t: q.t, u: inp.value.trim(), good: pron + ' ' + q.row.form }); fb.replaceChildren(Sub.notice('warn', (res === 1 ? '🟡 Presque : attention aux accents. ' : shown ? '' : '❌ Pas tout à fait. ') + 'Correction : ', h('b', null, pron + ' ' + q.row.form), h('br'), '💡 ' + HINT[q.t])); } nxt.hidden = false; nxt.focus(); btn.disabled = true; };
        const btn = h('button', { class: 'btn', onclick: () => { if (!inp.value.trim()) { App.toast('Écris ta réponse (ou touche « Voir la réponse »).'); return; } finish(check(inp.value, q.row, q.aux === 'être'), false); } }, 'Vérifier');
        const nxt = h('button', { class: 'btn', hidden: true, onclick: () => { pos++; ask(); } }, pos + 1 >= items.length ? 'Voir mon résultat' : 'Question suivante ➜');
        inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); if (done) nxt.click(); else btn.click(); } });
        area.append(h('div', { class: 'card' }, h('p', { class: 'muted', style: 'margin:0' }, `Question ${pos + 1} sur ${items.length}`), h('p', { style: 'font-size:1.3rem;margin:.4rem 0' }, 'Conjugue ', h('b', null, q.v), ' au ', h('b', null, q.t.toLowerCase()), ', à la personne ', h('b', null, q.row.pron.trim() || ''), ' :'), h('div', { class: 'row', style: 'align-items:center' }, h('span', { style: 'font-size:1.2rem' }, q.row.pron.trim()), inp, btn, h('button', { class: 'btn sec', onclick: () => finish(0, true) }, 'Voir la réponse')), fb, nxt));
        inp.focus();
      };
      ask();
    };
    const render2 = () => {
      area.replaceChildren(h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Réglages'), h('p', { class: 'muted' }, 'Écris seulement le verbe conjugué (tu peux aussi écrire le pronom). Réponse « presque » si seul un accent manque.'),
        h('div', { class: 'row' }, h('label', { for: 'cjPool', style: 'margin:0' }, 'Verbes'), h('select', { id: 'cjPool', onchange: ev => { cfg.pool = ev.target.value; } }, [['freq', 'Les plus fréquents'], ['er', 'Verbes en -er (avec leurs pièges)'], ['irr', 'Verbes irréguliers']].map(([v, l]) => h('option', { value: v, selected: cfg.pool === v }, l))), h('label', { for: 'cjN', style: 'margin:0' }, 'Questions'), h('select', { id: 'cjN', onchange: ev => { cfg.n = +ev.target.value; } }, [5, 10, 15, 20].map(n => h('option', { value: n, selected: cfg.n === n }, n)))),
        h('fieldset', { style: 'border:0;padding:0;margin:.6rem 0' }, h('legend', { class: 'muted' }, 'Temps'), h('div', { class: 'row' }, TENSES.map(t => h('label', { class: 'chk', style: 'margin:0' }, h('input', { type: 'checkbox', checked: cfg.tenses.includes(t), onchange: ev => { cfg.tenses = ev.target.checked ? [...new Set([...cfg.tenses, t])] : cfg.tenses.filter(x => x !== t); } }), t)))),
        h('button', { class: 'btn', onclick: () => { if (!cfg.tenses.length) { App.toast('Choisis au moins un temps.'); return; } start(); } }, '▶ Commencer')));
    };
    box.append(area); render2();
  }

  function tabMemo(box) {
    const T = (head, rows) => h('table', { class: 't' }, h('tr', null, head.map(x => h('th', null, x))), rows.map(r => h('tr', null, r.map(c => h('td', null, c)))));
    box.append(
      h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Les trois groupes'), T(['Groupe', 'Infinitif', 'Exemples', 'À retenir'], [['1er', '-er', 'parler, manger, jouer', 'Le plus nombreux. Exception : aller (3e groupe).'], ['2e', '-ir avec « -issons »', 'finir, choisir, grandir', 'Au présent « nous finissons ».'], ['3e', 'les autres', 'prendre, venir, faire, vendre, ouvrir…', 'Souvent irréguliers : il faut les apprendre.']])),
      h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Les terminaisons à connaître'), T(['Temps', 'Terminaisons (je, tu, il, nous, vous, ils)', 'Astuce'], [['Imparfait', '-ais, -ais, -ait, -ions, -iez, -aient', '« nous » du présent − -ons'], ['Futur simple', '-ai, -as, -a, -ons, -ez, -ont', 'infinitif + terminaison'], ['Conditionnel présent', '-ais, -ais, -ait, -ions, -iez, -aient', 'radical du futur + terminaisons de l’imparfait'], ['Présent (1er groupe)', '-e, -es, -e, -ons, -ez, -ent', 'pas de « s » à « je » ni à « il »'], ['Subjonctif présent', '-e, -es, -e, -ions, -iez, -ent', 'souvent « ils » du présent − -ent']])),
      h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Passé composé : avoir ou être ?'), h('ul', null, h('li', null, 'Presque tous les verbes utilisent ', h('b', null, 'avoir'), ' : j’ai mangé.'), h('li', null, 'Quelques verbes de déplacement ou de changement utilisent ', h('b', null, 'être'), ' : aller, venir, partir, arriver, entrer, sortir, rester, tomber, naître, mourir, monter, descendre, retourner et leurs dérivés (devenir, revenir…). Le participe s’accorde alors avec le sujet : elle est allée, ils sont partis.'), h('li', null, 'Les verbes pronominaux (se laver) utilisent toujours ', h('b', null, 'être'), ' : elle s’est lavée.'), h('li', null, 'Avec avoir, le participe s’accorde seulement avec le complément d’objet direct placé avant : les pommes que j’ai mangées.'))),
      h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Les pièges des verbes en -er'), T(['Verbe', 'Piège', 'Exemple'], [['commencer', 'c → ç devant a, o', 'nous commençons, je commençais'], ['manger', '+ e devant a, o', 'nous mangeons, je mangeais'], ['nettoyer', 'y → i devant e muet', 'je nettoie, il nettoiera'], ['appeler, jeter', 'consonne doublée devant e muet', 'j’appelle, je jetterai'], ['acheter, lever', 'e → è devant e muet', 'j’achète, je lèverai'], ['préférer', 'é → è au présent (pas au futur)', 'je préfère, je préférerai'], ['étudier', 'deux « i » à l’imparfait', 'nous étudiions']])),
      Sub.notice('', 'Ce conjugueur applique des règles et une liste de verbes irréguliers fréquents ; il ne remplace pas un dictionnaire de conjugaison pour les verbes rares.')
    );
  }
  App.reg({ id: 'conjugueur', title: 'Conjugueur', group: 'entrainer', icon: '🔠', learn: true, render });
})();
