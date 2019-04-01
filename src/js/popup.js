import '../css/popup.css'

const ctx = chrome.extension.getBackgroundPage().ctx;

// 更新播放列表
const updatePlaylist = (currentIndex) => {
    $ui.$listContent.children('li.active').removeClass('active').children('div.voice-icon').remove();
    $ui.$listContent.children('li').eq(currentIndex).addClass('active')
        .prepend($('<div>').addClass('voice-icon'));
    $ui.$listContent.animate({
        scrollTop: (currentIndex + 1) * 41 - $ui.$listContent.height() / 2
    });
};

// 指针暂停
const changeNeedle = () => {
    if (ctx.isPlaying) {
        $ui.$needle.removeClass('pause-needle').addClass('resume-needle');
    } else {
        $ui.$needle.removeClass('resume-needle').addClass('pause-needle');
    }
};

// 默认播放列表语言
const initPlaylistLang = () => {
};

// 默认歌词
const initLyric = () => {
    $ui.$lyric.html('');
    const lyricTextArr = ctx.currentSong && ctx.currentSong.lyric ? ctx.currentSong.lyric.map((v) => {
        return v['text'];
    }) : [];
    if (!lyricTextArr.length) {
        return;
    }
    const html = lyricTextArr.map((v) => {
        return '<p>' + v;
    });
    $ui.$lyric.html(html);
};

// 隐藏歌词
const hiddenLyric = () => {
    $ui.$needle.removeClass('hidden');
    $ui.$lyric.addClass('hidden');
};

// 更新歌词
const updateLyric = (lyricIndex) => {
    $ui.$lyric.scrollLeft(($ui.$lyric.children().length - lyricIndex) * 24 - 192);
    if (lyricIndex > 0) {
        $ui.$lyric.children(':eq(' + (lyricIndex - 1) + ')').removeClass('active');
    }
    $ui.$lyric.children(':eq(' + lyricIndex + ')').addClass('active');
};

// 更新进程
const changeProcess = (duration, bufferTime, currentTime, processBtnState) => {
    $ui.$totTime.text(ctx.validateTime(duration / 60) + ":" + ctx.validateTime(duration % 60));
    $ui.$rdyBar.width(bufferTime / duration * 100 + '%');
    if (!processBtnState) {
        $ui.$curBar.width(currentTime / duration * 100 + '%');
        $ui.$curTime.text(ctx.validateTime(currentTime / 60) + ":" + ctx.validateTime(currentTime % 60));
    }
};

// 播放
const play = () => {
    $ui.changeAnimationState($ui.$diskCovers[1], ctx.isPlaying ? 'running' : 'paused');
    $ui.changeNeedle();
    $ui.$playBtn.hide();
    $ui.$pauseBtn.show();
};

// 暂停
const pause = () => {
    $ui.changeAnimationState($ui.$diskCovers[1], ctx.isPlaying ? 'running' : 'paused');
    $ui.changeNeedle();
    $ui.$playBtn.show();
    $ui.$pauseBtn.hide();
};

// 循环
const loop = () => {
    ctx.singleLoop ? $ui.$loop.addClass('active') : $ui.$loop.removeClass('active');
};

// 上一首
const prev = () => {
    setTimeout(updateCoverState(-1), ctx.isPlaying ? 400 : 0);
};

// 下一首
const next = () => {
    setTimeout(updateCoverState(1), ctx.isPlaying ? 400 : 0);
};

// 切换歌曲
const moveTo = () => {
    setTimeout(updateCoverState(1, true), ctx.isPlaying ? 400 : 0);
};

// 隐藏播放列表
const hidePlayList = () => {
    $ui.$playlist.animate({bottom: -$ui.$playlist.height() + 'px'}, 200);
};

// 显示播放列表
const showPlaylist = () => {
    $ui.$playlist.animate({bottom: '0px'}, 200);
};

// 歌曲已更新
const songUpdated = () => {

    // 更新信息
    updateMusicInfo();

    // 更新图片
    updatePic();

    // 默认按钮
    initBtn();

    if (ctx.isPlaying) {
        setTimeout(ctx.play, 500);
    }

    updateCoverState(0);
};

// 更新信息
const updateMusicInfo = () => {
    $ui.$song.html(ctx.transfer ? ctx.currentSong.songTransfer : ctx.currentSong.song);
    $ui.$artist.html(ctx.transfer ? ctx.currentSong.artistTransfer : ctx.currentSong.artist);
};

// 更新图片
const updatePic = () => {
    $ui.$bg.css('background-image', 'url(' + ctx.currentSong.img + ')');
};

