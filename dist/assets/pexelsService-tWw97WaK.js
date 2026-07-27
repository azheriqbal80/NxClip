async function o(e="gaming",t=15){try{const a=await fetch(`/api/pexels/search?query=${encodeURIComponent(e)}&per_page=${t}`);return a.ok?(await a.json()).photos:[]}catch{return[]}}export{o as s};
