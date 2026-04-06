// १. पाणिनि इंजन (इसी फाइल के अंदर सुरक्षित)
const Engine = {
    vowels: ['अ','आ','इ','ई','उ','ऊ','ऋ','ए','ऐ','ओ','औ'],
    
    join: function(t) {
        if (!t) return "";
        const m = { '्अ': '', '्आ': 'ा', '्इ': 'ि', '्ई': 'ी', '्उ': 'ु', '्ऊ': 'ू', '्ऋ': 'ृ', '्ए': 'े', '्ऐ': 'ै', '्ओ': 'ो', '्औ': 'ौ' };
        for (let k in m) t = t.split(k).join(m[k]);
        return t;
    },

    applyGuna: function(d) {
        return d.replace(/ि|ी$/, 'े').replace(/ु|ू$/, 'ो').replace(/ृ$/, 'र्')
                .replace(/ि(?=[क-ह]्$)/, 'े').replace(/ु(?=[क-ह]्$)/, 'ो').replace(/ृ(?=[क-ह]्$)/, 'र्');
    },

    applyVriddhi: function(d) {
        return d.replace(/ि|ी$/, 'ै').replace(/ु|ू$/, 'ौ').replace(/ृ$/, 'ार्')
                .replace(/अ(?=[क-ह]्$)/, 'आ');
    },

    sandhi: function(w1, w2) {
        if (!w1 || !w2) return w1 + w2;
        let last = w1.slice(-1), base = w1.slice(0, -1), f = w2[0], rest = w2.slice(1);
        if (this.vowels.includes(f)) {
            if (last === 'ि' || last === 'ी') return base + 'य्' + f + rest;
            if (last === 'ु' || last === 'ू') return base + 'व्' + f + rest;
            if (last === '्') return w1 + f + rest;
        }
        return w1 + w2;
    }
};

// २. डेटाबेस
let sanskritDatabase = { upasargas: [], dhatus: {}, examples: [] };
let pratyayaDB = {}; 

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
            const data = await response.json();
            if (file.key === 'dhatus') { sanskritDatabase.dhatus = data.dhatus; sanskritDatabase.upasargas = data.upasargas; }
            else if (file.key === 'pratyayas') { pratyayaDB = data.pratyayaDB; }
            else if (file.key === 'examples') { sanskritDatabase.examples = data.examples; }
            else { Object.assign(sanskritDatabase, data); }
        } catch (e) { console.error(file.key + " error"); }
    }
    initializeUI();
}

// ४. UI भरना
function initializeUI() {
    const upa = document.getElementById("upaList"), dht = document.getElementById("dhatuList"), prt = document.getElementById("pratList"), sut = document.getElementById("sutraDropdown");
    if (upa) upa.innerHTML = sanskritDatabase.upasargas.map(u => `<option value="${u.id}">${u.label}</option>`).join("");
    if (dht) dht.innerHTML = Object.keys(sanskritDatabase.dhatus).map(k => `<option value="${k}">${sanskritDatabase.dhatus[k].label}</option>`).join("");
    if (prt) prt.innerHTML = Object.keys(pratyayaDB).map(k => `<option value="${k}">${k}</option>`).join("");
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

// ५. मुख्य प्रक्रिया (Generate)
function generateKridanta() {
    const upa = document.getElementById("upasarga").value.trim();
    const dhatuStr = document.getElementById("dhatu").value.trim();
    const rawPrat = document.getElementById("pratyaya").value.trim();

    if(!dhatuStr || !rawPrat) return alert("कृपया धातु और प्रत्यय चुनें!");

    let steps = [];
    let dData = sanskritDatabase.dhatus[dhatuStr] || { clean: dhatuStr, anubandha: "none" };
    let pData = pratyayaDB[rawPrat] || { real: rawPrat, type: "akit", lopa: "कोई नहीं" };
    
    let activeD = dData.clean;
    let activeP = pData.real;

    steps.push(`<b>१. आरम्भ:</b> ${upa ? upa + ' + ' : ''}${dhatuStr} + ${rawPrat}`);
    
    if(dData.anubandha !== "none") steps.push(`<b>२. धातु इत्-लोप:</b> '${dData.anubandha}' का लोप होकर धातु <b>${activeD}</b> बची।`);
    
    if (rawPrat === "क्त्वा" && upa !== "") {
        steps.push(`<b>३. आदेश:</b> उपसर्ग होने से 'क्त्वा' को <b>ल्यप्</b> (य) आदेश हुआ।`);
        pData = pratyayaDB["ल्यप्"]; activeP = pData.real;
    }

    steps.push(`<b>४. प्रत्यय इत्-लोप:</b> ${pData.lopa}। शेष प्रत्यय: <b>${activeP}</b>`);

    if (pData.type.includes("kit") || pData.type.includes("ngit")) {
        steps.push(`<b>५. गुण निषेध:</b> 'क्ङिति च' से गुण/वृद्धि का निषेध हुआ।`);
    } else if (pData.type.includes("nit")) {
        activeD = Engine.applyVriddhi(activeD);
        steps.push(`<b>५. वृद्धि कार्य:</b> 'अचो ञ्णिति' से वृद्धि होकर <b>${activeD}</b> बना।`);
    } else {
        activeD = Engine.applyGuna(activeD);
        steps.push(`<b>५. गुण कार्य:</b> 'सार्वधातुकार्धधातुकयोः' से गुण होकर <b>${activeD}</b> बना।`);
    }

    let res = Engine.sandhi(activeD, activeP);
    steps.push(`<b>६. सन्धि:</b> धातु + प्रत्यय मेल से <b>${Engine.join(res)}</b> बना।`);

    if (upa) {
        let uBase = upa === "आङ्" ? "आ" : upa;
        res = Engine.sandhi(uBase, res);
        steps.push(`<b>७. उपसर्ग सन्धि:</b> '${uBase}' के साथ सन्धि होकर <b>${Engine.join(res)}</b> बना।`);
    }

    let final = Engine.join(res);
    if (pData.gender === "m") final += "ः";
    if (pData.gender === "n") final += "म्";
    steps.push(`<b>८. पद निर्माण:</b> सुँ-विभक्ति कार्य सम्पन्न हुआ।`);

    document.getElementById("finalOutput").innerText = final;
    document.getElementById("prakriyaSteps").innerHTML = steps.map((s, i) => `<li class="step-item"><div>${s}</div></li>`).join("");
    document.getElementById("resultSection").classList.add("active");
}

// UI Helpers
function togglePrakriya() { document.getElementById("prakriyaBox").classList.toggle("show"); }
function toggleAccordion(e, el) { e.stopPropagation(); el.parentElement.classList.toggle("active"); }
function toggleSutraDropdown(e) { e.stopPropagation(); document.getElementById("sutraDropdown").classList.toggle("show"); }
function toggleDark() { document.body.classList.toggle("dark"); }
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
