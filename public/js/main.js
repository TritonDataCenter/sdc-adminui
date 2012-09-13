requirejs.config({
    urlArgs: "bust=" + (new Date()).getTime(),
    paths: {
        "underscore": "lib/underscore",
        "underscore.string": "lib/underscore.string",
        "knockout": 'lib/knockout-min',
        "knockback": "lib/knockback",
        "backbone": "lib/backbone",
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
        'knockout',
        'knockback']
});

require(['app'], function(Application) {
    $(function($) {
        window.$a = {};
        window.$a.app = new Application();

        Backbone.history.start({pushState: true});
    });
});
