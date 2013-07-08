var Backbone = require('backbone');
var adminui = require('../adminui');
var NetworksDetailView = require('./networks-detail');

var NicsRowView = Backbone.Marionette.ItemView.extend({
    tagName: 'tr',
    template: require('../tpl/nics-row.hbs'),

    events: {
        'change input': 'onSelect',
        'click .network-name': 'gotoNetwork'
    },

    gotoNetwork: function() {
        var view = new NetworksDetailView({model: this.network});
        view.render().$el.modal();
    },

    serializeData: function() {
        var data = this.model.toJSON();
        if (this.network) {
            data.network_name = this.network.get('name');
        }
        return data;
    },

    onSelect: function(e) {
        var checked = this.$('input').is(':checked');

        if (checked) {
            this.$el.addClass('selected');
            this.trigger('select', this.model);
        } else {
            this.$el.removeClass('selected');
            this.trigger('deselect', this.model);
        }
    }
});

module.exports = NicsRowView;
