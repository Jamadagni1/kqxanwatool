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

    applySandhi: function(w1, w2) {
        if (!w1 || !w2) return w1 + w2;
        let base = w1.slice(0, -1), last = w1.slice(-1), f = w2[0], rest = w2.slice(1);
        if (this.vowels.includes(f)) {
            if (last === 'ु' || last === 'ू') return base + '्' + this.join('व्' + f) + rest;
            if (last === 'ि' || last === 'ी') return base + '्' + this.join('य्' + f) + rest;
            if (last === '्') return w1 + f + rest;
        }
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

// ४. UI सेटअप
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

// ५. मुख्य शब्द निर्माण (१० चरणों की विस्तृत व्याख्या)
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

    steps.push(`<b>१. आरम्भ:</b> '${upa ? upa + ' + ' : ''}${dhatuStr}' धातु से '${rawPrat}' प्रत्यय का लक्ष्य।`);

    if(dData.anubandha !== "none") {
        steps.push(`<b>२. धातु इत्-संज्ञा:</b> अनुबंध '<b>${dData.anubandha}</b>' का लोप। शेष धातु: <b>${activeD}</b>`);
    } else {
        steps.push(`<b>२. धातु शुद्धि:</b> धातु शुद्ध रूप <b>${activeD}</b> में स्थित है।`);
    }

    if (rawPrat === "क्त्वा" && upa !== "") {
        steps.push(`<b>३. प्रत्यय आदेश:</b> उपसर्ग होने से 'क्त्वा' को <b>ल्यप्</b> (७.१.३७) हुआ।`);
        pData = pratyayaDB["ल्यप्"]; activeP = pData.real;
    } else {
        steps.push(`<b>३. प्रत्यय स्थिति:</b> प्रत्यय <b>'${rawPrat}'</b> का प्रयोग हुआ।`);
    }

    steps.push(`<b>४. प्रत्यय इत्-लोप:</b> ${pData.lopa}। शेष प्रत्यय: <b>${activeP}</b>`);

    let itAgama = false;
    let isValadi = !PaniniRules.vowels.includes(activeP[0]) && activeP[0] !== 'य';
    if (dData.isSet && isValadi && pData.type !== "kit") {
        itAgama = true;
        steps.push(`<b>५. इट्-आगम:</b> 'आर्धधातुकस्येड् वलादेः' (७.२.३५) से <b>'इ'</b> का आगम हुआ।`);
    } else {
        steps.push(`<b>५. इट्-आगम विचार:</b> वलादि न होने से आगम नहीं हुआ।`);
    }

    if (pData.type.includes("kit") || pData.type.includes("ngit")) {
        steps.push(`<b>६. गुण निषेध:</b> प्रत्यय कित्/ङित् होने से '<b>क्ङिति च</b>' (१.१.५) से गुण निषेध।`);
    } else if (pData.type.includes("nit") || pData.type.includes("nnit")) {
        activeD = PaniniRules.autoVriddhi(activeD);
        steps.push(`<b>६. वृद्धि कार्य:</b> 'अचो ञ्णिति' (७.२.११५) से वृद्धि होकर <b>${activeD}</b> बना।`);
    } else {
        let before = activeD;
        activeD = PaniniRules.autoGuna(activeD);
        if(before !== activeD) steps.push(`<b>६. गुण कार्य:</b> 'सार्वधातुकार्धधातुकयोः' (७.३.८४) से गुण होकर <b>${activeD}</b> बना।`);
        else steps.push(`<b>६. अङ्ग कार्य:</b> गुण की प्राप्ति नहीं है।`);
    }

    if (pData.kutva && (activeD.endsWith('च्') || activeD.endsWith('ज्'))) {
        activeD = activeD.replace(/च्$/, 'क्').replace(/ज्$/, 'ग्');
        steps.push(`<b>७. कुत्व विधि:</b> 'चजोः कु' (७.३.५२) से च्/ज् को क्/ग् हुआ -> <b>${activeD}</b>`);
    } else if (pData.type === "dit") {
        activeD = activeD.replace(/[अआइईउऊऋएऐओऔ][क-ह]्?$/, '');
        steps.push(`<b>७. टि-लोप:</b> 'टेः' (६.४.१४३) से अङ्ग के अन्त्य भाग का लोप हुआ।`);
    } else {
        steps.push(`<b>७. विशेष कार्य:</b> अन्य किसी विशेष विधि की आवश्यकता नहीं है।`);
    }

    let midP = itAgama ? "इ" + activeP : activeP;
    let res = PaniniRules.applySandhi(activeD, midP);
    steps.push(`<b>८. सन्धि:</b> धातु और प्रत्यय मिलकर <b>${PaniniRules.join(res)}</b> बने।`);

    if (upa) {
        let uBase = upa === "आङ्" ? "आ" : upa;
        res = PaniniRules.applySandhi(uBase, res);
        steps.push(`<b>९. उपसर्ग योग:</b> '${uBase}' उपसर्ग के साथ सन्धि होकर <b>${PaniniRules.join(res)}</b> बना।`);
    } else {
        steps.push(`<b>९. उपसर्ग विचार:</b> उपसर्ग का अभाव है।`);
    }

    let final = PaniniRules.join(res);
    if (pData.gender === "m") final += "ः";
    else if (pData.gender === "n") final += "म्";
    steps.push(`<b>१०. पद सिद्धि:</b> सुँ-विभक्ति कार्य के बाद रूप <b>${final}</b> सिद्ध हुआ।`);

    document.getElementById("finalOutput").innerText = final;
    document.getElementById("prakriyaSteps").innerHTML = steps.map(s => `<li class="step-item"><div>${s}</div></li>`).join("");
    document.getElementById("resultSection").classList.add("active");
    document.getElementById("prakriyaBox").classList.add("show");
}

// UI Helpers
function togglePrakriya() { document.getElementById("prakriyaBox").classList.toggle("show"); }
function toggleAccordion(e, el) { e.stopPropagation(); el.parentElement.classList.toggle("active"); }
function toggleSutraDropdown(e) { e.stopPropagation(); document.getElementById("sutraDropdown").classList.toggle("show"); }
function toggleDark() { 
    document.body.classList.toggle("dark"); 
    const icon = document.getElementById("theme-icon");
    if(document.body.classList.contains("dark")) icon.classList.replace("fa-moon", "fa-sun");
    else icon.classList.replace("fa-sun", "fa-moon");
}
function openSearchModal() { document.getElementById("searchModal").style.display = "block"; }
function closeSearchModal() { document.getElementById("searchModal").style.display = "none"; }
function toggleMobileMenu() { document.getElementById("nav-menu").classList.toggle("active"); }
function closeMobileMenu() { document.getElementById("nav-menu").classList.remove("active"); }

function performSearch() {
    let q = document.getElementById("searchInput").value.trim();
    let resDiv = document.getElementById("searchResults");
    if (!q || !sanskritDatabase.examples) return;
    let matched = sanskritDatabase.examples.filter(i => i.ex.includes(q) || (i.sutra && i.sutra.includes(q)));
    resDiv.innerHTML = matched.map(m => `<div class="result-card"><div class="ex-text">${m.ex}</div><div class="su-text">सूत्र: ${m.sutra}</div></div>`).join("");
}

window.onload = loadDatabase;
