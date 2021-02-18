let users = [];

let muted = true;

// const parts = location.hostname.split('.');
// let subdomain = parts.shift();

console.log("dataSignalling.js, subdomainAlias", subdomainAlias);

if (typeof subdomainAlias !== 'undefined') {
    subdomain = subdomainAlias;
}

// replace with correct hostname
// const socket = io(subdomain + '.localhost:8887');


let id;
let color;
let config = {
//
//    Add STUN or TURN servers here if needed
//    
//    iceServers: [
//        {
//            'urls': 'stun:host.name'
//        },
//        {
//            'urls': 'turn:host.name',
//            'username': 'username',
//            'credential': 'password'
//        }
//    ]
}
let myUser;
let myMapUser;

function joinUser() {
    // automatically running the functions that would be run on  close of pop up
    const username = "netrunner" + Math.floor((Math.random()*420666));
    socket.emit("setUsername", username);
    unMuteYouTube();
                
    inShow = true;
    document.querySelector(".map").classList.remove("hidden");
    socket.emit("countVisitor");
}

socket.on("setId", function(data) {
    console.log("dataSignalling, setId, data", data);
    reqTime = data.reqTime;
    localReqTime = new Date().getTime();
    if (!id) {
        id = data.id;
        let gradient = "linear-gradient(" + data.angle * 45 + "deg, hsl(" + data.hue + ",100%," + data.bright + "%) 49%, hsl(" + data.hue2 + ",100%," + data.bright2 + "%) 50%)";
        console.log("Id and collor have been assigned by server: " + id, gradient);
        let elem = document.createElement("div");
        elem.id = "user" + id;
        console.log(data.angle);
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

        console.log("elem for myUser", elem);
        console.log("elem for myMapUser", mapElem);

        myUser = elem;
        myMapUser = mapElem;


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

        // joinUser();

    } else {
//        console.log(" ");
//        console.log(" ");
//        console.log("NEW ID RECIVED!!!");
//        console.log(" ");
//        console.log(" ");
//        console.log(" ");
//        console.log(" ");
//        console.log(" ");
//        console.log(" ");
//        console.log(" ");
//        console.log(" ");
//        console.log(" ");
//        console.log(" ");
//        console.log(" ");
       console.log("reload: NEW ID RECIVED!!!!!");
        // window.location.reload();
    }
})

socket.on("newUser", function(data) {
    console.log("Creating new user");
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

    console.log("New user admin status: " + data.admin)
    if (data.admin) {
        elem.classList.add("adminUser");
        mapElem.classList.add("adminMapUser");
    }

    let user = {
        name: data.id,
        element: elem,
        room: "none"
    }
    users.push(user);
});

socket.on("existingUser", function(data) {
    console.log("Creating existing user " + data.id);
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

    console.log("Existing user admin status: " + data.admin)
    if (data.admin) {
        elem.classList.add("adminUser");
        mapElem.classList.add("adminMapUser");
    }

    if (data.presenterId) {
        elem.classList.add("admin" + data.presenterId);
    }

    let user = {
        name: data.id,
        element: elem,
        room: "none",
        pc: new RTCPeerConnection(config)
    }
    user.dc = user.pc.createDataChannel("chat", {negotiated: true, id: 0});
    user.dc.onmessage = function(message) {
        console.log("existingUser, onmessage", message, user.name);
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

socket.on("disconnectedUser", function(socketId) {
    if (inShow) {
        console.log("#### Removing disconnected user " + socketId);

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
    console.log("Creating new offer for user " + socketId);
    await pc.setLocalDescription(await pc.createOffer());
    pc.onicecandidate = ({candidate}) => {
        if (candidate) return;
        socket.emit("offer", socketId, pc.localDescription.sdp);
    }
}

socket.on("offer", function(offer, socketId) {
    console.log("New offer from " + socketId);
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
//    console.log("User:");
//    console.log(user.pc);
    await user.pc.setLocalDescription(await user.pc.createAnswer());
    user.dc = user.pc.createDataChannel("chat", {negotiated: true, id: 0});
    user.dc.onmessage = function(message) {
        dataChannelMessage(message.data, user.name);
    }
    user.pc.onicecandidate = ({candidate}) => {
        if (candidate) return;
//        console.log("Generated answer for " + socketId);
//        console.log(user.pc.localDescription.sdp);
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
        console.log("dataChannelMessage, update");
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
    console.log("IceConnectionState has changed, state is now: " + this.iceConnectionState);
    let pc = this
    if (pc.iceConnectionState == "connected") {
        window.setTimeout(function() {
            sendInitialUpdate(pc);
        }, 500)
    }

}

function sendInitialUpdate(pc) {
    console.log("A datachannel has been opened!");
    console.log("iceConnectionState is " + pc.iceConnectionState)
    console.log(pc);
    let index = users.map(e => e.pc).indexOf(pc);
    let targetSdp = pc.currentLocalDescription.sdp;

    if (index >= 0) {
        window.setTimeout(function() {
            console.log("DataChannel status is: " + users[index].dc.readyState);

            if (users[index].dc.readyState == "open") {
                console.log("Sending update to " + users[index].name);
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
        console.log("didnt fint user that matches this dataChannel yet, trying again with the fallback option...");
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
                console.log("DataChannel status is: " + users[index].dc.readyState);

                if (users[index].dc.readyState == "open") {
                    console.log("Sending update to " + users[index].name);
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
