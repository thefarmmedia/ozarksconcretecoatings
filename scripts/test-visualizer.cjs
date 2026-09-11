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
const loads = [];
let composites = 0;
const context = {
  document:{getElementById:node},
  Image:class{constructor(){loads.push(this)}},
  ROOMS:{garage:{image:'garage.jpg',alt:'Garage'},custom:{image:'private-data',alt:'My room'}},
  fvState:{room:'garage',color:{name:'Houndstooth',slug:'Houndstooth'}},
  fvRenderColorGrid(){},fvUpdateFavButton(){},fvUpdateQuoteLink(){},fvSyncUrl(){},fvTrack(){},
  fvComposite(room,color,callback){composites++;context.completeComposite=callback;}
};
vm.createContext(context);
vm.runInContext(html.slice(html.indexOf('var fvRenderRequest ='),html.indexOf('// ---------- photorealistic floor recolor')),context);
context.fvApplyColor(true);
assert.equal(loads[0].src,'visualizer-previews/houndstooth.jpg');
context.fvState.color={name:'Carbon',slug:'Carbon'};
context.fvApplyColor(true);
loads[0].onload();
assert.equal(node('fvImgAfter').src,undefined,'obsolete image must not overwrite selection');
loads[1].onload();
node('fvImgAfter').onload();
assert.equal(node('fvImgAfter').src,'visualizer-previews/carbon.jpg');
assert.equal(node('fvStage').attrs['aria-busy'],'false');
context.fvApplyColor(true);
loads[2].onerror();
assert.equal(composites,1,'missing pre-render must fall back to compositor');
context.completeComposite(null);
assert.match(node('fvRenderingIndicator').textContent,/could not load/);
assert.equal(node('fvImgAfter').style.opacity,'0','failed rendering must not show a stale coating');
context.fvState.room='custom';
context.fvApplyColor(true);
assert.equal(loads.length,3,'customer photo must not request a remote preview');
assert.equal(composites,2);
const colorSource=html.match(/const FLAKE_COLORS = (\[[\s\S]*?\n\]);/)[1];
for (const color of JSON.parse(colorSource.replace(/,\s*\]/g,']'))) {
  for (const asset of [color.thumb,color.texture,'visualizer-previews/'+color.slug.toLowerCase()+'.jpg'])
    assert.ok(fs.statSync(path.join(root,asset)).size>0,asset);
}
for(const file of ['floor-visualizer.html','instant-quote.html']) {
  const source=fs.readFileSync(path.join(root,file),'utf8');
  for(const match of source.matchAll(/<script(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
}
console.log('PASS: stale selections, image-load completion, render failure, local photo path, 27 preview assets, script syntax');
