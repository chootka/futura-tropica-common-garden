let videoStartTime = 1609455600000;
let reqTime;
let localReqTime;

let YouTubeAPIready = false;

let youtubeQue = [];

let YTplayers = [];
let VMplayers = [];

function onYouTubeIframeAPIReady() {
    YouTubeAPIready = true;
    for (let i=0; i<youtubeQue.length; i++) {
        makeYoutubePlayer(youtubeQue[i]);
    }
    youtubeQue = [];
}

function makeYoutubePlayer(id) {
    player = new YT.Player(id, {
        events: {
            'onStateChange': onPlayerStateChange,
            'onReady': onPlayerReady
        }
    });
    let elem = document.getElementById(id);

    player.elementId = "artwork" + id.substr(6,99999);
    YTplayers.push(player);

    if (!elem.dataset.video) {
        elem.dataset.video = false;
    }
    console.log("Created player " + id);
}

function onPlayerStateChange(event) {
    if (mobile && event.target.getIframe().parentElement.querySelector(".volumeSlider")) {
        event.target.getIframe().parentElement.querySelector(".volumeSlider").remove();
    }

    // check if youtube video starts playing (player state 1)
    if (event.data === 1 || event.data === 0) {

        // stop IOS atempts to play the video as soon as it has worked
        clearInterval(event.target.autplayTimer);

        // check if video should be synchronised & calculate the correct time offset
        if (event.target.getIframe().parentElement.parentElement.dataset.youtubesync && event.target.getIframe().dataset.video == "true") {

            // time diferance beteen server & client
            let timeDif = reqTime - localReqTime;

            // time in seconds since jan 1st 2021 on the server
            let timeOffset = new Date().getTime() - videoStartTime + timeDif;

            // duration of the youtube video
            let duration = Math.ceil(event.target.getDuration()) * 1000;
            // using celi for cros-browser consistency. Safari returns time with decimal points, but Chrome rounds time up to the next full second.

            // calculate how many times the video has looped since jan 1st 2021
            let loops = Math.floor(timeOffset/duration);

            // calculate final position of video by subtracting the amount of loops from the time since 1st jan 2021
            let targetTimeMs = (timeOffset - (loops * duration));
            // device by 1000 to get time in seconds for the youtube API call
            let targetTime = targetTimeMs / 1000;

            // get current time in the video to check if time needs to be adjusted
            let currentTime = event.target.getCurrentTime();

            // check if the target time is more then 1s from the current time in the video
            if (targetTimeMs > duration - 1000) {
                // due to rounding issue, check if current time is within 1 second of end of video. If so, return to the start of the video
                event.target.seekTo(0, true);
            } else if (currentTime < targetTime -1 || currentTime > targetTime +1) {
                // if video is still playing, skip to the target time
                event.target.seekTo(targetTime, true);
            }
        }
    }
}

function unMuteYouTube() {
    for (let i=0; i<YTplayers.length; i++) {
        YTplayers[i].unMute();
        YTplayers[i].playVideo();
    }

    for (let i=0; i<VMplayers.length; i++) {
        VMplayers[i].setVolume(1);
    }
}

function onPlayerReady(event) {
    if (!inShow) {
        event.target.mute();
        event.target.playVideo();
    } else if (mobile) {
        event.target.playVideo();
    }

    if (event.target.getIframe().dataset.showvolume) {
        createVolumeSlider(event.target);
        event.target.setVolume(event.target.getIframe().dataset.volume);
    }
    console.log("Player ready, video:", player.getIframe().dataset.video);
    if (player.getIframe().dataset.video == "false") {
        console.log("Not (yet) video");
        isYouTubeLive(event.target);
    }
}

const isYouTubeLive = function(player) {
    player.interval = setInterval(function() {
        let d1 = player.getDuration();
        if (d1 > 0) {
            console.log(player);
            clearInterval(player.interval);
            window.setTimeout(function() {
                player.pauseVideo();
                window.setTimeout(function() {
                    let d2 = player.getDuration();
                    console.log(d1,d2);

                    if (Math.abs(d1-d2 < 1)) {
                        player.getIframe().dataset.video = true;
                        console.log("VIDEO");
                    } else {
                        console.log("LIVE");
                    }
                    player.playVideo();
                }, 100);
            }, 1500);
        }
    }, 100);
}

function unloadVideo(id) {
    var index = YTplayers.findIndex(function(item, i){ return item.elementId == id });

    if (index >= 0) {
        let player = YTplayers[index];

        if (player) {
            let elem = document.querySelector("#" + id + " iframe");

            let volumeSlider = elem.parentElement.querySelector("input");
            if (volumeSlider) {
                volumeSlider.remove();
            }

            let newElem = elem.cloneNode(true);
            newElem.src = "";
            elem.parentElement.insertBefore(newElem, elem);
            player.destroy();
        }
        YTplayers.splice(index,1);
    }
}

