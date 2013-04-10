var Backbone = require('backbone');


var Template = require('../tpl/services-create');

var View = Backbone.Marionette.ItemView.extend({
    template: Template
});

module.exports = View;
