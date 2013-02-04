
define(function(require) {
    var JobProgressView = require('views/job-progress');
    var BaseView = require('views/base');
    var tplVmDelete = require('tpl!vm-delete');

    return Backbone.Marionette.ItemView.extend({
        template: tplVmDelete,
        attributes: {
            'class': 'modal hide fade'
        },

        events: {
            'click .delete': 'clickedDelete'
        },

        initialize: function(options) {
            this.vm = options.vm;
            this.owner = options.owner;
        },

        serializeData: function() {
            return {
                owner: this.owner.toJSON(),
                vm: this.vm.toJSON()
            };
        },

        show: function() {
            this.render();
            this.$el.modal();
        },

        clickedDelete: function(e) {
            var self = this;
            this.$el.modal('hide');
            this.vm.del(function(job) {
                job.name = 'Delete VM';
                var jobView = new JobProgressView({model: job});
                jobView.show();
            });
        }
    });
});