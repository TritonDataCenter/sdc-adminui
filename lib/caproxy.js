var assert  = require('assert');
var restify = require('restify');
var sys  = require('sys');


var customInsts = {};
var sessions = require('./sessions');
var clients = {};

var proxy = {

    checkDatacenter: function(req, res, next) {
        var dc = req.dc;
        req.casession = {dc: dc};
        return next();
    },

    setupClient: function(req, res, next) {
        var uri = req.getPath();
        var client = clients[req.casession.dc];
        var insts = customInsts[req.casession.dc];

        req.ca  = client;
        req.customInsts = insts;
        req.dest = uri;
        return next();
    },


    // Filter instrumentation URIs for each session. This allows having different
    // instrumentations created from the same application
    getFiltered: function(req, res, next) {
        var caReqParams = { path: '/ca/instrumentations' };
        var caClient = req.ca;

        caClient.get(caReqParams, function(err, caReq, caRes, data) {

            if (err) {
                req.log.fatal(err, "Error retrieving instrumentations");
                return next(err);
            } else {
                var caBody = data;
                var caSessData = req.session.data['ca'] || {};
                // req.log.info(caSessData, 'ca session data');

                var insts = caSessData[req.dc] || [];
                var uris  = caBody.map(function(inst) {
                    return inst.uri;
                });

                if (insts.length) {
                    insts = insts.filter( function(el, i, arr) {
                        return (uris.indexOf(el.uri) !== -1) ? true : false;
                    });
                }

                res.send(200, insts);
            }

            return next();
        });
    },

    // Create an instrumentation and add it to the local per-session cache array.
    // Ignore per-zone instrumentation which should not be constrained by a single
    // session, but goal is to move the historical instrumentations logic to this
    // codebase if possible in a way of predefined uris for instrumentations
    createInstrumentation: function(req, res, next) {
        var caClient = req.ca;

        // Modify granularity when request is intercepted and before we call CA
        if (!hasPredicate(req.body.predicate, 'zonename') && isHeatmap(req.body.decomposition)) {
            req.body.granularity = 10;
        } else {
            req.body.granularity = 1;
        }


        var path = req.url;
        var body = req.body;
        caClient.post(path, body, function(err, caReq, caRes, caBody) {
            if (err) {
                req.log.fatal(err, "%o");
                return next(err);
            } else {
                var sessdata = req.session.data || {};
                sessdata['ca'] = sessdata['ca'] || {};
                sessdata['ca'][req.dc] = sessdata['ca'][req.dc] || [];
                sessdata['ca'][req.dc].push(caBody);
                req.sessions.setData(req.session.token, sessdata);

                res.send(200, caBody);
            }

            return next();
        });
    },

    // Temporal fix, custom instrumentations
    pingInstrumentation: function(req, res, next) {
        var caClient = req.ca;
        var insts = req.customInsts;
        var name = req.params.name;
        var inst = insts[name];

        if (inst) {
            var caReq = { path: inst.uri };
            caClient.get(caReq, function(err, caReq, caRes, caBody) {
                if (err) {
                    // If it doesn't exist then we need to recreate it
                    // req.params.create will let the next() about this
                    req.params.create = true;
                    req.log.debug("%o", err);
                }

                return next();
            });
        } else {
            req.params.create = true;
            return next();
        }
    },

    // Temporal fix, custom instrumentations
    createCustomInstrumentation: function(req, res, next) {
        var caClient = req.ca;
        var insts = req.customInsts;

        var name = req.params.name;

        if (req.params.create) {
            delete req.params.name;
            delete req.params.create;

            var caReq = {
                path: '/ca/instrumentations',
                query: req.params,
                body:  req.body
            };

            caClient.post(caReq, function(err, caReq, caRes, caBody) {
                if (err) {
                    req.log.debug("%o", err);
                    res.sendError(err);
                } else {
                    insts[name] = caBody;
                    res.send(200, caBody);
                }

                return next();
            });

        } else {
            res.send(200, insts[name]);
            return next();
        }
    },

    deleteInstrumentation: function(req, res, next) {
        var caClient = req.ca;
        var caParams = { path: req.dest };

        caClient.del(caParams, function(err, caReq, caRes) {
            var caBody = caRes.body;
            if (err) {
                req.log.debug("%o", err);
                res.sendError(err);
            } else {
                var sessData = req.session.data;
                var insts = sessData['ca'][req.dc] || {};
                var uris  = insts.map(function(inst) {
                    return inst.uri;
                });

                if (uris.indexOf(req.dest) !== -1) {
                    insts.splice(uris.indexOf(req.dest), 1);
                }
                sessData['ca'][req.dc] = insts;
                req.sessions.setData(req.session.token, sessData);

                res.send(200, caBody);
            }

            return next();
        });
    },

    send: function(req, res, next) {
        function callback(err, caReq, caRes, data) {
            if (err) {
                req.log.fatal(err, "error proxy send");
                return next(err);
            }
            res.end(caRes.body);
            return next(false);
        }

        var verb = req.method.toLowerCase();

        if (verb === 'delete') {
            verb = 'del';
        }

        var caReq = { path: req.dest };
        caReq.query = req.getQuery();
        var caClient = req.ca;
        if (verb === 'post') {
            var body = req.body;
            req.log.info(verb, caReq.path, body, 'CA Request');
            caClient[verb].call(caClient, caReq.path, body, callback);
        } else {
            req.log.info(verb, caReq.path, caReq.query, 'CA Request');
            caClient[verb].call(caClient, caReq, callback);
        }
    }
};


