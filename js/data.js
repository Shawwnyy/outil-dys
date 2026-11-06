/* Outil Dys — données linguistiques et pédagogiques (100 % locales). */
'use strict';

// ---------------------------------------------------------------- Catégories / couleurs
const CATS = [
  { id: 'correct', nom: 'Bleu', emoji: '🔵', icone: '✓', famille: 'Correct', def: '#2563eb', libelle: 'Mots corrects', expl: 'Ces mots sont corrects : rien à changer.' },
  { id: 'ortho', nom: 'Rouge', emoji: '🔴', icone: '✗', famille: 'Langue', def: '#dc2626', libelle: "Fautes d'orthographe", expl: "Un mot est mal écrit (lettres, accents, apostrophe, trait d'union)." },
  { id: 'gram', nom: 'Vert', emoji: '🟢', icone: 'G', famille: 'Langue', def: '#16a34a', libelle: 'Fautes de grammaire', expl: 'Le genre (masculin/féminin) ou le nombre (singulier/pluriel) ne correspond pas.' },
  { id: 'synt', nom: 'Orange', emoji: '🟠', icone: 'S', famille: 'Structure', def: '#ea580c', libelle: 'Erreurs de syntaxe', expl: "La phrase est mal construite ou trop longue : l'ordre ou la construction pose problème." },
  { id: 'conj', nom: 'Violet', emoji: '🟣', icone: 'C', famille: 'Langue', def: '#9333ea', libelle: 'Erreurs de conjugaison', expl: "La forme du verbe ne correspond pas au sujet, au temps ou à l'auxiliaire." },
  { id: 'rep', nom: 'Jaune', emoji: '🟡', icone: '↺', famille: 'Style', def: '#facc15', libelle: 'Répétitions et maladresses', expl: 'Un mot revient trop souvent, ou la formulation est lourde (pléonasme, redite).' },
  { id: 'manque', nom: 'Rose', emoji: '🩷', icone: '∅', famille: 'Structure', def: '#f472b6', libelle: 'Mots oubliés ou manquants', expl: 'Il semble manquer un mot (phrase inachevée, négation incomplète).' },
  { id: 'vocab', nom: 'Marron', emoji: '🟤', icone: 'V', famille: 'Style', def: '#92400e', libelle: 'Vocabulaire inadapté ou imprécis', expl: 'Mot familier, vague ou mal choisi pour ce type de texte.' },
  { id: 'typo', nom: 'Cyan', emoji: '🩵', icone: '␣', famille: 'Typographie', def: '#06b6d4', libelle: 'Typographie et espaces', expl: 'Espaces en trop ou manquants, majuscule oubliée, guillemets.' },
  { id: 'ambigu', nom: 'Gris', emoji: '⚫', icone: '?', famille: 'À vérifier', def: '#6b7280', libelle: 'Éléments ambigus ou à vérifier', expl: "Je ne suis pas sûr : c'est à toi de vérifier (mot inhabituel, référent peu clair, mot mal lu par l'OCR)." },
  { id: 'accord', nom: 'Bordeaux', emoji: '🟥', icone: 'A', famille: 'Langue', def: '#7f1d1d', libelle: "Erreurs d'accord complexes", expl: "Accord du participe passé ou de l'attribut avec un sujet ou un mot placé plus loin." },
  { id: 'homo', nom: 'Lavande', emoji: '🟪', icone: '≈', famille: 'Langue', def: '#a78bfa', libelle: 'Homophones et confusions de mots', expl: 'Deux mots se prononcent pareil mais ne s’écrivent pas pareil (a/à, et/est, ou/où…).' },
  { id: 'coh', nom: 'Turquoise', emoji: '🟩', icone: '≠', famille: 'Structure', def: '#14b8a6', libelle: 'Problèmes de cohérence et de logique', expl: "Une idée en contredit une autre ou une énumération est incomplète." },
  { id: 'ponct', nom: 'Corail', emoji: '🟧', icone: ',', famille: 'Typographie', def: '#ff7f50', libelle: 'Ponctuation manquante ou incorrecte', expl: 'Virgule, point ou point d’interrogation manquant ou en trop.' },
  { id: 'amelio', nom: 'Bleu marine', emoji: '🟦', icone: '★', famille: 'Style', def: '#1e3a8a', libelle: 'Amélioration facultative de formulation', expl: "Ce n'est pas une faute : une formulation plus riche ou plus claire est possible." }
];
const CAT = Object.fromEntries(CATS.map(c => [c.id, c]));

// ---------------------------------------------------------------- Utilitaires de table
function parseMap(s) { const m = {}; s.split('|').forEach(e => { const i = e.indexOf('>'); if (i > 0) m[e.slice(0, i).trim()] = e.slice(i + 1).trim(); }); return m; }

