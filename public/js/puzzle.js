let holding;

function setupPuzzle(puzzleId) {
    window.setTimeout(function() {
        let elem = document.getElementById(puzzleId);

//        console.log(elem.dataset.segmentsx);
        socket.emit("getPuzzle", subdomain + "-" + puzzleId, {width: elem.clientWidth, height: elem.clientHeight, left: elem.offsetLeft, top: elem.offsetTop, segmentsX: elem.dataset.segmentsx, segmentsY: elem.dataset.segmentsy});
    }, 100);
}

function resetPuzzle(puzzleId) {
    console.log(puzzleId);
    let elem = document.getElementById(puzzleId);
    console.log(elem);
    socket.emit("resetPuzzle", subdomain + "-" + puzzleId, {width: elem.clientWidth, height: elem.clientHeight, left: elem.offsetLeft, top: elem.offsetTop, segmentsX: elem.dataset.segmentsx, segmentsY: elem.dataset.segmentsy});
}

socket.on("setPuzzle", function(puzzle) {
    console.log("Got puzzle " + puzzle.name);
//    console.log(puzzle);
    let puzzleElem = document.getElementById(puzzle.name.split("-")[1]);
    puzzleElem.querySelector(".button").style.visibility = "hidden";
    puzzleElem.querySelector(".boundry").innerHTML = "";
//    console.log(puzzleElem);
    let elemAspect = puzzleElem.offsetWidth / puzzleElem.offsetHeight;

    const img = new Image();
    let css = puzzleElem.querySelector(".segment").style.backgroundImage;
    let url = css.substr(5,css.length-7);
    img.src = url;
//    console.log(img.src);
    img.onload = function() {

        for (let i=0; i<puzzle.segments.length; i++) {
            if (!puzzle.segments[i].placed) {
                let pice = puzzle.pices[i];
                let elem = document.createElement("div");
                elem.className = "pice";
                elem.id = "pice" + i;
                elem.style.backgroundImage = "url(" + puzzleElem.querySelector(".boundry").dataset.url + ")";
                elem.style.left = pice.x + "px";
                elem.style.top = pice.y + "px";
                elem.style.width = Math.round(puzzleElem.offsetWidth/puzzle.segmentsX) + "px";
                elem.style.height = Math.round(puzzleElem.offsetHeight/puzzle.segmentsY) + "px";
                puzzleElem.querySelector(".boundry").appendChild(elem);

                let diff = puzzleElem.offsetWidth/this.width;
//                console.log(diff)
                if (puzzleElem.offsetHeight > this.height*diff) {
//                    console.log("Frame for puzzle " + puzzle.name + " is taller then the src image");
                    elem.style.backgroundSize = "auto " + (elem.offsetHeight * puzzle.segmentsY) + "px";
                    let aspect = this.width/this.height;
                    let offset = Math.round((puzzleElem.offsetWidth - puzzleElem.offsetHeight*aspect)/2);
                    elem.style.backgroundPositionX = -pice.xId * elem.offsetWidth + offset + "px";
                    elem.style.backgroundPositionY = -pice.yId * elem.offsetHeight + "px";
                } else {
//                    console.log("Frame for puzzle " + puzzle.name + " is wider then the src image");
                    elem.style.backgroundSize = (elem.offsetWidth * puzzle.segmentsX) + "px";
                    let aspect = this.height/this.width;
                    let offset = Math.round((puzzleElem.offsetHeight - puzzleElem.offsetWidth*aspect)/2);
                    elem.style.backgroundPositionX = -pice.xId * elem.offsetWidth + "px";
                    elem.style.backgroundPositionY = -pice.yId * elem.offsetHeight + offset + "px";
                }

//                if (imgAspect > elemAspect) {
//                    elem.style.backgroundSize = "auto " + (elem.offsetHeight * puzzle.segmentsY) + "px";
//                    console.log("Puzzle is " + puzzleElem.offsetWidth + "px x " + puzzleElem.offsetHeight + " should be " + puzzleElem.offsetHeight/imgAspect + " x " + puzzleElem.offsetHeight);
//                    let offset = Math.round((puzzleElem.offsetWidth/imgAspect - puzzleElem.offsetWidth)/2);
//                    elem.style.backgroundPositionX = -pice.xId * elem.offsetWidth + offset + "px";
//                    elem.style.backgroundPositionY = -pice.yId * elem.offsetHeight + "px";
//                } else {
//                    elem.style.backgroundSize = (elem.offsetWidth * puzzle.segmentsX) + "px";
//                    console.log("Puzzle is " + puzzleElem.offsetWidth + "px x " + puzzleElem.offsetHeight + " should be " + puzzleElem.offsetWidth + " x " + puzzleElem.offsetWidth/imgAspect);
//                    let offset = Math.round((puzzleElem.offsetWidth/imgAspect - puzzleElem.offsetHeight)/2);
//                    console.log(offset);
//                    elem.style.backgroundPositionX = -pice.xId * elem.offsetWidth + "px";
//                    elem.style.backgroundPositionY = -pice.yId * elem.offsetHeight - offset + "px";
//                }

                if (pice.yId == 0) {
                    elem.style.borderTopWidth = elem.parentElement.parentElement.style.borderWidth;
                }
                if (pice.yId == puzzle.segmentsY-1) {
                    elem.style.borderBottomWidth = elem.parentElement.parentElement.style.borderWidth;
                }
                if (pice.xId == 0) {
                    elem.style.borderLeftWidth = elem.parentElement.parentElement.style.borderWidth;
                }
                if (pice.xId == puzzle.segmentsX-1) {
                    elem.style.borderRightWidth = elem.parentElement.parentElement.style.borderWidth;
                }
            }
            let segment = puzzleElem.querySelector("#segment" + i);
            let diff = puzzleElem.offsetWidth/this.width;
            if (puzzleElem.offsetHeight > this.height*diff) {
                let aspect = this.width/this.height;
                let offset = Math.round((puzzleElem.offsetWidth - puzzleElem.offsetHeight*aspect)/2);
                segment.style.backgroundSize = "auto " + (segment.offsetHeight * puzzle.segmentsY) + "px";
                segment.style.backgroundPositionX = -puzzle.segments[i].xId * segment.offsetWidth + offset + "px";
                segment.style.backgroundPositionY = -puzzle.segments[i].yId * segment.offsetHeight + "px";
            } else {
                let aspect = this.height/this.width;
                let offset = Math.round((puzzleElem.offsetHeight - puzzleElem.offsetWidth*aspect)/2);
                segment.style.backgroundSize = (segment.offsetWidth * puzzle.segmentsX) + "px";
                segment.style.backgroundPositionX = -puzzle.segments[i].xId * segment.offsetWidth + "px";
                segment.style.backgroundPositionY = -puzzle.segments[i].yId * segment.offsetHeight + offset + "px";
            }
//            if (imgAspect > elemAspect) {
//                segment.style.backgroundSize = "auto " + (segment.offsetHeight * puzzle.segmentsY) + "px";
//                let offset = Math.round((puzzleElem.offsetWidth/imgAspect - puzzleElem.offsetWidth)/2);
//                segment.style.backgroundPositionX = -puzzle.segments[i].xId * segment.offsetWidth + offset + "px";
//                segment.style.backgroundPositionY = -puzzle.segments[i].yId * segment.offsetHeight + "px";
//            } else {
//                segment.style.backgroundSize = (segment.offsetWidth * puzzle.segmentsX) + "px";
//                let offset = Math.round((puzzleElem.offsetWidth/imgAspect - puzzleElem.offsetHeight)/2);
//                segment.style.backgroundPositionX = -puzzle.segments[i].xId * segment.offsetWidth + "px";
//                segment.style.backgroundPositionY = -puzzle.segments[i].yId * segment.offsetHeight - offset + "px";
//            }
            if (puzzle.segments[i].placed) {
                segment.classList.add("visible");
            } else {
                segment.classList.remove("visible");
            }
        }
//        puzzleElem.addEventListener("click", clickPice);
        puzzleElem.querySelector(".boundry").addEventListener("click", clickPice);
        puzzleElem.querySelector(".frame").addEventListener("click", clickPice);


        let segments = puzzleElem.querySelectorAll(".segment");
        for (let i=0; i<segments.length; i++) {
            if (!segments[i].classList.contains("visible")) {
//                console.log("visible")
                return false;
            }
        }
        console.log("All visible!");
        document.querySelector("#" + puzzle.name.split("-")[1] + " .button").style.visibility = "visible";

    }
});

