const ctx = chrome.extension.getBackgroundPage().ctx;

// 更新播放列表
const updatePlaylist = (currentIndex) => {
    $popup.$listContent.children('li.active').removeClass('active').children('div.voice-icon').remove();
    $popup.$listContent.children('li').eq(currentIndex).addClass('active')
        .prepend($('<div>').addClass('voice-icon'));
    $popup.$listContent.animate({
        scrollTop: (currentIndex + 1) * 41 - $popup.$listContent.height() / 2
    });
};

// 指针暂停
const changeNeedle = (isPlay) => {
    if (isPlay) {
        ctx.$needle.removeClass('pause-needle').addClass('resume-needle');
    } else {
        ctx.$needle.removeClass('resume-needle').addClass('pause-needle');
    }
};

// 清空歌词
const cleanLyric = () => {
    ctx.$lyric.html('');
};

// 添加歌词
const addLyric = (lyricContent) => {
    ctx.$lyric.html(lyricContent);
};

// 隐藏歌词
const hiddenLyric = () => {
    ctx.$needle.removeClass('hidden');
    ctx.$lyric.addClass('hidden');
};

// 更新歌词
const updateLyric = (lyricIndex) => {
    ctx.$lyric.scrollLeft((ctx.$lyric.children().length - lyricIndex) * 24 - 192);
    if (lyricIndex > 0) {
        ctx.$lyric.children(':eq(' + (lyricIndex - 1) + ')').removeClass('active');
    }
    ctx.$lyric.children(':eq(' + lyricIndex + ')').addClass('active');
};

// 更新进程
const changeProcess = (duration, bufferTime, currentTime, processBtnState) => {
    ctx.$totTime.text(ctx.validateTime(duration / 60) + ":" + ctx.validateTime(duration % 60));
    ctx.$rdyBar.width(bufferTime / duration * 100 + '%');
    if (!processBtnState) {
        ctx.$curBar.width(currentTime / duration * 100 + '%');
        ctx.$curTime.text(ctx.validateTime(currentTime / 60) + ":" + ctx.validateTime(currentTime % 60));
    }
};

// 播放
const play = () => {
    ctx.changeAnimationState(ctx.diskCovers[1], 'running');
    $ui.changeNeedle(true);
    ctx.$playBtn.hide();
    ctx.$pauseBtn.show();
};

// 暂停
const pause = () => {
    ctx.changeAnimationState(ctx.diskCovers[1], 'paused');
    $ui.changeNeedle(false);
    ctx.$playBtn.show();
    ctx.$pauseBtn.hide();
};

// 循环
const loop = () => {
    $('#controls .loop').toggleClass('active');
};

// 上一首
const prev = () => {
    setTimeout(ctx.updateCoverState(-1), ctx.isPlaying ? 400 : 0);
};

// 下一首
const next = () => {
    setTimeout(ctx.updateCoverState(1), ctx.isPlaying ? 400 : 0);
};

// 切换歌曲
const moveTo = () => {
    setTimeout(ctx.updateCoverState(1, true), ctx.isPlaying ? 400 : 0);
};

// 隐藏播放列表
const hidePlayList = () => {
    $popup.$playlist.animate({bottom: -$popup.$playlist.height() + 'px'}, 200);
};

// 显示播放列表
const showPlaylist = () => {
    $popup.$playlist.animate({bottom: '0px'}, 200);
};

// 默认按钮
const initBtn = () => {
    const moveFun = (e) => {
            e = e.originalEvent;
            e.preventDefault();
            let duration = ctx.player.duration,
                totalWidth = ctx.$processBar.width(), percent, moveX, newWidth;
            if (ctx.processBtnState) {
                moveX = (e.clientX || e.touches[0].clientX) - ctx.originX;
                newWidth = ctx.$curBar.width() + moveX;
                if (newWidth > totalWidth || newWidth < 0) {
                    ctx.processBtnState = 0;
                } else {
                    percent = newWidth / totalWidth;
                    ctx.$curBar.width(newWidth);
                    ctx.$curTime.text(ctx.validateTime(percent * duration / 60) + ":" + ctx.validateTime(percent * duration % 60));
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
                ctx.player.currentTime = ctx.$curBar.width() / ctx.$processBar.width() * ctx.player.duration;
                ctx.processBtnState = 0;
                ctx.updateProcess();
            }
        };
    ctx.$processBtn.on('mousedown touchstart', startFun);
    $("body").on('mouseup touchend', endFun);
    $("#process").on('mousemove touchmove', moveFun);
};
window.initBtn = initBtn;

// 更新信息
const updateMusicInfo = () => {
    $('#song').html(ctx.transfer ? ctx.currentSong.songTransfer : ctx.currentSong.song);
    $('#artist').html(ctx.transfer ? ctx.currentSong.artistTransfer : ctx.currentSong.artist);
};
window.updateMusicInfo = updateMusicInfo;

const pic = () => {
    $('#bg').css('background-image', 'url(' + ctx.currentSong.img + ')');

};
window.pic = pic;

// 更新图片
const updatePic = () => {
    setTimeout(updatePic, 10);
};
window.updatePic = updatePic;

ctx.changeAnimationState = ($ele, state) => {
    $ele.css({
        'animation-play-state': state,
        '-webkit-animation-play-state': state
    });
};

// 初始化组件
const initData = () => {
    $popup.$curBar = $('#process .cur');
    $popup.$curTime = $('#current-time');
    $popup.$listContent = $('#list-content');
    $popup.$lyric = $('#lyric');
    $popup.$needle = $('#needle');
    $popup.$pauseBtn = $('#controls .pause');
    $popup.$playBtn = $('#controls .play');
    $popup.$playlist = $('#playlist');
    $popup.$processBar = $('#process .process-bar');
    $popup.$processBtn = $('#process-btn');
    $popup.$rdyBar = $('#process .rdy');
    $popup.$totTime = $('#total-time');
    $popup.$diskCovers = [$('.disk-cover:eq(0)'), $('.disk-cover:eq(1)'), $('.disk-cover:eq(2)')];
};

// 初始化状态
const initState = () => {
    $('img').attr('draggable', false);
    window.addEventListener('resize', ctx.updateCoverState);
    $('body').on('click touch', (e) => {
        if ($(e.target).parents('#playlist').length === 0 && !$(e.target).hasClass('list')) {

            // 隐藏播放列表
            ctx.hidePlayList();
        }
    });
    ctx.singleLoop ? $('#controls .loop').addClass('active') : null;
};

// 初始化播放列表
const initPlayList = () => {
    $popup.$listContent.html('');
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
        $popup.$listContent.append($li);
    });
    $popup.updatePlaylist(ctx.currentIndex);
    $popup.$playlist.css('bottom', -$popup.$playlist.height() + 'px');
};

