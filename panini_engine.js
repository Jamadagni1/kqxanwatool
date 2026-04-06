window.PaniniEngine = {

    // ======================================
    // VOWELS
    // ======================================
    vowels: ['अ','आ','इ','ई','उ','ऊ','ऋ','ए','ऐ','ओ','औ'],

    // ======================================
    // DHATU DATABASE (sample extendable)
    // ======================================
    dhatuDB: {
        "भुज्": { gana: "भ्वादि", isSet: true },
        "गम्": { gana: "भ्वादि", isSet: false },
        "कृ": { gana: "तनादि", isSet: true },
        "नी": { gana: "दिवादि", isSet: true },
        "पच्": { gana: "भ्वादि", isSet: true },
        "लिख्": { gana: "तुदादि", isSet: false }
    },

    // ======================================
    // KRIT PRATYAYA DATABASE
    // ======================================
    kritDB: {
        "क्त": { type: "kit" },
        "क्त्वा": { type: "kit", tuk: true },
        "ल्यप्": { type: "kit" },
        "तव्य": { type: "kit" },
        "अनीयर्": { type: "kit" },

        "तृच्": { type: "nit", kutva: true },
        "शतृ": { type: "nit" },
        "शानच्": { type: "nit" },

        "तुमुन्": { type: "anit" },
        "क्तिन्": { type: "anit" }
    },

    // ======================================
    // JOIN FUNCTION
    // ======================================
    join: function(text) {
        const map = {
            'अअ': 'आ', 'अइ': 'ए', 'अउ': 'ओ',
            'आइ': 'ऐ', 'आउ': 'औ',

            '्अ': '', '्आ': 'ा', '्इ': 'ि', '्ई': 'ी',
            '्उ': 'ु', '्ऊ': 'ू', '्ऋ': 'ृ',
            '्ए': 'े', '्ऐ': 'ै', '्ओ': 'ो', '्औ': 'ौ'
        };
        for (let k in map) text = text.split(k).join(map[k]);
        return text;
    },

    // ======================================
    // GUNA / VRIDDHI
    // ======================================
    guna: d => d.replace(/ि|ी$/, 'े').replace(/ु|ू$/, 'ो').replace(/ृ$/, 'र्'),
    vriddhi: d => d.replace(/ि|ी$/, 'ै').replace(/ु|ू$/, 'ौ').replace(/ृ$/, 'ार्'),

    // ======================================
    // MAIN DERIVATION ENGINE
    // ======================================
    derive: function(dhatu, pratyaya) {

        let steps = [];
        let dData = this.dhatuDB[dhatu] || { isSet: true };
        let pData = this.kritDB[pratyaya] || { type: "anit" };

        let base = dhatu;

        steps.push(`🔹 Start: ${dhatu} + ${pratyaya}`);

        // =========================
        // 1. गुण / वृद्धि
        // =========================
        if (pData.type === "kit" || pData.type === "git") {
            steps.push(`❌ (1.1.5) क्ङिति च → गुण/वृद्धि निषिद्ध`);
        }
        else if (pData.type === "nit") {
            base = this.vriddhi(base);
            steps.push(`✔ (7.2.115) अचो ञ्णिति → वृद्धि → ${base}`);
        }
        else {
            base = this.guna(base);
            steps.push(`✔ (3.1.68) सार्वधातुकयोः → गुण → ${base}`);
        }

        // =========================
        // 2. कुत्व
        // =========================
        if (pData.kutva) {
            if (base.endsWith('ज्')) {
                base = base.replace(/ज्$/, 'ग्');
                steps.push(`✔ (7.3.52) चजोः कु → ज् → ग्`);
            }
            if (base.endsWith('च्')) {
                base = base.replace(/च्$/, 'क्');
                steps.push(`✔ (7.3.52) चजोः कु → च् → क्`);
            }
        }

        // =========================
        // 3. टि-लोप
        // =========================
        if (pData.type === "dit") {
            base = base.replace(/[क-ह]्?$/, '');
            steps.push(`✔ (6.4.143) टेः → टि-लोप`);
        }

        // =========================
        // 4. इट् आगम
        // =========================
        let isValadi = /^[क-ह]/.test(pratyaya);

        if (dData.isSet && isValadi && pData.type !== "kit") {
            base = this.sandhi(base, "इ");
            steps.push(`✔ (7.2.35) आर्धधातुकस्येड् वलादेः → इट् आगम`);
        }

        // =========================
        // 5. तुक् आगम
        // =========================
        if (pData.tuk && /[अइउऋ]$/.test(base)) {
            pratyaya = "त्" + pratyaya;
            steps.push(`✔ (6.1.73) ह्रस्वस्य पिति कृति तुक्`);
        }

        // =========================
        // 6. SANDHI
        // =========================
        let result = this.sandhi(base, pratyaya);

        // =========================
        // 7. FINAL JOIN
        // =========================
        result = this.join(result);

        steps.push(`🎯 Final Result: ${result}`);

        return {
            result,
            steps
        };
    },

    // ======================================
    // SANDHI ENGINE
    // ======================================
    sandhi: function(w1, w2) {

        if (!w1 || !w2) return w1 + w2;

        let f = w2[0];
        let rest = w2.slice(1);
        let isVowel = this.vowels.includes(f);

        // -------------------------
        // अनुस्वार
        // -------------------------
        if ((w1.endsWith('म्') || w1.endsWith('ं')) && !isVowel) {
            return w1.slice(0, -1) + 'ं' + f + rest;
        }

        // -------------------------
        // अच् सन्धि
        // -------------------------
        let last = w1.slice(-1);
        let base = w1.slice(0, -1);

        if (this.vowels.includes(last) && isVowel) {

            if (last === 'अ' && first === 'अ') return base + 'आ' + rest;
            if (last === 'अ' && (f === 'इ' || f === 'ई')) return base + 'ए' + rest;
            if (last === 'अ' && (f === 'उ' || f === 'ऊ')) return base + 'ओ' + rest;

            if (last === 'अ' && (f === 'ए' || f === 'ऐ')) return base + 'ऐ' + rest;
            if (last === 'अ' && (f === 'ओ' || f === 'औ')) return base + 'औ' + rest;
        }

        // -------------------------
        // यण् (6.1.77)
        // -------------------------
        if (isVowel) {
            if (w1.endsWith('ि') || w1.endsWith('ी'))
                return this.join(w1.slice(0,-1) + 'य्' + f + rest);

            if (w1.endsWith('ु') || w1.endsWith('ू'))
                return this.join(w1.slice(0,-1) + 'व्' + f + rest);

            if (w1.endsWith('ृ'))
                return this.join(w1.slice(0,-1) + 'र्' + f + rest);
        }

        // -------------------------
        // व्यंजन सन्धि
        // -------------------------
        if (w1.endsWith('श्') && f === 'त')
            return w1.slice(0, -2) + 'ष्ट' + rest;

        if (w1.endsWith('स्') && f === 'त')
            return w1.slice(0, -2) + 'स्त' + rest;

        if (w1.endsWith('न्') && f === 'क')
            return w1.slice(0, -2) + 'ङ्क' + rest;

        // -------------------------
        // हलन्त + स्वर
        // -------------------------
        if (w1.endsWith('्') && isVowel)
            return this.join(w1 + f + rest);

        return w1 + w2;
    }
};
