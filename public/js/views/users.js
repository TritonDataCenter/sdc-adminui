var Backbone = require('backbone');


// UsersView
var UserForm = require('./user-form');
var BaseView = require('./base');
var Users = require('../models/users');
var UserView = require('./user');
var tplUsers = require('../tpl/users.hbs');
var adminui = require('../adminui');

var UsersListItem = Backbone.Marionette.ItemView.extend({
    template: require('../tpl/users-list-item.hbs'),
    tagName: 'tr',
    events: {
        'click a.login': 'onClickLoginName'
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

var EmptyView = require('./empty').extend({columns:3});
var UsersList = Backbone.Marionette.CompositeView.extend({
    emptyView: EmptyView,
    template: require('../tpl/users-list.hbs'),
    itemView: UsersListItem,
    itemViewOptions: function() {
        return { emptyViewModel: this.collection };
    },
    itemViewContainer: 'tbody'
});

var FilterForm = Backbone.View.extend({
    events: {
        'submit form': 'onSubmit',
        'change input': 'onSubmit',
        'change select': 'onSubmit'
    },
    onSubmit: function(e) {
        e.preventDefault();

        var params = this.$('form').serializeObject();
        this.trigger('query', params);
    }
});

module.exports = Backbone.Marionette.ItemView.extend({
    template: tplUsers,
    url: 'users',
    id: "page-users",
    sidebar: 'users',
    events: {
        'click button[data-event=new-user]': 'newUser'
    },

    initialize: function() {
        this.collection = new Users();
        this.usersListView = new UsersList({
            collection: this.collection
        });

        this.filterView = new FilterForm();

        this.listenTo(this.collection, 'error', this.onError, this);
        this.listenTo(this.collection, 'request', this.onRequest, this);
        this.listenTo(this.collection, 'sync', this.onSync, this);
    },


    query: function(params) {
        this.$('.alert').hide();
        this.collection.firstPage();
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
        this.$('.alert').hide();
        $(window).on('scroll', this.onScroll.bind(this));
    },

    onScroll: function(e) {
        if (this.collection.length) {
            if ($(window).scrollTop() + $(window).height() > $(document).height() - 20) {
                this.next();
            }
        }
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
        this.$('.record-count').html(this.collection.objectCount);
        this.$('.current-count').html(this.collection.length);
        this.$('caption').show();
    },

    onRequest: function() {
        this.$('caption').hide();
    },

    onRender: function() {
        this.filterView.setElement(this.$('.users-filter'));
        this.usersListView.setElement(this.$('.users-list'));
        this.usersListView.render();

        this.listenTo(this.filterView, 'query', this.query, this);
        this.collection.fetch();

        return this;
    },

    onBeforeClose: function() {
        $(window).off('scroll', this.onSroll);
    }
});