// Fautes d'orthographe fréquentes (mot ou expression mal écrit > forme correcte)
const MISSPELL = parseMap(
 "aujourdhui>aujourd'hui|aujourdui>aujourd'hui|aujourd'hui>aujourd'hui|parceque>parce que|quelquun>quelqu'un|quelquuns>quelques-uns|jusqua>jusqu'à|jusquau>jusqu'au|jusquen>jusqu'en|" +
 "beacoup>beaucoup|beaucou>beaucoup|boucoup>beaucoup|beaucoups>beaucoup|apeler>appeler|apeller>appeler|apelle>appelle|apele>appelle|aprendre>apprendre|aprend>apprend|apres>après|aprés>après|apré>après|" +
 "tres>très|trés>très|deja>déjà|dèja>déjà|voila>voilà|ca>ça|meme>même|mème>même|etre>être|ete>été|ecole>école|ecoles>écoles|ecrire>écrire|ecrit>écrit|ecrivain>écrivain|eleve>élève|eleves>élèves|elève>élève|elèves>élèves|" +
 "etudiant>étudiant|etudiants>étudiants|etudier>étudier|etude>étude|etudes>études|etat>état|echec>échec|probleme>problème|problemes>problèmes|problême>problème|probléme>problème|systeme>système|systemes>systèmes|theme>thème|poeme>poème|" +
 "reponse>réponse|reponses>réponses|repondre>répondre|premiere>première|derniere>dernière|matiere>matière|maniere>manière|lumiere>lumière|riviere>rivière|frere>frère|mere>mère|pere>père|" +
 "ecouter>écouter|ecoute>écoute|equipe>équipe|enquete>enquête|fenetre>fenêtre|foret>forêt|tete>tête|bete>bête|fete>fête|arret>arrêt|interet>intérêt|hopital>hôpital|chateau>château|batiment>bâtiment|role>rôle|plutot>plutôt|" +
 "controle>contrôle|diplome>diplôme|theatre>théâtre|gout>goût|numero>numéro|telephone>téléphone|television>télévision|francais>français|lecon>leçon|garcon>garçon|facon>façon|recu>reçu|apercu>aperçu|" +
 "dévelopement>développement|developpement>développement|developement>développement|developper>développer|developpe>développe|aprécier>apprécier|apartement>appartement|aquérir>acquérir|acceuil>accueil|acceuillir>accueillir|" +
 "ammener>amener|ameliorer>améliorer|annee>année|aparence>apparence|aparaitre>apparaître|atendre>attendre|atention>attention|boulengerie>boulangerie|caractere>caractère|cependent>cependant|cepandant>cependant|chaqun>chacun|" +
 "choisire>choisir|comencer>commencer|comence>commence|commant>comment|comprand>comprend|conaitre>connaître|conaissance>connaissance|connaisance>connaissance|constament>constamment|courrage>courage|dabord>d'abord|daccord>d'accord|dailleurs>d'ailleurs|dautant>d'autant|" +
 "debut>début|decider>décider|decouvrir>découvrir|decrire>décrire|defendre>défendre|definition>définition|depart>départ|desormais>désormais|differant>différent|differente>différente|diférent>différent|different>différent|differents>différents|" +
 "dificile>difficile|dificulté>difficulté|difficulte>difficulté|difficil>difficile|dificultés>difficultés|éxemple>exemple|exemlpe>exemple|exeption>exception|exeptionnel>exceptionnel|expliqer>expliquer|explication>explication|exercise>exercice|exersice>exercice|" +
 "famile>famille|fammille>famille|fatiguer>fatiguer|finalment>finalement|fréquament>fréquemment|gramaire>grammaire|grammère>grammaire|gramère>grammaire|grandement>grandement|heureusment>heureusement|histoir>histoire|" +
 "importante>importante|interessant>intéressant|interessante>intéressante|interesser>intéresser|intelligent>intelligent|intérressant>intéressant|language>langage|lettr>lettre|mainenant>maintenant|maintenent>maintenant|maintenan>maintenant|" +
 "mathematiques>mathématiques|medecin>médecin|mechant>méchant|moment>moment|nécessaire>nécessaire|necessaire>nécessaire|nécésaire>nécessaire|necessité>nécessité|ocasion>occasion|occazion>occasion|ordinateur>ordinateur|" +
 "parmis>parmi|persone>personne|pourcoi>pourquoi|pourquoit>pourquoi|proffesseur>professeur|profeseur>professeur|prefere>préfère|preferer>préférer|probablment>probablement|" +
 "resultat>résultat|resultats>résultats|resume>résumé|réponce>réponse|seulment>seulement|souvant>souvent|sourtout>surtout|surtou>surtout|tjs>toujours|toujour>toujours|toujours>toujours|travaile>travaille|trvail>travail|" +
 "vraimen>vraiment|vraimant>vraiment|vrément>vraiment|voyelle>voyelle|zero>zéro|écrir>écrire|ecrie>écris|completement>complètement|complétement>complètement|évidamment>évidemment|evidemment>évidemment|" +
 "atteint>atteint|quelque-un>quelqu'un|quelqu-un>quelqu'un|nul part>nulle part|sinon>sinon|tandis>tandis|aillant>ayant|ayez>ayez|appart>appart|" +
 "mangeai>mangeai|mangeons>mangeons|manger>manger|nouveaux>nouveaux|jamait>jamais|jammais>jamais|pourtant>pourtant|pandant>pendant|parfoit>parfois|enssemble>ensemble|ensenble>ensemble|ensamble>ensemble|" +
 "clase>classe|calsse>classe|devoire>devoir|devoires>devoirs|cahié>cahier|cahiés>cahiers|liver>livre|livere>livre|stilo>stylo|stylot>stylo|matin>matin|soire>soir|soiré>soirée|semaigne>semaine|semène>semaine|" +
 "bibiothèque>bibliothèque|bibliotheque>bibliothèque|biblotèque>bibliothèque|dictionaire>dictionnaire|dictionnair>dictionnaire|université>université|univercité>université|universite>université|" +
 "présentation>présentation|presentation>présentation|presentations>présentations|diapositive>diapositive|diapozitive>diapositive|diapositif>diapositive|conclusion>conclusion|conclution>conclusion|introduction>introduction|introdution>introduction"
);
// ne garder que les vraies corrections (clé différente de la valeur)
Object.assign(MISSPELL, parseMap("planete>planète|planetes>planètes|atmosphere>atmosphère|atmospheres>atmosphères|epais>épais|epaisse>épaisse|epaisseur>épaisseur|etoile>étoile|etoiles>étoiles|geographie>géographie|ecologie>écologie|energie>énergie|temperature>température|temperatures>températures|periode>période|periodes>périodes|kilometre>kilomètre|kilometres>kilomètres|diametre>diamètre|millimetre>millimètre|centimetre>centimètre|decimetre>décimètre|poid>poids|gravite>gravité|electricite>électricité|electrique>électrique|experience>expérience|experiences>expériences|hypothese>hypothèse|hypotheses>hypothèses|materiel>matériel|materiaux>matériaux|materiau>matériau|decouverte>découverte|decouvertes>découvertes|evenement>événement|evenements>événements|revolution>révolution|republique>république|siecle>siècle|siecles>siècles|epoque>époque|armee>armée|region>région|regions>régions|frontiere>frontière|frontieres>frontières|ocean>océan|oceans>océans|geometrie>géométrie|equation>équation|numerateur>numérateur|denominateur>dénominateur|perimetre>périmètre|theoreme>théorème|unite>unité|unites>unités|bientot>bientôt|plutot>plutôt|aussitot>aussitôt|pret>prêt|different>différent|differente>différente|differents>différents|differentes>différentes|difference>différence|differences>différences|element>élément|elements>éléments|egalement>également|egal>égal|egaux>égaux|generalement>généralement|reussir>réussir|reussi>réussi|reussite>réussite|evidemment>évidemment|evident>évident|securite>sécurité|societe>société|qualite>qualité|quantite>quantité|activite>activité|activites>activités|possibilite>possibilité|realite>réalité|liberte>liberté|egalite>égalité|fraternite>fraternité|communaute>communauté|identite>identité|diversite>diversité|ecran>écran|ecrans>écrans|reseau>réseau|reseaux>réseaux|donnees>données|donnee>donnée|memoire>mémoire|telecharger>télécharger|numerique>numérique|numeriques>numériques|decimal>décimal|hexadecimal>hexadécimal|deuxieme>deuxième|troisieme>troisième|quatrieme>quatrième|cinquieme>cinquième|sixieme>sixième|septieme>septième|huitieme>huitième|neuvieme>neuvième|dixieme>dixième|mere>mère|pere>père|frere>frère|grand-mere>grand-mère|grand-pere>grand-père|mediterranee>méditerranée|economie>économie|ecologique>écologique|decimale>décimale|reguliere>régulière|regulier>régulier|speciale>spéciale|special>spécial|specialement>spécialement"));
Object.keys(MISSPELL).forEach(k => { if (MISSPELL[k].toLowerCase() === k.toLowerCase()) delete MISSPELL[k]; });

