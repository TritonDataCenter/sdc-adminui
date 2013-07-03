var Model = require('./model');

var FWRule = Model.extend({
    idAttribute: 'uuid',
    url: function() {
        if (this.isNew()) {
            return '/_/fw/rules';
        } else {
            return '/_/fw/rules/' + this.get('uuid');
        }
    }
});

module.exports = FWRule;

