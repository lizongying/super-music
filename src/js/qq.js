const qq = {
    songType: {
        // size320: {t: 'M800', e: '.mp3'},
        // sizeogg: {t: 'O600', e: '.ogg'},
        size128: {t: 'M500', e: '.mp3'},
        size96: {t: 'C400', e: '.m4a'},
        size24: {t: 'C100', e: '.m4a'},
    },
    playsquare: (playlistIdArr, callback) => {
        const playlistUrl = 'https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg';
        const urlImg = 'https://y.gtimg.cn/music/photo_new/T002R300x300M000';
        const data = {
            type: 1,
            format: 'json',
            outCharset: 'utf-8',
            disstid: playlistIdArr[2],
        };
        $.ajax({
                method: 'GET',
                url: playlistUrl,
                data: data,
                success: (r) => {
                    let playlist = [];
                    r.cdlist.forEach((item) => {
                        item.songlist.forEach((i) => {
                            let type = 'size24';
                            Object.keys(qq.songType).some((ii) => {
                                if (i[ii] > 0) {
                                    type = ii;
                                    return true;
                                }
                            });
                            playlist.push({
                                img: urlImg + i.albummid + '.jpg',
                                song: i.songname,
                                artist: i.singer.map((item) => {
                                    return item.name
                                }).join('/'),
                                songmid: i.songmid,
                                strMediaMid: i.strMediaMid,
                                type: type,
                            });
                        })
                    });
                    callback(playlist);
                },
            }
        );
    },
    album: (playlistIdArr, callback) => {
        const playlistUrl = 'https://c.y.qq.com/v8/fcg-bin/fcg_v8_album_info_cp.fcg';
        const urlImg = 'https://y.gtimg.cn/music/photo_new/T002R300x300M000';
        const data = {
            albummid: playlistIdArr[2],
        };
        $.ajax({
                method: 'GET',
                url: playlistUrl,
                data: data,
                dataType: 'json',
                success: (r) => {
                    let playlist = [];
                    r.data.list.forEach((i) => {
                        let type = 'size24';
                        Object.keys(qq.songType).some((ii) => {
                            if (i[ii] > 0) {
                                type = ii;
                                return true;
                            }
                        });
                        playlist.push({
                            img: urlImg + i.albummid + '.jpg',
                            song: i.songname,
                            artist: i.singer.map((item) => {
                                return item.name
                            }).join('/'),
                            songmid: i.songmid,
                            strMediaMid: i.strMediaMid,
                            type: type,
                        });
                    });
                    callback(playlist);
                },
            }
        );
    },
    singer: (playlistIdArr, callback) => {
        const playlistUrl = 'https://c.y.qq.com/v8/fcg-bin/fcg_v8_singer_track_cp.fcg';
        const urlImg = 'https://y.gtimg.cn/music/photo_new/T002R300x300M000';
        const data = {
            order: 'listen',
            num: 1000,
            singermid: playlistIdArr[2],
        };
        $.ajax({
                method: 'GET',
                url: playlistUrl,
                data: data,
                dataType: 'json',
                success: (r) => {
                    let playlist = [];
                    r.data.list.forEach((i) => {
                        let type = 'size24';
                        Object.keys(qq.songType).some((ii) => {
                            if (i.musicData[ii] > 0) {
                                type = ii;
                                return true;
                            }
                        });
                        playlist.push({
                            img: urlImg + i.musicData.albummid + '.jpg',
                            song: i.musicData.songname,
                            artist: i.musicData.singer.map((item) => {
                                return item.name
                            }).join('/'),
                            songmid: i.musicData.songmid,
                            strMediaMid: i.musicData.strMediaMid,
                            type: type,
                        });
                    });
                    callback(playlist);
                },
            }
        );
    },
    song: (playlistIdArr, callback) => {
        const playlistUrl = 'https://c.y.qq.com/v8/fcg-bin/fcg_play_single_song.fcg';
        const urlImg = 'https://y.gtimg.cn/music/photo_new/T002R300x300M000';
        const data = {
            format: 'json',
            songmid: playlistIdArr[2],
        };
        $.ajax({
                method: 'GET',
                url: playlistUrl,
                data: data,
                dataType: 'json',
                success: (r) => {
                    let playlist = [];
                    r.data.forEach((i) => {
                        let type = 'size24';
                        i.file.size320 = i.file.size_320mp3;
                        i.file.sizeogg = i.file.size_192ogg;
                        i.file.size128 = i.file.size_128mp3;
                        Object.keys(qq.songType).some((ii) => {
                            if (i.file[ii] > 0) {
                                type = ii;
                                return true;
                            }
                        });
                        playlist.push({
                            img: urlImg + i.album.mid + '.jpg',
                            song: i.name,
                            artist: i.singer.map((item) => {
                                return item.name
                            }).join('/'),
                            songmid: i.mid,
                            strMediaMid: i.file.media_mid,
                            type: type,
                        });
                    });
                    callback(playlist);
                },
            }
        );
    },
    getSong: (song, callback) => {
        const mid = song.songmid;
        const mstr = song.strMediaMid;
        const type = qq.songType[song.type];
        const localStr = localStorage.getItem(mstr);
        const localObj = JSON.parse(localStr);
        const now = Date.now();
        const e = (new Date).getUTCMilliseconds();
        let guid = Math.round(2147483647 * Math.random()) * e % 1e10;
        let vkey = '';
        let songUrl = 'http://dl.stream.qqmusic.qq.com/' + qq.songType.size24.t + mstr + qq.songType.size24.e;
        if (!localObj || now > localObj.e) {
            const keyUrl = 'http://c.y.qq.com/base/fcgi-bin/fcg_music_express_mobile3.fcg';
            const data = {
                cid: 205361747,
                songmid: mid,
                filename: 'C400' + mstr + '.m4a',
                guid: guid,
            };
            $.ajax({
                method: 'GET',
                url: keyUrl,
                data: data,
                dataType: 'json',
                success: (r) => {
                    const expiration = now + r.data.expiration * 1000;
                    if (r.data.items.length < 1 || r.data.items[0].subcode !== 0) {
                        localStorage.setItem(mstr, JSON.stringify({v: vkey, e: expiration, g: guid}));
                        callback({src: songUrl});
                        return;
                    }
                    vkey = r.data.items[0].vkey;
                    localStorage.setItem(mstr, JSON.stringify({v: vkey, e: expiration, g: guid}));
                    songUrl = 'http://dl.stream.qqmusic.qq.com/' + type.t + mstr + type.e + '?guid=' + guid + '&fromtag=64&vkey=' + vkey;
                    callback({src: songUrl});
                }
            });
        } else {
            guid = localObj.g;
            vkey = localObj.v;
            if (vkey) {
                songUrl = 'http://dl.stream.qqmusic.qq.com/' + type.t + mstr + type.e + '?guid=' + guid + '&fromtag=64&vkey=' + vkey;
            } else {
                songUrl = 'http://dl.stream.qqmusic.qq.com/' + qq.songType.size24.t + mstr + qq.songType.size24.e;
            }
            callback({src: songUrl})
        }
    },
    getLyric: (song, callback) => {
        const keyUrl = 'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg';
        const mid = song.songmid;
        const data = {
            songmid: mid,
        };
        $.ajax({
            method: 'GET',
            url: keyUrl,
            data: data,
            success: (r) => {
                const b64DecodeUnicode = (str) => {
                    return decodeURIComponent(atob(str).split('').map((c) => {
                        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                    }).join(''));
                };
                const obj = JSON.parse(r.slice(18, r.length - 1));
                let lyric = b64DecodeUnicode(obj['lyric']);
                callback({lyric: lyric});
            },
        });
    },
};

export {qq}
