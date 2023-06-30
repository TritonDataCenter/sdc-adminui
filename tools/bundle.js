#!/usr/bin/env node
/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright 2020 Joyent, Inc.
 * Copyright 2023 MNX Cloud, Inc.
 */

/*
 * This program takes the files in www/js and less/ and converts and bundles
 * them into three browser-side files (app.css, app.js and libs.js).
 *
 * These files are only rebuilt if the modified timestamps of any file in
 * either www/js or less/ are newer than the three browser-side files. This is
 * mainly to speed up restarts in the development cycle.
 *
 * If the MINIFY environment is set, an additional minification step is added
 * to shrink the Javascript files.
 */

var assert = require('assert-plus');
var vasync = require('vasync');
var bunyan = require('bunyan');
var browserify = require('browserify');
var fs = require('fs');
var path = require('path');
var reactify = require('reactify');
var shim = require('browserify-shim');
var format = require('util').format;
var uglify = require('uglify-js');
var assets = require('../lib/assets');
var join = path.join;


var CSS_FILE = 'app.css';
var APP_FILE = 'app.js';
var LIB_FILE = 'libs.js';
var JS_ROOT = path.resolve(__dirname, '..', 'www', 'js');
var CSS_ROOT = path.resolve(__dirname, '..', 'less');
var LOG = bunyan.createLogger({name:'bundler'});

var SHIM_CFG = {
    'jquery': {
        path: './lib/jquery',
        exports: '$'
    },
    'jquery.serializeObject': {
        path: './lib/jquery.serializeObject',
        depends: {'jquery': '$'},
        exports: null
    },
    'jquery.autosize': {
        path: './lib/jquery.autosize',
        depends: {'jquery': '$'},
        exports: null
    },
    'jquery.chosen': {
        path: './lib/chosen.jquery',
        depends: { 'jquery': '$' },
        exports: null
    },
    'bootstrap': {
        path: './lib/bootstrap',
        exports: null
    },
    'd3': {
        path: './lib/d3.v3',
        exports: 'd3'
    },
    'showdown': {
        path: './lib/showdown',
        exports: 'Showdown'
    },
    'react-chosen': {
        path: './lib/react-chosen',
        depends: {
            'react': 'React'
        },
        exports: 'Chosen'
    },
    'bootstrap.tags': {
        path: './lib/bootstrap-tags',
        depends: {'jquery': '$'},
        exports: null
    },
    'typeahead': {
        path: './lib/typeahead.jquery',
        exports: null
    },
    'bloodhound': {
        path: './lib/bloodhound',
        exports: 'Bloodhound'
    },
    'backbone.marionette': {
        path: './lib/backbone.marionette',
        exports: null,
        depends: {
            'jquery': '$',
            'underscore': '_',
            'backbone': 'Backbone'
        }
    },
    'backbone.modelbinder': {
        path: './lib/Backbone.ModelBinder',
        exports: null
    },
    'backbone.syphon': {
        path: './lib/backbone.syphon',
        exports: null,
        depends: {
            'backbone': 'Backbone',
            'underscore': '_'
        }
    },
    'backbone.stickit': {
        path: './lib/backbone.stickit',
        exports: null,
        depends: {
            'backbone': 'Backbone',
            'underscore': '_'
        }
    },
    'raphael': {
        path: './lib/raphael-min',
        exports: 'Raphael'
    }
};

Object.keys(SHIM_CFG).forEach(function (k) {
    if (SHIM_CFG[k].path) {
        SHIM_CFG[k].path = join(JS_ROOT, SHIM_CFG[k].path);
    }
});


function prepAppBundle() {
    var opts = {
        extensions: [ '.js', '.jsx' ],
        debug: true
    };

    var app = shim(browserify(opts), SHIM_CFG);

    app.transform(join(JS_ROOT, './transforms/tpl'))
        .transform(reactify)
        .require(join(JS_ROOT, './adminui'),
        { expose: 'adminui', entry: true });

    app.external('jquery');
    app.external('moment');
    app.external('underscore');
    app.external('underscore.string');
    app.external('epoch');
    app.external('react');
    app.external('backbone');
    app.external('superagent');
    app.external('bootstrap.datetimepicker');

    return app;
}


function prepLibsBundle() {
    var opts = { noParse: [ join(JS_ROOT, './lib/epoch.0.5.2.min') ] };

    var blibs = browserify(opts);
    blibs.require('react');
    blibs.require('underscore');
    blibs.require('underscore.string');
    blibs.require('backbone');
    blibs.require('superagent');
    blibs.require(join(JS_ROOT, './lib/jquery'), { expose: 'jquery' });
    blibs.require('moment');
    blibs.require(join(JS_ROOT, './lib/epoch.0.5.2.min'), { expose: 'epoch' });
    blibs.require(join(JS_ROOT, './lib/bootstrap-datetimepicker'), {
        expose: 'bootstrap.datetimepicker'
    });

    return blibs;
}


