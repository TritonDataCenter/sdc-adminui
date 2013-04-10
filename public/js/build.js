var fs = require('fs');
var path = require('path');
var browserify = require('browserify');
var shim = require('browserify-shim');

var shimConfig = {
    'jquery': { path: './lib/jquery', exports: '$' },
    'jquery.serializeObject': { path: './lib/jquery.serializeObject', exports: null },
    'bootstrap': { path: './lib/bootstrap', exports: null },
    'kevinykchan-bootstrap-typeahead': {
        path: './lib/kevinykchan-bootstrap-typeahead',
        exports: null
    },
    'knockback': {
        path: './lib/knockback',
        exports: null,
        depends: {'knockout': 'ko'}
    },
    'knockout': {
        path: './lib/knockout-min',
        exports: 'ko',
        depends: {'underscore': '_', 'jquery': '$'}
    },
    'backbone': {
        path: './lib/backbone',
        exports: null,
        depends: { 'jquery': '$'}
    },
    'backbone.babysitter': { path: './lib/backbone.babysitter', exports: null },
    'backbone.eventbinder': { path: './lib/backbone.eventbinder', exports: null },
    'backbone.wreqr': { path: './lib/backbone.wreqr', exports: null },
    'backbone.marionette': {
        path: './lib/backbone.marionette',
        exports: null,
        depends: { 'underscore': '_'}
    },
    'backbone.modelbinder': { path: './lib/Backbone.ModelBinder', exports: null },
    'backbone.stickit': {
        path: './lib/backbone.stickit',
        exports: null,
        depends: {
            'backbone': 'Backbone',
            'underscore': '_'
        }
    }
};
var bundlePath = path.join(__dirname, 'bundle.js');

shim(browserify(), shimConfig)
    .transform(require.resolve('./transforms/tpl'))
    .require('underscore', { expose: 'underscore' })
    .require('underscore.string', { expose: 'underscore.string' })

    .require(require.resolve('./lib/jquery'), { expose: 'jquery' })
    .require(require.resolve('./lib/backbone'), { expose: 'backbone' })
    .require(require.resolve('./lib/moment.min'), { expose: 'moment' })

    .require(require.resolve('./main'), {entry: true})
    .bundle({debug:true})
    .on('error', function(err) {
        console.error(err);
    }).pipe(fs.createWriteStream(bundlePath))
    .on('end', function() {
        console.log('Build succeeded');
    });
