let mouseX = 0;
let mouseY = 0;
let currentX = 0;
let currentY = 0;
let lastX = 0;
let lastY = 0;

let inShow = false;

let mobile = false;

let userGUI = document.createElement("div");
userGUI = document.createElement("div");
userGUI.innerHTML = "";
userGUI.className = "GUI disconectGUI inactive";
userGUI.style.zIndex = 999;
document.body.querySelector(".GUIcontainer").appendChild(userGUI);

let map = document.querySelector(".map")

// time (in seconds) before hiding map
let mapTimeout = 5 // = 5 seconds

// time (in seconds) before warning a user to move
let warnTimeout = 300 // = 5 minutes

// time (in seconds) before disconnecting an inactive user
let disconnectTimeout = 420 // = 7 minutes

let lastUpdate = Math.floor(Date.now() / 1000);

document.onmousemove = function(e) {
    if (!mobile) {
        mouseX = e.clientX;
        mouseY = e.clientY;
        currentX = window.scrollX + mouseX;
        currentY = window.scrollY + mouseY;
    }
    if (inShow) {
        map.classList.remove("hidden");        
    }
//    myUser.style.left = currentX + "px";
//    myUser.style.top = currentY + "px";
//    myMapUser.style.left = (currentX/mapscale) + "px";
//    myMapUser.style.top = (currentY/mapscale) + "px";
}

document.body.addEventListener("touchstart", setMobile);

function setMobile() {
    console.log("Mobile browser");
    mobile = true;
    currentX = window.scrollX + window.innerWidth / 2;
    currentY = window.scrollY + window.innerHeight / 2;
    document.body.removeEventListener("touchstart", setMobile);
}

document.body.onscroll = function() {
    if (!mobile) {
        currentX = window.scrollX + mouseX;
        currentY = window.scrollY + mouseY;
    } else {
        currentX = window.scrollX + window.innerWidth / 2;
        currentY = window.scrollY + window.innerHeight / 2;
    }
//    myUser.style.left = currentX + "px";
//    myUser.style.top = currentY + "px";
//    myMapUser.style.left = (currentX/mapscale) + "px";
//    myMapUser.style.top = (currentY/mapscale) + "px";
}

window.setInterval(function() {
    if (currentX != lastX || currentY != lastY) {
//        console.log("Updating position to " + currentX, currentY);
        lastX = currentX;
        lastY = currentY;

        for (let i=0; i<users.length; i++) {
            if (users[i].dc && users[i].dc.readyState == "open") {
                let message = {
                    type: "update",
                    id: id,
                    x: currentX,
                    y: currentY
                }
//                console.log("Sending update to " + users[i].id);
                users[i].dc.send(JSON.stringify(message));
            }
        }
        lastUpdate = Math.floor(Date.now() / 1000);
//        myUser.style.left = currentX + "px";
//        myUser.style.top = currentY + "px";
        myMapUser.style.left = (currentX/mapscale) + "px";
        myMapUser.style.top = (currentY/mapscale) + "px";
    } else if (lastUpdate <= Math.floor(Date.now() / 1000) - mapTimeout && inShow) {
        map.classList.add("hidden");
    }


    updateRooms();
}, 200);

window.setInterval(function() {
    myUser.style.left = currentX + "px";
    myUser.style.top = currentY + "px";
}, 50);

function updatePosition(message) {
//    console.log("Recieved update message:");
//    console.log(message);
    try {
        document.querySelector("#user" + message.id).style.left = message.x + "px";
        document.querySelector("#user" + message.id).style.top = message.y + "px";
        document.querySelector("#user" + message.id).style.opacity = 1;

        document.querySelector("#mapUser" + message.id).style.left = (message.x/mapscale) + "px";
        document.querySelector("#mapUser" + message.id).style.top = (message.y/mapscale) + "px";
        document.querySelector("#mapUser" + message.id).style.opacity = 1;
    }
    catch(err) {
        console.log(err);
    }
}

// disconect non admin users after long time of inactivity
if (window.location.search != "?admin") {
    window.setInterval(function() {
    //    console.log("last update was at " + lastUpdate + " it is now " + Math.floor(Date.now() / 1000))
        if (lastUpdate <= Math.floor(Date.now() / 1000) - warnTimeout && lastUpdate > Math.floor(Date.now() / 1000) - disconnectTimeout && inShow) {
            if (document.querySelector(".disconectGUI").classList.contains("inactive")) {
                document.querySelector(".alert").play();
            }
            document.querySelector(".disconectGUI").classList.remove("inactive")
            document.querySelector(".disconectGUI").innerHTML = "Are you still there? Move your avatar to keep from getting disconnected";
            console.log("Warning, keep moving or be disconnected!");

        } else if (lastUpdate <= Math.floor(Date.now() / 1000) - disconnectTimeout && inShow) {
            document.querySelector(".disconectGUI").style.opacity = 1;
            document.querySelector(".disconectGUI").innerHTML = "Disconnecting...";
            console.log("Timeout, disconnect user!");
            window.location.reload();
        } else {
            document.querySelector(".disconectGUI").classList.add("inactive");
        }
    }, 5000);
}
socket.on("reload", function() {
    console.log("Server restarted, reloading page...");
    window.location.reload();
})

function move() {
    window.setInterval(function() {
        currentX = parseInt(Math.random() * 400);
        currentY = parseInt(Math.random() * 400);
    }, 200);
}
