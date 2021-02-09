let timers = {};
let quizzes = {};

function setupQuiz(quizId) {
    window.setTimeout(function() {
        socket.emit("getQuiz", subdomain + "-" + quizId);
    }, 100);
}

socket.on("noRunningQuiz",function(name) {
    console.log("No quiz with that name in progress!");
    console.log(name);
    let quizId = name.split("-")[1];
    console.log("#" + quizId + " .button");
    document.querySelector("#" + quizId + " .option.a").classList.remove("correct");
    document.querySelector("#" + quizId + " .option.a").classList.remove("wrong");
    document.querySelector("#" + quizId + " .option.b").classList.remove("correct");
    document.querySelector("#" + quizId + " .option.b").classList.remove("wrong");
    document.querySelector("#" + quizId + " .button").classList.remove("large");
    document.querySelector("#" + quizId + " .button").innerHTML = "START";
    document.querySelector("#" + quizId + " .question").innerHTML = "";
    document.querySelector("#" + quizId + " .answer.a").innerHTML = "";
    document.querySelector("#" + quizId + " .answer.b").innerHTML = "";
    document.querySelector("#" + quizId + " .questionContainer").classList.add("hidden");
    document.querySelector("#" + quizId + " .button").classList.remove("disabled");
    document.querySelector("#" + quizId + " .button").classList.add("start");
    document.querySelector("#" + quizId + " .button").addEventListener("click", startQuiz);
});

function startQuiz(event) {
    if (users.length >= 1) {
        socket.emit("startQuiz", subdomain + "-" + event.target.parentElement.id);
        event.target.removeEventListener("click", startQuiz);
    } else {
        alert("At least two people are required to start the quiz");
    }
}

socket.on("setQuiz", function(name,question) {
    if (timers[name]) {
        clearInterval(timers[name]);
        delete timers[name];
    }
    console.log("Setting at question " + question);
    let quizId = name.split("-")[1];
    document.querySelector("#" + quizId + " .button").classList.remove("start");
    document.querySelector("#" + quizId + " .button").classList.remove("disabled");
    document.querySelector("#" + quizId + " .questionContainer").classList.remove("hidden");

    if (quizzes[name].length <= question) {
        socket.emit("quizAnswer",getAnswer(document.querySelector("#" + quizId + " .question").dataset.question,name),name);
        if (quizzes[name][document.querySelector("#" + quizId + " .question").dataset.question][3] == 2) {
            document.querySelector("#" + quizId + " .option.a").classList.add("wrong");
            document.querySelector("#" + quizId + " .option.b").classList.add("correct");
        } else {
            document.querySelector("#" + quizId + " .option.a").classList.add("correct");
            document.querySelector("#" + quizId + " .option.b").classList.add("wrong");
        }
        let score = parseInt(document.querySelector("#" + quizId + " .score").dataset.score) + parseInt(getAnswer(document.querySelector("#" + quizId + " .question").dataset.question,name));
        console.log(score);
        document.querySelector("#" + quizId + " .score").innerHTML = "Score: " + score;
        document.querySelector("#" + quizId + " .score").dataset.score = score;
        window.setTimeout(function() {
            socket.emit("quizDone", name);
            document.querySelector("#" + quizId + " .score").innerHTML = "";
        }, 8000);
    } else {
        if (question >0) {
            socket.emit("quizAnswer",getAnswer(document.querySelector("#" + quizId + " .question").dataset.question,name),name);
            if (quizzes[name][document.querySelector("#" + quizId + " .question").dataset.question][3] == 2) {
                document.querySelector("#" + quizId + " .option.a").classList.add("wrong");
                document.querySelector("#" + quizId + " .option.b").classList.add("correct");
            } else {
                document.querySelector("#" + quizId + " .option.a").classList.add("correct");
                document.querySelector("#" + quizId + " .option.b").classList.add("wrong");
            }
            let score = parseInt(document.querySelector("#" + quizId + " .score").dataset.score) + parseInt(getAnswer(document.querySelector("#" + quizId + "   .question").dataset.question,name));
            console.log(score);
            document.querySelector("#" + quizId + " .score").innerHTML = "Score: " + score;
            document.querySelector("#" + quizId + " .score").dataset.score = score;
            console.log("waiting...");
            window.setTimeout(function() {
                setQuestion(name,question);
            }, 8000);
        } else {
            setQuestion(name,question);
        }
        console.log("next");
    }
});