// Confusions et locutions (expression > forme correcte) — catégorie « homophones/confusions »
const CONFUSIONS = parseMap(
 "a cause de>à cause de|a propos>à propos|a peu pres>à peu près|a peu près>à peu près|a partir de>à partir de|a travers>à travers|a cote de>à côté de|a coté de>à côté de|" +
 "tout a fait>tout à fait|toute a l'heure>tout à l'heure|tout a l'heure>tout à l'heure|quelque soit>quel que soit|quelques soit>quel que soit|quelque soient>quels que soient|" +
 "sa va>ça va|ces sont>ce sont|peutetre>peut-être|peut-etre>peut-être|c'est a dire>c'est-à-dire|cest a dire>c'est-à-dire|quand meme>quand même|" +
 "par ce que>parce que|parce-que>parce que|au dessus>au-dessus|au dessous>au-dessous|la haut>là-haut|la bas>là-bas|là bas>là-bas|est ce que>est-ce que|est-ce-que>est-ce que|n'est ce pas>n'est-ce pas|" +
 "avant hier>avant-hier|après midi>après-midi|apres midi>après-midi|apres-midi>après-midi|week end>week-end|vas y>vas-y|dit il>dit-il|dit elle>dit-elle|a-t'il>a-t-il|a t il>a-t-il|a-t'elle>a-t-elle|" +
 "au revoir>au revoir|tant mieux>tant mieux|bientot>bientôt|quoique>quoique|" +
 "si non>sinon|en fait>en fait|tou le monde>tout le monde|tout le monde>tout le monde|tout les>tous les|tout ses>tous ses|tout mes>tous mes|tout ces>tous ces"
);
Object.keys(CONFUSIONS).forEach(k => { if (CONFUSIONS[k].toLowerCase() === k.toLowerCase()) delete CONFUSIONS[k]; });

// Fautes de conjugaison fréquentes
const CONJ_TABLE = parseMap(
 "prendu>pris|prenu>pris|metté>mis|mettu>mis|faisé>fait|dissé>dit|disé>dit|ouvri>ouvert|vous faite>vous faites|vous dite>vous dites|vous disez>vous dites|vous faisez>vous faites|" +
 "ils sontent>ils sont|ils avaient>ils avaient|il vas>il va|il peu>il peut|elle peu>elle peut|on peu>on peut|il veu>il veut|elle veu>elle veut|il doi>il doit|j'ai eut>j'ai eu|il a eut>il a eu|" +
 "j'ai pris>j'ai pris|ils ont pu>ils ont pu|tu peut>tu peux|tu veut>tu veux|je peut>je peux|je veut>je veux|nous avont>nous avons|nous sommes>nous sommes|ils vienent>ils viennent|ils tienent>ils tiennent|" +
 "il prend>il prend|il vien>il vient|il tien>il tient|je suis allé>je suis allé|tu a>tu as|tu es>tu es|il à fait>il a fait|j'ai été>j'ai été|il fesait>il faisait|je fesais>je faisais|ils fesaient>ils faisaient|nous fesons>nous faisons|vous fesez>vous faites"
);
Object.keys(CONJ_TABLE).forEach(k => { if (CONJ_TABLE[k].toLowerCase() === k.toLowerCase()) delete CONJ_TABLE[k]; });

