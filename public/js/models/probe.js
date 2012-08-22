define(['backbone'], function(Backbone) {

    var Probe = Backbone.Model.extend({
        urlRoot: '/_/amon/probes',

        validate: function(attrs) {
            var errors = {};

            if (!attrs.name || attrs.name.length === 0) {
                errors.name = 'name is required';
            }

            if (!attrs.type || attrs.type.length === 0) {
                errors.type = 'type is required';
            }

            if (Probe.types.indexOf(attrs.type) === -1) {
                errors.type = 'specified probe type does not exist';
            }

            if (_.size(errors) > 0) {
                return errors;
            }
        }
    });

    Probe.types = ['machine-up', 'log-scan', 'icmp', 'http'];

    return Probe;
});
