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

let users = [];
let muted = true;

// const parts = location.hostname.split('.');
// let subdomain = parts.shift();

if (typeof subdomainAlias !== 'undefined') {
    subdomain = subdomainAlias;
}


let id;
let color;
let config = {
//
//    Add STUN or TURN servers here if needed
//
   iceServers: [
       {
            'urls': 'turn:turn.weise7.org',
            'username': 'futuratropica',
            'credential': 'OcFeghes6Wrynmak'
       }
   ]
}
let myUser;
let myMapUser;

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

socket.on("setId", function(data) {
    //console.log("dataSignalling, setId, data", data);
    reqTime = data.reqTime;
    localReqTime = new Date().getTime();
    if (!id) {
        id = data.id;
        let gradient = "linear-gradient(" + data.angle * 45 + "deg, hsl(" + data.hue + ",100%," + data.bright + "%) 49%, hsl(" + data.hue2 + ",100%," + data.bright2 + "%) 50%)";
        //console.log("Id and collor have been assigned by server: " + id, gradient);
        let elem = document.createElement("div");
        elem.id = "user" + id;
        //console.log(data.angle);
        elem.style.background = gradient;
        elem.className = "user myUser muted";
        if (!muted) {
            elem.classList.remove("muted");
        }
        document.body.querySelector(".avatarContainer").appendChild(elem);

        let mapElem = document.createElement("div");
        mapElem.id = "mapUser" + id;
        mapElem.className = "mapUser myMapUser";
        document.body.querySelector(".map").appendChild(mapElem);

        //console.log("elem for myUser", elem);
        //console.log("elem for myMapUser", mapElem);

        myUser = elem;
        myMapUser = mapElem;

	let script = document.createElement("script");
        script.src = "/js/avatars.js";
        document.body.appendChild(script);

        if (window.location.search != "?admin") {
            socket.emit("setRoom", { room: subdomain });
        } else {
            console.log("admin true");
            socket.emit("setRoom", { room: subdomain, admin: true});
        }

        if (window.location.search.includes("username")) { //&& window.location.search.includes("terms=true")) {
            console.log("Auto-joining");
            closePopUp();
        }

        //joinUser();

    } else {
       console.log("reload: NEW ID RECIVED!!!!!");
        // window.location.reload();
    }
})

socket.on("newUser", function(data) {
    //console.log("Creating new user");
    let elem = document.createElement("div");
    elem.id = "user" + data.id;
    elem.className = "user";
    if (data.muted) {
        elem.classList.add("muted");
    }
    let hitboxElem = document.createElement("div");
    hitboxElem.className = "hitbox";

    let nameElem = document.createElement("div");
    nameElem.className = "name";
    nameElem.textContent = data.name;

    hitboxElem.appendChild(nameElem);
    elem.appendChild(hitboxElem);

    let gradient = "linear-gradient(" + data.angle * 45 + "deg, hsl(" + data.hue + ",100%," + data.bright + "%) 49%, hsl(" + data.hue2 + ",100%," + data.bright2 + "%) 50%)";
    elem.style.background = gradient;
    elem.style.left = "0px";
    elem.style.top = "0px"
    document.body.querySelector(".avatarContainer").appendChild(elem);

    let mapElem = document.createElement("div");
    mapElem.id = "mapUser" + data.id;
    mapElem.className = "mapUser";
    document.body.querySelector(".map").appendChild(mapElem);

    //console.log("New user admin status: " + data.admin)
    if (data.admin) {
        elem.classList.add("adminUser");
        mapElem.classList.add("adminMapUser");
    }

    let user = {
        name: data.id,
        element: elem,
        room: subdomain
    }
    users.push(user);
});

