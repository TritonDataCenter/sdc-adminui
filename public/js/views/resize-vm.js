define(function(require) {
    var Packages = require('models/packages');
    var JobProgressView = require('views/job-progress');
    var ViewModel = Backbone.Model.extend({});
    var View = Backbone.Marionette.ItemView.extend({
        template: require('tpl!resize-vm'),
        attributes: {
            'class': 'modal'
        },
        events: {
            'click button': 'onClickResize'
        },
        initialize: function(options) {
            this.vm = options.vm;
            this.model = new ViewModel();

            this.packages = new Packages();
            this.packages.fetch();
            this.bindTo(this.packages, 'reset', this.render, this);
        },
        onClickResize: function() {
            var self = this;
            var pkg = new ViewModel(this.model.get('package'));
            var values = {};
            values.billing_id = pkg.get('uuid');
            values.package_name = pkg.get('name');
            values.package_version = pkg.get('version');
            values.cpu_cap = pkg.get('cpu_cap');
            values.max_lwps = pkg.get('max_lwps');
            values.max_swap = pkg.get('max_swap');
            values.quota = pkg.get('quota');
            values.vcpus = pkg.get('vcpus');
            values.zfs_io_priority = pkg.get('zfs_io_priority');
            values.ram = pkg.get('max_physical_memory');
            this.vm.update(values, function(job) {
                self.$el.modal('hide');
                var jobView = new JobProgressView({model: job});
                jobView.show();
            });
        },
        onRender: function() {
            var self = this;
            this.stickit(this.model, {
                'select': {
                    observe: 'package',
                    selectOptions: {
                        'collection': function() {
                            return self.packages.toJSON();
                        },
                        'labelPath': 'name'
                    }
                }
            });
        },
        show: function() {
            this.render();
            this.$el.modal();
        }
    });

    return View;
});