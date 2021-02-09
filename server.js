const nodemailer = require('nodemailer');
const fs = require("fs");
const path = require('path');
const express = require('express');
const app = express();
const http = require("http");
const https = require("https");
const port = 8887;
const minimist = require('minimist');
const ws = require('ws');
const bcrypt = require('bcrypt');
const formidable = require('formidable');

const defaultShow = require("./private/default.json");
const words = require("./private/words.json");

let maxRoomSize = 200;

let slideshows = [];
let chatboxes = [];
let puzzles = [];
let quizzes = [];

fs.readFile("private/chatboxes.json", function read(err, data) {
    if (err) {
        return console.log(err);
    }
    chatboxes = JSON.parse(data);
});

let subdomains = [];

let logStreams = [];

let transporter = nodemailer.createTransport({
    host: 'smtp.host.name',         // replace with SMTP url of mail host to use for verification email
    port: 465,
    secure: true,
    auth: {
        user: 'email@host.name',    // replace wieh email username
        pass: 'password'            // replace with email password
    }
});

app.set('port', port);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.set('trust proxy', 1);
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json({limit: '50mb'}));
app.use(express.urlencoded({limit: '50mb', extended: true}));

const server = http.createServer(app);

//const server = https.createServer({
//    key: fs.readFileSync('key.pem'),
//    cert: fs.readFileSync('cert.pem')
//}, app);



const io = require('socket.io')(server, {
    pingTimeout: 25000,
});
const clients = [];


server.listen(port, () => {
    customLog("server started ", port);
});
server.on('error', (err) => {
    customLog(err);
});

app.get("/", (req, res) => {
    res.render("dashboard", { subdomainAlias: "public" });

    // Can use later for registering our own futura-tropica.network subdomians!

    // const domain = req.headers.host;
    // let subdomain = domain.substr(0, domain.indexOf('.'));

    // console.log("Got request for " + domain + ", subdomain was " + subdomain);

    // if (!domain.includes(".futura-tropica.network")) {
    //     fs.readFile("private/subdomainInfo.json", function read(err, data) {
    //         if (err) {
    //             return console.log(err);
    //         }
    //         let subdomainInfo = JSON.parse(data);

    //         let subdomainsInfo = Object.entries(subdomainInfo);

    //         for(var i = 0; i < subdomainsInfo.length; i++) {

    //             if (subdomainsInfo[i][1].alias && subdomainsInfo[i][1].alias == domain) {
    //                 console.log("Domain " + subdomainsInfo[i][1].alias + " is an alias for " + subdomainsInfo[i][0] + ".futura-tropica.network");
    //                 subdomain = subdomainsInfo[i][0];
    //                 console.log(subdomain);
    //                 break;
    //             }
    //         }
    //         console.log("rendering page " + subdomain + " for " + domain);
    //         renderPage(req,res,domain,subdomain);

    //     });
    // } else {
    //     console.log("rendering page " + subdomain + " for " + domain);
    //     renderPage(req,res,domain,subdomain);
    // }
    // customLog("Subdomain: " + subdomain);
});

app.get("/about", (req, res) => {
    res.render("about");
});


// function renderPage(req, res, domain, subdomain) {
//     if (subdomain === "cms") {
//         let now = new Date();
//         res.render("cms", { date: new Date(now.getFullYear() + "-" + (now.getMonth() + 1) + "-" + now.getDate() + " 23:59:59 GMT+0100").getTime() });
//     } else if (subdomain) {

//         if (fs.existsSync("public/shows/" + subdomain + ".json")) {
//             res.render("home", { subdomainAlias: subdomain });
//         } else {
//             res.render("toCms", { name: "test" });
//         }
//     } else {
//         res.render("landing");
//     }
// }

// app.post("/fileupload", (req, res) => {
//     customLog("Uploading file...");
//     var form = new formidable.IncomingForm();
//     form.parse(req, async function (err, fields, files) {

//         let oldpath = files.filetoupload.path;
//         let subdomain = fields.subdomain;
//         let newpath = "public/shows/" + subdomain + "/" + files.filetoupload.name;

