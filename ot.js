//server settings
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var servestatic = require('serve-static');

var md5 = require('MD5'),
    util = require('./utils/xform.js'),
    xform = util.xform,
    apply = util.apply;
//import md5 function
//state space
//hash->state
//msg: [parent-state, child-state, op]
//history: {parent-state: msg}
var history = {};

//client
//initialisation
var doc = '123',
    hash = md5(doc);

function updateHis(hash, msg) {
    history[hash] = msg;
    io.emit('msg', msg);
}

function onRemote(msg) {
    console.log(msg);
    var ph = msg[0],
        ch = msg[1],
        op = msg[2],
        msgid = msg[3];

    if (ph === hash) {
        updateHis(hash, msg);
        hash = md5(doc = apply(op, doc)); //now hash should be ch
    } else {
        var xops = move(ph, hash, op);
        var xr = xops[1];
        var nextH = md5(doc = apply(xr, doc));
        var xmsg = [hash, nextH, xr, msgid];
        updateHis(hash, xmsg);
        hash = nextH;
    }
}

//move from one state (as a hash) to another
function move(h1, h2, rop) {
    var lops = [];

    var cursor = h1;
    while (cursor !== h2) {
        var msg = history[cursor];

        var op = msg[2];
        if (Array.isArray(op)) {
            lops = op;
        } else {
            lops.push(op);
        }

        cursor = msg[1];
    }

    return xform(lops, rop);
}




app.use(servestatic('./client'));

app.get('/', function (req, res) {
    res.sendFile('client/index.html');
});

io.on('connection', function (socket) {
    console.log('a user connected');
    socket.emit('init', doc);
    socket.on('msg', onRemote);
});

http.listen(3000, function () {
    console.log('listening on *:3000');
});
