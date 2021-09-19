let subdomain = window.location.search.substr(1,window.location.search.length);
let loading = document.querySelector(".loading");

const socket = io('/');

let showJSON;
let showdata = "../shows/" + subdomain + ".json";
//let mouseX;
let mouseY;
let mouseOffsetX;
let mouseOffsetY;
let scrollOffsetX;
let scrollOffsetY;
let centerX;
let centerY;
let angle;
let angleOffset;
let draging = false;
let dragingMap = false;
let scaling = false;
let scalingMap = false;
let rotating = false;
let rotatingMap = false;
let selected = document.body;
let inspector = document.querySelector(".inspectorBody");
let undoBuffer = [];
let chatIndex;
let startPos = [0,0];
let clipboard;

let code;
let email;
let pass;
let duration;
let expiry;
let template = "empty";
let paymentId;

if(subdomain) {
    socket.emit("checkSubdomainExists", subdomain);
} else {
    let passWindow = document.createElement("div");
    passWindow.className = "fade passWindow";
    passWindow.innerHTML = "<div class='passWindowBox'><p><br><br>Error: No subdomain specified in URL!</p><input name='cancel' type='button' value='Cancel' onclick='exitCMS();' class='centered'></div>"
    document.body.appendChild(passWindow);
}

socket.on("exists", askPass);
socket.on("notExists", setupSubdomain);

function askPass() {
    let passWindow = document.createElement("div");
    passWindow.className = "fade passWindow";
    passWindow.innerHTML = "<div class='passWindowBox'><p>Please enter the password for this subdomain:</p><form><input name='pass' type='password'><p class='warn'>Incorrect password</p><input name='cancel' type='button' value='Cancel' onclick='exitCMS();'><input name='enter' type='submit' value='Enter'></form></div>"
    document.body.appendChild(passWindow);
    let pwForm = document.querySelector(".passWindowBox form");
    pwForm.addEventListener('submit', checkPass);
}

function checkPass(event) {
    event.preventDefault();
    pass = document.querySelector(".passWindowBox form input[type=password]").value;
    console.log("checkPassCMS", subdomain);
    socket.emit("checkPassCMS", subdomain, pass);
}

function setupSubdomain() {
    let passWindow = document.createElement("div");
    passWindow.className = "fade passWindow";
    passWindow.innerHTML = "<div class='passWindowBox'><p>To register, please enter your e-mail address:</p><form><input name='mail' type='email' placeholder='name@provider.com'><input name='cancel' type='button' value='Cancel' onclick='exitCMS();'><input name='enter' type='submit' value='Enter'></form></div>"
    document.body.appendChild(passWindow);
    let pwForm = document.querySelector(".passWindowBox form");
    pwForm.addEventListener('submit', sendEmail);
//    pwForm.addEventListener('submit', setPricing);
}

function sendEmail(event) {
    event.preventDefault();
    email = document.querySelector(".passWindowBox form input[type=email]").value;

    socket.emit("setCodeCMS", email, subdomain);

    let passWindow = document.querySelector(".passWindow");
    passWindow.innerHTML = "<div class='passWindowBox'><p>Please enter the verification sent to your email:</p><form><input name='code' type='text'><input name='cancel' type='button' value='Cancel' onclick='exitCMS();'><input name='enter' type='submit' value='Enter'></form></div>"
    let pwForm = document.querySelector(".passWindowBox form");
    pwForm.removeEventListener('submit', sendEmail);
    pwForm.addEventListener('submit', checkCode);
}

function checkCode(event) {
    event.preventDefault();
    code = document.querySelector(".passWindowBox form input[type=text]").value;
    if (code === null) {
        // replace with correct redirect URL
        window.location.href = "https://" + subdomain + ".common.garden";
    }
    socket.emit("checkCodeCMS", code, subdomain);
}

socket.on("codeOk", function() {
    let passWindow = document.querySelector(".passWindow");
    passWindow.innerHTML = "<div class='passWindowBox'><p>Please chose a pasword for this subdomain:</p><p class='subtext'>(This is the pasword you use to make changes to the page later)</p><form><input name='subPass' type='password' placeholder='password'><input name='subPass2' type='password' placeholder='Confirm password'><p class='warn'>The paswords didn't match!</p><input name='cancel' type='button' value='Cancel' onclick='exitCMS();'><input name='enter' type='submit' value='Enter'></form></div>"
    let pwForm = document.querySelector(".passWindowBox form");
    pwForm.removeEventListener('submit', checkCode);
    pwForm.addEventListener('submit', passSet);
    passWindow.querySelector(".passWindowBox").classList.add("large");
});

function passSet(event) {
    event.preventDefault();
    let passWindow = document.querySelector(".passWindow");
    pass = document.querySelector(".passWindowBox form input[name=subPass]").value;
    pass2 = document.querySelector(".passWindowBox form input[name=subPass2]").value;
    if (pass === pass2) {
        passWindow.innerHTML = "<div class='passWindowBox templates'><p>What kind of page do you want to setup?</p><div class='iconContainer'><p class='icon  quiz'>Trivia Quiz</p><p class='icon  empty selected'>Build your own space</p></div><form><input name='cancel' type='button' value='Cancel' onclick='exitCMS();'><input name='enter' type='submit' value='Enter'></form></div>";
        let templates = document.querySelectorAll(".passWindowBox .iconContainer p");
        for (let i=0; i<templates.length; i++) {
            console.log(templates[i]);
            templates[i].addEventListener("click", selectTemplate);
        }
        let pwForm = document.querySelector(".passWindowBox form");
        pwForm.removeEventListener('submit', passSet);

        // TEMP TO DISABLE PAYMENT
        duration = null;
        expiry = null;
        pwForm.addEventListener('submit', finishSetup);


        // UNCOMENT THIS FOR PAYMENT OPTIONS
//        pwForm.addEventListener('submit', setPricing);

    } else {
        document.querySelector(".passWindowBox form input[name=subPass]").value = "";
        document.querySelector(".passWindowBox form input[name=subPass2]").value = "";
        document.querySelector(".passWindowBox p.warn").classList.add("visibe");
    }
}

function setPricing(event) {
    if (event) {
        event.preventDefault();
    }
    let passWindow = document.querySelector(".passWindow");
    passWindow.innerHTML = "<div class='passWindowBox pricing'><p>Pricing options:</p><form><ul><li><input type='radio' name='duration' id='free' value='free' required checked><label for='free'>Free plan <span class='limitations'>(your garden will be removed after 3 days, with the option to upgrade to a payed plan)</span><p class='price'>€0</p></label></label></li><li><input type='radio' name='duration' id='daily' value='daily'><label for='daily'>Pay per day<span class='limitations'>(Your garden will be removed after the specified date, with the option to extend)</span><p class='price'>€1<span class='duration'>/d</span></p></label></label></li><li><input type='radio' name='duration' id='monthly' value='monthly'><label for='monthly'>Pay per month<span class='limitations'>(Your garden will be removed on the last day of the selected month, with the option to extend)</span><p class='price'>€20<span class='duration'>/m</span></p></label></li></ul><input name='cancel' type='button' value='Cancel' onclick='exitCMS();'><input name='enter' type='submit' value='Next'></form></div>";
    let pwForm = document.querySelector(".passWindowBox form");
    pwForm.removeEventListener('submit', setPricing);
    pwForm.addEventListener('submit', setEndDate);
}

function setEndDate(event) {
    event.preventDefault();
    let radios = event.target.parentElement.querySelectorAll("input[type='radio']");
    for (let i=0; i<radios.length; i++) {
        if (radios[i].checked) {
            console.log(radios[i].value);
            duration = radios[i].value;
            break;
        }
    }

    console.log(duration);
    if (duration == "free") {
        expiry = "trail";
        setTemplate(event);
    } else if (duration == "daily") {
        let passWindow = document.querySelector(".passWindow");
        passWindow.innerHTML = "<div class='passWindowBox pricing'><p>Set an end date:</p><p class='disclaimer'>All dates are GMT+0100</p><form><input type='date'  placeholder='yyyy-MM-dd' required onchange='previewDate()'><p class='date'>Please select a valid date</p><p class='small'>48h before the selected date you wil get an email with the option to extend the use of your garden. If you do nothing, the garden wil be deleted on the selected date and you wil not be charged further.</p><input name='cancel' type='button' value='Back' onclick='setPricing();'><input name='enter' type='submit' value='Next'></form></div>";
        let pwForm = document.querySelector(".passWindowBox form");
        pwForm.removeEventListener('submit', setEndDate);
        pwForm.addEventListener('submit', setTemplate);
    } else {
        let passWindow = document.querySelector(".passWindow");
        passWindow.innerHTML = "<div class='passWindowBox pricing'><p>Set an end date:</p><p class='disclaimer'>All dates are GMT+0100</p><form><select name='month' onchange='previewMonth()'><option value='2'>January</option><option value='3'>February</option><option value='4'>March</option><option value='5'>April</option><option value='6'>May</option><option value='7'>June</option><option value='8'>July</option><option value='9'>August</option><option value='10'>September</option><option value='11'>October</option><option value='12'>November</option><option value='13'>December</option></select><input class='half' type='number' name='year' value='2020' onchange='previewMonth()'><p class='date'>Please select a date</p><p class='small endDate'>&nbsp;</p><p class='small'>48h before the selected date you wil get an email with the option to extend the use of your garden. If you do nothing, the garden wil be deleted on the selected date and you wil not be charged further.</p><input name='cancel' type='button' value='Back' onclick='setPricing();'><input name='enter' type='submit' value='Next'></form></div>";
        let pwForm = document.querySelector(".passWindowBox form");
        previewMonth();
        pwForm.removeEventListener('submit', setEndDate);
        pwForm.addEventListener('submit', setTemplate);
    }
}

