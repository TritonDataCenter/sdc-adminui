define(function(require) {

    var Images = require('models/images');
    var app = require('adminui');

    var ImageRow = Backbone.Marionette.ItemView.extend({
        tagName: 'tr',
        template: require('text!tpl/images-row.html'),
        events: {
            'click .image-name': 'onClickImageName'
        },
        onClickImageName: function(e) {
            if (e) e.preventDefault();
            app.vent.trigger('showview', 'image', {image: this.model});
        },
        templateHelpers: {
            active: function() {
                return this.state == 'active';
            },
            unactivated: function() {
                return this.state == 'unactivated';
            },
            disabled: function() {
                return this.state == 'disabled';
            }
        }
    });

    var ImagesView = Backbone.Marionette.CompositeView.extend({
        template: require('text!tpl/images.html'),
        url: 'images',
        sidebar: 'images',
        itemView: ImageRow,
        itemViewContainer: 'tbody',
        initialize: function(opts) {
            this.collection = new Images();
            this.collection.fetch();
        },
        serializeData: function() {
            return {collection: this.collection};
        },
        onCompositeCollectionRendered: function()  {
            this.$('.record-count').html(this.collection.length);
        }
  });

    return ImagesView;
});