//         console.log("Saving file to " + newpath);

//         try {
//             await fs.promises.access("public/shows/" + subdomain);
//             console.log("folder exist!");
//             fs.rename(oldpath, newpath, function (err) {
//                 if (err) throw err;
//                 res.write('File uploaded and moved!');
//                 res.end();
//                 customLog("File saved!");
//             });
//         } catch (error) {
//             customLog("No image folder yet for this subdomain, creating it...")
//             fs.mkdir("public/shows/" + subdomain, err => {
//                 if (err) console.log(err);
//                 fs.rename(oldpath, newpath, function (err) {
//                     if (err) throw err;
//                     res.write('File uploaded and moved!');
//                     res.end();
//                     customLog("File saved!");
//                 });
//             });
//         }
//     });
// });

function socketsInRoom(room) {
    if (io.sockets.adapter.rooms[room]) {
        let sockets = io.sockets.adapter.rooms[room].sockets;
        let sizeOfRoom = Object.keys(sockets).length;
        return sizeOfRoom;
    } else {
        return 0;
    }
}


io.on("connection", function(socket) {
    customLog("Connection from " + socket.id);
    let angle = Math.floor(Math.random() * 6);
    let hue = Math.floor(Math.random() * 360);
    let hue2 = Math.floor(Math.random() * 360);
    let bright = Math.floor(Math.random() * 40 + 30);
    let bright2 = Math.floor(Math.random() * 40 + 30);
    socket.angle = angle;
    socket.hue = hue;
    socket.hue2 = hue2;
    socket.bright = bright;
    socket.bright2 = bright2;
    socket.name = "#none";
    socket.muted = true;
    socket.admin = false;

    console.log("emit setId");
    socket.emit("setId", { id: socket.id, hue: hue, hue2: hue2, bright: bright, bright2: bright2, angle: angle, reqTime: Date.now() });

    socket.on("setRoom", function(data) {
        if (socketsInRoom(data.room) < maxRoomSize || data.admin) {
            customLog("Socket wants to join room " + data.room + ", there are currently " + socketsInRoom(data.room) + " other clients in that room");
            socket.join(data.room);
            customLog("Socket has joined room " + data.room + ", there are currently " + socketsInRoom(data.room) + " other clients in that room. " + socket.room);
            socket.room = data.room;
    //        socket.subdomain = data.room;
            customLog(socket.id + " is on subdomain '" + socket.room + "'");
            let subdomainIndex = subdomains.map(e => e.name).indexOf(data.room);

            if (subdomainIndex < 0) {
                let subdomain = {
                    name: data.room,
                    admins: [],
                    viewers: []
                }
                subdomains.push(subdomain);
            }

            customLog("Subdomains:");
            customLog(JSON.stringify(subdomains));
            socket.emit("setupStreaming");
        } else {
            socket.emit("roomFull");
        }
    });

    socket.on("test", function() {
        console.log("test");
    });

    socket.on("setUsername", function(name) {
        socket.name = name;
//        socket.broadcast.emit("newUser", { id: socket.id, hue: hue, name: socket.name, muted: socket.muted });

        for (let i in io.sockets.connected) {
            let s = io.sockets.connected[i];
            if (socket.id != s.id && s.name != "#none" && s.room == socket.room) {
                customLog("Telling " + socket.id + "(" + socket.room + ") to create user " + s.id + "(" + s.room + ") with name " + s.name);
                socket.emit("existingUser", { id: s.id, hue: s.hue, hue2: s.hue2, bright: s.bright, bright2: s.bright2, angle: s.angle, name: s.name, muted: s.muted, presenterId: s.presenterId, admin: s.admin });
                io.to(s.id).emit("newUser", { id: socket.id, hue: socket.hue, hue2: socket.hue2, bright: socket.bright, bright2: socket.bright2, angle: socket.angle, name: socket.name, muted: socket.muted });
            }
        }
    });

    socket.on("disconnect", function() {
        if (!socket.leftShow) {
            io.to(socket.room).emit("disconnectedUser", socket.id);
        }
//        socket.disconnect(true);
        customLog(socket.id + " has disconnected");

    });

    socket.on("offer", function(socketId, offer) {
        io.to(socketId).emit("offer", offer, socket.id);
    });

    socket.on("answer", function(socketId, answer) {
        customLog("Sending answer from " + socket.id + " to " + socketId);
        io.to(socketId).emit("answer", answer, socket.id);
    });

    socket.on("newRoomName", function(user) {
        socket.emit("newRoomName", "room" + Math.floor(Date.now()), user);
    });

    socket.on("unmute", function() {
        customLog(socket.id + " has unmuted!");
        socket.muted = false;
        io.to(socket.room).emit("unmute", socket.id);
    });

    socket.on("checkPass", function(pass) {
        if (pass === adminPass) {
            socket.emit("passOk");
        } else {
            socket.emit("passWrong");
        }
    })

    socket.on("presenterId", function(presenterId) {
        socket.presenterId = presenterId;
        io.emit("presenterId", { presenterId: presenterId, socketId: socket.id });
    })
    socket.on("closeBrowser", function() {
        customLog("Browser of socket " + socket.id + " has closed, and user should be disconected");
        io.to(socket.room).emit("disconnectedUser", socket.id);
        socket.leftShow = true;
        socket.disconnect(true);
//        io.to(socket.room).emit("disconnect", socket.id);
    });


    socket.on("getPages", function() {

        let rooms = io.sockets.adapter.rooms;
        let shows = [];
        for (let key in rooms) {
            if (rooms.hasOwnProperty(key)) {
                if (!rooms[key].sockets.hasOwnProperty(key)) {
                    console.log(key);
                    shows.push({
                        name: key,
                        users: Object.keys(rooms[key].sockets).length
                    });
                }
            }
        }
        socket.emit("allPages", shows);
        
        console.log(io.sockets.adapter.rooms);
    });


//////////////////////////////////////////
//                                      //
//  Slideshow & chat window from here   //
//                                      //
//////////////////////////////////////////


    socket.on("setSlide", function(data) {

        customLog("Someone changed a slide on slideshow " + data.slideshow)
        let slideIndex = slideshows.map(function(e) { return e.name; }).indexOf(data.slideshow);
        if (slideIndex >= 0) {
            slideshows[slideIndex].slide = data.slide;
            customLog("Found the presentation & updated the slide");
        } else {
            customLog("Created the presentation & updated the slide");
            slideshows.push({
                name: data.slideshow,
                slide: data.slide
            });
        }

        customLog("setSlide", { slideshow: data.slideshow, slide: data.slide });
        io.to(socket.room).emit("setSlide", { slideshow: data.slideshow, slide: data.slide } );
    });

    socket.on("whatSlide", function(slideshow) {
        customLog("Someone requested the current slide for slideshow " + slideshow)
        let slideIndex = slideshows.map(function(e) { return e.name; }).indexOf(slideshow);
        if (slideIndex >= 0) {
            customLog("Found the slideshow & sending slide to user the slide");
            socket.emit("setSlide", { slideshow: slideshow, slide: slideshows[slideIndex].slide } );
        }
    });


    socket.on("getChats", function(chatbox) {
        customLog(chatboxes);
        let chatIndex = chatboxes.map(function(e) { return e.name; }).indexOf(chatbox);
        if (chatIndex >= 0) {
            let chatList = chatboxes[chatIndex].chat;
            for (let i=0; i<chatList.length; i++) {
                socket.emit("newChat", { chatbox: chatbox, message:chatList[i].message, username: chatList[i].username, hue: chatList[i].hue, hue2: chatList[i].hue2, bright: chatList[i].bright, bright2: chatList[i].bright2, angle: chatList[i].angle } );
            }
        }
    });

    socket.on("sendChat", function(data) {
        let chatIndex = chatboxes.map(function(e) { return e.name; }).indexOf(data.chatbox);
        if (chatIndex >= 0) {
            chatboxes[chatIndex].chat.push({ username: data.username, message: data.message, hue: socket.hue, hue2: socket.hue2, bright: socket.bright, bright2: socket.bright2, angle: socket.angle });
        } else {
            chatboxes.push({
                name: data.chatbox,
                chat: [
                    { username: data.username, message: data.message, hue: socket.hue, hue2: socket.hue2, bright: socket.bright, bright2: socket.bright2, angle: socket.angle }
                ]
            });
        }
        io.to(socket.room).emit("newChat", { chatbox: data.chatbox, message: data.message, username: data.username, hue: socket.hue, hue2: socket.hue2, bright: socket.bright, bright2: socket.bright2, angle: socket.angle });

        fs.writeFile("private/chatboxes.json", JSON.stringify(chatboxes), function(err) {
            if(err) {
                return console.log(err);
            }
        });

        customLog(JSON.stringify(chatboxes));
    });



//////////////////////////////////////////
//                                      //
//     Jigsaw puzzle code from here     //
//                                      //
//////////////////////////////////////////



    socket.on("getPuzzle", function(name, data) {
        // check if puzzle is already active
        let puzzleIndex = puzzles.map(function(e) { return e.name; }).indexOf(name);
        if (puzzleIndex >= 0) {
            // if active,s end current state to user
//            customLog("Puzzle is in progress!");
            socket.emit("setPuzzle", puzzles[puzzleIndex]);
        } else if (data) {
            // if not active, generate the puzzle pices & positions
            createPuzzle(name,data,socket);
        }

//        console.log(puzzles);
    });

    socket.on("resetPuzzle", function(name,data) {
        createPuzzle(name,data,socket);
    });

    function createPuzzle(name,data,socket) {
//        customLog("Creating the puzzle...");

        let puzzle = {
            name: name,
            width: data.width,
            height: data.height,
            top: data.top,
            left: data.left,
            segmentsX: data.segmentsX,
            segmentsY: data.segmentsY,
            piceSize: {
                x: data.width / data.segmentsX,
                y: data.height / data.segmentsY,
            },
            pices: [],
            segments: []
        };

        for (let i=0; i<data.segmentsY; i++) {
            for (let j=0; j<data.segmentsX; j++) {
                let pice = {
                    held: false,
                    xId: j,
                    yId: i
                }
                if (Math.random() < 0.5) {
                    pice.x = puzzle.piceSize.x + Math.random() * (puzzle.width + 400 - (puzzle.piceSize.x * 2));
                    pice.y = puzzle.piceSize.y + Math.random() * (200 - puzzle.piceSize.y * 2);
                    if (Math.random() < 0.5) {
                        pice.y += puzzle.height + 200;
                    }
//                    console.log(pice.x,pice.y);
                } else {
                    pice.y = puzzle.piceSize.y + Math.random() * (puzzle.height + 400 - (puzzle.piceSize.y * 2));
                    pice.x = puzzle.piceSize.x + Math.random() * (200 - puzzle.piceSize.x * 2);
                    if (Math.random() < 0.5) {
                        pice.x += puzzle.width + 200;
                    }
//                    console.log(pice.x,pice.y);
                }
                puzzle.pices.push(pice);
                puzzle.segments.push({
                    placed: false,
                    xId: j,
                    yId: i
                });
            }
        }

        let puzzleIndex = puzzles.map(function(e) { return e.name; }).indexOf(name);
        if (puzzleIndex >=0) {
            puzzles[puzzleIndex] = puzzle;
        } else {
            puzzles.push(puzzle);
        }
        io.to(socket.room).emit("setPuzzle", puzzle);
    }

    socket.on("clickPice", function(piceId,puzzle) {
//        customLog("user " + socket.id + " has picked up pice " + piceId + " of puzzle " + puzzle);
        let name = socket.room + "-" + puzzle;
        let puzzleIndex = puzzles.map(function(e) { return e.name; }).indexOf(name);

        if (puzzleIndex >= 0) {
            let puzzle = puzzles[puzzleIndex];
            let pice = puzzle.pices[piceId];
            if (pice) {
                pice.held = socket.id;
                io.to(socket.room).emit("pickupPice", name, piceId, socket.id);
            }
        }
    });

    socket.on("dropPice", function(piceId,puzzle,x,y) {
//        customLog("user " + socket.id + " has dropped pice " + piceId + " of puzzle " + puzzle);
        let name = socket.room + "-" + puzzle;
        let puzzleIndex = puzzles.map(function(e) { return e.name; }).indexOf(name);

        if (puzzleIndex >= 0) {
            let puzzle = puzzles[puzzleIndex];
            let pice = puzzle.pices[piceId];
            pice.held = null;
            pice.x = x;
            pice.y = y;

            io.to(socket.room).emit("dropPice", name, piceId, socket.id,x,y);
        }
    });

    socket.on("placePice", function(piceId, puzzle) {
//        customLog("user " + socket.id + " has placed pice " + piceId + " of puzzle " + puzzle);
        let name = socket.room + "-" + puzzle;
        let puzzleIndex = puzzles.map(function(e) { return e.name; }).indexOf(name);

        if (puzzleIndex >= 0) {
            let puzzle = puzzles[puzzleIndex];
            puzzle.pices[piceId].placed = true;

            let segment = puzzle.segments[piceId];
            segment.placed = true;
            io.to(socket.room).emit("placePice", name, piceId, socket.id);
        }
    });


//////////////////////////////////////////
//                                      //
//         Quiz code from here          //
//                                      //
//////////////////////////////////////////



    socket.on("getQuiz", function(name) {
        console.log("got request for quiz " + name);
        let quizIndex = quizzes.map(function(e) { return e.name; }).indexOf(name);
        if (quizIndex >=0 ) {
            socket.emit("setQuiz",name,quizzes[quizIndex].question);
        } else {
            socket.emit("noRunningQuiz",name);
        }
    });

    socket.on("startQuiz", function(name) {
        let quiz = {
            name: name,
            question: 0,
            scores: { }
        }
        let quizIndex = quizzes.map(function(e) { return e.name; }).indexOf(name);
        if (quizIndex >=0 ) {
            quizzes[quizIndex] = quiz;
        } else {
            quizzes.push(quiz);
        }
        console.log("Quiz " + name + " has been reset:");
        console.log(quizzes);
        io.to(socket.room).emit("setQuiz",name,0);
    });

    socket.on("nextQuestion", function(name,question) {
        let quizIndex = quizzes.map(function(e) { return e.name; }).indexOf(name);
        if (quizIndex >=0 ) {
            if (quizzes[quizIndex].question == question) {
                quizzes[quizIndex].question = parseInt(question)+1;
                io.to(socket.room).emit("setQuiz",name,quizzes[quizIndex].question);
                console.log("Next question!!");
            }
        }
    });

    socket.on("quizAnswer", function(answer,name) {
        let quizIndex = quizzes.map(function(e) { return e.name; }).indexOf(name);
        if (quizIndex >=0 ) {
            if (quizzes[quizIndex].scores[socket.id]) {
                quizzes[quizIndex].scores[socket.id] += answer;
            } else {
                quizzes[quizIndex].scores[socket.id] = answer;
            }
            console.log(quizzes[quizIndex].scores);
        }
    });

    socket.on("quizDone", function(name) {
        let quizIndex = quizzes.map(function(e) { return e.name; }).indexOf(name);
        if (quizIndex >=0 ) {
            io.to(socket.room).emit("quizDone",name,quizzes[quizIndex].scores);
            quizzes.splice(quizIndex,1);
            console.log("Quiz " + name + " is done, removing it!");
        }
    });


//////////////////////////////////////////
//                                      //
//    Audio tour recording from here    //
//                                      //
//////////////////////////////////////////

    socket.on("resetPoints", function(sPass, subdomain) {
        if (sPass === adminPass) {
            fs.writeFileSync("public/shows/" + subdomain + "_tourdata.js","let points = [", {encoding: 'utf8', flag: 'w'} );
            let logStream = fs.createWriteStream("public/shows/" + subdomain + "_tourdata.js", {encoding: 'utf8', flags: 'a'} );
            logStreams.push(logStream);
            socket.logStream = logStreams.length -1;
            customLog("Socket.logstream is: " + socket.logStream);
        }
    });

    socket.on("appendPoint", function(sPass, point) {
        customLog("Appending point " + point + "...");
        if (sPass === adminPass && socket.logStream) {
            logStreams[socket.logStream].write("[" + point.x + "," + point.y + "],");
            customLog("point appended!");
        }
    });

    socket.on("savePoints", function(sPass, point) {
        customLog("Saving points...");
        if (sPass === adminPass && socket.logStream) {
            logStreams[socket.logStream].write("[" + point.x + "," + point.y + "]];");
            logStreams[socket.logStream].end();
            customLog("points saved!");
        }
    });


    socket.on("saveAudio", function(blob, sPass, subdomain) {
        if (sPass === adminPass) {
            let path = 'public/shows/' + subdomain + '_tour.ogg';
            fs.open(path, 'w', function(err, fd) {
                if (err) {
                    throw 'could not open file: ' + err;
                }

                // write the contents of the buffer, from position 0 to the end, to the file descriptor returned in opening our file
                fs.write(fd, blob, 0, blob.length, null, function(err) {
                    if (err) {
                        throw 'error writing file: ' + err;
                        socket.emit("tourFailed", err);
                    }
                    fs.close(fd, function() {
                        customLog('wrote audio tour file successfully!');
                        socket.emit("tourDone");
                    });
                });
            });
        }
    });


//////////////////////////////////////////
//                                      //
//          CMS code from here          //
//                                      //
//////////////////////////////////////////


    socket.on("countVisitor", function()  {
        fs.readFile("public/shows/" + socket.room + ".json", function read(err, data) {
            if (err) {
                console.error("Tried to count a visitor on a subdomain that has no JSON file")
                return
            }
            let showJSON = JSON.parse(data);
            if (!showJSON.visitors) {
                showJSON.visitors = 1
            } else {
                showJSON.visitors++
            }
            fs.writeFile("public/shows/" + socket.room + ".json", JSON.stringify(showJSON), function(err) {
                if(err) {
                    console.error(err);
                    return
                }
            });
        });
    });
    socket.on("checkSubdomainExists", function(subdomain, force) {
        // check if subdomain is being edited by another user
        if (io.sockets.adapter.rooms["CMS_" + subdomain] && !force) {
            socket.emit("otherCmsUser");

        // if not, check if it exists
        } else {
            fs.readFile("private/subdomainInfo.json", function read(err, data) {
                if (err) {
                    return console.log(err);
                }
                let showCodes = JSON.parse(data);

                if (showCodes[subdomain] && showCodes[subdomain].email) {
                    socket.emit("exists");
                    customLog("exists");
                } else {
                    socket.emit("notExists");
                    customLog("notExists");
                }
            });
        }
    });

    socket.on("updateShow", function(json, pass, subdomain) {
        console.log("Updating show...");

        fs.readFile("private/subdomainInfo.json", function read(err, data) {
            if (err) {
                return console.log(err);
            }
            let subdomainInfo = JSON.parse(data);
            try {
                bcrypt.compare(pass, subdomainInfo[subdomain].pass).then(function(result) {
                    if (result === true) {
                        customLog("Overwriting existing show " + subdomain);

                        fs.writeFile("public/shows/" + subdomain + ".json", json, function(err) {
                            if(err) {
                                socket.emit("saveShowError", err);
                                return console.error(err);
                            }
                            customLog("The file was saved!");
                            socket.emit("saveShowDone");

                            let showJSON = JSON.parse(json);
                            for (let i=0; i<showJSON.works.length; i++) {
                                if (showJSON.works[i].puzzle) {
                                    let name = subdomain + "-" + showJSON.works[i].name;
                                    let puzzleIndex = puzzles.map(function(e) { return e.name; }).indexOf(name);
                                    puzzles.splice(puzzleIndex,1);
                                }
                            }
                        });
                    }
                });
            } catch(err) {
                socket.emit("cmsErr");
                customLog(err);
            }
        });

    });

    socket.on("setCodeCMS", function(email, subdomain) {

        let code = Math.random().toString(36).slice(-10);

        fs.readFile("private/subdomainInfo.json", function read(err, data) {
            if (err) {
                return console.log(err);
            }
            let showCodes = JSON.parse(data);

            if (showCodes[subdomain] && showCodes[subdomain].email) {
                socket.emit("subdomainTaken");
            } else {

                showCodes[subdomain] = code;
                fs.writeFile("private/subdomainInfo.json", JSON.stringify(showCodes), function(err) {
                    if(err) {
                        return console.log(err);
                    }
                    customLog("Code " + code + " was saved for sobdomain " + subdomain);
                });
            }
        });

        let message = {
            from: "email@host.name",     // replace email adress with one matching credentials on lines 40, 44 & 45
            to: email,
            subject: "Verification code common.garden",
            html: '<html><head><meta charset="utf-8"><style type="text/css">body{width:100% !important; -webkit-text-size-adjust:100%; -ms-text-size-adjust:100%; margin:0; padding:0;}.ExternalClass {width:100%;}.ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {line-height: 100%;}</style></head><body bgcolor="#88d598" leftmargin="0" topmargin="0" marginwidth="0" marginheight="0"><table width="100%" border="0" cellpadding="0" cellspacing="0"><tr height="200"><td>&nbsp;</td><tr height="90"><td width="100%" valign="top" align="center" bgcolor="#88d598" style="color: #ffffff; font-size: 26px; margin-top: 100px; font-family: sans-serif;">Welcome to common.garden!</td></tr><tr height="50"><td width="100%" valign="top" align="center" bgcolor="#88d598" style="color: #ffffff; font-size: 16px; margin-top: 30px; font-family: sans-serif;">Your verification code for ' + subdomain + '.common.garden is:</td></tr><tr><td width="100%" height="50" valign="top" align="center" style="margin-top: 50px;"><span width="250" height="50" style="color: #000000; background-color: #eeeeee; font-size: 16px; border-radius: 25px; border-width: 1px; border-color: #aaaaaa; border-style: solid; padding-top: 9px; display: inline-block; font-family: sans-serif; width: 200px; height: 28px;">' + code + '</span></td></tr></table></body></html>'
        };

        transporter.sendMail(message, function(error, info){
            if (error) {
                customLog(error);
                socket.emit("cmsErr");
            } else {
                customLog('Verification code sent to ' + email + ': ' + info.response);
            }
        });
    });

    socket.on("checkCodeCMS", function(code, subdomain) {
        fs.readFile("private/subdomainInfo.json", function read(err, data) {
            if (err) {
                return console.log(err);
            }
            let showCodes = JSON.parse(data);

            if (showCodes[subdomain] === code) {
                socket.emit("codeOk");
            }
        });
    });

    socket.on("setPass", async(pass, subdomain, email, code, template) => {
        console.log(subdomain + " Is beeing registered to " + email);
        fs.readFile("private/subdomainInfo.json", function read(err, data) {
            if (err) {
                socket.emit("cmsErr");
                return console.log(err);
            }
            let subdomainInfo = JSON.parse(data);

            if (subdomainInfo[subdomain] && subdomainInfo[subdomain] === code) {
                try {
                    bcrypt.hash(pass, 10).then(function(hash) {
                        if (err) {
                            console.error(err);
                            socket.emit("cmsErr");
                            return false;
                        }
                        subdomainInfo[subdomain] = {
                            "email": email,
                            "pass": hash
                        }
                        fs.writeFile("private/subdomainInfo.json", JSON.stringify(subdomainInfo), function(err) {
                            if(err) {
                                return console.log(err);
                            }
                            customLog(subdomain + " has been registered to " + email);

                            fs.writeFile("public/shows/" + subdomain + ".json", JSON.stringify(defaultShow[template]), function(err) {
                                if(err) {
                                    return console.log(err);
                                }
                                customLog("public/shows/" + subdomain + ".json has been created.");
                                socket.emit("passOk");
                            });
                        });
                    });
                } catch(err) {
                    console.error(err);
                    socket.emit("cmsErr");
                }
            }
        });
    });

    socket.on("checkPassCMS", function(subdomain, pass) {
        fs.readFile("private/subdomainInfo.json", function read(err, data) {
            if (err) {
                return console.log(err);
            }
            let subdomainInfo = JSON.parse(data);
            try {
                bcrypt.compare(pass, subdomainInfo[subdomain].pass).then(function(result) {
                    if (result === true) {
                        socket.emit("passOk");

                        // register that this user is now editing this subdomain's CMS
                        socket.join("CMS_" + subdomain);
                    } else {
                        socket.emit("passWrong");
                    }
                });
            } catch(err) {
                socket.emit("cmsErr");
                console.error(err);
            }
        });
    });

    socket.on("createName", function() {
        createName(socket);
    });

    socket.on("checkName", function(name) {
        fs.readFile("private/subdomainInfo.json", function read(err, data) {
            if (err) {
                return console.log(err);
            }
            let subdomains = JSON.parse(data);

            if (subdomains[name]) {
                socket.emit("subdomainExists");
            } else {
                socket.emit("subdomainAvalible");
            }
        });
    });
});