function clickPice(event) {
    console.log(event.target.id);
    if (!myUser.dataset.holding || event.target.id != myUser.dataset.holding.split(" #")[1] && event.target.classList.contains("pice")) {
        let held = false;
        for (let i=0; i<users.length; i++) {
            if (users[i].element.dataset.holding && users[i].element.dataset.holding.split(" #")[1] == event.target.id) {
                held = true;
            }
        }
        if (!held) {
            console.log("picking up pice " + event.target.id + " of puzzle " + event.target.parentElement.parentElement.id);
            socket.emit("clickPice", event.target.id.substr(4), event.target.parentElement.parentElement.id);
        }
    } else if (!event.target.classList.contains("button")) {
        console.log(event.target);
        let elem = document.querySelector(myUser.dataset.holding);
        let segment;
        if (event.target.classList.contains("boundry") || event.target.classList.contains("frame")) {
            segment = document.querySelector("#" + event.target.parentElement.id + " #segment" + myUser.dataset.holding.split(" #")[1].substr(4));
        } else {
            segment = document.querySelector("#" + event.target.parentElement.parentElement.id + " #segment" + myUser.dataset.holding.split(" #")[1].substr(4));
        }
        let mousePuzzleX = currentX - document.querySelector(myUser.dataset.holding.split(" ")[0]).offsetLeft - elem.offsetWidth/2;
        let mousePuzzleY = currentY - document.querySelector(myUser.dataset.holding.split(" ")[0]).offsetTop - elem.offsetHeight/2;
        console.log(mousePuzzleX,mousePuzzleY,segment.offsetLeft,segment.offsetTop);

        let dist = Math.sqrt( (segment.offsetLeft - mousePuzzleX) * (segment.offsetLeft - mousePuzzleX) + (segment.offsetTop - mousePuzzleY) * (segment.offsetTop - mousePuzzleY) );
        console.log(dist);
        if (dist < elem.offsetWidth/2) {
            socket.emit("placePice", elem.id.substr(4), elem.parentElement.parentElement.id);
        } else {
            socket.emit("dropPice", elem.id.substr(4), elem.parentElement.parentElement.id, elem.offsetLeft, elem.offsetTop);
        }
    }
}