// Pléonasmes et lourdeurs (jaune)
const PLEONASMES = parseMap(
 "monter en haut>monter|descendre en bas>descendre|sortir dehors>sortir|entrer dedans>entrer|reculer en arrière>reculer|au jour d'aujourd'hui>aujourd'hui|collaborer ensemble>collaborer|" +
 "puis ensuite>ensuite|voire même>voire|prévoir d'avance>prévoir|s'entraider mutuellement>s'entraider|marcher à pied>marcher|répéter encore>répéter|continuer encore>continuer|" +
 "car en effet>car|mais pourtant>pourtant|exporter à l'étranger>exporter|complètement terminé>terminé|completement terminé>terminé|se suicider soi-même>se suicider|panacée universelle>panacée|" +
 "hasard imprévu>hasard|lever les yeux au ciel en haut>lever les yeux|reculer en arrière>reculer|petit nain>nain|à l'unanimité totale>à l'unanimité|première priorité>priorité|" +
 "enfin pour finir>enfin|et puis aussi>et aussi|ensuite après>ensuite|aussi également>également"
);

// Vocabulaire familier ou vague (marron) : mot > propositions
const INFORMAL = {
  'truc': ['chose', 'élément', 'point'], 'trucs': ['choses', 'éléments', 'points'], 'machin': ['objet', 'chose'], 'bidule': ['objet', 'dispositif'],
  'bouquin': ['livre'], 'bouquins': ['livres'], 'boulot': ['travail', 'emploi'], 'fric': ['argent'], 'mec': ['homme', 'garçon'], 'gamin': ['enfant'], 'gamins': ['enfants'],
  'bagnole': ['voiture'], 'bosser': ['travailler'], 'kiffer': ['aimer'], 'ouais': ['oui'], 'nickel': ['parfait'], 'flemme': ['paresse'], 'pote': ['ami'], 'potes': ['amis'],
  'sympa': ['agréable', 'aimable'], 'super': ['très bien', 'excellent'], 'génial': ['remarquable', 'très bien'], 'cool': ['agréable', 'bien'], 'ado': ['adolescent'], 'ados': ['adolescents'],
  'resto': ['restaurant'], 'prof': ['professeur'], 'profs': ['professeurs'], 'exo': ['exercice'], 'exos': ['exercices'], 'ordi': ['ordinateur'], 'appart': ['appartement'],
  'bref': ['en résumé'], 'par contre': ['en revanche'], 'plein de': ['beaucoup de', 'de nombreux'],
  'un tas de': ['beaucoup de'], 'pas mal de': ['beaucoup de'], 'carrément': ['tout à fait'], 'franchement': ['vraiment'], 'malgré que': ['bien que'], 'suite à': ['à la suite de'],
  'pallier à': ['pallier'], 'se rappeler de': ['se rappeler'], 'beaucoup de monde': ['beaucoup de personnes'], 'les gens': ['les personnes']
};

// Style : amélioration facultative (bleu marine)
const STYLE_UP = {
  'très beau': ['magnifique', 'splendide'], 'très belle': ['magnifique', 'splendide'], 'très grand': ['immense', 'vaste'], 'très grande': ['immense', 'vaste'],
  'très petit': ['minuscule'], 'très petite': ['minuscule'], 'très bon': ['excellent'], 'très bonne': ['excellente'], 'très mauvais': ['exécrable'], 'très important': ['essentiel', 'capital'],
  'très importante': ['essentielle', 'capitale'], 'très difficile': ['ardu', 'complexe'], 'très facile': ['simple', 'aisé'], 'très fatigué': ['épuisé'], 'très fatiguée': ['épuisée'],
  'très content': ['ravi'], 'très contente': ['ravie'], 'très intéressant': ['passionnant'], 'très intéressante': ['passionnante'], 'très peur': ['une grande peur']
};

// Noms courants pour le contrôle genre / nombre
const NOUNS_M = 'livre cahier stylo jour problème exercice texte devoir cours mot verbe sujet film garçon homme travail moment chat chien document exposé élève ami professeur enfant résultat tableau crayon cartable bureau jardin pays groupe projet titre paragraphe chapitre sens exemple message rapport'.split(' ');
const NOUNS_F = 'maison voiture table chaise école classe porte fenêtre famille chose fille femme ville vie nuit semaine année heure histoire leçon phrase question réponse réunion présentation diapositive page lettre erreur faute règle idée personne information image salle trousse idée conclusion introduction partie note date'.split(' ');

// Verbes courants (infinitif -er) pour contrôle participe / infinitif
const VERBES_ER = 'manger parler jouer regarder aimer chanter travailler danser écouter donner marcher penser trouver arriver rester monter tomber porter passer demander chercher commencer montrer fermer laisser rentrer retourner étudier utiliser expliquer préparer terminer écrire lire'.split(' ').filter(v => v.endsWith('er'));
const VERBES_3SG = 'mange joue parle regarde aime chante travaille danse écoute donne marche pense trouve arrive reste monte tombe porte passe demande cherche commence montre ferme laisse rentre retourne étudie utilise explique prépare termine'.split(' ');

