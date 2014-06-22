"use strict";

var superagent = require('superagent');

function attachAuthHeader(req) {
    var app = require('adminui');
    if (app.user && app.user.getToken()) {
        return req.set({'x-adminui-token': app.user.getToken()});
    } else {
        return req;
    }
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
};
