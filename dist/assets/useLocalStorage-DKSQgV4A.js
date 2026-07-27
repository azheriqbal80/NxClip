import{c as h,r as o,c9 as i}from"./index-CQCVjOyc.js";/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const l=[["rect",{width:"20",height:"8",x:"2",y:"2",rx:"2",ry:"2",key:"ngkwjq"}],["rect",{width:"20",height:"8",x:"2",y:"14",rx:"2",ry:"2",key:"iecqi9"}],["line",{x1:"6",x2:"6.01",y1:"6",y2:"6",key:"16zg32"}],["line",{x1:"6",x2:"6.01",y1:"18",y2:"18",key:"nzw8ys"}]],w=h("server",l);/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=[["path",{d:"M10 5H3",key:"1qgfaw"}],["path",{d:"M12 19H3",key:"yhmn1j"}],["path",{d:"M14 3v4",key:"1sua03"}],["path",{d:"M16 17v4",key:"1q0r14"}],["path",{d:"M21 12h-9",key:"1o4lsq"}],["path",{d:"M21 19h-5",key:"1rlt1p"}],["path",{d:"M21 5h-7",key:"1oszz2"}],["path",{d:"M8 10v4",key:"tgpxqk"}],["path",{d:"M8 12H3",key:"a7s4jb"}]],p=h("sliders-horizontal",u);function k(t,n){const a=o.useCallback(()=>{try{const e=i.getItem(t);return e!==null?e:n}catch(e){return console.warn(`Error reading localStorage key "${t}":`,e),n}},[t,n]),[s,d]=o.useState(a),y=o.useCallback(e=>{try{const r=e instanceof Function?e(s):e;if(d(r),i.setItem(t,r),typeof window<"u")try{window.dispatchEvent(new Event("storage"))}catch{try{const c=document.createEvent("Event");c.initEvent("storage",!0,!0),window.dispatchEvent(c)}catch{}}}catch(r){console.warn(`Error setting localStorage key "${t}":`,r)}},[t,s]);return o.useEffect(()=>{const e=()=>{d(a())};return window.addEventListener("storage",e),()=>window.removeEventListener("storage",e)},[a]),[s,y]}export{w as S,p as a,k as u};
