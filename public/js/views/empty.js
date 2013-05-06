var Backbone = require('backbone');

var DEFAULT_LOADING_MESSAGE = 'Loading...';
var DEFAULT_EMPTY_MESSAGE = 'No Records Found.';
var DEFAULT_ERROR_MESSAGE = 'Load Error.';

var EmptyView = Backbone.Marionette.ItemView.extend({
    tagName: function() {
        if (this.columns) {
            return 'tr';
        } else {
            return 'div';
        }
    },
    attributes: function() {
        return {
            'class': 'zero-state'
        };
    },

    initialize: function(options) {
        options = options || {};

        this.model = options.emptyViewModel || options.model || {};
        this.emptyMessage = this.emptyMessage || options.emptyMessage || DEFAULT_EMPTY_MESSAGE;
        this.loadingMessage = this.loadingMessage || options.loadingMessage || DEFAULT_LOADING_MESSAGE;
        this.errorMessage = this.errorMessage || options.errorMessage || DEFAULT_ERROR_MESSAGE;
        this.listenTo(this.model, 'sync', this.render);
        this.listenTo(this.model, 'reset', this.render);
        this.listenTo(this.model, 'error', function(m, err) {
            this.error = err;
            this.render();
        }, this);
    },

    template: function(data) {
        var content = null;
        if (data.error) {
            content = data.errorMessage;
        } else if (data.loaded) {
            content = data.emptyMessage;
        } else {
            content = data.loadingMessage;
        }

        if (data.columns) {
            var td = $('<td>').attr('colspan', data.columns).html(content);
            return td[0].outerHTML;
        } else {
            return content;
        }

    },

    serializeData: function() {
        if (this.columns) {
            this.tagName = 'tr';
        }

        return {
            'error': this.error,
            'columns': this.columns,
            'loaded': this.model.loaded,
            'loadingMessage': this.loadingMessage,
            'emptyMessage': this.emptyMessage,
            'errorMessage': this.errorMessage
        };
    }
});


module.exports = EmptyView;
