var BaseView = require('views/base');
var Vm = require('models/vm');
var Image = require('models/image');
var Server = require('models/server');

/**
 * VmView
 *
 * options.uuid uuid of VM
 * options.vm vm attrs
 */
var VmView = BaseView.extend({
  template: 'vm',

  uri: function() {
    return _.str.sprintf('vms/%s', this.vm.get('uuid'));
  },

  initialize: function(options) {
    this.vm = options.vm || new Vm();

    if (options.uuid) {
      this.vm.set({uuid: options.uuid});
    } else if (options.vm) {
      this.vm = options.vm;
    } else {
      alert('no uuid or vm error');
    }

    this.image = new Image();
    this.server = new Server();
    this.image.on('change', this.render, this);
    this.server.on('change', this.render, this);

    this.image.set({ uuid: this.vm.get('image_uuid') });
    this.image.get('updated_at') || this.image.fetch();

    this.server.set({ uuid: this.vm.get('server_uuid') });
    this.server.get('last_modified') || this.server.fetch();


    this.vm.on('change:image_uuid', function(m) {
      this.image.set({uuid: m.get('image_uuid')});
      this.image.fetch();
    }, this);

    this.vm.on('change:server_uuid', function(m) {
      this.server.set({uuid: m.get('server_uuid')});
      this.server.fetch();
    }, this);

    this.vm.on('change', this.render, this);

    this.vm.fetch();

    this.setElement(this.compileTemplate());
  },

  compileTemplate: function() {
    return this.template({
      vm: this.vm,
      image: this.image,
      server: this.server
    });
  },

  render: function() {
    this.$el.html(this.compileTemplate());
    return this;
  },
});

module.exports = VmView;