// 默认按钮
const initBtn = () => {
    const moveFun = (e) => {
            e = e.originalEvent;
            e.preventDefault();
            let duration = ctx.player.duration,
                totalWidth = $ui.$processBar.width(), percent, moveX, newWidth;
            if (ctx.processBtnState) {
                moveX = (e.clientX || e.touches[0].clientX) - ctx.originX;
                newWidth = $ui.$curBar.width() + moveX;
                if (newWidth > totalWidth || newWidth < 0) {
                    ctx.processBtnState = 0;
                } else {
                    percent = newWidth / totalWidth;
                    $ui.$curBar.width(newWidth);
                    $ui.$curTime.text(ctx.validateTime(percent * duration / 60) + ":" + ctx.validateTime(percent * duration % 60));
                }
                ctx.originX = (e.clientX || e.touches[0].clientX);
            }
        },
        startFun = (e) => {
            e = e.originalEvent;
            ctx.processBtnState = 1;
            ctx.originX = (e.clientX || e.touches[0].clientX);
        },
        endFun = () => {
            if (ctx.processBtnState) {
                ctx.player.currentTime = $ui.$curBar.width() / $ui.$processBar.width() * ctx.player.duration;
                ctx.processBtnState = 0;
                ctx.updateProcess();
            }
        };
    $ui.$processBtn.on('mousedown touchstart', startFun);
    $("body").on('mouseup touchend', endFun);
    $("#process").on('mousemove touchmove', moveFun);
};

const changeAnimationState = ($ele, state) => {
    $ele.css({
        'animation-play-state': state,
        '-webkit-animation-play-state': state
    });
};

// 初始化播放列表
const initPlaylist = () => {
    $ui.$listContent.html('');
    $('#list-count').html(ctx.playlist.length);
    $.each(ctx.playlist, (i, item) => {
        const $li = $('<li>').html(ctx.transfer ? item.songTransfer : item.song).append($('<span>').html('   -' + ctx.transfer ? item.artistTransfer : item.artist));
        $li.on('click touch', () => {
            if (ctx.currentIndex !== i) {
                ctx.isPlaying = true;

                // 移动到指定位置
                ctx.moveTo(i);
            }
        });
        $ui.$listContent.append($li);
    });
    $ui.updatePlaylist(ctx.currentIndex);
    $ui.$playlist.css('bottom', -$ui.$playlist.height() + 'px');
};

// 更新背景状态
ctx.updateCoverState = (derection, preLoad) => {
    let temp, speed = 800, defaultUrl = require('../images/placeholder_disk_play_song.png'),
        preIndex = ctx.currentIndex - 1 < 0 ? ctx.playlist.length - 1 : ctx.currentIndex - 1,
        nextIndex = ctx.currentIndex + 2 > ctx.playlist.length ? 0 : ctx.currentIndex + 1,
        posLeft = -$ui.$diskCovers[0].width() / 2,
        posCenter = '50%',
        posRight = $ui.$diskCovers[0].parent().width() + $ui.$diskCovers[0].width() / 2,
        updateAlbumImgs = () => {
            $ui.$diskCovers[0].children('.album').attr('src', ctx.playlist[preIndex].img);
            $ui.$diskCovers[1].children('.album').attr('src', ctx.playlist[ctx.currentIndex].img);
            $ui.$diskCovers[2].children('.album').attr('src', ctx.playlist[nextIndex].img);
        },
        animationEnd = () => {
            if (!ctx.songUpdated) {
                updateAlbumImgs();
                ctx.updateSong();
                ctx.songUpdated = true;
            }
        }, albumStopRotate = () => {
            changeAnimationState($ui.$diskCovers[0], 'paused');
            changeAnimationState($ui.$diskCovers[2], 'paused');
        };
    if (derection === 1) {
        ctx.songUpdated = false;
        temp = $ui.$diskCovers[0];
        $ui.$diskCovers[0] = $ui.$diskCovers[1];
        $ui.$diskCovers[1] = $ui.$diskCovers[2];
        $ui.$diskCovers[2] = temp;
        albumStopRotate();
        if (preLoad) {
            $ui.$diskCovers[1].children('.album').attr('src', defaultUrl);
        }
        $ui.$diskCovers[2].css('left', posRight);
        $ui.$diskCovers[1].animate({left: posCenter}, speed, animationEnd);
        $ui.$diskCovers[0].animate({left: posLeft}, speed, animationEnd);
    } else if (derection === -1) {
        ctx.songUpdated = false;
        temp = $ui.$diskCovers[2];
        $ui.$diskCovers[2] = $ui.$diskCovers[1];
        $ui.$diskCovers[1] = $ui.$diskCovers[0];
        $ui.$diskCovers[0] = temp;
        albumStopRotate();
        $ui.$diskCovers[0].css('left', posLeft);
        $ui.$diskCovers[1].animate({left: posCenter}, speed, animationEnd);
        $ui.$diskCovers[2].animate({left: posRight}, speed, animationEnd);
    } else {
        ctx.songUpdated = true;
        $ui.$diskCovers[0].css('left', posLeft).show();
        $ui.$diskCovers[1].css('left', posCenter).show();
        $ui.$diskCovers[2].css('left', posRight).show();
        updateAlbumImgs();
    }
};

