/**
 * One entry of `<html data-switches-picks>`: `name:option`, each part
 * URI-encoded so names/options containing `,` `:` or quotes stay unambiguous
 * (and are safe inside a CSS string). Plain names are unchanged:
 * `pickToken("hero", "phone") === "hero:phone"`.
 */
export function pickToken(name: string, option: string): string {
  return encodeURIComponent(name) + ":" + encodeURIComponent(option);
}

/**
 * Blocking inline script, rendered as the first thing in <body>. Reads picks
 * from localStorage "switches:v1", then `?switches=` on top (URL wins per
 * section, same as createStore), and writes
 * `document.documentElement.dataset.switchesPicks = "hero:phone,pricing:simple"`.
 * Per-variant CSS keyed on that attribute hides non-picked versions before
 * first paint. Plain ES5, self-contained, never throws.
 *
 * URL parsing mirrors `parseUrlPicks` in core/store (a parity test enforces it).
 */
export const pickScript = `(function(){try{
var p=Object.create(null),h=Object.prototype.hasOwnProperty,k,s,r,v,t,i,j,n,o,out=[];
function dec(x){try{return decodeURIComponent(x)}catch(e){return null}}
try{s=window.localStorage.getItem("switches:v1");if(s){r=JSON.parse(s);if(r&&typeof r==="object"&&!Array.isArray(r)){for(k in r){if(!h.call(r,k))continue;v=r[k];if(v&&typeof v==="object"&&typeof v.option==="string"&&typeof v.path==="string"&&(v.note===undefined||typeof v.note==="string")&&(v.seen===undefined||typeof v.seen==="boolean"))p[k]=v.option}}}}catch(e){}
try{t=new URLSearchParams(location.search).get("switches");if(t){t=t.split(",");for(i=0;i<t.length;i++){j=t[i].indexOf(":");if(j<=0)continue;n=dec(t[i].slice(0,j));o=dec(t[i].slice(j+1));if(!n||!o)continue;p[n]=o}}}catch(e){}
for(k in p)out.push(encodeURIComponent(k)+":"+encodeURIComponent(p[k]));
if(out.length)document.documentElement.setAttribute("data-switches-picks",out.join(","));
}catch(e){}})();`;
