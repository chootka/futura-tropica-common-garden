function setupChatboxes() {
    let chatboxes = document.querySelectorAll(".chatbox");
    console.log(chatboxes, chatboxes.length);
    for (let i=0; i<chatboxes.length; i++) {
        socket.emit("getChats", chatboxes[i].dataset.name);
    }
}

function sendChat(event) {
    console.log("Event:");
    console.log(event);
    let chatbox = event.srcElement.parentElement;
    let message = event.srcElement.querySelector("input").value;
    if (message.length >0) {
        console.log("Send message '" + message + "' from box " + chatbox.dataset.name);
        socket.emit("sendChat", { chatbox: chatbox.dataset.name, message: message, username: username } );
        chatbox.querySelector("input").value = "";
    }
}

socket.on("newChat", function(data) {
//    console.log(data);
    let message = document.createElement("div");
    let username = data.username;
    if (username == "") {
        username = "Anonymus";
    }

    let avatarHeader = document.createElement("div");
    let gradient = "linear-gradient(" + data.angle * 45 + "deg, hsl(" + data.hue + ",100%," + data.bright + "%) 49%, hsl(" + data.hue2 + ",100%," + data.bright2 + "%) 50%)";
//    console.log(gradient);
    avatarHeader.style.background = gradient;
    avatarHeader.className = "avatarHeader";

    let userHeader = document.createElement("span");
//    userHeader.style.color = "hsl(" + data.hue + ",100%, 40%)";
    userHeader.className = "username";
    userHeader.textContent = username + ": ";

    let span = document.createElement("span");
    span.textContent = data.message;

    message.appendChild(avatarHeader);
    message.appendChild(userHeader);
    message.appendChild(span);


    message.className = "chatMessage";
    document.querySelector(".chatbox[data-name='" + data.chatbox + "'] .messageContainer").appendChild(message);
});
