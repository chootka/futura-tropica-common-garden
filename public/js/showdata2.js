let mapscale;

if (location.hostname.split('.').shift() !== "cms") {
    console.log(subdomain);
    console.log("not CMS");
    checkUrl(subdomain);
}

async function checkUrl(subdomain, report) {
    let url = "shows/" + subdomain + ".json";
    fetch(url)
    .then(response => {
        if (!response.ok) {
            alert("Error: Unable to locale JSON data for this show!");
            throw new Error("HTTP error " + response.status);
        }
        return response.json();
    })
    .then(json => {
        console.log("got JSON");
        showJSON = json;
        saveState = JSON.stringify(showJSON);
        setBody();
        setArticles();
        console.log("Hello");
        console.log(subdomain);
        if (location.hostname.split('.').shift() == "cms") {
            console.log("calling loadCMS()");
            loadCMS();
        }
    })
    .catch(function () {
       this.dataError = true;
    })
}

function setBody() {
    console.log("setting body");
    mapscale = showJSON.screensize.width / (window.innerWidth / 3);
    if (window.innerWidth < window.innerHeight) {
        mapscale = showJSON.screensize.width / (window.innerWidth / 1.5);
    }
    let map = document.querySelector(".map");

    map.style.width = (showJSON.screensize.width / mapscale) + "px";
    map.style.height = (showJSON.screensize.height / mapscale) + "px";

    if (JSON.stringify(showJSON) == saveState) {
        document.title = showJSON.title + " - cms.common.garden";
    } else {
        document.title = showJSON.title + "* - cms.common.garden";
    }
    document.body.style.width = showJSON.screensize.width + "px";
    document.body.style.height = showJSON.screensize.height + "px";
    document.body.style.background = "hsl(" + showJSON.backgroundColor[0] + "," + showJSON.backgroundColor[1] + "%," + showJSON.backgroundColor[2] + "%)";
    document.body.style.color = "hsl(" + showJSON.textColor[0] + "," + showJSON.textColor[1] + "%," + showJSON.textColor[2] + "%)";
    document.head.querySelector(".cmsStyle").innerHTML = "article { border-color: hsl(" + showJSON.borderColor[0] + "," + showJSON.borderColor[1] + "%," + showJSON.borderColor[2] + "%); border-width: " + showJSON.borderWidth + "px; }";
    document.head.querySelector(".cmsStyle").innerHTML += "article { background-color: hsl(" + showJSON.frameBackground[0] + "," + showJSON.frameBackground[1] + "%," + showJSON.frameBackground[2] + "%);}";

    if (showJSON.customCss) {
        let style = document.createElement("style");
        style.innerHTML = showJSON.customCss;
        document.head.appendChild(style);
    }

    console.log("body done!");

    if (showJSON.backgroundColor[0] < 40 && location.hostname.split('.').shift() === "cms" || showJSON.backgroundColor[0] > 300 && location.hostname.split('.').shift() === "cms") {
        document.head.querySelector(".cmsStyle").innerHTML += "article.selected { outline: 3px solid #0f0; }";
    }
}

