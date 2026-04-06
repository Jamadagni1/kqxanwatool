let sanskritDatabase = {};
let pratyayaDB = {}; 

// ==================================================
// 1. वर्ण संयोजन और सन्धि (Halant + Vowel Joiner & Sandhi)
// ==================================================
function joinSanskrit(text) {
    const vowelMap = { '्अ': '', '्आ': 'ा', '्इ': 'ि', '्ई': 'ी', '्उ': 'ु', '्ऊ': 'ू', '्ऋ': 'ृ', '्ए': 'े', '्ऐ': 'ै', '्ओ': 'ो', '्औ': 'ौ' };
    for (let [key, val] of Object.entries(vowelMap)) { text = text.split(key).join(val); }
    return text;
}

function autoGuna(d) {
    if (d.endsWith('ि') || d.endsWith('ी')) return d.slice(0, -1) + 'े';
    if (d.endsWith('ु') || d.endsWith('ू')) return d.slice(0, -1) + 'ो';
    if (d.endsWith('ृ')) return d.slice(0, -1) + 'र्'; 
    if (d.endsWith('्')) {
        return d.replace(/ि([क-ह]्)$/, 'े$1').replace(/ु([क-ह]्)$/, 'ो$1').replace(/ृ([क-ह]्)$/, 'र्$1');
    }
    return d; 
}

function autoVriddhi(d) {
    if (d.endsWith('ि') || d.endsWith('ी')) return d.slice(0, -1) + 'ै';
    if (d.endsWith('ु') || d.endsWith('ू')) return d.slice(0, -1) + 'ौ';
    if (d.endsWith('ृ')) return d.slice(0, -1) + 'ार्'; 
    if (d.endsWith('्') && !d.match(/[ािीुूृेैोौ][क-ह]्$/) && !d.match(/[क-ह]्[क-ह]्$/)) {
        return d.replace(/([क-ह])([क-ह]्)$/, '$1ा$2'); 
    }
    if (d.endsWith('्')) {
        return d.replace(/ि([क-ह]्)$/, 'ै$1').replace(/ु([क-ह]्)$/, 'ौ$1').replace(/ृ([क-ह]्)$/, 'ार्$1');
    }
    return d; 
}

function applySandhi(word1, word2) {
    if (!word1) return word2;
    if (!word2) return word1;

    let w1 = word1.slice(0, -1); 
    let lastChar = word1.slice(-1); 
    let firstChar = word2.charAt(0); 
    let w2 = word2.slice(1); 

    let isVowel = ['अ','आ','इ','ई','उ','ऊ','ऋ','ए','ऐ','ओ','औ'].includes(firstChar);
    let isConsonantWithImplicitA = "कखगघङचछजझञटठडढणतथदधनपफबभमयरलवशषसह".includes(lastChar);

    if (isConsonantWithImplicitA) {
        if (firstChar === 'अ' || firstChar === 'आ') return w1 + lastChar + 'ा' + w2; 
        if (firstChar === 'इ' || firstChar === 'ई') return w1 + lastChar + 'े' + w2; 
        if (firstChar === 'उ' || firstChar === 'ऊ') return w1 + lastChar + 'ो' + w2; 
        if (firstChar === 'ऋ') return w1 + lastChar + 'र्' + w2; 
        if (firstChar === 'ए' || firstChar === 'ऐ') return w1 + lastChar + 'ै' + w2;
        if (firstChar === 'ओ' || firstChar === 'औ') return w1 + lastChar + 'ौ' + w2;
    }

    // --- ६.१.७७ इको यणचि (सुधार: व्/य् के साथ स्वर को तुरंत जोड़ना ताकि पिछला वर्ण आधा रहे) ---
    if ((lastChar === 'ि' || lastChar === 'ी') && isVowel) return w1 + '्' + joinSanskrit('य्' + firstChar) + w2;
    if ((lastChar === 'ु' || lastChar === 'ू') && isVowel) return w1 + '्' + joinSanskrit('व्' + firstChar) + w2;
    if ((lastChar === 'ृ' || lastChar === 'ॄ') && isVowel) return w1 + '्' + joinSanskrit('र्' + firstChar) + w2;

    if (lastChar === 'े' && isVowel) return w1 + joinSanskrit('य्' + firstChar) + w2; 
    if (lastChar === 'ै' && isVowel) return w1 + joinSanskrit('ाय्' + firstChar) + w2;
    if (lastChar === 'ो' && isVowel) return w1 + joinSanskrit('व्' + firstChar) + w2;
    if (lastChar === 'ौ' && isVowel) return w1 + joinSanskrit('ाव्' + firstChar) + w2;

    if (lastChar === 'म्' && !isVowel) return w1 + 'ं' + firstChar + w2;

    if (lastChar === 'श्' && firstChar === 'त') return w1 + 'ष्ट' + w2; 
    if (lastChar === 'च्' && firstChar === 'त') return w1 + 'क्त' + w2; 
    if (lastChar === 'ज्' && firstChar === 'त') return w1 + 'क्त' + w2; 

    return word1 + word2;
}