// Mots vides (pour les calculs de répétition)
const STOP = new Set('le la les un une des de du d l au aux et ou mais donc or ni car que qui quoi dont où se ce cet cette ces sa son ses leur leurs mon ma mes ton ta tes notre nos votre vos je tu il elle on nous vous ils elles me te lui y en ne pas plus par pour sur sous dans avec sans vers chez entre comme si est sont était étaient être avoir a ai as avons avez ont avait avaient été eu très aussi bien tout tous toute toutes plus moins fait faire peut peuvent doit doivent cela ça ceci c qu n s j m t'.split(' '));

// Connecteurs de transition (lisibilité)
const CONNECTEURS = ['d\'abord', 'ensuite', 'puis', 'enfin', 'premièrement', 'deuxièmement', 'troisièmement', 'de plus', 'en outre', 'par ailleurs', 'cependant', 'pourtant', 'toutefois', 'néanmoins', 'en revanche', 'mais', 'donc', 'ainsi', 'par conséquent', 'en conclusion', 'en effet', 'car', 'parce que', 'par exemple', 'c\'est pourquoi', 'd\'une part', 'd\'autre part', 'finalement', 'alors', 'or', 'en résumé', 'enfin'];

// ---------------------------------------------------------------- Simplification
// forme difficile > forme simple ; niveau minimum de simplification (1 = langage courant et plus, 2 = simple et plus, 3 = très simple seulement)
const SIMPLE_MAP = [
  ['afin de', 'pour', 1], ['afin que', 'pour que', 1], ['néanmoins', 'pourtant', 1], ['toutefois', 'mais', 1], ['cependant', 'mais', 1], ['en outre', 'de plus', 1], ['par conséquent', 'donc', 1],
  ['il s\'agit de', 'c\'est', 1], ['à savoir', 'c\'est-à-dire', 1], ['approximativement', 'environ', 1], ['précédemment', 'avant', 1], ['ultérieurement', 'plus tard', 1],
  ['effectuer', 'faire', 1], ['effectué', 'fait', 1], ['effectuent', 'font', 1], ['effectue', 'fait', 1],
  ['démontrer', 'montrer', 2], ['démontre', 'montre', 2], ['démontrent', 'montrent', 2], ['acquérir', 'obtenir', 2], ['disposer de', 'avoir', 2], ['dispose de', 'a', 2], ['disposent de', 'ont', 2],
  ['mettre en œuvre', 'appliquer', 2], ['au sein de', 'dans', 2], ['en vue de', 'pour', 2], ['dans le but de', 'pour', 2], ['à l\'aide de', 'avec', 2], ['au moyen de', 'avec', 2],
  ['en raison de', 'à cause de', 2], ['du fait que', 'parce que', 2], ['dans la mesure où', 'parce que', 2], ['lorsque', 'quand', 2], ['tandis que', 'alors que', 2], ['puisque', 'parce que', 2],
  ['notamment', 'surtout', 2], ['également', 'aussi', 2], ['ainsi que', 'et', 2], ['davantage', 'plus', 2], ['quasiment', 'presque', 2], ['prochainement', 'bientôt', 2], ['actuellement', 'maintenant', 2],
  ['désormais', 'maintenant', 2], ['auparavant', 'avant', 2], ['fréquemment', 'souvent', 2], ['il convient de', 'il faut', 2], ['il est nécessaire de', 'il faut', 2], ['de nombreux', 'beaucoup de', 2], ['de nombreuses', 'beaucoup de', 2],
  ['substantiel', 'important', 2], ['considérable', 'grand', 2], ['significatif', 'important', 2], ['significative', 'importante', 2], ['énormément', 'beaucoup', 3], ['extrêmement', 'très', 3],
  ['primordial', 'très important', 3], ['primordiale', 'très importante', 3], ['crucial', 'très important', 3], ['cruciale', 'très importante', 3], ['indispensable', 'obligatoire', 3], ['bien que', 'même si', 3],
  ['permet de', 'sert à', 3], ['permettent de', 'servent à', 3], ['constitue', 'est', 3], ['constituent', 'sont', 3], ['représente', 'est', 3], ['représentent', 'sont', 3], ['s\'avère', 'est', 3], ['s\'avèrent', 'sont', 3],
  ['majoritairement', 'surtout', 3], ['principalement', 'surtout', 3], ['généralement', 'souvent', 3], ['ensuite de quoi', 'puis', 3], ['au cours de', 'pendant', 3], ['en revanche', 'mais', 3], ['ainsi', 'donc', 3]
];

