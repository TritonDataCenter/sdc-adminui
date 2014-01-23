module.exports = {};
module.exports.typify = function typify(o, deep) {
    deep = deep || true;

    for (var p in o) {
        var v = o[p];

        if (v instanceof Array || typeof(v) === 'object') {
           o[p] = typify(v); continue;
        }

        if (v === 'true') { o[p] = true; continue; }
        if (v === 'false') { o[p] = false; continue; }
        if (v === 'null') { o[p] = null; continue; }

        var n = Number(v);
        o[p] = (isNaN(n)) ? v : n;
    }

    return o;
};

module.exports.stringify = function stringify(o, deep) {
    deep = deep || true;
    for (var p in o) {
        var v = o[p];

        if (v === true) { o[p] = 'true'; continue; }
        if (v === false) { o[p] = 'false'; continue; }
        if (v === null) { o[p] = 'null'; continue; }

        if (v instanceof Array || typeof(v) === 'object') {
           o[p] = stringify(v); continue;
        }
        o[p] = o[p].toString();
    }

    return o;

};
