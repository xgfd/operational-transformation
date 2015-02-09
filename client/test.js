//test
var ins1a = {type: 'ins', c: 'a', p: 1};
var ins1b = {type: 'ins', c: 'b', p: 1};
var ins1c = {type: 'ins', c: 'c', p: 1};

var del1 = {
    type: 'del',
    p: 1
};

//run this on client 1
function c1() {
    onLocalOp(del1);

    setTimeout(function () {
        onLocalOp(del1);
    }, 4000);
}

//run this on client 2, within 4 seconds after running c1
function c2() {
    onLocalOp(ins1a);
    onLocalOp(ins1b);
    setTimeout(function () {
        onLocalOp(ins1c);
    }, 5000);
}