/*
 * Tests if there is a specific predicate fieldname in the request
 */
function hasPredicate(object, name) {
    if (!object) {
        return false;
    }

    if (typeof (object) === 'string') {
        object = JSON.parse(object);
    }

    if (!Object.keys(object).length) {
        return false;
    }

    // A predicate has always one key
    var key = Object.keys(object)[0];
    var predicate = object[key];
    var i;

    for (i = 0; i < predicate.length; i++) {
        var sub = predicate[i];

        if (typeof (sub) === 'object') {
            if (hasPredicate(sub, name)) {
                return true;
            }
        } else if (typeof(sub) === 'string' && i === 0 && sub === name) {
            return true;
        }
    }

    return false;
}


/*
 * Tests if decomposition has more than 1 element
 */
function isHeatmap(array) {
    // Did you pass an undefined object or an empty object?
    if (!array || !Array.isArray(array) || !array.length) {
        return false;
    }

    return (array.length > 1);
}

exports.setup = function(config) {
    for (var dc in config['datacenters']) {
        var caUrl = config['datacenters'][dc]['ca']['url'];
        clients[dc] = restify.createJsonClient({ url: caUrl });
        customInsts[dc] = {};
    }
};

exports.mount = function(server, serverpre) {
    var pre = [
        restify.pre.sanitizePath(),
        proxy.checkDatacenter, proxy.setupClient
    ];

    server.get({
        path: '/ca',
        name: 'DescribeMetrics - proxy.send'
    }, serverpre, pre, proxy.send);

    server.post({
        path: '/ca/instrumentations',
        name: 'CreateInstrumentation - proxy.createInstrumentation'
    }, serverpre, pre, proxy.createInstrumentation);

    server.get({
        path: '/ca/instrumentations',
        name: 'GetInstrumentations'
    }, serverpre, pre, proxy.getFiltered);

    server.del({
        path: /\/ca\/instrumentations\/\d+/,
        name: 'DeleteInstrumentation'
    }, serverpre, pre, proxy.deleteInstrumentation);

    // Temporal fix, custom instrumentations
    server.post('/ca/instrumentations/custom', serverpre, pre, proxy.pingInstrumentation, proxy.createCustomInstrumentation);

    server.get({
        path: /^\/ca\/.*$/,
        name: 'GET /ca/*'
    }, serverpre, pre, proxy.send);

    server.post(/^\/ca\/(.*)$/, serverpre, pre, proxy.send);
    server.put(/^\/ca\/(.*)$/,  serverpre, pre, proxy.send);
    server.del(/^\/ca\/(.*)$/,  serverpre, pre, proxy.send);
};
