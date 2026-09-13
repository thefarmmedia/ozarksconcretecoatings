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

// The preset garage must use its checked pre-rendered files immediately. The
// live compositor is reserved for a customer's uploaded photograph.
context.fvApplyColor(true);
assert.equal(composites,0,'garage must not start the slow live compositor');
assert.equal(node('fvImgAfter').src,'/visualizer-previews/houndstooth.jpg');
node('fvImgAfter').onload();
context.fvState.color={name:'Carbon',slug:'Carbon'};
context.fvApplyColor(true);
assert.equal(composites,0,'color changes must remain instant');
assert.equal(node('fvImgAfter').src,'/visualizer-previews/carbon.jpg');
node('fvImgAfter').onload();
assert.equal(node('fvStage').attrs['aria-busy'],'false');

context.fvState.room='custom';
context.fvApplyColor(true);
assert.equal(composites,1,'customer photo must use the local compositor');
callbacks[0]('custom-live.jpg');
node('fvImgAfter').onload();
assert.equal(node('fvImgAfter').src,'custom-live.jpg');
const colorSource=html.match(/const FLAKE_COLORS = (\[[\s\S]*?\n\]);/)[1];
for (const color of JSON.parse(colorSource.replace(/,\s*\]/g,']'))) {
  for (const asset of [color.thumb,color.texture])
    assert.ok(fs.statSync(path.join(root,asset)).size>0,asset);
}
for(const file of ['floor-visualizer.html','instant-quote.html']) {
  const source=fs.readFileSync(path.join(root,file),'utf8');
  for(const match of source.matchAll(/<script(?![^>]*type="application\/ld\+json")[^>]*>([\s\S]*?)<\/script>/g)) new vm.Script(match[1]);
}
console.log('PASS: instant garage previews, local photo rendering, color assets, script syntax');
