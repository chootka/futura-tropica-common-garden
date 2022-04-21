let showdata = '/shows/showdata.json';

let mapscale;

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

    if (json.textColor) {
        $( 'body' ).css({
            'height': json.screensize.height + 'px',
            'width': json.screensize.width + 'px',
            'background': "rgb(" + json.backgroundColor[0] + "," + json.backgroundColor[1] + "," + json.backgroundColor[2] + ") none repeat scroll 0% 0%",
            'color': "rgb(" + json.textColor[0] + "," + json.textColor[1] + "," + json.textColor[2] + ")",
        } );
    } else {

        $( 'body' ).css({ 'height': json.screensize.height + 'px', 'width': json.screensize.width + 'px' } );
    }

    console.log('json.screensize.width', json.screensize.width);
    

    mapscale = json.screensize.width / (window.innerWidth / 3);
    console.log("mapscale", mapscale);
    if (window.innerWidth < window.innerHeight) {
        mapscale = json.screensize.width / (window.innerWidth / 1.5);
    }
    let map = document.querySelector(".map");
    map.style.width = (json.screensize.width / mapscale) + "px";
    map.style.height = (json.screensize.height / mapscale) + "px";
    //map.style.height = (window.innerheight / mapscale) + "px";

    if (json.title) {
        document.head.querySelector("title").innerHTML = json.title;
    }

    for ( var i = 0; i < json.works.length; i++ ) {

        let articleHeight = json.works[i].height ? json.works[i].height + 'px' : 'auto';
        let article = $('<div id="artwork' + (i + 1) + '" class="article hidden" style="top: ' + json.works[i].top + 'px; left: ' + json.works[i].left + 'px; width: ' + json.works[i].width + 'px; height: ' + articleHeight + 'px" >');

        if ( json.works[ i ].imagelink || json.works[ i ].image ) {
            if (json.works[i].url != null && json.works[i].url != "") {
                article.append( '<div class="imagelink"><a href="' + json.works[ i ].url + '" target="_blank"><img src="' + json.works[ i ].imageurl + '"></a></div>' );
            } else {
                article.append( '<div class="imagelink"><img src="' + json.works[ i ].imageurl + '"></div>' );
            }
        } else if (json.works[i].text) {
            article.append( "<h1>" + json.works[i].title + "</h1><p>" + json.works[ i ].description + "</p>" );
            article.addClass("text");
        } else if ( json.works[ i ].localVideo ) {
            article.append( '<video src="' + json.works[i].src + '" muted class="iframe"></video>' );
        } else if ( json.works[ i ].youtube || json.works[ i ].vimeo ) {
            // article.attr("data-src", json.works[ i ].url)
            article.append( '<div style="width:' + json.works[ i ].width + 'px; height:' + json.works[ i ].height + 'px" class="iframe"><iframe id="iframe' + (i+1) + '" class="iframe" scrolling="no" frameborder="0" autoplay="true" muted src="' + json.works[ i ].url + '" width="' + json.works[ i ].width + '" height="' + json.works[ i ].height + '"></iframe></div>' );
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

        $( ".content" ).append( article );

    }

    window.setTimeout(function() {
        load();

        document.querySelector(".popUp .enterButton").classList.remove("unloaded");
        document.querySelector(".popUp .enterButton").value = "Enter Futura Tropica";

        if (!json.private) {
            let articles = document.querySelectorAll(".article");
            for (let i=0; i<articles.length; i++) {
                articles[i].classList.remove("hidden");
            }
        }
    }, 50);
});
