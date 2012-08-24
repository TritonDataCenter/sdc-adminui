define(function(require) {
    return Backbone.Collection.extend({

        url: '/_/amon/alarms',

        fetchAlarms: function(vm) {
            if (vm.get('owner_uuid') && vm.get('uuid')) {
                var params = $.param({
                    user: vm.get('owner_uuid'),
                    machine: vm.get('uuid')
                });
                this.fetch({ data: params });
            }
        }
    });
});