"use strict";

// UsersView

var $ = require('jquery');
var _ = require('underscore');
var Backbone = require('backbone');
var adminui = require('../adminui');
var UserForm = require('./user-form');
var Users = require('../models/users');
var tplUsers = require('../tpl/users.hbs');
var $ = require('jquery');
var React = require('react');
var GroupLabels = require('../components/pages/user/group-labels');


var UsersListItem = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/users-list-item.hbs'),
    attributes: {
        'class': 'users-list-item'
    },
    events: {
        'click a.login-link': 'onClickLoginName',
        'click a.account-link': 'onClickAccountName',
    },
    onRender: function() {
        var container = this.$('.groups-container').get(0);
        React.renderComponent(GroupLabels({userUuid : this.model.get('uuid')}), container);
    },
    onClose: function() {
        React.unmountComponentAtNode(this.$('.groups-container').get(0));
    },
    serializeData: function() {
        var data = _.clone(this.model.toJSON());
        data.approved_for_provisioning = data.approved_for_provisioning === "true" ?
            true : false;
        return data;
    },
    onClickAccountName: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        adminui.vent.trigger('showcomponent', 'user', {
            user: this.model.get('account')
        });
    },
    onClickLoginName: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        adminui.vent.trigger('showcomponent', 'user', {
            user: this.model
        });
    }
});





var EmptyView = require('./empty').extend();
var UsersList = Backbone.Marionette.CompositeView.extend({
    emptyView: EmptyView,
    template: require('../tpl/users-list.hbs'),
    itemView: UsersListItem,
    itemViewOptions: function() {
        return { emptyViewModel: this.collection };
    },
    itemViewContainer: '.users-list'
});


module.exports = Backbone.Marionette.ItemView.extend({
    template: tplUsers,
    url: 'users',
    id: "page-users",
    sidebar: 'users',
    events: {
        'input input[name=quicksearch]': 'onQuickSearch',
        'click button[data-event=new-user]': 'newUser',
        'click a.more': 'next'
    },

    initialize: function() {
        this.collection = new Users();
        this.usersListView = new UsersList({
            collection: this.collection
        });

        this.listenTo(this.collection, 'error', this.onError, this);
        this.listenTo(this.collection, 'request', this.onRequest, this);
        this.listenTo(this.collection, 'sync', this.onSync, this);

        this.throttledQuery = _.debounce(this.query, 200);
    },

    onQuickSearch: function() {
        var query = this.$('input[name=quicksearch]').val();
        var params = {};
        params.q = query;
        this.throttledQuery(params);
    },

    query: function(params) {
        this.$('.alert').hide();
        this.collection.firstPage();
        this.collection.reset();
        this.collection.params = params;
        this.collection.fetch();
    },

    onError: function(model, xhr) {
        adminui.vent.trigger('error', {
            xhr: xhr,
            context: 'users / ufds',
            message: 'error occured while retrieving user information'
        });
    },

    onShow: function() {
        this.collection.fetch();
        this.$('.caption').hide();
        this.$('.alert').hide();
        this.$('input').focus();
    },

    next: function() {
        if (this.collection.hasNext()) {
            this.collection.next();
            this.collection.fetch({remove: false});
        }
    },

    newUser: function() {
        var createView = new UserForm();
        createView.render();
        createView.on('user:saved', function(user) {
            adminui.vent.trigger('showcomponent', 'user', {user: user});
            adminui.vent.trigger('notification', {
                level: 'success',
                message: _.str.sprintf('User <strong>%s</strong> saved successfully.', user.get('login'))
            });
        });
    },

    onSync: function(c) {
        this.collection.objectCount = this.collection.objectCount || 0;
        if (this.collection.objectCount && this.collection.length) {
            if (this.collection.objectCount === this.collection.length) {
                this.$('.more').hide();
            } else {
                this.$('.more').show();
            }
            this.$('.record-count').html(this.collection.objectCount);
            this.$('.current-count').html(this.collection.length);
            this.$('.caption').show();
            this.$('.caption').css('visibility', 'visible');
        } else {
            this.$('.caption').css('visibility', 'hidden');
        }
    },

    onRequest: function() {
        this.$('.caption').css('visibility', 'hidden');
    },

    onRender: function() {
        this.usersListView.setElement(this.$('.users-list'));
        this.usersListView.render();
        return this;
    },

    onBeforeClose: function() {
        $(window).off('scroll', this.onSroll);
    }
});