function calcDate() {
    console.log("change!");
    console.log();
    if (document.querySelector("form input[type='date']")) {
        let date = document.querySelector("form input[type='date']").value + " 23:59:59 GMT+0100";
        date = new Date(date);
        return(date.getTime());
    } else {
        let month = document.querySelector("form select").value;
        let year = document.querySelector("form input[type='number']").value;
        if (month > 12) {
            month = 1;
            year++;
        }
        let date = year + "-" + month + "-01 00:00:00 GMT+0100";
        console.log(date);
        date = new Date(date);
        console.log(date);
        console.log(date.getTime());
        return(date.getTime());
    }
}

function previewDate () {
    let endDate = calcDate();
    console.log(startDate > endDate)
    if (startDate >= endDate) {
        document.querySelector(".passWindowBox p.date").innerHTML = "Date has to be in the future!";
    } else {
        document.querySelector(".passWindowBox p.date").innerHTML = "Resister for " + ((endDate - startDate) / 86400000) + " days, €" + ((endDate - startDate) / 86400000) + ",00";
    }
}

function previewMonth () {
    let endDate = calcDate();
    let startMonth = new Date(parseInt(startDate));
    let endMonth = new Date(endDate);

    let months = (endMonth.getFullYear()*12 + endMonth.getMonth()) - (startMonth.getFullYear()*12 + startMonth.getMonth()) - 1;

    if (months <= 0) {
        document.querySelector(".passWindowBox p.date").innerHTML = "Select a date more then a month in the future";
        document.querySelector(".passWindowBox p.endDate").innerHTML = "&nbsp;";
    } else {
        document.querySelector(".passWindowBox p.date").innerHTML = "Registered for " + months + " months, €" + (months * 20) + ",00";
        document.querySelector(".passWindowBox p.endDate").innerHTML = "End date set for " + endMonth.toLocaleString('default', { month: 'long' }) + " 1st " + endMonth.getFullYear() + " 00:00:00 GMT+0100";
    }
}

function setTemplate(event) {
    event.preventDefault();

    if (duration == "daily") {
        expiry = calcDate();
        console.log(expiry);
        socket.emit("createDayPayment", expiry, subdomain, pass, email, code, template);
    } else if (duration == "monthly") {
        expiry = calcDate();
        console.log(expiry);
        socket.emit("createMontPayment", expiry, subdomain, pass, email, code, template);
    } else if (duration == "free") {
        expiry = parseInt(startDate) + 259200000;
        console.log(expiry);
    }
}

socket.on("openPayment", function(url,id) {
    console.log(url, id);
    paymentId = id;
    let passWindow = document.querySelector(".passWindow");
    passWindow.innerHTML = "<div class='passWindowBox'><p>Waiting for payment confirmation...</p><br><br><br><p class='small'>A payment portal should automaticaly open in a new tab or window.<br><br>Having trouble?<br><a href='" + url + "' target='_blank'>Click here to (re)open the payment portal</a></div>";
    window.open(url);
});

function finishSetup(event) {
    if (event) {
        event.preventDefault();
    }
    socket.emit("setPass", pass, subdomain, email, code, template, duration, expiry);
}

function selectTemplate(event) {
    let articles = document.querySelectorAll(".passWindowBox .iconContainer p");
    for (let i=0; i<articles.length; i++) {
        articles[i].classList.remove("selected");
    }
    if (event.target.nodeName == "SPAN") {
        event.target.parentElement.classList.add("selected");
    } else {
        event.target.classList.add("selected");
    }
    template = event.target.classList[1];
}

socket.on("passOk", function() {
    checkUrl(subdomain);
    document.querySelector(".passWindow").style.opacity = 0;
    window.setTimeout(function() {
        document.querySelector(".passWindow").style.display = "none";
    }, 500);
});

socket.on("cmsErr", function() {
    alert("Server encountered an error, try again later");
});

socket.on("subdomainTaken", function() {
    let passWindow = document.querySelector(".passWindow");
    if (passWindow != null) {
        // replace redirect URL
        passWindow.innerHTML = "<div class='passWindowBox'><p><br><br><br>This subdomain has been registered by another user.<br><a href='https://common.garden'>Return to main page</a></div>";
    }
});


socket.on("passWrong", function() {
    console.log("passWrong");
    document.querySelector(".passWindowBox form input[type=password]").value = "";
    document.querySelector(".passWindowBox p.warn").classList.add("visibe");
});

socket.on("otherCmsUser", function() {
    console.error("Another user is currently editing this page!");
    document.querySelector(".popUp").innerHTML = "<h1>Another user is editing this page</h1><h2>Make sure this page is not opened anywhere else, then reload the browser.</h2><p><span class='advanced' onclick='document.querySelector(\"p.advanced\").classList.remove(\"hidden\"); this.style.visibility = \"hidden\"'>Advanced Options</span></p><p class='advanced hidden'><span class='advanced' onclick='socket.emit(\"checkSubdomainExists\", \"" + subdomain + "\", true)'>Open Page Anyway</span><br><br>**WARNING**<br><span class='warn'>Opening this page while another user is making changes can cause changes made by both users to be lost.<br></span></p>";
});

//async function checkUrl(subdomain, report) {
//    let url = "shows/" + subdomain + ".json";
//    fetch(url)
//    .then(response => {
//        if (!response.ok) {
//            alert("Error: Unable to locale JSON data for this show!");
//            throw new Error("HTTP error " + response.status);
//        }
//        return response.json();
//    })
//    .then(json => {
//        showJSON = json;
//        saveState = JSON.stringify(showJSON);
//        loadCMS();
//        setBody();
//        setArticles();
//    })
//    .catch(function () {
//       this.dataError = true;
//    })
//}

function loadCMS() {
    console.log("Setting CMS");
    document.body.querySelector(".popUp").style.display = "none";
    document.body.querySelector(".fade").style.background = "rgba(0,0,0,0)";
    window.setTimeout(function() {
        document.body.querySelector(".fade").style.display = "none";
    }, 400);
    document.body.addEventListener("mouseup", editEnd);
    document.body.addEventListener("click", function(event) {
        if (event.button == 0 && event.target.nodeName === "BODY") {
            document.querySelector(".contextmenu.background").classList.remove("active");
            select(document.body);
        }
    });
    document.body.addEventListener("contextmenu",showBodyDropdown);

    document.querySelector(".cmsAvatar").style.width = (window.innerWidth / mapscale) + "px";
    document.querySelector(".cmsAvatar").style.height = (window.innerHeight / mapscale) + "px";
    document.querySelector(".cmsAvatar").style.left = (window.scrollX / mapscale) + "px";
    document.querySelector(".cmsAvatar").style.top = (window.scrollY / mapscale) + "px";

    window.setTimeout(function() {
        select(document.body);
        console.log("Looking for setup...");
        console.log(showJSON.setup);
        if (showJSON.setup == "quiz") {
            console.log("Starting quiz setup tutorial");
            quiz1();
        } else if (showJSON.setup == "party") {
            console.log("Starting party setup tutorial");
            party1();
        }
    }, 500);
}

function showDropdown(event) {
    event.preventDefault();
    document.querySelector(".contextmenu.background").classList.remove("active");
    let contextMenu = document.querySelector(".contextmenu.article");
    contextMenu.style.left = event.pageX + "px";
    contextMenu.style.top = event.pageY + "px";
    contextMenu.classList.add("active");
}

function showBodyDropdown(event) {
    if (event.target.nodeName === "BODY") {
        event.preventDefault();
        document.querySelector(".contextmenu.article").classList.remove("active");
        let contextMenu = document.querySelector(".contextmenu.background");
        contextMenu.style.left = event.pageX + "px";
        contextMenu.style.top = event.pageY + "px";
        contextMenu.classList.add("active");
    }
}

function backward() {
    recordUndo();
    document.querySelector(".contextmenu.article").classList.remove("active");
    let json = showJSON.works[selected.id.substr(7,99999)];
    let index = showJSON.works.indexOf(json);

    showJSON.works.splice(index,1);

    showJSON.works.splice(index-1,0,json);
    setArticles();

    let article = document.querySelector("#article0");
    select(article);
}

function forward() {
    recordUndo();
    document.querySelector(".contextmenu.article").classList.remove("active");
    let json = showJSON.works[selected.id.substr(7,99999)];
    let index = showJSON.works.indexOf(json);

    showJSON.works.splice(index,1);

    showJSON.works.splice(index+1,0,json);
    setArticles();

    let article = document.querySelector("#article0");
    select(article);
}

function back() {
    recordUndo();
    document.querySelector(".contextmenu.article").classList.remove("active");
    let json = showJSON.works[selected.id.substr(7,99999)];
    let index = showJSON.works.indexOf(json);

    showJSON.works.splice(index,1);

    showJSON.works.unshift(json);
    setArticles();

    let article = document.querySelector("#article0");
    select(article);
}

function front() {
    recordUndo();
    document.querySelector(".contextmenu.article").classList.remove("active");
    let json = showJSON.works[selected.id.substr(7,99999)];
    let index = showJSON.works.indexOf(json);

    showJSON.works.splice(index,1);

    showJSON.works.push(json);
    setArticles();

    let article = document.querySelector("#article" + (showJSON.works.length -1));
    select(article);
}


