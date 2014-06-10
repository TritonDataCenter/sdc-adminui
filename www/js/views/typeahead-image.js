var Backbone = require('backbone');
var Bloodhound = require('bloodhound');
var _ = require('underscore');

var Images = require('../models/images');

var ImageTypeaheadTpl = require('../tpl/typeahead-image.hbs');

var ImageTypeaheadView = Backbone.Marionette.View.extend({
    events: {
        'typeahead:selected': 'onTypeaheadSelect',
        'typeahead:opened': 'onOpened',
        'typeahead:closed': 'onTypeaheadClosed',
        'typeahead:cursorchanged': 'onCursorChanged'
    },

    template: ImageTypeaheadTpl,

    initialize: function(options) {
        options = options || {};
        this.imagesCollection = new Images();
        this.listenTo(this.imagesCollection, 'sync', this.initializeEngine);
    },

    onTypeaheadSelect: function(e, datum) {
        this.selectedImage = datum.model;
        this.trigger('selected', datum.model);
    },

    onTypeaheadClosed: function(e, suggestion, dataset) {
    },

    initializeEngine: function() {
        var self = this;
        var source = this.imagesCollection.map(function(i) {
            return {
                'model': i,
                'uuid': i.get('uuid'),
                'tokens': [i.get('uuid'), i.get('version'), i.get('name')],
                'name': i.get('name'),
                'version': i.get('version')
            };
        });

        this.engine = new Bloodhound({
            name: 'images',
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
            name: 'images',
            minLength: 3,
            highlight: true,
        },
        {
            displayKey: 'uuid',
            name: 'images',
            source: this.engine.ttAdapter(),
            templates: {
                suggestion: ImageTypeaheadTpl
            }
        });
    },

    render: function() {
        this.imagesCollection.fetch();
    }
});

module.exports = ImageTypeaheadView;
