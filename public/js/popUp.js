let form = document.querySelector(".popUp form");
form.addEventListener('submit', function(e) {
    e.preventDefault();
});

if (window.location.search.includes("username")) {
    const urlParams = new URLSearchParams(window.location.search);
    document.body.querySelector(".popUp .username").value = urlParams.get("username");
//    document.body.querySelector(".homeButton a").href = "/?username=" + urlParams.get("username");
}

if (window.location.search.includes("preview")) {
    document.querySelector(".fade").style.visibility = "hidden";
    document.querySelector(".popUp").style.visibility = "hidden";
    document.querySelector(".GUIcontainer").style.visibility = "hidden";
    document.querySelector(".map").style.visibility = "hidden";

    let hideUser = document.createElement("style");
    hideUser.innerHTML = ".myUser { visibility: hidden !important; }";
    hideUser.innerHTML += ".myMapUser { visibility: hidden !important; }";
    document.head.appendChild(hideUser);
}


function closePopUp(event) {
    if (event) {
        event.preventDefault();
    }
    
    if (document.querySelector(".popUp .enterButton").classList.contains("unloaded")) {
        console.log("Hey, dont enter yet!");
        return
    }
    
    document.body.querySelector(".popUp").style.display = "none";
    document.body.querySelector(".fade").style.background = "rgba(0,0,0,0)";
    window.setTimeout(function() {
        document.body.querySelector(".fade").style.display = "none";
    }, 400);
//    load();
    console.log("Close!");
    console.log("username is: " + document.body.querySelector(".popUp .username").value);

    // update username
    username = document.body.querySelector(".popUp .username").value;

    const homeButton = document.body.querySelector(".homeButton a");
    if (homeButton) homeButton.href = "/?username=" + username;
    socket.emit("setUsername", username);

    console.log("username", username);
    // checkSlideshows();
    // setupChatboxes();
    unMuteYouTube();

    if (typeof getPeers == 'function') { 
        getPeers();
    }

    inShow = true;
    document.querySelector(".map").classList.remove("hidden");
    socket.emit("countVisitor");
}

socket.on("passOk", function() {
    console.log("passOk");
    passOk = true;
    let elem = document.querySelector(".passWindow");
    elem.remove();
    if (window.location.search == "?recordTour") {
        recordTour();
    }
});

socket.on("passWrong", function() {
    console.log("passWrong");
    document.querySelector(".passWindowBox form input[type=password]").value = "";
});