function findArticle(event) {
    document.querySelector(".contextmenu.article").classList.remove("active");
    document.querySelector(".contextmenu.background").classList.remove("active");
    event.preventDefault();
    console.log("looking for article");
    if (!event.article) {
        event.article = event.target;
    }
    if (event.article.nodeName !== "ARTICLE" && event.article.nodeName !== "BODY" && event.article.className !== "scaler" && event.article.className !== "rotator" ) {
        console.log("not article");
        event.article = event.article.parentElement;
        console.log(event.article);
        findArticle(event);
    } else {
        console.log("###### ", event.article.className);
        if (event.article.className == "rotator") {
            console.log("found article TO ROTATE!");
            event.article = event.article.parentElement;
            rotateStart(event);
        } else if (event.article.className == "scaler") {
            console.log("found article TO SCALE!");
            event.article = event.article.parentElement;
            scaleStart(event);
        } else {
            console.log("found article!");
            dragStart(event);
        }
    }
}

function dragStart(event) {
    event.preventDefault();
    recordUndo();
    select(event.article);
    mouseOffsetX = event.clientX - parseInt(event.article.style.left.substr(0,event.article.style.left.length-2));
    mouseOffsetY = event.clientY - parseInt(event.article.style.top.substr(0,event.article.style.top.length-2));
    scrollOffsetX = window.scrollX;
    scrollOffsetY = window.scrollY;
    startPos = [mouseX, mouseY];
    draging = event.article;
    dragingMap = document.querySelector(".menu" + draging.id.substr(7,9999));
}

function editEnd() {
    if (event.target === document.body && !scaling && !rotating) {
        select(document.body);
    }
    if (draging) {
        if (startPos[0] == mouseX && startPos[1] == mouseY) {
            undo(true);
        }
        let JSONid = draging.id.substr(7,9999);
        showJSON.works[JSONid].left = draging.style.left.substr(0,draging.style.left.length -2);
        showJSON.works[JSONid].top = draging.style.top.substr(0,draging.style.top.length -2);
        draging = false;
        setInspector(selected);
    }
    if (scaling) {
        let JSONid = scaling.id.substr(7,9999);
        showJSON.works[JSONid].width = scaling.style.width.substr(0,scaling.style.width.length -2);
        showJSON.works[JSONid].height = scaling.style.height.substr(0,scaling.style.height.length -2);
        scaling = false;
        setInspector(selected);
    }
    if (rotating) {
        let JSONid = rotating.id.substr(7,9999);
        showJSON.works[JSONid].rotation = angle;
        rotating = false;
        setInspector(selected);
    }
}

function scaleStart(event) {
    event.preventDefault();
    recordUndo();
    mouseOffsetX = event.clientX - event.article.clientWidth;
    mouseOffsetY = event.clientY - event.article.clientHeight;
    if (!event.article.style.height) {
        mouseOffsetY = 0;
    }
    scrollOffsetX = window.scrollX;
    scrollOffsetY = window.scrollY;
    scaling = event.article;
    scalingMap = document.querySelector(".menu" + scaling.id.substr(7,9999));
    console.log(scalingMap);
}

function rotateStart(event) {
    event.preventDefault();
    recordUndo();
    let bound = event.article.getBoundingClientRect();
    centerX = bound.left + bound.width/2;
    centerY = bound.top + bound.height/2;
    rotating = event.article;
    rotatingMap = document.querySelector(".menu" + rotating.id.substr(7,9999));
    angleOffset = Math.atan2(centerY - event.clientY, centerX - event.clientX) * 180 / Math.PI;
    if (showJSON.works[rotating.id.substr(7,9999)].rotation) {
        angleOffset -= showJSON.works[rotating.id.substr(7,9999)].rotation;
    }
    console.log(angleOffset);
}

document.onmousemove = function(event) {
    mouseX = event.clientX;
    mouseY = event.clientY;
    if (draging) {
        draging.style.left = mouseX - mouseOffsetX + (window.scrollX - scrollOffsetX) + "px";
        draging.style.top = mouseY - mouseOffsetY + (window.scrollY - scrollOffsetY) + "px";
        dragingMap.style.left = draging.offsetLeft / mapscale + "px";
        dragingMap.style.top = draging.offsetTop / mapscale + "px";
        draging.querySelector(".posLabel").innerHTML = draging.style.left + ", " +draging.style.top
    }
    if (scaling) {
        scaling.style.width = mouseX - mouseOffsetX + (window.scrollX - scrollOffsetX) + "px";
        scalingMap.style.width = (mouseX - mouseOffsetX + (window.scrollX - scrollOffsetX)) / mapscale + "px";
        let JSONid = scaling.id.substr(7,999);
        if (showJSON.works[JSONid].lock16_9) {
            scaling.style.height = Math.round((mouseX - mouseOffsetX + (window.scrollX - scrollOffsetX)) / 16 * 9) + "px";
            scalingMap.style.height = Math.round((mouseX - mouseOffsetX + (window.scrollX - scrollOffsetX)) / 16 * 9 / mapscale) + "px";
        } else if (showJSON.works[JSONid].lock4_3) {
            scaling.style.height = Math.round((mouseX - mouseOffsetX + (window.scrollX - scrollOffsetX)) / 4 * 3) + "px";
            scalingMap.style.height = Math.round((mouseX - mouseOffsetX + (window.scrollX - scrollOffsetX)) / 4 * 3 / mapscale) + "px";
        } else if (showJSON.works[JSONid].lockSrc) {
            scaling.style.height = "auto";
        } else {
            scaling.style.height = mouseY - mouseOffsetY + (window.scrollY - scrollOffsetY) + "px";
            scalingMap.style.height = (mouseY - mouseOffsetY + (window.scrollY - scrollOffsetY)) / mapscale + "px";
        }

        if (scaling.classList.contains("quiz")) {
            scaling.querySelector(".option.a").style.width = scaling.style.height;
            scaling.querySelector(".option.b").style.width = scaling.style.height;
        }
    }
    if (rotating) {
        console.log(centerX,centerY,event.clientX,event.clientY);
        angle = Math.atan2(centerY - event.clientY, centerX - event.clientX) * 180 / Math.PI;
        angle -= angleOffset;
        console.log(angle);
        rotating.style.transform = "rotate(" + angle + "deg)";
        rotatingMap.style.transform = "rotate(" + angle + "deg)";
    }
};

document.onscroll = function(event) {
    if (draging) {
        draging.style.left = mouseX - mouseOffsetX + (window.scrollX - scrollOffsetX) + "px";
        draging.style.top = mouseY - mouseOffsetY + (window.scrollY - scrollOffsetY) + "px";
        dragingMap.style.left = draging.offsetLeft / mapscale + "px";
        dragingMap.style.top = draging.offsetTop / mapscale + "px";
        draging.querySelector(".posLabel").innerHTML = draging.style.left + ", " +draging.style.top
    }
};

function select(article) {
    console.log("select!");
    console.log(article);
    console.log(selected.classList);
    if (selected && selected.classList) {
        selected.classList.remove("selected");
    }
    selected = article;
    selected.classList.add("selected");
    if (article.id != selected.id || selected.nodeName == "BODY") {
        document.querySelector(".contextmenu.article").classList.remove("active");
        setInspector(article);
    }
}

function editText(event) {
    let textArea = document.createElement("textarea");
    textArea.innerHTML = event.target.innerHTML;
    event.target.parentElement.appendChild(textArea);
    event.target.remove();
}

function save() {
    if (JSON.stringify(showJSON) != saveState) {
        socket.emit("updateShow", JSON.stringify(showJSON), pass, subdomain);
        console.log("saved JSON to server");
        saveState = JSON.stringify(showJSON);
        document.querySelector(".saveGUI").classList.add("disabled");
        document.querySelector(".revertGUI").classList.add("disabled");
        document.title = showJSON.title;
    }
}

function revert() {
    if (JSON.stringify(showJSON) != saveState) {
        recordUndo();
        showJSON = JSON.parse(saveState);
        document.querySelector(".saveGUI").classList.add("disabled");
        document.querySelector(".revertGUI").classList.add("disabled");
        setBody();
        setArticles();
    }
    if (selected) {
        setInspector(selected);
    }
}

socket.on("saveShowError", function(err) {
    console.error("Server was unable to save show JSON: ", err);
    alert("Server was unable to save show! (see console for details)");
});

socket.on("saveShowDone", function() {
    console.log("JSON file saved!");
});

function toggleInspector() {
    document.querySelector(".inspector").classList.toggle("hidden");
    document.querySelector(".inspectorPadding").classList.toggle("hidden");
}

function setInspectorPage(page) {
    let contentPages = document.querySelectorAll(".pageContainer");
    let contentPage = document.querySelector(".pageContainer." + page);
    let buttons = document.querySelectorAll(".pageLabel");
    let button = document.querySelector(".pageLabel." + page);

    console.log(contentPages);

    for (let i=0; i<contentPages.length; i++) {
        contentPages[i].classList.remove("active");
        buttons[i].classList.remove("active");
    }

    contentPage.classList.add("active");
    button.classList.add("active");
}

