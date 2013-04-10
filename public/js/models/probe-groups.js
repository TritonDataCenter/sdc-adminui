var ProbeGroup = require('./probe-group');
var Backbone = require('backbone');

var ProbeGroups = Backbone.Collection.extend({
    model: ProbeGroup,
    url: function() {
        return _.str.sprintf("/_/amon/probegroups/%s", this.user);
    }
});

module.exports = ProbeGroups;