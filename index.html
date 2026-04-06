// १. व्याकरण इंजन (All-in-One)
const PaniniRules = {
    vowels: "अआइईउऊऋएऐओऔ",
    join: function(t) {
        if (!t) return "";
        const m = { '्अ': '', '्आ': 'ा', '्इ': 'ि', '्ई': 'ी', '्उ': 'ु', '्ऊ': 'ू', '्ऋ': 'ृ', '्ए': 'े', '्ऐ': 'ै', '्ओ': 'ो', '्औ': 'ौ' };
        for (let k in m) t = t.split(k).join(m[k]);
        return t;
    },
    autoGuna: d => d.replace(/ि|ी$/, 'े').replace(/ु|ू$/, 'ो').replace(/ृ$/, 'र्').replace(/ि([क-ह]्)$/, 'े$1').replace(/ु([क-ह]्)$/, 'ो$1').replace(/ृ([क-ह]्)$/, 'र्$1'),
    autoVriddhi: d => d.replace(/ि|ी$/, 'ै').replace(/ु|ू$/, 'ौ').replace(/ृ$/, 'ार्').replace(/([क-ह])([क-ह]्)$/, '$1ा$2').replace(/ि([क-ह]्)$/, 'ै$1').replace(/ु([क-ह]्)$/, 'ौ$1').replace(/ृ([क-ह]्)$/, 'ार्$1'),
    applySandhi: function(w1, w2) {
        if (!w1 || !w2) return w1 + w2;
        if ((w1.endsWith('ज्') || w1.endsWith('च्')) && !this.vowels.includes(w2[0])) w1 = w1.replace(/[ज्छ्]$/, 'क्');
        let base = w1.slice(0, -1), last = w1.slice(-1), f = w2[0], rest = w2.slice(1);
        if (this.vowels.includes(f)) {
            if (last === 'ु' || last === 'ू') return base + '्' + this.join('व्' + f) + rest;
            if (last === 'ि' || last === 'ी') return base + '्' + this.join('य्' + f) + rest;
            if (last === '्') return w1 + f + rest;
        }
        if (last === 'क्' && f === 'त') return base + 'क्त' + rest;
        if (last === 'श्' && f === 'त') return base + 'ष्ट' + rest;
        if (last === 'म्' && !this.vowels.includes(f)) return base + 'ं' + f + rest;
        return w1 + w2;
    }
};

// २. डेटाबेस
let sanskritDatabase = { upasargas: [], dhatus: {}, examples: [] };
let pratyayaDB = {}; 

// ३. डेटा लोड करने का सबसे सुरक्षित तरीका
async function loadDatabase() {
    const timestamp = new Date().getTime();
    const files = [
        { key: 'dhatus', url: 'dhatus.json' },
        { key: 'sutras', url: 'sutras.json' },
        { key: 'examples', url: 'examples.json' },
        { key: 'pratyayas', url: 'pratyayas.json' }
    ];

    for (const file of files) {
        try {
            console.log(`Loading: ${file.url}...`);
            const response = await fetch(`${file.url}?v=${timestamp}`);
            if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
            const data = await response.json();
            
            if (file.key === 'dhatus') {
                sanskritDatabase.dhatus = data.dhatus || {};
                sanskritDatabase.upasargas = data.upasargas || [];
            } else if (file.key === 'pratyayas') {
                pratyayaDB = data.pratyayaDB || {};
            } else if (file.key === 'examples') {
                sanskritDatabase.examples = data.examples || [];
            } else {
                Object.assign(sanskritDatabase, data);
            }
        } catch (e) {
            console.error(`❌ ${file.key} लोड करने में फेल:`, e.message);
            // स्क्रीन पर मैसेज दिखाएँ
            const errDiv = document.createElement('div');
            errDiv.style.cssText = "background:red; color:white; padding:5px; font-size:12px; position:fixed; bottom:0; width:100%; z-index:9999;";
            errDiv.innerText = `चेतावनी: ${file.key}.json नहीं मिली। फाइल का नाम चेक करें।`;
            document.body.appendChild(errDiv);
        }
    }
    initializeUI();
}

function initializeUI() {
    const upa = document.getElementById("upaList"), dht = document.getElementById("dhatuList"), prt = document.getElementById("pratList"), sut = document.getElementById("sutraDropdown");
    
    if (upa) upa.innerHTML = (sanskritDatabase.upasargas || []).map(u => `<option value="${u.id}">${u.label}</option>`).join("");
    if (dht) dht.innerHTML = Object.keys(sanskritDatabase.dhatus || {}).map(k => `<option value="${k}">${sanskritDatabase.dhatus[k].label || k}</option>`).join("");
    if (prt) prt.innerHTML = Object.keys(pratyayaDB || {}).map(k => `<option value="${k}">${k}</option>`).join("");
    
    if (sut) {
        sut.innerHTML = "";
        Object.keys(sanskritDatabase).forEach(k => {
            if (Array.isArray(sanskritDatabase[k]) && (k.startsWith('pada') || k.includes('Sutras'))) {
                sanskritDatabase[k].forEach(s => {
                    sut.insertAdjacentHTML('beforeend', `<div class="sutra-item"><div class="sutra-header sanskrit-text" onclick="toggleAccordion(event, this)">[${s.id || ''}] ${s.name}</div><div class="sutra-desc">${s.desc}</div></div>`);
                });
            }
        });
    }
    console.log("UI Initialization Complete.");
}