function setQuestion(name,question) {
    let quizId = name.split("-")[1];
    let time = 20;
    document.querySelector("#" + quizId + " .option.a").classList.remove("correct");
    document.querySelector("#" + quizId + " .option.a").classList.remove("wrong");
    document.querySelector("#" + quizId + " .option.b").classList.remove("correct");
    document.querySelector("#" + quizId + " .option.b").classList.remove("wrong");
    document.querySelector("#" + quizId + " .question").dataset.question = question;
    document.querySelector("#" + quizId + " .question").innerHTML = quizzes[name][question][0];
    document.querySelector("#" + quizId + " .answer.a").innerHTML = "A) " + quizzes[name][question][1];
    document.querySelector("#" + quizId + " .answer.b").innerHTML = "B) " + quizzes[name][question][2];
    timers[name] = window.setInterval(function() {
        document.querySelector("#" + quizId + " .button").classList.add("large");
        document.querySelector("#" + quizId + " .button").innerHTML = time;
        time --;
        if (time < 0) {
            document.querySelector("#" + quizId + " .button").classList.remove("large");
            document.querySelector("#" + quizId + " .button").innerHTML = "...";
            clearInterval(timers[name]);
            delete timers[name];

            window.setTimeout(function() {
                socket.emit("nextQuestion",name,document.querySelector("#" + quizId + " .question").dataset.question);
            },1000);
        }
    }, 1000);
}


socket.on("quizDone", function(name,scores) {
    console.log(name,scores);
    setupQuiz(name.split("-")[1]);

    let myScore = 0;
    let highscore = {
        names: ["No one"],
        score: 0
    };

    for (let [key, value] of Object.entries(scores)) {
        if (key == id) {
            myScore = value;
        }

        if (value > highscore.score) {
            highscore.score = value;
            highscore.names = [ key ];
        } else if (value == highscore.score && value > 0) {
            highscore.names.push(key);
        }
    }
    console.log(highscore);
    let elem = document.createElement("div");
    elem.className = "quizScores";
    if (highscore.names.length == 1) {
        let name = "Missing user";
        if (highscore.names[0] == "No one") {
            name = "No one";
        } else if (highscore.names[0] == id) {
            name = username + " (you)";
        } else {
            for (let i=0; i<users.length; i++) {
                if (users[i].name == highscore.names[0] && users[i].element) {
                    name = users[i].element.querySelector(".hitbox").innerText;
                    break;
                }
            }
        }
        elem.innerHTML = "<h3>Quiz complete!</h3><p>The winner is:</p><p class='name'>" + name + "</p><p class='score'>Score: " + highscore.score + "</p>";
    } else {
        elem.innerHTML = "<h3>Quiz complete!</h3><p>The winners are:</p>";
        for (let i=0; i<highscore.names.length; i++) {
            elem.innerHTML += "<p class='name'>" + highscore.names[i] + "</p>";
        }
        elem.innerHTML += "<p class='score'>Score:" + highscore.score + "</p>";
    }
    if (myScore != highscore.score) {
        elem.innerHTML += "<p class='myScore'>Your score: " + myScore + "</p>";
        elem.style.paddingTop = "25px";
    }
    document.getElementById(name.split("-")[1]).appendChild(elem);
    document.querySelector("#" + name.split("-")[1] + " .button").addEventListener("click", startQuiz);

    window.setTimeout(function() {
        document.querySelector("#" + name.split("-")[1] + " .quizScores").remove();
        console.log("close quiz popUp");
    }, 15000);
})

function getAnswer(question,name) {
    let choice = 0;

    let quizId = name.split("-")[1];
    console.log("Checking answer for question " + question + " of quiz " + name);
    let optionA = document.querySelector("#" + quizId + " .option.a");
    let aPosX = optionA.parentElement.offsetLeft + optionA.offsetWidth/2;
    let aPosY = optionA.parentElement.offsetTop + optionA.offsetHeight/2;
    console.log("Position: " + aPosX, aPosY);

    let optionB = document.querySelector("#" + quizId + " .option.b");
    let bPosX = optionB.offsetLeft + optionB.parentElement.offsetLeft + optionB.offsetWidth/2;
    let bPosY = optionB.parentElement.offsetTop + optionB.offsetHeight/2;
    console.log("Position: " + bPosX, bPosY);

    let aDist = Math.sqrt( (currentX - aPosX) * (currentX - aPosX) + (currentY - aPosY) * (currentY - aPosY) );
    let bDist = Math.sqrt( (currentX - bPosX) * (currentX - bPosX) + (currentY - bPosY) * (currentY - bPosY) );

    console.log("aDist: " + aDist + " bDist: " + bDist);

    if (aDist < optionA.offsetHeight && aDist < bDist) {
        choice = 1;
    } else if (bDist < optionB.offsetHeight && bDist < aDist) {
        choice = 2;
    }

    if (choice > 0) {
        console.log("You chose answer " + choice);
        console.log("correct answer was " + quizzes[name][question][3]);
        if (quizzes[name] && choice == quizzes[name][question][3]) {
            document.querySelector("#" + quizId + " .button").classList.add("large");
            document.querySelector("#" + quizId + " .button").innerHTML = "👍";
            return 1;
        } else {
            document.querySelector("#" + quizId + " .button").classList.add("large");
            document.querySelector("#" + quizId + " .button").innerHTML = "👎";
            return 0;
        }
    } else {
        console.log("you didnt chose an answer!")
        document.querySelector("#" + quizId + " .button").innerHTML = "...";
        return 0;
    }
}