socket.on("existingUser", function(data) {
    //console.log("Creating existing user " + data.id);
    let elem = document.createElement("div");
    elem.id = "user" + data.id;
    elem.className = "user";
    if (data.muted) {
        elem.classList.add("muted");
    }
    let gradient = "linear-gradient(" + data.angle * 45 + "deg, hsl(" + data.hue + ",100%," + data.bright + "%) 49%, hsl(" + data.hue2 + ",100%," + data.bright2 + "%) 50%)";
    elem.style.background = gradient;
    elem.innerHTML = "<div class='hitbox'><div class='name'>" + data.name + "</div></div>"
    document.body.querySelector(".avatarContainer").appendChild(elem);

    let mapElem = document.createElement("div");
    mapElem.id = "mapUser" + data.id;
    mapElem.className = "mapUser";
    document.body.querySelector(".map").appendChild(mapElem);

    //console.log("Existing user admin status: " + data.admin)
    if (data.admin) {
        elem.classList.add("adminUser");
        mapElem.classList.add("adminMapUser");
    }

    if (data.presenterId) {
        elem.classList.add("admin" + data.presenterId);
    }
    //console.log('existing user, id and config', data.id, config)
    let user = {
        name: data.id,
        element: elem,
        room: subdomain,
        pc: new RTCPeerConnection(config)
    }
    user.dc = user.pc.createDataChannel("chat", {negotiated: true, id: 0});
    user.dc.onmessage = function(message) {
        //console.log("existingUser, onmessage", message, user.name);
        dataChannelMessage(message.data, user.name);
    }
//    user.pc.oniceconnectionstatechange = e => console.log(user.pc.iceConnectionState);
    user.pc.oniceconnectionstatechange = handleIceConnectionStateChange;
//    user.pc.oniceconnectionstatechange = sendInitialUpdate(user.dc);
//    user.pc.onaddstream = handleRemoteStreamAdded;
//    user.pc.onremovestream = handleRemoteStreamRemoved;
    window.setTimeout(function() {
        createOffer(user.pc, user.name);
    }, 50);


    users.push(user);
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

socket.on("unmute", function(socketId) {
    //console.log(socketId + " has unmuted!");
    let user = document.querySelector("#user" + socketId);
    if (user) {
        document.querySelector("#user" + socketId).classList.remove("muted");

        window.setTimeout(function() {
            if (socketId == id) {
                muted = false;
                //console.log("I have unmuted");
            }
        }, 100);
    }

});

socket.on("disconnectedUser", function(socketId) {
    if (inShow) {
        //console.log("#### Removing disconnected user " + socketId);

        let index = users.map(e => e.name).indexOf(socketId);
        if (index >= 0) {
            users.splice(index,1);
        } else {
            console.error("Server send message to remove user " + socketId + " but this user does not exist locally!");
        }

        let elem = document.querySelector("#user" + socketId);
        if (elem) {
            elem.remove();
        }

        let mapElem = document.querySelector("#mapUser" + socketId);
        if (mapElem) {
            mapElem.remove();
        }
    }
});


async function createOffer(pc, socketId) {
    //console.log("Creating new offer for user " + socketId);
    await pc.setLocalDescription(await pc.createOffer());
    pc.onicecandidate = ({candidate}) => {
        if (candidate) return;
        socket.emit("offer", socketId, pc.localDescription.sdp);
    }
}

socket.on("offer", function(offer, socketId) {
    //console.log("New offer from " + socketId);
//    console.log(offer);

    let user = users.filter(obj => {
        return obj.name === socketId
    });
    user[0].pc = new RTCPeerConnection(config);
    user[0].pc.oniceconnectionstatechange = handleIceConnectionStateChange;
    user[0].pc.setRemoteDescription({type: "offer", sdp: offer});
//    user[0].pc.onaddstream = handleRemoteStreamAdded;
//    user[0].pc.onremovestream = handleRemoteStreamRemoved;
    createAswer(offer, socketId, user[0]);
});

async function createAswer(offer, socketId, user) {
   //console.log("CreateAnswer, User:");
   //console.log(user.pc);
    await user.pc.setLocalDescription(await user.pc.createAnswer());
    user.dc = user.pc.createDataChannel("chat", {negotiated: true, id: 0});
    user.dc.onmessage = function(message) {
        dataChannelMessage(message.data, user.name);
    }
    user.pc.onicecandidate = ({candidate}) => {
        if (candidate) return;
       //console.log("Generated answer for " + socketId);
       //console.log(user.pc.localDescription.sdp);
        socket.emit("answer", socketId, user.pc.localDescription.sdp);
        console.log("Signaling done, ready to chat!");
    }
}

socket.on("answer", function(answer, socketId) {

    let user = users.filter(obj => {
        return obj.name === socketId
    });
    if (user[0].pc) {
        user[0].pc.setRemoteDescription({type: "answer", sdp: answer});
    }
});

function dataChannelMessage(message, socketId) {
    message = JSON.parse(message);
    if (message.type == "update") {
        //console.log("dataChannelMessage, update");
        updatePosition(message, socketId);
    } else if (message.type == "setRoom") {
        setRoom(message.roomName, socketId);
    } else if (message.type == "offer") {
        createDataChannelAnswer(message, socketId);
    } else if (message.type == "answer") {
        setDataChannelAnswer(message, socketId);
    } else {
        alert("Message from " + socketId + ": " + message);
    }
}

function handleIceConnectionStateChange() {
    //console.log("IceConnectionState has changed, state is now: " + this.iceConnectionState);
    let pc = this
    if (pc.iceConnectionState == "connected") {
        window.setTimeout(function() {
            sendInitialUpdate(pc);
        }, 500)
    }

}

function sendInitialUpdate(pc) {
    //console.log("A datachannel has been opened!");
    //console.log("iceConnectionState is " + pc.iceConnectionState)
    //console.log(pc);
    let index = users.map(e => e.pc).indexOf(pc);
    let targetSdp = pc.currentLocalDescription.sdp;

    if (index >= 0) {
        window.setTimeout(function() {
            //console.log("DataChannel status is: " + users[index].dc.readyState);

            if (users[index].dc.readyState == "open") {
                //console.log("Sending update to " + users[index].name);
                let message = {
                    type: "update",
                    id: id,
                    x: currentX,
                    y: currentY
                }
                users[index].dc.send(JSON.stringify(message));
                message = {
                    type: "setRoom",
                    roomName: currentRoom
                }
                users[index].dc.send(JSON.stringify(message));
            }
        }, 50);
    } else {
        //console.log("didnt fint user that matches this dataChannel yet, trying again with the fallback option...");
        // fallback for oler safari version
        let index = -1;
        for (let i=0; i<users.length; i++) {
            if (users[i].pc && users[i].pc.connectionState != "closed" && users[i].pc.currentLocalDescription && users[i].pc.currentLocalDescription.sdp == targetSdp) {
                index = i;
                break;
            }
        }
        if (index >= 0) {
            window.setTimeout(function() {
                //console.log("DataChannel status is: " + users[index].dc.readyState);

                if (users[index].dc.readyState == "open") {
                    //console.log("Sending update to " + users[index].name);
                    let message = {
                        type: "update",
                        id: id,
                        x: currentX,
                        y: currentY
                    }
                    users[index].dc.send(JSON.stringify(message));
                    message = {
                        type: "setRoom",
                        roomName: currentRoom
                    }
                    users[index].dc.send(JSON.stringify(message));
                }
            }, 50);
        } else {
            console.error("ERROR: Cant find user that matches this dataChannel");
        }
    }
}




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




socket.on("setupStreaming", setupStreaming);