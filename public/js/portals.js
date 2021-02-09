window.setInterval(function() {
    if (inShow) {
        for (let i=0; i<portals.length; i++) {
            let portal = document.getElementById(portals[i].id);
            let portalX = portal.offsetLeft + portal.offsetWidth/2;
            let portalY = portal.offsetTop + portal.offsetHeight/2;

            let dist = Math.sqrt((portalX - currentX) * (portalX - currentX) + (portalY - currentY) * (portalY - currentY) );

            if (dist < portal.offsetWidth/2 || portals[i].timer > 1) {
                if (portals[i].timer > 1) {
                    console.log(portals[i].destination);
                    portal.style.padding = window.innerWidth * 2 + "px";
                    portal.style.margin = "-" + window.innerWidth + "px";
                    portal.style.background = "hsl(" + portals[i].color[0] + ", " + portals[i].color[1] + "%, " + portals[i].color[2] + "%)";
                    portal.style.zIndex = "999";
                    myUser.style.opacity = 0;
                    map.style.opacity = 0;
                    if (portals[i].timer > 2) {
                        window.location.href = "https://" + portals[i].destination + ".common.garden?username=" + username + "&terms=" + inShow;
                    }
                    portals[i].timer ++;
                } else {
                    portals[i].timer++;
                    portal.style.padding = "16px";
                    portal.style.margin = "-16px";
                    console.log(portal.style.padding);
                }
            } else {
                portals[i].timer = 0;
                portal.style.padding = "0px";
                portal.style.margin = "0px";
            }
        }
    }
}, 1000);
