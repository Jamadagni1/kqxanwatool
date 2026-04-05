// --- EMERGENCY ENGINE BACKUP ---
if (typeof window.PaniniEngine === 'undefined') {
    window.PaniniEngine = {
        joinSanskrit: function(t){ return t.replace(/्अ/g,'').replace(/्आ/g,'ा').replace(/्इ/g,'ि').replace(/्ई/g,'ी').replace(/्उ/g,'ु').replace(/्ऊ/g,'ू').replace(/्ऋ/g,'ृ').replace(/्ए/g,'े').replace(/्ऐ/g,'ै').replace(/्ओ/g,'ो').replace(/्औ/g,'ौ'); },
        autoGuna: function(d){ if(!d)return ""; if(d.endsWith('ि')||d.endsWith('ी'))return d.slice(0,-1)+'े'; if(d.endsWith('ु')||d.endsWith('ू'))return d.slice(0,-1)+'ो'; if(d.endsWith('ृ'))return d.slice(0,-1)+'र्'; return d.replace(/ि([क-ह]्)$/,'े$1').replace(/ु([क-ह]्)$/,'ो$1').replace(/ृ([क-ह]्)$/,'र्$1'); },
        autoVriddhi: function(d){ if(!d)return ""; if(d.endsWith('ि')||d.endsWith('ी'))return d.slice(0,-1)+'ै'; if(d.endsWith('ु')||d.endsWith('ू'))return d.slice(0,-1)+'ौ'; if(d.endsWith('ृ'))return d.slice(0,-1)+'ार्'; if(d.endsWith('्')) return d.replace(/([क-ह])([क-ह]्)$/, '$1ा$2').replace(/ि([क-ह]्)$/, 'ै$1').replace(/ु([क-ह]्)$/, 'ौ$1').replace(/ृ([क-ह]्)$/, 'ार्$1'); return d; },
        applySandhi: function(w1,w2){ if(!w1||!w2)return w1+w2; let s1=w1.slice(0,-1),l=w1.slice(-1),f=w2[0],s2=w2.slice(1); if("अआइईउऊऋएऐओऔ".includes(f)){ if(l==='ु'||l==='ू')return s1+'्'+this.joinSanskrit('व्'+f)+s2; if(l==='ि'||l==='ी')return s1+'्'+this.joinSanskrit('य्'+f)+s2; if(l==='्')return w1+f+s2; } return w1+w2; }
    };
}

let sanskritDatabase = { upasargas: [], dhatus: {}, examples: [] };
let pratyayaDB = {}; 

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
        } catch (e) { console.warn(file.key + " not loaded"); }
    }
    initializeUI();
}

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
                    sutraDrop.insertAdjacentHTML('beforeend', `<div class="sutra-item"><div class="sutra-header sanskrit-text" onclick="toggleAccordion(event, this)">[${s.id || 'सूत्र'}] ${s.name} <i class="fa-solid fa-chevron-down"></i></div><div class="sutra-desc sanskrit-text">${s.desc}</div></div>`);
                });
            }
        });
    }
}