// 更新背景状态
ctx.updateCoverState = (derection, preLoad) => {
    console.log(333333);
    let temp, speed = 800, defaultUrl = require('../images/placeholder_disk_play_song.png'),
        preIndex = ctx.currentIndex - 1 < 0 ? ctx.playlist.length - 1 : ctx.currentIndex - 1,
        nextIndex = ctx.currentIndex + 2 > ctx.playlist.length ? 0 : ctx.currentIndex + 1,
        posLeft = -ctx.diskCovers[0].width() / 2,
        posCenter = '50%',
        posRight = ctx.diskCovers[0].parent().width() + ctx.diskCovers[0].width() / 2,
        updateAlbumImgs = () => {
            ctx.diskCovers[0].children('.album').attr('src', ctx.playlist[preIndex].img);
            ctx.diskCovers[1].children('.album').attr('src', ctx.playlist[ctx.currentIndex].img);
            ctx.diskCovers[2].children('.album').attr('src', ctx.playlist[nextIndex].img);
        },
        animationEnd = () => {
            if (!ctx.songUpdated) {
                updateAlbumImgs();
                ctx.updateSong();
                ctx.songUpdated = true;
            }
        }, albumStopRotate = () => {
            ctx.changeAnimationState(ctx.diskCovers[0], 'paused');
            ctx.changeAnimationState(ctx.diskCovers[2], 'paused');
        };
    if (derection === 1) {
        ctx.songUpdated = false;
        temp = ctx.diskCovers[0];
        ctx.diskCovers[0] = ctx.diskCovers[1];
        ctx.diskCovers[1] = ctx.diskCovers[2];
        ctx.diskCovers[2] = temp;
        albumStopRotate();
        if (preLoad) {
            ctx.diskCovers[1].children('.album').attr('src', defaultUrl);
        }
        ctx.diskCovers[2].css('left', posRight);
        ctx.diskCovers[1].animate({left: posCenter}, speed, animationEnd);
        ctx.diskCovers[0].animate({left: posLeft}, speed, animationEnd);
    } else if (derection === -1) {
        ctx.songUpdated = false;
        temp = ctx.diskCovers[2];
        ctx.diskCovers[2] = ctx.diskCovers[1];
        ctx.diskCovers[1] = ctx.diskCovers[0];
        ctx.diskCovers[0] = temp;
        albumStopRotate();
        ctx.diskCovers[0].css('left', posLeft);
        ctx.diskCovers[1].animate({left: posCenter}, speed, animationEnd);
        ctx.diskCovers[2].animate({left: posRight}, speed, animationEnd);
    } else {
        ctx.songUpdated = true;
        ctx.diskCovers[0].css('left', posLeft).show();
        ctx.diskCovers[1].css('left', posCenter).show();
        ctx.diskCovers[2].css('left', posRight).show();
        updateAlbumImgs();
    }
};

// ui
window.$popup = {
    $curBar: null,
    $curTime: null,
    $listContent: null,
    $lyric: null,
    $needle: null,
    $pauseBtn: null,
    $playBtn: null,
    $playlist: null,
    $processBar: null,
    $processBtn: null,
    $rdyBar: null,
    $totTime: null,
    $diskCovers: [],
    updatePlaylist: updatePlaylist,
    changeNeedle: changeNeedle,
    cleanLyric: cleanLyric,
    addLyric: addLyric,
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
    initData: initData,
    initState: initState,
    initPlayList: initPlayList,
};

// 通信
chrome.runtime.onMessage.addListener(
    (request, sender, sendResponse) => {
        if (request instanceof Array) {
            $popup[request[0]](...request.slice(1));
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

    // 播放
    $('.play').click(() => {
        ctx.play()
    });

    // 暂停
    $('.pause').click(() => {
        ctx.pause()
    });

    // 循环
    $('.loop').click(() => {
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
        ctx.showPlaylist()
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

            // 默认播放列表
            ctx.initPlayList();

            // 默认歌词
            ctx.initLyric();
        }
    });

    // 键盘事件
    $(document).keydown((event) => {

        // 播放/暂停
        if (event.keyCode === 13 || event.keyCode === 32) {
            ctx.isPlaying ? ctx.pause() : ctx.play();
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