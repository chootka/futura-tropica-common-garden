let staticRooms = [];

window.setInterval(function() {
//    staticRooms = document.querySelectorAll("article .room");

    let inRoom = false;

    for (let i=0; i<staticRooms.length; i++) {
        let staticRoom = document.querySelector("#" + staticRooms[i] + " .room");

        if (inShow && myUser) {
            let roomX = staticRoom.parentElement.offsetLeft;
            let roomY = staticRoom.parentElement.offsetTop;
            let xPos = currentX - roomX;
            let yPos = currentY - roomY;

            if (xPos > staticRoom.offsetLeft && yPos > staticRoom.offsetTop && xPos < (staticRoom.offsetWidth + staticRoom.offsetLeft) && yPos < (staticRoom.offsetHeight + staticRoom.offsetTop)) {
                inRoom = true;
                if (currentRoom != "static_" + staticRooms[i] && window.location.search != "?admin" && !disableAudio && !currentRoom.includes("OpenAdmin")) {
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
                    for (let i=0; i<staticRooms.length; i++) {
                        document.querySelector("#" + staticRooms[i]).classList.remove("talking");
                    }
                    sendRoom("static_" + staticRooms[i]);
                }
            }
        }
    }

    if (!inRoom && currentRoom.includes("static_")) {
        sendRoom("none");
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
        for (let i=0; i<staticRooms.length; i++) {
            document.querySelector("#" + staticRooms[i]).classList.remove("talking");
        }
    }


    if (currentRoom.includes("static_")) {
        let roomElem = document.querySelector("#" + currentRoom.split("_")[1]);
        let othersInRoom = false;
        for (let i=0; i<users.length; i++) {
            if (users[i].room == currentRoom) {
                othersInRoom = true;
            }
        }

        if (othersInRoom) {
            roomElem.classList.add("talking");
        } else {
            roomElem.classList.remove("talking");
        }
    }
}, 200)
