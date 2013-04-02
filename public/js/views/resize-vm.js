define(function(require) {
    var Packages = require('models/packages');
    var Package = require('models/package');
    var JobProgressView = require('views/job-progress');
    var PackagePreviewView = require('views/package-preview');

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
            this.selectedPackage = new Package();
            this.packagePreviewView = new PackagePreviewView({model: this.selectedPackage});
            this.bindTo(this.packages, 'reset', this.render, this);
            this.bindTo(this.model, 'change:package', this.onSelectPackage, this);
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
        onSelectPackage: function(p) {
            var pkg = p.get('package');
            if (pkg && typeof(pkg) === 'object') {
                this.selectedPackage.set(pkg);
            } else {
                this.selectedPackage.clear();
            }
            window.s = this.selectedPackage;
        },
        onRender: function() {
            this.$('.package-preview-container').html(this.packagePreviewView.render().el);
            var self = this;
            this.stickit(this.model, {
                'button': {
                    attributes: [{
                        name: 'disabled',
                        observe: 'package',
                        onGet: function(pkg) {
                            return pkg === null || pkg.length === 0;
                        }
                    }]
                },
                'select': {
                    observe: 'package',
                    selectOptions: {
                        'collection': 'this.packages',
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