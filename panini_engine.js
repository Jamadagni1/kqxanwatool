/**
 * 🛠️ PANINI GRAMMAR ENGINE
 * यण् सन्धि और गुण कार्य हेतु शुद्ध इंजन
 */
window.PaniniEngine = {
    joinSanskrit: function(text) {
        if (!text) return "";
        const vowelMap = { '्अ': '', '्आ': 'ा', '्इ': 'ि', '्ई': 'ी', '्उ': 'ु', '्ऊ': 'ू', '्ऋ': 'ृ', '्ए': 'े', '्ऐ': 'ै', '्ओ': 'ो', '्औ': 'ौ' };
        let res = text;
        for (let [key, val] of Object.entries(vowelMap)) { res = res.split(key).join(val); }
        return res;
    },

    autoGuna: function(d) {
        if (!d) return "";
        if (d.endsWith('ि') || d.endsWith('ी')) return d.slice(0, -1) + 'े';
        if (d.endsWith('ु') || d.endsWith('ू')) return d.slice(0, -1) + 'ो';
        if (d.endsWith('ृ')) return d.slice(0, -1) + 'र्'; 
        return d.replace(/ि([क-ह]्)$/, 'े$1').replace(/ु([क-ह]्)$/, 'ो$1').replace(/ृ([क-ह]्)$/, 'र्$1');
    },

    applySandhi: function(word1, word2) {
        if (!word1 || !word2) return word1 + word2;
        let w1 = word1.slice(0, -1); 
        let lastChar = word1.slice(-1); 
        let firstChar = word2.charAt(0); 
        let w2 = word2.slice(1); 
        let vowels = "अआइईउऊऋएऐओऔ";

        if (vowels.includes(firstChar)) {
            if (lastChar === 'ु' || lastChar === 'ू') return w1 + '्' + this.joinSanskrit('व्' + firstChar) + w2;
            if (lastChar === 'ि' || lastChar === 'ी') return w1 + '्' + this.joinSanskrit('य्' + firstChar) + w2;
            if (lastChar === '्') return word1 + firstChar + w2;
        }
        return word1 + word2;
    }
};
