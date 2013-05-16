var Backbone = require('backbone');

var DEFAULT_LOADING_MESSAGE = 'Loading...';
var DEFAULT_EMPTY_MESSAGE = 'No Records Found.';
var DEFAULT_ERROR_MESSAGE = 'Load Error.';

var EmptyView = Backbone.Marionette.View.extend({
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

        this.listenTo(this.model, 'request', this.renderLoading);
        this.listenTo(this.model, 'sync', this.renderLoaded);
        this.listenTo(this.model, 'error', function(m, err) {
            this.error = err;
            this.render();
        }, this);
    },

    template: function(data) {
        var content = null;
        if (data.error) {
            content = data.errorMessage;
        } else if (data.loaded === false) {
            content = data.loadingMessage;
        } else {
            content = data.emptyMessage;
        }
        var html = null;
        if (data.columns) {
            var td = $('<td>').attr('colspan', data.columns).html(content);
            html = td[0].outerHTML;
        } else {
            html = content;
        }
        return html;
    },
    render: function() {
        this.$el.html(this.template(this.serializeData()));
    },

    renderLoading: function() {
        this.loaded = false;
        this.render();
    },

    renderLoaded: function() {
        this.loaded = true;
        this.render();
    },

    serializeData: function() {
        if (this.columns) {
            this.tagName = 'tr';
        }

        return {
            'error': this.error,
            'columns': this.columns,
            'loaded': this.loaded,
            'loadingMessage': this.loadingMessage,
            'emptyMessage': this.emptyMessage,
            'errorMessage': this.errorMessage
        };
    }
});


module.exports = EmptyView;
