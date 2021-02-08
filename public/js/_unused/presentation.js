socket.on("setSlide", function(data) {
    let slideshow = data.slideshow;
    let slide = data.slide;
    console.log("Set active slide for slideshow '" + slideshow + "' to " + slide)
    document.querySelector(".slideshow[data-name='" + slideshow + "'] .activeSlide").classList.remove("activeSlide");
    document.querySelector(".slideshow[data-name='" + slideshow + "'] .slide" + slide).classList.add("activeSlide");
    let controller = document.querySelector(".slideshow[data-name='" + slideshow + "'] .slideshowGUI");
    if (controller) {
        console.log("found controller");
        controller.innerHTML = slideshow + ": Slide " + data.slide + " &nbsp; &nbsp; <span onclick='lastSlide(event)'>[<<]</span> <span onclick='nextSlide(event)'>[>>]</span>";
    }
});

function createControllers() {
    let slideshows = document.querySelectorAll(".slideshow");
    console.log(slideshows, slideshows.length);
    for (let i=0; i<slideshows.length; i++) {
        console.log("Creating controller for slideshow " + slideshows[i].dataset.name);
        let controller = document.createElement("div");
        controller.className = "GUI slideshowGUI";
        controller.innerHTML = slideshows[i].dataset.name + ": Slide " + slideshows[i].querySelector(".activeSlide").dataset.slide + " &nbsp; &nbsp; <span onclick='lastSlide(event)'>[<<]</span> <span onclick='nextSlide(event)'>[>>]</span>";
        slideshows[i].appendChild(controller);
    }
}

function lastSlide(event) {
    let controller = event.target.parentElement;
    let slideshow = event.target.parentElement.parentElement;
    let activeSlide = slideshow.querySelector(".activeSlide");
    console.log("LastSlide clicked for " + event.target.parentElement.parentElement.dataset.name);

    let nextSlide = parseInt(activeSlide.dataset.slide) - 1;
    if (nextSlide >= 0) {
        console.log("Next slide should be " + nextSlide);
        socket.emit("setSlide", { slideshow: slideshow.dataset.name, slide: nextSlide });
    } else {
        console.log("Already at first slide");
    }
}

function nextSlide(event) {
    let controller = event.target.parentElement;
    let slideshow = event.target.parentElement.parentElement;
    let activeSlide = slideshow.querySelector(".activeSlide");
    console.log("LastSlide clicked for " + event.target.parentElement.parentElement.dataset.name);

    let nextSlide = parseInt(activeSlide.dataset.slide) + 1;
    if (nextSlide < slideshow.querySelectorAll(".slide").length) {
        console.log("Next slide should be " + nextSlide);
        socket.emit("setSlide", { slideshow: slideshow.dataset.name, slide: nextSlide });
    } else {
        console.log("Already at last slide");
    }
}

function checkSlideshows() {
    let slideshows = document.querySelectorAll(".slideshow");
    for (let i=0; i<slideshows.length; i++) {
        console.log("Asking server about current slide on slideshow " + i);
        socket.emit("whatSlide", slideshows[i].dataset.name);
    }
}

function setupAutoSlide(id) {
    console.log(id);

    let elem = document.querySelector("#artwork" + id);
    let slideIndex = 0;
    let slides = elem.querySelectorAll(".slide");

    window.setInterval(function() {
        if (slideIndex < slides.length-1) {
            slides[slideIndex].classList.remove("activeSlide");
            slideIndex++;
            slides[slideIndex].classList.add("activeSlide");
        } else {
            slides[slideIndex].classList.remove("activeSlide");
            slideIndex = 0;
            slides[slideIndex].classList.add("activeSlide");
        }
    }, 5000);
}
