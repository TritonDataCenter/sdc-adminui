// UsersView

var _ = require('underscore');
var Backbone = require('backbone');

var adminui = require('../adminui');

var UserForm = require('./user-form');
var Users = require('../models/users');
var UserView = require('./user');
var tplUsers = require('../tpl/users.hbs');

var UsersListItem = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/users-list-item.hbs'),
    attributes: {
        'class': 'users-list-item'
    },
    events: {
        'click a.login-link': 'onClickLoginName'
    },
    serializeData: function() {
        var data = _.clone(this.model.toJSON());
        data.approved_for_provisioning = data.approved_for_provisioning === "true" ?
            true : false;
        return data;
    },
    onClickLoginName: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        adminui.vent.trigger('showview', 'user', {
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
        this.createView = new UserForm();
        this.createView.render();
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
        } else {
            this.$('.caption').hide();
        }
    },

    onRequest: function() {
        this.$('.caption').hide();
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
