const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'floor-visualizer.html'), 'utf8');
const nodes = new Map();
function node(id) {
  if (!nodes.has(id)) nodes.set(id, {style:{}, attrs:{}, classList:{add(){},remove(){}}, setAttribute(k,v){this.attrs[k]=v;}});
  return nodes.get(id);
}
const callbacks = [];
let composites = 0;
const context = {
  document:{getElementById:node},
  Image:class{},
  ROOMS:{garage:{image:'garage.jpg',alt:'Garage'},custom:{image:'private-data',alt:'My room'}},
  fvState:{room:'garage',color:{name:'Houndstooth',slug:'Houndstooth'}},
  fvRenderColorGrid(){},fvUpdateFavButton(){},fvUpdateQuoteLink(){},fvSyncUrl(){},fvTrack(){},
  fvComposite(room,color,callback){composites++;callbacks.push(callback);}
};
vm.createContext(context);
vm.runInContext(html.slice(html.indexOf('var fvRenderRequest ='),html.indexOf('// ---------- photorealistic floor recolor')),context);

// The preset garage must use the live compositor. Old pre-rendered previews
// belong to the previous garage photo and would make before/after inconsistent.
context.fvApplyColor(true);
assert.equal(composites,1,'garage must render against the active room photo');
context.fvState.color={name:'Carbon',slug:'Carbon'};
context.fvApplyColor(true);
assert.equal(composites,2,'each color change must start a fresh room render');
callbacks[0]('stale.jpg');
assert.equal(node('fvImgAfter').src,undefined,'obsolete render must not overwrite selection');
callbacks[1]('carbon-live.jpg');
node('fvImgAfter').onload();
assert.equal(node('fvImgAfter').src,'carbon-live.jpg');
assert.equal(node('fvStage').attrs['aria-busy'],'false');

context.fvApplyColor(true);
assert.equal(composites,3);
callbacks[2](null);
assert.match(node('fvRenderingIndicator').textContent,/could not load/);
assert.equal(node('fvImgAfter').style.opacity,'0','failed rendering must not show a stale coating');
context.fvState.room='custom';
context.fvApplyColor(true);
assert.equal(composites,4,'customer photo must also use the local compositor');
const colorSource=html.match(/const FLAKE_COLORS = (\[[\s\S]*?\n\]);/)[1];
for (const color of JSON.parse(colorSource.replace(/,\s*\]/g,']'))) {
  for (const asset of [color.thumb,color.texture])
    assert.ok(fs.statSync(path.join(root,asset)).size>0,asset);
}
for(const file of ['floor-visualizer.html','instant-quote.html']) {
  const source=fs.readFileSync(path.join(root,file),'utf8');
  for(const match of source.matchAll(/<script(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
}
console.log('PASS: live garage rendering, stale selections, render failure, local photo path, color assets, script syntax');
