window.PaniniEngine = {
    vowels: ['अ','आ','इ','ई','उ','ऊ','ऋ','ए','ऐ','ओ','औ'],

    dhatuDB: {
        "भुज्": { clean: "भुज्", isSet: true },
        "गम्": { clean: "गम्", isSet: false },
        "कृ": { clean: "कृ", isSet: true },
        "नी": { clean: "नी", isSet: true },
        "पच्": { clean: "पच्", isSet: true },
        "लिख्": { clean: "लिख्", isSet: false },
        "एध": { clean: "एध्", isSet: true }
    },

    kritDB: {
        "क्त": { real: "त", type: "kit" },
        "क्त्वा": { real: "त्वा", type: "kit", tuk: true },
        "ल्यप्": { real: "य", type: "kit" },
        "तव्य": { real: "तव्य", type: "akit" },
        "अनीयर्": { real: "अनीय", type: "akit" },
        "तृच्": { real: "तृ", type: "nit", kutva: true },
        "शतृ": { real: "अत्", type: "nit" },
        "शानच्": { real: "आन", type: "nit" },
        "तुमुन्": { real: "तुम्", type: "anit" },
        "क्तिन्": { real: "ति", type: "kit" },
        "अच्": { real: "अ", type: "akit" }
    },

    // १. वर्ण संयोजन मशीन
    join: function(text) {
        if (!text) return "";
        const map = {
            '्अ': '', '्आ': 'ा', '्इ': 'ि', '्ई': 'ी', '्उ': 'ु', '्ऊ': 'ू',
            '्ऋ': 'ृ', '्ए': 'े', '्ऐ': 'ै', '्ओ': 'ो', '्औ': 'ौ'
        };
        let res = text;
        for (let k in map) res = res.split(k).join(map[k]);
        return res;
    },

    // २. गुण और वृद्धि नियम
    guna: function(d) {
        return d.replace(/ि|ी$/, 'े').replace(/ु|ू$/, 'ो').replace(/ृ$/, 'र्')
                .replace(/ि(?=[क-ह]्$)/, 'े').replace(/ु(?=[क-ह]्$)/, 'ो').replace(/ृ(?=[क-ह]्$)/, 'र्');
    },
    vriddhi: function(d) {
        return d.replace(/ि|ी$/, 'ै').replace(/ु|ू$/, 'ौ').replace(/ृ$/, 'ार्')
                .replace(/अ(?=[क-ह]्$)/, 'आ');
    },

    // ३. सन्धि इंजन (अन्वेध फिक्स यहाँ है)
    sandhi: function(w1, w2) {
        if (!w1 || !w2) return w1 + w2;
        let last = w1.slice(-1);
        let base = w1.slice(0, -1);
        let f = w2[0];
        let rest = w2.slice(1);
        let isVowel = this.vowels.includes(f);

        // यण् सन्धि (इको यणचि 6.1.77)
        if (isVowel) {
            if (last === 'ि' || last === 'ी') return base + 'य्' + f + rest;
            if (last === 'ु' || last === 'ू') return base + 'व्' + f + rest;
            if (last === 'ृ') return base + 'र्' + f + rest;
        }

        // हलन्त + स्वर (पच् + अ = पच)
        if (last === '्' && isVowel) return base + f + rest;

        // व्यंजन सन्धि (कुत्व/श्चुत्व आदि का सरलीकरण)
        if (w1.endsWith('च्') && f === 'त') return w1.slice(0, -2) + 'क्त' + rest;
        if (w1.endsWith('ज्') && f === 'त') return w1.slice(0, -2) + 'क्त' + rest;
        if (w1.endsWith('श्') && f === 'त') return w1.slice(0, -2) + 'ष्ट' + rest;

        return w1 + w2;
    },

    // ४. मुख्य प्रक्रिया (Derivation)
    derive: function(dhatu, pratyaya, upasarga = "") {
        let steps = [];
        let dData = this.dhatuDB[dhatu] || { clean: dhatu, isSet: true };
        let pData = this.kritDB[pratyaya] || { real: pratyaya, type: "anit" };

        let base = dData.clean;
        let realP = pData.real || pratyaya;

        steps.push(`<b>१. आरम्भ:</b> ${upasarga ? upasarga + ' + ' : ''}${dhatu} + ${pratyaya}`);

        // गुण/वृद्धि
        if (pData.type === "kit") {
            steps.push(`<b>२. निषेध:</b> 'क्ङिति च' (1.1.5) से गुण/वृद्धि का निषेध हुआ।`);
        } else if (pData.type === "nit") {
            base = this.vriddhi(base);
            steps.push(`<b>२. वृद्धि:</b> 'अचो ञ्णिति' (7.2.115) से वृद्धि होकर '${base}' बना।`);
        } else {
            let old = base;
            base = this.guna(base);
            if (old !== base) steps.push(`<b>२. गुण:</b> 'सार्वधातुकार्धधातुकयोः' (7.3.84) से गुण होकर '${base}' बना।`);
        }

        // कुत्व
        if (pData.kutva && (base.endsWith('ज्') || base.endsWith('च्'))) {
            base = base.replace(/[ज्छ्]$/, 'क्');
            steps.push(`<b>३. कुत्व:</b> 'चजोः कु' (7.3.52) से च्/ज् को क् हुआ -> ${base}`);
        }

        // इट् आगम
        let isValadi = !this.vowels.includes(realP[0]) && realP[0] !== 'य्';
        if (dData.isSet && isValadi) {
            steps.push(`<b>४. इट्-आगम:</b> 'आर्धधातुकस्येड् वलादेः' (7.2.35) से 'इ' का आगम हुआ।`);
            base = base + "इ";
        }

        // सन्धि और संयोजन
        let combined = this.sandhi(base, realP);
        
        // उपसर्ग मेल
        if (upasarga) {
            let uBase = (upasarga === "अनु") ? "अनु" : upasarga;
            combined = this.sandhi(uBase, combined);
            steps.push(`<b>५. उपसर्ग योग:</b> '${uBase}' के साथ सन्धि हुई।`);
        }

        let final = this.join(combined);
        steps.push(`<b>६. सिद्ध रूप:</b> ${final}`);

        return { result: final, steps: steps };
    }
};