function setArticles(keepSelection) {
    console.log("setting articles");
    chatIndex = 0;
    document.body.querySelector(".show").innerHTML = "";
    if (location.hostname.split('.').shift() === "cms") {
        console.log("Setting map IN CMS")
        document.querySelector(".map").innerHTML = "<div class='cmsAvatar'></div>";
        document.querySelector(".cmsAvatar").style.width = (window.innerWidth / mapscale) + "px";
        document.querySelector(".cmsAvatar").style.height = (window.innerHeight / mapscale) + "px";
        document.querySelector(".cmsAvatar").style.left = (window.scrollX / mapscale) + "px";
        document.querySelector(".cmsAvatar").style.top = (window.scrollY / mapscale) + "px";
    } else {
        document.querySelector(".map").innerHTML = "";
        console.log("Setting map outside CMS")
    }

    for (let i=0; i<showJSON.works.length; i++) {
        let json = showJSON.works[i];

        let article = document.createElement("article");
        article.id = "article" + (i);
        article.style.left = json.left + "px";
        article.style.top = json.top + "px";
        article.style.width = json.width + "px";
        article.style.height = json.height + "px";

//        console.log(article);

        if (json.borderless) {
            article.classList.add("borderless");
        }

        if (json.text) {
            article.innerHTML = "<h1>" + json.title + "</h1><p>" + json.description + "</p>";
        }

        if (json.chatbox) {
            article.classList.add("chatbox");
            chatIndex++;
            article.innerHTML = '<div class="FakeTextBar"><div class="FakeTextBox">Chat is off in CMS</div><div class="FakeSendButton">⌲</div></div>';
        }

        if (json.screenshare) {
            article.classList.add("screenshare");
            chatIndex++;
            article.innerHTML = '<h3>Screen sharing frame</h3>';
        }

        if (json.youtube) {
            article.classList.add("youtube");
            article.innerHTML = "<h3>🎬<br>Youtube Embed<br>" + json.url.split("?")[0].substr(30,11) + "</h3>";
        } else if (json.vimeo) {
            article.classList.add("vimeo");
            article.innerHTML = "<h3>🎬<br>Vimeo Embed<br>" + json.url.split("/")[4].split("?")[0] + "</h3>";
        }

        if (json.iframe) {
            article.classList.add("iframe");
            article.innerHTML = "<h3>&lt; &#47; &gt;<br>" + json.url + "</h3>";
        }

        if (json.shape) {
            article.classList.add("shape");
            if (json.shapeType == "rectangle") {
                article.classList.add("rectangle");
                article.style.backgroundColor = "hsl(" + showJSON.works[i].color[0] + "," + showJSON.works[i].color[1] + "%," + showJSON.works[i].color[2] + "%)";
            } else if (json.shapeType == "circle") {
                article.classList.add("circle");
                if (json.portal) {
                    article.classList.add("portal");
                } else {
                    article.style.backgroundColor = "hsl(" + showJSON.works[i].color[0] + "," + showJSON.works[i].color[1] + "%," + showJSON.works[i].color[2] + "%)";
                }
            }
        }

        if (json.image) {
            if (json.url != null && location.hostname.split('.').shift() !== "cms" && json.url != "") {
                article.innerHTML = '<a href="' + json.url + '" target="_blank"><img src="' + json.imageurl + '"></a>';
            } else {
                article.innerHTML = '<img src="' + json.imageurl + '">';
            }
        }

        if (json.puzzle) {
            article.classList.add("puzzle");
            let url;
            url = json.imageurl;
            if (url) {
                url = json.imageurl.replaceAll(' ','%20');
            }
            article.innerHTML = '<div class="boundry"></div><div class="puzzle" style="background-image: url(' + url + ');">';
        }

        if (json.quiz) {
            article.classList.add("quiz");
            article.innerHTML = "<div class='option a' style='width: " + json.height + "px;'>A</div><div class='option b' style='width: " + json.height + "px;'>B</div><div class='questionContainer hidden'><h1>" + json.title + "</h1><div class='question' data-question='0'></div><div class='answer a'></div><div class='answer b'></div></div><div class='button'>...</div>";
        }

        if (json.display_info) {
            article.innerHTML += '<div class="info"><h1>' + json.artist + '</h1><h2>' + json.title + '</h2><p>' + json.description + '<br/><br/><a href="' + json.urlOrig + '" target="_blank" class="extern">LINK</a><br></p></div>';
        }

        document.body.querySelector(".show").appendChild(article);

        if (location.hostname.split('.').shift() === "cms") {
//            console.log("in CMS, adding scaler...");
            let scaler = document.createElement("div");
            scaler.className = "scaler";
            scaler.innerHTML = "⌟";
            article.appendChild(scaler);
            let rotator = document.createElement("div");
            rotator.className = "rotator";
            rotator.innerHTML = "⤴";
            article.appendChild(rotator);
            let posLabel = document.createElement("div");
            posLabel.className = "posLabel";
            posLabel.innerHTML = json.left + "px, " + json.top + "px";
            article.appendChild(posLabel);
        }

        if (showJSON.works[i].rotation) {
            article.style.transform = "rotate(" + showJSON.works[i].rotation + "deg)";
        }


        if (!showJSON.works[i].hideMap) {
            let mapIcon = document.createElement("div");
            mapIcon.className = "mapIcon artmenu menu menu" + (i);
            mapIcon.dataset.id = (i);
            mapIcon.innerHTML = "<p>" + showJSON.works[ i ].artist + "</p>";
            mapIcon.style.top = showJSON.works[ i ].top / mapscale;
            mapIcon.style.left = showJSON.works[ i ].left / mapscale;
            mapIcon.style.width = showJSON.works[ i ].width / mapscale;
            mapIcon.style.height = showJSON.works[ i ].height / mapscale;
//            if (showJSON.works[i].height == "au") {
//                let aspect = document.querySelector("#article" + i + " img").naturalHeight / document.querySelector("#article" + i + " img").naturalWidth;
//                console.log(aspect);
//                console.log(showJSON.works[ i ].width * aspect / mapscale);
//                mapIcon.style.height = showJSON.works[ i ].width * aspect / mapscale + "px";
//            }

            if (window.innerWidth < window.innerHeight) {
                mapIcon.querySelector("p").style.fontSize = "1.4vw";
            }
            document.querySelector(".map").appendChild(mapIcon);

            if (showJSON.works[i].shape) {
                mapIcon.classList.add("shape");
                mapIcon.innerHTML = "";
                if (json.shapeType == "rectangle") {
                    mapIcon.classList.add("rectangle");
                    mapIcon.style.backgroundColor = "hsl(" + showJSON.works[i].color[0] + "," + showJSON.works[i].color[1] + "%," + showJSON.works[i].color[2] + "%)";
                } else if (json.shapeType == "circle" && !json.portal) {
                    mapIcon.classList.add("circle");
                    mapIcon.style.backgroundColor = "hsl(" + showJSON.works[i].color[0] + "," + showJSON.works[i].color[1] + "%," + showJSON.works[i].color[2] + "%)";
                } else if (json.portal) {
                    mapIcon.classList.add("circle");
                    mapIcon.style.backgroundColor = "#000";
                }
            }

            if (showJSON.works[i].rotation) {
                mapIcon.style.transform = "rotate(" + showJSON.works[i].rotation + "deg)";
            }
        }

        if (showJSON.works[i].borderless && showJSON.works[i].hideMap != true || showJSON.works[i].quiz) {
            document.querySelector(".menu" + (i)).style.border = "none";
            document.querySelector(".menu" + (i)).style.background = "none";
//            document.querySelector(".menu" + (i)).style.color = "#fff";
        }

        if (location.hostname.split('.').shift() === "cms") {
            article.addEventListener("contextmenu", showDropdown);
            article.addEventListener("mousedown", findArticle);
            article.addEventListener("mouseup", editEnd);
        }

    }

    if (keepSelection) {
        select(document.getElementById(selected.id));
    }
}
