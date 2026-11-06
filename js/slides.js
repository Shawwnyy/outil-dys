/* Outil Dys — ZIP maison, lecture/modification PPTX, analyse de diapositives, export fidèle, « Préparer mon exposé ». Local. */
'use strict';

// ====================================================================================================  ZIP (API natives du navigateur)
const Zip = (() => {
  const T = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; T[n] = c >>> 0; }
  const crc32 = u => { let c = 0xFFFFFFFF; for (let i = 0; i < u.length; i++) c = T[(c ^ u[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
  const stream = async (u, Ctor, fmt) => { const s = new Blob([u]).stream().pipeThrough(new Ctor(fmt)); return new Uint8Array(await new Response(s).arrayBuffer()); };
  const dec = new TextDecoder('utf-8'), enc = new TextEncoder();
  async function read(file) {
    const buf = new Uint8Array(await file.arrayBuffer()); const dv = new DataView(buf.buffer); let e = -1;
    for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) if (dv.getUint32(i, true) === 0x06054b50) { e = i; break; }
    if (e < 0) throw new Error("Ce fichier n'est pas une archive ZIP valide (fichier abîmé ou protégé ?).");
    const n = dv.getUint16(e + 10, true); let p = dv.getUint32(e + 16, true); const entries = [];
    for (let k = 0; k < n; k++) {
      if (dv.getUint32(p, true) !== 0x02014b50) throw new Error('Archive illisible.');
      const o = { verMade: dv.getUint16(p + 4, true), verNeed: dv.getUint16(p + 6, true), flags: dv.getUint16(p + 8, true), method: dv.getUint16(p + 10, true), time: dv.getUint16(p + 12, true), date: dv.getUint16(p + 14, true), crc: dv.getUint32(p + 16, true), csize: dv.getUint32(p + 20, true), usize: dv.getUint32(p + 24, true), intAttr: dv.getUint16(p + 36, true), extAttr: dv.getUint32(p + 38, true) };
      const nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), lo = dv.getUint32(p + 42, true);
      o.name = dec.decode(buf.subarray(p + 46, p + 46 + nl)); const lnl = dv.getUint16(lo + 26, true), lel = dv.getUint16(lo + 28, true); const ds = lo + 30 + lnl + lel; o.data = buf.subarray(ds, ds + o.csize); entries.push(o); p += 46 + nl + el + cl;
    }
    return { entries, map: new Map(entries.map(x => [x.name, x])) };
  }
  const bytes = async en => en.method === 0 ? en.data : await stream(en.data, DecompressionStream, 'deflate-raw');
  const text = async en => dec.decode(await bytes(en));
  async function write(entries) {
    const parts = [], cen = []; let off = 0;
    for (const en of entries) {
      const nb = enc.encode(en.name); const flags = (en.flags & ~8) | (/[^\x00-\x7f]/.test(en.name) ? 0x800 : 0); const lh = new DataView(new ArrayBuffer(30));
      lh.setUint32(0, 0x04034b50, true); lh.setUint16(4, en.verNeed || 20, true); lh.setUint16(6, flags, true); lh.setUint16(8, en.method, true); lh.setUint16(10, en.time, true); lh.setUint16(12, en.date, true); lh.setUint32(14, en.crc, true); lh.setUint32(18, en.csize, true); lh.setUint32(22, en.usize, true); lh.setUint16(26, nb.length, true); lh.setUint16(28, 0, true);
      parts.push(new Uint8Array(lh.buffer), nb, en.data);
      const ch = new DataView(new ArrayBuffer(46)); ch.setUint32(0, 0x02014b50, true); ch.setUint16(4, en.verMade || 20, true); ch.setUint16(6, en.verNeed || 20, true); ch.setUint16(8, flags, true); ch.setUint16(10, en.method, true); ch.setUint16(12, en.time, true); ch.setUint16(14, en.date, true); ch.setUint32(16, en.crc, true); ch.setUint32(20, en.csize, true); ch.setUint32(24, en.usize, true); ch.setUint16(28, nb.length, true); ch.setUint16(36, en.intAttr || 0, true); ch.setUint32(38, en.extAttr || 0, true); ch.setUint32(42, off, true);
      cen.push(new Uint8Array(ch.buffer), nb); off += 30 + nb.length + en.data.length;
    }
    const cs = cen.reduce((a, b) => a + b.length, 0); const eo = new DataView(new ArrayBuffer(22)); eo.setUint32(0, 0x06054b50, true); eo.setUint16(8, entries.length, true); eo.setUint16(10, entries.length, true); eo.setUint32(12, cs, true); eo.setUint32(16, off, true);
    return new Blob([...parts, ...cen, new Uint8Array(eo.buffer)]);
  }
  async function replaced(en, str) { const u = enc.encode(str); const c = await stream(u, CompressionStream, 'deflate-raw'); return { ...en, method: 8, crc: crc32(u), csize: c.length, usize: u.length, data: c, flags: en.flags & ~8 }; }
  const xmlDoc = s => { const d = new DOMParser().parseFromString(s, 'application/xml'); if (d.getElementsByTagName('parsererror').length) throw new Error('XML illisible.'); return d; };
  const NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  async function docxText(file) {
    const z = await read(file); const en = z.map.get('word/document.xml'); if (!en) throw new Error('Ce DOCX ne contient pas word/document.xml.'); const d = xmlDoc(await text(en)); const out = [];
    for (const p of d.getElementsByTagNameNS(NS_W, 'p')) { let t = ''; const st = p.getElementsByTagNameNS(NS_W, 'pStyle')[0]; const sv = st ? st.getAttributeNS(NS_W, 'val') || st.getAttribute('w:val') || '' : ''; const hm = /^(?:Heading|Titre)(\d)/i.exec(sv);
      for (const n of p.getElementsByTagName('*')) { if (n.localName === 't') t += n.textContent; else if (n.localName === 'tab') t += ' '; else if (n.localName === 'br') t += '\n'; }
      if (t.trim()) out.push((hm ? '\n' + '#'.repeat(+hm[1]) + ' ' : '') + t); else out.push(''); }
    return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  async function odtText(file) {
    const z = await read(file); const en = z.map.get('content.xml'); if (!en) throw new Error('Ce fichier ODT ne contient pas content.xml.'); const d = xmlDoc(await text(en)); const out = [];
    const walk = n => { for (const c of n.children) { if (c.localName === 'h') out.push('\n# ' + c.textContent); else if (c.localName === 'p') out.push(c.textContent); else walk(c); } }; walk(d.documentElement); return out.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  return { read, bytes, text, write, replaced, xmlDoc, docxText, odtText };
})();

// ====================================================================================================  PPTX
const NS_A = 'http://schemas.openxmlformats.org/drawingml/2006/main', NS_P = 'http://schemas.openxmlformats.org/presentationml/2006/main', NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const kids = (el, ns, ln) => [...el.children].filter(c => c.namespaceURI === ns && c.localName === ln);
const kid = (el, ns, ln) => el && [...el.children].find(c => c.namespaceURI === ns && c.localName === ln) || null;
const path = (el, ...steps) => { let c = el; for (const [ns, ln] of steps) { c = kid(c, ns, ln); if (!c) return null; } return c; };
const A = ln => [NS_A, ln], P_ = ln => [NS_P, ln];
const lum = hex => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; const n = parseInt(hex, 16); return .2126 * f(n >> 16) + .7152 * f((n >> 8) & 255) + .0722 * f(n & 255); };
const contrast = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05); };

