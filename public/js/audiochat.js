let rooms = [];
let currentRoom = "none";
let adminGUI;
let openRoomGUI;
let passOk = false;
let pass;
let joinThreshhold = 125;
let createThreshhold = 50;
let roomWaitCounter = 0;

let localStream;

let constraints = {
    audio: true,
    video: false
};


if (!disableAudio && !window.location.search.includes("preview")) {
    try {
        navigator.mediaDevices.getUserMedia(constraints)
        .then(function(stream) {
            localStream = stream;
            console.log("Loaded local stream");
            muted = false;
            socket.emit("unmute");
            window.setTimeout(function() {
                if (myUser) {
                    myUser.classList.remove("muted");
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


socket.on("setupStreaming", setupStreaming);
socket.on("roomFull", function() {
    let fullWindow = document.createElement("div");
    fullWindow.className = "fade fullWindow";
    fullWindow.innerHTML = "<div class='fullWindow'><p>The show you are trying to enter is too busy.<br>Please try again in a few minutes.</p></div>"
    document.body.appendChild(fullWindow);
});

socket.on("stopAudio", function() {
    if (!disableAudio) {
        console.log("Disabling audio...")
        disableAudio = true;
        sendRoom("none");
        let muteGui = document.createElement("div");
        muteGui.className = "GUI muteGUI";
        muteGui.innerHTML = "The special event has ended, all audio connections have been closed."
        document.body.querySelector(".GUIcontainer").appendChild(muteGui);
        window.setTimeout(function() {
            muteGui.style.opacity = 0;
            window.setTimeout(function() {
                muteGui.remove();
            }, 200);
        }, 10000);
        for (let i=0; i<users.length; i++) {
            if (users[i].pcM) {
                users[i].pcM.close();
                console.log("Closed pcM to user " + users[i].name);
                console.log(users[i].element.querySelector("audio"));
                users[i].element.querySelector("audio").remove();
            }
        }
    }
});


function setupStreaming() {
    console.log("setupStreaming called!");

    // only alow popUp to close after server added user to subdomain
    document.querySelector(".popUp .enterButton").classList.remove("disabled");

    let form = document.querySelector(".popUp form");
    form.addEventListener('submit', closePopUp);
}



function updateRooms() {

    // empty all rooms before looping over all users to fill them again
    for (let i=0; i<rooms.length; i++) {
        rooms[i].users = 0;
        rooms[i].x = 0;
        rooms[i].y = 0;

        if (rooms[i].name == currentRoom) {
            rooms[i].users = 1;
            rooms[i].x = currentX;
            rooms[i].y = currentY;
        }

        if (rooms[i].counter < 10) {
            rooms[i].counter++;
        }
    }
    if (roomWaitCounter < 20) {
        roomWaitCounter++;
    }

    // loop over all users on page and check if they are in a room
    for (let i=0; i<users.length; i++) {
        if (users[i].room != "none" && !users[i].room.includes("AdminRoom")) {
            let index = rooms.map(e => e.name).indexOf(users[i].room);

            // if they are in a room that is already tracked, update room position and user count
            if (index >= 0) {
                rooms[index].users++;
                rooms[index].x += parseInt(users[i].element.style.left.substr(0, users[i].element.style.left.length - 2));
                rooms[index].y += parseInt(users[i].element.style.top.substr(0, users[i].element.style.top.length - 2));

            // if they are in a room that is not yet tracked, create the room in the rooms array
            } else {
                let color = "rgba(0,0,0,0.2)";
                let elem = document.createElement("div");
                elem.className = "room"
                elem.id = "room" + users[i].room;
                if (elem.id.includes("AdminRoom")) {
                    elem.classList.add("adminRoom");
                }
                if (elem.id.includes("OpenAdmin")) {
                    elem.classList.add("openAdminRoom");
                    color = "rgba(255,255,255,0.2)";
                }
                if (elem.id.includes("static_")) {
                    color = "rgba(0,0,0,0)";
                }
                document.body.appendChild(elem);

                let room = {
                    name: users[i].room,
                    x: parseInt(users[i].element.style.left.substr(0, users[i].element.style.left.length - 2)),
                    y: parseInt(users[i].element.style.top.substr(0, users[i].element.style.top.length - 2)),
                    element: elem,
                    counter: 0,
                    users: 1
                }
                elem.style.left = room.x + "px";
                elem.style.left = room.y + "px";
                rooms.push(room);

//                console.log("Creating room " + room.name + " at " + room.x, room.y);

                window.setTimeout(function() {
                    elem.style.width = "250px";
                    elem.style.height = "250px";
                    elem.style.marginLeft = "-125px";
                    elem.style.marginTop = "-125px";
                    elem.style.backgroundColor = color;
                }, 50);
            }
        }
    }

    // setup variables for finding the closest room
    let shortestDist = 99999;
    let closestRoom;
    let closestUser;


    // loop over all rooms to remove empty ones and find the closest one to join
    for (let i=0; i<rooms.length; i++) {
        if (rooms[i].users >= 2) {
            rooms[i].counter = 10;
        }
        if (rooms[i].users <= 1 && rooms[i].counter >= 10 && !rooms[i].name.includes("OpenAdmin") || rooms[i].users <= 0 && rooms[i].counter >= 10 || rooms[i].users <= 1 && currentRoom.includes("OpenAdmin") && rooms[i].name.includes("OpenAdmin")) {

            // if empty, remove the room from the array and the room element from the page
            rooms[i].element.style.width = "400px";
            rooms[i].element.style.height = "400px";
            rooms[i].element.style.marginLeft = "-200px";
            rooms[i].element.style.marginTop = "-200px";
            rooms[i].element.style.background = "rgba(0,0,0,0)";
            let name = rooms[i].name;
            window.setTimeout(function() {
                if (rooms[i].element) {
                    rooms[i].element.remove();
                }
                if (rooms[i].name == name) {
                    rooms.splice(i,1);
                }
            }, 180);

        } else {

            rooms[i].x = rooms[i].x / rooms[i].users;
            rooms[i].y = rooms[i].y / rooms[i].users;

            rooms[i].element.style.left = rooms[i].x + "px";
            rooms[i].element.style.top = rooms[i].y + "px";

            // if the room is still active, check if its the closest to the user
            let dist = Math.sqrt( (rooms[i].x - currentX) * (rooms[i].x - currentX) + (rooms[i].y - currentY) * (rooms[i].y - currentY) );

            if (dist < joinThreshhold && dist < shortestDist) {
                closestRoom = rooms[i];
                shortestDist = dist;
            }

        }
    }

    let roomIndex = rooms.map(e => e.name).indexOf(currentRoom);

    // if there was a room in range, join it
    if (shortestDist < 99999 && currentRoom == "none" && !muted && !disableAudio) {
//        console.log("Closest room in range is: " + closestRoom.name);
        sendRoom(closestRoom.name);

    // if no room was in range, leave the current room
    } else if (shortestDist == 99999 && currentRoom != "none" && !disableAudio && rooms[roomIndex] && rooms[roomIndex].counter >= 10 && !currentRoom.includes("static_") || currentRoom != "none" && !rooms[roomIndex] && !currentRoom.includes("static_") && roomWaitCounter >= 20) {
        sendRoom("none");
        console.log("joined room none");
        console.log("roomWaitCounter was " + roomWaitCounter);

        for (let i=0; i<users.length; i++) {
            console.log("checking if user " + users[i].name + " has a pcM");
            if (users[i].pcM) {
                console.log("user " + users[i].name + " has a pcM!");
                users[i].pcM.close();
                console.log("Closed pcM to user " + users[i].name);
                console.log(users[i].element.querySelector(".remoteAudio"));
                if (users[i].element.querySelector(".remoteAudio")) {
                    users[i].element.querySelector(".remoteAudio").remove();
                    console.log("removed audio element");
                }
            }
        }
    } else if (currentRoom == "none" && !disableAudio && !muted) {
//        console.log("No rooms found in range, looking for people");
        for (let i=0; i<users.length; i++) {
            let otherX = parseInt(users[i].element.style.left.substr(0, users[i].element.style.left.length - 2));
            let otherY = parseInt(users[i].element.style.top.substr(0, users[i].element.style.top.length - 2));

            let dist = Math.sqrt( (otherX - currentX) * (otherX - currentX) + (otherY - currentY) * (otherY - currentY) );

            if (dist < createThreshhold && dist < shortestDist && !users[i].element.classList.contains("muted") && !muted && users[i].dc && users[i].dc.readyState == "open" && users[i].room == "none") {
                console.log("found user in range: " + users[i]);
                closestUser = users[i];
                shortestDist = dist;
            }
        }

        // if another user was in range, create a room together
        if (shortestDist < 99999) {

            if (id > closestUser.name) {
                console.log(closestUser.name + " is not yet in a room, my ID (" + id + ") is higher then other users (" + closestUser.name + ") so I will create a new room...");

                socket.emit("newRoomName");

                // start signaling for media stream

            } else {
//                console.log("No room yet, but my ID (" + id + ") is lower then other users (" + closestUser.name + "), will wait for them to make the room");
            }
        }
    }
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
        window.setTimeout(function() {
            for (let i=0; i<othersInRom.length; i++) {

                console.log("Creating offer for user " + othersInRom[i].name);
        //        console.log(othersInRom[i]);

                console.log("#### FOUND OTHER USERS IN ROOM TO TALK TO");
                othersInRom[i].pcM = new RTCPeerConnection(config);
                window.setTimeout(function() {
                    othersInRom[i].pcM.onaddstream = handleRemoteStreamAdded;
                    othersInRom[i].pcM.onremovestream = handleRemoteStreamRemoved;
                    othersInRom[i].pcM.addStream(localStream);
                    createDataChannelOffer(othersInRom[i].pcM, othersInRom[i]);
                }, 50);
            }
        }, 50);
    }
}


function setRoom(roomName, socketId) {
    console.log("User " + socketId + " has joined room " + roomName);
    let index = users.map(e => e.name).indexOf(socketId);

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
            player.srcObject = event.stream;
            player.classList.add("remoteAudio");
            player.autoplay = true;
            player.id = "player" + users[index].name;
            users[index].element.appendChild(player);
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
                player.srcObject = event.stream;
                player.classList.add("remoteAudio");
                player.autoplay = true;
                player.id = "player" + users[index].name;
                users[index].element.appendChild(player);
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
