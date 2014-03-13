var superagent = require('superagent');
var app = require('./adminui');

function attachAuthHeader(req) {
    return req.set({'x-adminui-token': app.user.getToken()});
}

module.exports = {
    get: function(path) {
        return attachAuthHeader(superagent.get(path));
    },
    post: function(path) {
        return attachAuthHeader(superagent.post(path));
    },
    put: function(path) {
        return attachAuthHeader(superagent.put(path));
    },
    patch: function(path) {
        return attachAuthHeader(superagent.patch(path));
    },
    head: function(path) {
        return attachAuthHeader(superagent.head(path));
    },
    del: function(path) {
        return attachAuthHeader(superagent.del(path));
    }
}
