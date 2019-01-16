import {qq} from './qq';
import {google} from './google';


// 通知
const notify = (data) => {
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

ctx.updateSong = () => {
    if (!ctx.currentSong.src) {
        const popup = ctx.getPopup();
        if (popup) {

            // 清空歌词
            notify(['cleanLyric']);
        }
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

// 默认歌词
ctx.initLyric = () => {
    if (!ctx.currentSong.lyric) {
        return;
    }
    const popup = ctx.getPopup();
    if (!ctx.transfer) {
        if (popup) {

            // 隐藏歌词
            notify(['hiddenLyric']);
        }
        return;
    }
    let lyricContent = '';
    ctx.currentSong.lyric.forEach((item) => {
        lyricContent += '<p>' + (item.transfer ? item.transfer : item.text);
    });
    if (popup) {

        // 添加歌词
        notify(['addLyric', lyricContent]);

        // 隐藏歌词
        notify(['hiddenLyric']);
    }
};

ctx.setInterval = () => {
    ctx.updateProcess();
    setInterval(ctx.updateProcess, 1000);
};

ctx.updateProcess = () => {
    const popup = ctx.getPopup();
    if (ctx.lyricShow && ctx.currentSong.lyric && ctx.currentSong.lyric.length > 0 && ctx.player.currentTime > ctx.currentSong.lyric[ctx.lyricIndex].time) {
        if (popup) {

            // 更新歌词
            notify(['updateLyric']);
        }
        ctx.lyricIndex++;
    }
    const buffer = ctx.player.buffered,
        bufferTime = buffer.length > 0 ? buffer.end(buffer.length - 1) : 0,
        duration = ctx.player.duration,
        currentTime = ctx.player.currentTime;

    if (popup) {

        // 更新进程
        notify(['changeProcess', duration, bufferTime, currentTime, ctx.processBtnState]);
    }
};

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
    ['blocking', 'requestHeaders']
);

// 播放
ctx.play = () => {
    ctx.player.play();
    ctx.isPlaying = true;
    notify(['play']);
};

// 暂停
ctx.pause = () => {
    ctx.player.pause();
    ctx.isPlaying = false;
    notify(['pause']);
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
    ctx.google.transfer(lyricTextArr.join('|*'), ctx.callbackLyricTransfer);
};

// 翻译的歌词
ctx.callbackLyricTransfer = (data) => {
    const obj = data['transfer'].split('|*');
    ctx.currentSong.lyric = ctx.currentSong.lyric.map((item, index) => {
        item.transfer = obj[index];
        return item
    });
};

// 播放列表
ctx.callbackPlaylist = (playlist) => {
    if (playlist.length === 0) {
        console.log('playlist is empty');
        return;
    }
    ctx.playlist = playlist;
    ctx.currentSong = ctx.playlist[ctx.currentIndex];
    console.log(ctx.playlist);
    console.log(ctx.currentSong);
    ctx.setBadge({text: '♪'});
    if (ctx.lyricShow) {
        const playlistStr = ctx.playlist.map((item) => {
            return item.song + ';;' + item.artist
        });
        for (let i = 0, len = playlistStr.length; i < len; i += 100) {
            const str = playlistStr.slice(i, i + 100);
            const text = str.join('|*$');
            ctx.google.transfer(text, i + 100, ctx.callbackTransferPlaylist);
        }
    }
};

// 翻译的播放列表
ctx.callbackTransferPlaylist = (data) => {
    const obj = data['transfer'].split('|*');
    obj.forEach((item, index) => {
        const info = item.split(';');
        ctx.playlist[index].songTransfer = info[0];
        ctx.playlist[index].artistTransfer = info[1];
        ctx.playlist[index].transfer = true;
    });
    ctx.initPlayList();
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
    const popup = ctx.getPopup();
    if (popup) {

        // 更新信息
        notify(['updateMusicInfo']);
    }
    ctx.setInterval();

    if (popup) {

        // 默认按钮
        notify(['initBtn']);
    }
    ctx.updateCoverState(0);
    if (popup) {

        // 更新图片
        notify(['updatePic']);
    }

    if (ctx.isPlaying) {
        setTimeout(ctx.play, 500);
    }
    localStorage.setItem('currentSongIndex', ctx.currentIndex.toString());
    if (ctx.lyricShow) {
        ctx.getLyric(ctx.currentSong, ctx.callbackLyric);
    }
};

// 翻译的歌曲
ctx.callbackTransfer = (data) => {
    const obj = data['transfer'].split('|*');
    ctx.currentSong.songTransfer = obj[0];
    ctx.currentSong.artistTransfer = obj[1];
    updateMusicInfo();
    ctx.initPlayList();
    ctx.initLyric();
};

//
// var pop = chrome.extension.getViews({type:'popup'});//获取popup页面
// console.log(pop[0].b);//调用第一个popup的变量或方法。

// 初始化ui
ctx.initUi = () => {

    // 初始化组件
    notify(['initData']);

    // 初始化状态
    notify(['initState']);

    // 初始化播放列表
    notify(['initPlayList']);

    // ctx.updateSong();
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

            // 初始化ui
            ctx.initUi();
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