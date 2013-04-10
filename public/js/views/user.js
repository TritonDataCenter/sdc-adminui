var Backbone = require('backbone');


var kb = require('knockback');
var BaseView = require('./base');
var VmsList = require('./vms-list');
var Vms = require('../models/vms');
var SSHKeys = require('../models/sshkeys');
var UserForm = require('./user-form');

var SSHKeyListItemTemplate = require('../tpl/sshkey-list-item.hbs');
var SSHKeyListItem = Backbone.Marionette.ItemView.extend({
    tagName: 'tr',
    template: SSHKeyListItemTemplate,
    events: {
        'click .remove': 'onClickRemove'
    },
    onClickRemove: function() {
        this.model.destroy();
    }
});

var SSHKeysList = Backbone.Marionette.CollectionView.extend({
    itemView: SSHKeyListItem
});

var User = require('../models/user');
var UserView = Marionette.ItemView.extend({
    template: require('../tpl/user.hbs'),
    id: 'page-user',
    events: {
        'click .edit-user': 'onClickEditUser',
        'click .add-key': 'onClickAddKey'
    },

    sidebar: 'users',

    url: function() {
        return _.str.sprintf('/users/%s', this.model.get('uuid'));
    },

    onClickEditUser: function(e) {
        var form = new UserForm({user: this.model});
        form.render();
    },

    onClickAddKey: function(e) {
        var AddKeyView = require('./sshkey-create');
        var view = new AddKeyView({
            user: this.model.get('uuid')
        });
        view.render();

        this.bindTo(view, 'saved', function(key) {
            this.sshkeys.add(key);
        }, this);
    },

    initialize: function(options) {
        if (options.user) {
            this.model = options.user;
        } else {
            this.model = new User({
                uuid: options.uuid
            });
        }
        this.model.fetch();

        this.bindTo(this.model, 'reset', this.render, this);

        this.vms = new Vms({
            params: {
                owner_uuid: this.model.get('uuid')
            }
        });
        this.vms.fetch();

        this.sshkeys = new SSHKeys({
            user: this.model.get('uuid')
        });
        this.sshkeys.fetch();

        this.vmsList = new VmsList({
            collection: this.vms
        });
        this.sshkeysList = new SSHKeysList({
            collection: this.sshkeys
        });
    },

    onRender: function() {
        this.vmsList.setElement(this.$('.vms-list tbody')).render();
        this.sshkeysList.setElement(this.$('.ssh-keys tbody')).render();

        var viewModel = kb.viewModel(
        this.model, {
            keys: ['company','uuid', 'cn', 'sn', 'email', 'login', 'memberof', 'member']
        });

        viewModel.member = ko.computed(function() {
            var mb = viewModel.memberof() || [];
            return mb.join(',');
        }, this);

        kb.applyBindings(viewModel, this.el);
    }
});

module.exports = UserView;
