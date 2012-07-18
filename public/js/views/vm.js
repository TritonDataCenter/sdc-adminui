var BaseView = require('views/base');
var Vm = require('models/vm');
var Image = require('models/image');
var Server = require('models/server');
var User = require('models/user');

/**
 * VmView
 *
 * options.uuid uuid of VM
 * options.vm vm attrs
 */
var VmView = BaseView.extend({
  template: 'vm',

  sidebar: 'vms',

  events: {
    'click .server-hostname': 'clickedServerHostname',
    'click .start': 'clickedStartVm',
    'click .stop': 'clickedStopVm',
    'click .reboot': 'clickedRebootVm'
  },

  uri: function() {
    return _.str.sprintf('vms/%s', this.vm.get('uuid'));
  },

  initialize: function(options) {
    _.bindAll(this);
    this.vm = options.vm || new Vm();

    if (options.uuid) {
      this.vm.set({uuid: options.uuid});
    } else if (options.vm) {
      this.vm = options.vm;
    } else {
      alert('no uuid or vm error');
    }

    this.owner = new User();
    this.image = new Image();
    this.server = new Server();

    this.image.on('change', this.render, this);
    this.server.on('change', this.render, this);
    this.owner.on('change', this.render, this);

    this.image.set({ uuid: this.vm.get('image_uuid') });
    this.image.get('updated_at') || this.image.fetch();

    this.server.set({ uuid: this.vm.get('server_uuid') });
    this.server.get('last_modified') || this.server.fetch();

    this.owner.set({ uuid: this.vm.get('owner_uuid') });
    this.owner.get('cn') || this.owner.fetch();

    this.vm.on('change:image_uuid', function(m) {
      this.image.set({uuid: m.get('image_uuid')});
      this.image.fetch();
    }, this);

    this.vm.on('change:owner_uuid', function(m) {
      this.owner.set({uuid: m.get('owner_uuid')});
      this.owner.fetch();
    }, this),

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
      server: this.server,
      owner: this.owner
    });
  },

  clickedStartVm: function(e) {
    var self = this;
    this.vm.start(function(res) {
      res.name = 'Start VM';
      self.eventBus.trigger('watch-job', job);
    });
  },

  clickedStopVm: function(e) {
    var self = this;
    this.vm.stop(function(res) {
      res.name = 'Stop VM';
      self.eventBus.trigger('watch-job', job);
    });
  },

  clickedRebootVm: function(e) {
    var self = this;
    this.vm.reboot(function(job) {
      job.name = 'Reboot VM'
      self.eventBus.trigger('watch-job', job);
    });
  },

  clickedServerHostname: function() {
    this.eventBus.trigger('wants-view', 'server', { server:this.server });
  },

  render: function() {
    this.$el.html(this.compileTemplate());
    return this;
  },
});

module.exports = VmView;
