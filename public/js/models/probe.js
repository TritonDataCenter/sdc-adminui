var Backbone = require('backbone');


var Probe = Backbone.Model.extend({
    urlRoot: '/api/amon/probes',
    idAttribute: 'uuid',
    
    url: function() {
        if (this.isNew()) {
            return this.urlRoot;
        } else {
            return _.str.sprintf('/api/amon/probes/%s/%s', this.get('user'), this.get('uuid'));
        }
    },

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

module.exports = Probe;

