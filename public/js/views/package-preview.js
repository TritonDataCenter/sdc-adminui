define(function(require) {

    var PackagePreviewView = Backbone.Marionette.ItemView.extend({
        template: require('tpl!package-preview'),
        attributes: {
            'class': 'package-preview'
        },
        bindings: {
            '[name=max_physical_memory]': 'max_physical_memory',
            '[name=max_swap]': 'max_swap',
            '[name=name]': 'name',
            '[name=version]': 'version',
            '[name=vcpus]': 'vcpus',
            '[name=quota]': 'quota',
            '[name=zfs_io_priority]': 'zfs_io_priority',
            ':el': {
                observe: 'uuid',
                visible: function(val) {
                    return !! val;
                }
            }
        },
        initialize: function(options) {
            this.model = options.model;
        },
        onRender: function() {
            this.stickit(this.model, this.bindings);
        }
    });

    return PackagePreviewView;
});