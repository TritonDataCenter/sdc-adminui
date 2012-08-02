/**
 * views/servers.js
*/

var BaseView = require('views/base');
var Servers = require('models/servers');

var ServersListItem = BaseView.extend({
  template: 'servers-list-item',
  tagName: 'tr',

  events: {
    'click td':'navigateToServerDetails',
    'click button.setup':'setupServer'
  },

  uri: function() {
    return 'servers'
  },

  setupServer: function(e) {
    e.stopPropagation();

    console.log('Setup server');

    this.model.setup(function(res) {
      console.log('Setup Server returned');
      console.log(res);
    });
  },

  navigateToServerDetails: function() {
    this.eventBus.trigger('wants-view', 'server', { server:this.model });
  },

  render: function() {
    this.setElement(this.template(this.model.attributes));
    return this;
  }
});

var ServersList = BaseView.extend({

  initialize: function() {
    _.bindAll(this, 'addOne', 'addAll');

    this.collection.bind('all', this.addAll);
    this.collection.fetch();
  },

  addOne: function(cn) {
    var view = new ServersListItem({model:cn});
    this.$el.append(view.render().el);
  },

  addAll: function() {
    this.collection.each(this.addOne);
  },

  render: function() {
    return this;
  }
});

var ServersView = module.exports = BaseView.extend({
  name: 'servers',

  template: 'servers',

  initialize: function(options) {
    this.collection = new Servers();
    this.listView = new ServersList({ collection: this.collection });
  },

  render: function() {
    console.log(this.$el);
    this.$el.html(this.template());

    this.listView.setElement(this.$("tbody")).render();

    return this;
  }
});
