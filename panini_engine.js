/**
 * 🛠️ PANINI GRAMMAR ENGINE - V 3.0
 * 'अन्वेध' फिक्स और पाणिनीय प्रक्रिया इंजन
 */
window.PaniniEngine = {
    // १. वर्ण संयोजन (व् + ए = वे)
    joinSanskrit: function(text) {
        if (!text) return "";
        const vowelMap = { 
            '्अ': '', '्आ': 'ा', '्इ': 'ि', '्ई': 'ी', '्उ': 'ु', '्ऊ': 'ू', 
            '्ऋ': 'ृ', '्ए': 'े', '्ऐ': 'ै', '्ओ': 'ो', '्औ': 'ौ' 
        };
        let res = text;
        for (let [key, val] of Object.entries(vowelMap)) { 
            res = res.split(key).join(val); 
        }
        return res;
    },

    // २. गुण कार्य (७.३.८४)
    autoGuna: function(d) {
        if (!d) return "";
        if (d.endsWith('ि') || d.endsWith('ी')) return d.slice(0, -1) + 'े';
        if (d.endsWith('ु') || d.endsWith('ू')) return d.slice(0, -1) + 'ो';
        if (d.endsWith('ृ')) return d.slice(0, -1) + 'र्'; 
        if (d.endsWith('्')) {
            return d.replace(/ि([क-ह]्)$/, 'े$1').replace(/ु([क-ह]्)$/, 'ो$1').replace(/ृ([क-ह]्)$/, 'र्$1');
        }
        return d;
    },

    // ३. सन्धि (६.१.७७ इको यणचि) - अन्वेध के लिए विशेष सुधार
    applySandhi: function(word1, word2) {
        if (!word1) return word2;
        if (!word2) return word1;

        let w1 = word1.slice(0, -1); 
        let lastChar = word1.slice(-1); 
        let firstChar = word2.charAt(0); 
        let w2 = word2.slice(1); 
        let vowels = "अआइईउऊऋएऐओऔ";

        if (vowels.includes(firstChar)) {
            // यण् सन्धि: अन्वेध फिक्स (न् + व् + ए)
            if (lastChar === 'ु' || lastChar === 'ू') {
                return w1 + '्' + this.joinSanskrit('व्' + firstChar) + w2;
            }
            if (lastChar === 'ि' || lastChar === 'ी') {
                return w1 + '्' + this.joinSanskrit('य्' + firstChar) + w2;
            }
            if (lastChar === '्') return word1 + firstChar + w2;
        }
        return word1 + word2;
    }
};
