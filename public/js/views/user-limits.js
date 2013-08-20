var Backbone = require('backbone');
var _ = require('underscore');


var UserLimitsForm = require('./user-limits-form');
var Limits = require('../models/limits');
var CompositeView = require('./composite');

var ItemView = Backbone.Marionette.ItemView.extend({
    tagName: 'li',
    template: require('../tpl/user-limits-item.hbs'),
    events: {
        'click a.edit': 'onClickEdit',
        'click a.del': 'onClickDestroy'
    },
    onClickEdit: function() {
        var self = this;

        var form = new UserLimitsForm({
            model: this.model,
            user: this.model.collection.user
        });

        form.render();

        this.$el.hide();
        this.$el.after(form.el);
        form.on('cancel', function() {
            self.$el.show();
        });
        form.on('limit:saved', function(model) {
            self.model.collection.fetch({reset: true}).done(function() {
                self.render();
            });
            self.$el.fadeIn();
        });
    },

    onClickDestroy: function() {
        var confirm = window.confirm("Are you sure you want to remove limits for datacenter: " + this.model.get('datacenter'));
        if (confirm) {
            this.model.destroy();
        }
    },

    serializeData: function() {
        var attrs = Backbone.Marionette.ItemView.prototype.serializeData.apply(this, arguments);
        var data = {
            datacenter: attrs.datacenter,
            limits: []
        };

        _.each(attrs, function(v, k) {
            if (k === 'datacenter') {
                return;
            }
            k = _.str.trim(k);
            v = _.str.trim(v);
            data.limits.push({image: k, value: v});
        });

        return data;
    }
});

var LimitsView = CompositeView.extend({
    template: require('../tpl/user-limits.hbs'),
    itemView: ItemView,
    itemViewContainer: 'ul',
    itemViewOptions: function() {
        return { emptyViewModel: this.collection };
    },
    attributes: {
        'class':'limits-list'
    },

    events: {
        'click .add-limit': 'onClickAddLimit'
    },

    initialize: function(options) {
        if (typeof(options.user) === 'undefined') {
            throw new TypeError('options.user user uuid required');
        }

        this.collection = new Limits([], {user: options.user});
    },

    onClickAddLimit: function() {
        this.showLimitForm();
    },

    showLimitForm: function(model) {
        var self = this;
        var addLimitButton = this.$('.add-limit');
        var form = new UserLimitsForm({
            model: model,
            user: this.collection.user
        });

        form.render();

        this.$('ul').after(form.el);
        addLimitButton.hide();

        form.on('cancel', function() {
            addLimitButton.show();
        });

        form.on('limit:saved', function(model) {
            addLimitButton.show();
            self.collection.fetch({reset: true}).done(function() {
                self.render();
            });
        });
        form.focus();
    },

    onShow: function() {
        this.collection.fetch();
    }
});

module.exports = LimitsView;
