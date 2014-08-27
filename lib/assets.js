/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var path = require('path');
var filed = require('filed');
var less = require('less');
var fs = require('fs');
var restify = require('restify');
var mime = require('mime');

module.exports = {
    index: function(server) {
        return function(req, res, next) {
            if (req.headers['accept'] && req.headers['accept'].indexOf('text/html') !== -1) {
                req.pipe(filed(path.join(server.root, 'views/index.html'))).pipe(res);
                return next(false);
            } else {
                return next();
            }
        };
    },

    less: function(req, res, next) {
        var parser = new(less.Parser)({
            paths: [
                path.resolve(__dirname, '..', 'less'),
                path.resolve(__dirname, '..', 'bootstrap', 'less')
            ],
            filename: 'bootstrap.less'
        });

        var lessFilePath = path.join(__dirname, '..', 'less', 'app.less');
        var lessContents = fs.readFileSync(lessFilePath, 'ascii');


        parser.parse(lessContents, function(err, tree) {
            if (err) {
                req.log.fatal("Less Parser Error", err);
                return next(new restify.InternalError(err));
            }

            try {
                var css = tree.toCSS();
                res.setHeader('Content-Type', 'text/css');
                res.write(css);
                res.end();
                return next();
            } catch (ex) {
                req.log.fatal(ex);
                return next(new restify.InternalError(ex));
            }
        });
    },

    file: function(server, file) {
        var p;
        return function(req, res, next) {
            var pathname = req.path();
            if (typeof(file) === 'undefined') {
                p = path.join(server.root, 'www', pathname);
            } else {
                p = path.join(server.root, 'www', file);
            }
            res.setHeader('Content-Type', mime.lookup(p));

            var stream = fs.createReadStream(p);

            stream.on('error', function(err) {
                return next(new restify.NotFoundError());
            });
            stream.on('data', function(d) {
                res.write(d);
            });
            stream.on('end', function() {
                res.end();
                return next();
            });
        };
    }
};
