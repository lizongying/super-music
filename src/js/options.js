import '../css/options.css'

const ctx = chrome.extension.getBackgroundPage().ctx;

// 默认播放列表
const initPlaylist = () => {
    if (ctx.playlistLang === 'ja' && ctx.playlist.length) {
        const html = ctx.playlist.map((v) => {
            return '<li>' + v['song'] + '</li>';
        }).join('');
        $ui.$playlist.html(html);
    } else if (ctx.playlist.length) {
        const html = ctx.playlist.map((v) => {
            return '<li>' + v['song'] + '</li>';
        }).join('');
        $ui.$playlist.html(html);
    }
};

// 默认播放列表语言
const initPlaylistLang = () => {
    if (ctx.playlistLang === 'ja') {
        $ui.$playlist.addClass('tradition');
    } else {
        $ui.$playlist.removeClass('tradition');
    }
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
        return '<li>' + v;
    });
    $ui.$lyric.html(html);
};

// 默认播放状态
const play = () => {
    $ui.$play.html(ctx.isPlaying ? '⏸' : '⏯');
};

// 默认循环状态
const loop = () => {
    $ui.$loop.html(ctx.singleLoop ? '🔁' : '🔂');
};

const updateMusicInfo = () => {
    $ui.$lyric.song.html(ctx.currentSong.song);
    $ui.$lyric.artist.html(ctx.currentSong.artist);
};

const updateCoverState = () => {

};

// 歌曲已更新
const songUpdated = () => {

    // 更新信息
    updateMusicInfo();

    setTimeout(ctx.play, 500);
};

// ui
window.$ui = {
    $artist: $('.artist'),
    $lyric: $('.lyric'),
    $song: $('.song'),
    $playlist: $('.playlist'),
    $loop: $('.loop'),
    $play: $('.play'),
    initPlaylist: initPlaylist,
    initPlaylistLang: initPlaylistLang,
    initLyric: initLyric,
    updateMusicInfo: updateMusicInfo,
    updateCoverState: updateCoverState,
    loop: loop,
    play: play,
    songUpdated: songUpdated,
};

$(() => {

    // 默认播放列表
    initPlaylist();

    // 默认播放列表语言
    initPlaylistLang();

    // 默认歌词
    initLyric();

    // 默认播放状态
    play();

    // 默认循环状态
    loop();

    // 翻译播放列表
    $('.transfer').click(() => {
        ctx.transferPlaylist();
    });

    // 显示播放列表
    $('.playlist-visible').click(() => {
        $ui.$playlist.toggle();
        $ui.$lyric.toggle();
    });

    // 改变播放列表方向
    $('.playlist-change').click(() => {
        $ui.$playlist.toggleClass('tradition');
        $ui.$lyric.toggleClass('tradition');
    });

    // 播放
    $ui.$play.click(() => {
        ctx.play()
    });

    // 循环
    $ui.$loop.click(() => {
        ctx.loop()
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


