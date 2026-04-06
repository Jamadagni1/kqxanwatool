// १. ग्लोबल डेटाबेस प्रारुप
let sanskritDatabase = { upasargas: [], dhatus: {}, examples: [] };
let pratyayaDB = {}; 

// २. पाणिनीय व्याकरण के मुख्य नियम (Core Rules)
const PaniniRules = {
    vowels: "अआइईउऊऋएऐओऔ",
    
    join: function(t) {
        if (!t) return "";
        const m = { '्अ': '', '्आ': 'ा', '्इ': 'ि', '्ई': 'ी', '्उ': 'ु', '्ऊ': 'ू', '्ऋ': 'ृ', '्ए': 'े', '्ऐ': 'ै', '्ओ': 'ो', '्औ': 'ौ' };
        for (let k in m) t = t.split(k).join(m[k]);
        return t;
    },

    autoGuna: function(d) {
        if (!d) return "";
        let res = d.replace(/ि|ी$/, 'े').replace(/ु|ू$/, 'ो').replace(/ृ$/, 'र्');
        if (d.endsWith('्')) {
            res = d.replace(/ि([क-ह]्)$/, 'े$1').replace(/ु([क-ह]्)$/, 'ो$1').replace(/ृ([क-ह]्)$/, 'र्$1');
        }
        return res;
    },

    autoVriddhi: function(d) {
        if (!d) return "";
        let res = d.replace(/ि|ी$/, 'ै').replace(/ु|ू$/, 'ौ').replace(/ृ$/, 'ार्');
        if (d.endsWith('्')) {
            res = d.replace(/([क-ह])([क-ह]्)$/, '$1ा$2').replace(/ि([क-ह]्)$/, 'ै$1').replace(/ु([क-ह]्)$/, 'ौ$1').replace(/ृ([क-ह]्)$/, 'ार्$1');
        }
        return res;
    },

    // विशेष कुत्व और सन्धि नियम (भुज् + त्वा = भुक्त्वा)
    applySandhi: function(w1, w2) {
        if (!w1 || !w2) return w1 + w2;
        
        // ८.२.३० चोः कुः - पदान्ते/झलि (ज/च -> क्/ग्)
        if ((w1.endsWith('ज्') || w1.endsWith('च्')) && !this.vowels.includes(w2[0])) {
            w1 = w1.replace(/[ज्छ्]$/, 'क्');
        }

        let base = w1.slice(0, -1), last = w1.slice(-1), f = w2[0], rest = w2.slice(1);
        
        if (this.vowels.includes(f)) {
            if (last === 'ु' || last === 'ू') return base + '्' + this.join('व्' + f) + rest;
            if (last === 'ि' || last === 'ी') return base + '्' + this.join('य्' + f) + rest;
            if (last === '्') return w1 + f + rest;
        }
        
        // श्चुत्व/ष्टुत्व/जशत्व का सरलीकरण
        if (last === 'क्' && f === 'त') return base + 'क्त' + rest;
        if (last === 'श्' && f === 'त') return base + 'ष्ट' + rest;
        if (last === 'म्' && !this.vowels.includes(f)) return base + 'ं' + f + rest;

        return w1 + w2;
    }
};

