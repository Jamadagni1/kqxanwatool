let sanskritDatabase = { upasargas: [], dhatus: {}, examples: [] };
let pratyayaDB = {}; 

// १. डेटा लोड करना (JSON Files) - Optimized for Large Data
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
            if (!response.ok) throw new Error(file.key + " not found");
            const data = await response.json();
            
            if (file.key === 'dhatus') {
                sanskritDatabase.dhatus = data.dhatus || {};
                sanskritDatabase.upasargas = data.upasargas || [];
            } else if (file.key === 'pratyayas') {
                pratyayaDB = data.pratyayaDB || {};
            } else if (file.key === 'examples') {
                sanskritDatabase.examples = data.examples || [];
            } else {
                // सुत्रों के सभी पाद (pada_1_1 आदि) को डेटाबेस में जोड़ना
                Object.assign(sanskritDatabase, data);
            }
        } catch (e) { 
            console.warn(`Load Warning: ${file.key}.json लोड नहीं हो पाई।`, e); 
        }
    }
    initializeUI();
}

// २. UI भरना (Dropdowns & Sutra List)
function initializeUI() {
    const upaList = document.getElementById("upaList");
    const dList = document.getElementById("dhatuList");
    const pList = document.getElementById("pratList");
    const sutraDrop = document.getElementById("sutraDropdown");

    // ड्रॉपडाउन भरना
    if (upaList) upaList.innerHTML = sanskritDatabase.upasargas.map(u => `<option value="${u.id}">${u.label}</option>`).join("");
    if (dList) dList.innerHTML = Object.keys(sanskritDatabase.dhatus).map(k => `<option value="${k}">${sanskritDatabase.dhatus[k].label}</option>`).join("");
    if (pList) pList.innerHTML = Object.keys(pratyayaDB).map(k => `<option value="${k}">${k}</option>`).join("");
    
    // सुत्रों की सूची (Accordion)
    if (sutraDrop) {
        sutraDrop.innerHTML = "";
        Object.keys(sanskritDatabase).forEach(key => {
            // केवल उन कीज़ को लेना जो 'pada' या 'Sutras' से जुड़ी हैं
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

// ३. मुख्य शब्द निर्माण (Generate Kridanta)
function generateKridanta() {
    const upa = document.getElementById("upasarga").value.trim();
    const dhatuStr = document.getElementById("dhatu").value.trim();
    const rawPrat = document.getElementById("pratyaya").value.trim();

    if(!dhatuStr || !rawPrat) return alert("कृपया धातु और प्रत्यय चुनें!");

    // इंजन चेक
    if (!window.PaniniEngine) return alert("पाणिनि इंजन लोड नहीं हो सका!");

    let steps = [];
    let dData = sanskritDatabase.dhatus[dhatuStr] || { clean: dhatuStr };
    let pData = pratyayaDB[rawPrat] || { real: rawPrat, type: "akit", lopa: "अज्ञात" };
    let activeD = dData.clean || dhatuStr;

    // प्रक्रिया शुरू
    steps.push(`<b>आरम्भ:</b> ${upa ? upa + ' + ' : ''}${dhatuStr} + ${rawPrat}`);

    // आदेश कार्य (क्त्वा -> ल्यप्)
    if (rawPrat === "क्त्वा" && upa !== "") {
        steps.push(`<b>आदेश:</b> उपसर्ग होने से 'समासेऽनञ्पूर्वे क्त्वो ल्यप्' (7.1.37) से '<b>ल्यप्</b>' आदेश हुआ।`);
        pData = pratyayaDB["ल्यप्"] || { real: "य", type: "kit" };
    }

    steps.push(`<b>इत्-लोप:</b> प्रत्यय का शुद्ध रूप बचा: <b>${pData.real}</b>`);

    // गुण/वृद्धि कार्य
    if (pData.type === "kit" || pData.type === "ngit") {
        steps.push(`<b>निषेध:</b> प्रत्यय कित्/ङित् होने से '<b>क्ङिति च</b>' (1.1.5) द्वारा गुण/वृद्धि का निषेध।`);
    } else {
        let before = activeD;
        activeD = window.PaniniEngine.autoGuna(activeD);
        if(before !== activeD) steps.push(`<b>गुण:</b> 'सार्वधातुकार्धधातुकयोः' (7.3.84) से धातु को गुण होकर '<b>${activeD}</b>' बना।`);
    }

    // सन्धि कार्य (Engine Call)
    let res = window.PaniniEngine.applySandhi(activeD, pData.real);
    
    // उपसर्ग योग
    if (upa) {
        let uBase = upa === "आङ्" ? "आ" : upa;
        res = window.PaniniEngine.applySandhi(uBase, res);
        steps.push(`<b>उपसर्ग योग:</b> 'उपसर्गाः क्रियायोगे' (1.4.59) के अनुसार सन्धि होकर '<b>${window.PaniniEngine.joinSanskrit(res)}</b>' सिद्ध हुआ।`);
    }

    let final = window.PaniniEngine.joinSanskrit(res);
    
    // विभक्ति कार्य
    if (pData.gender === "m") final += "ः";
    else if (pData.gender === "n") final += "म्";

    // UI Result Display
    document.getElementById("finalOutput").innerText = final;
    document.getElementById("prakriyaSteps").innerHTML = steps.map((s, i) => `
        <li class="step-item">
            <div style="background:#3b82f6; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-weight:bold;">${i+1}</div>
            <div>${s}</div>
        </li>`).join("");
    
    document.getElementById("resultSection").classList.add("active");
    document.getElementById("prakriyaBox").classList.remove("show"); // डिफ़ॉल्ट रूप से स्टेप्स छुपाएं
}

// ४. सर्च फंक्शन (Examples Search)
function performSearch() {
    let q = document.getElementById("searchInput").value.trim();
    let resDiv = document.getElementById("searchResults");
    if (!q || !sanskritDatabase.examples) { resDiv.innerHTML = ""; return; }
    
    let matched = sanskritDatabase.examples.filter(i => 
        i.ex.includes(q) || (i.sutra && i.sutra.includes(q))
    );
    
    resDiv.innerHTML = matched.map(m => `
        <div class="result-card">
            <div class="ex-text sanskrit-text">${m.ex}</div>
            <div class="su-text"><b>सूत्र:</b> ${m.sutra}</div>
        </div>`).join("");
}

// ५. UI Interaction Helpers
function togglePrakriya() { document.getElementById("prakriyaBox").classList.toggle("show"); }
function toggleAccordion(e, el) { e.stopPropagation(); el.parentElement.classList.toggle("active"); }
function toggleSutraDropdown(e) { e.stopPropagation(); document.getElementById("sutraDropdown").classList.toggle("show"); }
function toggleMobileMenu() { document.getElementById("nav-menu").classList.toggle("active"); }
function closeMobileMenu() { document.getElementById("nav-menu").classList.remove("active"); }
function toggleDark() { 
    document.body.classList.toggle("dark"); 
    const icon = document.getElementById("theme-icon");
    if(document.body.classList.contains("dark")) icon.classList.replace("fa-moon", "fa-sun");
    else icon.classList.replace("fa-sun", "fa-moon");
}
function openSearchModal() { document.getElementById("searchModal").style.display = "block"; document.getElementById("searchInput").focus(); }
function closeSearchModal() { document.getElementById("searchModal").style.display = "none"; }

// बाहरी क्लिक पर ड्रॉपडाउन बंद करना
window.onclick = (e) => { if (!e.target.closest('.nav-dropdown')) document.getElementById("sutraDropdown").classList.remove("show"); };

window.onload = loadDatabase;