function playTrigger(event) {
    let index = YTplayers.findIndex(function(item, i){ return item.elementId == event.target.parentElement.id });

    if (index >= 0) {
        YTplayers[index].playVideo();
    }
}


function createVolumeSlider(player) {
    if (!mobile) {
        let slider = document.createElement("input");
        slider.type = "range";
        slider.min = 0;
        slider.max = 100;
        slider.step = 10;
        slider.value = player.getIframe().dataset.volume;
        slider.className = "volumeSlider";
        slider.addEventListener("input", changeVolume);
        slider.dataset.playerId = player.getIframe().parentElement.parentElement.id;
        player.getIframe().parentElement.appendChild(slider);
    }
}

function changeVolume(event) {
    let index = YTplayers.findIndex(function(item, i){ return item.elementId == event.target.dataset.playerId });

    if (index >= 0) {
        YTplayers[index].setVolume(event.target.value);
        YTplayers[index].getIframe().dataset.volume = event.target.value;
    }
}

// VIMEO

function makeVimeoPlayer(id) {
    console.log("Creating vimeo player for " + id);
    let iframe = document.getElementById(id);
    let player = new Vimeo.Player(iframe);
    console.log(player);

    player.on('play', vimeoSync);

    VMplayers.push(player);
    createVimeoVolumeSlider(player);

    if (!inShow) {
        player.setMuted("true");
    }
}

async function vimeoSync(event) {

    console.log("Playing ", this);
    // function gets called twice when skipping forwards/backwards, one with and one without event data. so cgeck if event data is present before continuing.
    if (event) {
        console.log(event, this);

        // check if video should be synchronised & calculate the correct time offset
        if (this.element.parentElement.parentElement.dataset.youtubesync) {

            // time diferance beteen server & client
            let timeDif = reqTime - localReqTime;
            console.log("timeDif: " + timeDif);

            // time in seconds since jan 1st 2021 on the server
            let timeOffset = new Date().getTime() - videoStartTime + timeDif;
            console.log("timeOffset: " + timeOffset);

            // duration of the youtube video
            let duration = Math.round(event.duration) * 1000;
            console.log("duration: " + event.duration + "(" + duration + ")");
            // using round for cros-browser consistency. diferent browsers return diferent amount of precision points for duration property, causing sync issues.

            // calculate how many times the video has looped since jan 1st 2021
            let loops = Math.floor(timeOffset/duration);
            console.log("loops: " + loops);

            // calculate final position of video by subtracting the amount of loops from the time since 1st jan 2021
            let targetTimeMs = (timeOffset - (loops * duration));
            // device by 1000 to get time in seconds for the youtube API call
            let targetTime = targetTimeMs / 1000;
            console.log("targetTime: " + targetTime);

            // get current time in the video to check if time needs to be adjusted
            let currentTime = event.seconds;
            console.log("currentTime: " + currentTime);

            // check if the target time is more then 1s from the current time in the video
            if (targetTimeMs > duration - 1000) {
                // due to rounding issue, check if current time is within 1 second of end of video. If so, return to the start of the video
                this.setCurrentTime(0);
            } else if (currentTime < targetTime -1 || currentTime > targetTime +1) {
                // if video is still playing, skip to the target time
                this.setCurrentTime(targetTime);
            }
        }

    }
}

function createVimeoVolumeSlider(player) {
    if (!mobile) {
        let slider = document.createElement("input");
        slider.type = "range";
        slider.min = 0;
        slider.max = 1;
        slider.step = 0.1;
        slider.value = player.element.dataset.volume;
        slider.className = "volumeSlider";
        slider.addEventListener("input", changeVolumeVimeo);
        slider.dataset.playerId = player.element.parentElement.parentElement.id;
        player.element.parentElement.appendChild(slider);
    }
}

function changeVolumeVimeo(event) {
    let index = VMplayers.findIndex(function(item, i) { return item.element == document.querySelector("#" + event.target.dataset.playerId + " iframe") });
    console.log(index);

    if (index >= 0) {
        VMplayers[index].setVolume(event.target.value);
        VMplayers[index].element.dataset.volume = event.target.value;
    }
}

function unloadVimeo(elem) {
    console.log("Unloading vimeo player ", elem.querySelector("iframe"));
    let frameElem = elem.querySelector("iframe")
    let index = VMplayers.findIndex(function(item, i) { return item.element == frameElem });

    console.log("index: " + index);
    if (index >= 0) {
        let volumeSlider = elem.querySelector("input");
        if (volumeSlider) {
            volumeSlider.remove();
        }

        let newElem = frameElem.cloneNode(true);
        newElem.src = "";
        frameElem.parentElement.insertBefore(newElem, frameElem);
        VMplayers[index].destroy().then(function() {
            VMplayers.splice(index,1);
        });
        console.log("Should be unloaded!");
    }
}
