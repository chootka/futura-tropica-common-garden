//console.log(subdomain);

let showdata = '/shows/showdata.json';

let mapscale;

let hideTour = false;

let borderWidth = 2;

let portals = [];

console.log("showdata.js, subdomain", subdomain);
if(subdomain) {
    showdata = `/shows/${subdomain}.json`;
}

function doesFileExist(urlToFile) {
    var xhr = new XMLHttpRequest();
    xhr.open('HEAD', urlToFile, false);
    xhr.send();

    if (xhr.status == "404") {
        return false;
    } else {
        return true;
    }
}

$.getJSON(showdata, function( json ) {
    console.log("Got show data", json);

    if (json.private) {
        console.log("this is a private show");

        let pasBox = document.createElement("input");
        pasBox.type = "password";
        pasBox.name = "password"
        pasBox.placeholder = "password"
        pasBox.required = true
        pasBox.className = "password"
        document.querySelector(".popUp form").insertBefore(pasBox, document.querySelector(".popUp form .enterButton"));
    }

    if (json.textColor) {
        $( 'body' ).css({
            'height': '100vh', //json.screensize.height,
            'width': json.screensize.width,
            // 'background': "hsl(" + json.backgroundColor[0] + "," + json.backgroundColor[1] + "%," + json.backgroundColor[2] + "%)",
            'color': "hsl(" + json.textColor[0] + "," + json.textColor[1] + "%," + json.textColor[2] + "%)",
            // 'border-color': "hsl(" + json.borderColor[0] + "," + json.borderColor[1] + "%," + json.borderColor[2] + "%)"
        } );
    } else {
        $( 'body' ).css({ 'height': '100vh', 'width': json.screensize.width } ); //json.screensize.height
    }
    if (json.borderWidth) {
        borderWidth = json.borderWidth;
    }

    if (json.customCss) {
        let style = document.createElement("style");
        style.innerHTML = json.customCss;
        document.head.appendChild(style);
    }

    // if (json.backgroundColor[2] > 75) {
    //     let style = document.createElement("style");
    //     style.innerHTML = ".adminMapUser { background: #000; } .adminMapUser:before { border-color: #000; }";
    //     document.head.appendChild(style);
    // }
    // if (json.backgroundColor[0] < 40 || json.backgroundColor > 300) {
    //     let style = document.createElement("style");
    //     style.innerHTML = ".myMapUser { background: #0f0 !important; } .myMapUser.adminMapUser:before { border-color: #0f0; }";
    //     document.head.appendChild(style);
    // }

    mapscale = json.screensize.width / (window.innerWidth / 3);
    if (window.innerWidth < window.innerHeight) {
        mapscale = json.screensize.width / (window.innerWidth / 1.5);
    }
    let map = document.querySelector(".map");
    map.style.width = (json.screensize.width / mapscale) + "px";
    // map.style.height = (json.screensize.height / mapscale) + "px";
    map.style.height = (window.innerheight / mapscale) + "px";

    if (json.title) {
        document.head.querySelector("title").innerHTML = json.title;
    }

    var jitsiroom = "";

    console.log("json.works?", json.works);
    console.log("json.works.length", json.works.length);

    for ( var i = 0; i < json.works.length; i++ ) {

        console.log("wrk", json.works[i]);

        var article = $('<article id="artwork' + (i + 1) + '" class="posabs artist thing hidden" data-loaded="0" data-id="' + (i + 1) + '" data-type="art" data-src="' + json.works[ i ].url + '" data-name="' + json.works[ i ].title + '">');

        if ( json.works[ i ].imagelink || json.works[ i ].image ) {
            console.log("image", json.works[i].image);
            if (json.works[i].url != null && json.works[i].url != "") {
                article.append( '<div class="imagelink"><a href="' + json.works[ i ].url + '" target="_blank"><img src="' + json.works[ i ].imageurl + '"></a></div>' );
            } else {
                article.append( '<div class="imagelink"><img src="' + json.works[ i ].imageurl + '"></div>' );
            }
        } else if (json.works[i].text) {
            console.log("text", json.works[i].text);
            article.append( "<h1>" + json.works[i].title + "</h1> <p>" + json.works[ i ].description + "</p>" );
            article.addClass("text");
        } else if ( json.works[ i ].slideshow == true ) {
            for (let j=0; j<json.works[i].slides.length; j++) {
                let slide = json.works[i].slides[j];
                console.log(slide);
                let slideElem = document.createElement("div");
                slideElem.className = "slide slide" + j;
                slideElem.dataset.slide = j;
                slideElem.style.backgroundImage = "url(" + slide + ")";
                if (j==0) {
                    slideElem.classList.add("activeSlide");
                }
                article.append(slideElem);
                article.addClass("slideshow");
            }
        }  else if ( json.works[ i ].slideshowLocal == true ) {
            for (let j=0; j<json.works[i].slides.length; j++) {
                let slide = json.works[i].slides[j];
//                console.log(slide);
                let slideElem = document.createElement("div");
                slideElem.className = "slide slide" + j;
                slideElem.dataset.slide = j;
                slideElem.style.backgroundImage = "url(" + slide + ")";
                if (j==0) {
                    slideElem.classList.add("activeSlide");
                }
                article.append(slideElem);
                article.addClass("slideshow slideshowLocal");
            }
        } else if ( json.works[ i ].screenshare == true ) {
            article.append( '<div style="width:' + json.works[ i ].width + 'px; height:' + json.works[ i ].height + 'px" class="iframe screenshare admin1"><div class="label">No active presentation</div></div>' );
            article.addClass("screenshare");
        } else if (json.works[i].shape) {
            article.addClass("shape");
            if (json.works[i].shapeType == "rectangle") {
                article.addClass("rectangle");
            } else if (json.works[i].shapeType == "circle") {
                article.addClass("circle");
                if (json.works[i].portal) {
                    article.addClass("portal");
                    let url = "shows/" + json.works[i].destination + ".json";
                    let id = i+1;
                    let subdomain = json.works[i].destination;
                    fetch(url)
                    .then(response => {
                        if (!response.ok) {
                            console.error("Error: Unable to locale JSON data for the show this portal is linking to!");
                            throw new Error("HTTP error " + response.status);
                        }
                        return response.json();
                    })
                    .then(json => {
                        console.log("got JSON");
                        color = json.backgroundColor;
                        console.log(url, color, id, subdomain);
                        portals.push({
                            "id": "artwork" + id,
                            "destination": subdomain,
                            "color": color,
                            "timer": 0
                        });

                    })
                    .catch(function () {
                       this.dataError = true;
                    })
                }
            }
        } else if ( json.works[ i ].chatbox == true ) {
            article.addClass("chatbox");

            let div = document.createElement("div");
            div.className = "messageContainer";
            article.append(div);

            let form = document.createElement("form");
            form.className = "chatboxControlls";
            form.innerHTML = '<input type="text" placeholder="Type a message..." class="chatboxInput"><input class="chatboxButton" type="submit" value="⌲">';
            form.querySelector(".chatboxInput").pattern = "[^\x3c\x3e\x3b]+";
            form.onsubmit = function(event) {
                event.preventDefault();
                console.log("Submit");
                sendChat(event);
            }
            article.append(form);
        } else if ( json.works[ i ].localVideo ) {
            article.append( '<video src="' + json.works[i].src + '" autoplay muted class="iframe"></video>' );
        } else if ( json.works[ i ].youtube && json.works[ i ].showVolume ) {
            article.append( '<div style="width:' + json.works[ i ].width + 'px; height:' + json.works[ i ].height + 'px" class="iframe"><iframe id="iframe' + (i+1) + '" class="iframe" data-showVolume="true" data-volume="100" scrolling="no" frameborder="0" allow="autoplay" muted width="' + json.works[ i ].width + '" height="' + json.works[ i ].height + '"></iframe></div>' );
        } else if ( json.works[ i ].vimeo && json.works[ i ].showVolume ) {
            article.append( '<div style="width:' + json.works[ i ].width + 'px; height:' + json.works[ i ].height + 'px" class="iframe"><iframe id="iframe' + (i+1) + '" class="iframe" data-showVolume="true" data-volume="1" scrolling="no" frameborder="0" allow="autoplay" muted width="' + json.works[ i ].width + '" height="' + json.works[ i ].height + '"></iframe></div>' );
        } else {
            if (json.works[i].allowScroll) {
                article.append( '<div style="width:' + json.works[ i ].width + 'px; height:' + json.works[ i ].height + 'px" class="iframe"><iframe id="iframe' + (i+1) + '" class="iframe" scrolling="yes" frameborder="0" allow="autoplay" muted width="' + json.works[ i ].width + '" height="' + json.works[ i ].height + '"></iframe></div>' );
            } else {
                article.append( '<div style="width:' + json.works[ i ].width + 'px; height:' + json.works[ i ].height + 'px" class="iframe"><iframe id="iframe' + (i+1) + '" class="iframe" scrolling="no" frameborder="0" allow="autoplay" muted width="' + json.works[ i ].width + '" height="' + json.works[ i ].height + '"></iframe></div>' );
            }
        }

        if(json.works[i].display_info) {
            if (json.works[i].year) {
                article.append( '<div class="info"><h1>' + json.works[ i ].artist + '</h1><h2>' + json.works[ i ].title + ', ' + json.works[ i ].year + '</h2><p>' + json.works[ i ].description + '<br/><br/><a href="' + json.works[ i ].urlOrig + '" target="_blank" class="extern">LINK</a><br></p></div>' );
            } else {
                article.append( '<div class="info"><h1>' + json.works[ i ].artist + '</h1><h2>' + json.works[ i ].title + '</h2><p>' + json.works[ i ].description + '<br/><br/><a href="' + json.works[ i ].urlOrig + '" target="_blank" class="extern">LINK</a><br></p></div>' );
            }

        }

        if (json.works[i].youtubeSync) {
            article.attr("data-youtubeSync", true);
        }
        if (json.works[i].youtube) {
            article.attr("data-youtube", true);
        }
        if (json.works[i].vimeo) {
            article.attr("data-vimeo", true);
        }

        if (json.works[i].blockInteraction) {
            let div = document.createElement("div");
            div.classList.add("mouseBlocker");
            if (json.works[i].youtube) {
                div.addEventListener("click", playTrigger);
            }
            article.append(div);
        }

        if (json.works[i].background) {
            article.css( {
                'top': json.works[ i ].top + 'px',
                'left': json.works[ i ].left + 'px',
                'width': json.works[ i ].width + 'px',
                'height': json.works[ i ].height + 'px',
                'z-index': '1',
                'borderWidth': borderWidth
            });
        } else {
            article.css( {
                'top': json.works[ i ].top + 'px',
                'left': json.works[ i ].left + 'px',
                'width': json.works[ i ].width + 'px',
                'height': json.works[ i ].height + 'px',
                'borderWidth': borderWidth
            });
        }

        if (json.works[i].ownRoom) {
            article.append("<div class='room'></div>");
            staticRooms.push("artwork" + (i+1));
        }

        if (json.works[i].portal) {
            article.css("height", json.works[i].width + "px");
        }
        if (json.works[i].borderless) {
            article.css("backgroundColor", "rgba(0,0,0,0)");
            article.css("border", "none");
            article.addClass("borderless");
        } else if (!json.works[i].screenshare && !json.works[i].chatbox && json.frameBackground) {
            article.css("backgroundColor", "hsl(" + json.frameBackground[0] + "," + json.frameBackground[1] + "%," + json.frameBackground[2] + "%)");
        }

        if (json.works[i].shape && !json.works[i].portal) {
            article.css("backgroundColor", "hsl(" + json.works[i].color[0] + "," + json.works[i].color[1] + "%," + json.works[i].color[2] + "%)");
        }

        if (json.works[i].rotation) {
            article.css("transform", "rotate(" + json.works[i].rotation + "deg)");
        }



        $( ".content" ).append( article );

        if (json.works[i].infoStyle) {
            document.querySelector("#artwork" + (i + 1) + " .info").style = json.works[ i ].infoStyle;
        }
        if (json.works[i].frameStyle) {
            if (document.querySelector("#artwork" + (i + 1) + " div.iframe iframe")) {
                document.querySelector("#artwork" + (i + 1) + " div.iframe iframe").style = json.works[ i ].frameStyle;
            } else {
                document.querySelector("#artwork" + (i + 1)).style += json.works[ i ].frameStyle;
            }
        }

        if (json.works[i].hideMap != true) {
            let mapIcon = document.createElement("div");
            mapIcon.className = "mapIcon artmenu menu menu" + (i + 1);
            mapIcon.dataset.id = (i + 1);
            mapIcon.innerHTML = "<p>" + json.works[ i ].artist + "</p>";
            mapIcon.style.top = json.works[ i ].top / mapscale;
            mapIcon.style.left = json.works[ i ].left / mapscale;
            mapIcon.style.width = json.works[ i ].width / mapscale;
            mapIcon.style.height = json.works[ i ].height / mapscale;
            if (window.innerWidth < window.innerHeight) {
                mapIcon.querySelector("p").style.fontSize = "1.4vw";
            }


            if (json.works[i].shape) {
                mapIcon.classList.add("shape");
                mapIcon.innerHTML = "";
                if (json.works[i].shapeType == "rectangle") {
                    mapIcon.classList.add("rectangle");
                    mapIcon.style.backgroundColor = "hsl(" + json.works[i].color[0] + "," + json.works[i].color[1] + "%," + json.works[i].color[2] + "%)";
                } else if (json.works[i].shapeType == "circle" && !json.works[i].portal) {
                    mapIcon.classList.add("circle");
                    mapIcon.style.backgroundColor = "hsl(" + json.works[i].color[0] + "," + json.works[i].color[1] + "%," + json.works[i].color[2] + "%)";
                } else if (json.works[i].portal) {
                    mapIcon.classList.add("circle");
                    mapIcon.classList.add("portal");
                }
            }

            if (json.works[i].rotation) {
                mapIcon.style.transform = "rotate(" + json.works[i].rotation + "deg)";
            }

            document.querySelector(".map").appendChild(mapIcon);
        }

        if (json.works[i].borderless && json.works[i].hideMap != true) {
            document.querySelector(".menu" + (i + 1)).style.border = "none";
            document.querySelector(".menu" + (i + 1)).style.background = "none";
            document.querySelector(".menu" + (i + 1)).style.color = "hsl(" + json.textColor[0] + "," + json.textColor[1] + "%," + json.textColor[2] + "%)";
        }

        if (json.works[i].slideshowLocal) {
            autoSlideDelay(i+1);
        }

    }

    if (typeof toggleDescriptions === "function") {
         toggleDescriptions();
    }
    window.setTimeout(function() {
        load();
        document.querySelector(".popUp .enterButton").classList.remove("unloaded");
        document.querySelector(".popUp .enterButton").value = "Enter Futura Tropica";

        if (!json.private) {
            let articles = document.querySelectorAll("article");
            for (let i=0; i<articles.length; i++) {
                articles[i].classList.remove("hidden");
            }
        }
    }, 50);
});

function autoSlideDelay(id) {
    window.setTimeout(function() {
        setupAutoSlide(id);
    }, 2000);
}

if(!doesFileExist(showdata)) {
    $( 'body' ).css({ 'height':'10000px', 'width': '10000px' } );

    mapscale = 10000 / (window.innerWidth / 3);
    let map = document.querySelector(".map");
    map.style.width = (10000 / mapscale) + "px";
    map.style.height = (10000 / mapscale) + "px";

    // commented out to remove 404s
    // let bgImages = document.createElement("div");
    // bgImages.className = "backgroundImages";
    // bgImages.innerHTML = '<img class="bgimg well" src="static/bg/well.png"></img> <img class="bgimg tree" src="static/bg/tree.png"></img> <img class="bgimg swing" src="static/bg/swing.png"></img> <img class="bgimg shrub" src="static/bg/shrub.png"></img> <img class="bgimg rocks" src="static/bg/rocks.png"></img> <img class="bgimg seesaw" src="static/bg/seesaw.png"></img> <img class="bgimg pond" src="static/bg/pond.png"></img> <img class="bgimg email" src="static/email.png"></img>';
    // document.body.appendChild(bgImages);
}
