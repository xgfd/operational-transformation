//import md5 function
//state space
//hash->state
//msg: [parent-state, child-state, op]
//history: {parent-state: {l: msg, r: msg}}
var uid, socket;

var history = {};

//client
//initialisation
var doc, hash, rdoc, rhash, synced, msgBuf;

function reset() {
    synced = true;
    msgBuf = [];
}

function onConnect(data) {
    rdoc = doc = data;
    rhash = hash = md5(doc);
    reset();
}

//send a message to server
function send(msg) {
    msg.push(uid);
    //for testing, add 5 seconds to simulate network delay
    setTimeout(function () {
        socket.emit('msg', msg);
    }, 5000);
};

function onLocalOp(op) {
    var nextHash = md5(doc = apply(op, doc)),
        msg = [hash, nextHash, op];

    if (synced) {
        send(msg);
    } else {
        msgBuf.push(msg);
    }

    //update history 
    pushChild(history, hash, msg, 'l');

    synced = false;

    //update local state
    hash = nextHash;
}

function onRemote(msg) {
    console.log(msg);
    var ph = msg[0],
        ch = msg[1],
        op = msg[2],
        msgid = msg[3];


    rdoc = apply(op, rdoc);
    rhash = ch;//ch === md5(rdoc)

    if (uid === msgid) {
        pushChild(history, ph, msg, 'l');
        var nextBuf = history[ch];
        if (nextBuf) {
            send(nextBuf.l);
        }
    } else {
        pushChild(history, ph, msg, 'r');

        if (synced) {
            doc = rdoc;
            hash = rhash;
        } else {
            move(ph, hash);
        }
    }

    if (hash === rhash) {
        reset();
    }
}

//move from one state (as a hash) to another
function move(h1, h2) {
    var cursor = h1;

    var interDoc = rdoc,
        interHash;

    while (cursor !== h2) {
        var record = history[cursor];
        var lch = record.l[1],
            rch = record.r[1],
            lop = record.l[2],
            rop = record.r[2],
            newOps = xform(lop, rop);

        interHash = md5(interDoc = apply(newOps[0], interDoc));
        //fill gap states
        pushChild(history, lch, [lch, interHash, newOps[1]], 'r');
        pushChild(history, rch, [rch, interHash, newOps[0]], 'l');

        cursor = lch;
    }

    if (interHash) {
        doc = interDoc;
        hash = interHash;
    }


    /*    var rop = history[h1].r[2];

     var lops = [];

     var cursor = h1;
     while (cursor !== h2) {
     var msg = history[cursor].l;

     var op = msg[2];
     if (Array.isArray(op)) {
     lops = op;
     } else {
     lops.push(op);
     }

     cursor = msg[1];
     }

     return xform(lops, rop);*/
}
