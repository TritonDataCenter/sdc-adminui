define(function(require) {

  var Images = require('models/images');

  var ImageRow = Backbone.Marionette.ItemView.extend({
    tagName: 'tr',
    template: require('text!tpl/images-row.html'),
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
    }/*,
    serializeData: function() {
      var data = Backbone.Marionette.ItemView.prototype.serializeData.call(this);
      data.public = false;
      data.acl = ['abcd', 'efgh'];
      return data;
    }*/
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





  var ImageDetailView = Backbone.View.extend({
    template: Handlebars.compile($("#template-images-detail").html()),
    render: function() {
      var elm = $(this.template(this.model.toJSON()));
      elm.modal();
      return this;
    }
  });

  return ImagesView;
});