function createName(socket, counter) {
    if (!counter) {
        counter = 0;
    }
    if (counter < 50) {
        let name = words[Math.floor(Math.random()* words.length)] + "-" + words[Math.floor(Math.random()* words.length)] + "-" + words[Math.floor(Math.random()* words.length)] + "-" + words[Math.floor(Math.random()* words.length)];

        fs.readFile("private/subdomainInfo.json", function read(err, data) {
            if (err) {
                return console.log(err);
            }
            let subdomains = JSON.parse(data);

            if (subdomains[name]) {
                customLog("The generated subdomain already exists, generating a new one...");
                createName(socket, (counter+1));
            } else {
                customLog("The generated subdomain avalible, sending to user!");
                socket.emit("subdomain", name);
            }
        });
    } else {
        socket.emit("subdomain", "");
    }
}

async function setCmsContent(pass, subdomain, email, code, template, expiry, socket) {
    console.log(subdomain + " Is beeing registered to " + email);
    fs.readFile("private/subdomainInfo.json", function read(err, data) {
        if (err) {
            io.to(socket).emit("cmsErr");
            return console.log(err);
        }
        let subdomainInfo = JSON.parse(data);

        if (subdomainInfo[subdomain] && subdomainInfo[subdomain] === code) {
            try {
                subdomainInfo[subdomain] = {
                    "email": email,
                    "pass": pass,
                    "expires": expiry
                }
                fs.writeFile("private/subdomainInfo.json", JSON.stringify(subdomainInfo), function(err) {
                    if(err) {
                        return console.log(err);
                    }
                    customLog(subdomain + " has been registered to " + email);

                    fs.writeFile("public/shows/" + subdomain + ".json", JSON.stringify(defaultShow[template]), function(err) {
                        if(err) {
                            return console.log(err);
                        }
                        customLog("public/shows/" + subdomain + ".json has been created.");
                        io.to(socket).emit("passOk");
                    });
                });
            } catch(err) {
                console.error(err);
                io.to(socket).emit("cmsErr");
            }
        }
    });
}

function customLog(s) {
    const orig = Error.prepareStackTrace;
    Error.prepareStackTrace = (_, stack) => stack;
    const err = new Error();
    Error.captureStackTrace(err, arguments.callee);
    const callee = err.stack[0];
    Error.prepareStackTrace = orig;
    let date = new Date();
    let time = date.getTime();
    let timestamp = date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
    process.stdout.write(`${timestamp} ${path.relative(process.cwd(), callee.getFileName())}:${callee.getLineNumber()}: ${s}\n`);
}
//module.exports = trace;