function setInspector(elem) {
    if (elem.nodeName === "BODY") {
        let content = "";
        if (inspector.innerHTML.includes("page2 active")) {
            content = "<div class='pageSelector'><div class='pageLabel page1' onclick='setInspectorPage(\"page1\")'>Style</div><div class='pageLabel page2 active' onclick='setInspectorPage(\"page2\")'>Page</div></div>";
            content += "<div class='pageContainer page1'>";
        } else {
            content = "<div class='pageSelector'><div class='pageLabel page1 active' onclick='setInspectorPage(\"page1\")'>Style</div><div class='pageLabel page2' onclick='setInspectorPage(\"page2\")'>Page</div></div>";
            content += "<div class='pageContainer page1 active'>";
        }
        content += "<h2>Background settings:</h2>"
        content += createColorField("backgroundColor", "Background Color");
        content += createColorField("textColor", "Text Color");
        content += "<h2>Frame settings:</h2>"
        content += "<hr></hr>";
        content += createColorField("borderColor", "Frame Border Color");
        content += createColorField("frameBackground", "Frame Background Color");
        content += createPxField("borderWidth", "Border Thickness", showJSON.borderWidth, "px");
        content += "<hr></hr>";
        content += "<h2>Size of garden:</h2>"
        content += createPxField("showWidth", "Width", showJSON.width, "px");
        content += createPxField("showHeight", "Height", showJSON.height, "px");
        content += "<hr></hr>";
        content += createTextArea("customCss", "Custom CSS<br>(incl. selectors)", showJSON.customCss);
        if (inspector.innerHTML.includes("page2 active")) {
            content += "</div><div class='pageContainer page2 active'>";
        } else {
            content += "</div><div class='pageContainer page2'>";
        }
        content += "<h2>Name for " + subdomain + ".common.garden:</h2>"
        content += "<input type='text' class='h1' name='title' value='" + showJSON.title + "'>";
        content += "<hr></hr>";
        content += "<h2>Visitor count: <span class='tooltip'>?<div class='tooltipPopup'>The total amount of people who have entered the page. This includes people who visited the more than once.</div></span></h2>"
        content += "<h2>" + showJSON.visitors + "</h2>"
        content += "<hr></hr>";
        content += "<h2>Tour settings:</h2>";
        content += createCheckbox("hideTour", "Disable audio tour", showJSON.hideTour);
        content += "<input type='button' value='Record New Audio Tour'>"
        content += "<p class='small'>(Currently non-functional)</p>"
        content += "<hr></hr>";
        content += "<h2>Expiry date for this page:<br>&nbsp;</h2>";
        content += "<h2>No end date set</h2>";
        content += "<p class='small'>In the future, some pages will be registered until a certain date, and payment options wil be shown here to extend the use of a page.</p>";
        content += "<hr></hr>";
        content += "</div>";

        inspector.innerHTML = content;

        let inputs = document.querySelectorAll(".inspector input, .inspector textarea");
        for (let i=0; i<inputs.length; i++) {
            inputs[i].addEventListener("change", updateBodyFromInspector);
        }
        document.querySelector(".deleteGUI").classList.add("inactive");
    } else {

        let index = elem.id.substr(7,elem.id.length);

        inspector.innerHTML = "<h1>Settings for " + elem.id + "</h1>"
        inspector.innerHTML += "<hr></hr>";

        if (showJSON.works[index].text) {
            inspector.innerHTML += createTextFeild("title", "Title", showJSON.works[index].title);
            inspector.innerHTML += createTextFeild("artist", "Artist", showJSON.works[index].artist);
            inspector.innerHTML += createTextArea("description", "Desctiption", showJSON.works[index].description);
            inspector.innerHTML += "<hr></hr>";
            inspector.innerHTML += createCheckbox("borderless", "Hide Border", showJSON.works[index].borderless);
        } else if (showJSON.works[index].chatbox || showJSON.works[index].screenshare) {
            inspector.innerHTML += createTextFeild("artist", "Title", showJSON.works[index].artist);
        } else if (showJSON.works[index].iframe) {
            inspector.innerHTML += createTextFeild("title", "Title", showJSON.works[index].title);
            inspector.innerHTML += createTextFeild("artist", "Artist", showJSON.works[index].artist);
            inspector.innerHTML += createTextArea("description", "Desctiption", showJSON.works[index].description);
            inspector.innerHTML += "<hr></hr>";
            inspector.innerHTML += createTextFeild("url", "Url", showJSON.works[index].url);
            inspector.innerHTML += createTextFeild("urlOrig", "Link", showJSON.works[index].urlOrig);
            inspector.innerHTML += "<hr></hr>";
            inspector.innerHTML += createCheckbox("borderless", "Hide Border", showJSON.works[index].borderless);
            inspector.innerHTML += createCheckbox("display_info", "Show Text", showJSON.works[index].display_info, "If this box is checked, the 'Title', 'Artist' & 'Description' fields are shown on the page below the frame.");
            inspector.innerHTML += createCheckbox("allowScroll", "Scrollable", showJSON.works[index].allowScroll);
            inspector.innerHTML += createCheckbox("blockInteraction", "Block Interaction", showJSON.works[index].blockInteraction, "If this box is checked, users wil not be able to interact with the content of this frame.");
        } else if (showJSON.works[index].youtube) {
            inspector.innerHTML += createTextFeild("title", "Title", showJSON.works[index].title);
            inspector.innerHTML += createTextFeild("artist", "Artist", showJSON.works[index].artist);
            inspector.innerHTML += createTextArea("description", "Desctiption", showJSON.works[index].description);
            inspector.innerHTML += "<hr></hr>";
            inspector.innerHTML += createDropdown("INTERCEPT_videoType", "Video Type", ["YouTube", "Vimeo"], showJSON.works[index].videoType);
            inspector.innerHTML += createTextFeild("url", "YouTube ID", showJSON.works[index].url.split("?")[0].substr(30,11));
            inspector.innerHTML += createCheckbox("youtubeSync", "Sync Video", showJSON.works[index].youtubeSync, "If this box is checked, the video wil automatically be synchronised so that all visitors are seeing the same point in the video.");
            inspector.innerHTML += createCheckbox("showVolume", "Show Volume Controll", showJSON.works[index].showVolume, "If this box is checked, users can adjust the volume of this YouTube video.");
            inspector.innerHTML += "<hr></hr>";
            inspector.innerHTML += createCheckbox("borderless", "Hide Border", showJSON.works[index].borderless);
            inspector.innerHTML += createCheckbox("display_info", "Show Text", showJSON.works[index].display_info, "If this box is checked, the 'Title', 'Artist' & 'Description' fields are shown on the page below the frame.");
            inspector.innerHTML += createCheckbox("blockInteraction", "Block Interaction", showJSON.works[index].blockInteraction, "If this box is checked, users wil not be able to interact with the content of this frame.");
        } else if (showJSON.works[index].vimeo) {
            inspector.innerHTML += createTextFeild("title", "Title", showJSON.works[index].title);
            inspector.innerHTML += createTextFeild("artist", "Artist", showJSON.works[index].artist);
            inspector.innerHTML += createTextArea("description", "Desctiption", showJSON.works[index].description);
            inspector.innerHTML += "<hr></hr>";
            inspector.innerHTML += createDropdown("INTERCEPT_videoType", "Video Type", ["Vimeo", "YouTube"], showJSON.works[index].videoType);
            inspector.innerHTML += createTextFeild("url", "Vimeo ID", showJSON.works[index].url.split("/")[4].substr(0,9));
            inspector.innerHTML += createCheckbox("youtubeSync", "Sync Video", showJSON.works[index].youtubeSync, "If this box is checked, the video wil automatically be synchronised so that all visitors are seeing the same point in the video.");
            inspector.innerHTML += createCheckbox("showVolume", "Show Volume Controll", showJSON.works[index].showVolume, "If this box is checked, users can adjust the volume of this YouTube video.");
            inspector.innerHTML += "<hr></hr>";
            inspector.innerHTML += createCheckbox("borderless", "Hide Border", showJSON.works[index].borderless);
            inspector.innerHTML += createCheckbox("display_info", "Show Text", showJSON.works[index].display_info, "If this box is checked, the 'Title', 'Artist' & 'Description' fields are shown on the page below the frame.");
            inspector.innerHTML += createCheckbox("blockInteraction", "Block Interaction", showJSON.works[index].blockInteraction, "If this box is checked, users wil not be able to interact with the content of this frame.");
        } else if (showJSON.works[index].image) {
            inspector.innerHTML += createTextFeild("title", "Title", showJSON.works[index].title);
            inspector.innerHTML += createTextFeild("artist", "Artist", showJSON.works[index].artist);
            inspector.innerHTML += createTextFeild("url", "Link", showJSON.works[index].url);
            inspector.innerHTML += createTextArea("description", "Desctiption", showJSON.works[index].description);
            inspector.innerHTML += "<hr></hr>";
            inspector.innerHTML += createUploadForm("imageurl", "Image", showJSON.works[index].imageurl);
            inspector.innerHTML += createCheckbox("lockSrc", "Scale proportionaly", showJSON.works[index].lockSrc);
            inspector.innerHTML += "<hr></hr>";
            inspector.innerHTML += createCheckbox("borderless", "Hide Border", showJSON.works[index].borderless);
            inspector.innerHTML += createCheckbox("display_info", "Show Text", showJSON.works[index].display_info, "If this box is checked, the 'Title', 'Artist' & 'Description' fields are shown on the page below the frame.");
        } else if (showJSON.works[index].slideshowLocal) {
            inspector.innerHTML += createTextFeild("title", "Title", showJSON.works[index].title);
            inspector.innerHTML += createTextFeild("artist", "Artist", showJSON.works[index].artist);
            inspector.innerHTML += createTextArea("description", "Desctiption", showJSON.works[index].description);
            inspector.innerHTML += "<hr></hr>";
            inspector.innerHTML += createSlideshow("slides", "Slideshow Images", showJSON.works[index].slides, index);
            inspector.innerHTML += "<hr></hr>";
            inspector.innerHTML += createCheckbox("borderless", "Hide Border", showJSON.works[index].borderless);
            inspector.innerHTML += createCheckbox("display_info", "Show Text", showJSON.works[index].display_info, "If this box is checked, the 'Title', 'Artist' & 'Description' fields are shown on the page below the frame.");
        } else if (showJSON.works[index].quiz) {
            inspector.innerHTML += createTextFeild("title", "Title", showJSON.works[index].title);
            inspector.innerHTML += createTextFeild("artist", "Artist", showJSON.works[index].artist);
            inspector.innerHTML += "<hr></hr>";
            inspector.innerHTML += createQuestions("questions", "Quiz Questions", showJSON.works[index].questions, index);
            inspector.innerHTML += "<hr></hr>";
        } else if (showJSON.works[index].puzzle) {
            inspector.innerHTML += createTextFeild("title", "Title", showJSON.works[index].title);
            inspector.innerHTML += createTextFeild("artist", "Artist", showJSON.works[index].artist);
            inspector.innerHTML += createTextArea("description", "Desctiption", showJSON.works[index].description);
            inspector.innerHTML += "<hr></hr>";
            inspector.innerHTML += createUploadForm("imageurl", "Image", showJSON.works[index].imageurl);
            inspector.innerHTML += createPxField("segmentsX", "Pices Horizontal", showJSON.works[index].segmentsX, "No.");
            inspector.innerHTML += createPxField("segmentsY", "Pices Vertical", showJSON.works[index].segmentsY, "No.");
            inspector.innerHTML += "<hr></hr>";
            inspector.innerHTML += createCheckbox("display_info", "Show Text", showJSON.works[index].display_info, "If this box is checked, the 'Title', 'Artist' & 'Description' fields are shown on the page below the frame.");
        } else if (showJSON.works[index].shape && !showJSON.works[index].portal) {
            inspector.innerHTML += createDropdown("shapeType", "Shape", ["rectangle", "circle"], showJSON.works[index].shapeType);
            inspector.innerHTML += createColorField("color", "Color", showJSON.works[index].color);
        } else if (showJSON.works[index].portal) {
            inspector.innerHTML += createTextFeild("destination", "Destination", showJSON.works[index].destination);
        } else {
            inspector.innerHTML += createTextFeild("title", "Title", showJSON.works[index].title);
            inspector.innerHTML += createTextFeild("artist", "Artist", showJSON.works[index].artist);
            inspector.innerHTML += "<hr></hr>";
            inspector.innerHTML += createTextFeild("url", "Url", showJSON.works[index].url);
            inspector.innerHTML += createTextFeild("urlOrig", "Link", showJSON.works[index].urlOrig);
        }

        inspector.innerHTML += createCheckbox("ownRoom", "Has Own Audio Room (experimental)", showJSON.works[index].ownRoom, "Checking this box will automatically create an audio connection between all users in close proximity to this element.");
        inspector.innerHTML += createCheckbox("hideMap", "Hide On Map", showJSON.works[index].hideMap, "Checking this box will stop this element from showing up on the map in the top-left of the screen.");
        inspector.innerHTML += createCheckbox("background", "Background Element", showJSON.works[index].background, "If this box is checked, user avatars wil move over instead of below this frame.");
        inspector.innerHTML += "<hr></hr>";
        inspector.innerHTML += createPxField("width", "Width", showJSON.works[index].width, "px");
        if (!showJSON.works[index].lock16_9 && !showJSON.works[index].lock4_3 && !showJSON.works[index].lockSrc) {
            inspector.innerHTML += createPxField("height", "Height", showJSON.works[index].height, "px");
        }

        inspector.innerHTML += createPxField("left", "X Position", showJSON.works[index].left, "px");
        inspector.innerHTML += createPxField("top", "Y Potition", showJSON.works[index].top, "px");
        inspector.innerHTML += createPxField("rotation", "Rotation", showJSON.works[index].rotation, "º");

        if (!showJSON.works[index].lockSrc) {

            inspector.innerHTML += "<hr></hr>";
            inspector.innerHTML += createCheckbox("lock16_9", "Lock to 16:9 aspect ratio", showJSON.works[index].lock16_9, "Checking this box wil force this frame to stay in a 16:9 (widescreen video) aspect ratio while resizing.");
            inspector.innerHTML += createCheckbox("lock4_3", "Lock to 4:3 aspect ratio", showJSON.works[index].lock4_3, "Checking this box wil force this frame to stay in a 4:3 aspect ratio while resizing.");
        }

//        inspector.innerHTML += "<hr></hr>";
//        inspector.innerHTML += createTextArea("frameStyle", "Custom CSS", showJSON.works[index].frameStyle);

        let inputs = document.querySelectorAll(".inspector input, .inspector textarea, .inspector select");
        for (let i=0; i<inputs.length; i++) {
            if (inputs[i].type != "file") {
                inputs[i].addEventListener("change", function(e) {
                    updateArticleFromInspector(e, index);
                });
//                console.log("not a file: " + inputs[i].type);
            } else {
//                inputs[i].addEventListener("change", function(e) {
//                    sendImageToServer(e, index, inputs[i].files[0]);
//                });
            }
        }
        document.querySelector(".deleteGUI").classList.remove("inactive");
    }
}

