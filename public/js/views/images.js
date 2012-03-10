var Images = require('models/images');
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

    Images.on('reset', function() {
      Images.groupBy('os', function(cols) {
        cols.each(function(col) {
          self.listViews.add(new ListView({ collection: col }));
        })
      });
    });

    Images.fetch();
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
    this.collection.on('add', this.addOne);
    this.collection.on('reset', this.addAll);
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
  render: function() {
    this.setElement(this.template(this.model.toJSON()));
    return this;
  }
});
