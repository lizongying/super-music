const google = {
    url: 'https://translate.google.cn',
    getToken: (a, TKK) => {
        for (var e = TKK.split('.'), h = Number(e[0]) ||
            0, g = [], d = 0, f = 0; f < a.length; f++) {
            var c = a.charCodeAt(f);
            128 > c ? g[d++] = c : (2048 > c
                ? g[d++] = c >> 6 | 192
                : (55296 === (c & 64512) && f + 1 < a.length && 56320 ===
                (a.charCodeAt(f + 1) & 64512) ? (c = 65536 +
                    ((c & 1023) << 10) +
                    (a.charCodeAt(++f) & 1023), g[d++] = c >> 18 |
                    240, g[d++] = c >> 12 & 63 | 128) : g[d++] = c >> 12 |
                    224, g[d++] = c >> 6 & 63 | 128), g[d++] = c & 63 | 128);
        }
        a = h;
        for (d = 0; d < g.length; d++) a += g[d], a = google.encode(a,
            '+-a^+6');
        a = google.encode(a, '+-3^+b+-f');
        a ^= Number(e[1]) || 0;
        0 > a && (a = (a & 2147483647) + 2147483648);
        a %= 1E6;
        return a.toString() + '.' + (a ^ h);
    },
    encode: (a, b) => {
        for (var d = 0; d < b.length - 2; d += 3) {
            var c = b.charAt(d + 2),
                c = 'a' <= c ? c.charCodeAt(0) - 87 : Number(c),
                c = '+' === b.charAt(d + 1) ? a >>> c : a << c;
            a = '+' === b.charAt(d) ? a + c & 4294967295 : a ^ c;
        }
        return a;
    },
    transfer: (q, callback, force = false) => {
        const now = Date.now();
        const localStr = localStorage.getItem('tkk');
        const localObj = JSON.parse(localStr);
        let tkk = '';
        let tk = '';
        if (!localObj || now > localObj.e || force) {
            fetch(google.url).
                then(response => response.text()).
                then(function(r) {
                    const test1 = /tkk:'(.+?)'/;
                    const res1 = test1.exec(r);
                    if (res1) {
                        tkk = res1[1];
                    } else {
                        const test = /TKK=eval\('\(\(function\(\){(.+?)}\)\(\)\)'\);/;
                        const res = test.exec(r);
                        if (!res) {
                            return;
                        }
                        const str = res[1].replace(/\\x3d/g, '=').
                            replace(/\\x27/g, '\'').
                            replace(/return/g, 'tkk=');
                        eval(str);
                    }
                    const expiration = now + 60 * 60 * 1000;
                    localStorage.setItem('tkk',
                        JSON.stringify({t: tkk, e: expiration}));
                    tk = google.getToken(q, tkk);
                    google.getResult(q, tk, callback);
                });
        } else {
            tkk = localObj['t'];
            tk = google.getToken(q, tkk);
            google.getResult(q, tk, callback);
        }
    },
    getResult: (q, tk, callback) => {
        const url = 'https://translate.google.cn/translate_a/single?dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&';
        fetch(url +
            'client=t&sl=auto&tl=zh-TW&hl=zh-TW&ie=UTF-8&oe=UTF-8&ssel=0&tsel=0&tk=' +
            tk + '&q=' + q).
            then(response => response.json()).
            then(function(r) {
                const index = r[0].shift();
                const pinyin = r[0].pop();
                const transfer = r[0].map((item) => {
                    return item[0] ? item[0].trim() : '';
                });
                callback({
                    nation: r[2],
                    language: r[8][3][0],
                    index: index[0] ? parseInt(index[0].trim()) : 0,
                    transfer: transfer,
                    pinyin: pinyin[2] ? pinyin[2].trim() : '',
                });
            }).catch(() => {
            // google.transfer(q, callback, true);
        });
    },
};

export {google};