function sendImageToServer(e, index, file) {
    console.log(file);

    if(file.size > 5242880){
        alert("Error: The file you are uploading is more then 5MB");
        return false;
    };

    var formData = new FormData();

    formData.append("subdomain", subdomain);
    formData.append("filetoupload", file);

    var request = new XMLHttpRequest();
    request.open("POST", "/fileupload");
    request.send(formData);

    request.onload = function() {
        console.log("File saved!");
        if (showJSON.works[index].image) {
            showJSON.works[index].imageurl = "shows/" + subdomain + "/" + file.name;
            updateArticleFromInspector(e, index);
        } else if (showJSON.works[index].slideshowLocal) {
            showJSON.works[index].slides.push("shows/" + subdomain + "/" + file.name.replaceAll(" ", "%20"));
            updateArticleFromInspector(e, index);
        }
        setInspector(selected);
    }
}

function updateBodyFromInspector(event) {
    recordUndo();
    if (event.target.name.includes(".")) {
        let colorType = event.target.name.split(".")[0];
        let colorPart = event.target.name.split(".")[1];
        console.log(colorType, colorPart);

        let inspectorElem = document.querySelector(".inspector .color." + colorType);
        let pickerH = inspectorElem.querySelector(".colorSlider.h");
        let pickerS = inspectorElem.querySelector(".colorSlider.s");
        let pickerL = inspectorElem.querySelector(".colorSlider.l");
        let pickerHex = inspectorElem.querySelector(".hexValue");
        let preview = inspectorElem.querySelector(".preview");

        if (colorPart == "hex") {
            let color = hexToHsl(event.target.value);
            showJSON[colorType][0] = color[0];
            showJSON[colorType][1] = color[1];
            showJSON[colorType][2] = color[2];
            pickerH.value = color[0];
            pickerS.value = color[1];
            pickerL.value = color[2];
        } else {
            showJSON[colorType][colorPart] = event.target.value;
        }

        console.log("Set showJSON." + event.target.name + " to " + event.target.value);

        if (inspectorElem) {
            preview.style.background = "hsl(" + showJSON[colorType][0] + "," + showJSON[colorType][1] + "%," + showJSON[colorType][2] + "%)";

            pickerS.style.background = "linear-gradient(to left, hsl(" + showJSON[colorType][0] + ", 100%, 50%) 4%, hsl(0, 0%, " + showJSON[colorType][2] + "%) 96%)";
            pickerL.style.background = "linear-gradient(to left, #fff 4%, hsl(" + showJSON[colorType][0] + ", " + showJSON[colorType][1] + "%, 50%) 50%, #000 96%)";
            pickerHex.value = hslToHex(showJSON[colorType][0],showJSON[colorType][1],showJSON[colorType][2]);
        }
    } else if (event.target.name == "showWidth") {
        showJSON.screensize.width = event.target.value;
        console.log("Set showJSON.screensize.width to " + event.target.value);
    } else if (event.target.name == "showHeight") {
        showJSON.screensize.height = event.target.value;
        console.log("Set showJSON.screensize.height to " + event.target.value);
    } else if (event.target.type == "checkbox") {
        if (event.target.checked) {
            showJSON[event.target.name] = true;
            console.log("Set showJSON." + event.target.name + " to false");
        } else {
            showJSON[event.target.name] = false;
            console.log("Set showJSON." + event.target.name + " to false");
        }
    } else {
        showJSON[event.target.name] = event.target.value;
        console.log("Set showJSON." + event.target.name + " to " + event.target.value);
    }
    setBody();
}

