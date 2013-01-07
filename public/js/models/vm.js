define(function(require) {
    var Vm = Backbone.Model.extend({
        urlRoot: '/_/vms',

        idAttribute: 'uuid',

        defaults: {
            nics: [],
            snapshots: []
        },

        start: function(cb) {
            $.post(this.url()+'?action=start', {}, cb);
        },
        stop: function(cb) {
            $.post(this.url()+'?action=stop', {}, cb);
        },
        reboot: function(cb) {
            $.post(this.url()+'?action=reboot', {}, cb);
        },
        delete: function(cb) {
            $.delete_(this.url(), cb);
        },
        saveTags: function(cb) {
            $.put(this.url() + '/tags', this.get('tags'), cb);
        },
        createSnapshot: function(cb) {
            $.post(this.url()+'?action=create_snapshot',{}, cb);
        },
        removeNics: function(macs) {
            $.post(this.url()+'?action=remove_nics', {macs: macs}, cb);
        },
        saveAlias: function(cb) {
            $.put(this.url(), {
                alias: this.get('alias')
            }, cb);
        },
        saveCustomerMetadata: function(cb) {
            $.put(this.url() + '/customer_metadata', this.get('customer_metadata'), cb);
        },
        ips: function() {
            return this.get('nics').map(function(n) {
                return n.ip;
            });
        }
    });

    return Vm;
});