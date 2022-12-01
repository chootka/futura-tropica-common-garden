let rooms = [];
let currentRoom = "none";
let adminGUI;
let openRoomGUI;
let isAdmin = false;

let joinThreshhold = 125;
let createThreshhold = 50;
let adminOpenState = false;
let roomWaitCounter = 0;
let videoAvatar = true;

let localStream;

let constraints = {
    audio: true,
    video: true
};

// function checkPass(event) {
//     event.preventDefault();
//     pass = document.querySelector(".passWindowBox form input[type=password]").value;
//     if (pass === null) {
//         exitAdmin();
//     }
//     socket.emit("checkPass", pass);
// }

function getLocalStream() {
    if (!disableAudio) {
        try {
            navigator.mediaDevices.getUserMedia(constraints)
            .then(function(stream) {
                localStream = stream;
                muted = false;

                socket.emit("unmute");

                window.setTimeout(function() {
                    if (myUser) {
                        myUser.classList.remove("muted");

                        if (myUser.querySelector("video.localAudio")) {
                            myUser.querySelector("video.localAudio").remove();
                        }

                        if (videoAvatar) {
                            let player = document.createElement("video");
                            player.srcObject = localStream;
                            player.classList.add("remoteAudio");
                            player.classList.add("localAudio");
                            player.setAttribute("playsinline", "");
                            player.muted = true;
                            player.autoplay = true;
                            myUser.appendChild(player);
                            myUser.classList.add("video");
                        }
                    }
                }, 500);
            })

            .catch(function(err) {
                alert("Unable to retrieve audio! Make sure to allow microphone access to get the full experience! Reload, or try opening this page in a different browser.")
                console.log("ERROR: Failed to getUserMedia(), err: " + err);
            });
        } catch(err) {
            console.log(err);
        }
    }
}

socket.on("unmute", function(socketId) {
    console.log(socketId + " has unmuted!");
    let user = document.querySelector("#user" + socketId);
    if (user) {
        document.querySelector("#user" + socketId).classList.remove("muted");

        window.setTimeout(function() {
            if (socketId == id) {
                muted = false;
                console.log("I have unmuted");
            }
        }, 100);
    }

});

socket.on("mute", function(socketId) {
    console.log(socketId + " has muted!");
    let user = document.querySelector("#user" + socketId);
    if (user) {
        document.querySelector("#user" + socketId).classList.add("muted");

        window.setTimeout(function() {
            if (socketId == id) {
                muted = true;
                console.log("I have muted, getting new stream...");
                getLocalStream();
            }
        }, 100);
    }

});

// socket.on("roomFull", function() {
//     let fullWindow = document.createElement("div");
//     fullWindow.className = "fade fullWindow";
//     fullWindow.innerHTML = "<div class='fullWindow'><p>The show you are trying to enter is too busy.<br>Please try again in a few minutes.</p></div>"
//     document.body.appendChild(fullWindow);
// });

// socket.on("stopAudio", function() {
//     if (!disableAudio) {
//         console.log("Disabling audio...")
//         disableAudio = true;
//         sendRoom("none");
//         let muteGui = document.createElement("div");
//         muteGui.className = "GUI muteGUI";
//         muteGui.innerHTML = "The special event has ended, all audio connections have been closed."
//         document.body.querySelector(".GUIcontainer").appendChild(muteGui);
//         window.setTimeout(function() {
//             muteGui.style.opacity = 0;
//             window.setTimeout(function() {
//                 muteGui.remove();
//             }, 200);
//         }, 10000);
//         for (let i=0; i<users.length; i++) {
//             if (users[i].pcM) {
//                 users[i].pcM.close();
//                 console.log("Closed pcM to user " + users[i].name);
//                 console.log(users[i].element.querySelector("audio"));
//                 users[i].element.querySelector("audio").remove();
//             }
//         }
//     }
// });


socket.on("setupStreaming", setupStreaming);


function setupStreaming() {
    console.log("setupStreaming called!");

    // only alow popUp to close after server added user to subdomain
    document.querySelector(".popUp .enterButton").classList.remove("disabled");

    let form = document.querySelector(".popUp form");
    form.addEventListener('submit', closePopUp);

    getLocalStream();
}

