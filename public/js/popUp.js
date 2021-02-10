let form = document.querySelector(".popUp form");
form.addEventListener('submit', function(e) {
    e.preventDefault();
});
let username;

if (window.location.search.includes("username")) {
    const urlParams = new URLSearchParams(window.location.search);
    document.body.querySelector(".popUp .username").value = urlParams.get("username");
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
    socket.emit("setUsername", document.body.querySelector(".popUp .username").value);
    username = document.body.querySelector(".popUp .username").value;
    checkSlideshows();
    setupChatboxes();
    unMuteYouTube();
    let puzzles = document.querySelectorAll("article.puzzle");
    let quizzes = document.querySelectorAll("article.quiz");
    window.setTimeout(function() {
        for (let i=0; i<puzzles.length; i++) {
            setupPuzzle(puzzles[i].id);
        }
        for (let i=0; i<quizzes.length; i++) {
            setupQuiz(quizzes[i].id);
        }
    },100)

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