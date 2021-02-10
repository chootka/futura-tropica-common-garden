const peers = document.getElementById('peers');

fetch('http://localhost/api/v0/swarm/peers', {
    method: 'POST'
})
    .then(res => res.json())
    .then(data => {

        console.log("data", data)

        for (p in data.Peers) {

            var r = /\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/; //http://www.regular-expressions.info/examples.html
            var a = data.Peers[p].Addr;
            var t = a.match(r);

            if (!t || !t.length) continue;

            var octet = String(t).substring( String(t).lastIndexOf('.') + 1 );

            peers.innerHTML += '<a class="peer" href="peer/' + octet + '/"><span class="dot"></span></a>';
        }



    })
    .catch(err => {
        console.log("caught error!", err);
    });