socket.on("newRoomName", function(room) {
    console.log("Got room name from server, joining room " + room)
    sendRoom(room);
    roomWaitCounter = 0;
})


function sendRoom(roomName) {
    currentRoom = roomName;
    let message = {
       type: "setRoom",
       roomName: roomName
   }
    let othersInRom = []
    for (let i=0; i<users.length; i++) {
       if (users[i].dc && users[i].dc.readyState == "open") {
           users[i].dc.send(JSON.stringify(message));
           if (users[i].room == roomName) {
               console.log(users[i].name + " is also in room " + currentRoom);
               othersInRom.push(users[i]);
           }
       }
    }
    if (roomName != "none") {
        console.log("Looking for other users in room " + roomName + " to send signalling offer to for media stream");
        console.log("how many users", users);
        window.setTimeout(function() {
            for (let i=0; i<users.length; i++) {

                console.log("Creating offer for user " + users[i].name);
        //        console.log(othersInRom[i]);

                console.log("#### FOUND OTHER USERS IN ROOM TO TALK TO");
                users[i].pcM = new RTCPeerConnection(config);
                window.setTimeout(function() {
                    users[i].pcM.onaddstream = handleRemoteStreamAdded;
                    users[i].pcM.onremovestream = handleRemoteStreamRemoved;
                    users[i].pcM.addStream(localStream);
                    createDataChannelOffer(users[i].pcM, users[i]);
                }, 50);
            }
        }, 50);
    }
}


function setRoom(roomName, socketId) {
   console.log("User " + socketId + " has joined room " + roomName);
    let index = users.map(e => e.name).indexOf(socketId);

    if (index>= 0 && users[index].room.includes("OpenAdmin")) {
        if (users[index].element.querySelector("audio")) {
            users[index].element.querySelector("audio").remove();
        }
        if (users[index].element.querySelector("video")) {
            users[index].element.querySelector("video").remove();
        }
    }

    if (index >= 0) {
        users[index].room = roomName;
    }
}


async function createDataChannelOffer(pc, otherUser) {
    console.log("Creating new offer for user " + otherUser.name);
    await pc.setLocalDescription(await pc.createOffer());
    pc.onicecandidate = ({candidate}) => {
        if (candidate) return;
        let message = {
            type: "offer",
            offer: pc.localDescription.sdp
        }
        otherUser.dc.send(JSON.stringify(message));
    }
}

async function createDataChannelAnswer(message, socketId) {
    console.log("Got offer from " + socketId);
    console.log(message.offer);

    let index = users.map(e => e.name).indexOf(socketId);

    if (index >= 0) {

        users[index].pcM = new RTCPeerConnection(config);
        users[index].pcM.setRemoteDescription({type: "offer", sdp: message.offer});
        users[index].pcM.onaddstream = handleRemoteStreamAdded;
        users[index].pcM.onremovestream = handleRemoteStreamRemoved;
        users[index].pcM.addStream(localStream);

        await users[index].pcM.setLocalDescription(await users[index].pcM.createAnswer());
        users[index].pcM.onicecandidate = ({candidate}) => {
            if (candidate) return;
            let message = {
                type: "answer",
                answer: users[index].pcM.localDescription.sdp
            }
            users[index].dc.send(JSON.stringify(message));
//            console.log("Send answer to " + socketId, users[index].pcM.localDescription.sdp)
        }
    }
}

function setDataChannelAnswer(message, socketId) {
    console.log("Got answer back from " + socketId);
    console.log(message.answer);

    let index = users.map(e => e.name).indexOf(socketId);

    if (index >= 0 && users[index].pcM.signalingState != "closed") {
        users[index].pcM.setRemoteDescription({type: "answer", sdp: message.answer});
    } else if (users[index].pcM.signalingState == "closed") {
        console.error("Signaling state for pcM of user " + socketId + " is closed!");
        users[index].pcM.close();
        console.warn("pcM for user " + socketId + " has been closed");
    } else {
        console.error("Cant find user " + socketId + "!");
    }
}