function updateArticleFromInspector(event,id) {
    recordUndo(true);
    let value = event.target.value;
    console.log(value);

    if (event.target.nodeName == "TEXTAREA") {
        // still need to replace linebreaks with <br> element here
    }

    if (event.target.name.includes("INTERCEPT_videoType")) {
        if (value == "YouTube") {
            showJSON.works[id].youtube = true;
            delete showJSON.works[id].vimeo;
        } else if (value == "Vimeo") {
            delete showJSON.works[id].youtube;
            showJSON.works[id].vimeo = true;
        }
        setInspector(selected);
    }
    if (event.target.parentElement.classList.contains("YouTube")) {

        console.log("Updating YouTube URL");
        if (value.includes("youtube.com/watch")) {
            value = value.split("watch?v=")[1].split("&")[0];
        } else if (value.includes("youtube.com/embed")) {
            value = value.split("/embed/")[1].split("\"")[0].split("?")[0];
        } else if (value.includes("youtu.be")) {
            value = value.split("youtu.be/")[1].split("?")[0];
        }

        value = "https://www.youtube.com/embed/" + value + "?autoplay=1&controls=0&rel=0&enablejsapi=1&playsinline=1";
        window.setTimeout(function() {
            setInspector(selected);
        }, 100);
    }
    if (event.target.parentElement.classList.contains("Vimeo")) {

        console.log("Updating Vimeo URL");
        if (value.includes("player.vimeo.com/video/")) {
            value = value.split("player.vimeo.com/video/")[1].split("?")[0].split("\"")[0];
        } else if (value.includes("vimeo.com/")) {
            value = value.split("vimeo.com/")[1].split("?")[0].split("#")[0];
        }
        console.log("Id: " + value);

        value = "https://player.vimeo.com/video/" + value + "?autoplay=true&controls=true&loop=true&playsinline=true&title=false&muted=false&autopause=false";
        window.setTimeout(function() {
            setInspector(selected);
        }, 100);
    }

    if (event.target.classList.contains("quiz")) {
        console.log("Update quiz");

        let target = event.target.name.split("-");
        showJSON.works[id][target[0]][target[1]][target[2]] = value;
        console.log("Set showJSON.works[" + id + "]." + event.target.name + " to " + value);
    } else if (event.target.name.includes(".")) {
        let colorType = event.target.name.split(".")[0];
        let colorPart = event.target.name.split(".")[1];

        if (colorPart == "hex") {
            let color = hexToHsl(event.target.value);
            showJSON.works[id][colorType][0] = color[0];
            showJSON.works[id][colorType][1] = color[1];
            showJSON.works[id][colorType][2] = color[2];
        } else {
            console.log(showJSON.works[id][colorType][colorPart] = event.target.value);
        }

        let inspectorElem = document.querySelector(".inspector .color." + colorType);
        let pickerH = inspectorElem.querySelector(".colorSlider.h");
        let pickerS = inspectorElem.querySelector(".colorSlider.s");
        let pickerL = inspectorElem.querySelector(".colorSlider.l");
        let pickerHex = inspectorElem.querySelector(".hexValue");
        let preview = inspectorElem.querySelector(".preview");

        if (inspectorElem) {
            preview.style.background = "hsl(" + showJSON.works[id][colorType][0] + "," + showJSON.works[id][colorType][1] + "%," + showJSON.works[id][colorType][2] + "%)";

            pickerS.style.background = "linear-gradient(to left, hsl(" + showJSON.works[id][colorType][0] + ", 100%, 50%) 4%, hsl(0, 0%, " + showJSON.works[id][colorType][2] + "%) 96%)";
            pickerL.style.background = "linear-gradient(to left, #fff 4%, hsl(" + showJSON.works[id][colorType][0] + ", " + showJSON.works[id][colorType][1] + "%, 50%) 50%, #000 96%)";
            pickerHex.value = hslToHex(showJSON.works[id][colorType][0],showJSON.works[id][colorType][1],showJSON.works[id][colorType][2]);
        }
    } else if (event.target.type == "checkbox") {
        if (event.target.checked) {
            console.log("Checked checkbox!");
            showJSON.works[id][event.target.name] = true;
            console.log("Set showJSON.works[" + id + "]." + event.target.name + " to true");
            if (event.target.name == "lock16_9") {
                showJSON.works[id].height = Math.round(showJSON.works[id].width / 16 * 9);
                console.log("Updated height");
            } else if (event.target.name == "lock4_3") {
                showJSON.works[id].height = Math.round(showJSON.works[id].width / 4 * 3);
                console.log("Updated height");
            } else if (event.target.name == "lockSrc") {
                showJSON.works[id].height = "auto";
            }
        } else {
            showJSON.works[id][event.target.name] = false;
            console.log("Set showJSON.works[" + id + "]." + event.target.name + " to false");
            if (event.target.name == "lockSrc") {
                showJSON.works[id].height = document.querySelector("#article" + id).clientHeight;
            }
        }
    } else if (event.target.name == "width") {
        showJSON.works[id][event.target.name] = value;
        if (showJSON.works[id].lock16_9) {
            showJSON.works[id].height = Math.round(value / 16 * 9);
        } else if (showJSON.works[id].lock4_3) {
            showJSON.works[id].height = Math.round(value / 4 * 3);
        }
        console.log("Set showJSON.works[" + id + "]." + event.target.name + " to " + value);
    } else if (event.target.name != "filetoupload") {
        showJSON.works[id][event.target.name] = value;
        console.log("Set showJSON.works[" + id + "]." + event.target.name + " to " + value);
    }

    setArticles(true);
    console.log("## UPDATED ARTICLES!");
}

function createColorField(property, name, value, tooltip) {
    if (!value) {
        value = showJSON[property];
    }
    let elem = "<div class='color " + property + "' data-value='" + value + "'>"
    if (tooltip) {
        elem += "<h3 onclick='togglePicker(this);'>" + name + ": <span class='tooltip'>?<div class='tooltipPopup'>" + tooltip + "</div></span></h3>";
    } else {
        elem += "<h3 onclick='togglePicker(this);'>" + name + ":</h3>";
    }
    elem += "<div onclick='togglePicker(this);' class='preview' style='background: hsl(" + value[0] + "," + value[1] + "%," + value[2] + "%)' ></div>";
    elem += "<div class='picker'>";
    elem += "<input class='colorSlider h' type='range' min='0' max='360' name='" + property + ".0' value='" + value[0] + "'>"
    elem += "<input class='colorSlider s' type='range' min='0' max='100' name='" + property + ".1' value='" + value[1] + "' style='background: linear-gradient(to left, hsl(" + value[0] + ", 100%, 50%) 4%, hsl(0, 0%, " + value[2] + "%) 96%);'>"
    elem += "<input class='colorSlider l' type='range' min='0' max='100' name='" + property + ".2' value='" + value[2] + "' style='background: linear-gradient(to left, #fff 4%, hsl(" + value[0] + ", " + value[1] + "%, 50%) 50%, #000 96%);'>"
    elem += "<div class='hex'><div class='hexStart'>#</div><input type='text' maxlength='6' value='" + hslToHex(value[0],value[1],value[2]) + "' name='" + property + ".hex' class='hexValue'></div>";
    elem += "</div></div>"
    return elem;
}

function createPxField(property, name, value, unit, tooltip) {
    let elem = "<div class='px " + property + "'>"
    if (tooltip) {
        elem += "<h3>" + name + ": <span class='tooltip'>?<div class='tooltipPopup'>" + tooltip + "</div></span></h3>";
    } else {
        elem += "<h3>" + name + ":</h3>";
    }
    if (value == null) {
        value = "";
    }

    if (property == "showWidth") {
        elem += "<input type='number' class='px' name='" + property + "' value='" + showJSON.screensize.width + "'><div class='pxEnd'>" + unit + "</div>";
    } else if (property == "showHeight") {
        elem += "<input type='number' class='px' name='" + property + "' value='" + showJSON.screensize.height + "'><div class='pxEnd'>" + unit + "</div>";
    } else {
        elem += "<input type='number' class='px' name='" + property + "' value='" + value + "'><div class='pxEnd'>" + unit + "</div>";
    }

    elem += "</div>";
    return elem;
}

function createDropdown(property, name, options, value, tooltip) {
    let elem = "<div class='dropdown " + property + "'>"
    if (tooltip) {
        elem += "<h3>" + name + ": <span class='tooltip'>?<div class='tooltipPopup'>" + tooltip + "</div></span></h3>";
    } else {
        elem += "<h3>" + name + ":</h3>";
    }
    if (value == null) {
        value = "";
    }

    elem += "<select class='dropdown' name='" + property + "'>";
    for (let i=0; i<options.length; i++) {
        console.log("Creating " + options[i] + " option, current is " + value);
        if (value == options[i]) {
            console.log("same, selecting this option!");
            elem += "<option value='" + options[i] + "' class='" + options[i] + "' selected>" + options[i] + "</option>";
        } else {
            console.log("no match");
            elem += "<option value='" + options[i] + "' class='" + options[i] + "'>" + options[i] + "</option>";
        }
    }
    elem += "</div>";
    return elem;
}

function createTextFeild(property, name, value, tooltip) {
    let elem = "<div class='text " + property + " " + name + "'>";
    if (value == null) {
        value = "";
    }
    if (tooltip) {
        elem += "<h3>" + name + ": <span class='tooltip'>?<div class='tooltipPopup'>" + tooltip + "</div></span></h3>";
    } else {
        elem += "<h3>" + name + ":</h3>";
    }
    elem += "<input type='text' class='text' name='" + property + "' value='" + value + "'>";
    elem += "</div>";
    return elem;
}

function createTextArea(property, name, value, tooltip) {
    let elem = "<div class='textarea " + property + " " + name + "'>";
    if (value == null) {
        value = "";
    } else {
//        console.log("was defined");
    }

    if (tooltip) {
        elem += "<h3>" + name + ": <span class='tooltip'>?<div class='tooltipPopup'>" + tooltip + "</div></span></h3>";
    } else {
        elem += "<h3>" + name + ":</h3>";
    }
    elem += "<textarea class='text' name='" + property + "'>" + value + "</textarea>";
    elem += "</div>";
    return elem;
}

function createCheckbox(property, name, value, tooltip) {
    let elem = "<div class='text " + property + "'>";
    if (tooltip) {
        elem += "<label for='checkbox_" + property + "''>" + name + ": <span class='tooltip'>?<div class='tooltipPopup'>" + tooltip + "</div></span></label>";
    } else {
        elem += "<label for='checkbox_" + property + "''>" + name + ":</label>";
    }
    if (value) {
        elem += "<input type='checkbox' class='bool' name='" + property + "' id='checkbox_" + property + "' checked>";
    } else {
        elem += "<input type='checkbox' class='bool' name='" + property + "' id='checkbox_" + property + "'>";
    }
    elem += "</div>";
    return elem;
}

