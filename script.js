let sanskritDatabase = {};
let pratyayaDB = {}; 

// ==================================================
// 1. वर्ण संयोजन (Halant + Vowel Joiner)
// ==================================================
function joinSanskrit(text) {
    const vowelMap = { '्अ': '', '्आ': 'ा', '्इ': 'ि', '्ई': 'ी', '्उ': 'ु', '्ऊ': 'ू', '्ऋ': 'ृ', '्ए': 'े', '्ऐ': 'ै', '्ओ': 'ो', '्औ': 'ौ' };
    for (let [key, val] of Object.entries(vowelMap)) { text = text.split(key).join(val); }
    return text;
}

// ==================================================
// 2. अङ्ग कार्य (गुण, वृद्धि और निषेध नियम)
// ==================================================
function autoGuna(d) {
    if (d.endsWith('ि') || d.endsWith('ी')) return d.slice(0, -1) + 'े';
    if (d.endsWith('ु') || d.endsWith('ू')) return d.slice(0, -1) + 'ो';
    if (d.endsWith('ृ')) return d.slice(0, -1) + 'र्'; 
    if (d.endsWith('्')) {
        // लघूपध गुण: पुगन्तलघूपधस्य च (7.3.86)
        return d.replace(/ि([क-ह]्)$/, 'े$1').replace(/ु([क-ह]्)$/, 'ो$1').replace(/ृ([क-ह]्)$/, 'र्$1');
    }
    return d; 
}

function autoVriddhi(d) {
    if (d.endsWith('ि') || d.endsWith('ी')) return d.slice(0, -1) + 'ै';
    if (d.endsWith('ु') || d.endsWith('ू')) return d.slice(0, -1) + 'ौ';
    if (d.endsWith('ृ')) return d.slice(0, -1) + 'ार्'; 
    if (d.endsWith('्')) {
        // उपधा वृद्धि: अत उपधायाः (7.2.116)
        if (!d.match(/[ािीुूृेैोौ][क-ह]्$/) && !d.match(/[क-ह]्[क-ह]्$/)) {
            return d.replace(/([क-ह])([क-ह]्)$/, '$1ा$2'); 
        }
        return d.replace(/ि([क-ह]्)$/, 'ै$1').replace(/ु([क-ह]्)$/, 'ौ$1').replace(/ृ([क-ह]्)$/, 'ार्$1');
    }
    return d; 
}

// ==================================================
// 3. सन्धि इंजन (यण्, अयादि और विशेष सन्धि)
// ==================================================
function applySandhi(word1, word2) {
    if (!word1) return word2;
    if (!word2) return word1;

    let w1 = word1.slice(0, -1); 
    let lastChar = word1.slice(-1); 
    let firstChar = word2.charAt(0); 
    let w2 = word2.slice(1); 

    let isVowel = "अआइईउऊऋएऐओऔ".includes(firstChar);

    // --- ६.१.७७ इको यणचि (यण् सन्धि) ---
    if (isVowel) {
        if (lastChar === 'ि' || lastChar === 'ी') return w1 + '्' + joinSanskrit('य्' + firstChar) + w2;
        if (lastChar === 'ु' || lastChar === 'ू') return w1 + '्' + joinSanskrit('व्' + firstChar) + w2;
        if (lastChar === 'ृ' || lastChar === 'ॄ') return w1 + '्' + joinSanskrit('र्' + firstChar) + w2;

        // --- ६.१.७८ एचोऽयवायावः (अयादि सन्धि) ---
        if (lastChar === 'े') return w1 + joinSanskrit('य्' + firstChar) + w2; 
        if (lastChar === 'ै') return w1 + joinSanskrit('ाय्' + firstChar) + w2;
        if (lastChar === 'ो') return w1 + joinSanskrit('व्' + firstChar) + w2;
        if (lastChar === 'ौ') return w1 + joinSanskrit('ाव्' + firstChar) + w2;
    }

    // सामान्य हलन्त + स्वर मेल (पठ् + अ = पठ)
    if (lastChar === '्' && isVowel) return word1 + firstChar + w2;

    // व्यंजन सन्धि (जैसे: म् + व्यंजन = अनुस्वार)
    if (lastChar === 'म्' && !isVowel) return w1 + 'ं' + firstChar + w2;

    return word1 + word2;
}

