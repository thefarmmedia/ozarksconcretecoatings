// Run from the repository with @napi-rs/canvas installed: node scripts/render-visualizer.cjs
// Uses the page's actual compositor; no alternative rendering implementation.
const fs=require('fs'),vm=require('vm'),path=require('path');
const {createCanvas,loadImage}=require('@napi-rs/canvas');
const root=path.resolve(__dirname, '..');
const html=fs.readFileSync(root+'/floor-visualizer.html','utf8');
const ctx={console,setTimeout,document:{createElement:()=>createCanvas(1,1)}};vm.createContext(ctx);
vm.runInContext(html.slice(html.indexOf('var ROOMS ='),html.indexOf('var ROOM_ORDER'))+html.slice(html.indexOf('const FLAKE_COLORS ='),html.indexOf('const FLAKE_COLORS =')+html.slice(html.indexOf('const FLAKE_COLORS =')).indexOf('\n];')+3)+html.slice(html.indexOf('var fvCanvasCache ='),html.indexOf('function fvUpdateQuoteLink(){')),ctx);
ctx.fvLoadImage=async src=>{const img=await loadImage(path.join(root,src));Object.defineProperty(img,'naturalWidth',{value:img.width});Object.defineProperty(img,'naturalHeight',{value:img.height});return img;};
(async()=>{for(const name of (process.argv.length > 2 ? process.argv.slice(2) : vm.runInContext('FLAKE_COLORS.map(c=>c.slug)',ctx))){const t=Date.now(); const result=await vm.runInContext(`new Promise(resolve=>fvComposite(ROOMS.garage,FLAKE_COLORS.find(c=>c.slug===${JSON.stringify(name)}),resolve))`,ctx);if(!result?.startsWith('data:'))throw Error('render failed');fs.writeFileSync(path.join(root,'visualizer-previews',name.toLowerCase()+'.jpg'),Buffer.from(result.split(',')[1],'base64'));console.log(name,Date.now()-t);}})();
