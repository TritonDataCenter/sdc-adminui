/**
 * views/servers.js
*/

var BaseView = require('views/base');
var Servers = require('models/servers');

var ServersListItem = BaseView.extend({
  template: 'servers-list-item',
  uri: function() {
    return 'servers'
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
    this.setElement(this.template());
    this.collection = new Servers();

    this.listView = new ServersList({
      collection: this.collection,
      el: this.$("tbody")
    });
  },
  render: function() {
    return this;
  }
});
