define(function(require) {
    var Img = require('models/image');
    var ImageView = Backbone.Marionette.ItemView.extend({
        sidebar: 'images',
        id: 'page-image',
        template: require('text!tpl/image.html'),
        url: function() {
            return _.str.sprintf('images/%s', this.model.get('uuid'));
        },
        modelEvents: {
            'change': 'render'
        },
        initialize: function(options) {
            if (options.uuid) {
                this.model = new Img({uuid: options.uuid});
            } else if (options.image) {
                this.model = options.image;
            }
            this.model.fetch();
        }
    });

    return ImageView;
});