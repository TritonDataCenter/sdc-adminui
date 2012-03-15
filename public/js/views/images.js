var Images = require('models/images');
var images = new Images();

'use strict';

var ImagesView = module.exports = Backbone.View.extend({
  template: Handlebars.compile($("#template-images").html()),
  name: 'images',
  events: { },

  initialize: function() {
    _(this).bindAll('render', 'addListView');

    var self = this;

    this.setElement(this.template());
    this.listViews = new Backbone.Collection();
    this.listViews.on('add', this.addListView);

    images.on('reset', function() {
       images.groupBy('os').each(function(col) {
        self.listViews.add(new ListView({ collection: col }));
      });
    });

    images.fetch();
  },

  addListView: function(list) {
    this.$("#sdc-images-list").append(list.attributes.render().el);
  },

  render: function() {
    return this;
  }
}, Backbone.Model);





var ListView = Backbone.View.extend({
  template: Handlebars.compile($("#template-images-list").html()),
  initialize: function(options) {
    _.bindAll(this, 'addOne', 'addAll');

    this.os = this.collection.groupedBy;
    this.collection = _(this.collection.groupBy('name').map(function(n) {
      var vers = n.models.sort(function(a, b) {
        return a.get('version') < b.get('version');
      });
      return vers[0];
    }));
  },

  addOne: function(image) {
    var view = new ListItemView({ model: image });
    this.$('ul').append(view.render().el);
  },

  addAll: function() {
    this.collection.each(this.addOne);
  },

  render: function(el) {
    this.$el.append(this.template({ os: this.os }));
    this.addAll();

    return this;
  }

});




var ListItemView = Backbone.View.extend({
  template: Handlebars.compile($("#template-images-list-item").html()),
  events: {
    'click button': 'presentDetailView'
  },

  presentDetailView: function() {
    var view = new ImageDetailView({ model: this.model });
    view.render();
  },

  render: function() {
    this.setElement(this.template(this.model.toJSON()));
    return this;
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
