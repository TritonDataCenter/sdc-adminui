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
        "backbone.modelbinder": "lib/Backbone.ModelBinder",
        "backbone.eventbinder": "lib/Backbone.eventbinder",
        "backbone.wreqr": "lib/backbone.wreqr",
        "handlebars": "lib/handlebars",
        "bootstrap": 'lib/bootstrap',
        "kevinykchan-bootstrap-typeahead": 'lib/kevinykchan-bootstrap-typeahead',
        "jquery": "require-jquery",
        "jquery.serializeObject": "lib/jquery.serializeObject",
        "tpl": "../tpl"
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

        'knockout',
        'knockback']
});

require(['adminui', 'router'], function(adminui, Router) {
    var router = new Router({app: adminui});
    adminui.start({router: router});
    window.$a = adminui;
});
