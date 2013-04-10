var Backbone = require('backbone');



var SystemStatus = Backbone.Model.extend({
    url: '/_/ping',
    defaults: {
    }
});

	var View = Backbone.Marionette.ItemView.extend({
    sidebar: 'system-status',
    id: "page-system-status",
    url: '/system-status',
    getTemplate: function() {
        return _.template(require('../tpl/system-status.hbs'));
    },
    initialize: function() {
        this.model = new SystemStatus();
        this.bindTo(this.model, 'change', this.render);
    },
    onShow: function() {
        this.model.fetch();
    },
    serializeData: function(e) {
        return { services: this.model.attributes };
    },
    onRender: function() {
        console.log('render');
        console.log(this.model);
    }
	});

module.exports = View;
