module.exports = function unfuck(o) {
    for (var p in o) {
        var v = o[p];

        if (v instanceof Array || typeof(v) === 'object') {
           o[p] = unfuck(v); continue;
        }

        if (v === 'true') { o[p] = true; continue; }
        if (v === 'false') { o[p] = false; continue; }
        if (v === 'null') { o[p] = null; continue; }

        var n = Number(v); 
        o[p] = (isNaN(n)) ? v : n;
    }

    return o;
}