// Glossaire scolaire : mot > explication simple
const GLOSSAIRE = {
  'photosynthèse': "Les plantes vertes fabriquent leur nourriture avec la lumière du soleil, l'eau et l'air.", 'écosystème': 'Un endroit avec des êtres vivants (plantes, animaux) qui vivent ensemble et dépendent les uns des autres.',
  'biodiversité': 'Le nombre et la variété de plantes, animaux et autres êtres vivants.', 'démocratie': 'Un système où les citoyens choisissent leurs dirigeants en votant.', 'république': "Un pays dirigé par des personnes élues, pas par un roi.",
  'monarchie': 'Un pays dirigé par un roi ou une reine.', 'révolution': 'Un grand changement, souvent rapide, dans un pays.', 'industrialisation': 'Le passage au travail dans des usines avec des machines.',
  'colonisation': "Quand un pays prend le contrôle d'un autre territoire et de ses habitants.", 'mondialisation': 'Les pays du monde échangent de plus en plus (objets, argent, idées).', 'urbanisation': 'Il y a de plus en plus de villes et de gens qui vivent en ville.',
  'démographie': "L'étude du nombre d'habitants et de leur évolution.", 'hypothèse': "Une idée qu'on propose et qu'on doit vérifier.", 'théorie': 'Une explication, appuyée sur des preuves, qui sert à comprendre quelque chose.',
  'molécule': 'Un tout petit groupe d’atomes collés ensemble.', 'atome': "Une toute petite particule : tout ce qui existe est fait d'atomes.", 'cellule': 'La plus petite partie d’un être vivant.', 'organisme': 'Un être vivant.',
  'énergie': "Ce qui permet de faire bouger, chauffer ou éclairer.", 'gravité': 'La force qui attire les objets vers le sol.', 'atmosphère': "La couche d'air autour de la Terre.", 'érosion': "L'usure lente des roches et du sol par l'eau, le vent ou la glace.",
  'séisme': 'Un tremblement de terre.', 'tectonique': 'Les mouvements des grandes plaques de la croûte terrestre.', 'géométrie': 'Les maths des formes (carré, triangle, cercle…).', 'périmètre': 'Le tour d’une forme.',
  'aire': "La taille de la surface à l'intérieur d'une forme.", 'fraction': 'Une partie d’un tout, écrite avec deux nombres (par exemple 1/2).', 'pourcentage': 'Une quantité sur 100.', 'proportionnalité': 'Quand deux nombres grandissent ou diminuent ensemble de la même façon.',
  'équation': 'Un calcul avec un nombre inconnu qu’il faut trouver.', 'variable': 'Une lettre qui remplace un nombre qui peut changer.', 'probabilité': 'La chance qu’une chose arrive.', 'statistique': 'Des chiffres rassemblés pour comprendre une situation.',
  'moyenne': "Le résultat quand on additionne des nombres puis qu'on divise par combien il y en a.", 'algorithme': 'Une suite d’étapes à suivre pour résoudre un problème.', 'proposition': 'Un groupe de mots autour d’un verbe.', 'subordonnée': 'Une partie de phrase qui dépend d’une autre.',
  'conjugaison': 'Les changements du verbe selon la personne et le temps.', 'métaphore': 'Une image : on dit qu’une chose est une autre (« ce bébé est un ange »).', 'comparaison': 'On rapproche deux choses avec « comme » ou « tel ».', 'narrateur': 'Celui qui raconte l’histoire.',
  'allégorie': 'Une image qui représente une idée (par exemple la balance pour la justice).', 'argumentation': 'Donner des raisons pour convaincre.', 'thèse': 'L’idée qu’on défend.', 'synthèse': 'Résumer l’essentiel en rassemblant plusieurs idées.',
  'problématique': 'La grande question à laquelle on doit répondre.', 'citoyenneté': 'Le fait d’être citoyen : avoir des droits et des devoirs dans son pays.', 'constitution': 'Le texte qui donne les règles les plus importantes d’un pays.',
  'législatif': 'Le pouvoir qui fait les lois.', 'exécutif': 'Le pouvoir qui applique les lois.', 'judiciaire': 'Le pouvoir qui juge.', 'suffrage': 'Le vote.', 'impôt': 'L’argent que l’on donne à l’État.', 'inflation': 'Les prix qui augmentent partout.',
  'capitalisme': 'Un système où les entreprises appartiennent à des personnes privées qui cherchent à gagner de l’argent.', 'communisme': 'Une idée où les biens et les moyens de production appartiennent à tous.', 'nation': 'Un groupe de personnes qui partagent un pays, une histoire, une culture.',
  'empire': 'Un très grand territoire dirigé par un empereur.', 'féodalité': 'Au Moyen Âge, un système où chacun doit obéissance à un plus puissant (le seigneur).', 'renaissance': 'Une période où l’art et les sciences se développent beaucoup en Europe (XVe-XVIe siècles).',
  'humanisme': 'Une façon de penser qui met l’être humain et le savoir au centre.', 'antiquité': 'La période très ancienne de la Grèce et de Rome.', 'préhistoire': 'La période avant l’invention de l’écriture.', 'néolithique': 'Une période où les humains commencent à cultiver et à élever des animaux.',
  'sédentaire': 'Qui reste au même endroit.', 'nomade': 'Qui se déplace sans cesse.', 'civilisation': 'Un peuple avec sa culture, ses règles et son mode de vie.', 'laïcité': 'L’État ne favorise aucune religion et chacun est libre de croire ou non.',
  'dérivée': 'Un outil de maths qui mesure à quelle vitesse une chose change.', 'intégrale': 'Un outil de maths pour calculer une aire ou un total.', 'concentration': 'La quantité d’une substance dans un mélange.', 'réaction': 'Un changement où des substances se transforment.',
  'oxydation': 'Quand une matière réagit avec l’oxygène (comme le fer qui rouille).', 'évaporation': 'Un liquide devient gaz.', 'condensation': 'Un gaz devient liquide.', 'précipitations': 'La pluie, la neige, la grêle…', 'hydrographie': 'L’ensemble des cours d’eau d’une région.',
  'relief': 'Les formes du terrain : montagnes, plaines, vallées.', 'densité': 'Le nombre d’éléments dans un espace donné.', 'migration': 'Le déplacement de personnes ou d’animaux d’un endroit à un autre.', 'ressource': 'Ce que la nature ou les gens fournissent et qu’on peut utiliser.',
  'renouvelable': 'Qui se refait naturellement et ne s’épuise pas.', 'pollution': 'Quand l’air, l’eau ou le sol sont salis.', 'infrastructure': 'Les routes, ponts, réseaux… utiles à tous.', 'dysfonctionnement': 'Un problème qui empêche quelque chose de bien marcher.',
  'paradigme': 'Une façon de penser qui sert de modèle.', 'phénomène': 'Un fait qu’on peut observer.', 'processus': 'Une suite d’étapes qui mène à un résultat.', 'paramètre': 'Une donnée qu’on peut régler ou qui influence le résultat.', 'concept': 'Une idée générale.',
  'corrélation': 'Un lien entre deux choses qui évoluent ensemble.', 'hiérarchie': 'Un classement du plus important au moins important.', 'antagonisme': 'Une opposition entre deux forces ou deux idées.', 'ambigu': 'Qui peut se comprendre de plusieurs façons.'
};
// Indices pour les mots longs non listés (préfixes / suffixes)
const MORPHO = [
  [/tion$|sion$/, 'mot qui désigne une action ou son résultat'], [/isme$/, 'mot qui désigne une idée ou un courant'], [/ologie$/, 'mot qui veut dire « étude de… »'], [/ité$/, 'mot qui désigne une qualité'],
  [/able$|ible$/, 'qui peut être… (possible)'], [/^anti/, '« anti » = contre'], [/^pré/, '« pré » = avant'], [/^post/, '« post » = après'], [/^multi|^poly/, 'plusieurs'], [/^inter/, 'entre'], [/^trans/, 'à travers / changement'],
  [/^in|^im|^il|^ir/, 'souvent le contraire'], [/ment$/, 'souvent un adverbe : dit comment ça se passe']
];

