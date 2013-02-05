"use strict"

requirejs.config({
    urlArgs: (window.location.hostname === 'localhost') ? "bust=" + (new Date()).getTime() : null,
    paths: {
        "underscore": "lib/underscore",
        "underscore.string": "lib/underscore.string",
        "knockout": 'lib/knockout-min',
        "knockback": "lib/knockback",
        "backbone": "lib/backbone",
        "backbone.marionette": "lib/backbone.marionette",
        "backbone.babysitter": "lib/backbone.babysitter",
        "backbone.stickit": "lib/backbone.stickit",
        "backbone.modelbinder": "lib/Backbone.ModelBinder",
        "backbone.eventbinder": "lib/backbone.eventbinder",
        "backbone.wreqr": "lib/backbone.wreqr",
        "moment": "lib/moment.min",
        "handlebars": "lib/handlebars",
        "bootstrap": 'lib/bootstrap',
        "kevinykchan-bootstrap-typeahead": 'lib/kevinykchan-bootstrap-typeahead',
        "jquery": "require-jquery",
        "jquery.serializeObject": "lib/jquery.serializeObject"
    },
    shim: {
        "jquery.serializeObject": ["jquery"],
        "handlebars": { exports: 'Handlebars' },
        "underscore": {
            deps: ['underscore.string'],
            exports: function(_s) {
                _.str = _s;
                return _;
            }
        },
        "bootstrap": ['jquery'],
        "kevinykchan-bootstrap-typeahead": ["bootstrap"],
        "backbone": {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        "backbone.marionette": ['backbone', "backbone.wreqr", "backbone.eventbinder"],
        "backbone.modelbinder": ['backbone'],
        "backbone.stickit": ['backbone'],
        "knockback": ["underscore", "backbone"]
    },
    deps: [
        'jquery',
        'jquery.serializeObject',
        'bootstrap',
        'kevinykchan-bootstrap-typeahead',

        'handlebars',
        'underscore',
        'backbone',
        'backbone.marionette',
        'backbone.modelbinder',
        'backbone.stickit',
        'knockout',
        'knockback']
});

require(['adminui', 'router'], function(adminui, Router) {
    var router = new Router({app: adminui});
    adminui.start({router: router});
    window.$a = adminui;
});
