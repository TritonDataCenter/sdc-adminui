var Backbone = require('backbone');

var DEFAULT_LOADING_MESSAGE = 'Loading...';
var DEFAULT_EMPTY_MESSAGE = 'No Records Found.';

var EmptyView = Backbone.Marionette.ItemView.extend({
    attributes: {
        'class': 'empty'
    },

    initialize: function(options) {
        options = options || {};
        this.model = options.emptyViewModel || options.model || {};
        this.emptyMessage = this.emptyMessage || options.emptyMessage || DEFAULT_EMPTY_MESSAGE;
        this.loadingMessage = this.loadingMessage || options.loadingMessage || DEFAULT_LOADING_MESSAGE;

        this.listenTo(this.model, 'sync', this.render);
        this.listenTo(this.model, 'reset', this.render);
    },

    template: function(data) {
        if (data.loaded) {
            return data.emptyMessage;
        } else {
            return data.loadingMessage;
        }
    },

    serializeData: function() {
        return {
            'loaded': this.model.loaded,
            'loadingMessage': this.loadingMessage,
            'emptyMessage': this.emptyMessage
        };
    }
});


module.exports = EmptyView;
