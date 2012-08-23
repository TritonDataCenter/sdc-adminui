
define(function(require) {
    var BaseView = require('views/base');
    var tplVmDelete = require('text!tpl/vm-delete.html');

    return BaseView.extend({
        template: tplVmDelete,

        events: {
            'click .delete': 'clickedDelete'
        },

        initialize: function(options) {
            this.vm = options.vm;
            this.owner = options.owner;
            var tpl = $(this.compileTemplate());
            this.setElement(tpl);
        },

        compileTemplate: function() {
            return this.template({
                vm: this.vm,
                owner: this.owner
            });
        },

        render: function() {
            var self = this;
            this.$el.on('hidden', function() {
                self.$el.remove();
            });
            this.$el.modal();

            return this;
        },

        clickedDelete: function(e) {
            var self = this;
            this.$el.modal('hide');
            this.vm.delete(function(job) {
                job.name = 'Delete VM';
                self.eventBus.trigger('watch-job', job);
            });
        }
    });
});