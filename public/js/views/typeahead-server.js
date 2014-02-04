var Backbone = require('backbone');
var Bloodhound = require('bloodhound');
var _ = require('underscore');

var Servers = require('../models/servers');

var ServerTypeaheadTpl = require('../tpl/typeahead-server.hbs');

var UserTypeaheadView = Backbone.Marionette.View.extend({
    events: {
        'typeahead:selected': 'onTypeaheadSelect',
        'typeahead:opened': 'onOpened',
        'typeahead:closed': 'onTypeaheadClosed',
        'typeahead:cursorchanged': 'onCursorChanged'
    },

    template: ServerTypeaheadTpl,

    initialize: function(options) {
        options = options || {};
        this.serversCollection = new Servers();
        this.listenTo(this.serversCollection, 'sync', this.initializeEngine);
    },

    onTypeaheadSelect: function(e, datum) {
        this.selectedUser = datum.model;
        this.trigger('selected', datum.model);
    },

    onTypeaheadClosed: function(e, suggestion, dataset) {
    },

    initializeEngine: function() {
        var self = this;
        var source = this.serversCollection.map(function(s) {
            return {
                'model': s,
                'uuid': s.get('uuid'),
                'tokens': [s.get('hostname'), s.get('uuid')],
                'hostname': s.get('hostname')
            };
        });

        this.engine = new Bloodhound({
            name: 'servers',
            local: source,
            datumTokenizer: function(datum) {
                return datum.tokens;
            },
            queryTokenizer: function(query) {
                return Bloodhound.tokenizers.whitespace(query);
            },
            limit: 8
        });

        this.engine.initialize();
        this.renderInput();
    },

    showLoading: function() {
        if (this.$el.parent().parent().find('.tt-loading').length) {
            this.$el.parent().parent().find(".tt-loading").show();
        } else {
            this.$el.parent().after("<div class='tt-loading'>Loading</div>");
        }
    },

    hideLoading: function() {
        this.$el.parent().parent().find(".tt-loading").hide();
    },
    renderInput: function() {
        this.$el.typeahead({
            name: 'servers',
            minLength: 1,
            highlight: true,
        },
        {
            displayKey: 'uuid',
            name: 'servers',
            source: this.engine.ttAdapter(),
            templates: {
                suggestion: ServerTypeaheadTpl
            }
        });
    },

    render: function() {
        this.serversCollection.fetch();
    }
});

module.exports = UserTypeaheadView;
