var restify = require('restify');
var sprintf = require('util').format;

module.exports = {};

module.exports.createServer = function(sslport) {
    return new HttpsEnforcer(sslport);
};

function HttpsEnforcer(sslport) {
    var server = restify.createServer();

    server.use(function (req, res, next) {
        if (!req.headers || !res.headers['host']) {
            res.send(400);
            return next(false);
        }
        res.header('Location',
           sprintf(
             "https://%s:%s%s",
             req.headers.host.split(':')[0],
             sslport,
             req.url));
        res.send(302);
        return next(false);
    });

    server.get(/.*/, function(req, res, next) {
        return res.redirect(sprintf("https://%s%s}", req.headers.host, req.headers.url));
    });

    return server;
}
