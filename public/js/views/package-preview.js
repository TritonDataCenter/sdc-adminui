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
            '[name=zfs_io_priority]': 'zfs_io_priority'
        },
        initialize: function(options) {
            this.model = options.model;
            this.bindTo(this.model, 'change:uuid', this.toggleDisplay);
        },
        toggleDisplay: function() {
            if (this.model.get('uuid') && this.model.get('uuid').length) {
                this.$el.show();
            } else {
                this.$el.hide();
            }
        },
        onRender: function() {
            this.stickit();
            this.toggleDisplay();
        }
    });

    return PackagePreviewView;
});