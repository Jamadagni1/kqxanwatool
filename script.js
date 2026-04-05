let sanskritDatabase = { upasargas: [], dhatus: {}, examples: [] };
let pratyayaDB = {}; 

// १. डेटा लोड करना
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
            if (!response.ok) throw new Error(file.key + " missing");
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
        } catch (e) { console.warn("Load Warning:", e); }
    }
    initializeUI();
}

// २. UI भरना
function initializeUI() {
    const upaList = document.getElementById("upaList");
    const dList = document.getElementById("dhatuList");
    const pList = document.getElementById("pratList");
    const sutraDrop = document.getElementById("sutraDropdown");

    if (upaList) upaList.innerHTML = sanskritDatabase.upasargas.map(u => `<option value="${u.id}">${u.label}</option>`).join("");
    if (dList) dList.innerHTML = Object.keys(sanskritDatabase.dhatus).map(k => `<option value="${k}">${sanskritDatabase.dhatus[k].label}</option>`).join("");
    if (pList) pList.innerHTML = Object.keys(pratyayaDB).map(k => `<option value="${k}">${k}</option>`).join("");
    
    if (sutraDrop) {
        sutraDrop.innerHTML = "";
        Object.keys(sanskritDatabase).forEach(key => {
            if (Array.isArray(sanskritDatabase[key]) && (key.startsWith('pada') || key.includes('Sutras'))) {
                sanskritDatabase[key].forEach(s => {
                    sutraDrop.insertAdjacentHTML('beforeend', `
                        <div class="sutra-item">
                            <div class="sutra-header sanskrit-text" onclick="toggleAccordion(event, this)">
                                [${s.id || 'सूत्र'}] ${s.name} <i class="fa-solid fa-chevron-down"></i>
                            </div>
                            <div class="sutra-desc sanskrit-text">${s.desc}</div>
                        </div>`);
                });
            }
        });
    }
}

// ३. मुख्य शब्द निर्माण (Generate)
function generateKridanta() {
    const upa = document.getElementById("upasarga").value.trim();
    const dhatuStr = document.getElementById("dhatu").value.trim();
    const rawPrat = document.getElementById("pratyaya").value.trim();

    if(!dhatuStr || !rawPrat) return alert("धातु और प्रत्यय भरें!");

    let steps = [];
    let dData = sanskritDatabase.dhatus[dhatuStr] || { clean: dhatuStr };
    let pData = pratyayaDB[rawPrat] || { real: rawPrat, type: "akit", lopa: "कोई नहीं" };
    let activeD = dData.clean || dhatuStr;

    steps.push(`<b>आरम्भ:</b> ${upa ? upa + ' + ' : ''}${dhatuStr} + ${rawPrat}`);

    // आदेश कार्य (ल्यप्)
    if (rawPrat === "क्त्वा" && upa !== "") {
        steps.push(`<b>आदेश:</b> उपसर्ग होने से 'समासेऽनञ्पूर्वे क्त्वो ल्यप्' (7.1.37) से '<b>ल्यप्</b>' हुआ।`);
        pData = pratyayaDB["ल्यप्"] || { real: "य", type: "kit" };
    }

    steps.push(`<b>इत्-लोप:</b> ${pData.lopa || 'प्रक्रिया पूर्ण'}। शेष प्रत्यय: <b>${pData.real}</b>`);

    // गुण/वृद्धि
    if (pData.type === "kit" || pData.type === "ngit") {
        steps.push(`<b>निषेध:</b> 'क्ङिति च' (1.1.5) से गुण/वृद्धि निषेध।`);
    } else {
        let before = activeD;
        activeD = PaniniEngine.autoGuna(activeD);
        if(before !== activeD) steps.push(`<b>गुण:</b> 'सार्वधातुकार्धधातुकयोः' (7.3.84) से गुण होकर '<b>${activeD}</b>' बना।`);
    }

    // सन्धि
    let res = PaniniEngine.applySandhi(activeD, pData.real);
    
    // उपसर्ग योग
    if (upa) {
        let uBase = upa === "आङ्" ? "आ" : upa;
        res = PaniniEngine.applySandhi(uBase, res);
        steps.push(`<b>उपसर्ग योग:</b> 'उपसर्गाः क्रियायोगे' (1.4.59) के अनुसार सन्धि होकर '<b>${PaniniEngine.joinSanskrit(res)}</b>' बना।`);
    }

    let final = PaniniEngine.joinSanskrit(res);
    if (pData.gender === "m") final += "ः";
    if (pData.gender === "n") final += "म्";

    document.getElementById("finalOutput").innerText = final;
    document.getElementById("prakriyaSteps").innerHTML = steps.map((s, i) => `<li><span class="step-num">${i+1}</span> ${s}</li>`).join("");
    document.getElementById("resultSection").classList.add("active");
}

// UI Helpers
function togglePrakriya() { document.getElementById("prakriyaBox").classList.toggle("show"); }
function toggleAccordion(e, el) { e.stopPropagation(); el.parentElement.classList.toggle("active"); }
function toggleSutraDropdown(e) { e.stopPropagation(); document.getElementById("sutraDropdown").classList.toggle("show"); }
function toggleDark() { document.body.classList.toggle("dark"); }
function openSearchModal() { document.getElementById("searchModal").style.display = "block"; document.getElementById("searchInput").focus(); }
function closeSearchModal() { document.getElementById("searchModal").style.display = "none"; }
function toggleMobileMenu() { document.getElementById("nav-menu").classList.toggle("active"); }
function closeMobileMenu() { document.getElementById("nav-menu").classList.remove("active"); }

function performSearch() {
    let q = document.getElementById("searchInput").value.trim();
    let resDiv = document.getElementById("searchResults");
    if (!q || !sanskritDatabase.examples) return resDiv.innerHTML = "";
    let matched = sanskritDatabase.examples.filter(i => i.ex.includes(q) || (i.sutra && i.sutra.includes(q)));
    resDiv.innerHTML = matched.map(m => `
        <div class="result-card">
            <div class="ex-text sanskrit-text">${m.ex}</div>
            <div class="su-text"><b>सूत्र:</b> ${m.sutra}</div>
        </div>`).join("");
}

window.onload = loadDatabase;
