(function() {
    var root = this;
    if (typeof exports !== 'undefined') {
        root = exports;
    }
    root.apply = apply;
    root.pushChild = pushChild;
    root.xform = xform;

    function pushChild(history, hash, msg, lr) {
        var record;
        if (!(record = history[hash])) {
            record = history[hash] = {};
        };

        if (lr === 'l') {
            record.l = msg;
        }

        if (lr === 'r') {
            record.r = msg;
        }
    }

    function apply(op, doc) {
        var p = op.p,
            len = doc.length;

        switch (op.type) {
            case undefined:
                return doc;
            case 'ins':
                return doc.substring(0, p) + op.c + doc.substring(p);
            case 'del':
                return doc.substring(0, p) + doc.substring(p + 1);
        }
    }

    //transform op against a list of op's
    var isarr = Array.isArray;

    //reverse a pair
    function rev(pair) {
        pair.push(pair.shift());
        return pair;
    };

    function xform(op1, op2) {

        //op, op
        if (!isarr(op1) && !isarr(op2)) {
            return _xform(op1, op2);
        }

        //op, arr
        if (!isarr(op1) && isarr(op2)) {
            return xformOpArr(op1, op2);
        }

        //arr, op
        if (isarr(op1) && !isarr(op2)) {
            return rev(xformOpArr(op2, op1));
        }
    }

    function xformOpArr(op, ops) {
        var rop, lop, xrops, temxlr;

        xrops = [];
        lop = op;
        for (var i = 0; rop = ops[i]; i++) {
            temxlr = _xform(lop, rop);
            lop = temxlr[0];
            xrops.push(temxlr[1]);
        }

        return [lop, xrops];
    }

    //[op1, op2] -> [xop1, xop2]
    //op1*xop2 === op2*xop1
    function _xform(op1, op2) {
        switch (op1.type + op2.type) {
            case 'insins':
                return ii(op1, op2);
            case 'insdel':
                return id(op1, op2);
            case 'delins':
                return di(op1, op2);
            case 'deldel':
                return dd(op1, op2);
            default:
                console.log('Error: Type not supported ' + op1.type + op2.type);
        }
    };



    function ii(ins1, ins2) {
        var xop1, xop2;
        var p1 = ins1.p,
            c1 = ins1.c,
            p2 = ins2.p,
            c2 = ins2.c;

        switch (true) {
            case p1 === p2 && c1 === c2:

                xop1 = xop2 = null;

                return [xop1, xop2];

            case p1 <= p2:

                xop1 = ins1;
                xop2 = {
                    type: 'ins',
                    c: c2,
                    p: p2 + 1
                }

                return [xop1, xop2];

            case p1 > p2:

                return rev(ii(ins2, ins1));
        }
    }

    function id(ins, del) {
        var xop1, xop2;
        var p1 = ins.p,
            c1 = ins.c,
            p2 = del.p;

        switch (true) {

            case p1 <= p2:

                xop1 = ins;
                xop2 = {
                    type: 'del',
                    p: p2 + 1
                }

                break;

            case p1 > p2:

                xop1 = {
                    type: 'ins',
                    c: c1,
                    p: p1 - 1
                }
                xop2 = del;

                break;
        }

        return [xop1, xop2];
    }

    function di(del, ins) {
        return rev(id(ins, del));
    }

    function dd(op1, op2) {
        var xop1, xop2;
        var p1 = op1.p,
            p2 = op2.p;

        switch (true) {

            case p1 === p2: //delete the same char
                xop1 = xop2 = null; //do nothing
                break;

            case p1 < p2:
                xop1 = op1;
                xop2 = {
                    type: 'del',
                    p: p2 - 1
                };
                return [xop1, xop2];

            case p1 > p2:
                return rev(dd(op2, op1));
        }
    }
})();
