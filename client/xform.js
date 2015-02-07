(function() {
    var root = this;
    if (typeof exports !== 'undefined') {
        root = exports;
    }
    root.xform = xform;
    root.apply = apply;

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

    //[op1, op2] -> [xop1, xop2]
    //op1*xop2 === op2*xop1
    function xform(op1, op2) {
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

                break;

            case p1 <= p2:

                xop1 = ins1;
                xop2 = {
                    type: 'ins',
                    c: c2,
                    p: p2 + 1
                }

                break;

            case p1 > p2:

                xop1 = {
                    type: 'ins',
                    c: c1,
                    p: p1 + 1
                }

                xop2 = ins2;

                break
        }

        return [xop1, xop2];
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
                    p: p1 + 1
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
        var xop1, xop2;
        var p1 = del.p,
            p2 = ins.p,
            c2 = ins.c;

        switch (true) {
            case p1 < p2:
                xop1 = del;
                xop2 = {
                    type: 'ins',
                    c: c2,
                    p: p2 - 1
                };

                break;

            case p1 >= p2:

                xop1 = {
                    type: 'del',
                    p: p1 + 1
                }
                xop2 = ins;

                break;
        }

        return [xop1, xop2];
    }

    function dd(del1, del2) {
        var xop1, xop2;
        var p1 = del1.p,
            p2 = del2.p;

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
                break;

            case p1 > p2:
                xop1 = {
                    type: 'del',
                    p: p1 - 1
                };
                xop2 = op2;
                break;
        }
        return [xop1, xop2];
    }
})();