// ui
window.$ui = {
    $curBar: $('#process .cur'),
    $curTime: $('#current-time'),
    $listContent: $('#list-content'),
    $lyric: $('.lyric'),
    $needle: $('#needle'),
    $pauseBtn: $('#controls .pause'),
    $playBtn: $('#controls .play'),
    $playlist: $('#playlist'),
    $processBar: $('#process .process-bar'),
    $processBtn: $('#process-btn'),
    $rdyBar: $('#process .rdy'),
    $totTime: $('#total-time'),
    $diskCovers: [$('.disk-cover:eq(0)'), $('.disk-cover:eq(1)'), $('.disk-cover:eq(2)')],
    $loop: $('.loop'),
    $song: $('#song'),
    $artist: $('#artist'),
    $bg: $('#bg'),
    updatePlaylist: updatePlaylist,
    changeAnimationState: changeAnimationState,
    changeNeedle: changeNeedle,
    hiddenLyric: hiddenLyric,
    updateLyric: updateLyric,
    changeProcess: changeProcess,
    play: play,
    pause: pause,
    loop: loop,
    prev: prev,
    next: next,
    moveTo: moveTo,
    hidePlayList: hidePlayList,
    showPlaylist: showPlaylist,
    initPlaylist: initPlaylist,
    updateMusicInfo: updateMusicInfo,
    songUpdated: songUpdated,
};

// 通信
chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        if (request instanceof Array) {
            console.log(request[0]);
            $ui[request[0]](...request.slice(1));
        }
    });

$(() => {
    chrome.tabs.query({'active': true}, (tabs) => {
        ctx.setBadge({text: ''});
        let playlistIdArr = ['qq', 'playsquare', '895009342'];
        const lastPlaylistId = localStorage.getItem('lastPlaylistId');
        const lastPlaylistIdArr = lastPlaylistId ? lastPlaylistId.split('/') : ['', '', ''];
        const tabURL = tabs[0].url;
        const regexList = [
            {regex: /(qq)\/(playsquare)\/(\d+)/},
            {regex: /(qq)\/(album)\/(.+?)\./},
            {regex: /(qq)\/(singer)\/(.+?)\./},
            {regex: /(qq)\/(song)\/(.+?)\./},
        ];
        if (lastPlaylistId && lastPlaylistIdArr.length === 3) {
            playlistIdArr = lastPlaylistIdArr;
        }
        regexList.some((item) => {
            let result = tabURL.match(item.regex);
            if (result && result.length === 4) {
                playlistIdArr = result.slice(1);
                return true;
            }
        });
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
    });

    $('img').attr('draggable', false);
    window.addEventListener('resize', ctx.updateCoverState);
    $('body').on('click touch', (e) => {
        if ($(e.target).parents('#playlist').length === 0 && !$(e.target).hasClass('list')) {

            // 隐藏播放列表
            ctx.hidePlayList();
        }
    });

    // 默认播放列表
    initPlaylist();

    // 默认播放列表语言
    initPlaylistLang();

    // 默认歌词
    initLyric();

    // 默认循环状态
    loop();

    // 播放
    $('.play, .pause').click(() => {
        ctx.play()
    });

    // 循环
    $ui.$loop.click(() => {
        ctx.loop()
    });

    // 上一首
    $('.prev').click(() => {
        ctx.prev()
    });

    // 下一首
    $('.next').click(() => {
        ctx.next()
    });

    // 显示播放列表
    $('.list').click(() => {
        console.log('show playlist');
        showPlaylist()
    });

    $('.disk-cover, #lyric').click(() => {
        if (!ctx.lyricShow || !ctx.currentSong) {
            return;
        }
        ctx.transfer = !ctx.transfer;
        if (!ctx.currentSong.songTransfer && ctx.transfer) {
            ctx.$lyric.html('');
            ctx.google.transfer(ctx.currentSong.song + '|*' + ctx.currentSong.artist, callbackTransfer);
        }
        if (ctx.currentSong.songTransfer) {
            updateMusicInfo();

        }
    });

    // 键盘事件
    $(document).keydown((event) => {

        // 播放/暂停
        if (event.keyCode === 13 || event.keyCode === 32) {
            ctx.play();
            return
        }

        // 上一首
        if (event.keyCode === 37) {
            ctx.prev();
            return
        }

        // 下一首
        if (event.keyCode === 39) {
            ctx.next();
        }
    });
});