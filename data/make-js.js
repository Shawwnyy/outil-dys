#!/usr/bin/env node
// Régénère data/communes.js et data/structures.js à partir de data/communes.txt et data/structures.json.
// Ces fichiers .js permettent à l'application de charger ses données même ouverte directement depuis un fichier (file://),
// sans serveur : les navigateurs bloquent fetch() dans ce cas, mais pas les balises <script>.
const fs = require('fs'), path = require('path');
const d = __dirname;
fs.writeFileSync(path.join(d, 'communes.js'), 'window.DYS_COM=' + JSON.stringify(fs.readFileSync(path.join(d, 'communes.txt'), 'utf8')) + ';\n');
fs.writeFileSync(path.join(d, 'structures.js'), 'window.DYS_STRUCT=' + fs.readFileSync(path.join(d, 'structures.json'), 'utf8').trim() + ';\n');
console.log('data/communes.js et data/structures.js régénérés.');
