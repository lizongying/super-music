import {qq} from './qq';
import {google} from './google';


// 通知
const notify = (data) => {
    const tab = chrome.extension.getViews({type: 'tab'});
    const popup = chrome.extension.getViews({type: 'popup'});
    [tab, popup].map((v) => {
        if (!v || !(v instanceof Array) || !tab.length) {
            return;
        }
        if (data instanceof Array) {
            v[0].$ui[data[0]] && v[0].$ui[data[0]](...data.slice(1));
        }
    });
    chrome.runtime.sendMessage(data);
    chrome.tabs.query({'active': true, currentWindow: true}, (tabs) => {
        if (tabs.length === 0) {
            return
        }
        chrome.tabs.sendMessage(tabs[0].id, data);
    });
};


const obj = {
    currentIndex: 0,
    currentSong: null,
    lyricIndex: 0,
    lyricShow: false,
    getPlaylist: null,
    getSong: null,
    isPlaying: false,
    originX: 0,
    player: new Audio(),
    playlist: [],
    playlistLang: '',
    processBtnState: 0,
    singleLoop: false,
    songUpdated: true,
    transfer: false,
    validateTime: (number) => {
        number = isNaN(number) ? 0 : number;
        const value = (number > 10 ? number + '' : '0' + number).substring(0, 2);
        return isNaN(parseInt(value)) ? '00' : value;
    },
    qq: qq,
    google: google,
};

window.ctx = obj;

chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        if (!sender.tab) {
            return
        }
        if (request instanceof Array) {
            eval(request[0])(...request.slice(1));
            return
        }
        if (request instanceof Object) {
            Object.keys(request).map((item) => {
                obj[item] = request[item];
                chrome.runtime.sendMessage({[item]: request[item]});
            });
            sendResponse({code: 0});
            return
        }
        if (request.indexOf(',') > -1) {
            const arr = request.split(',');
            const data = arr.map((v) => {
                return obj[v]
            });
            sendResponse({code: 0, data: data});
            return
        }
        sendResponse({code: 0, data: obj[request]});
    });

ctx.player.addEventListener('ended', () => {
    if (ctx.singleLoop) {
        ctx.moveTo(ctx.currentIndex);
    } else {
        ctx.next();
    }
});

ctx.getPopup = () => {
    return chrome.extension.getViews({type: 'popup'});
};

ctx.preSwitchSong = () => {
    ctx.currentSong = ctx.playlist[ctx.currentIndex];
    ctx.player.pause();
    const popup = ctx.getPopup();

    if (popup) {
        ctx.songUpdated = false;

        // 指针暂停
        notify(['changeNeedle', false]);

        // 更新播放列表
        notify(['updatePlaylist', ctx.currentIndex]);
    } else {
        ctx.updateSong();
    }
};

// 更新歌曲
ctx.updateSong = () => {
    if (!ctx.currentSong.src) {
        ctx.getSong(ctx.currentSong, ctx.callbackSong);
    } else {
        ctx.callbackSong();
    }
};

ctx.setBadge = (details) => {
    chrome.browserAction.setBadgeText(details);
};

ctx.setBadgeBackgroundColor = (details) => {
    chrome.browserAction.setBadgeBackgroundColor(details);
};

ctx.setInterval = () => {
    ctx.updateProcess();
    setInterval(ctx.updateProcess, 1000);
};

ctx.updateProcess = () => {
    if (ctx.lyricShow && ctx.currentSong.lyric && ctx.currentSong.lyric.length > 0 && ctx.player.currentTime > ctx.currentSong.lyric[ctx.lyricIndex].time) {

        // 更新歌词
        notify(['updateLyric']);
        ctx.lyricIndex++;
    }
    const buffer = ctx.player.buffered,
        bufferTime = buffer.length > 0 ? buffer.end(buffer.length - 1) : 0,
        duration = ctx.player.duration,
        currentTime = ctx.player.currentTime;

    // 更新进程
    notify(['changeProcess', duration, bufferTime, currentTime, ctx.processBtnState]);
};

let extraInfoSpec = ['blocking', 'requestHeaders'];
if (chrome.webRequest.OnBeforeSendHeadersOptions.hasOwnProperty('EXTRA_HEADERS')) {
    extraInfoSpec.push('extraHeaders');
}

chrome.webRequest.onBeforeSendHeaders.addListener(
    (details) => {
        if (details.type === 'xmlhttprequest' && details.url.indexOf('fcg_ucc_getcdinfo_byids_cp.fcg')) {
            let referer = false;
            for (let i = 0; i < details.requestHeaders.length; ++i) {
                if (details.requestHeaders[i].name === 'Cookie') {
                    details.requestHeaders[i].value = '';
                }
                if (details.requestHeaders[i].name === 'Referer') {
                    referer = true;
                    details.requestHeaders[i].value = 'https://y.qq.com/';
                    break;
                }
            }
            if (!referer) {
                details.requestHeaders.push({name: 'Referer', value: 'https://y.qq.com/'});
            }
            return {requestHeaders: details.requestHeaders};
        }
    },
    {
        urls: [
            'https://c.y.qq.com/qzone/fcg-bin/fcg_ucc_getcdinfo_byids_cp.fcg*',
            'https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg*',
        ]
    },
    extraInfoSpec
);

// 播放
ctx.play = () => {
    ctx.isPlaying ? ctx.player.pause() : ctx.player.play();
    ctx.isPlaying = !ctx.isPlaying;
    notify(['play']);
};

// 循环
ctx.loop = () => {
    ctx.singleLoop = !ctx.singleLoop;
    notify(['loop']);
};

// 上一首
ctx.prev = () => {
    if (ctx.songUpdated) {
        ctx.currentIndex = ctx.currentIndex > 0 ? ctx.currentIndex - 1 : ctx.playlist.length - 1;
        ctx.preSwitchSong();
        notify(['prev']);
    }
};

