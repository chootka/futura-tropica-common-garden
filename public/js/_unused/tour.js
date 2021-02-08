let ongoing = false;
let tourPos = 0;
let startTime;
let checkInterval;
let intervalID;
let audio = document.querySelector(".audioTour");

let guide = document.createElement("div");
guide.className = "user guide";
guide.id = "guide";
guide.innerHTML = "<div class='hitbox'><div class='name'>Guide</div></div>"
guide.style.opacity = 0;
document.body.appendChild(guide);

let smallGuide = document.createElement("div");
smallGuide.className = "mapUser smallGuide";
smallGuide.id = "smallGuide";
guide.style.opacity = 0;
document.body.querySelector(".map").appendChild(smallGuide);

document.body.querySelector(".tourGUI").addEventListener("click", function() {
    if (this.innerHTML == "Start Tour") {
        console.log("innerHTML is Start Tour");
        tour();
    }
});


function tour() {
    console.log("Staring tour!");
    document.body.querySelector(".tourGUI").innerHTML = "Playing Tour <span onclick='stopTour();'>[STOP]</span>";
    document.body.querySelector(".tourGUI").classList.remove("buttonGUI");
    if (!ongoing) {
        ongoing = true;
        audio = document.querySelector(".audioTour");
        audio.play();

        guide.style.left = points[0][0] + "px";
        guide.style.top = points[0][1] + "px";
        window.setTimeout(function() { guide.style.opacity = 1; smallGuide.style.opacity = 1; }, 100);

        smallGuide.style.left = (points[0][0]/12) + 17 + "px";
        smallGuide.style.top = (points[0][1]/12) + 20 + "px";


        window.setTimeout(function() {
            tourPos = 0;
            startTime = new Date().getTime();
            intervalID = setInterval(function () {
                guide.style.left = points[tourPos][0] + "px";
                guide.style.top = points[tourPos][1] + "px";
                smallGuide.style.left = (points[tourPos][0]/12) + 17 + "px";
                smallGuide.style.top = (points[tourPos][1]/12) + 20 + "px";

                if (++tourPos >= points.length) {
                    window.clearInterval(intervalID);
                    window.clearInterval(checkInterval);
                    guide.style.opacity = 0;
                    smallGuide.style.opacity = 0;
                    ongoing = false;
                    document.body.querySelector(".tourGUI").innerHTML = "Start Tour";
                    document.body.querySelector(".tourGUI").classList.add("buttonGUI");
                }
            }, 200);

            checkInterval = setInterval(function() {
                tourPos = (parseInt((new Date().getTime() - startTime)/200));
            }, 5000);
        }, 500);
    }
}

function stopTour() {
    ongoing = false;
    window.clearInterval(intervalID);
    window.clearInterval(checkInterval);
    document.body.querySelector(".guide").style.opacity = 0;
    document.body.querySelector(".smallGuide").style.opacity = 0;
    smallGuide.style.opacity = 0;
    window.setTimeout(function() {
        document.body.querySelector(".tourGUI").innerHTML = "Start Tour";
        document.body.querySelector(".tourGUI").classList.add("buttonGUI");
        audio.pause();
        audio.currentTime = 0;
    }, 100);
}

