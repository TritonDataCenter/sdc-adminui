define(function(require) {
    var Img = require('models/image');
    var ImageView = Backbone.Marionette.ItemView.extend({
        sidebar: 'images',
        id: 'page-image',
        template: require('text!tpl/image.html'),
        url: function() {
            return _.str.sprintf('images/%s', this.model.get('uuid'));
        },
        events: {
            'activate': 'onClickActivate'
        },
        modelEvents: {
            'change': 'render',
            'error': 'onError'
        },

        templateHelpers: {
            'activatable': function() {
                return this.active === false;
            }
        },

        initialize: function(options) {
            if (options.uuid) {
                this.model = new Img({uuid: options.uuid});
            } else if (options.image) {
                this.model = options.image;
            }
            this.model.fetch();
        },
        onError: function(model, res) {
            app.vent.trigger('error', {
                xhr: res,
                context: 'images / imgapi'
            });
        },
        onClickActivate: function() {
            var self = this;
            this.model.activate({success: function() {
                self.model.fetch();
            }});
        }
    });

    return ImageView;
});