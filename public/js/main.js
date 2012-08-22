requirejs.config({
    urlArgs: "bust=" + (new Date()).getTime(),
    paths: {
        "underscore": "lib/underscore",
        "underscore.string": "lib/underscore.string",
        "backbone": "lib/backbone",
        "handlebars": "lib/handlebars",
        "bootstrap": 'lib/bootstrap',
        "jquery": "require-jquery",
        "tpl": "../tpl"
    },
    shim: {
        "handlebars": { exports: 'Handlebars' },
        "underscore": {
            deps: ['underscore.string'],
            exports: function(_s) {
                _.str = _s;
                return _;
            }
        },
        "bootstrap": ['jquery'],
        "backbone": {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        }
    },
    deps: ['jquery', 'bootstrap', 'handlebars', 'underscore', 'backbone']
});

require(['app'], function(Application) {
    $(function($) {
        window.$a = {};
        window.$a.app = new Application();

        Backbone.history.start({pushState: true});
    });
});
