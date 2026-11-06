# Outil Dys — V2

Plateforme **locale et privée** d'aide à l'écriture, à la lecture, à la compréhension et à l'apprentissage.
Aucun compte, aucun envoi de tes textes sur Internet (voir « Confidentialité » pour la seule exception : la dictée vocale du navigateur).

## Nouveautés (dernière mise à jour)

- **🔁 Révision des dictées** (Mes outils) : les mots ratés dans une dictée sont gardés automatiquement (dans ton navigateur seulement) avec la phrase où tu les as ratés. Quatre onglets : *Réviser mes mots* (séances de 5 à 40 mots, phrase à trous ou écoute seule, boîtes de Leitner : 10 min → 1 j → 3 j → 7 j → 14 j → 30 j — des repères choisis par l'application, pas une mesure de ta mémoire), *Dictée de texte* (6 textes originaux de niveau 1 à 3, tes erreurs, tes propres textes ou un texte collé ; lecture à voix haute avec la ponctuation dite, groupes de mots, répétition, vitesse et temps d'écriture réglables ; correction mot à mot), *Mes mots* (liste, ajout manuel, PDF, CSV, sauvegarde/import JSON) et *Progrès* (boîtes, catégories d'erreurs, rappel quotidien en fichier .ics). Les astuces (« a → avait », « sont → étaient »…) sont des repères d'école courants, pas des règles complètes. Les erreurs de l'outil Dictée (« Entraînement » et « Comparer ma dictée » avec texte de référence) alimentent aussi la révision.
- **🗺️ Région de chaque ville, département et structure** : chaque fiche indique « Département (code) · Région » ; les suggestions de villes aussi ; filtres **Région** et **Département** (18 régions + collectivités d'outre-mer), tri (distance, nom, commune, département), recherche libre par nom de région (« Corse CMP »), nouvel onglet **Par région** (nombre de structures par région et département calculé sur le fichier, 10 villes les plus peuplées par région, boutons « Chercher dans cette région / ce département / cette ville »). Table département → région : celle du fichier de la carte (13 régions + 5 DOM ; Saint-Pierre-et-Miquelon, Saint-Barthélemy, Saint-Martin, Wallis-et-Futuna, Polynésie française et Nouvelle-Calédonie sont regroupés sous « Outre-mer (collectivité) »).
- **⭐ Mon carnet étendu** : « Dans mon carnet » sur chaque fiche ; téléphone, **e-mail, site**, adresse, statut (« à contacter », « contacté », « rendez-vous pris »…), rendez-vous, notes, région détectée avec le code postal ; fiche contact **.vcf** (un contact ou tous), rendez-vous **.ics**, CSV, sauvegarde JSON + import, PDF, recherche et filtre par statut. Tout reste dans le navigateur.
- **⬇ Export CSV des résultats** de recherche (avec département et région) et bouton **🩺 Annuaire santé officiel** sur les fiches de professionnels (copie le nom puis ouvre annuaire.sante.fr, où l'adresse et le téléphone sont publiés).
- **Corrections** : curseurs des Paramètres nommés pour les lecteurs d'écran ; listes déroulantes de la recherche nommées ; texte devenu faux sur l'onglet « Où chercher ? » remplacé ; la lecture automatique d'une dictée s'arrête quand on quitte la page ; cartes « Réviser mes dictées » et « Trouver un professionnel de santé » sur l'accueil.
- **🔍 Loupe automatique sur l'Île-de-France** (carte de « Chercher près de moi ») : quand la souris passe sur l'Île-de-France (sur la carte ou sur l'encart), une fenêtre agrandie (environ ×11) suit le curseur dans les départements d'Île-de-France seulement avec les communes, le département et la région. Elle ne s'affiche pas ailleurs, ni au toucher, se range quand on zoome déjà, et se coupe avec la case « Loupe automatique sur l'Île-de-France ».
- **🔊 Lire la sélection** : sélectionne du texte n'importe où (page ou zone de texte), un bouton « 🔊 Lire » apparaît ; **Alt+R** fait la même chose ; **Échap** arrête la lecture. Utilise les voix du navigateur.
- **A− / A+** dans l'en-tête : change la taille du texte en un clic (14 à 32 px, comme dans Paramètres).
- **📖 Dictionnaire** (Mes outils) : trois onglets. *Chercher un mot* : écoute, syllabes (découpage approximatif), épeler, « à réviser », liens vers Wiktionnaire, Larousse, Le Robert, CNRTL et l'Académie ; **recherche en ligne dans le Wiktionnaire uniquement si tu coches la case** (le mot tapé est alors envoyé à fr.wiktionary.org ; suggestions et définitions lues dans la page, licence CC BY-SA). *Mots nouveaux 2026-2027* : mots cités par la presse pour les éditions 2026 et 2027 du Petit Larousse et du Petit Robert, avec la source et la date de chaque mot. *Mots qui se ressemblent* : 19 groupes (a/à, et/est, on/ont…) avec repères et petit jeu ; les erreurs peuvent être gardées dans « Réviser mes dictées ». **Limites** : aucun dictionnaire ne contient « tous » les mots ; la liste complète des nouveaux mots n'est pas fournie par les éditeurs (environ 150 par dictionnaire et par an) ; la recherche en ligne n'a pas pu être testée contre le vrai serveur Wikimedia depuis l'environnement de construction (accès bloqué) : elle a été testée avec des réponses simulées.
- **🎙️ Choisir la voix** (Lecture audio) : toutes les voix françaises du navigateur et du système (sous Windows : celles installées dans Windows), avec « Écouter » et « Choisir ». Les voix en ligne (par exemple les voix « Natural » d'Edge, qui envoient le texte à Microsoft) sont masquées par défaut ; cases pour afficher les voix en ligne et celles d'autres langues. La voix choisie sert partout (lecture, dictée, « Lire la sélection »).
- **📅 Bandeau du haut** : date, heure à la seconde (heure de ton appareil) et **une nouvelle citation chaque minute** (48 proverbes, dans un ordre mélangé). Ce sont des **proverbes traditionnels** (sans auteur connu) : aucune phrase n'est attribuée à quelqu'un. Bouton ↻ pour en voir une autre tout de suite ; désactivable dans « Mes préférences » ; masqué en mode concentration.
  - **Plus grand** : date, heure et citation sont affichées en gros (elles suivent aussi A− / A+).
  - **Définition au survol** : passe la souris sur un mot souligné en pointillés dans la citation (ou va dessus avec la touche Tab, ou touche-le sur téléphone) : une bulle donne le sens en mots simples ; un clic / Entrée le lit à voix haute. Ce sont des définitions courtes écrites pour l'outil (sens courant) ; pour un mot précis, utilise le dictionnaire.
  - **💬 Comment je me sens ?** : un bouton ouvre un petit panneau pour dire son état du moment en trois lignes : **corps** (en forme, fatigué, tendu, mal quelque part, faim/soif), **émotions** (content, calme, stressé, énervé, triste, découragé) et **tête** (concentré, motivé, dispersé, débordé, perdu). Un mot par ligne, ou aucun ; chaque mot a sa définition au survol. Des conseils simples apparaissent (pause, respirer, mode concentration, simplifier un texte). L'historique reste **sur cet appareil seulement** (copiable, effaçable). **Ce n'est ni un test, ni un diagnostic, ni un suivi médical** : si ça ne va pas ou que ça dure, il faut en parler à un adulte de confiance ou à un professionnel.
  - **Note sur 10 + courbes** : sur chaque ligne (corps, émotions, tête) on peut aussi donner une **note de 1 à 10** (1 = très mal, 10 = très bien). En bas du panneau, **« 📈 Mon évolution »** trace ces notes **par heure (24 h), jour (14 j), semaine (12 sem.), mois (12 mois) et année (5 ans)**, au choix pour le global, le corps, les émotions, la tête ou les trois ensemble. Survol / clavier (flèches) pour lire une valeur, chiffres clés (moyenne, meilleure période, plus basse) et **tableau des chiffres**. Les courbes ne montrent **que les notes réellement données** (aucune donnée inventée ni complétée ; vide tant que rien n'est noté). Tout reste dans le navigateur ; « Effacer l'historique » supprime aussi les courbes. Ce n'est pas un outil médical.
  - **Logo** : nouvelle icône (onglet du navigateur, écran d'accueil du téléphone via `manifest.webmanifest`) et logo plus grand dans l'en-tête.
- **🏠 Accueil refait** : tableau de bord par thèmes avec recherche d'outil. La carte « Astronomie et espace » n'est plus à l'accueil, remplacée par « Repérage dans l'espace » (le module Astronomie reste dans le menu « Mes matières »).
- **🔍 Loupe Île-de-France** : elle n'apparaît plus que lorsque le curseur est dans l'un des 8 départements d'Île-de-France (forme réelle du département).
- **🌐 Version en ligne (GitHub Pages)** : l'application est un site statique, elle peut donc être publiée telle quelle (fichier `.nojekyll` fourni). En ligne, tout marche comme en local **sauf l'OCR** (il demande Tesseract, installé sur ton ordinateur, et le petit serveur `node server.js`). Tes mots ratés, ton carnet et tes textes restent dans **le navigateur de chaque visiteur** (localStorage) ; rien n'est envoyé au site. Attention : un site GitHub Pages gratuit est **public** (dépôt public) et partage le même « domaine » (`pseudo.github.io`) avec tes autres sites Pages.
- **Affichage corrigé** : le titre « Bienvenue dans Outil Dys » ne s'écrit plus à la verticale quand le menu est masqué ou en mode concentration ; sur téléphone, le menu est replié au départ et ne repousse plus le contenu ; en-tête et tableaux ne débordent plus aux réglages de police extrêmes.

### Ce qui n'est PAS fait, et pourquoi

- **Pas de photo des soignants.** Ce sont des personnes privées : rechercher et rassembler leur photo reviendrait à constituer un profil sur elles, sans leur accord. L'extrait RPPS ne contient d'ailleurs aucune photo. Les infos de contact (téléphone, e-mail, site) ne sont pas dans l'extrait RPPS utilisé : utilise le bouton « Annuaire santé officiel » puis note-les dans ton carnet.
- **Téléphone / e-mail / site des professionnels du RPPS : toujours absents.** L'environnement de construction n'a pas accès aux annuaires ouverts (annuaire.sante.fr, data.gouv.fr : connexion refusée), donc rien n'a pu être ajouté. Plutôt que d'inventer, le carnet te laisse les compléter.

## Nouveautés de la V2

- **Bug corrigé : la page ne remonte plus en haut toute seule.** Cocher une case (profil, préférences, couleurs, documents…) redessinait toute la page puis la remontait ; maintenant la position et le focus clavier sont conservés. Seul un changement de page revient en haut.
- **Logo Humanix** en haut à droite de l'application (adapté au téléphone), dans l'onglet du navigateur et en haut de chaque page des rapports PDF.
- **Correcteur renforcé** : « he m'appel jack » → « je m'appelle Jack », « ils ne sais pas » → « ils ne savent pas », « des pomme » → « des pommes », plus d'alerte « de qui parle-t-on ? » sur « Il y a… ».
- **Notes d'exposé et PDF de diapositives** : ils utilisent le texte corrigé et sont plus naturels.
- **Repérage dans l'espace** (Mes modes d'apprentissage) : mises en situation pour s'orienter — gauche/droite d'un personnage (avec « me mettre à sa place »), suivre un trajet pas à pas, quadrillage (A–F / 1–6), points cardinaux, mots de position dessinés. Situations aléatoires, réponses calculées, entraînement facultatif sans diagnostic.
- **Trouver un professionnel (50 types)** : catalogue complet (santé, éducatif et social, structures, associations) et « Chercher près de moi » avec ville (suggestions parmi 34 969 communes (populations INSEE)), type, distance et façon de consulter. **Base intégrée (voir plus bas : 15 772 structures, 101 départements)** : à l'origine, établissements du fichier officiel **FINESS** pour **23 départements** (07, 09, 11, 12, 13, 15, 19, 24, 30, 31, 32, 34, 40, 43, 46, 47, 48, 64, 65, 66, 81, 82, 84) — CMP, CMPP, CAMSP, SESSAD, IME, ITEP, MDPH, centres médico-scolaires, centres de santé, maisons de santé, PMI, hôpitaux, sites des CHU — plus la **liste nationale des CHU / CHR** (hopital.fr, page du 07/04/2015) pour les autres départements. **Pas de professionnels libéraux** (orthophonistes, psychologues, médecins…) : ils sont des centaines de milliers et l'annuaire officiel n'était pas téléchargeable ; l'application l'explique et renvoie vers Santé.fr. Le genre et la visio ne sont pas renseignés pour les structures (le critère le dit) ; seuls les SESSAD sont reconnus comme se déplaçant. **Carte officielle** (tracés IGN Admin Express 2018, noms et codes INSEE 2018, simplifiés) : régions colorées, départements numérotés, **survol** = département + région + commune la plus proche, **clic** = position, double-clic = zoom ; **loupe Île-de-France** (8 départements agrandis, cliquables) ; **encarts outre-mer** (Guadeloupe, Martinique, Guyane, La Réunion, Mayotte, hors échelle ; Saint-Barthélemy et Saint-Martin non représentées). Panneau « Ton territoire » : MDPH, direction départementale de l'Éducation nationale et ARS (sans adresses). Bouton « Je recherche ! ». Position jamais enregistrée.
- **Trouver un professionnel de santé** (Mon espace) : qui fait quoi (médecin traitant, psychologue, neuropsychologue, orthophoniste, ergothérapeute/psychomotricien, neurologue, psychiatre, CMP, CMPP, CHU, école/MDPH), filtre selon ce que tu cherches, liens vers les annuaires officiels, préparation de rendez-vous (PDF) et carnet de contacts privé. **La base couvre aujourd'hui 101 départements (structures FINESS + CMP vérifiés) et 336 728 professionnels du RPPS chargés par département** ; rien n'est inventé. Aucun diagnostic.
- **Astronomie** : Voyage guidé (planète par planète), Phases de la Lune, Saisons (durée du jour selon la latitude), Éclipses.

## Démarrer

Prérequis : [Node.js](https://nodejs.org) 18 ou plus. Aucune installation de paquet n'est nécessaire.

```bash
node server.js
```

Puis ouvre <http://127.0.0.1:8765> dans Chrome, Edge ou Firefox.
(Le serveur n'écoute que sur ta machine : `127.0.0.1`. Port modifiable : `PORT=9000 node server.js`.)

Pourquoi un petit serveur ? PDF.js est un module JavaScript qui ne se charge pas depuis un fichier ouvert directement (`file://`).
Le serveur sert aussi l'OCR (voir plus bas).

## Ce qui fonctionne vraiment (testé)

| Module | État |
|---|---|
| Correcteur coloré (15 catégories, couleurs configurables, mots / groupes / phrases, légende interactive, correction automatique avant/après) | ✅ correcteur **à règles** (voir limites) |
| Analyse PowerPoint (PPTX) : texte, lisibilité (taille, contraste), titres, charge, polices, débordements, images sans description | ✅ |
| Correction PPTX en 3 modes, acceptation/refus de chaque correction, **export PPTX fidèle** (seules les diapositives modifiées sont réécrites ; images, tableaux, graphiques, animations, transitions, notes sont recopiés à l'identique) | ✅ vérifié avec python-pptx et LibreOffice |
| PDF / ODP / images de diapositives | ⚠️ analyse du texte seulement ; export = PDF du texte corrigé (avec avertissement), jamais d'images aplaties |
| Analyse de cours, « Comprendre ce passage », simplification (9 actions × 3 niveaux), lisibilité /10, fiches, flashcards, cartes mentales, quiz, textes à trous | ✅ règles + glossaire intégré de ~110 mots scolaires |
| Lecture à voix haute avec surlignage, syllabes (approximatives), règle de lecture | ✅ (voix du navigateur) |
| Dictée : comparaison et entraînement | ✅ ; la saisie vocale utilise la reconnaissance du navigateur |
| Assistant de rédaction (10 modes, pas à pas) | ✅ |
| OCR PNG / JPG / WEBP avec sélection de zone | ✅ si `tesseract` est installé sur la machine (sinon indiqué comme indisponible) |
| Apprendre les couleurs (exercices progressifs) | ✅ |
| Tableau de bord, historique, exports PDF | ✅ |
| Rapports PDF (phrase, texte, document, cours, PowerPoint, dictée, série d'exercices) avec légende complète | ✅ |
| Préparer mon exposé (notes orales, lecture, temps estimé, fiche de révision PDF) | ✅ |
| Repérage dans l'espace : gauche/droite, trajets, quadrillage, points cardinaux, mots de position | ✅ réponses vérifiées par un calcul indépendant (104 questions) |
| Trouver un professionnel de santé : fiches, annuaires officiels, préparation de rendez-vous, carnet privé | ✅ 50 types décrits ; carte officielle avec survol, loupe Île-de-France et outre-mer ; 34 969 communes (populations INSEE) ; base de 14 659 structures sur les 101 départements (FINESS), testée région par région contre un calcul indépendant des distances (72 contrôles, 0 écart) ; professionnels du RPPS (sans téléphone ni e-mail), pas de diagnostic |
| Profils d'apprentissage facultatifs + adaptations réelles (police, espacement, règle, interface calme, grandes cibles…) | ✅ aucun diagnostic, aucune adaptation présentée comme universelle |
| Mathématiques visuelles : calcul posé pas à pas, droite numérique, fractions, valeur de position + nombres en lettres, tables, unités | ✅ calculs vérifiés |
| Astronomie : voyage guidé, système solaire animé, fiches, comparaison, quiz, poids, lumière, phases de la Lune, saisons, éclipses | ✅ données **NASA** (planètes : 18 mars 2025 ; Lune : 11 janvier 2024 ; Terre : 15 novembre 2024), consultées le 5 novembre 2026 |
| Géographie : repères, latitude/longitude, capitales, tes propres données | ✅ |
| Histoire : repères, frise à l'échelle, siècles et durées | ✅ |
| Langues, culture générale, autres : cartes personnelles, entraînement | ✅ contenu fourni par toi |
| Sciences, informatique, défis (HPI) | ✅ compte rendu guidé, conversions binaire/hexa, suites, nombres premiers |

## Ce qui n'existe PAS (et n'est pas simulé)

- **Limites connues du correcteur** : il ne repère pas toutes les fautes (par ex. « Venus et très chaude » ou « Les planète » passent encore). Relis toujours : il propose, tu décides.
- **Base de structures : limites** : (1) hors des 23 départements de l'extrait d'avril 2026 (départements 07, 09, 11, 12, 13, 15, 19, 24, 30, 31, 32, 34, 40, 43, 46, 47, 48, 64, 65, 66, 81, 82 et 84 ; liste dans `meta.dep2026` de `data/structures.json`), les structures viennent de l'**extraction nationale FINESS du 20 janvier 2017** : liste ancienne, des structures ont pu fermer, déménager ou changer de nom (la fiche le dit). (2) Les téléphones viennent aussi de cette extraction de 2017 (« à vérifier avant d'appeler ») ; il n'y a pas d'horaires. (3) 1 320 CMP ont été vérifiés en octobre 2026 sur les sites de leurs établissements (mention « pour enfants » ou « pour adultes ») ; 563 d'entre eux n'ont pas d'adresse géolocalisée : leur position est celle du centre de la commune (indiqué sur la fiche). (4) Les MDPH ne sont listées que pour 23 départements (aucune source de contacts nationale n'a pu être obtenue). (5) Aucun CMP n'apparaît en Martinique et aucun CMPP à Mayotte : ils sont absents du fichier FINESS utilisé, pas forcément de la réalité. (6) Saint-Pierre-et-Miquelon, Saint-Martin et Saint-Barthélemy ne sont pas représentés. Les noms du fichier FINESS n'ont pas d'accents dans la source : restaurés pour les mots courants. Noms de communes de 2018 (des fusions ont eu lieu depuis).
- **Pas de dictionnaire français complet** : le correcteur détecte un grand nombre de fautes fréquentes, mais pas toutes, et il peut se tromper. Il le dit.
- **Pas de carte du monde, de drapeaux, de cartes muettes, de populations** : aucun jeu de données local vérifié et daté. Tu peux importer tes propres données (avec année et source).
- **Pas de frise historique préremplie** ni de dates d'événements : aucune base d'événements n'est fournie.
- **Pas d'import audio / vidéo**, pas de transcription locale.
- **Pas d'images NASA** (aucune fournie localement), **pas de constellations ni de missions spatiales** : aucune base vérifiée et datée n'est fournie, donc rien n'est inventé. Les dates d'éclipses ne sont pas données (il faut un almanach à jour).
- Tesseract.js, Mammoth.js, jsPDF, JSZip, PptxGenJS : non utilisés (le téléchargement des paquets était bloqué dans l'environnement de construction). Remplacés par : `tesseract` système, lecteur ZIP intégré (API du navigateur), PDF.js, pdf-lib.
- Polices OpenDyslexic / Lexend : non fournies (la police est utilisée si elle est installée sur l'ordinateur).
- Les aperçus de diapositives sont **simplifiés** (pas le rendu exact de PowerPoint).
- Le texte contenu dans des images, graphiques et SmartArt n'est pas analysé.

## Confidentialité

- Tout est calculé sur ton ordinateur ; les préférences, profils et documents sont gardés dans le navigateur (`localStorage`), jamais envoyés ailleurs. « Effacer toutes mes données » est dans les paramètres.
- **Exception : la saisie vocale** (dictée). Chrome et Edge envoient l'audio à un service en ligne pour le transcrire. C'est indiqué dans l'application.
- Les liens vers la source NASA s'ouvrent dans un nouvel onglet et ne sont suivis que si tu cliques.

## Activer l'OCR

```bash
# Debian / Ubuntu
sudo apt install tesseract-ocr tesseract-ocr-fra
# macOS
brew install tesseract tesseract-lang
```

Relance `node server.js` : l'accueil indique « OCR : disponible ».

## Structure

```
server.js        serveur local (fichiers statiques compressés gzip/brotli et mis en cache par ETag, /api/status, /api/ocr)
index.html       coque de l'application
css/style.css    thèmes, adaptations, mise en page
js/data.js       catégories, dictionnaires, glossaire, exercices
js/corrector.js  correcteur à règles
js/app.js        noyau : préférences, profils, navigation, surlignage, voix
js/tools.js      lecture, simplification, lisibilité, dictée, cours, fiches, rédaction, OCR
js/report.js     rapports PDF, tableau de bord, exercices, concentration, modes
js/slides.js     lecteur/écriveur ZIP, PPTX, analyse et export, exposé
js/subjects.js   matières, cartes personnelles, mode universel
js/revision.js   révision des dictées (mots ratés, boîtes de Leitner, dictée de texte, rappel .ics)
js/maths.js      mathématiques visuelles (fonctions pures testables avec Node)
js/espace.js     astronomie (données NASA) et défis
js/repere.js     repérage dans l'espace (mises en situation)
js/sante.js      trouver un professionnel de santé (France)
js/geo.js        fonds de carte : départements et régions (IGN / INSEE 2018), généré
data/communes.txt  34 969 communes actuelles avec population légale INSEE + 493 anciennes communes fusionnées (population 0)
data/structures.json  15 772 lignes (dont 49 SMUR ignorées au chargement) (FINESS 2026 + 2017, CMP vérifiés 2026, CHU/CHR) pour la recherche
libs/            pdf.js, pdf-lib (+ licences)
img/humanix.png  logo affiché dans l'en-tête et les PDF
```

## Sources de la rubrique santé

- Structures : fichier FINESS (licence ouverte). (a) Extrait d'avril 2026 publié dans le dépôt GitHub [stluria/sante-territoire-rncp](https://github.com/stluria/sante-territoire-rncp) (23 départements, coordonnées GPS). (b) Extraction nationale Etalab du 20 janvier 2017 (97 490 structures, coordonnées en Lambert-93 / UTM convertis dans notre script et comparés à l'extrait de 2026 : écart médian 35 m sur 2 178 points communs), récupérée dans le dépôt [scossin/parcoursdesoins](https://github.com/scossin/parcoursdesoins). (c) CMP vérifiés en octobre 2026 : dépôt [UbiCura/ubicura](https://github.com/UbiCura/ubicura), fichier `contenus/structures_verifiees.csv` (Licence Ouverte 2.0 pour les données ; chaque ligne renvoie vers la page de l'établissement). CHU / CHR : [hopital.fr](https://www.hopital.fr/Nos-Missions/L-hopital-au-sein-de-l-organisation-generale-de-la-sante/Les-etablissements-publics-de-sante/Les-centres-hospitaliers-regionaux-universitaires) (Fédération hospitalière de France, dernière modification 07/04/2015), remplacée par les sites CHR du FINESS là où ils existent.
- Communes actuelles, centres et populations : fichier `communes.json` du dépôt [FraidFraid/France-Monitor](https://github.com/FraidFraid/France-Monitor) (licence MIT pour le code ; données issues de geo.api.gouv.fr, « populations légales INSEE », fichier lu le 20 octobre 2026 ; le millésime de population n'est pas précisé dans le fichier). Les 34 969 communes sont affichées sur la carte par ordre de population (les grandes villes d'abord, les villages en zoomant ; Ctrl + molette, boutons ＋ / －, glisser et flèches pour naviguer). Les 493 anciennes communes du COG 2018 qui n'existent plus sous ce code sont gardées pour la recherche par nom, sans population.
- Contacts d'une fiche : adresse et coordonnées GPS (FINESS ; approximatives quand elles viennent du centre de la commune), téléphone (FINESS, janv. 2017 : à vérifier), site (uniquement la page source des CMP vérifiés). **Aucun e-mail** : les fichiers officiels utilisés ne le publient pas ; un lien de recherche web (ouvert seulement au clic) aide à le trouver.
- **Professionnels (nom, prénom, profession, lieu d'exercice, commune)** : répertoire RPPS (Annuaire santé, licence ouverte) tel que relayé par le dépôt [Abend-core/AbSante](https://github.com/Abend-core/AbSante) (extrait du 27 septembre 2026), un fichier par département dans `data/pros/` (chargé seulement quand tu cherches un de ces types : orthophoniste, psychologue/neuropsychologue, psychiatre, pédopsychiatre, neurologue, ergothérapeute, psychomotricien, orthoptiste, médecin généraliste, pédiatre ; 336 728 lignes, 101 départements + DOM/COM). Résultats testés contre un calcul indépendant dans 18 villes (54 contrôles, 0 écart). **Limites** : cet extrait n'a **ni téléphone, ni e-mail, ni site, ni adresse postale** (seulement le nom du lieu d'exercice et sa position) ; chaque fiche l'indique et propose une recherche web (ouverte seulement au clic). Le RPPS ne distingue pas les neuropsychologues ; le genre n'est pas déduit des prénoms ; un professionnel qui exerce à plusieurs endroits apparaît une fois par lieu. Les données peuvent être en retard sur la réalité. Ce sont des données publiques : à utiliser uniquement pour trouver un soin. Régénération : `python3 bpros.py` (script de construction conservé hors du paquet).
- Chargement sans serveur : `data/communes.js` et `data/structures.js` (générés par `node data/make-js.js`) sont lus par des balises `<script>` ; l'application charge donc sa base même ouverte directement depuis un fichier (les PDF et l'OCR demandent toujours `node server.js`).
- **Recherche libre** (au-dessus du choix du type) : un champ cherche dans le nom, le prénom, l'adresse, la ville, le lieu d'exercice, le type et les numéros FINESS / RPPS, mots dans n'importe quel ordre, sans accents (« CMP Anduze », « rue Florian », « Margaux Mazel »). Un numéro de téléphone (au moins 4 chiffres, avec ou sans espaces, « +33 » accepté) cherche dans les téléphones des structures. La limite de distance n'est pas appliquée pendant une recherche libre ; les professionnels du RPPS sont cherchés dans les départements chargés autour de la position, ou dans toute la France si la case est cochée (environ 3 s et 230 Mo de mémoire). Rien n'est envoyé sur Internet.
- **Classement par le nom** : certaines structures sont mal rangées dans FINESS (ex. le CMP d'Anduze, « Centre Medoco Psychologique… », rangé comme établissement de santé) ; elles sont reclassées d'après leur nom (CMP : +524 structures ; psychiatrie : CATTP, hôpitaux de jour, SMPR, hôpitaux spécialisés ; MDA ; PAEJ). Nouveaux types : « Psychiatrie… » (2 185 structures), MDA (41) et PAEJ (4). **Ces deux dernières listes sont partielles** : elles viennent d'une recherche par nom dans FINESS (2017) et dans les lieux déclarés au RPPS ; aucune liste nationale vérifiée n'a pu être obtenue. La fiche de la Maison des adolescents du Gard (34 ter rue Florian, Nîmes, 04 66 05 23 46) reprend l'adresse et le téléphone que tu as indiqués (capture d'une fiche Google du 5 novembre 2026) ; son lieu d'exercice vient du RPPS.
- Une « Nora Lopez » n'existe pas dans l'extrait RPPS utilisé (0 résultat sur toutes les professions) : l'application ne la trouve donc pas, et n'en invente pas.
- Fonds de carte et communes : dépôt « france-geojson » de Grégoire David (licence ouverte) — tracés IGN Admin Express (édition 2018), noms et codes INSEE (COG, millésime 2018), simplifiés ; projection de Lambert calculée dans l'application. Annuaire à importer : [Annuaire santé Ameli](https://www.data.gouv.fr/fr/datasets/annuaire-sante-ameli/) (Assurance Maladie, licence ouverte 2.0 ; page consultée le 5 novembre 2026, dernière mise à jour du jeu de données le 2 novembre 2026).

- Santé.fr (Service public d'information en santé) : [annuaire](https://www.sante.fr/categories), [3114](https://www.sante.fr/le-numero-national-de-prevention-du-suicide-0) (gratuit, 24 h/24, 7 j/7 ; page du 05/09/2023), [CMP](https://www.sante.fr/node/6470929) (page du 07/11/2022). 15 (SAMU) et 112 sont les numéros d'urgence.
- Les règles de remboursement changent : l'application renvoie vers ameli.fr au lieu d'afficher des montants.

## Source des données scientifiques

NASA, *Planetary Fact Sheet* (NSSDCA) — <https://nssdc.gsfc.nasa.gov/planetary/factsheet/index.html> —
dernière mise à jour affichée par la NASA : 18 mars 2025 ; consultée le 5 novembre 2026.
Lune : [Moon Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/moonfact.html) (période synodique 29,53 j ; inclinaison orbitale 5,145° ; mise à jour 11 janvier 2024). Terre : [Earth Fact Sheet](https://nssdc.gsfc.nasa.gov/planetary/factsheet/earthfact.html) (inclinaison de l'axe 23,44° ; mise à jour 15 novembre 2024).
La durée du jour est une approximation astronomique standard, pas un almanach.
Le nombre de lunes évolue avec les découvertes : vérifie une source récente. La vitesse de la lumière (299 792,458 km/s) est exacte par définition du mètre.


## Mise à jour : en-tête, zoom, repérage, recherche

- **En-tête et onglet** : le titre de l'onglet commence maintenant par « Outil Dys — … » (visible même si l'onglet est étroit). Nouveau logo avec numéro de version dans l'adresse des icônes pour forcer le navigateur à les recharger. L'en-tête fonctionne du zoom 100 % à 500 % du navigateur : sur un écran peu haut (zoom 150 % et plus) il n'est plus collé en haut, il défile avec la page ; sous 900 px, la recherche passe sur sa propre ligne.
- **Carte, zoom uniquement en Île-de-France** : l'encart fixe « Loupe Île-de-France » est caché par défaut. La loupe ne s'affiche que lorsque la souris entre dans un département d'Île-de-France (forme réelle du département), reste visible sous l'en-tête et ne sélectionne plus le texte de la carte. Case « Encart fixe Île-de-France » pour le remettre.
- **Repérage dans l'espace → Mises en situation** : plan vu d'en haut (ta chambre, la classe, la cuisine, le parc). Tu es le rond « Toi », la flèche montre où tu regardes. Quatre jeux : « Où est… ? », « Je me retourne » (demi-tour, quart de tour), « Que vois-tu ? », « Quel chemin ? ». Toutes les réponses sont **calculées à partir du plan** (jamais écrites à la main) ; aide facultative qui colorie devant / derrière / gauche / droite ; consigne lue à voix haute ; pas de chronomètre. Vérifié sur 100 questions tirées au hasard avec un calcul indépendant.
- **Astronomie / NASA retirée des menus** (accueil, « Toutes mes matières », liens HPI). Le module reste dans le code (`?astro=1` dans l'adresse pour le revoir).
- **Recherche dans l'en-tête** (touche **/** ou **Ctrl+K**) : trouve un **outil** et des **mots**. Mots déjà dans l'outil (mots nouveaux 2026-2027, mots qui se ressemblent, mots des proverbes, mes mots à réviser), puis **tous les autres mots** via le Wiktionnaire en ligne : un clic sur « 🌐 Définition en ligne » envoie ce mot (et seulement lui) à fr.wiktionary.org. Rien n'est envoyé tant qu'on ne clique pas, sauf si l'option « Autoriser la recherche en ligne » du dictionnaire est cochée. Aucun dictionnaire ne contient « tous » les mots : le Wiktionnaire est le plus large des dictionnaires libres, mais il n'est ni officiel ni fini. Le dictionnaire a aussi ce bouton en un clic.

## Mise à jour : définitions au survol dans toutes les pages

- **Un outil** (menu, tuiles de l'accueil, cartes des matières) : passe la souris dessus — ou arrive dessus avec la touche Tab — et une bulle dit à quoi il sert (par exemple « 🧭 Repérage dans l’espace »). Les descriptions sont écrites à la main dans `js/survol.js` (`DESC`) ; pour les modes « dys », elles rappellent que c'est une adaptation, pas un diagnostic.
- **Un mot du texte** (n'importe quelle page) : passe la souris dessus une demi-seconde. D'abord le dictionnaire de l'outil (vocabulaire de l'école et du repérage, mots nouveaux 2026-2027, mots des citations). Pour tous les autres mots : le Wiktionnaire, **seulement si « Autoriser la recherche en ligne » est coché dans le Dictionnaire** ; sinon rien ne part sur internet.
- **Sur téléphone / tablette** (pas de survol) : sélectionne un mot puis touche **📖 Définition** (à côté de « 🔊 Lire »). Le mot s'ouvre dans la recherche de l'en-tête ; l'envoi au Wiktionnaire ne se fait qu'au clic.
- Se désactive dans Réglages (« Définitions au survol »). Les champs de saisie, les zones de texte et les graphiques ne déclenchent pas de bulle.
- **Astronomie / NASA** : plus aucun menu, tuile ni texte n'y renvoie. Il ne reste que **Repérage dans l’espace**. L'ancienne adresse `#/espace` renvoie vers lui ; le code du module reste dans `js/espace.js` (caché) mais n'apparaît nulle part.

## Mise à jour V2.1 : corrections et nouvelles fonctions

**Corrections**
- Lien cassé de « Mes besoins et préférences » (« Voir mes modes d’apprentissage ») : il renvoie maintenant vers « Apprendre autrement ».
- Thème sombre : textes illisibles corrigés (boutons rouges « Effacer / Remettre à zéro », cartes cliquables de « Apprendre autrement », addition posée de « Mathématiques »).
- Cases à cocher, curseurs, champs de date et boutons « Choisir un fichier » agrandis (cibles tactiles de 24 px minimum).
- Correcteur : plus de faux avertissement sur « avec nous », « chez vous », « sur elle » ; nouvelles erreurs repérées : « tu à » → « tu as », « je vais a la plage » → « à la », « c est / j ai / l école » sans apostrophe.
- Citation du bandeau : les guillemets « » restent collés au texte (espaces insécables).
- Recherche de l'en-tête : Échap ferme la liste sans vider le champ.
- Nettoyage : fichiers de test (`undefined/`, `lens-idf.png`) retirés du dépôt ; `package.json` complété (`npm start`).

**Nouvelles fonctions** (toutes locales ; rien ne part sur internet)
- ⭐ **Favoris** : bouton « ☆ Favori » à côté du titre de chaque page ; l'accueil montre « Reprendre », « Mes favoris » et « Récemment ouverts ». Le champ de recherche vide les propose aussi.
- 📖 **Mot du jour** (bas de l'accueil) : un mot nouveau du Petit Larousse / Petit Robert 2027 avec sa source, choisi d'après la date.
- 💾 **Sauvegarde et restauration** (Paramètres) : télécharge un fichier `.json` avec toutes tes données, et restaure-le (le fichier est vérifié : seules les clés `dys.*` valides sont acceptées ; confirmation avant de remplacer).
- 📴 **Mode hors ligne** : `sw.js` garde les fichiers de l'outil dans le navigateur (réseau d'abord : tu as toujours la dernière version quand internet est là). Disponible avec `node server.js` ou la version en ligne, pas en ouvrant `index.html` directement.
- 🎨 **Deux nouveaux thèmes** : « Crème » (fond papier) et « Contraste élevé » (noir et jaune).
- 🧘 **Réduire les animations** (Paramètres), et respect du réglage « réduire les animations » du système.
- ⌨️ **Aide des raccourcis** : touche `?` (ou bouton dans Paramètres).
- ⏸ **Pause / Reprendre** dans « Lecture audio ».
- 🖨️ **Impression** : Ctrl+P masque le menu et les boutons, texte noir sur blanc, adresses des liens affichées.
- ℹ️ **À propos** (Paramètres) : version, limites honnêtes, lien du code.

## Mise à jour V2.2 : Dictée orale et Dactylographie

**🎧 Dictée orale (Mes outils)** : un narrateur (la voix du navigateur, au choix dans la page) lit le texte en entier, puis groupe de mots par groupe de mots (≤ 9 mots) en disant la ponctuation (« virgule », « point »…), puis le relit. 12 textes originaux écrits pour l'outil (3 niveaux indicatifs, pas un programme officiel) ou « Mon propre texte ». Réglages : vitesse, temps pour écrire, ponctuation dite ou non, enchaînement automatique ou « Suivant ». Boutons : Répéter, Précédent, Suivant, Pause, Arrêter, Tout relire. La personne écrit sans voir le texte (correcteur du navigateur coupé, brouillon gardé). « J'ai terminé » donne : note indicative /20 (1 point par faute, 0,5 pour un accent, une majuscule ou une ponctuation), % de mots justes, la dictée avec les fautes marquées, le tableau faute par faute (ta version / correction / type / pourquoi), des conseils par type de faute, le texte exact (à réécouter), l'ajout des mots ratés à « Réviser mes dictées », et un historique local.

**⌨️ Dactylographie (Mes outils)** : exercices (rangée de repos, mots, mots avec accents, phrases, un texte, mon texte, chrono 1 minute). Chrono dès la première touche, texte coloré lettre par lettre (juste / faux / lettre à taper, avec un fond plein pour les fautes : pas seulement la couleur), coller désactivé. Résultat : vitesse nette et brute (1 mot = 5 caractères), précision, retours en arrière, correction détaillée, touches à retravailler et bouton « S'entraîner sur ces touches », historique et courbe de progression locale. Option pour cacher le chrono (moins de pression). Pas de classement.

**Comparateur de dictée amélioré** (`Dict.align`) : quand plusieurs mots faux se suivent, chaque mot est associé au mot attendu le plus proche (« baton » → « bâton », « a » → « à ») au lieu d'être listé « oublié » + « en trop ».
