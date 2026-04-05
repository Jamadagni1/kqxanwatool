// १. डेटा और डेटाबेस प्रारुप
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
        } catch (e) { console.warn(file.key + " लोड नहीं हो सकी"); }
    }
    initializeUI();
}

// २. मुख्य निर्माण प्रक्रिया (१० विस्तृत चरण)
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

    // --- १० चरणों की विस्तृत प्रक्रिया ---

    // १. उद्देश्य (Aim)
    steps.push(`<b>१. आरम्भ:</b> '${upa ? upa + ' + ' : ''}${dhatuStr}' धातु से '${rawPrat}' प्रत्यय करने का लक्ष्य निर्धारित हुआ।`);

    // २. धातु इत्-लोप (Dhatu Anubandha)
    if(dData.anubandha && dData.anubandha !== "none") {
        steps.push(`<b>२. धातु इत्-संज्ञा:</b> 'आदिर्ञिटुडवः' या 'हलन्त्यम्' से <b>${dData.anubandha}</b> की इत्-संज्ञा और लोप हुआ। शेष धातु: <b>${activeD}</b>`);
    } else {
        steps.push(`<b>२. धातु शुद्धि:</b> धातु में कोई अनुबंध शेष नहीं है, शुद्ध रूप: <b>${activeD}</b>`);
    }

    // ३. प्रत्यय आदेश (Pratyaya Adesha)
    if (rawPrat === "क्त्वा" && upa !== "") {
        steps.push(`<b>३. प्रत्यय आदेश:</b> उपसर्ग होने के कारण 'समासेऽनञ्पूर्वे क्त्वो ल्यप्' (७.१.३७) से क्त्वा को <b>ल्यप्</b> आदेश हुआ।`);
        pData = pratyayaDB["ल्यप्"] || { real: "य", type: "kit", lopa: "ल्, प् इत्" };
        activeP = pData.real;
    } else {
        steps.push(`<b>३. प्रत्यय स्थिति:</b> विवक्षित प्रत्यय <b>'${rawPrat}'</b> अपनी मूल स्थिति में विद्यमान है।`);
    }

    // ४. प्रत्यय इत्-लोप (Pratyaya Anubandha)
    steps.push(`<b>४. प्रत्यय इत्-लोप:</b> ${pData.lopa || 'अनुबंधों'} का लोप हुआ। प्रक्रिया हेतु केवल <b>'${activeP}'</b> शेष बचा।`);

    // ५. अङ्ग कार्य - गुण (Guna)
    let gunaOccured = false;
    if (pData.type === "kit" || pData.type === "ngit" || pData.type === "git") {
        steps.push(`<b>५. गुण निषेध:</b> प्रत्यय कित्/ङित् होने से '<b>क्ङिति च</b>' (१.१.५) द्वारा गुण कार्य का निषेध हुआ।`);
    } else {
        let before = activeD;
        activeD = window.PaniniEngine.autoGuna(activeD);
        if(before !== activeD) {
            steps.push(`<b>५. गुण कार्य:</b> 'सार्वधातुकार्धधातुकयोः' (७.३.८४) से इगन्त अङ्ग को गुण होकर '<b>${activeD}</b>' बना।`);
            gunaOccured = true;
        } else {
            steps.push(`<b>५. गुण विचार:</b> अङ्ग में गुण की प्राप्ति नहीं है।`);
        }
    }

    // ६. अङ्ग कार्य - वृद्धि (Vriddhi)
    if (!gunaOccured && (pData.type === "nnit" || pData.type === "nit")) {
        let beforeV = activeD;
        activeD = window.PaniniEngine.autoVriddhi(activeD);
        steps.push(`<b>६. वृद्धि कार्य:</b> प्रत्यय ञित्/णित् होने से 'अचो ञ्णिति' (७.२.११५) या 'अत उपधायाः' (७.२.११६) से वृद्धि होकर '<b>${activeD}</b>' बना।`);
    } else {
        steps.push(`<b>६. वृद्धि विचार:</b> वृद्धि का निमित्त न होने से रूप यथावत् रहा।`);
    }

    // ७. कुत्व/विशेष कार्य (Special Rules)
    if (pData.kutva && (activeD.endsWith('च्') || activeD.endsWith('ज्'))) {
        activeD = activeD.replace(/च्$/, 'क्').replace(/ज्$/, 'ग्');
        steps.push(`<b>७. कुत्व विधि:</b> 'चजोः कु घिण्ण्यतोः' (७.३.५२) से चवर्ग को कवर्ग आदेश हुआ -> <b>${activeD}</b>`);
    } else if (pData.type === "dit") {
        activeD = activeD.replace(/[अआइईउऊऋएऐओऔ][क-ह]्?$/, '');
        steps.push(`<b>७. टि-लोप:</b> प्रत्यय 'डित्' होने के कारण 'टेः' (६.४.१४३) से अङ्ग के अन्त्य भाग (टि) का लोप हुआ।`);
    } else {
        steps.push(`<b>७. विशेष कार्य:</b> अङ्ग में अन्य किसी विशेष आगम या आदेश की आवश्यकता नहीं है।`);
    }

    // ८. सन्धि कार्य (Sandhi)
    let res = window.PaniniEngine.applySandhi(activeD, activeP);
    steps.push(`<b>८. सन्धि:</b> धातु और प्रत्यय के मेल पर 'संहिता' (६.१.७२) के नियमों से <b>'${window.PaniniEngine.joinSanskrit(res)}'</b> रूप बना।`);

    // ९. उपसर्ग मेल (Upasarga)
    if (upa) {
        let uBase = upa === "आङ्" ? "आ" : upa;
        let finalSandhi = window.PaniniEngine.applySandhi(uBase, res);
        res = finalSandhi;
        steps.push(`<b>९. उपसर्ग योग:</b> उपसर्ग '${uBase}' का धातु के साथ 'उपसर्गाः क्रियायोगे' (१.४.५९) के अनुसार संयोजन हुआ।`);
    } else {
        steps.push(`<b>९. उपसर्ग विचार:</b> कोई उपसर्ग न होने से रूप अपरिवर्तित रहा।`);
    }

    // १०. पद निर्माण (Final Word formation)
    let final = window.PaniniEngine.joinSanskrit(res);
    let vibhaktiMsg = "";
    if (pData.gender === "m") {
        final += "ः";
        vibhaktiMsg = "पुँल्लिङ्ग में 'स्वौजसमौट्...' (४.१.२) से सुँ-प्रत्यय होकर विसर्ग हुआ।";
    } else if (pData.gender === "n") {
        final += "म्";
        vibhaktiMsg = "नपुंसकलिङ्ग में 'अतोऽम्' (७.१.२४) से सुँ को अम् आदेश हुआ।";
    } else {
        vibhaktiMsg = "अव्यय होने के कारण 'अव्ययादाप्सुपः' (२.४.८२) से विभक्ति का लुक् हुआ।";
    }
    steps.push(`<b>१०. पद सिद्धि:</b> ${vibhaktiMsg} <br><b>अन्तिम रूप: <span style="color:#ec4899;">${final}</span></b>`);

    // UI प्रदर्शनी
    document.getElementById("finalOutput").innerText = final;
    document.getElementById("prakriyaSteps").innerHTML = steps.map((s) => `<li class="step-item"><div>${s}</div></li>`).join("");
    document.getElementById("resultSection").classList.add("active");
}

// ... बाकी UI Helpers (toggle, search आदि) पिछले कोड वाले ही रहेंगे ...
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
function toggleMobileMenu() { document.getElementById("nav-menu").classList.toggle("active"); }
function closeMobileMenu() { document.getElementById("nav-menu").classList.remove("active"); }

function performSearch() {
    let q = document.getElementById("searchInput").value.trim();
    let resDiv = document.getElementById("searchResults");
    if (!q || !sanskritDatabase.examples) return resDiv.innerHTML = "";
    let matched = sanskritDatabase.examples.filter(i => i.ex.includes(q) || (i.sutra && i.sutra.includes(q)));
    resDiv.innerHTML = matched.map(m => `<div class="result-card"><div class="ex-text sanskrit-text">${m.ex}</div><div class="su-text">सूत्र: ${m.sutra}</div></div>`).join("");
}

window.onload = loadDatabase;
