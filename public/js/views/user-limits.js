var Backbone = require('backbone');
var _ = require('underscore');


var UserLimitsForm = require('./user-limits-form');
var Limits = require('../models/limits');
var CompositeView = require('./composite');

var ItemView = Backbone.Marionette.ItemView.extend({
    tagName: 'li',
    template: require('../tpl/user-limits-item.hbs'),
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
            data.limits.push({image: k, value: v});
        });

        return data;
    }
});

var LimitsView = CompositeView.extend({
    template: require('../tpl/user-limits.hbs'),
    itemView: ItemView,
    itemViewContainer: 'ul',

    attributes: {
        'class':'limits-list'
    },

    events: {
        'click .add-limit': 'showLimitForm'
    },

    initialize: function(options) {
        if (typeof(options.user) === 'undefined') {
            throw new TypeError('options.user user uuid required');
        } else {
            this.collection = new Limits([], {user: options.user});
        }
    },

    showLimitForm: function() {
        var form = new UserLimitsForm();
        var addLimitButton = this.$('.add-limit');
        form.render();
        this.$('ul').after(form.el);
        addLimitButton.hide();
        form.on('cancel', function() {
            addLimitButton.show();
        });
    },

    onShow: function() {
        this.collection.fetch();
    }
});

module.exports = LimitsView;
