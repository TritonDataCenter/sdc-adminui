var Backbone = require('backbone');
var ItemTemplate = require('../tpl/vms-list-item.hbs');
var adminui = require('../adminui');

var Images = require('../models/images');
var User = require('../models/user');

var ItemView = Backbone.Marionette.ItemView.extend({
    tagName: 'tr',
    template: ItemTemplate,

    events: {
        'click .alias a': 'navigateToVmDetails'
    },

    initialize: function(options) {
        this.user = new User({uuid: options.model.get('owner_uuid')});
    },
    onShow: function() {
        var self = this;
        var user = self.user;

        this.user.fetch().done(function() {
            self.$('.owner-name').html(user.get('login'));
            self.$('.owner-name').attr("href", "/users/" + user.get('uuid'));
            if (user.get('company')) {
                self.$('.owner-company').html("at " + user.get('company'));
            }
        });
    },


    serializeData: function() {
        var data = this.model.toJSON();
        data.image = this.images.get(data.image_uuid);
        if (data.image) {
            data.image = data.image.toJSON();
        }
        data.ips = data.nics.map(function(n) {
            return n.ip;
        });
        return data;
    },

    navigateToVmDetails: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        adminui.vent.trigger('showview', 'vm', { vm: this.model });
    }
});

module.exports = require('./composite').extend({
    itemView: ItemView,
    itemViewContainer: 'tbody',
    attributes: {
        'class':'vms-list'
    },
    events: {
        'click a.more': 'onNext'
    },
    collectionEvents: {
        'sync': 'onSync'
    },

    template: require('../tpl/vms-list.hbs'),
    emptyView: require('./empty').extend({
        loadingMessage: 'Loading Virtual Machines...',
        emptyMessage: 'No Virtual Machines found',
        columns: 4
    }),

    itemViewOptions: function() {
        return {
            emptyViewModel: this.collection
        };
    },

    initialize: function() {
        var self = this;
        this.images = new Images();
        this.images.fetch().done(function() {
            self.render();
        });
        this.listenTo(this.collection, 'request', this.onRequest, this);
    },

    onBeforeItemAdded: function(iv) {
        iv.images = this.images;
        iv.usersCache = new Backbone.Collection();
    },

    onNext: function() {
        this.next();
    },

    onRender: function() {
        if (this.collection.length) {
            this.$('caption').css('visibility', 'visible');
        } else {
            this.$('caption').css('visibility', 'hidden');
        }
    },

    next: function() {
        if (this.collection.hasNext()) {
            this.collection.next();
            this.collection.fetch({remove: false});
        }
    },

    onRequest: function() {
        this.$('caption').css('visibility', 'hidden');
    },

    onSync: function() {
        if (this.collection.objectCount === this.collection.length) {
            this.$('.more').hide();
        } else {
            this.$('.more').show();
        }
        this.$('caption').css('visibility', 'visible');
        this.$('.record-count').html(this.collection.objectCount);
        this.$('.current-count').html(this.collection.length);
    }

});