function generateKridanta() {
    const upa = document.getElementById("upasarga").value.trim();
    const dhatuStr = document.getElementById("dhatu").value.trim();
    const rawPrat = document.getElementById("pratyaya").value.trim();

    if(!dhatuStr || !rawPrat) return alert("धातु और प्रत्यय भरें!");

    let steps = [];
    let dData = sanskritDatabase.dhatus[dhatuStr] || { clean: dhatuStr, isSet: true, anubandha: "none" };
    let pData = pratyayaDB[rawPrat] || { real: rawPrat, type: "akit", lopa: "कोई नहीं" };
    
    let activeD = dData.clean || dhatuStr;
    let activeP = pData.real;

    steps.push(`<b>आरम्भ:</b> ${upa ? upa + ' + ' : ''}${dhatuStr} + ${rawPrat}`);

    // १. धातु इत्-लोप
    if(dData.anubandha && dData.anubandha !== "none") {
        steps.push(`<b>इत्-संज्ञा:</b> धातु में से '<b>${dData.anubandha}</b>' का लोप हुआ। शेष धातु: <b>${activeD}</b>`);
    }

    // २. प्रत्यय आदेश (ल्यप्)
    if (rawPrat === "क्त्वा" && upa !== "") {
        steps.push(`<b>आदेश:</b> उपसर्ग होने से 'समासेऽनञ्पूर्वे क्त्वो ल्यप्' (7.1.37) से 'क्त्वा' को '<b>ल्यप्</b>' हुआ।`);
        pData = pratyayaDB["ल्यप्"];
        activeP = pData.real;
    }

    // ३. प्रत्यय इत्-लोप
    steps.push(`<b>प्रत्यय इत्-लोप:</b> ${pData.lopa}। शेष प्रत्यय: <b>${activeP}</b>`);

    // ४. अङ्ग कार्य (गुण/वृद्धि/निषेध)
    if (pData.type === "kit" || pData.type === "ngit" || pData.type === "git") {
        steps.push(`<b>निषेध:</b> प्रत्यय कित्/ङित् होने से '<b>क्ङिति च</b>' (1.1.5) द्वारा गुण/वृद्धि का निषेध।`);
    } else if (pData.type === "nnit" || pData.type === "nit") {
        let before = activeD;
        activeD = window.PaniniEngine.autoVriddhi(activeD);
        steps.push(`<b>वृद्धि:</b> प्रत्यय ञित्/णित् होने से 'अचो ञ्णिति/अत उपधायाः' द्वारा वृद्धि -> <b>${activeD}</b>`);
    } else {
        let before = activeD;
        activeD = window.PaniniEngine.autoGuna(activeD);
        if(before !== activeD) steps.push(`<b>गुण:</b> 'सार्वधातुकार्धधातुकयोः' (7.3.84) द्वारा गुण -> <b>${activeD}</b>`);
    }

    // ५. कुत्व कार्य (यदि प्रत्यय में नियम हो)
    if (pData.kutva && (activeD.endsWith('च्') || activeD.endsWith('ज्'))) {
        let old = activeD;
        activeD = activeD.replace(/च्$/, 'क्').replace(/ज्$/, 'ग्');
        steps.push(`<b>कुत्व:</b> 'चजोः कु घिण्ण्यतोः' (7.3.52) से च्/ज् को क्/ग् हुआ -> <b>${activeD}</b>`);
    }

    // ६. टि-लोप (डित् प्रत्यय हेतु)
    if (pData.type === "dit") {
        activeD = activeD.replace(/[अआइईउऊऋएऐओऔ][क-ह]्?$/, '');
        steps.push(`<b>टि-लोप:</b> प्रत्यय 'डित्' होने से 'टेः' (6.4.143) द्वारा अन्त्य भाग का लोप -> <b>${activeD}</b>`);
    }

    // ७. सन्धि कार्य
    let res = window.PaniniEngine.applySandhi(activeD, activeP);
    
    // ८. उपसर्ग योग
    if (upa) {
        let uBase = upa === "आङ्" ? "आ" : upa;
        let finalSandhi = window.PaniniEngine.applySandhi(uBase, res);
        let joinedU = window.PaniniEngine.joinSanskrit(finalSandhi);
        steps.push(`<b>उपसर्ग सन्धि:</b> 'उपसर्गाः क्रियायोगे' (1.4.59) के नियमों से सिद्ध रूप बना -> <b>${joinedU}</b>`);
        res = finalSandhi;
    }

    let final = window.PaniniEngine.joinSanskrit(res);
    
    // ९. विभक्ति/लिङ्ग
    if (pData.gender === "m") {
        final += "ः";
        steps.push(`<b>पद निर्माण:</b> पुँल्लिङ्ग में सुँ-विभक्ति (विसर्ग) लगकर '<b>${final}</b>' बना।`);
    } else if (pData.gender === "n") {
        final += "म्";
        steps.push(`<b>पद निर्माण:</b> नपुंसकलिङ्ग में सुँ को 'अम्' होकर '<b>${final}</b>' बना।`);
    }

    // UI Result Display
    document.getElementById("finalOutput").innerText = final;
    document.getElementById("prakriyaSteps").innerHTML = steps.map((s, i) => `
        <li class="step-item">
            <div style="background:#3b82f6; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-weight:bold;">${i+1}</div>
            <div>${s}</div>
        </li>`).join("");
    
    document.getElementById("resultSection").classList.add("active");
}

function togglePrakriya() { document.getElementById("prakriyaBox").classList.toggle("show"); }
function toggleAccordion(e, el) { e.stopPropagation(); el.parentElement.classList.toggle("active"); }
function toggleSutraDropdown(e) { e.stopPropagation(); document.getElementById("sutraDropdown").classList.toggle("show"); }
function toggleDark() { 
    document.body.classList.toggle("dark"); 
    const icon = document.getElementById("theme-icon");
    if(document.body.classList.contains("dark")) icon.classList.replace("fa-moon", "fa-sun");
    else icon.classList.replace("fa-sun", "fa-moon");
}
function openSearchModal() { document.getElementById("searchModal").style.display = "block"; document.getElementById("searchInput").focus(); }
function closeSearchModal() { document.getElementById("searchModal").style.display = "none"; }

function performSearch() {
    let q = document.getElementById("searchInput").value.trim();
    let resDiv = document.getElementById("searchResults");
    if (!q || !sanskritDatabase.examples) return resDiv.innerHTML = "";
    let matched = sanskritDatabase.examples.filter(i => i.ex.includes(q) || (i.sutra && i.sutra.includes(q)));
    resDiv.innerHTML = matched.map(m => `<div class="result-card"><div class="ex-text sanskrit-text">${m.ex}</div><div class="su-text"><b>सूत्र:</b> ${m.sutra}</div></div>`).join("");
}

window.onload = loadDatabase;