// ३. डेटा लोड करना
async function loadDatabase() {
    const timestamp = new Date().getTime();
    const files = [
        { key: 'dhatus', url: `dhatus.json?v=${timestamp}` },
        { key: 'sutras', url: `sutras.json?v=${timestamp}` },
        { key: 'examples', url: `examples.json?v=${timestamp}` },
        { key: 'pratyayas', url: `pratyayas.json?v=${timestamp}` }
    ];

    for (const file of files) {
        try {
            const response = await fetch(file.url);
            if(response.ok) {
                const data = await response.json();
                if (file.key === 'dhatus') { sanskritDatabase.dhatus = data.dhatus; sanskritDatabase.upasargas = data.upasargas; }
                else if (file.key === 'pratyayas') { pratyayaDB = data.pratyayaDB; }
                else if (file.key === 'examples') { sanskritDatabase.examples = data.examples; }
                else { Object.assign(sanskritDatabase, data); }
            }
        } catch (e) { console.error(file.key + " load error"); }
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
}

function generateKridanta() {
    const upa = document.getElementById("upasarga").value.trim();
    const dhatuStr = document.getElementById("dhatu").value.trim();
    const rawPrat = document.getElementById("pratyaya").value.trim();

    if(!dhatuStr || !rawPrat) return alert("कृपया धातु और प्रत्यय चुनें!");

    let steps = [];
    let dData = sanskritDatabase.dhatus[dhatuStr] || { clean: dhatuStr, isSet: true, anubandha: "none" };
    let pData = pratyayaDB[rawPrat] || { real: rawPrat, type: "akit", lopa: "कोई नहीं" };
    
    let activeD = dData.clean || dhatuStr;
    let activeP = pData.real || rawPrat;

    steps.push(`<b>१. आरम्भ:</b> '${upa ? upa + ' + ' : ''}${dhatuStr}' धातु से '${rawPrat}' प्रत्यय की विवक्षा।`);

    if(dData.anubandha !== "none") {
        steps.push(`<b>२. इत्-लोप:</b> धातु के अनुबंध '<b>${dData.anubandha}</b>' का लोप हुआ। शेष: <b>${activeD}</b>`);
    }

    if (rawPrat === "क्त्वा" && upa !== "") {
        steps.push(`<b>३. आदेश:</b> उपसर्ग होने से 'समासेऽनञ्पूर्वे क्त्वो ल्यप्' (७.१.३७) से क्त्वा को <b>ल्यप्</b> हुआ।`);
        pData = pratyayaDB["ल्यप्"]; activeP = pData.real;
    }

    steps.push(`<b>४. प्रत्यय शुद्धि:</b> इत्-संज्ञा के बाद प्रत्यय <b>'${activeP}'</b> शेष बचा।`);

    // गुण/वृद्धि
    if (pData.type.includes("kit") || pData.type.includes("ngit")) {
        steps.push(`<b>५. गुण निषेध:</b> '<b>क्ङिति च</b>' (१.१.५) से गुण/वृद्धि का निषेध हुआ।`);
    } else if (pData.type.includes("nit") || pData.type.includes("nnit")) {
        activeD = PaniniRules.autoVriddhi(activeD);
        steps.push(`<b>५. वृद्धि:</b> ञित्/णित् प्रत्यय होने से वृद्धि होकर <b>${activeD}</b> बना।`);
    } else {
        let old = activeD;
        activeD = PaniniRules.autoGuna(activeD);
        if(old !== activeD) steps.push(`<b>५. गुण:</b> 'सार्वधातुकार्धधातुकयोः' से गुण होकर <b>${activeD}</b> बना।`);
    }

    // कुत्व (विशेष: भुज् + त्वा)
    if (activeD.endsWith('ज्') || activeD.endsWith('च्')) {
        let oldD = activeD;
        activeD = activeD.replace(/[ज्छ्]$/, 'क्');
        if (oldD !== activeD) steps.push(`<b>६. कुत्व विधि:</b> '<b>चोः कुः</b>' (८.२.३०) से जकार/चकार को ककार आदेश हुआ -> <b>${activeD}</b>`);
    } else {
        steps.push(`<b>६. कुत्व विचार:</b> धातु में कुत्व की आवश्यकता नहीं है।`);
    }

    // सन्धि
    let res = PaniniRules.applySandhi(activeD, activeP);
    steps.push(`<b>७. सन्धि:</b> वर्णों के मेल से <b>${PaniniRules.join(res)}</b> रूप बना।`);

    if (upa) {
        let uBase = upa === "आङ्" ? "आ" : upa;
        res = PaniniRules.applySandhi(uBase, res);
        steps.push(`<b>८. उपसर्ग योग:</b> उपसर्ग '${uBase}' के साथ सन्धि हुई।`);
    } else {
        steps.push(`<b>८. उपसर्ग विचार:</b> उपसर्ग का अभाव है।`);
    }

    let final = PaniniRules.join(res);
    
    if (pData.gender === "m") final += "ः";
    else if (pData.gender === "n") final += "म्";
    
    steps.push(`<b>९. विभक्ति कार्य:</b> लिङ्गानुसार सुँ-विभक्ति का प्रयोग हुआ।`);
    steps.push(`<b>१०. सिद्धि:</b> सम्पूर्ण प्रक्रिया के उपरान्त <b>${final}</b> रूप सिद्ध हुआ।`);

    document.getElementById("finalOutput").innerText = final;
    document.getElementById("prakriyaSteps").innerHTML = steps.map(s => `<li class="step-item"><div>${s}</div></li>`).join("");
    document.getElementById("resultSection").classList.add("active");
}

// UI Helpers
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