socket.on("pickupPice", function(puzzle,pice,user) {
    if (inShow) {
        puzzle = puzzle.split("-")[1];
        console.log("user " + user + " picked up pice " + pice + " of puzzle " + puzzle);
        document.getElementById("user" + user).dataset.holding = "#" + puzzle + " #pice" + pice;
    }
});

socket.on("dropPice", function(puzzle,pice,user,x,y) {
    if (inShow) {
        console.log("user " + user + " has dropped up pice " + pice + " of puzzle " + puzzle);
        puzzle = puzzle.split("-")[1];
        document.getElementById("user" + user).dataset.holding = "";
        document.querySelector("#" + puzzle + " #pice" + pice).style.left = x + "px";
        document.querySelector("#" + puzzle + " #pice" + pice).style.top = y + "px";
    }
});

socket.on("placePice", function(puzzle,pice,user) {
    if (inShow) {
        puzzle = puzzle.split("-")[1];
        console.log("user " + user + " has placed pice " + pice + " of puzzle " + puzzle);
        document.getElementById("user" + user).dataset.holding = "";
        document.querySelector("#" + puzzle + " #pice" + pice).remove();
        console.log("#" + puzzle + " #segment" + pice);
        document.querySelector("#" + puzzle + " #segment" + pice).classList.add("visible");

        let segments = document.querySelectorAll("#" + puzzle + " .segment");
        for (let i=0; i<segments.length; i++) {
            if (!segments[i].classList.contains("visible")) {
                console.log("visible")
                return false;
            }
        }
        console.log("All visible!");
        document.querySelector("#" + puzzle + " .button").style.visibility = "visible";
    }
});

window.setInterval(function() {
    for (let i=0; i<users.length; i++) {
        if (users[i].element.dataset.holding) {
            console.log("user " + users[i].element.id + " is holding " + users[i].element.dataset.holding);

            let puzzleX = document.querySelector(users[i].element.dataset.holding.split(" "[0])).offsetLeft;
            let puzzleY = document.querySelector(users[i].element.dataset.holding.split(" "[0])).offsetTop;

            document.querySelector(users[i].element.dataset.holding).style.left = users[i].element.style.left.split("px")[0] - puzzleX + 200 + "px";
            document.querySelector(users[i].element.dataset.holding).style.top = users[i].element.style.top.split("px")[0] - puzzleY + 200 + "px";
        }
    }
    if (myUser && myUser.dataset && myUser.dataset.holding) {
        let puzzle = document.querySelector(myUser.dataset.holding.split(" ")[0])
        let puzzleX = puzzle.offsetLeft;
        let puzzleY = puzzle.offsetTop;
        let xPos = currentX - puzzleX + 200;
        let yPos = currentY - puzzleY + 200;

        if (xPos < 0 || yPos < 0 || xPos > puzzle.offsetWidth + 400 || yPos > puzzle.offsetHeight + 400) {
            console.log(xPos < 0 || yPos < 0 || xPos > puzzle.offsetWidth || yPos > puzzle.offsetHeight)
            let holding = document.querySelector(myUser.dataset.holding);
            socket.emit("dropPice", holding.id.substr(4), holding.parentElement.parentElement.id, holding.offsetLeft, holding.offsetTop);
        } else {
            document.querySelector(myUser.dataset.holding).style.left = currentX - puzzleX + 200 + "px";
            document.querySelector(myUser.dataset.holding).style.top = currentY - puzzleY + 200 + "px";
        }
    }
}, 200);
