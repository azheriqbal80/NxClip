import{c as p}from"./index-CQCVjOyc.js";/**
 * @license lucide-react v0.546.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const h=[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]],A=p("history",h);class r extends Error{constructor(e,a="UNKNOWN"){super(e),this.name="AIError",this.code=a}}async function s(t){try{const e=await fetch("/api/ai/generate",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(t)});if(!e.ok){const a=await e.json();throw new Error(a.error||"AI Proxy request failed")}return await e.json()}catch(e){return m(e)}}function m(t){console.error("AI Service Error:",t);const e=(t==null?void 0:t.message)||String(t);throw e.includes("429")||e.toLowerCase().includes("rate limit")||e.toLowerCase().includes("quota")?new r("AI is currently under heavy load or rate limited. Please wait a moment and try again.","RATE_LIMIT"):e.includes("SAFETY")||e.toLowerCase().includes("safety filters")||e.toLowerCase().includes("blocked")||e.toLowerCase().includes("candidate")?new r("Content was flagged by AI safety filters. Please try a different, more appropriate prompt.","SAFETY_BLOCK"):e.toLowerCase().includes("api key")||e.includes("403")?new r("AI service configuration error. Please check your API key settings.","API_KEY_ERROR"):e.toLowerCase().includes("invalid")||e.includes("400")?new r("Invalid request sent to the AI. Please refine your prompt and try again.","INVALID_PROMPT"):new r(e||"An unexpected error occurred while connecting to the AI service.","UNKNOWN")}async function w(t,e=[],a=[],o){var i;const l=a.length>0?`

USER CREATIONS CONTEXT:
${a.map(n=>{var c;return`- Type: ${n.type}, Prompt: ${n.prompt||"N/A"}, Status: ${n.status}, Created: ${new Date(((c=n.createdAt)==null?void 0:c.seconds)*1e3).toLocaleDateString()}`}).join(`
`)}`:`

(No creation history found)`,d=`You are the nxclip.ai AI Creator Coach, a premium expert in viral gaming content and channel growth. 

CORE MISSION: Help gamers use nxclip.ai to its maximum potential to grow on YouTube, TikTok, and Instagram.

COACHING STYLE:
1. PRODUCT EXPERT: Proactively suggest how to use nxclip tools (Image Studio, Meme Generator, Clipper) to solve the user's growth problems.
2. ACTIONABLE: Always respond in brief, numbered steps. No fluff.
3. PLATFORM SPECIFIC: Give unique advice for YouTube Shorts vs TikTok FYP vs Instagram Reels.
4. STRATEGIC: Provide tactical advice on content strategy, identifying viral trends, and optimizing posting frequency.
5. GAMING FOCUSED: Use high-level gaming meta and terminology.
6. PERSONALIZED: Use the provided Creator Profile and Creation Context to tailor your advice specifically to the user's niche and audience.

When a user asks for advice, ALWAYS include a tip on how they can use an nxclip feature to achieve that result faster.

If the user asks about their specific creations (e.g., "Why was my clip rejected?", "How can I improve my recent memes?"), use the provided creation context to give specific feedback.${o?`

CREATOR PROFILE CONTEXT:
- Name/Handle: ${o.creatorName||"N/A"}
- Games Played: ${((i=o.games)==null?void 0:i.join(", "))||"N/A"}
- Target Audience: ${o.audience||"N/A"}
- Content Goals: ${o.goal||"N/A"}
- Posting Frequency: ${o.frequency||"N/A"}`:`

(No creator profile found)`}${l}`,u=[...e.map(n=>({role:n.role==="user"?"user":"model",parts:[{text:n.text}]})),{role:"user",parts:[{text:t}]}];return(await s({model:"gemini-3.6-flash",contents:u,config:{systemInstruction:d}})).text}async function I(t){const e=await s({model:"gemini-3.6-flash",contents:`Generate 3 catchy, professional gaming social media captions for an image described as: "${t}". 
    Each caption should include 3-5 relevant gaming hashtags. 
    Return the result as a JSON array of strings.`,config:{responseMimeType:"application/json",responseSchema:{type:"ARRAY",items:{type:"STRING",description:"A single social media caption with hashtags."}}}});return e.text?JSON.parse(e.text):[]}async function C(t){const e=await s({model:"gemini-3.6-flash",contents:`Generate a catchy, short title (max 5 words) for a gaming creation described as: "${t}". 
    Return the result as a JSON object with a single "title" field.`,config:{responseMimeType:"application/json",responseSchema:{type:"OBJECT",properties:{title:{type:"STRING"}},required:["title"]}}});return e.text?JSON.parse(e.text).title:""}export{r as A,A as H,I as a,w as c,C as g};
