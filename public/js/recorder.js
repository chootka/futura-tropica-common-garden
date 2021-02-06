let button;

if (window.location.search == "?recordTour") {
    button = document.createElement("div");
    button.className = "GUI buttonGUI recorderGUI";
    button.innerHTML = "Record new tour";
    button.addEventListener("click", function() {
        let passWindow = document.createElement("div");
        passWindow.className = "fade passWindow";
        passWindow.innerHTML = "<div class='passWindowBox'><p>Enter admin password:</p><form><input name='pass' type='password'><input name='cancel' type='button' value='Cancel' onclick='exitAdmin();'><input name='enter' type='submit' value='Enter'></form></div>"
        document.body.appendChild(passWindow);
        let pwForm = document.querySelector(".passWindowBox form");
        pwForm.addEventListener('submit', checkPass);
    });

    document.body.querySelector(".GUIcontainer").appendChild(button);
}

function recordTour() {
    button.remove();
    document.body.querySelector(".tourGUI").classList.add("inactive");
    let popup = document.createElement("div");
    popup.className = "tourInterface";
    popup.innerHTML = "This tool will allow you to record your voice and digital avatar, in order to create a guided tour around the exposition space.<br><br>To record a tour, simply click the button below and give the tour by talking and moving your avatar around the page. When you are done, click the button marked end recording that will appear in the bottom left of your screen.<br><br>Before staring make sure that your microphone is connected and setup properly.<br><br><b>WARNING:</b><br><b>Pressing record will PERMANENTLY ERASE any previously recorded audio tour!</b><div class='recButton'>Start Recording</div>"
    document.querySelector(".fade").style.display = "block";
    document.querySelector(".fade").style.background = "rgba(0,0,0,0.3)";
    document.body.appendChild(popup);
    document.querySelector(".recButton").addEventListener("click", function() {
        let elem = this;
        elem.innerHTML = "3";
        window.setTimeout(function() {
            elem.innerHTML = "2";
        }, 1000);
        window.setTimeout(function() {
            elem.innerHTML = "1";
        }, 2000);
        window.setTimeout(function() {
            popup.remove();
            document.querySelector(".fade").style.display = "none";
            document.querySelector(".fade").style.background = "rgba(0,0,0,0)";

            socket.emit("resetPoints", pass, subdomain);
            points = [];
            let recordInterval;
            window.setTimeout(function() {
                recordInterval = window.setInterval(function() {
                    socket.emit("appendPoint", pass, { x: currentX, y: currentY } );
                    let point = [];
                    point.push(currentX);
                    point.push(currentY);
                    points.push(point);
                    console.log("added " + currentX, currentY + "to tourdata");
                }, 200);
            }, 500);

            button = document.createElement("div");
            button.className = "GUI buttonGUI recordingGUI";
            button.innerHTML = "<div class='indicator live'></div>End Recording";
            button.addEventListener("click", function() {
                clearTimeout(recordInterval);
                socket.emit("savePoints", pass, {x: currentX, y: currentY } );
                console.log("End Rec");
                mediaRecorder.stop();
                button.className = "GUI buttonGUI recorderGUI";
                button.innerHTML = "Saving audio...";
                this.removeEventListener('click', arguments.callee);
            });
            document.body.querySelector(".GUIcontainer").appendChild(button);

            const mediaRecorder = new MediaRecorder(localStream);
            mediaRecorder.start();

            const audioChunks = [];

            mediaRecorder.addEventListener("dataavailable", event => {
                audioChunks.push(event.data);
            });

            mediaRecorder.addEventListener("stop", () => {
                let audioBlob = new Blob(audioChunks, {type: 'audio/ogg'});
                socket.emit("saveAudio", audioBlob, pass, subdomain);
            });
        }, 3000);
    });

}

socket.on("tourDone", function() {
    button.remove();
    button = document.createElement("div");
    button.className = "GUI buttonGUI recorderGUI";
    button.innerHTML = "Record new tour";
    button.addEventListener("click", function() {
        let passWindow = document.createElement("div");
        passWindow.className = "fade passWindow";
        passWindow.innerHTML = "<div class='passWindowBox'><p>Enter admin password:</p><form><input name='pass' type='password'><input name='cancel' type='button' value='Cancel' onclick='exitAdmin();'><input name='enter' type='submit' value='Enter'></form></div>"
        document.body.appendChild(passWindow);
        let pwForm = document.querySelector(".passWindowBox form");
        pwForm.addEventListener('submit', checkPass);
    });
    document.body.querySelector(".GUIcontainer").appendChild(button);

    document.querySelector(".audioTour").remove();

    let newTour = document.createElement("audio");
    newTour.className = "audioTour";
    document.body.appendChild(newTour);
    newTour.innerHTML = '<source src="shows/' + subdomain + '_tour.ogg?' + new Date().getTime() + '" type="audio/ogg">';

    document.body.querySelector(".tourGUI").classList.remove("inactive");
})

socket.on("passErr", function() {
    pass = prompt("Incorrect Password!\n\nEnter the provided pasword in order to record a new audio tour:");
    if (pass != null) {
       socket.emit("checkPass", pass);
    }
});