// ---------------------------------------------------------------- Exercices « Apprendre les couleurs »
// [niveau, catégorie, avant, erreur, après, bonne correction, [mauvaises propositions], règle]
const EXERCICES = [
  [1, 'ortho', 'Il y a ', 'beacoup', ' de livres.', 'beaucoup', ['beaucoups', 'baucoup'], '« Beaucoup » s’écrit avec « eau » et ne prend jamais de s final.'],
  [1, 'ortho', 'Je viens ', 'aujourdhui', ' à l’école.', "aujourd'hui", ['aujour d’hui', 'aujourdui'], '« Aujourd’hui » s’écrit en un seul mot, avec une apostrophe.'],
  [2, 'ortho', 'C’est un grand ', 'probleme', ' pour la classe.', 'problème', ['problême', 'probléme'], '« Problème » : accent grave sur le deuxième « e » (comme dans « système »).'],
  [2, 'ortho', 'Elle écrit une ', 'gramaire', ' simple.', 'grammaire', ['gramère', 'grammère'], '« Grammaire » s’écrit avec deux « m » et « aire » à la fin.'],
  [1, 'gram', '', 'Le', ' maison est belle.', 'La', ['Les', 'Un'], '« Maison » est féminin : on écrit « la maison ».'],
  [1, 'gram', 'Les ', 'enfant', ' jouent dans le jardin.', 'enfants', ['enfante', 'enfantes'], 'Après « les », le nom se met au pluriel : on ajoute un s.'],
  [2, 'gram', 'J’ai lu ', 'une exercice', ' difficile.', 'un exercice', ['une exercices', 'un exercices'], '« Exercice » est masculin : on dit « un exercice ».'],
  [1, 'conj', 'Ils ', 'mange', ' du pain.', 'mangent', ['mangeons', 'mangez'], 'Avec « ils » et un verbe en -er au présent, la fin est « -ent ».'],
  [1, 'conj', 'Hier, il a ', 'manger', ' une pomme.', 'mangé', ['mangez', 'mangeait'], 'Après « avoir » (a, ai, as…), on utilise le participe passé : « mangé ».'],
  [2, 'conj', 'Nous allons ', 'mangé', ' à la cantine.', 'manger', ['mangeons', 'mangez'], 'Après « aller », on utilise l’infinitif : « manger ».'],
  [3, 'conj', '', 'Si j’aurais', ' le temps, je viendrais.', 'Si j’avais', ['Si j’aurai', 'Si j’ai eu'], 'Après « si », on n’utilise pas le conditionnel : on prend l’imparfait.'],
  [2, 'synt', 'Je ne sais pas ', 'où est-ce qu’il', ' habite.', 'où il', ['où est il', 'où que il'], 'Dans une question indirecte, on n’inverse pas le sujet et on ne met pas « est-ce que ».'],
  [3, 'synt', 'Il faut ', 'pallier à', ' ce problème.', 'pallier', ['pallier de', 'pallier en'], '« Pallier » est un verbe qui se construit sans « à » : on pallie un problème.'],
  [1, 'rep', '', 'Puis ensuite', ', nous sommes partis.', 'Ensuite', ['Puis après', 'Et puis ensuite'], '« Puis » et « ensuite » veulent dire la même chose : c’est une redite.'],
  [1, 'rep', 'Il ', 'monte en haut', ' de l’escalier.', 'monte', ['monte vers le haut', 'monte à haut'], '« Monter » veut déjà dire aller vers le haut : « en haut » est inutile.'],
  [1, 'manque', 'Je vais ', '▢', ' école.', 'à l’', ['de l’', 'en'], 'On dit « aller à l’école » : la préposition « à » est obligatoire.'],
  [2, 'manque', 'Il ne veut ', '▢', ' venir.', 'pas', ['si', 'ne'], 'La négation a deux parties : « ne » + « pas ».'],
  [1, 'vocab', 'C’est un ', 'truc', ' très important.', 'point', ['machin', 'bidule'], '« Truc » est familier et très vague. À l’écrit, on préfère « point », « élément », « chose ».'],
  [2, 'vocab', 'Il a lu un ', 'bouquin', ' sur l’histoire.', 'livre', ['bouqui', 'bouquet'], '« Bouquin » est familier ; « livre » convient à tous les textes.'],
  [2, 'vocab', 'Il est fatigué, ', 'par contre', ' il continue.', 'en revanche', ['par ailleurs', 'en effet'], '« Par contre » est jugé familier à l’écrit : on préfère « en revanche ».'],
  [1, 'typo', 'Il mange', '  du', ' pain.', ' du', ['  du', 'du'], 'Entre deux mots, il faut une seule espace.'],
  [2, 'typo', 'Quelle heure est-', 'il?', '', 'il ?', ['il  ?', 'il?!'], 'En français, on met une espace avant « ? », « ! », « : » et « ; ».'],
  [1, 'ambigu', 'Elle a lu le mot « ', 'ksdfghj', ' » dans son cahier.', 'À vérifier dans un dictionnaire', ['C’est sûrement correct', 'Il faut juste ajouter un s'], 'Quand un mot est inhabituel, je ne le déclare pas faux : je te dis de le vérifier.'],
  [3, 'accord', 'Les fleurs que j’ai ', 'cueilli', ' sont belles.', 'cueillies', ['cueillie', 'cueillis'], 'Le COD (« que » = les fleurs) est avant « avoir » : le participe s’accorde (féminin pluriel).'],
  [2, 'accord', 'Les élèves sont ', 'parti', ' en sortie.', 'partis', ['partie', 'parties'], 'Avec « être », le participe s’accorde avec le sujet : « les élèves » → partis.'],
  [1, 'homo', 'Il ', 'à', ' mangé une pomme.', 'a', ['as', 'ah'], '« a » vient du verbe avoir (il avait). « à » est une préposition.'],
  [1, 'homo', 'Je ne sais pas ', 'ou', ' il est.', 'où', ['ou bien', 'oû'], '« où » (avec accent) indique un lieu. « ou » veut dire « ou bien ».'],
  [1, 'homo', 'Il ', 'et', ' parti hier.', 'est', ['es', 'ai'], '« est » vient du verbe être. « et » relie deux mots.'],
  [2, 'homo', '', 'Ces', ' sont mes amis.', 'Ce', ['Ses', 'C’'], '« Ce sont » : on utilise « ce » devant « sont ».'],
  [2, 'coh', 'Elle est toujours à l’heure, mais elle ', 'arrive toujours en retard', '.', 'arrive parfois en retard', ['arrive toujours à l’heure', 'est toujours à l’heure'], 'Deux idées s’opposent : on ne peut pas être « toujours à l’heure » et « toujours en retard ».'],
  [3, 'coh', 'D’une part, il aime le sport. ', 'Il est content.', '', 'D’autre part, …', ['Donc …', 'Car …'], '« D’une part » appelle « d’autre part » : l’énumération est incomplète.'],
  [1, 'ponct', 'Il est fatigué', ' mais', ' il continue.', ', mais', ['; mais', ': mais'], 'On met une virgule avant « mais » dans le milieu d’une phrase.'],
  [2, 'ponct', 'Comment vas-tu', '.', '', ' ?', [' !', ' …'], 'Une question se termine par un point d’interrogation.'],
  [2, 'amelio', 'C’est ', 'très grand', '.', 'immense', ['très très grand', 'grand grand'], 'Ce n’est pas une faute : un mot précis est parfois plus fort que « très + adjectif ».'],
  [1, 'correct', 'Les enfants ', 'jouent', ' dans le jardin.', 'Non, il est correct', ['Oui : il manque un s', 'Oui : il faut écrire « joue »'], 'Le verbe « jouer » s’écrit « jouent » avec « ils/elles » : ce mot est correct, il reste en bleu.'],
  [2, 'correct', 'Nous ', 'mangeons', ' à midi.', 'Non, il est correct', ['Oui : il faut « mangons »', 'Oui : il faut « mangez »'], 'Avec « nous », on écrit « mangeons » (le « e » garde le son [ʒ]).']
];