// 下一首
ctx.next = () => {
    if (ctx.songUpdated) {
        ctx.currentIndex = ctx.currentIndex < ctx.playlist.length - 1 ? ctx.currentIndex + 1 : 0;
        ctx.preSwitchSong();
        notify(['next']);
    }
};

// 切换歌曲
ctx.moveTo = (index) => {
    if (ctx.songUpdated) {
        ctx.currentIndex = index;
        ctx.preSwitchSong();
        notify(['moveTo']);
    }
};

// 隐藏播放列表
ctx.hidePlayList = () => {
    notify(['hidePlayList']);
};

// 显示播放列表
ctx.showPlaylist = () => {
    notify(['showPlaylist']);
};

// 歌词
ctx.callbackLyric = (song) => {
    const lyricArr = song.lyric.split('\n');
    const test = /(\d{2}):(\d{2}\.\d{2})](.*)/;
    ctx.currentSong.lyric = [];
    let lyricTextArr = [];
    lyricArr.forEach((item) => {
        const result = item.match(test);
        if (result) {
            ctx.currentSong.lyric.push({time: parseFloat(result[1]) * 60 + parseFloat(result[2]), text: result[3]});
            lyricTextArr.push(result[3]);
        }
    });

    // 更新歌词
    notify(['addLyric', lyricTextArr]);
    console.log(lyricTextArr);
    ctx.google.transfer(0 + '\n' + lyricTextArr.join('\n'), ctx.callbackLyricTransfer);
};

// 翻译的歌词
ctx.callbackLyricTransfer = (data) => {
    console.log(data);
    const obj = data['transfer'];
    let objIndex = 0;
    ctx.currentSong.lyric.forEach((item) => {
        if (item.text.length) {
            item.transfer = obj[objIndex];
            objIndex++;
        } else {
            item.transfer = '';
        }
    });
    console.log(ctx.currentSong.lyric);
    // notify(['initPlaylist']);
    // notify(['initPlaylistLang']);
};

// 播放列表
ctx.callbackPlaylist = (playlist) => {
    if (playlist.length === 0) {
        console.log('playlist is empty');
        return;
    }
    ctx.playlist = playlist;
    ctx.currentSong = ctx.playlist[ctx.currentIndex];
    console.log(ctx.currentSong);
    ctx.setBadge({text: '♪'});

    // 翻译播放列表
    ctx.transferPlaylist();

    // 更新歌曲
    ctx.updateSong();
};

// 翻译播放列表
ctx.transferPlaylist = () => {
    if (!ctx.playlist.length) {
        console.log('playlist is empty');
        return;
    }
    const playlistArr = ctx.playlist.map((item) => {
        return item.song;
    });
    for (let i = 0, len = playlistArr.length; i < len; i += 100) {
        const arr = playlistArr.slice(i, i + 100);
        const text = i + '\n' + arr.join('\n');
        ctx.google.transfer(text, ctx.callbackTransferPlaylist);
    }
};

// 翻译的播放列表
ctx.callbackTransferPlaylist = (data) => {
    ctx.playlistLang = data['language'];
    const obj = data['transfer'];
    const num = data['index'];
    obj.forEach((item, index) => {
        index += num * 100;
        ctx.playlist[index].songTransfer = item;
    });
    notify(['initPlaylist']);
    notify(['initPlaylistLang']);
};

// 歌曲
ctx.callbackSong = (song) => {
    if (song) {
        ctx.currentSong.src = song.src;
    }
    if (ctx.player.src !== ctx.currentSong.src) {
        ctx.player.src = ctx.currentSong.src;
    }
    if (ctx.lyricShow) {
        ctx.lyricIndex = 0;
        ctx.initLyric();
    }
    notify(['songUpdated']);
    ctx.setInterval();

    ctx.getLyric(ctx.currentSong, ctx.callbackLyric);
    localStorage.setItem('currentSongIndex', ctx.currentIndex.toString());
};

// 翻译的歌曲
ctx.callbackTransfer = (data) => {
    const obj = data['transfer'].split('|*');
    ctx.currentSong.songTransfer = obj[0];
    ctx.currentSong.artistTransfer = obj[1];
    updateMusicInfo();
    // ctx.initPlayList();
    ctx.initLyric();
};

// 初始化
ctx.init = () => {
    let playlistIdArr = ['qq', 'playsquare', '895009342'];
    const lastPlaylistId = localStorage.getItem('lastPlaylistId');
    const lastPlaylistIdArr = lastPlaylistId ? lastPlaylistId.split('/') : ['', '', ''];
    if (lastPlaylistId && lastPlaylistIdArr.length === 3) {
        playlistIdArr = lastPlaylistIdArr;
    }
    if (!playlistIdArr[0] || !playlistIdArr[1] || !playlistIdArr[2]) {
        return
    }
    ctx.getPlaylist = ctx[playlistIdArr[0]][playlistIdArr[1]];
    ctx.getSong = ctx[playlistIdArr[0]]['getSong'];
    ctx.getLyric = ctx[playlistIdArr[0]]['getLyric'];
    if (lastPlaylistIdArr[2] === playlistIdArr[2]) {

        // 已有的播放列表
        ctx.currentIndex = +localStorage.getItem('currentSongIndex');
        if (!ctx.playlist.length) {
            ctx.getPlaylist(playlistIdArr, ctx.callbackPlaylist);
        } else {

        }
    } else {

        // 新的播放列表
        ctx.currentIndex = 0;
        localStorage.setItem('lastPlaylistId', playlistIdArr.join('/'));
        ctx.getPlaylist(playlistIdArr, ctx.callbackPlaylist);
    }
};

// 初始化
ctx.init();