var BaseView = require('views/base');

module.exports = BaseView.extend({
  template: 'vm-delete-modal',
  initialize: function(options) {
    this.vm = options.vm;
    this.owner = options.owner;

    var tpl = $(this.compileTemplate());
    this.setElement(tpl);
  },
  events: {
    'click .delete': 'clickedDelete'
  },
  compileTemplate: function() {
    return this.template({
      vm: this.vm,
      owner: this.owner
    });
  },
  render: function() {
    this.$el.modal();
    return this;
  },
  clickedDelete: function(e) {
    var self = this;
    this.$el.modal('hide');
    this.vm.delete(function(job) {
      job.name = 'Delete VM'
      self.eventBus.trigger('watch-job', job);
      console.log(job);
    });
  }
});
