// Dictionnaire : (1) chercher un mot dans le Wiktionnaire (en ligne, uniquement si tu l'autorises), (2) mots nouveaux des dictionnaires 2026 et 2027 cités par la presse,
// (3) mots qui se ressemblent (hors ligne, avec petit jeu). Rien n'est envoyé sur internet tant que la recherche en ligne n'est pas activée.
const Dico = (() => {
  const API = 'https://fr.wiktionary.org/w/api.php';
  const online = () => Store.get('dico.online', false) === true;
  const enc = encodeURIComponent;
  const LINKS = w => [['Wiktionnaire', 'https://fr.wiktionary.org/wiki/' + enc(w)], ['Larousse', 'https://www.larousse.fr/dictionnaires/francais/' + enc(w)], ['Le Robert', 'https://dictionnaire.lerobert.com/definition/' + enc(w)], ['CNRTL (TLFi)', 'https://www.cnrtl.fr/definition/' + enc(w)], ['Académie française (colle le mot)', 'https://www.dictionnaire-academie.fr/']];
  // ---------- lecture du wikitexte du Wiktionnaire : on ne garde que les définitions de la section « français »
  const LABELS = { nom: 'Nom commun', 'nom propre': 'Nom propre', verbe: 'Verbe', adjectif: 'Adjectif', adverbe: 'Adverbe', pronom: 'Pronom', 'préposition': 'Préposition', conjonction: 'Conjonction', interjection: 'Interjection' };
  const SKIP = new Set(['étymologie', 'prononciation', 'traductions', 'anagrammes', 'références', 'voir aussi', 'homophones', 'dérivés', 'synonymes', 'antonymes', 'hyperonymes', 'hyponymes', 'méronymes', 'holonymes', 'vocabulaire', 'citations', 'notes', 'paronymes', 'apparentés', 'proverbes', 'variantes', 'attestations', 'cf', 'taux de reconnaissance', 'transcriptions', 'drapeau', 'faux-amis', 'quasi-synonymes', 'abréviations', 'variantes orthographiques', 'composés', 'expressions', 'phrases', 'gentilés', 'dérivés autres langues', 'forme de nom', 'forme de verbe', 'forme d’adjectif']);
  const tpl = inner => { const p = inner.split('|').map(x => x.trim()), n = (p[0] || '').toLowerCase();
    if (n === 'lien') return p[1] || ''; if (n === 'w') return p.filter(x => !/^lang=/.test(x))[2] || p[1] || '';
    if (n === 'lexique' || n === 'term') return p[1] ? '(' + p[1] + ')' : ''; if (p.length === 2 && p[1] === 'fr' && /^[a-zéèêàâôûîçï \-]+$/i.test(n)) return '(' + n + ')'; return ''; };
  const clean = t => { let s = t, last = ''; for (let i = 0; i < 5 && s !== last; i++) { last = s; s = s.replace(/\{\{([^{}]*)\}\}/g, (m, inner) => tpl(inner)); }
    return s.replace(/\[\[(?:Catégorie|Category|Fichier|File):[^\]]*\]\]/gi, '').replace(/\[\[([^\]|]*)\|([^\]]*)\]\]/g, '$2').replace(/\[\[([^\]]*)\]\]/g, '$1').replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '').replace(/<[^>]+>/g, '').replace(/'{2,}/g, '').replace(/\{\{|\}\}/g, '').replace(/\s+/g, ' ').replace(/\(\s*\)/g, '').trim(); };
  const parse = wt => { const m = /^==\s*\{\{langue\|fr\}\}\s*==\s*$/m.exec(wt || ''); if (!m) return []; let body = wt.slice(m.index + m[0].length); const nx = body.search(/^==\s*\{\{langue\|/m); if (nx >= 0) body = body.slice(0, nx);
    const out = []; let cur = null;
    for (const raw of body.split('\n')) { const hm = /^={3,}\s*\{\{S\|([^|}]+)([^}]*)\}\}\s*=+\s*$/.exec(raw);
      if (hm) { const k = hm[1].trim().toLowerCase(); cur = SKIP.has(k) ? null : { type: LABELS[k] || k.charAt(0).toUpperCase() + k.slice(1), flex: /flexion/.test(hm[2]), defs: [] }; if (cur) out.push(cur); continue; }
      if (/^={2,}[^=]/.test(raw)) { cur = null; continue; }
      if (cur && /^#(?![*:#])/.test(raw)) { const d = clean(raw.replace(/^#\s*/, '')); if (d) cur.defs.push(d); } }
    return out.filter(x => x.defs.length); };
  const api = async params => { const r = await fetch(API + '?' + new URLSearchParams(Object.assign({ format: 'json', origin: '*' }, params))); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); };
  const suggest = async q => { const j = await api({ action: 'opensearch', search: q, limit: 12, namespace: 0 }); return Array.isArray(j) && Array.isArray(j[1]) ? j[1] : []; };
  const define = async w => { const j = await api({ action: 'parse', page: w, prop: 'wikitext', redirects: 1 }); if (j.error) return { title: w, missing: true, sections: [] }; const wt = j.parse && j.parse.wikitext ? (typeof j.parse.wikitext === 'string' ? j.parse.wikitext : j.parse.wikitext['*'] || '') : ''; return { title: (j.parse && j.parse.title) || w, missing: false, sections: parse(wt) }; };
  const norm = t => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  // ---------- mots nouveaux (d'après la presse ; pas la liste complète : environ 150 mots nouveaux par dictionnaire et par an)
  const SRC = {
    s1: ['Noovo, 12 mai 2026', 'https://www.noovo.info/nouvelles/societe/article/voici-les-nouveaux-mots-qui-sajoutent-dans-le-petit-robert-et-le-petit-larousse-2027/'],
    s2: ['Journal du Geek, 5 mai 2026', 'https://www.journaldugeek.com/2026/05/05/crush-vocal-dinguerie-soumission-chimique-les-nouveaux-mots-du-dico-sont-la/'],
    s3: ['Narcity, 21 mai 2026', 'https://www.narcity.com/fr/nouveaux-mots-dictionnaire-petit-larousse-2027'],
    s4: ['Livres Hebdo, mai 2025', 'https://www.livreshebdo.fr/article/150-nouveaux-mots-integrent-le-petit-larousse-illustre-2026']
  };
  const PL27 = 'Petit Larousse 2027', PR27 = 'Petit Robert 2027', PL26 = 'Petit Larousse 2026';
  const NEW = [
    ['assertivité', PL27, 'aptitude à défendre ses positions tout en tenant compte des autres', 's1'], ['bouiner', PR27, 'perdre son temps à des activités sans grande importance', 's1'], ['charo', PR27, 'séducteur qui enchaîne les relations amoureuses passagères', 's1'],
    ['crush', PL27, 'béguin soudain pour une personne, ou emballement pour une chose', 's1'], ['dinguerie', PL27, 'chose extravagante ou incroyable, en bien ou en mal ; surtout employé par les moins de 30 ans, selon l’article', 's2'], ['instavidéaste', PR27, 'personne qui diffuse des vidéos en direct sur internet, souvent en échange avec son public', 's1'],
    ['marrainer', PR27, 'apporter un soutien moral à un projet ou à une cause, comme une marraine', 's1'], ['onigiri', PR27, 'mot japonais : boule de riz assaisonnée, enveloppée d’une feuille d’algue nori', 's1'], ['pistole', PL27, 'disque ou plaquette de chocolat aplati, rond ou ovale, utilisé en pâtisserie', 's1'],
    ['prompter', PL27, 'transmettre une consigne à une IA générative pour obtenir une réponse précise', 's1'], ['vocal', PL27, 'message audio envoyé sur WhatsApp ou iMessage, quand on ne veut pas écrire', 's2'], ['créateur de contenu', PL27, 'personne qui produit des contenus pour une communauté en ligne (à distinguer d’un influenceur)', 's2'],
    ['neuroatypique', PL27, 'se dit d’une personne dont le fonctionnement neurologique diffère de la norme : par exemple TDAH, troubles « dys » ou autisme', 's2'], ['neurodivergent', PL27, 'même définition que neuroatypique, selon l’article', 's2'], ['polarisation', PL27, 'fragmentation de la société en blocs opposés', 's2'],
    ['polycrise', PL27, 'accumulation de crises qui dépendent les unes des autres, au même moment', 's2'], ['réduflation', PL27 + ' (Québec)', 'stratégie commerciale qui réduit la quantité d’un produit sans baisser son prix : une inflation cachée', 's3'], ['claque', PL27 + ' (Québec)', 'sport collectif qui mêle sauts, figures acrobatiques, gymnastique et pas de danse sur une musique rythmée (équivalent du cheerleading)', 's3'],
    ['bouquetière', PL27 + ' (Québec)', 'au mariage, enfant du cortège qui porte un panier de pétales ou un bouquet devant la mariée', 's3'],
    ...['neurotypique', 'surtourisme', 'boomer', 'hypertrucage', 'infopreneur', 'sport assis', 'goalball', 'boucle à induction magnétique', 'bibimbap', 'chakchouka', 'edamame', 'tataki', 'chéri-coco', 'dodine', 'ziboulateur'].map(w => [w, PL27, '', 's3']),
    ...['écocitoyen', 'commerce équitable', 'écoquartier', 'véloroute', 'covoiturer', 'biopesticide', 'bombe climatique', 'lâcher-prise', 'zénitude', 'flexitarisme', 'padel', 'glamping', 'dramédie', 'banh bao', 'nachos', 'perles du Japon', 'cécifoot', 'boccia', 'paralympienne', 'bader', 'bordélisation', 'K-Drama', 'onigiri', 'ombrée', 'prée', 'karakou', 'dialogueur'].map(w => [w, PL26, '', 's4']),
    ['larme de sirène', PL26, 'granulés plastiques industriels', 's4']
  ];

  // ---------- mots qui se ressemblent : [mots, [[mot, repère pour choisir, exemple]], [[phrase à trous, bonne réponse, choix]]]
  const SIM = [
    ['a / à', [['a', 'verbe avoir : on peut dire « avait »', 'Il a un chat.'], ['à', 'préposition : « avait » ne marche pas', 'Je vais à Nîmes.']], [['Il ___ un chat.', 'a', ['a', 'à']], ['Je vais ___ l’école.', 'à', ['a', 'à']]]],
    ['et / est', [['et', 'relie deux mots : on peut dire « et puis »', 'Un chat et un chien.'], ['est', 'verbe être : on peut dire « était »', 'Il est content.']], [['Le chat ___ le chien dorment.', 'et', ['et', 'est']], ['Elle ___ très gentille.', 'est', ['et', 'est']]]],
    ['on / ont', [['on', 'on peut dire « il »', 'On joue dehors.'], ['ont', 'verbe avoir : on peut dire « avaient »', 'Ils ont joué.']], [['___ va au parc.', 'on', ['on', 'ont']], ['Les enfants ___ faim.', 'ont', ['on', 'ont']]]],
    ['son / sont', [['son', 'on peut dire « mon »', 'Son sac est bleu.'], ['sont', 'verbe être : on peut dire « étaient »', 'Ils sont là.']], [['Il prend ___ sac.', 'son', ['son', 'sont']], ['Ils ___ en retard.', 'sont', ['son', 'sont']]]],
    ['ce / se', [['ce', 'devant un nom : on peut dire « cet » ou « cela »', 'Ce chat dort.'], ['se', 'devant un verbe : on peut dire « me » ou « te »', 'Il se lave.']], [['___ livre est drôle.', 'Ce', ['Ce', 'Se']], ['Elle ___ lève tôt.', 'se', ['ce', 'se']]]],
    ['ces / ses', [['ces', 'on peut dire « ce » au singulier', 'Ces chats dorment.'], ['ses', 'on peut dire « son » ou « sa » au singulier', 'Elle prend ses lunettes.']], [['Regarde ___ oiseaux, là-haut !', 'ces', ['ces', 'ses']], ['Il range ___ affaires.', 'ses', ['ces', 'ses']]]],
    ['c’est / s’est', [['c’est', 'on peut dire « cela est »', 'C’est facile.'], ['s’est', 'verbe pronominal au passé : on peut dire « s’était »', 'Il s’est trompé.']], [['___ un beau jour.', 'C’est', ['C’est', 'S’est']], ['Elle ___ lavée.', 's’est', ['c’est', 's’est']]]],
    ['la / là / l’a', [['la', 'devant un nom : on peut dire « une »', 'La maison est grande.'], ['là', 'lieu : on peut dire « ici »', 'Pose-le là.'], ['l’a', 'on peut dire « l’avait »', 'Il l’a vu.']], [['Pose ton sac ___.', 'là', ['la', 'là', 'l’a']], ['Il ___ pris.', 'l’a', ['la', 'là', 'l’a']]]],
    ['ou / où', [['ou', 'on peut dire « ou bien »', 'Thé ou café ?'], ['où', 'lieu ou moment, avec l’accent grave', 'Où vas-tu ?']], [['Tu viens ___ tu restes ?', 'ou', ['ou', 'où']], ['___ est mon cahier ?', 'Où', ['Ou', 'Où']]]],
    ['mais / mes / met', [['mais', 'on peut dire « cependant »', 'Il est petit mais fort.'], ['mes', 'on peut dire « mon » ou « ma » au singulier', 'Voici mes amis.'], ['met', 'verbe mettre : on peut dire « mettait »', 'Elle met son manteau.']], [['Voici ___ cahiers.', 'mes', ['mais', 'mes', 'met']], ['Il ___ ses chaussures.', 'met', ['mais', 'mes', 'met']]]],
    ['leur / leurs', [['leur', 'avec un verbe : on peut dire « lui » ; ou devant un nom au singulier', 'Je leur parle.'], ['leurs', 'devant un nom au pluriel', 'Leurs amis arrivent.']], [['Ils ont perdu ___ clés.', 'leurs', ['leur', 'leurs']], ['Je ___ ai répondu.', 'leur', ['leur', 'leurs']]]],
    ['quel / quelle / qu’elle', [['quel / quelle', 'pose une question sur un nom : « quel âge ? » « quelle heure ? »', 'Quelle heure est-il ?'], ['qu’elle', 'on peut dire « qu’il » à la place', 'Je veux qu’elle vienne.']], [['___ heure est-il ?', 'Quelle', ['Quelle', 'Qu’elle']], ['Je pense ___ viendra.', 'qu’elle', ['quelle', 'qu’elle']]]],
    ['peu / peut / peux', [['peu', 'une petite quantité : le contraire de « beaucoup »', 'Un peu de sel.'], ['peut / peux', 'verbe pouvoir : on peut dire « pouvait »', 'Il peut venir. Je peux le faire.']], [['Il y a ___ de monde.', 'peu', ['peu', 'peut']], ['Il ___ venir demain.', 'peut', ['peu', 'peut']]]],
    ['ma / m’a', [['ma', 'on peut dire « mon » au masculin', 'Ma sœur arrive.'], ['m’a', 'on peut dire « m’avait »', 'Il m’a appelé.']], [['___ voisine est gentille.', 'Ma', ['Ma', 'M’a']], ['Elle ___ prêté un livre.', 'm’a', ['ma', 'm’a']]]],
    ['ta / t’a', [['ta', 'on peut dire « ton » au masculin', 'Ta chemise est propre.'], ['t’a', 'on peut dire « t’avait »', 'Il t’a vu.']], [['Où est ___ trousse ?', 'ta', ['ta', 't’a']], ['Qui ___ dit ça ?', 't’a', ['ta', 't’a']]]],
    ['près / prêt', [['près', 'à côté : le contraire de « loin »', 'Il habite près d’ici.'], ['prêt', 'préparé ; au féminin, « prête »', 'Je suis prêt.']], [['La gare est tout ___ d’ici.', 'près', ['près', 'prêt']], ['Elle est ___ à partir.', 'prête', ['près', 'prête']]]],
    ['quand / quant', [['quand', 'on peut dire « lorsque »', 'Quand il pleut, je reste.'], ['quant (à)', 'veut dire « en ce qui concerne »', 'Quant à moi, je viens.']], [['___ il pleut, je prends un parapluie.', 'Quand', ['Quand', 'Quant']], ['___ à lui, il est parti.', 'Quant', ['Quand', 'Quant']]]],
    ['plutôt / plus tôt', [['plutôt', 'veut dire « de préférence »', 'Je prends plutôt du thé.'], ['plus tôt', 'le contraire de « plus tard »', 'Viens plus tôt demain.']], [['Je préfère ___ le matin.', 'plutôt', ['plutôt', 'plus tôt']], ['Il est arrivé ___ que prévu.', 'plus tôt', ['plutôt', 'plus tôt']]]],
    ['sans / sent', [['sans', 'le contraire de « avec »', 'Un café sans sucre.'], ['sent', 'verbe sentir : on peut dire « sentait »', 'Il sent la fleur.']], [['Un thé ___ sucre.', 'sans', ['sans', 'sent']], ['Le pain ___ bon.', 'sent', ['sans', 'sent']]]]
  ];

  const tabSearch = box => {
    const res = h('div', { class: 'dico-res', 'aria-live': 'polite' }), sugg = h('div', { class: 'sugg-list' }); let timer = 0, ticket = 0;
    const q = h('input', { type: 'search', id: 'dicoQ', style: 'width:100%;max-width:30rem', placeholder: 'ex. chat, éphémère, prompter…', 'aria-label': 'Mot à chercher', autocomplete: 'off', spellcheck: 'false' });
    const goBtn = h('button', { class: 'btn', type: 'button' }, '🔎 Chercher');
    const onlineCk = h('label', { class: 'chk' }, h('input', { type: 'checkbox', checked: online(), onchange: ev => { Store.set('dico.online', ev.target.checked); sugg.replaceChildren(); if (q.value.trim()) show(q.value); else paintNote(); } }), 'Autoriser la recherche en ligne dans le Wiktionnaire');
    const note = h('div');
    const paintNote = () => note.replaceChildren(online() ? h('div', { class: 'notice ok' }, 'Recherche en ligne activée : le mot que tu tapes est envoyé à fr.wiktionary.org (Wikimedia) pour trouver des mots et leurs définitions. Rien d’autre n’est envoyé.') : h('div', { class: 'notice' }, 'Recherche en ligne désactivée : rien n’est envoyé sur internet. Tu peux quand même écouter un mot, le découper en syllabes, l’épeler, le garder pour le réviser et ouvrir un dictionnaire en ligne en cliquant sur un lien. Coche la case pour voir les définitions et les suggestions ici.'));
    const mine = w => { if (typeof Rev === 'undefined') return null; const k = norm(w); const hits = Object.values(Rev.D.words || {}).filter(x => norm(x.w).includes(k)).slice(0, 8); return hits.length ? h('p', { class: 'muted' }, 'Dans mes mots à réviser : ', hits.map(x => x.w).join(', '), '.') : null; };
    const show = async raw => { const w = raw.trim().replace(/\s+/g, ' '); if (!w) { res.replaceChildren(); return; } q.value = w; const my = ++ticket;
      const syl = /^[\p{L}\p{M}'’-]+$/u.test(w) && typeof syllabify === 'function' ? syllabify(w) : null;
      const head = h('div', null, h('div', { class: 'wordbig' }, w), syl && syl.length > 1 ? h('div', { class: 'syl-big', 'aria-label': 'Syllabes : ' + syl.join(' ') }, syl.map(s => h('span', null, s)), h('span', { class: 'muted', style: 'margin-left:.5rem' }, 'découpage approximatif, fait par règles')) : '',
        h('div', { class: 'row', style: 'margin:.4rem 0' }, h('button', { class: 'btn sec', onclick: () => App.speak(w) }, '🔊 Écouter'), h('button', { class: 'btn sec', onclick: () => App.speak(w.replace(/[^\p{L}\p{M}]/gu, '').split('').join(', ')) }, '🔤 Épeler'),
          typeof Rev !== 'undefined' ? h('button', { class: 'btn sec', onclick: () => { App.toast(Rev.addManual(w, '') ? 'Mot ajouté à « Réviser mes dictées ».' : 'Impossible d’ajouter ce mot.'); } }, '➕ À réviser') : '', h('button', { class: 'btn sec', onclick: () => App.copy(w).then(() => App.toast('Copié.')) }, '📋 Copier')),
        mine(w) || '');
      const links = h('p', { class: 'muted' }, 'Ouvrir ailleurs (une page s’ouvre quand tu cliques) : ', LINKS(w).map(([t, u], i) => [i ? ' · ' : '', h('a', { href: u, target: '_blank', rel: 'noopener noreferrer' }, t)]));
      const body = h('div'); res.replaceChildren(head, body, links);
      if (!online()) { body.append(h('p', { class: 'muted' }, 'Pour voir les définitions ici, coche « Autoriser la recherche en ligne dans le Wiktionnaire ».')); return; }
      body.append(h('p', { class: 'muted' }, 'Recherche dans le Wiktionnaire…'));
      try { let d = await define(w); if (d.missing && w !== w.toLowerCase()) d = await define(w.toLowerCase()); if (my !== ticket) return;
        const found = !d.missing && d.sections.length;
        body.replaceChildren(h('div', { class: 'notice ' + (found ? 'ok' : '') }, found ? `« ${d.title} » existe dans le Wiktionnaire (dictionnaire collaboratif en ligne : ce n’est pas un dictionnaire officiel).` : d.missing ? `« ${w} » n’a pas de page dans le Wiktionnaire. Vérifie l’orthographe ; un mot très récent ou très rare peut manquer.` : `Une page « ${d.title} » existe, mais je n’y ai pas trouvé de définition en français. Ouvre-la avec le lien Wiktionnaire.`),
          ...d.sections.map(s => h('div', null, h('h3', null, s.type + (s.flex ? ' (forme conjuguée ou accordée)' : '')), h('ol', null, s.defs.slice(0, 8).map(x => h('li', null, x))))),
          found ? h('p', { class: 'muted' }, 'Définitions lues automatiquement dans la page du Wiktionnaire (licence CC BY-SA) : la lecture peut oublier des détails. La fiche complète est sur le lien Wiktionnaire.') : '');
      } catch (e) { if (my === ticket) body.replaceChildren(h('div', { class: 'notice bad' }, 'La recherche en ligne n’a pas abouti (pas de connexion, ou accès bloqué sur cet appareil). Utilise les liens ci-dessous.')); } };
    const sug = async () => { const v = q.value.trim(); sugg.replaceChildren(); if (!online() || v.length < 2) return; const my = ++ticket; try { const list = await suggest(v); if (my !== ticket || q.value.trim() !== v) return; sugg.replaceChildren(...list.map(w => h('button', { class: 'btn sec', type: 'button', onclick: () => { sugg.replaceChildren(); show(w); } }, w))); } catch (e) { sugg.replaceChildren(); } };
    q.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(sug, 350); }); q.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); clearTimeout(timer); sugg.replaceChildren(); show(q.value); } }); goBtn.addEventListener('click', () => { sugg.replaceChildren(); show(q.value); });
    paintNote(); box.append(h('p', { class: 'muted' }, 'Cherche un mot : écoute-le, découpe-le en syllabes, vois sa définition. Il n’existe aucun dictionnaire qui contienne « tous » les mots : le Wiktionnaire est le plus large des dictionnaires libres (il contient aussi les formes conjuguées et accordées), mais il n’est pas officiel et n’est jamais fini.'), note, h('div', { class: 'row' }, h('label', { for: 'dicoQ' }, 'Mot : '), q, goBtn), onlineCk, sugg, res);
    Dico.open = w => { q.value = w; show(w); };
  };
  const tabNew = box => {
    const list = h('div'); const f = h('input', { type: 'search', 'aria-label': 'Filtrer les mots nouveaux', placeholder: 'Filtrer : ex. crush, 2026, Robert…', style: 'width:100%;max-width:26rem' });
    const draw = () => { const k = norm(f.value.trim()); const rows = NEW.filter(r => !k || norm(r.slice(0, 3).join(' ')).includes(k)); list.replaceChildren(h('p', { class: 'muted', role: 'status' }, rows.length + ' mot' + (rows.length > 1 ? 's' : '') + ' affiché' + (rows.length > 1 ? 's' : '') + '.'),
      ...rows.map(([w, d, s, src]) => h('div', { class: 'card', style: 'margin:.4rem 0' }, h('div', { class: 'row' }, h('b', { style: 'font-size:1.15rem' }, w), h('span', { class: 'badge-src' }, d)), h('div', null, s || h('span', { class: 'muted' }, 'Sens non donné par l’article : cherche-le dans l’onglet « Chercher un mot ».')),
        h('div', { class: 'row', style: 'margin-top:.3rem' }, h('a', { href: SRC[src][1], target: '_blank', rel: 'noopener noreferrer', class: 'muted' }, 'Source : ' + SRC[src][0]), h('button', { class: 'btn sec small', onclick: () => App.speak(w), 'aria-label': 'Écouter ' + w }, '🔊'), typeof Rev !== 'undefined' ? h('button', { class: 'btn sec small', onclick: () => App.toast(Rev.addManual(w, s ? w + ' : ' + s : '') ? 'Mot ajouté à « Réviser mes dictées ».' : 'Impossible.'), 'aria-label': 'Garder ' + w + ' pour le réviser' }, '➕ À réviser') : ''))));
    };
    f.addEventListener('input', draw);
    box.append(h('div', { class: 'notice' }, h('b', null, 'Les mots nouveaux des dictionnaires 2026 et 2027. '), 'Chaque année, Larousse et Le Robert ajoutent environ 150 mots à leur dictionnaire (d’après la presse). Cette liste ne donne que ceux que les articles cités en source nomment, avec le sens quand l’article le donne ; quelques mots sur des sujets durs n’ont pas été repris. Les éditions « 2027 » sont sorties au printemps 2026. Ce n’est pas la liste complète : pour un autre mot, utilise l’onglet « Chercher un mot ».'), h('div', { class: 'row' }, f), list); draw();
  };
  const tabSim = box => {
    const pick = h('div'), quiz = h('div', { class: 'card' }); const keep = Store.get('dico.keepErrors', true) !== false;
    SIM.forEach(([titre, items]) => pick.append(h('details', { class: 'card', style: 'margin:.35rem 0' }, h('summary', null, h('b', null, titre)), h('table', { class: 't' }, h('tr', null, h('th', null, 'Mot'), h('th', null, 'Pour choisir'), h('th', null, 'Exemple')), items.map(([m, r, e]) => h('tr', null, h('td', null, h('b', null, m)), h('td', null, r), h('td', null, e, ' ', h('button', { class: 'btn sec small', onclick: () => App.speak(e), 'aria-label': 'Écouter : ' + e }, '🔊'))))))));
    const all = SIM.flatMap(([titre, items, qs]) => qs.map(([p, ok, ch]) => ({ titre, p, ok, ch, why: (() => { const o = ok.toLowerCase(), toks = i => i[0].toLowerCase().replace(/[()]/g, '').split(/ \/ | /); return (items.find(i => toks(i).includes(o)) || items.find(i => toks(i).some(t => o.startsWith(t))) || [])[1]; })() })));
    let nOk = 0, nAll = 0; const keepCk = h('input', { type: 'checkbox', checked: keep, onchange: ev => Store.set('dico.keepErrors', ev.target.checked) });
    const next = () => { const q = all[Math.floor(Math.random() * all.length)], ch = Sub.shuffle ? Sub.shuffle(q.ch.slice()) : q.ch.slice(); const fb = h('p', { role: 'status', 'aria-live': 'polite' });
      quiz.replaceChildren(h('h3', { style: 'margin-top:0' }, '🎯 Petit jeu : choisis le bon mot'), h('p', null, h('b', { style: 'font-size:1.2rem' }, q.p.replace('___', '_____'))), h('p', { class: 'muted' }, q.titre),
        h('div', { class: 'row' }, ch.map(c => h('button', { class: 'btn sec', onclick: ev => { if (fb.textContent) return; nAll++; const good = norm(c) === norm(q.ok); if (good) nOk++; ev.target.className = 'btn ' + (good ? '' : 'danger'); fb.textContent = (good ? '✔ Bien vu. ' : '✘ C’était « ' + q.ok + ' ». ') + (q.why ? 'Repère : ' + q.why + '.' : '') + ` Score : ${nOk}/${nAll}.`; if (!good && keepCk.checked && typeof Rev !== 'undefined') Rev.addManual(q.ok, q.p.replace('___', q.ok)); } }, c))), fb,
        h('div', { class: 'row' }, h('button', { class: 'btn', onclick: next }, 'Suivant ▶'), h('label', { class: 'chk' }, keepCk, 'Garder mes erreurs dans « Réviser mes dictées »')));
    };
    box.append(h('div', { class: 'notice' }, 'Des mots qui se prononcent pareil (ou presque) mais qui s’écrivent autrement. Les repères (« on peut dire … à la place ») sont des astuces d’école courantes : elles aident beaucoup, mais ne couvrent pas tous les cas.'), pick, quiz); next();
  };

  App.reg({ id: 'dico', title: 'Dictionnaire', group: 'outils', icon: '📖', render(el) {
    el.append(h('h1', null, 'Dictionnaire'));
    Sub.tabs(el, [['Chercher un mot', tabSearch], ['Mots nouveaux 2026-2027', tabNew], ['Mots qui se ressemblent', tabSim]]);
  } });
  return { parse, clean, define, suggest, NEW, SIM, SRC };
})();
