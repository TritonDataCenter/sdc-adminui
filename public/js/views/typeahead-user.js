var Backbone = require('backbone');
var Bloodhound = require('bloodhound');

var User = require('../models/user');

var UserTypeaheadTpl = require('../tpl/typeahead-user-select.hbs');
var UserTypeaheadSelectedTpl= require('../tpl/typeahead-user-selected.hbs');
var UserTypeaheadTplEmpty = require('../tpl/typeahead-user-empty.hbs');

var UserTypeaheadView = Backbone.Marionette.View.extend({
    events: {
        'typeahead:selected': 'onTypeaheadSelect',
        'typeahead:opened': 'onOpened',
        'typeahead:closed': 'onTypeaheadClosed',
        'typeahead:cursorchanged': 'onCursorChanged'
    },

    template: UserTypeaheadTpl,

    initialize: function(options) {
        options = options || {};
        this.selectedUser = null;
        this.initializeEngine();
    },

    onTypeaheadSelect: function(e, datum) {
        console.debug('typeahead selected');
        this.selectedUser = datum.model;
        this.trigger('selected', datum.model);
    },

    onTypeaheadClosed: function(e, suggestion, dataset) {
        console.debug('typeahead closed');
    },

    initializeEngine: function() {
        var self = this;
        this.engine= new Bloodhound({
            name: 'users',
            remote: {
                url: '/_/users?q=%QUERY',
                ajax: {
                    beforeSend: function(xhr) {
                        self.showLoading();
                    }
                },
                filter: function(users) {
                    self.hideLoading();
                    var datums = users.map(function(u) {
                        return {
                            model: new User(u),
                            'uuid': u.uuid,
                            'name': u.cn,
                            'login': u.login,
                            'email': u.email
                        };
                    });
                    return datums;
                },
            },
            queryTokenizer: Bloodhound.tokenizers.whitespace,
            datumTokenizer: function(u) {
                return [u.login, u.uuid, u.email];
            }
        });
        this.engine.initialize();
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

    render: function() {
        this.$el.typeahead({
            name: 'users',
            minLength: 1,
            highlight: true,
        },
        {
            displayKey: 'uuid',
            name: 'users',
            source: this.engine.ttAdapter(),
            templates: {
                suggestion: UserTypeaheadTpl
            }
        });
    }
});

module.exports = UserTypeaheadView;