// ==================================================
// 2. डेटाबेस लोडिंग (Concurrent JSON loading)
// ==================================================
async function loadDatabase() {
    try {
        const timestamp = new Date().getTime();
        const [dhatusRes, sutrasRes, examplesRes, pratyayasRes] = await Promise.all([
            fetch(`dhatus.json?v=${timestamp}`),
            fetch(`sutras.json?v=${timestamp}`),
            fetch(`examples.json?v=${timestamp}`),
            fetch(`pratyayas.json?v=${timestamp}`)
        ]);

        if (!dhatusRes.ok || !sutrasRes.ok || !examplesRes.ok || !pratyayasRes.ok) {
            throw new Error("JSON files missing or broken.");
        }

        const dhatusData = await dhatusRes.json();
        const sutrasData = await sutrasRes.json();
        const examplesData = await examplesRes.json();
        const pratyayasData = await pratyayasRes.json();

        sanskritDatabase = { ...dhatusData, ...sutrasData, ...examplesData };
        pratyayaDB = pratyayasData.pratyayaDB;

        initializeUI();
    } catch (error) { 
        console.error(error);
        alert("डेटा लोड नहीं हो सका। कृपया JSON फ़ाइलों की जाँच करें।"); 
    }
}

function initializeUI() {
    let upaList = document.getElementById("upaList");
    if (upaList && sanskritDatabase.upasargas) {
        upaList.innerHTML = '<option value="">कोई उपसर्ग नहीं</option>';
        sanskritDatabase.upasargas.forEach(u => { if(u.id !== "") upaList.insertAdjacentHTML('beforeend', `<option value="${u.id}">${u.label}</option>`); });
    }
    
    let dhatuList = document.getElementById("dhatuList");
    if (dhatuList && sanskritDatabase.dhatus) {
        dhatuList.innerHTML = '<option value="">धातु चुनें...</option>';
        for (let key in sanskritDatabase.dhatus) { 
            dhatuList.insertAdjacentHTML('beforeend', `<option value="${key}">${sanskritDatabase.dhatus[key].label}</option>`); 
        }
    }
    
    let pratList = document.getElementById("pratList");
    if (pratList && pratyayaDB) {
        pratList.innerHTML = '<option value="">प्रत्यय चुनें...</option>';
        for (let key in pratyayaDB) { 
            pratList.insertAdjacentHTML('beforeend', `<option value="${key}">${key}</option>`); 
        }
    }

    let dropdownContainer = document.getElementById("sutraDropdown");
    if (dropdownContainer) {
        dropdownContainer.innerHTML = "";
        const padaConfig = [
            { key: 'samjnaSutras', color: '#10b981' }, { key: 'pada_1_2', color: '#3b82f6' }, { key: 'pada_1_3', color: '#ec4899' }, { key: 'pada_1_4', color: '#eab308' },
            { key: 'pada_2_1', color: '#b91c1c' }, { key: 'pada_2_2', color: '#f97316' }, { key: 'pada_2_3', color: '#d946ef' }, { key: 'pada_2_4', color: '#06b6d4' },
            { key: 'pada_3_1', color: '#8b5cf6' }, { key: 'pada_3_2', color: '#14b8a6' }, { key: 'pada_3_3', color: '#6366f1' }, { key: 'pada_3_4', color: '#dc2626' },
            { key: 'pada_4_1', color: '#f472b6' }, { key: 'pada_4_2', color: '#9333ea' }, { key: 'pada_4_3', color: '#e11d48' }, { key: 'pada_4_4', color: '#10b981' },
            { key: 'pada_5_1', color: '#4f46e5' }, { key: 'pada_5_2', color: '#ea580c' }, { key: 'pada_5_3', color: '#14b8a6' }, { key: 'pada_5_4', color: '#0ea5e9' },
            { key: 'pada_6_1', color: '#78350f' }, { key: 'pada_6_2', color: '#475569' }, { key: 'pada_6_3', color: '#3b82f6' }, { key: 'pada_6_4', color: '#f59e0b' },
            { key: 'pada_7_1', color: '#8b5cf6' }, { key: 'pada_7_2', color: '#db2777' }, { key: 'pada_7_3', color: '#0284c7' }, { key: 'pada_7_4', color: '#84cc16' },
            { key: 'pada_8_1', color: '#dc2626' }, { key: 'pada_8_2', color: '#f97316' }, { key: 'pada_8_3', color: '#eab308' }, { key: 'pada_8_4', color: '#ec4899' }
        ];
        padaConfig.forEach(config => {
            if (sanskritDatabase[config.key]) {
                sanskritDatabase[config.key].forEach(s => {
                    dropdownContainer.insertAdjacentHTML('beforeend', `<div class="sutra-item" style="border-left: 3px solid ${config.color};"><div class="sutra-header sanskrit-text" onclick="toggleAccordion(event, this)">[${s.id}] ${s.name} <i class="fa-solid fa-chevron-down"></i></div><div class="sutra-desc sanskrit-text"><br>${s.desc}<br><br></div></div>`);
                });
            }
        });
    }
}
window.onload = loadDatabase;