function handleRemoteStreamAdded(event) {
    console.log("Remote stream added");
    console.log(event.target);

    window.setTimeout(function() {
        let index = users.map(e => e.pcM).indexOf(event.target);
        let targetSdp = event.target.currentLocalDescription.sdp;

        if (index >= 0) {
            console.log("Found element to add stream to: " + users[index].name);
            let player = document.createElement("audio");
            if (videoAvatar) {
                player = document.createElement("video");
                player.setAttribute("playsinline", "");
            }
            if (users[index].element.classList.contains("adminUser")) {
                player = document.createElement("video");
                player.classList.add("adminAudio");
                player.setAttribute("playsinline", "");
            }
            player.srcObject = event.stream;
            player.classList.add("remoteAudio");
            player.autoplay = true;
            player.id = "player" + users[index].name;

            // sometimes when the connection is unstable, a new stream si added but the old one recoonects automaticaly, causing duplicate media elements. So before adding the new media element, check for existing players and remove them.
            let existingPlayers = users[index].element.querySelectorAll("video, audio");
            for (let i=0; i<existingPlayers.length; i++) {
                existingPlayers[i].remove();
                console.log("Removed old player element");
            }

            users[index].element.appendChild(player);
            if (videoAvatar) {
                window.setTimeout(function() {
                    users[index].element.classList.add("video");
                }, 100);
            }
        } else {
            console.log("didnt find element to add stream to yet, trying again with the fallback option...");
            // fallback for oler safari version
            let index = -1;
            for (let i=0; i<users.length; i++) {
                if (users[i].pcM && users[i].pcM.connectionState != "closed" && users[i].pcM.currentLocalDescription && users[i].pcM.currentLocalDescription.sdp == targetSdp) {
                    index = i;
                    break;
                }
            }
            if (index >= 0) {
                console.log("Found element to add stream to via fallback: " + users[index].name);
                let player = document.createElement("audio");
                if (videoAvatar) {
                    player = document.createElement("video");
                    player.setAttribute("playsinline", "");
                }
                if (users[index].element.classList.contains("adminUser")) {
                    player = document.createElement("video");
                    player.classList.add("adminAudio");
                    player.setAttribute("playsinline", "");
                }
                player.srcObject = event.stream;
                player.classList.add("remoteAudio");
                player.autoplay = true;
                player.id = "player" + users[index].name;

                // sometimes when the connection is unstable, a new stream si added but the old one recoonects automaticaly, causing duplicate media elements. So before adding the new media element, check for existing players and remove them.
                let existingPlayers = users[index].element.querySelectorAll("video, audio");
                for (let i=0; i<existingPlayers.length; i++) {
                    existingPlayers[i].remove();
                    console.log("Removed old player element");
                }

                users[index].element.appendChild(player);
                if (videoAvatar) {
                    window.setTimeout(function() {
                        users[index].element.classList.add("video");
                    }, 100);
                }
            } else {
                console.error("Unable to locate element to add stream to! Perhaps the user has already disconected?");
            }
        }
    }, 500);
}
function handleRemoteStreamRemoved(event) {
    console.log("Remote stream removed, closing connection...");
    this.close();
    console.log(event);
}

function printPeers() {
    let pcmUsers = [];

    for (let i=0; i<users.length; i++) {
        if (users[i].pcM && users[i].pcM.connectionState != "closed") {
            pcmUsers.push(users[i]);
        }
    }
    console.log("There are currently " + pcmUsers.length + " peer connections to other users");
    for (let i=0; i<pcmUsers.length; i++) {
        console.log("   users[" + pcmUsers[i].id + "] has a pcM with the status '" + pcmUsers[i].pcM.connectionState + "', and has the following remote streams:");
        let streams = pcmUsers[i].pcM.getRemoteStreams();
        for (let j=0; j<streams.length; j++) {
            console.log("       getRemoteStreams()[" + j + "] has id '", streams[j].id + "' and active: " + streams[j].active);
            let tracks = streams[j].getTracks();
            console.log("       This stream has the following tracks:");
            for (let k=0; k<streams.length; k++) {
                console.log("           getTracks()[" + k + "] has kind ", tracks[k].kind + " and id: " + tracks[k].id + " and mute state: " + tracks[k].muted);
            }
        }
    }
}