// बाकी generateKridanta और UI Helpers वही रहेंगे...
function generateKridanta() {
    const upa = document.getElementById("upasarga").value.trim();
    const dhatuStr = document.getElementById("dhatu").value.trim();
    const rawPrat = document.getElementById("pratyaya").value.trim();

    if(!dhatuStr || !rawPrat) return alert("कृपया धातु और प्रत्यय चुनें!");

    let steps = [];
    let dData = sanskritDatabase.dhatus[dhatuStr] || { clean: dhatuStr, isSet: true, anubandha: "none" };
    let pData = pratyayaDB[rawPrat] || { real: rawPrat, type: "akit", lopa: "कोई नहीं" };
    let activeD = dData.clean, activeP = pData.real;

    steps.push(`<b>१. आरम्भ:</b> ${upa ? upa + ' + ' : ''}${dhatuStr} + ${rawPrat}`);
    if(dData.anubandha !== "none") steps.push(`<b>२. इत्-लोप:</b> धातु अनुबंध '${dData.anubandha}' लुप्त। शेष: <b>${activeD}</b>`);
    if (rawPrat === "क्त्वा" && upa !== "") { steps.push(`<b>३. आदेश:</b> उपसर्ग निमित्त 'क्त्वा' -> <b>ल्यप्</b>।`); pData = pratyayaDB["ल्यप्"]; activeP = pData.real; }
    steps.push(`<b>४. प्रत्यय शुद्धि:</b> इत्-लोप के बाद बचा: <b>${activeP}</b>`);

    if (pData.type.includes("kit") || pData.type.includes("ngit")) { steps.push(`<b>५. गुण निषेध:</b> 'क्ङिति च' से गुण/वृद्धि निषिद्ध।`); } 
    else if (pData.type.includes("nit")) { activeD = PaniniRules.autoVriddhi(activeD); steps.push(`<b>५. वृद्धि:</b> ञित्/णित् परे वृद्धि -> <b>${activeD}</b>`); } 
    else { activeD = PaniniRules.autoGuna(activeD); steps.push(`<b>५. गुण:</b> गुण कार्य सम्पन्न -> <b>${activeD}</b>`); }

    if (activeD.endsWith('ज्') || activeD.endsWith('च्')) { activeD = activeD.replace(/[ज्छ्]$/, 'क्'); steps.push(`<b>६. कुत्व:</b> 'चोः कुः' से च्/ज् -> <b>क्</b>।`); }
    let res = PaniniRules.applySandhi(activeD, activeP);
    steps.push(`<b>७. सन्धि:</b> वर्ण मेल से <b>${PaniniRules.join(res)}</b> बना।`);

    if (upa) { let uBase = upa === "आङ्" ? "आ" : upa; res = PaniniRules.applySandhi(uBase, res); steps.push(`<b>८. उपसर्ग योग:</b> '${uBase}' के साथ सन्धि।`); }
    let final = PaniniRules.join(res);
    if (pData.gender === "m") final += "ः"; else if (pData.gender === "n") final += "म्";
    steps.push(`<b>९. पद सिद्धि:</b> सुँ-विभक्ति कार्य सम्पन्न।`);
    steps.push(`<b>१०. फल:</b> <b>${final}</b> सिद्ध हुआ।`);

    document.getElementById("finalOutput").innerText = final;
    document.getElementById("prakriyaSteps").innerHTML = steps.map(s => `<li class="step-item"><div>${s}</div></li>`).join("");
    document.getElementById("resultSection").classList.add("active");
}

function togglePrakriya() { document.getElementById("prakriyaBox").classList.toggle("show"); }
function toggleAccordion(e, el) { e.stopPropagation(); el.parentElement.classList.toggle("active"); }
function toggleSutraDropdown(e) { e.stopPropagation(); document.getElementById("sutraDropdown").classList.toggle("show"); }
function toggleDark() { document.body.classList.toggle("dark"); }
function openSearchModal() { document.getElementById("searchModal").style.display = "block"; }
function closeSearchModal() { document.getElementById("searchModal").style.display = "none"; }
function performSearch() {
    let q = document.getElementById("searchInput").value.trim();
    let resDiv = document.getElementById("searchResults");
    if (!q || !sanskritDatabase.examples) return;
    let matched = sanskritDatabase.examples.filter(i => i.ex.includes(q) || (i.sutra && i.sutra.includes(q)));
    resDiv.innerHTML = matched.map(m => `<div class="result-card"><div class="ex-text">${m.ex}</div><div class="su-text">सूत्र: ${m.sutra}</div></div>`).join("");
}
window.onload = loadDatabase;