// ==================================================
// 4. मुख्य निर्माण प्रक्रिया (१० विस्तृत चरण)
// ==================================================
function generateKridanta() {
    const upa = document.getElementById("upasarga")?.value.trim() || "";
    const dhatuStr = document.getElementById("dhatu")?.value.trim();
    const rawPratStr = document.getElementById("pratyaya")?.value.trim();

    if(!dhatuStr || !rawPratStr) { alert("कृपया धातु और प्रत्यय चुनें!"); return; }

    let steps = [];
    let dData = sanskritDatabase.dhatus[dhatuStr] || { clean: dhatuStr, isSet: true, anubandha: "none" };
    let pData = pratyayaDB[rawPratStr] || { real: rawPratStr, type: "akit", lopa: "कोई नहीं" };
    
    let activeD = dData.clean || dhatuStr;
    let activeP = pData.real;

    // १. आरम्भ
    steps.push(`<b>१. आरम्भ:</b> ${upa ? upa + ' + ' : ''}${dhatuStr} + ${rawPratStr}`);

    // २. धातु इत्-लोप
    if(dData.anubandha !== "none") {
        steps.push(`<b>२. धातु इत्-संज्ञा:</b> '${dData.anubandha}' का लोप होकर धातु <b>${activeD}</b> बची।`);
    } else {
        steps.push(`<b>२. धातु शुद्धि:</b> धातु मूल रूप <b>${activeD}</b> में स्थित है।`);
    }

    // ३. प्रत्यय आदेश (क्त्वा -> ल्यप्)
    if (rawPratStr === "क्त्वा" && upa !== "") {
        steps.push(`<b>३. प्रत्यय आदेश:</b> उपसर्ग होने से 'समासेऽनञ्पूर्वे क्त्वो ल्यप्' (७.१.३७) से क्त्वा को <b>ल्यप्</b> हुआ।`);
        pData = pratyayaDB["ल्यप्"];
        activeP = pData.real;
    } else {
        steps.push(`<b>३. प्रत्यय स्थिति:</b> प्रत्यय <b>'${rawPratStr}'</b> विवक्षित है।`);
    }

    // ४. प्रत्यय इत्-लोप
    steps.push(`<b>४. प्रत्यय इत्-लोप:</b> ${pData.lopa}। शेष प्रत्यय: <b>${activeP}</b>`);

    // ५. इट्-आगम नियम (७.२.३५)
    let itAgama = false;
    let isValadi = !['अ','आ','इ','ई','उ','ऊ','ए','ऐ','ओ','औ', 'य'].includes(activeP[0]);
    if (dData.isSet && isValadi && pData.type !== "kit") {
        itAgama = true;
        steps.push(`<b>५. इट्-आगम:</b> 'आर्धधातुकस्येड् वलादेः' (७.२.३५) से <b>'इ'</b> का आगम हुआ।`);
    } else {
        steps.push(`<b>५. इट्-आगम विचार:</b> आगम की प्राप्ति नहीं है।`);
    }

    // ६. गुण/वृद्धि/निषेध नियम (१.१.५, ७.३.८४)
    if (pData.type === "kit" || pData.type === "ngit" || pData.type === "git") {
        steps.push(`<b>६. निषेध:</b> प्रत्यय कित्/ङित्/गित् होने से '<b>क्ङिति च</b>' (१.१.५) द्वारा गुण/वृद्धि का निषेध हुआ।`);
    } else if (pData.type === "nnit" || pData.type === "nit") {
        activeD = autoVriddhi(activeD);
        steps.push(`<b>६. वृद्धि कार्य:</b> 'अचो ञ्णिति' (७.२.११५) से अङ्ग को वृद्धि होकर <b>${activeD}</b> बना।`);
    } else {
        let old = activeD;
        activeD = autoGuna(activeD);
        if(old !== activeD) steps.push(`<b>६. गुण कार्य:</b> 'सार्वधातुकार्धधातुकयोः' (७.३.८४) से गुण होकर <b>${activeD}</b> बना।`);
        else steps.push(`<b>६. अङ्ग कार्य:</b> अङ्ग में गुण की प्राप्ति नहीं है।`);
    }

    // ७. विशेष कार्य (कुत्व/टि-लोप)
    if (pData.kutva && (activeD.endsWith('च्') || activeD.endsWith('ज्'))) {
        activeD = activeD.replace(/च्$/, 'क्').replace(/ज्$/, 'ग्');
        steps.push(`<b>७. कुत्व विधि:</b> 'चजोः कु घिण्ण्यतोः' (७.३.५२) से च्/ज् को क्/ग् हुआ -> <b>${activeD}</b>`);
    } else if (pData.type === "dit") {
        activeD = activeD.replace(/[अआइईउऊऋएऐओऔ][क-ह]्?$/, '');
        steps.push(`<b>७. टि-लोप:</b> 'टेः' (६.४.१४३) से अङ्ग के अन्त्य 'टि' भाग का लोप हुआ।`);
    } else {
        steps.push(`<b>७. विशेष कार्य:</b> अङ्ग में अन्य किसी विशेष विधि की आवश्यकता नहीं है।`);
    }

    // ८. सन्धि कार्य
    let finalP = itAgama ? "इ" + activeP : activeP;
    let baseForm = applySandhi(activeD, finalP);
    steps.push(`<b>८. सन्धि:</b> वर्णों के मेल से <b>'${joinSanskrit(baseForm)}'</b> रूप बना।`);

    // ९. उपसर्ग योग
    let finalForm = baseForm;
    if (upa !== "") {
        let uBase = upa === "आङ्" ? "आ" : upa;
        finalForm = applySandhi(uBase, baseForm);
        steps.push(`<b>९. उपसर्ग योग:</b> '${uBase}' के साथ संयोजन होकर <b>${joinSanskrit(finalForm)}</b> बना।`);
    } else {
        steps.push(`<b>९. उपसर्ग विचार:</b> उपसर्ग का अभाव है।`);
    }

    // १०. पद निर्माण (सुँ-विभक्ति)
    let finalResult = joinSanskrit(finalForm);
    if (pData.gender === "m") finalResult += "ः";
    else if (pData.gender === "n") finalResult += "म्";
    
    steps.push(`<b>१०. पद सिद्धि:</b> सुँ-विभक्ति कार्य के उपरान्त <b><span style="color:#ec4899;">${finalResult}</span></b> सिद्ध हुआ।`);

    // UI प्रदर्शनी
    document.getElementById("finalOutput").innerText = finalResult;
    document.getElementById("prakriyaSteps").innerHTML = steps.map(s => `<li class="step-item"><div>${s}</div></li>`).join("");
    document.getElementById("resultSection").classList.add("active");
}
