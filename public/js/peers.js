const peers = document.getElementById('peers');
const locations = [{id: 4, label: 'bogota'}, {id: 5, label: 'kinshasa'}, {id: 6, label: 'bengaluru'}];

fetch('/api/v0/swarm/peers', {
    method: 'POST'
})
    .then(res => res.json())
    .then(data => {

        console.log("data", data)

        for (p in data.Peers) {

            let r = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/; //http://www.regular-expressions.info/examples.html
            let a = data.Peers[p].Addr;
            let t = a.match(r);

            if (!t || !t.length) continue;

            let octet = String(t).substring( String(t).lastIndexOf('.') + 1 );
            let location = locations.filter(loc => {

                // console.log("loc.id", loc.id);
                // console.log("octet", parseInt(octet));
                return loc.id === parseInt(octet);
            });

            peers.innerHTML += '<a class="peer" href="peer/' + octet + '/"><span class="dot"></span><div class="label">' + location[0].label + '</div></a>';
        }

    })
    .catch(err => {
        console.log("caught error!", err);
    });