function bundle(bundler, outFilename, cb) {
    assert.object(bundler, 'object');
    assert.string(outFilename, 'outFilename');
    assert.func(cb, 'cb');

    var startTime = new Date().getTime();
    var outPath = path.join(JS_ROOT, '..', outFilename);
    var tmpPath = format('%s.%s', outPath, startTime);

    LOG.info('[%s] building', outFilename);

    var bs = bundler.bundle();

    var bytes, time;
    bundler.on('bytes', function (b) { bytes = b; });
    bundler.on('time', function (t) { time = t; });

    bs.on('error', function (err) {
        LOG.fatal(err, '[%s] build error', outFilename);
        cb(err);
        return;
    });

    bs.on('end', function onEnd() {
        if (bytes && time) {
            LOG.info('[%s] %s bytes (%s seconds)',
                     outFilename, bytes, (time / 1000).toFixed(2));
        } else {
            LOG.info('[%s] OK', outFilename);
        }

        fs.rename(tmpPath, outPath, function onRename(err) {
            if (err) {
                cb(err);
                return;
            }

            if (!process.env.MINIFY) {
                cb(null, outFilename);
                return;
            }

            var min = uglify.minify(outPath);
            fs.writeFileSync(outPath + '.min.js', min.code, 'utf8');
            LOG.info('[%s.min.js]', outFilename);

            fs.rename(outPath + '.min.js', outPath, function onRename2() {
                LOG.info('[%s.min.js] -> [%s]', outFilename, outFilename);
                cb(null, outFilename);
            });
        });
    });

    bs.pipe(fs.createWriteStream(tmpPath));
}


function rebundle(cb) {
    assert.func(cb, 'cb');

    vasync.parallel({funcs: [
        function buildCss(next) {
            LOG.info('[%s] building', CSS_FILE);

            assets.buildLESS(function onBuild(err, css) {
                if (err) {
                    LOG.fatal(err, '[%s] build error', CSS_FILE);
                    next(err);
                    return;
                }

                var cssPath = join(JS_ROOT, '..', CSS_FILE);
                fs.writeFile(cssPath, css, function onWrite(err2) {
                    if (err2) {
                        next(err2);
                        return;
                    }

                    LOG.info('[%s] OK (%d bytes)', CSS_FILE, css.length);

                    next();
                });
            });
        },

        function buildApp(next) {
            var ba = prepAppBundle();
            bundle(ba, APP_FILE, next);
        },

        function buildLibs(next) {
           var bl = prepLibsBundle();
           bundle(bl, LIB_FILE, next);
        }
    ]}, cb);
}


function findNewestFileStat(dirPath, cb) {
    assert.string(dirPath, 'dirPath');
    assert.func(cb, 'cb');

    fs.readdir(dirPath, function onReaddir(err, filenames) {
        if (err) {
            cb(err);
            return;
        }

        var stats = [];
        vasync.forEachParallel({
            inputs: filenames,
            func: function onMap(filename, next) {
                var filePath = join(dirPath, filename);

                fs.stat(filePath, function onStat(err2, stat) {
                    if (stat.isDirectory()) {
                        findNewestFileStat(filePath, function (err3, st) {
                            if (err3) {
                                next(err3);
                                return;
                            }
                            stats.push(st);
                            next();
                        });
                    } else {
                        stats.push(stat);
                        next();
                    }
                });
            }
        }, function onMapDone(err2) {
            if (err2) {
                cb(err2);
                return;
            }

            var newest = stats.reduce(function onReduce(curr, stat) {
                return curr.mtime > stat.mtime ? curr : stat;
            }, new Date(0));

            cb(null, newest);
        });
    });
}


findNewestFileStat(JS_ROOT, function onNewestJs(err, newestJsStat) {
    if (err) {
        LOG.fatal(err, 'Error recursing JS');
        return;
    }

    findNewestFileStat(CSS_ROOT, function onNewestCss(err2, newestCssStat) {
        if (err2) {
            LOG.fatal(err, 'Error recursing CSS');
            return;
        }

        try {
            var cssMtime = fs.statSync(join(JS_ROOT, '..', CSS_FILE)).mtime;
            var appMtime = fs.statSync(join(JS_ROOT, '..', APP_FILE)).mtime;
            var libMtime = fs.statSync(join(JS_ROOT, '..', LIB_FILE)).mtime;
        } catch (e) {
            if (e.code !== 'ENOENT') {
                LOG.FATAL(e, 'Error stat()ing');
                return;
            }
        }

        var mtime = Math.max(newestJsStat.mtime, newestCssStat.mtime);

        if (cssMtime > mtime && appMtime > mtime && libMtime > mtime) {
            LOG.info('No rebundle needed');
            LOG.info('Done');
            return;
        }

        rebundle(function (err3) {
            if (err3) {
                LOG.fatal(err, 'Error building');
            } else {
                LOG.info('Done');
            }
        });
    });
});