// ==================================================
// 🛠️ 3. DYNAMIC PANINIAN ENGINE 🛠️
// ==================================================
function generateKridanta() {
    let upa = document.getElementById("upasarga").value.trim();
    let dhatuStr = document.getElementById("dhatu").value.trim();
    let rawPratStr = document.getElementById("pratyaya").value.trim().replace(/\s+/g, '');

    if(!dhatuStr || !rawPratStr) { alert("कृपया कम से कम एक धातु और प्रत्यय टाइप करें!"); return; }

    let steps = [];
    let baseForm = "";
    let finalForm = "";

    steps.push(`<b>शुरुआत:</b> ${upa ? upa + ' + ' : ''}${dhatuStr} + ${rawPratStr}`);

    let pratStr = rawPratStr;
    if (pratStr === "क्त्वा" && upa !== "") {
        steps.push(`उपसर्ग होने के कारण 'समासेऽनञ्पूर्वे क्त्वो ल्यप्' (7.1.37) से 'क्त्वा' को 'ल्यप्' आदेश हुआ।`);
        pratStr = "ल्यप्";
    }

    let dhatuData = sanskritDatabase.dhatus ? sanskritDatabase.dhatus[dhatuStr] : null;
    let activeDhatu = dhatuStr;

    if (!dhatuData) {
        steps.push(`<i>(नोट: धातु कस्टम है, सिस्टम सामान्य उपधा नियमों से काम कर रहा है)</i>`);
        dhatuData = { isSet: true, guna: autoGuna(dhatuStr), vriddhi: autoVriddhi(dhatuStr), clean: dhatuStr };
    } else {
        activeDhatu = dhatuData.clean;
        if(dhatuData.anubandha && dhatuData.anubandha !== "none") {
            steps.push(`<b>इत्-संज्ञा व लोप:</b> 'आदिर्ञिटुडवः/हलन्त्यम्' आदि से <b>${dhatuData.anubandha}</b> का लोप हुआ। शेष धातु: <b>${activeDhatu}</b>`);
        }
    }

    let pratData = pratyayaDB[pratStr];
    if (!pratData) {
        steps.push(`<i>(नोट: प्रत्यय डेटाबेस में नहीं है, सिस्टम सामान्य रूप से जोड़ रहा है)</i>`);
        pratData = { real: pratStr, type: "akit", lopa: "अज्ञात" };
    } else {
        steps.push(`<b>इत्-लोप:</b> ${pratData.lopa}। शेष बचा: <b>${pratData.real}</b>`);
    }

    let activePratyaya = pratData.real;

    if (pratData.type === "kit" || pratData.type === "ngit" || pratData.type === "git") {
        steps.push(`<b>गुण/वृद्धि निषेध:</b> प्रत्यय कित्/ङित्/गित् है, अतः 'क्ङिति च (1.1.5)' से गुण/वृद्धि निषिद्ध।`);
    } else if (pratData.type === "nnit" || pratData.type === "nit") {
        activeDhatu = dhatuData.vriddhi;
        steps.push(`<b>वृद्धि:</b> प्रत्यय ञित्/णित् होने से 'अचो ञ्णिति/अत उपधायाः' से धातु को वृद्धि -> <b>${activeDhatu}</b>`);
    } else {
        activeDhatu = dhatuData.guna;
        steps.push(`<b>गुण:</b> 'सार्वधातुकार्धधातुकयोः' से धातु को गुण हुआ -> <b>${activeDhatu}</b>`);
    }

    if (pratData.kutva || pratData.type === "ghit") {
        if (activeDhatu.endsWith('च्') || activeDhatu.endsWith('ज्')) {
            activeDhatu = activeDhatu.replace(/च्$/, 'क्').replace(/ज्$/, 'ग्');
            steps.push(`<b>कुत्व:</b> 'चजोः कु घिण्ण्यतोः' से 'च्/ज्' के स्थान पर 'क्/ग्' हुआ -> <b>${activeDhatu}</b>`);
        }
    }

    if (pratData.type === "dit") {
        activeDhatu = activeDhatu.replace(/[अाइईउऊऋएऐओऔ][क-ह]्?$/, ''); 
        steps.push(`<b>टि-लोप:</b> डित् प्रत्यय परे होने से 'टेः' (6.4.143) से अन्त्य भाग का लोप -> <b>${activeDhatu}</b>`);
    }

    if (pratStr === "ल्यप्") {
        let shortVowels = ["अ", "इ", "उ", "ऋ", "ि", "ु", "ृ"]; 
        if (shortVowels.includes(activeDhatu.slice(-1))) {
            activePratyaya = "त्य";
            steps.push(`<b>तुक् आगम:</b> धातु ह्रस्वान्त है, अतः 'ह्रस्वस्य पिति कृति तुक्' से 'त्' जुड़ा।`);
        }
    }

    if ((activeDhatu.endsWith("म्") || activeDhatu.endsWith("न्")) && (pratData.type === "kit" || pratData.type === "ngit")) {
        activeDhatu = activeDhatu.slice(0, -1);
        steps.push(`<b>अनुनासिक लोप:</b> 'अनुदात्तोपदेश...' (6.4.37) से म्/न् का लोप हुआ -> <b>${activeDhatu}</b>`);
    }

    let isValadi = !['अ','आ','इ','ई','उ','ऊ','ए','ऐ','ओ','औ', 'य'].includes(activePratyaya.charAt(0));
    let itAgama = false;
    if (dhatuData.isSet && isValadi && pratStr !== "ल्यप्") {
        itAgama = true;
        steps.push(`<b>इट्-आगम:</b> धातु 'सेट्' है और प्रत्यय वलादि है, अतः 'आर्धधातुकस्येड् वलादेः' (7.2.35) से 'इ' का आगम हुआ।`);
    }

    if (itAgama) baseForm = applySandhi(activeDhatu, "इ" + activePratyaya);
    else baseForm = applySandhi(activeDhatu, activePratyaya);

    if (baseForm.includes("म्त") || baseForm.includes("म्त्व")) {
        baseForm = baseForm.replace("म्त", "न्त").replace("म्त्व", "न्त्व");
        steps.push(`<b>परसवर्ण:</b> 'अनुस्वारस्य ययि परसवर्णः' से 'म्' को 'न्' हुआ।`);
    }

    // अंतिम वर्ण संयोजन (Join)
    let joinedForm = joinSanskrit(baseForm);
    if(baseForm !== joinedForm) {
        steps.push(`<b>वर्ण संयोजन:</b> स्वर और व्यंजन मिलकर पूर्ण पद बने -> <b>${joinedForm}</b>`);
        baseForm = joinedForm;
    }

    if (pratData.gender === "m") {
        baseForm = baseForm + "ः";
        steps.push(`<b>सुप्-विभक्ति:</b> पुँल्लिङ्ग प्रथमा एकवचन 'सु' का विसर्ग (ः) हुआ -> <b>${baseForm}</b>`);
    } else if (pratData.gender === "n") {
        baseForm = baseForm + "म्";
        steps.push(`<b>सुप्-विभक्ति:</b> नपुंसकलिङ्ग में 'सु' को 'अम्' हुआ -> <b>${baseForm}</b>`);
    } else if (pratData.gender === "f") {
        baseForm = baseForm + "ः"; 
        steps.push(`<b>सुप्-विभक्ति:</b> स्त्रीलिङ्ग प्रथमा एकवचन 'सु' का विसर्ग (ः) हुआ -> <b>${baseForm}</b>`);
    }

    if (upa !== "") {
        let uBase = upa === "आङ्" ? "आ" : upa;
        steps.push(`<b>उपसर्ग योग:</b> '${uBase}' का '${baseForm}' के साथ योग।`);
        finalForm = applySandhi(uBase, baseForm);
        finalForm = joinSanskrit(finalForm);
        if(finalForm !== uBase + baseForm) steps.push(`<b>सन्धि:</b> पाणिनीय सन्धि नियमों से शब्द बना -> <b>${finalForm}</b>`);
    } else {
        finalForm = baseForm;
    }

    steps.push(`<b>सिद्ध रूप:</b> <span style="color:#ec4899; font-size:1.2em;">${finalForm}</span>`);

    document.getElementById("finalOutput").innerText = finalForm;
    let stepsHtml = steps.map((s, index) => `<li class="step-item"><div style="background:#3b82f6; color:white; width:28px; height:28px; border-radius:50%; display:flex; align-items:center; justify-content:center; flex-shrink:0; font-weight:bold; font-size:14px;">${index+1}</div> <div>${s}</div></li>`).join("");
    document.getElementById("prakriyaSteps").innerHTML = stepsHtml;

    document.getElementById("resultSection").classList.add("active");
    document.getElementById("prakriyaBox").classList.remove("show");
    setTimeout(() => { document.getElementById("resultSection").scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 100);
}

// UI Interaction Helpers
function togglePrakriya() { document.getElementById("prakriyaBox").classList.toggle("show"); }
function toggleMobileMenu() {
    const nav = document.getElementById("nav-menu");
    const icon = document.getElementById("menu-icon");
    nav.classList.toggle("active");
    if(nav.classList.contains("active")) { icon.classList.replace("fa-bars", "fa-xmark"); document.body.style.overflow = "hidden"; } 
    else { icon.classList.replace("fa-xmark", "fa-bars"); document.body.style.overflow = "auto"; }
}
function closeMobileMenu() { if(window.innerWidth <= 768) toggleMobileMenu(); }
function toggleSutraDropdown(event) { event.stopPropagation(); document.getElementById("sutraDropdown").classList.toggle("show"); }
function toggleAccordion(event, element) { event.stopPropagation(); element.parentElement.classList.toggle("active"); }
window.onclick = function(event) { if (!event.target.closest('.nav-dropdown')) document.querySelectorAll(".dropdown-content.show").forEach(el => el.classList.remove('show')); }
function toggleDark() {
    document.body.classList.toggle("dark");
    document.getElementById("theme-icon").classList.replace(document.body.classList.contains("dark") ? "fa-moon" : "fa-sun", document.body.classList.contains("dark") ? "fa-sun" : "fa-moon");
    closeMobileMenu();
}
function openSearchModal() { document.getElementById("searchModal").style.display = "block"; document.getElementById("searchInput").focus(); }
function closeSearchModal() { document.getElementById("searchModal").style.display = "none"; document.getElementById("searchInput").value = ""; document.getElementById("searchResults").innerHTML = ""; }
window.addEventListener('click', function(event) { if (event.target == document.getElementById("searchModal")) closeSearchModal(); });

function getSutraDetails(sutraId) {
    const allArrays = [
        'samjnaSutras', 'pada_1_2', 'pada_1_3', 'pada_1_4', 'pada_2_1', 'pada_2_2', 'pada_2_3', 'pada_2_4', 
        'pada_3_1', 'pada_3_2', 'pada_3_3', 'pada_3_4', 'pada_4_1', 'pada_4_2', 'pada_4_3', 'pada_4_4',
        'pada_5_1', 'pada_5_2', 'pada_5_3', 'pada_5_4', 'pada_6_1', 'pada_6_2', 'pada_6_3', 'pada_6_4',
        'pada_7_1', 'pada_7_2', 'pada_7_3', 'pada_7_4', 'pada_8_1', 'pada_8_2', 'pada_8_3', 'pada_8_4'
    ];
    for (let arrayName of allArrays) {
        if (sanskritDatabase[arrayName]) {
            let foundSutra = sanskritDatabase[arrayName].find(s => s.id === sutraId);
            if (foundSutra) return foundSutra;
        }
    }
    return { name: "अज्ञात सूत्र", desc: "विवरण उपलब्ध नहीं" };
}

function performSearch() {
    let query = document.getElementById("searchInput").value.trim();
    let resultsDiv = document.getElementById("searchResults");
    if (query.length === 0) { resultsDiv.innerHTML = ""; return; }
    if (!sanskritDatabase.examples) { resultsDiv.innerHTML = `<p style="color:red; text-align:center;">डेटाबेस लोड हो रहा है...</p>`; return; }

    let matchedExamples = sanskritDatabase.examples.filter(item => item.ex.includes(query) || item.sutra.includes(query));
    if (matchedExamples.length === 0) { resultsDiv.innerHTML = `<p style="color:red; text-align:center; margin-top:20px;">कोई परिणाम नहीं मिला।</p>`; return; }

    let htmlOutput = "";
    matchedExamples.forEach(match => {
        let sutraInfo = getSutraDetails(match.sutra);
        let regex = new RegExp(query, 'gi');
        let highlightedEx = match.ex.replace(regex, `<span style="background-color:yellow; color:black; border-radius:2px; padding:0 2px;">$&</span>`);
        htmlOutput += `<div class="result-card"><div class="ex-text sanskrit-text">${highlightedEx}</div><div class="su-text sanskrit-text"><b>सूत्र:</b> [${match.sutra}] ${sutraInfo.name}</div><div class="desc-text sanskrit-text">${sutraInfo.desc}</div></div>`;
    });
    resultsDiv.innerHTML = htmlOutput;
}
