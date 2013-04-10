var Backbone = require('backbone');
var ProbeGroup = Backbone.Model.extend({
    idAttribute: 'uuid',
    url: function() {
        if (this.isNew()) {
            return _.str.sprintf("/_/amon/probegroups/%s", this.get('user'));
        } else {
            return _.str.sprintf("/_/amon/probegroups/%s/%s", this.get('user'), this.get('uuid'));
        }
    }
});

module.exports = ProbeGroup;