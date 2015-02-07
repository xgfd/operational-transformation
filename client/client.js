//import md5 function
//state space
//hash->state
//msg: [parent-state, child-state, op]
//parIndexMsg: {parent-state: {l: msg, r: msg}}
var uid = 'c1';
var parIndexMsg = {};

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
    console.log(msg);
};

function calOp(ver1, ver2) {};

function onLocalDoc(newDoc) {};

function onLocalOp(op) {
    var nextDoc = apply(op, doc),
        nextHash = md5(nextDoc),
        msg = [hash, nextHash, op];

    if (synced) {
        send(msg);
    } else {
        msgBuf.push(msg);
    }

    //update message index
    var index;
    if (!(index = parIndexMsg[hash])) {
        index = parIndexMsg[hash] = {};
    };
    index.l = msg;

    synced = false;

    //update local state
    doc = nextDoc;
    hash = nextHash;
}

function onRemote(msg) {
    //update message index
    //    var index;
    //    if (!(index = parIndexMsg[hash])) {
    //        index = parIndexMsg[hash] = {};
    //    };
    //    index.r = msg;


    var ph = msg[0],
        ch = msg[1],
        op = msg[2],
        msgid = msg[3];

    pushChild(ph, msg, 'r');

    rdoc = apply(op, rdoc);
    rhash = ch;

    if (uid === msgid) {
        if (msgBuf.length !== 0) {
            send(msgBuf.shift());
        }
    } else {
        moveL(ph, hash, function(h) {
            //return the next local/left hash
            return parIndexMsg[h].l[1];
        });
    }

    if (hash === rhash) {
        reset();
    }
}

function pushChild(hash, msg, lr) {
    var record;
    if (!(record = parIndexMsg[hash])) {
        record = parIndexMsg[hash] = {};
    };

    if (lr === 'l') {
        record.l = msg;
    }

    if (lr === 'r') {
        record.r = msg;
    }
}


//move from one state (as a hash) to another; generate intermediate op's and states
function moveL(h1, h2) {
    var current = h1;

    var interDoc = rdoc,
        interHash;

    while (current !== h2) {
        var record = parIndexMsg[current],
            lch = record.l[1],
            rch = record.r[1],
            lop = record.l[2],
            rop = record.r[2],
            newOps = xform(lop, rop);

        interDoc = apply(newOps[0], interDoc);
        interHash = md5(interDoc);
        //fill gap states
        pushChild(lch, [lch, interHash, newOps[1]], 'r');
        pushChild(rch, [rch, interHash, newOps[0]], 'l');

        current = lch;
    }

    if (interHash) {
        doc = interDoc;
        hash = interHash;
    }
}


//test
var initDoc = '123';
onConnect(initDoc);
var ins1a = {
    type: 'ins',
    c: 'a',
    p: 1
};

var del1 = {
    type: 'del',
    p: 1
};

var rmsg1 = [md5(initDoc), md5(initDoc = apply(del1, initDoc)), del1, 'c2'];
var rmsg2 = [md5(initDoc), md5(apply(del1, initDoc)), del1, 'c2'];

onLocalOp(ins1a);
onLocalOp(ins1a);
onRemote(rmsg1);
onRemote(rmsg2);
onRemote([md5('1'), md5('1a'), ins1a, 'c1']);
onRemote([md5('1a'), md5('1aa'), ins1a, 'c1']);