function createUploadForm(property, name, value) {
    let elem = '<form action="return false;">';
    console.log(value);
    if (value) {
        elem += '<label for="filetoupload" class="filename">' + value.split("/")[value.split("/").length-1] + '</label>'
    } else {
        elem += '<label for="filetoupload" class="filename">No image uploaded yet</label>'
    }
    elem += '<input type="file" name="filetoupload" value="test.jpg" accept=".jpg, .jpeg, .png, .gif, .svg" onchange="sendImageToServer(event, ' + selected.id.substr(7,999) + ', document.querySelector(\'input[type=file]\').files[0]);"><br>';
    elem += '<p class="small">Max size 5MB, suported files are .jpg, .jpeg, .png, .gif & .svg.</p>';
    elem += '</form>';
    return elem;
}

function createSlideshow(property, name, value, index) {
    let previewWidth;
    if (showJSON.works[index].width > showJSON.works[index].height) {
        previewWidth = "calc(33% - 13px)";
    } else {
        previewWidth = "calc(25% - 13px)";
    }
    let previewHeight = showJSON.works[index].height/showJSON.works[index].width*100;
    console.log(previewHeight);

    let elem = "<h3>" + name + ":</h3>";
    elem += "<div class='inspectorImageContainer'>";
    for (let i=0; i<value.length; i++) {
        let slide = value[i];
        elem += "<div class='inspectorImagePreviewContainer' style='background-image: url(" + slide + "); width: " + previewWidth + ";'><div class='inspectorImagePreview' style='background-image: url(" + slide + "); padding-top: " + Math.round(previewHeight) + "%;'></div><span class='remove' onclick='recordUndo(); showJSON.works[" + index + "].slides.splice(" + i + ",1); setInspector(selected);'>✕</span></div>"
    }
    elem += '<input id="slideshowFile" type="file" name="filetoupload" value="test.jpg" accept=".jpg, .jpeg, .png, .gif" onchange="sendImageToServer(event, ' + selected.id.substr(7,999) + ', document.querySelector(\'input[type=file]\').files[0]);" hidden>';
    elem += "<label for='slideshowFile' class='inspectorImagePreviewContainer new' style='width: " + previewWidth + "'><div class='inspectorImagePreview' style='padding-top: " + Math.round(previewHeight) + "%;'></div></label>"
    elem += "</div>";
    elem += '<p class="small">Max size 5MB, suported files are .jpg, .jpeg, .png & .gif.</p>';
    return elem;
}

function createQuestions(property, name, value, index) {
    let elem = "<h3>" + name + ":</h3>";
    elem += "<div class='inspectorQuestionContainer'>";
    for (let i=0; i<value.length; i++) {
        let question = value[i][0];
        let optionA = value[i][1];
        let optionB = value[i][2];
        let answer = value[i][3];
        let a = "";
        let b = "";

        if (answer == 1) {
            a = "checked";
        } else if (answer == 2) {
            b = "checked";
        }
        elem += "<h2><span>Question " + (i+1) + "</span></h2>";
        elem += "<div class='inspectorQuestion'>";
        elem += "<h3>Question:</h3>";
        elem += "<textarea class='quiz question' name='" + property + "-" + i + "-0'>" + question + "</textarea>";
        elem += "</div>";
        elem += "<div class='inspectorQuestion answer'>";
        elem += "<h3>Answer A:</h3>";
        elem += "<textarea class='quiz answerA' name='" + property + "-" + i + "-1'>" + optionA + "</textarea>";
        elem += "</div>";
        elem += "<div class='inspectorQuestion answer'>";
        elem += "<h3>Answer B:</h3>";
        elem += "<textarea class='quiz answerB' name='" + property + "-" + i + "-2'>" + optionB + "</textarea>";
        elem += "</div>";
        elem += "<div class='inspectorQuestion radios'>";
        elem += "<h3>Correct Answer:</h3>";
        elem += "<input class='quiz correctAnswer' type='radio' name='" + property + "-" + i + "-3' value='2' id='anwer_" + i + "_B' name='answer_" + i + "' " + b + ">";
        elem += "<label for='anwer_" + i + "_B'>B</label>";
        elem += "<input class='quiz correctAnswer' type='radio' name='" + property + "-" + i + "-3' value='1' id='anwer_" + i + "_A' name='answer_" + i + "' " + a + ">";
        elem += "<label for='anwer_" + i + "_A'>A</label>";
        elem += "</div>";
        elem += "<div class='inspectorQuestion delete'>";
        elem += "<input class='quiz delete' type='button' value='Remove Question' onclick='recordUndo(); showJSON.works[" + index + "].questions.splice(" + i + ",1); setInspector(selected);'>";
        elem += "</div>";
    }

    elem += "";
    elem += "<h2><span>Question " + (value.length+1) + "</span></h2>";
    elem += "<div class='inspectorQuestion delete'>";
    elem += "<input class='quiz add' type='button' value='Add Question " + (value.length+1) + "' onclick='recordUndo(); showJSON.works[" + index + "].questions.push([\"Question\",\"Answer A\", \"Answer B\", 1]); setInspector(selected);'>";
    elem += "</div>";
    elem += "</div>";
    return elem;
}

function togglePicker(elem) {
    elem.parentElement.querySelector(".picker").classList.toggle("active");
}

function undo(keepSelection) {
    if (undoBuffer.length > 0) {
        showJSON = JSON.parse(undoBuffer[undoBuffer.length-1]);
        undoBuffer.splice(undoBuffer.length-1,1);
        setBody();
        setArticles();
        if (undoBuffer.length == 0) {
            document.querySelector(".undoGUI").classList.add("disabled");
        }
        if (JSON.stringify(showJSON) == saveState) {
            document.querySelector(".saveGUI").classList.add("disabled");
            document.querySelector(".revertGUI").classList.add("disabled");
        } else {
            document.querySelector(".saveGUI").classList.remove("disabled");
            document.querySelector(".revertGUI").classList.remove("disabled");
        }
    }
    if (!keepSelection) {
        select(document.body);
    } else {
        select(document.getElementById(selected.id));
    }

    if (selected) {
        setInspector(selected);
    }

}

function recordUndo() {
    undoBuffer.push(JSON.stringify(showJSON));
    console.log("recorded undo state");
    document.querySelector(".undoGUI").classList.remove("disabled");
    document.querySelector(".saveGUI").classList.remove("disabled");
    document.querySelector(".revertGUI").classList.remove("disabled");
    document.title = showJSON.title + "*";
}

function newMenu() {
    document.querySelector(".GUI.newGUI").classList.toggle("active");
}

function addElement(type) {
    recordUndo();
    let article = {
        "title": "",
        "subtitle": "",
        "description": "",
        "artist": "",
        "url": "",
        "top": Math.round(window.scrollY + window.innerHeight / 2 - 120),
        "left": Math.round(window.scrollX + window.innerWidth / 2 - 180),
        "width": 360,
        "height": 240
    }

    switch (type) {
        case "video":
            article.title = "Empty video";
            article.artist = "Empty video";
            article.url = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&controls=0&rel=0&enablejsapi=1&playsinline=1"
            article.youtube = true;
            article.youtubeSync = true;
            break;
        case "image":
            article.title = "New Image";
            article.artist = "New Image";
            article.image = true;
            break;
        case "slideshowLocal":
            article.title = "New Slideshow";
            article.artist = "New Slideshow";
            article.slideshowLocal = true;
            article.slides = [];
            break;
        case "puzzle":
            article.title = "New Puzzle";
            article.artist = "New Puzzle";
            article.puzzle = true;
            article.segmentsX = 10;
            article.segmentsY = 10;
            break;
        case "quiz":
            article.title = "New Quiz";
            article.artist = "New Quiz";
            article.quiz = true;
            article.questions = [];
            break;
        case "text":
            article.showInfo = false;
            article.text = true;
            break;
        case "textBorderless":
            article.showInfo = false;
            article.text = true;
            article.borderless = true;
            break;
        case "chat":
            article.chatbox = true;
            article.title = "chatbox_" + subdomain + "_" + chatIndex+1;
            article.artist = "chatbox";
            break;
        case "notepad":

            break;
        case "screen":
            article.screenshare = true;
            article.artist = "Screen share";
            break;
        case "iframe":
            article.title = "Empty iframe";
            article.artist = "Empty iframe";
            article.url = "https://www.youtube.com/embed/dQw4w9WgXcQ?autoplay=1&controls=0&rel=0&playsinline=1"
            article.iframe = true;
            break;
        case "shape":
            article.shape = "true";
            article.shapeType = "rectangle";
            article.color = ["0", "100", "50"];
            article.background = true;
            break;
        case "portal":
            article.shape = "true";
            article.shapeType = "circle";
            article.portal = "true";
            article.background = true;
            article.width = 175;
            article.height = 175;
            article.destination = "subdomain";
            break;
    }

    showJSON.works.push(article);
    setArticles();
}

function deleteElement() {
    if (selected.nodeName == "ARTICLE") {
        recordUndo();
        let id = selected.id.substr(7,selected.id.length);
        console.log(id);
        showJSON.works.splice(id,1);
        setArticles();
    }
    select(document.body);
}

function copy() {
    clipboard = JSON.stringify(showJSON.works[selected.id.substr(7,99999)]);
    document.querySelector(".contextmenu.article").classList.remove("active");
    document.querySelector(".contextmenu.background").classList.remove("active");
}
function cut() {
    recordUndo();
    clipboard = JSON.stringify(showJSON.works[selected.id.substr(7,99999)]);
    showJSON.works.splice(selected.id.substr(7,99999),1);
    document.querySelector(".contextmenu.article").classList.remove("active");
    document.querySelector(".contextmenu.background").classList.remove("active");
    setArticles();
}
function paste() {
    recordUndo();
    document.querySelector(".contextmenu.article").classList.remove("active");
    document.querySelector(".contextmenu.background").classList.remove("active");
    let newArticle = JSON.parse(clipboard);
    newArticle.left = Math.round(window.scrollX + window.innerWidth / 2 - 120 - newArticle.width/2);
    console.log(newArticle.height);
    if (newArticle.height.includes && !newArticle.height.includes("au")) {
        newArticle.top = Math.round(window.scrollY + window.innerHeight / 2 - newArticle.height/2);
    } else {
        newArticle.top = Math.round(window.scrollY + window.innerHeight / 2 - 50);
    }
    showJSON.works.push(newArticle);
    setArticles();
}