const Pptx = {
  async load(file) {
    const zip = await Zip.read(file); const get = async n => { const en = zip.map.get(n); return en ? Zip.xmlDoc(await Zip.text(en)) : null; };
    const pres = await get('ppt/presentation.xml'); if (!pres) throw new Error("Ce fichier n'est pas une présentation PowerPoint valide (ppt/presentation.xml absent).");
    const prels = await get('ppt/_rels/presentation.xml.rels'); const rmap = {}; if (prels) for (const r of prels.getElementsByTagName('Relationship')) rmap[r.getAttribute('Id')] = r.getAttribute('Target');
    const sz = pres.getElementsByTagNameNS(NS_P, 'sldSz')[0]; const W = +sz.getAttribute('cx'), H = +sz.getAttribute('cy');
    const ids = [...pres.getElementsByTagNameNS(NS_P, 'sldId')].map(x => x.getAttributeNS(NS_R, 'id') || x.getAttribute('r:id')); const spaths = ids.map(i => 'ppt/' + rmap[i].replace(/^\//, '').replace(/^ppt\//, ''));
    const theme = await get('ppt/theme/theme1.xml'); const clr = {}; let fonts = { major: null, minor: null };
    if (theme) { const cs = theme.getElementsByTagNameNS(NS_A, 'clrScheme')[0]; if (cs) for (const c of cs.children) { const v = c.firstElementChild; clr[c.localName] = v ? (v.localName === 'sysClr' ? (v.getAttribute('lastClr') || '000000') : (v.getAttribute('val') || '000000')).toUpperCase() : '000000'; } const fs = theme.getElementsByTagNameNS(NS_A, 'fontScheme')[0]; if (fs) { const mj = fs.getElementsByTagNameNS(NS_A, 'majorFont')[0], mn = fs.getElementsByTagNameNS(NS_A, 'minorFont')[0]; fonts.major = mj && kid(mj, NS_A, 'latin') ? kid(mj, NS_A, 'latin').getAttribute('typeface') : null; fonts.minor = mn && kid(mn, NS_A, 'latin') ? kid(mn, NS_A, 'latin').getAttribute('typeface') : null; } }
    const master = await get('ppt/slideMasters/slideMaster1.xml'); const tstyle = master ? master.getElementsByTagNameNS(NS_P, 'txStyles')[0] : null;
    const lvlSz = (st, lvl) => { const l = st && kid(st, NS_A, `lvl${lvl + 1}pPr`); const d = l && kid(l, NS_A, 'defRPr'); return d && d.getAttribute('sz') ? +d.getAttribute('sz') / 100 : null; };
    const dts = pres.getElementsByTagNameNS(NS_P, 'defaultTextStyle')[0];
    const defSize = (ph, lvl = 0) => { if (ph == null) return lvlSz(dts, lvl) || 18; const w = /^(title|ctrTitle)$/.test(ph) ? 'titleStyle' : /^(dt|ftr|sldNum)$/.test(ph) ? 'otherStyle' : 'bodyStyle'; return tstyle ? lvlSz(kid(tstyle, NS_P, w), lvl) : null; };
    const masterPh = {}; if (master) { const mt = path(master.documentElement, P_('cSld'), P_('spTree')); if (mt) for (const ms of kids(mt, NS_P, 'sp')) { const ph = path(ms, P_('nvSpPr'), P_('nvPr'), P_('ph')); const x = path(ms, P_('spPr'), A('xfrm')); const o = x && kid(x, NS_A, 'off'), e = x && kid(x, NS_A, 'ext'); if (ph && o && e) masterPh[ph.getAttribute('type') || 'body'] = { x: +o.getAttribute('x'), y: +o.getAttribute('y'), w: +e.getAttribute('cx'), h: +e.getAttribute('cy') }; } }
    const deck = { name: file.name, zip, W, H, clr, fonts, spaths, defSize, lvlSz, master, masterPh, slides: [], file };
    for (let i = 0; i < spaths.length; i++) deck.slides.push(await this.slide(deck, i));
    return deck;
  },
  color(deck, el) { // élément porteur d'un solidFill → hex ou null
    if (!el) return null; const sf = kid(el, NS_A, 'solidFill'); if (!sf) return null; const c = sf.firstElementChild; if (!c) return null;
    if (c.localName === 'srgbClr') return c.getAttribute('val').toUpperCase(); if (c.localName === 'sysClr') return (c.getAttribute('lastClr') || '000000').toUpperCase();
    if (c.localName === 'schemeClr') { const m = { tx1: 'dk1', bg1: 'lt1', tx2: 'dk2', bg2: 'lt2' }; const k = m[c.getAttribute('val')] || c.getAttribute('val'); return deck.clr[k] || null; } return null;
  },
  async slide(deck, i) {
    const p = deck.spaths[i]; const en = deck.zip.map.get(p); const doc = Zip.xmlDoc(await Zip.text(en)); const rp = p.replace('slides/', 'slides/_rels/') + '.rels'; const rels = {};
    const rd = deck.zip.map.get(rp); if (rd) for (const r of Zip.xmlDoc(await Zip.text(rd)).getElementsByTagName('Relationship')) rels[r.getAttribute('Id')] = { type: r.getAttribute('Type'), target: r.getAttribute('Target') };
    const S = { i, path: p, doc, rels, shapes: [], paras: [], issues: [], proposals: [], notes: '', notesPath: null, bg: null };
    const bgp = path(doc.documentElement, P_('cSld'), P_('bg'), P_('bgPr')); S.bg = this.color(deck, bgp);
    const readXfrm0 = (x) => { if (!x) return null; const o = kid(x, NS_A, 'off'), e = kid(x, NS_A, 'ext'); return o && e ? { x: +o.getAttribute('x'), y: +o.getAttribute('y'), w: +e.getAttribute('cx'), h: +e.getAttribute('cy') } : null; };
    S.layoutPh = []; { const lrel = Object.values(rels).find(r => /slideLayout$/.test(r.type)); const le = lrel && deck.zip.map.get('ppt/slideLayouts/' + lrel.target.split('/').pop()); if (le) { const ld = Zip.xmlDoc(await Zip.text(le)); const lt = path(ld.documentElement, P_('cSld'), P_('spTree')); if (lt) for (const ls of kids(lt, NS_P, 'sp')) { const ph = path(ls, P_('nvSpPr'), P_('nvPr'), P_('ph')); if (ph) { const tb = kid(ls, NS_P, 'txBody'); S.layoutPh.push({ type: ph.getAttribute('type') || 'body', idx: ph.getAttribute('idx'), box: readXfrm0(path(ls, P_('spPr'), A('xfrm'))), lst: tb ? kid(tb, NS_A, 'lstStyle') : null }); } } } }
    const tree = path(doc.documentElement, P_('cSld'), P_('spTree'));
    const readXfrm = (x) => { if (!x) return null; const o = kid(x, NS_A, 'off'), e = kid(x, NS_A, 'ext'); return o && e ? { x: +o.getAttribute('x'), y: +o.getAttribute('y'), w: +e.getAttribute('cx'), h: +e.getAttribute('cy') } : null; };
    const walk = (node, inGroup) => {
      for (const n of node.children) {
        if (n.namespaceURI !== NS_P) continue;
        if (n.localName === 'grpSp') { walk(n, true); continue; }
        if (!['sp', 'pic', 'graphicFrame'].includes(n.localName)) continue;
        const nv = n.firstElementChild; const cNv = nv && nv.firstElementChild; const name = cNv ? cNv.getAttribute('name') : ''; const descr = cNv ? cNv.getAttribute('descr') : null;
        const phEl = nv ? (path(nv, P_('nvPr'), P_('ph'))) : null; const ph = phEl ? (phEl.getAttribute('type') || 'body') : null;
        let box = null; if (n.localName === 'graphicFrame') box = readXfrm(kid(n, NS_P, 'xfrm')); else box = readXfrm(path(n, P_('spPr'), A('xfrm')));
        const sh = { kind: n.localName === 'sp' ? 'sp' : n.localName === 'pic' ? 'pic' : 'frame', el: n, name, descr, ph, box, inGroup, paras: [], fill: n.localName === 'sp' ? this.color(deck, kid(n, NS_P, 'spPr')) : null, sub: null, scale: 1 };
        if (ph) { sh.layout = S.layoutPh.find(l => phEl.getAttribute('idx') != null && l.idx === phEl.getAttribute('idx')) || S.layoutPh.find(l => l.type === ph) || null; if (!sh.box && sh.layout && sh.layout.box) { sh.box = sh.layout.box; sh.inherited = true; } if (!sh.box) { const mk = /^(title|ctrTitle)$/.test(ph) ? 'title' : /^(dt|ftr|sldNum)$/.test(ph) ? ph : 'body'; if (deck.masterPh[mk]) { sh.box = deck.masterPh[mk]; sh.inherited = true; } } }
        if (n.localName === 'pic') { const bl = path(n, P_('blipFill'), A('blip')); sh.embed = bl ? (bl.getAttributeNS(NS_R, 'embed') || bl.getAttribute('r:embed')) : null; }
        if (n.localName === 'graphicFrame') { const gd = path(n, A('graphic'), A('graphicData')); const uri = gd ? gd.getAttribute('uri') || '' : ''; sh.sub = /table/.test(uri) ? 'table' : /chart/.test(uri) ? 'chart' : /diagram/.test(uri) ? 'smartart' : 'other'; }
        const tb = n.localName === 'sp' ? kid(n, NS_P, 'txBody') : null; const lst = tb && kid(tb, NS_A, 'lstStyle'); const bodyPr = tb && kid(tb, NS_A, 'bodyPr'); const na = bodyPr && kid(bodyPr, NS_A, 'normAutofit'); if (na && na.getAttribute('fontScale')) sh.scale = +na.getAttribute('fontScale') / 100000;
        const addParas = (ps, container) => { ps.forEach(pel => { const par = this.para(deck, pel, sh, lst, S); par.shape = sh; par.container = container; sh.paras.push(par); S.paras.push(par); }); };
        if (tb) addParas(kids(tb, NS_A, 'p'), 'text');
        if (sh.sub === 'table') { for (const tc of n.getElementsByTagNameNS(NS_A, 'tc')) { const ttb = kid(tc, NS_A, 'txBody'); if (ttb) addParas(kids(ttb, NS_A, 'p'), 'table'); } }
        S.shapes.push(sh);
      }
    }; if (tree) walk(tree, false);
    // positions héritées de la mise en page / du masque pour les espaces réservés
    // notes
    const nrel = Object.values(rels).find(r => /notesSlide$/.test(r.type)); if (nrel) { const np = 'ppt/notesSlides/' + nrel.target.split('/').pop(); const ne = deck.zip.map.get(np); if (ne) { S.notesPath = np; const nd = Zip.xmlDoc(await Zip.text(ne)); const lines = []; for (const sp of nd.getElementsByTagNameNS(NS_P, 'sp')) { const ph = path(sp, P_('nvSpPr'), P_('nvPr'), P_('ph')); if (ph && ph.getAttribute('type') === 'body') for (const pe of sp.getElementsByTagNameNS(NS_A, 'p')) lines.push([...pe.getElementsByTagNameNS(NS_A, 't')].map(t => t.textContent).join('')); } S.notes = lines.join('\n').trim(); } }
    const tt = S.shapes.find(s => s.ph === 'title' || s.ph === 'ctrTitle'); S.titleShape = tt || null; S.title = tt ? tt.paras.map(p => p.text).join(' ').trim() : '';
    return S;
  },
  pieces(pel) { // découpe un paragraphe en morceaux de texte éditables
    const pcs = []; let pos = 0; for (const c of pel.children) { if (c.namespaceURI !== NS_A) continue; if (c.localName === 'r' || c.localName === 'fld') { const t = kid(c, NS_A, 't'); if (t) { const s = t.textContent; pcs.push({ kind: 'run', el: c, t, start: pos, end: pos + s.length, s }); pos += s.length; } } else if (c.localName === 'br') { pcs.push({ kind: 'br', el: c, start: pos, end: pos + 1, s: '\n' }); pos += 1; } }
    return pcs;
  },
  para(deck, pel, sh, lst, S) {
    const pcs = this.pieces(pel); const text = pcs.map(x => x.s).join(''); const runs = pcs.filter(x => x.kind === 'run'); let sz = null, color = null, font = null;
    const rp = runs.map(r => kid(r.el, NS_A, 'rPr')); const szs = rp.map(r => r && r.getAttribute('sz') ? +r.getAttribute('sz') / 100 : null).filter(Boolean);
    const ppr = kid(pel, NS_A, 'pPr'); const pdr = ppr && kid(ppr, NS_A, 'defRPr'); const lvl = ppr && ppr.getAttribute('lvl') ? +ppr.getAttribute('lvl') : 0; const l1 = lst && kid(lst, NS_A, `lvl${lvl + 1}pPr`); const dr = l1 && kid(l1, NS_A, 'defRPr');
    let base = szs.length ? Math.min(...szs) : (pdr && pdr.getAttribute('sz') ? +pdr.getAttribute('sz') / 100 : (dr && dr.getAttribute('sz') ? +dr.getAttribute('sz') / 100 : null));
    let inherited = false; if (!base && sh.layout) base = deck.lvlSz(sh.layout.lst, lvl); if (!base) { const d = deck.defSize(sh.ph, lvl); if (d) { base = d; inherited = true; } }
    sz = base ? base * (sh.scale || 1) : null;
    for (const r of rp) { const c = r && this.color(deck, r); if (c) { color = c; break; } } if (!color) { const c = dr && this.color(deck, dr); if (c) color = c; }
    for (const r of rp) { const l = r && kid(r, NS_A, 'latin'); if (l && l.getAttribute('typeface')) { font = l.getAttribute('typeface'); break; } } if (font && /^\+mj/.test(font)) font = deck.fonts.major; else if (font && /^\+mn/.test(font)) font = deck.fonts.minor; if (!font) font = /title/i.test(sh.ph || '') ? deck.fonts.major : deck.fonts.minor;
    const bold = rp.some(r => r && r.getAttribute('b') === '1');
    return { el: pel, text, sz, inheritedSize: inherited, color, font, bold, pcs, errors: [], ref: null };
  },
  allText(deck) { return deck.slides.map((s, i) => `# Diapositive ${i + 1}${s.title ? ' — ' + s.title : ''}\n` + s.paras.filter(p => p.text.trim()).map(p => p.text).join('\n')).join('\n\n'); },
  editPara(par, start, end, rep) {
    const pcs = this.pieces(par.el); let done = false; let merged = false;
    for (const pc of pcs) {
      if (pc.kind !== 'run') continue;
      if (start === end) { if (!done && pc.start <= start && start <= pc.end) { pc.t.textContent = pc.s.slice(0, start - pc.start) + rep + pc.s.slice(start - pc.start); done = true; } continue; }
      const a = Math.max(pc.start, start), b = Math.min(pc.end, end); if (a >= b && !(a === b && pc.start === pc.end)) continue; if (a >= b) continue;
      if (!done) { pc.t.textContent = pc.s.slice(0, a - pc.start) + rep + pc.s.slice(b - pc.start); done = true; } else { pc.t.textContent = pc.s.slice(0, a - pc.start) + pc.s.slice(b - pc.start); merged = true; }
    }
    if (!done && pcs.some(x => x.kind === 'run')) { const last = pcs.filter(x => x.kind === 'run').pop(); last.t.textContent = last.s + rep; done = true; }
    return { done, merged };
  },
  setRun(par, fn) { const doc = par.el.ownerDocument; for (const pc of this.pieces(par.el)) if (pc.kind === 'run') { let rpr = kid(pc.el, NS_A, 'rPr'); if (!rpr) { rpr = doc.createElementNS(NS_A, 'a:rPr'); pc.el.insertBefore(rpr, pc.el.firstChild); } fn(rpr, doc); } },
  setSize(par, pt) { this.setRun(par, r => r.setAttribute('sz', String(Math.round(pt * 100)))); },
  setColor(par, hex) { this.setRun(par, (r, doc) => { kids(r, NS_A, 'solidFill').forEach(x => x.remove()); const sf = doc.createElementNS(NS_A, 'a:solidFill'); const c = doc.createElementNS(NS_A, 'a:srgbClr'); c.setAttribute('val', hex); sf.append(c); const after = ['effectLst', 'effectDag', 'highlight', 'uLnTx', 'uLn', 'uFillTx', 'uFill', 'latin', 'ea', 'cs', 'sym', 'hlinkClick', 'hlinkMouseOver', 'rtl', 'extLst']; const before = [...r.children].find(x => after.includes(x.localName)); before ? r.insertBefore(sf, before) : r.append(sf); }); },
  async image(deck, S, sh) { if (!sh.embed || !S.rels[sh.embed]) return null; const name = 'ppt/media/' + S.rels[sh.embed].target.split('/').pop(); const en = deck.zip.map.get(name); if (!en) return null; const ext = name.split('.').pop().toLowerCase(); const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', gif: 'image/gif', svg: 'image/svg+xml', webp: 'image/webp' }[ext]; if (!mime) return null; return URL.createObjectURL(new Blob([await Zip.bytes(en)], { type: mime })); }
};

// ====================================================================================================  analyse et corrections
const Slides = {
  async analyseDeck(deck) {
    const min = App.prefs.minSlideFont; const fontCount = {}, titleSizes = {}, titles = {};
    deck.slides.forEach(S => S.paras.forEach(p => { if (p.font && p.text.trim()) fontCount[p.font] = (fontCount[p.font] || 0) + p.text.length; }));
    const topFonts = Object.entries(fontCount).sort((a, b) => b[1] - a[1]).map(x => x[0]); deck.fontsUsed = topFonts;
    deck.slides.forEach(S => { if (S.titleShape) { const sz = S.titleShape.paras.map(p => p.sz).filter(Boolean)[0]; if (sz) titleSizes[Math.round(sz)] = (titleSizes[Math.round(sz)] || 0) + 1; } if (S.title) titles[S.title.toLowerCase()] = (titles[S.title.toLowerCase()] || 0) + 1; });
    const mainTitleSize = +(Object.entries(titleSizes).sort((a, b) => b[1] - a[1])[0] || [0])[0];
    for (const S of deck.slides) {
      S.issues = []; S.proposals = []; let id = 0; const bgDefault = S.bg || deck.clr.lt1 || 'FFFFFF';
      S.paras.forEach((p, pi) => {
        p.ref = pi; p.errors = []; if (!p.text.trim()) return;
        const r = Corrector.analyze(p.text, { finalPunct: false, referent: false, caps: false, longSentence: 25, typoSpaces: App.prefs.softTypo });
        p.errors = r.errors; r.errors.forEach(e => { e.uid = S.i + ':' + pi + ':' + e.id; });
      });
      // texte : problèmes + propositions
      const nonTitle = S.paras.filter(p => p.text.trim() && p.shape !== S.titleShape);
      const words = nonTitle.reduce((a, p) => a + Corrector.countWords(p.text), 0);
      if (!S.title) S.issues.push({ type: 'titre', sev: 'warn', msg: S.titleShape ? 'Le titre est vide.' : 'Cette diapositive n’a pas de titre : les personnes qui utilisent un lecteur d’écran ne peuvent pas la repérer.' });
      else if (Corrector.countWords(S.title) > 12) S.issues.push({ type: 'titre', sev: 'warn', msg: `Titre trop long (${Corrector.countWords(S.title)} mots) : vise 12 mots au maximum.` });
      if (S.title && titles[S.title.toLowerCase()] > 1) S.issues.push({ type: 'titre', sev: 'info', msg: 'Ce titre est utilisé sur plusieurs diapositives.' });
      if (S.titleShape && mainTitleSize) { const sz = S.titleShape.paras.map(p => p.sz).filter(Boolean)[0]; if (sz && Math.round(sz) !== mainTitleSize) S.issues.push({ type: 'cohérence', sev: 'info', msg: `Cohérence des titres : taille ${Math.round(sz)} pt ici, ${mainTitleSize} pt sur la plupart des diapositives.` }); }
      if (words > 90 || nonTitle.length > 8) S.issues.push({ type: 'charge', sev: 'warn', msg: `Diapositive trop chargée (${words} mots, ${nonTitle.length} paragraphes) : l’idéal est de couper en deux ou de garder l’essentiel.` });
      if (deck.fontsUsed.length > 2) { const mine = [...new Set(S.paras.filter(p => p.text.trim()).map(p => p.font).filter(Boolean))].filter(f => !topFonts.slice(0, 2).includes(f)); if (mine.length) S.issues.push({ type: 'polices', sev: 'info', msg: `Cohérence des polices : « ${mine.join(', ')} » est utilisée ici alors que le reste du document emploie surtout ${topFonts.slice(0, 2).join(' et ')}.` }); }
      S.paras.forEach((p, pi) => {
        if (!p.text.trim()) return;
        if (p.sz && p.sz < min && !(p.container === 'table' && p.sz >= 12)) S.issues.push({ type: 'taille', sev: p.sz < 12 ? 'bad' : 'warn', msg: `Texte trop petit (${p.sz.toFixed(0)} pt${p.inheritedSize ? ', taille héritée du modèle' : ''}) : « ${p.text.slice(0, 40)}${p.text.length > 40 ? '…' : ''} ». Minimum conseillé : ${min} pt.`, para: p, fix: { type: 'size', pt: min } });
        const fillHex = p.shape.fill || bgDefault; const txt = p.color || (deck.clr.dk1 || '000000'); if ((p.color || p.shape.fill || S.bg)) { const c = contrast(txt, fillHex); const large = (p.sz || 18) >= 24 || ((p.sz || 18) >= 18.66 && p.bold); if (c < (large ? 3 : 4.5)) { const better = contrast('000000', fillHex) >= contrast('FFFFFF', fillHex) ? '000000' : 'FFFFFF'; S.issues.push({ type: 'contraste', sev: c < 3 ? 'bad' : 'warn', msg: `Contraste faible (${c.toFixed(1)}:1, minimum ${large ? 3 : 4.5}:1) pour « ${p.text.slice(0, 40)}${p.text.length > 40 ? '…' : ''} ».`, para: p, fix: { type: 'color', hex: better } }); } }
        if (p.container === 'text') { const long = Corrector.splitSentences(p.text).find(s => Corrector.countWords(s.text) > 25); if (long) S.issues.push({ type: 'phrase', sev: 'info', msg: `Phrase trop longue pour une diapositive (${Corrector.countWords(long.text)} mots).` }); }
      });
      // débordement estimé, hors cadre, chevauchement
      const SW = deck.W, SH = deck.H; const textShapes = S.shapes.filter(s => s.kind === 'sp' && s.box && s.paras.some(p => p.text.trim()) && !s.inGroup);
      textShapes.forEach(s => { const wpt = s.box.w / 12700, hpt = s.box.h / 12700; let need = 0; s.paras.forEach(p => { const sz = p.sz || 18; const cpl = Math.max(1, wpt / (sz * 0.5)); need += Math.max(1, Math.ceil((p.text.length || 1) / cpl)) * sz * 1.2; }); if (need > hpt * 1.2 && hpt > 20 && s.scale >= 1) S.issues.push({ type: 'mise en page', sev: 'warn', msg: `Le texte de « ${s.name || 'zone de texte'} » risque de déborder de sa zone (estimation : ${Math.round(need)} pt de texte pour ${Math.round(hpt)} pt de hauteur).` }); });
      S.shapes.filter(s => s.box && !s.inGroup).forEach(s => { const b = s.box; if (b.x < -SW * .02 || b.y < -SH * .02 || b.x + b.w > SW * 1.02 || b.y + b.h > SH * 1.02) S.issues.push({ type: 'mise en page', sev: 'warn', msg: `« ${s.name || 'Un élément'} » dépasse du bord de la diapositive.` }); });
      for (let a = 0; a < textShapes.length; a++) for (let b = a + 1; b < textShapes.length; b++) { const x = textShapes[a].box, y = textShapes[b].box; const ox = Math.max(0, Math.min(x.x + x.w, y.x + y.w) - Math.max(x.x, y.x)), oy = Math.max(0, Math.min(x.y + x.h, y.y + y.h) - Math.max(x.y, y.y)); const inter = ox * oy; if (inter > 0.3 * Math.min(x.w * x.h, y.w * y.h)) S.issues.push({ type: 'mise en page', sev: 'warn', msg: `« ${textShapes[a].name} » et « ${textShapes[b].name} » se chevauchent.` }); }
      S.shapes.filter(s => s.kind === 'pic' && !s.descr).forEach(s => S.issues.push({ type: 'accessibilité', sev: 'info', msg: `Image « ${s.name || 'sans nom'} » sans texte alternatif (description pour les lecteurs d’écran).` }));
      const nt = S.shapes.filter(s => s.sub === 'chart' || s.sub === 'smartart').length; if (nt) S.issues.push({ type: 'limite', sev: 'info', msg: `${nt} graphique(s) ou SmartArt : leur texte n’est pas analysé ni modifié (il est conservé tel quel).` });
    }
    App.log('diaporama', deck.name, { count: 'slides', amount: deck.slides.length, errors: deck.slides.flatMap(s => s.paras.flatMap(p => p.errors.filter(e => e.kind !== 'info' || ['synt', 'manque'].includes(e.cat)))) });
  },
  buildProposals(deck, mode) {
    for (const S of deck.slides) {
      S.proposals = []; let n = 0;
      S.paras.forEach((p, pi) => {
        if (!p.text.trim() || p.container === 'table' && false) return; const fixes = Corrector.pickErrors(p.errors, mode >= 2 ? 'style' : 'safe');
        fixes.forEach(e => S.proposals.push({ id: `${S.i}-${n++}`, kind: 'text', para: p, start: e.start, end: e.end, from: e.orig, to: e.sugg[0], cat: e.cat, msg: e.msg, errId: e.id, on: e.kind === 'fix' && !['rep', 'vocab', 'amelio'].includes(e.cat), mode: ['rep', 'vocab', 'amelio'].includes(e.kind === 'fix' ? e.cat : 'amelio') ? 2 : 1 }));
        if (mode >= 2) { const lg = p.errors.filter(e => e.rule === 'phrase-longue'); lg.forEach(e => { const parts = Simp.splitSentence(e.orig, 18); if (parts.length > 1) S.proposals.push({ id: `${S.i}-${n++}`, kind: 'text', para: p, start: e.start, end: e.end, from: e.orig, to: parts.join(' '), cat: 'synt', msg: 'Phrase longue découpée en phrases plus courtes (à relire : le sens doit rester le même).', errId: e.id, on: false, mode: 2 }); }); }
      });
      if (mode >= 3) S.issues.filter(x => x.fix).forEach(x => S.proposals.push({ id: `${S.i}-${n++}`, kind: 'layout', para: x.para, fix: x.fix, cat: 'amelio', msg: x.msg, from: x.fix.type === 'size' ? `${(x.para.sz || 0).toFixed(0)} pt` : 'couleur du texte', to: x.fix.type === 'size' ? `${x.fix.pt} pt` : '#' + x.fix.hex, on: true, mode: 3 }));
    }
  },
  accepted(deck) { return deck.slides.flatMap(S => S.proposals.filter(p => p.on)); },
  preflight(deck) {
    const acc = this.accepted(deck); const slidesTouched = new Set(acc.map(p => p.id.split('-')[0])); const pics = deck.slides.reduce((a, S) => a + S.shapes.filter(s => s.kind === 'pic').length, 0); const tabs = deck.slides.reduce((a, S) => a + S.shapes.filter(s => s.sub === 'table').length, 0); const charts = deck.slides.reduce((a, S) => a + S.shapes.filter(s => s.sub === 'chart' || s.sub === 'smartart').length, 0);
    const keep = [`${pics} image(s)`, `${tabs} tableau(x)`, `${charts} graphique(s) / SmartArt`, 'formes, couleurs, polices, disposition', 'animations et transitions', 'notes du présentateur'];
    const warn = []; const multi = acc.filter(p => p.kind === 'text' && p.para.pcs.filter(x => x.kind === 'run' && x.end > p.start && x.start < p.end).length > 1).length;
    if (multi) warn.push(`${multi} correction(s) touchent un passage à plusieurs mises en forme : le style du premier morceau est conservé pour ce passage.`);
    if (charts) warn.push('Le texte des graphiques et SmartArt n’a pas été analysé : il reste inchangé.');
    warn.push('Le texte placé dans des images n’est pas analysé.', 'Les polices ne sont pas intégrées au fichier : une police absente de l’ordinateur sera remplacée par PowerPoint, comme dans l’original.');
    return { n: acc.length, slides: slidesTouched.size, keep, warn };
  },
  async exportPptx(deck) {
    const acc = this.accepted(deck); const byPara = new Map();
    acc.forEach(p => { if (p.kind === 'text') { const k = p.para; (byPara.get(k) || byPara.set(k, []).get(k)).push(p); } });
    for (const [par, list] of byPara) { list.sort((a, b) => b.start - a.start); let lastStart = Infinity; list.forEach(p => { if (p.end <= lastStart) { Pptx.editPara(par, p.start, p.end, p.to); lastStart = p.start; } }); }
    acc.filter(p => p.kind === 'layout').forEach(p => { if (p.fix.type === 'size') Pptx.setSize(p.para, p.fix.pt); else Pptx.setColor(p.para, p.fix.hex); });
    const touched = new Set(acc.map(p => +p.id.split('-')[0])); const out = [];
    const ser = new XMLSerializer(); const changed = new Map();
    for (const i of touched) { const S = deck.slides[i]; changed.set(S.path, '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n' + ser.serializeToString(S.doc).replace(/^<\?xml[^>]*\?>\s*/, '')); }
    for (const en of deck.zip.entries) out.push(changed.has(en.name) ? await Zip.replaced(en, changed.get(en.name)) : en);
    return Zip.write(out);
  },
  view(S) { // texte de la diapositive avec les corrections acceptées (titre, corps hors tableaux)
    const L = this.slideText(S); const clean = t => t.replace(/\s*\n\s*/g, ' ').replace(/[.;:]+$/, '').trim();
    return { title: L.filter(x => x.title).map(x => clean(x.text)).join(' ').trim(), body: L.filter(x => !x.title && x.p.container !== 'table' && x.text.trim()).map(x => clean(x.text)).filter(Boolean), all: L };
  },
  slideText(S) { // texte corrigé (propositions acceptées) pour l'export PDF
    return S.paras.filter(p => p.text.trim()).map(p => { const fx = S.proposals.filter(x => x.on && x.kind === 'text' && x.para === p).map(x => ({ start: x.start, end: x.end, text: x.to })); return { p, text: Corrector.applyFixes(p.text, fx).text, title: p.shape === S.titleShape }; });
  },
  async exportPdf(deck) {
    const d = await Rep.head('Présentation corrigée (texte)', deck.name); d.text('Ce PDF contient le TEXTE corrigé de la présentation. La mise en page, les images, les formes et les animations ne sont pas conservées (utilise l’export PPTX pour les conserver).', { size: 9.5, color: '#92400e' }); d.rule();
    deck.slides.forEach(S => { const v = this.view(S); d.h2(`Diapositive ${S.i + 1}${v.title ? ' — ' + v.title : ''}`); v.all.filter(x => !x.title).forEach(x => d.text('•  ' + x.text.replace(/\n/g, ' '), { indent: 8, after: 2 })); if (deck.oral && deck.oral[S.i]) { d.text('Notes orales : ' + deck.oral[S.i], { size: 9.5, color: '#4b5563' }); } });
    return d.save('Présentation');
  },
  async report() {
    const deck = App.slides; const d = await Rep.head('Rapport — présentation PowerPoint', deck.name); d.legend(); d.h2('Vue d’ensemble'); const all = deck.slides.flatMap(S => S.paras.flatMap(p => p.errors)); d.text(`${deck.slides.length} diapositive(s) · ${all.length} point(s) relevé(s) dans le texte · ${deck.slides.reduce((a, S) => a + S.issues.length, 0)} remarque(s) de lisibilité et de mise en page.`);
    deck.slides.forEach(S => { d.h2(`Diapositive ${S.i + 1}${S.title ? ' — ' + S.title : ''}`); const text = S.paras.filter(p => p.text.trim()); if (text.length) { text.forEach(p => d.rich(p.text, p.errors, { okBlue: true, size: 10 })); } const errs = text.flatMap(p => p.errors).filter(e => e.kind !== 'info' || ['synt', 'manque', 'ambigu', 'coh'].includes(e.cat)); if (errs.length) d.table(['Catégorie', 'Extrait', 'Explication', 'Correction'], errs.map(e => [CAT[e.cat].nom, e.orig.slice(0, 50), e.msg, e.sugg[0] !== undefined ? (e.sugg[0] === '' ? '(supprimer)' : e.sugg[0]) : '—']), [.15, .22, .43, .2]); if (S.issues.length) { d.text('Lisibilité et mise en page :', { bold: true, size: 10 }); d.bullets(S.issues.map(x => x.msg), { size: 9.5 }); } });
    return d.save('Présentation');
  },
  // ---------------------------------------------------------------- rendu d'une diapositive (aperçu simplifié, pas le rendu PowerPoint exact)
  async render(deck, S, big) {
    const root = h('div', { class: 'slide' + (big ? ' big' : ''), style: `aspect-ratio:${deck.W}/${deck.H};background:#${S.bg || (deck.clr.lt1 || 'FFFFFF')}` }); const wpt = deck.W / 12700;
    for (const sh of S.shapes) {
      if (!sh.box) continue; const st = `left:${sh.box.x / deck.W * 100}%;top:${sh.box.y / deck.H * 100}%;width:${sh.box.w / deck.W * 100}%;height:${sh.box.h / deck.H * 100}%;` + (sh.fill ? `background:#${sh.fill};` : '');
      const n = h('div', { class: 'shp', style: st });
      if (sh.kind === 'pic') { const url = await Pptx.image(deck, S, sh); if (url) n.append(h('img', { src: url, alt: sh.descr || '', style: 'width:100%;height:100%;object-fit:contain' })); else n.append(h('div', { style: `font-size:${big ? 14 : 8}px;background:#e5e7eb;height:100%;display:flex;align-items:center;justify-content:center;color:#555` }, '🖼 image')); }
      else if (sh.sub === 'chart' || sh.sub === 'smartart') n.append(h('div', { style: `font-size:${big ? 14 : 8}px;background:#f1f5f9;height:100%;display:flex;align-items:center;justify-content:center;color:#555` }, sh.sub === 'chart' ? '📊 graphique' : '🧩 SmartArt'));
      else if (sh.paras.length) {
        sh.paras.forEach(p => { if (!p.text.trim()) return; const sz = p.sz || 18; const errs = p.errors.filter(e => !App.hidden.has(e.cat)); const el = h('p', { style: `font-size:${sz / wpt * 100}cqw;color:#${p.color || '1f2937'};${p.bold ? 'font-weight:700;' : ''}` }); el.innerHTML = App.markHTML(p.text, errs, { showCorrect: false, icons: big }); el.dataset.pi = S.paras.indexOf(p); n.append(el); });
      }
      root.append(n);
    } return root;
  }
};

// ====================================================================================================  module « Analyse de diapositives »
App.slides = null;
App.reg({
  id: 'slides', title: 'Analyse PowerPoint', group: 'outils', icon: '📊', learn: true, render(el) {
    el.append(h('h1', null, 'Analyse de diapositives'));
    el.append(h('div', { class: 'notice secondary' }, h('b', null, 'Ce qui est vraiment pris en charge : '), 'PPTX (analyse complète, correction et export fidèle), PDF de présentation (texte + miniatures ; export en PDF de texte), ODP (texte), images/captures (via OCR local si disponible). Les aperçus sont simplifiés (pas le rendu exact de PowerPoint).'));
    const body = h('div'); const inp = fileInput('.pptx,.pdf,.odp,image/png,image/jpeg,image/webp', f => load([f]));
    const multi = h('input', { type: 'file', multiple: true, accept: 'image/png,image/jpeg,image/webp', 'aria-label': 'Images de diapositives (plusieurs possibles)' }); multi.addEventListener('change', () => multi.files.length && load([...multi.files]).catch(e => App.toast(e.message)));
    el.append(h('label', null, 'Importer une présentation (PPTX, PDF, ODP) ou une image'), inp, h('label', null, 'Ou plusieurs images de diapositives / captures d’écran'), multi, body);
    async function load(files) {
      body.replaceChildren(h('p', null, '⏳ Analyse en cours…')); const f = files[0]; const ext = f.name.split('.').pop().toLowerCase(); let deck;
      try {
        if (ext === 'pptx') { deck = await Pptx.load(f); deck.type = 'pptx'; }
        else if (ext === 'pdf') deck = await Slides.loadPdf(f);
        else if (ext === 'odp') deck = await Slides.loadOdp(f);
        else deck = await Slides.loadImages(files);
        await Slides.analyseDeck(deck); deck.mode = 1; Slides.buildProposals(deck, 1); App.slides = deck; App.setText(deck.slides.map(S => S.paras.map(p => p.text).join('\n')).join('\n\n'), f.name.replace(/\.[^.]+$/, ''), 'slides'); show(deck);
      } catch (e) { body.replaceChildren(h('div', { class: 'notice bad' }, 'Impossible d’analyser ce fichier : ' + e.message)); }
    }
    let cur = 0;
    async function show(deck) {
      body.replaceChildren(); const sum = deck.slides.reduce((a, S) => a + S.issues.length, 0); const eCount = deck.slides.reduce((a, S) => a + S.paras.reduce((b, p) => b + p.errors.filter(e => e.kind !== 'info' || ['synt', 'manque'].includes(e.cat)).length, 0), 0);
      body.append(h('div', { class: 'card' }, h('b', null, deck.name), h('span', { class: 'muted' }, ` — ${deck.slides.length} diapositive(s) · ${eCount} point(s) dans le texte · ${sum} remarque(s) de lisibilité / mise en page`), deck.fontsUsed && deck.fontsUsed.length ? h('p', { class: 'muted' }, 'Polices : ' + deck.fontsUsed.join(', ')) : ''));
      const modeRow = h('div', { class: 'card' }, h('h3', { style: 'margin-top:0' }, 'Que veux-tu corriger ?'), h('div', { class: 'row' }, [[1, 'Corriger uniquement le texte'], [2, 'Améliorer le texte et sa formulation'], [3, 'Améliorer le texte et proposer une meilleure mise en page']].map(([m, l]) => h('button', { class: 'btn ' + (deck.mode === m ? '' : 'sec'), 'aria-pressed': String(deck.mode === m), onclick: () => { deck.mode = m; Slides.buildProposals(deck, m); show(deck); } }, l))), h('p', { class: 'muted' }, 'Chaque correction est une proposition : tu peux l’accepter ou la refuser avant l’export. Les fautes sûres sont cochées ; les reformulations et améliorations sont proposées décochées : coche celles qui te plaisent.'));
      body.append(modeRow);
      const thumbs = h('div', { class: 'thumbs', role: 'list', 'aria-label': 'Miniatures des diapositives' }); const detail = h('div');
      for (const S of deck.slides) { const bad = S.paras.reduce((b, p) => b + p.errors.filter(e => e.kind !== 'info' || ['synt', 'manque'].includes(e.cat)).length, 0) + S.issues.filter(x => x.sev !== 'info').length; const tb = h('button', { class: 'thumb', role: 'listitem', 'aria-current': String(S.i === cur), 'aria-label': `Diapositive ${S.i + 1}, ${bad} remarque(s)`, onclick: () => { cur = S.i; $$('.thumb', thumbs).forEach((b, k) => b.setAttribute('aria-current', String(k === cur))); drawDetail(); } }, h('div', { class: 'n' }, h('b', null, S.i + 1), bad ? h('span', { class: 'badge warn' }, bad) : h('span', { class: 'badge ok' }, '✓'))); const th = deck.type === 'pptx' ? await Slides.render(deck, S, false) : (S.thumbEl ? S.thumbEl() : h('div', { class: 'slide', style: 'aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;font-size:.8rem;color:#555' }, 'texte seul')); tb.append(th); thumbs.append(tb); }
      body.append(h('h2', null, 'Diapositives'), thumbs, detail);
      const exp = h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Télécharger la présentation corrigée'), h('p', { class: 'muted' }, 'Avant l’export, je t’indique ce qui est conservé et ce qui ne l’est pas.'));
      const row = h('div', { class: 'row' }); const go = async (kind) => {
        const pf = Slides.preflight(deck); const dlg = h('div', null, h('h3', { style: 'margin-top:0' }, 'Avant l’export'), h('p', null, `${pf.n} correction(s) acceptée(s) sur ${pf.slides} diapositive(s).`), kind === 'pptx' ? [h('p', null, h('b', null, 'Conservé tel quel : '), pf.keep.join(', '), '. Seules les diapositives modifiées sont réécrites ; tous les autres fichiers du PPTX sont recopiés à l’identique.')] : h('p', { class: 'notice bad' }, 'Ce PDF contient seulement le TEXTE corrigé : mise en page, images, formes, tableaux, graphiques, animations et transitions NE sont PAS conservés. Ce n’est pas la présentation d’origine.'), kind === 'pptx' ? h('ul', null, pf.warn.map(x => h('li', null, x))) : '', h('div', { class: 'row' }, h('button', { class: 'btn', onclick: async () => { App.hidePop(); try { const blob = kind === 'pptx' ? await Slides.exportPptx(deck) : await Slides.exportPdf(deck); App.download(blob, deck.name.replace(/\.[^.]+$/, '') + '-corrige.' + kind); App.toast('Fichier créé.'); if (kind === 'pptx') { deck.slides.forEach(S => S.doc = S.doc); } } catch (e) { App.toast('Export impossible : ' + e.message); } } }, 'Continuer le téléchargement'), h('button', { class: 'btn sec', onclick: () => App.hidePop() }, 'Annuler'))); App.showPop($('#main'), dlg);
      };
      if (deck.type === 'pptx') row.append(h('button', { class: 'btn', onclick: () => go('pptx') }, '⬇ PPTX corrigé (mise en page conservée)')); else row.append(h('span', { class: 'badge warn' }, 'Export PPTX non disponible pour ce type de fichier : il ne serait pas fidèle.'));
      row.append(h('button', { class: 'btn sec', onclick: () => go('pdf') }, '⬇ PDF du texte corrigé'), h('button', { class: 'btn sec', onclick: () => Slides.report().then(b => { App.download(b, 'rapport-presentation.pdf'); App.log('rapport', 'présentation', { count: 'reports' }); }) }, '📄 Rapport PDF complet'), h('a', { class: 'btn sec', href: '#/expose' }, '🎤 Préparer mon exposé'));
      exp.append(row); body.append(exp);
      async function drawDetail() {
        const S = deck.slides[cur]; detail.replaceChildren(); const big = deck.type === 'pptx' ? await Slides.render(deck, S, true) : null;
        const left = h('div'); left.append(h('h2', null, `Diapositive ${S.i + 1}${S.title ? ' — ' + S.title : ''}`), h('div', { class: 'row' }, h('button', { class: 'btn sec', disabled: cur === 0, onclick: () => { cur--; $$('.thumb', thumbs).forEach((b, k) => b.setAttribute('aria-current', String(k === cur))); drawDetail(); } }, '◀ Précédente'), h('button', { class: 'btn sec', disabled: cur === deck.slides.length - 1, onclick: () => { cur++; $$('.thumb', thumbs).forEach((b, k) => b.setAttribute('aria-current', String(k === cur))); drawDetail(); } }, 'Suivante ▶'), App.listenBtn(() => S.paras.map(p => p.text).join('. '), '🔊 Lire la diapositive')));
        if (big) { left.append(big); big.addEventListener('click', ev => { const sg = ev.target.closest('.seg'); if (!sg) return; const p = S.paras[+sg.closest('p').dataset.pi]; const ids = sg.dataset.e.split(','); const es = p.errors.filter(e => ids.includes(e.id)); const bx = h('div'); es.forEach(e => bx.append(h('div', { style: 'margin-bottom:.5rem' }, App.errCard(e, { accept: (e2, s) => { const pr = S.proposals.find(x => x.errId === e2.id); if (pr) pr.on = true; else if (e2.sugg.length) S.proposals.push({ id: `${S.i}-m${Date.now()}`, kind: 'text', para: p, start: e2.start, end: e2.end, from: e2.orig, to: s, cat: e2.cat, msg: e2.msg, errId: e2.id, on: true, mode: 1 }); App.hidePop(); App.toast('Correction acceptée.'); drawDetail(); }, ignore: e2 => { const pr = S.proposals.find(x => x.errId === e2.id); if (pr) pr.on = false; App.hidePop(); drawDetail(); } })))); App.showPop(sg, bx); }); }
        else { const box = h('div', { class: 'marked' }); S.paras.filter(p => p.text.trim()).forEach(p => { const pp = h('p'); pp.innerHTML = App.markHTML(p.text, p.errors.filter(e => !App.hidden.has(e.cat)), { icons: true }); box.append(pp); }); left.append(box); }
        const right = h('div'); right.append(h('h3', null, 'Remarques sur cette diapositive'));
        const sevB = s => h('span', { class: 'badge ' + (s === 'bad' ? 'bad' : s === 'warn' ? 'warn' : '') }, s === 'bad' ? 'important' : s === 'warn' ? 'à voir' : 'info');
        right.append(S.issues.length ? h('ul', null, S.issues.map(x => h('li', null, sevB(x.sev), ' ', h('b', null, x.type), ' — ', x.msg))) : h('p', null, '✅ Aucune remarque de lisibilité ou de mise en page.'));
        const errs = S.paras.flatMap(p => p.errors.filter(e => e.kind !== 'info' || ['synt', 'manque', 'ambigu', 'coh'].includes(e.cat)).map(e => [p, e])); if (errs.length) right.append(h('h3', null, 'Dans le texte'), h('ul', null, errs.map(([p, e]) => h('li', null, h('span', { class: 'tagbox', style: `background:${App.color(e.cat)}` }, CAT[e.cat].icone + ' ' + CAT[e.cat].nom), ' « ', e.orig.slice(0, 50), ' » — ', e.msg))));
        right.append(h('h3', null, 'Corrections proposées (accepter / refuser)'));
        if (!S.proposals.length) right.append(h('p', { class: 'muted' }, 'Aucune correction proposée avec ce mode.'));
        S.proposals.forEach(p => right.append(h('label', { class: 'chk card', style: 'margin:.3rem 0' }, h('input', { type: 'checkbox', checked: p.on, onchange: ev => { p.on = ev.target.checked; } }), h('span', null, h('span', { class: 'tagbox', style: `background:${App.color(p.cat)}` }, CAT[p.cat].icone), ' ', p.kind === 'layout' ? [h('b', null, p.fix.type === 'size' ? 'Taille : ' : 'Contraste : '), `${p.from} → ${p.to}`] : [h('del', null, p.from), ' → ', h('ins', null, p.to === '' ? '(supprimer)' : p.to)], h('br'), h('span', { class: 'muted' }, p.msg)))));
        right.append(h('div', { class: 'row' }, h('button', { class: 'btn small', onclick: () => { S.proposals.forEach(p => p.on = true); drawDetail(); } }, 'Tout accepter'), h('button', { class: 'btn small sec', onclick: () => { S.proposals.forEach(p => p.on = false); drawDetail(); } }, 'Tout refuser')));
        if (S.notes) right.append(h('h3', null, 'Notes du présentateur'), h('p', { class: 'muted' }, S.notes));
        detail.append(h('div', { class: 'grid g2' }, left, right));
      }
      drawDetail();
    }
    if (App.slides) show(App.slides); else body.append(h('p', { class: 'muted' }, 'Aucune présentation chargée.'));
  }
});

// ---------------------------------------------------------------- autres formats
Slides.loadPdf = async function (file) {
  const lib = await App.pdfjs(); const pdf = await lib.getDocument({ data: await file.arrayBuffer() }).promise; const deck = { name: file.name, type: 'pdf', slides: [], clr: {}, fonts: {}, W: 0, H: 0, fontsUsed: [] };
  for (let n = 1; n <= pdf.numPages; n++) {
    const page = await pdf.getPage(n); const vp0 = page.getViewport({ scale: 1 }); const vp = page.getViewport({ scale: 220 / vp0.width }); const cv = document.createElement('canvas'); cv.width = vp.width; cv.height = vp.height; await page.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise; const url = cv.toDataURL('image/jpeg', .8);
    const tc = await page.getTextContent(); const lines = []; tc.items.forEach(it => { if (!it.str.trim()) return; const y = Math.round(it.transform[5] / 4); let ln = lines.find(l => l.y === y); if (!ln) lines.push(ln = { y, parts: [], h: 0 }); ln.parts.push({ x: it.transform[4], s: it.str }); ln.h = Math.max(ln.h, Math.abs(it.transform[3]) || it.height); });
    lines.sort((a, b) => b.y - a.y); const S = { i: n - 1, path: '', doc: null, shapes: [], paras: [], issues: [], proposals: [], notes: '', title: '', bg: null, thumbUrl: url }; const scale = 540 / vp0.height;
    lines.forEach(l => { const t = l.parts.sort((a, b) => a.x - b.x).map(p => p.s).join(' ').replace(/\s+/g, ' ').trim(); if (!t) return; const sh = { kind: 'sp', paras: [], ph: null, fill: null, box: null }; const par = { el: null, text: t, sz: l.h * scale, color: null, font: null, bold: false, pcs: [], errors: [], shape: sh, container: 'text' }; sh.paras.push(par); S.paras.push(par); S.shapes.push(sh); });
    const big = S.paras.slice().sort((a, b) => b.sz - a.sz)[0]; if (big && big.sz > 20) { S.title = big.text; S.titleShape = big.shape; }
    S.thumbEl = () => h('img', { src: url, alt: `Diapositive ${n}`, style: 'width:100%;display:block' }); deck.slides.push(S);
  }
  return deck;
};
Slides.loadOdp = async function (file) {
  const z = await Zip.read(file); const en = z.map.get('content.xml'); if (!en) throw new Error('content.xml introuvable : fichier ODP non valide.'); const d = Zip.xmlDoc(await Zip.text(en)); const deck = { name: file.name, type: 'odp', slides: [], clr: {}, fonts: {}, W: 0, H: 0, fontsUsed: [] };
  [...d.getElementsByTagName('*')].filter(n => n.localName === 'page' && n.namespaceURI.includes('drawing')).forEach((pg, i) => { const S = { i, path: '', doc: null, shapes: [], paras: [], issues: [], proposals: [], notes: '', title: '', bg: null }; [...pg.getElementsByTagName('*')].filter(n => (n.localName === 'p' || n.localName === 'h') && n.namespaceURI.includes('text')).forEach(p => { const t = p.textContent.trim(); if (!t) return; const sh = { kind: 'sp', paras: [], ph: null, fill: null, box: null }; const par = { el: null, text: t, sz: null, color: null, font: null, bold: false, pcs: [], errors: [], shape: sh, container: 'text' }; sh.paras.push(par); S.paras.push(par); S.shapes.push(sh); if (!S.title) { S.title = t; S.titleShape = sh; } }); deck.slides.push(S); });
  if (!deck.slides.length) throw new Error('Aucune diapositive trouvée dans cet ODP.'); return deck;
};
Slides.loadImages = async function (files) {
  if (!(App.engines.ocr && App.engines.ocr.available)) throw new Error("Les images de diapositives demandent le moteur OCR, qui est indisponible ici (" + ((App.engines.ocr && App.engines.ocr.reason) || 'serveur absent') + ').');
  const deck = { name: files.length > 1 ? `${files.length} images` : files[0].name, type: 'img', slides: [], clr: {}, fonts: {}, W: 0, H: 0, fontsUsed: [] };
  for (let i = 0; i < files.length; i++) { const f = files[i]; const url = URL.createObjectURL(f); const r = await fetch('api/ocr?lang=fra&psm=6', { method: 'POST', body: f }); const j = await r.json(); if (j.error) throw new Error(j.error); const S = { i, path: '', doc: null, shapes: [], paras: [], issues: [], proposals: [], notes: '', title: '', bg: null }; j.text.split('\n').filter(x => x.trim()).forEach(t => { const sh = { kind: 'sp', paras: [], ph: null, fill: null, box: null }; const par = { el: null, text: t.trim(), sz: null, color: null, font: null, bold: false, pcs: [], errors: [], shape: sh, container: 'text' }; sh.paras.push(par); S.paras.push(par); S.shapes.push(sh); }); if (S.paras[0]) { S.title = S.paras[0].text; S.titleShape = S.paras[0].shape; } S.issues.push({ type: 'limite', sev: 'info', msg: 'Texte lu par OCR : il peut contenir des erreurs de lecture. Taille et couleurs ne sont pas mesurables sur une image.' }); S.thumbEl = () => h('img', { src: url, alt: `Image ${i + 1}`, style: 'width:100%;display:block' }); deck.slides.push(S); }
  return deck;
};

// ====================================================================================================  Préparer mon exposé
App.reg({
  id: 'expose', title: 'Préparer mon exposé', group: 'outils', icon: '🎤', learn: true, render(el) {
    el.append(h('h1', null, 'Préparer mon exposé'));
    const deck = App.slides; if (!deck) return el.append(h('div', { class: 'notice' }, 'Charge d’abord une présentation dans « Analyse PowerPoint » : les notes orales, la lecture, le temps estimé et la fiche de révision partent de tes diapositives.'), h('a', { class: 'btn', href: '#/slides' }, 'Aller à l’analyse PowerPoint'));
    deck.oral = deck.oral || {}; const CON = ['Tout d’abord,', 'Ensuite,', 'Puis,'];
    const LOW = new Set('le la les l un une des il elle ils elles ce cet cette ces on nous vous je en dans pour avec sur par de du et ou mais car donc'.split(' '));
    const lowFirst = b => { const w = (b.match(/^[\p{L}]+/u) || [''])[0].toLowerCase(); return LOW.has(w) ? b.charAt(0).toLowerCase() + b.slice(1) : b; };
    const gen = S => { const v = Slides.view(S); const out = []; const first = S.i === 0; out.push(first && v.title ? `Bonjour à tous. Aujourd’hui, je vais vous présenter : ${v.title}.` : v.title ? `Sur cette diapositive : ${v.title}.` : `Voici la diapositive ${S.i + 1}.`);
      v.body.forEach((b, i) => { const w = Corrector.countWords(b); const last = i === v.body.length - 1; const c = v.body.length === 1 ? '' : last && i > 0 ? 'Enfin,' : CON[Math.min(i, 2)]; out.push(w <= 3 ? `Retenez : ${b}.` : `${c ? c + ' ' : ''}${c ? lowFirst(b) : b}.`); }); if (S.i === deck.slides.length - 1) out.push('Merci de votre attention. Avez-vous des questions ?'); return out.join(' '); };
    const wpm = () => Math.round(130 * App.prefs.ttsRate); const secs = t => Corrector.countWords(t) / wpm() * 60; const fmt = s => `${Math.floor(s / 60)} min ${String(Math.round(s % 60)).padStart(2, '0')} s`;
    const list = h('div'); const total = h('div', { class: 'card' });
    const draw = () => {
      list.replaceChildren(); let tt = 0; deck.slides.forEach(S => { const words = S.paras.filter(p => p.shape !== S.titleShape).reduce((a, p) => a + Corrector.countWords(p.text), 0); const heavy = words > 90 || S.paras.filter(p => p.text.trim() && p.shape !== S.titleShape).length > 8; const ta = h('textarea', { rows: 4, 'aria-label': `Notes orales, diapositive ${S.i + 1}` }); ta.value = deck.oral[S.i] ?? ''; const info = h('span', { class: 'muted' }); const upd = () => { deck.oral[S.i] = ta.value; info.textContent = `${Corrector.countWords(ta.value)} mots · ${fmt(secs(ta.value))}`; total.update(); }; ta.addEventListener('input', upd); tt += secs(ta.value);
        list.append(h('div', { class: 'card' }, h('div', { class: 'row' }, h('b', null, `Diapositive ${S.i + 1}${Slides.view(S).title ? ' — ' + Slides.view(S).title : ''}`), heavy ? h('span', { class: 'badge warn' }, 'trop chargée') : '', h('span', { class: 'grow' }), info), S.notes ? h('p', { class: 'muted' }, 'Notes d’origine : ' + S.notes) : '', ta, h('div', { class: 'row', style: 'margin-top:.4rem' }, h('button', { class: 'btn small', onclick: () => { ta.value = gen(S); upd(); } }, 'Proposer des notes'), App.listenBtn(() => ta.value || gen(S), '🔊 Lire'), App.stopBtn()))); upd(); });
      total.update(); }; total.update = () => { const all = deck.slides.map(S => deck.oral[S.i] || '').join(' '); total.replaceChildren(h('b', null, 'Temps estimé : '), `${fmt(secs(all))} (${Corrector.countWords(all)} mots à ${wpm()} mots par minute — ta vitesse de lecture dans les paramètres change cette estimation).`); };
    const heavyList = deck.slides.filter(S => S.issues.some(x => x.type === 'charge')).map(S => S.i + 1);
    el.append(h('p', { class: 'muted' }, `Présentation : ${deck.name} (${deck.slides.length} diapositives).`),
      h('div', { class: 'card' }, h('h2', { style: 'margin-top:0' }, 'Étapes'), h('ol', null, h('li', null, h('a', { href: '#/slides' }, 'Corriger les diapositives'), ' (texte, mise en page).'), h('li', null, 'Simplifier les textes : ', h('button', { class: 'btn small', onclick: () => { let n = 0; deck.slides.forEach(S => S.paras.forEach(p => { if (!p.text.trim() || p.shape === S.titleShape || !p.el) return; const r = Simp.simplify(p.text, App.prefs.simplLevel).text.replace(/\n+/g, ' '); if (r && r !== p.text) { S.proposals.push({ id: `${S.i}-s${n++}`, kind: 'text', para: p, start: 0, end: p.text.length, from: p.text, to: r, cat: 'amelio', msg: 'Texte simplifié (à relire : le sens doit rester le même).', on: false, mode: 2 }); } })); App.toast(`${n} simplification(s) ajoutée(s) : accepte-les dans « Analyse PowerPoint ».`); } }, 'Proposer des simplifications')), h('li', null, 'Diapositives trop chargées : ', heavyList.length ? heavyList.join(', ') : 'aucune.'), h('li', null, 'Écrire ou proposer les notes orales ci-dessous, les écouter, vérifier le temps.'), h('li', null, 'Créer la fiche de révision et le rapport PDF.'))), total, h('div', { class: 'row' }, h('button', { class: 'btn', onclick: () => { deck.slides.forEach(S => { if (!deck.oral[S.i]) deck.oral[S.i] = gen(S); }); draw(); } }, 'Proposer des notes pour toutes les diapositives'),
        h('button', { class: 'btn sec', onclick: () => { const t = deck.slides.map(S => deck.oral[S.i] || '').join('\n\n'); App.setText(t, 'Texte à dire — ' + deck.name, 'oral'); App.toast('Texte à dire défini comme document en cours.'); } }, 'Générer le texte à dire'), h('button', { class: 'btn sec', onclick: () => { const t = deck.slides.map(S => deck.oral[S.i] || '').join(' '); t.trim() ? App.speak(t) : App.toast('Aucune note à lire.'); } }, '🔊 Lire toutes les notes'), App.stopBtn(),
        h('button', { class: 'btn', onclick: async () => { const d = await Rep.head('Fiche de révision — exposé', deck.name); d.h2('Plan'); deck.slides.forEach(S => { const v = Slides.view(S); d.h2(`${S.i + 1}. ${v.title || 'Diapositive ' + (S.i + 1)}`); d.bullets(v.body); if (deck.oral[S.i]) d.text('À dire : ' + deck.oral[S.i], { size: 9.5, color: '#4b5563' }); }); const all = deck.slides.map(S => deck.oral[S.i] || '').join(' '); d.h2('Temps estimé'); d.text(fmt(secs(all))); const defs = TX.definitions(App.ws.text); if (defs.length) { d.h2('À retenir'); d.bullets(defs.slice(0, 8).map(x => `${x.term} : ${x.def}`)); } App.download(await d.save('Fiche exposé'), 'fiche-expose.pdf'); App.log('fiche PDF', deck.name, { count: 'fiches' }); } }, '📄 Fiche de révision PDF'), h('button', { class: 'btn sec', onclick: () => Slides.report().then(b => App.download(b, 'rapport-presentation.pdf')) }, '📄 Rapport PDF')), list); draw();
  }
});
