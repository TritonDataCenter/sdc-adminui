define(function(require) {
    var NicsView = Backbone.Marionette.ItemView.extend({
        template: require('text!tpl/nics.html'),
        initialize: function(options)  {
            this.model = options.vm;
        }
    });

    return NicsView;
});