// ---------------------------------------------------------------- Dictées d'entraînement
const DICTEES = [
  [1, "Le chat dort sur le canapé."], [1, "Nous mangeons des pommes rouges."], [1, "Ma sœur joue dans le jardin."], [1, "Il fait beau aujourd'hui."],
  [2, "Les enfants sont arrivés à l'école après la pluie."], [2, "Elle a oublié son cahier, mais elle a retrouvé son stylo."], [2, "Hier soir, nous avons regardé un film très intéressant."],
  [2, "Où est ton livre ? Je ne le trouve plus."], [3, "Les fleurs que j'ai cueillies ce matin sont déjà fanées."], [3, "Quoiqu'il soit fatigué, il continue son travail avec courage."],
  [3, "Bien qu'elles aient beaucoup travaillé, elles ne sont pas satisfaites de leurs résultats."], [3, "Les élèves, que le professeur avait félicités, sont repartis contents."]
];

// Paires d'homophones pour la comparaison de dictée
const HOMOPHONES = [['a', 'à'], ['et', 'est'], ['ou', 'où'], ['son', 'sont'], ['ces', 'ses'], ['ces', 'ce'], ['on', 'ont'], ['la', 'là'], ['mais', 'mes'], ['sa', 'ça'], ['peu', 'peut'], ['leur', 'leurs'], ['ni', "n'y"], ['se', 'ce'], ['tous', 'tout'], ['quel', 'quelle'], ['s\'est', 'c\'est'], ['si', 's\'y'], ['sans', 's\'en'], ['ta', 't\'a'], ['quand', 'quant']];

// Phrases d'exemple pour la page d'accueil
const EXEMPLE = "Les enfant sont parti a l'ecole hier matin. Il y a beacoup de livres sur la table , mais ils ne sais pas lequel choisir. Ensuite après, ils on regardé un film tres interessant et ils ont mangé des pomme. Nous allons mangé a la cantine, parceque c'est un truc super !";