function visitSite() {
    window.open("https://" + subdomain + ".common.garden");
    // replace URL
}

function exitCMS() {
    window.location.href = "https://common.garden";
    // replace URL
}

window.onscroll = function(event) {
    document.querySelector(".cmsAvatar").style.width = (window.innerWidth / mapscale) + "px";
    document.querySelector(".cmsAvatar").style.height = (window.innerHeight / mapscale) + "px";
    document.querySelector(".cmsAvatar").style.left = (window.scrollX / mapscale) + "px";
    document.querySelector(".cmsAvatar").style.top = (window.scrollY / mapscale) + "px";
}

window.onresize = function(event) {
    document.querySelector(".cmsAvatar").style.width = (window.innerWidth / mapscale) + "px";
    document.querySelector(".cmsAvatar").style.height = (window.innerHeight / mapscale) + "px";
    document.querySelector(".cmsAvatar").style.left = (window.scrollX / mapscale) + "px";
    document.querySelector(".cmsAvatar").style.top = (window.scrollY / mapscale) + "px";
}

window.onkeydown = function(e) {
    if (e.metaKey && !e.key.includes("Meta") || e.ctrlKey && !e.key.includes("Control") ) {
        switch(e.key) {
            case "s":
                e.preventDefault();
                save();
                break;
            case "z":
                e.preventDefault();
                undo();
                break;
            case "c":
                if (event.target.nodeName == "BODY") {
                    e.preventDefault();
                    copy();
                }
                break;
            case "x":
                if (event.target.nodeName == "BODY") {
                    e.preventDefault();
                    cut();
                }
                break;
            case "v":
                if (event.target.nodeName == "BODY") {
                    e.preventDefault();
                    paste();
                }
                break;
            case "d":
                if (event.target.nodeName == "BODY") {
                    e.preventDefault();
                    copy();
                    paste();
                }
                break;
        }
    }
    if (e.key == "Backspace" && event.target.nodeName == "BODY") {
        deleteElement();
    }
}



function hexToHsl(hex){

    let r = parseInt(hex.substr(0,2),16);
    let g = parseInt(hex.substr(2,2),16);
    let b = parseInt(hex.substr(4,2),16);

    r /= 255, g /= 255, b /= 255;
    var max = Math.max(r, g, b), min = Math.min(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min){
        h = s = 0; // achromatic
    }else{
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max){
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h*360, s*100, l*100];
}

function hslToHex(h, s, l){
    var r, g, b;

    h = h/360;
    s = s/100;
    if (s == 0) {
        s = 0.1;
    }
    l = l/100;

    if (s == 0) {
        r = g = b = l; // achromatic
    } else {
        var hue2rgb = function hue2rgb(p, q, t){
            if(t < 0) t += 1;
            if(t > 1) t -= 1;
            if(t < 1/6) return p + (q - p) * 6 * t;
            if(t < 1/2) return q;
            if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
        }

        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = Math.round(hue2rgb(p, q, h + 1/3) * 255).toString(16);
        g = Math.round(hue2rgb(p, q, h) * 255).toString(16);
        b = Math.round(hue2rgb(p, q, h - 1/3) * 255).toString(16);
        r = "0" + r;
        r = r.substr(r.length-2,2);
        g = "0" + g;
        g = g.substr(g.length-2,2);
        b = "0" + b;
        b = b.substr(b.length-2,2);
    }

    return r + g + b;
}

// tutorials

function quiz1() {
    delete showJSON.setup;
    save();
    document.querySelector(".fade.passWindow").style.display = "block";
    document.querySelector(".fade.passWindow").style.opacity = "1";
    document.querySelector(".fade.passWindow").style.background = "rgba(0,0,0,0.4)";
    let passWindow = document.querySelector(".passWindow");
    passWindow.innerHTML = "<div class='passWindowBox tut'><p>To create your quiz, start by adding a question.</p><input name='ok' type='button' value='Okay' onclick='quiz2();' class='centered'></div>";
}

function quiz2() {
    document.querySelector(".fade.passWindow").style.display = "none";
    select(document.querySelector("#article0"));
    setInspector(document.querySelector("#article0"));

    inspector.querySelector(".quiz.add").classList.add("highlight");
    inspector.querySelector(".quiz.add").addEventListener("click", quiz3);
}

function quiz3() {
    inspector.querySelector(".quiz.add").classList.remove("highlight");
    document.querySelector(".fade.passWindow").style.display = "block";
    let passWindow = document.querySelector(".passWindow");
    passWindow.innerHTML = "<div class='passWindowBox tut'><p>Now write your first question, and add one correct and one wrong answer in the text boxes.</p><input name='ok' type='button' value='Okay' onclick='quiz4();' class='centered'></div>";
}

function quiz4() {
    document.querySelector(".fade.passWindow").style.display = "none";
    inspector.querySelector(".quiz.question").classList.add("highlight");
    inspector.querySelector(".quiz.answerA").classList.add("highlight");
    inspector.querySelector(".quiz.answerB").classList.add("highlight");
    window.setTimeout(function() {
        document.querySelector("textarea.quiz.answerB").addEventListener("change", quiz5);
    }, 100);
}

function quiz5() {
    setInspector(document.querySelector("#article0"));
    window.setTimeout(function() {
        setInspector(document.querySelector("#article0"));
    }, 200);

    document.querySelector(".fade.passWindow").style.display = "block";
    let passWindow = document.querySelector(".passWindow");
    passWindow.innerHTML = "<div class='passWindowBox tut'><p>Next, select which of the answers is correct.</p><input name='ok' type='button' value='Okay' onclick='quiz6();' class='centered'></div>";
}

function quiz6() {
    document.querySelector(".fade.passWindow").style.display = "none";
    inspector.querySelectorAll(".inspectorQuestion.radios label")[0].classList.add("highlight");
    inspector.querySelectorAll(".inspectorQuestion.radios label")[1].classList.add("highlight");

    inspector.querySelectorAll(".inspectorQuestion.radios label")[0].addEventListener("click", quiz7);
    inspector.querySelectorAll(".inspectorQuestion.radios label")[1].addEventListener("click", quiz7);
}

function quiz7() {
    inspector.querySelectorAll(".inspectorQuestion.radios label")[0].classList.remove("highlight");
    inspector.querySelectorAll(".inspectorQuestion.radios label")[1].classList.remove("highlight");
    document.querySelector(".fade.passWindow").style.display = "block";
    let passWindow = document.querySelector(".passWindow");
    passWindow.innerHTML = "<div class='passWindowBox tut'><p>You can keep adding as many questions as you like.<br><br>Don't forget to click on save when you are done!</p><input name='ok' type='button' value='Okay' onclick='quiz8();' class='centered'></div>";
}

function quiz8() {
    document.querySelector(".fade.passWindow").style.display = "none";
    document.querySelector(".saveGUI").classList.add("highlight");
    document.querySelector(".saveGUI").addEventListener("click", function() {
        document.querySelector(".saveGUI").classList.remove("highlight");
    });
}

function party1() {
    document.querySelector(".fade.passWindow").style.display = "block";
    document.querySelector(".fade.passWindow").style.opacity = "1";
    document.querySelector(".fade.passWindow").style.background = "rgba(0,0,0,0.4)";
    let passWindow = document.querySelector(".passWindow");
    passWindow.innerHTML = "<div class='passWindowBox tut'><p>Enter the URL of the stream you would like to watch:</p><input type='text' name='url'><input name='ok' type='button' value='Okay' onclick='party2();' class='centered'></div>";
}

function party2() {
//    delete showJSON.setup;
    let url = document.querySelector(".passWindowBox.tut input[name=url]").value;
    let id;
    if (url.includes("youtube.com/watch")) {
        id = url.split("watch?v=")[1].split("&")[0];
    } else if (url.includes("youtube.com/embed")) {
        id = url.split("/embed/")[1].split("\"")[0].split("?")[0];
    } else if (url.includes("youtu.be")) {
        id = url.split("youtu.be/")[1].split("?")[0];
    }

    console.log(id);
    if (id) {
        showJSON.works[0].url = "https://www.youtube.com/embed/" + id + "?autoplay=1&controls=0&rel=0&enablejsapi=1&playsinline=1";
        showJSON.works[0].youtube = true;
    } else {
        showJSON.works[0].url = url;
    }
    save();
    let passWindow = document.querySelector(".passWindow");
    passWindow.innerHTML = "<div class='passWindowBox tut'><p>Your watch party is now setup!</p><input name='cancel' type='button' class='party2' value='keep editing' onclick='party3();'><input name='enter' type='button' class='party2 r' value='visit page' onclick='window.location.href = \"https://" + subdomain + ".common.garden\";'></div>";
    // replace redirect URL
}

function party3() {
    let passWindow = document.querySelector(".passWindow");
    passWindow.innerHTML = "<div class='passWindowBox tut'><p>Don't forget to click on save when you are done!</p><input name='ok' type='button' value='Okay' onclick='party4();' class='centered'></div>";
}

function party4() {
    recordUndo();
    document.querySelector(".saveGUI").classList.add("highlight");
    document.querySelector(".saveGUI").addEventListener("click", function() {
        document.querySelector(".saveGUI").classList.remove("highlight");
    });
    document.querySelector(".fade.passWindow").style.display = "none";
}
