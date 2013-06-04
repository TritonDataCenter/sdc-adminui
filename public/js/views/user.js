var Backbone = require('backbone');
var _ = require('underscore');


var BaseView = require('./base');
var VmsList = require('./vms-list');
var LimitsView = require('./user-limits');
var Vms = require('../models/vms');
var SSHKeys = require('../models/sshkeys');
var UserForm = require('./user-form');
var AddKeyView = require('./sshkey-create');

var __CONFIRM_REMOVE_KEY = "Are you sure you want to remove this key from the user's account?";

var SSHKeyListItemTemplate = require('../tpl/sshkey-list-item.hbs');
var SSHKeyListItem = Backbone.Marionette.ItemView.extend({
    tagName: 'div',
    attributes: {'class':'item'},
    template: SSHKeyListItemTemplate,
    events: {
        'click .name a': 'showKey',
        'click .remove': 'onClickRemove'
    },
    showKey: function() {
        var modalHeader = $('<div class="modal-header"></div>');
        modalHeader.html('<h1>'+this.model.get('name')+'</h1>');
        var modalBody = $('<div class="modal-body"></div>');
        var text = $('<textarea readonly>').html(this.model.get('openssh'));
        text.click(function() {
            $(this).select();
        });

        modalBody.append(text);

        var node = $('<div id="sshkey-view">').addClass('modal');
        node.append(modalHeader);
        node.append(modalBody);
        node.append('<div class="modal-footer"><button class="btn" data-dismiss="modal">Close</button></div>');
        node.modal();

    },
    onClickRemove: function(e) {
        e.preventDefault();
        var confirm = window.confirm(__CONFIRM_REMOVE_KEY);
        if (confirm) {
            this.model.destroy();
        }
    }
});

var SSHKeyEmptyView = require('./empty').extend({
    emptyMessage: 'User has no SSH Keys.'
});

var SSHKeysList = Backbone.Marionette.CollectionView.extend({
    emptyView: SSHKeyEmptyView,
    itemView: SSHKeyListItem,
    itemViewOptions: function() {
        return {
            emptyViewModel: this.collection
        };
    }
});

var User = require('../models/user');
var UserView = Backbone.Marionette.Layout.extend({
    template: require('../tpl/user.hbs'),
    id: 'page-user',
    regions: {
        'limitsRegion': '.limits-region',
        'vmsRegion': '.vms-region'
    },
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
        var view = new AddKeyView({ user: this.model.get('uuid') });
        view.on('saved', function(key) {
            this.sshkeys.add(key);
        }, this);
        view.render();
    },

    initialize: function(options) {
        if (options.user) {
            this.model = options.user;
        } else {
            this.model = new User({uuid: options.uuid });
        }

        this.vms = new Vms(null, {
            params: {
                owner_uuid: this.model.get('uuid'),
                state: 'active',
                sort: 'create_timestamp.desc'
            },
            perPage: 1000
        });

        this.sshkeys = new SSHKeys(null, {user: this.model.get('uuid') });
        this.vmsList = new VmsList({collection: this.vms });
        this.limitsList = new LimitsView({ user: this.model.get('uuid')});
        this.sshkeysList = new SSHKeysList({collection: this.sshkeys });
    },

    onRender: function() {
        this.vmsRegion.show(this.vmsList);
        this.limitsRegion.show(this.limitsList);

        this.sshkeysList.setElement(this.$('.ssh-keys .items')).render();

        this.sshkeys.fetch();
        this.model.fetch();
        this.vms.fetch();

        this.stickit(this.model, {
            '.cn': 'cn',
            '.uuid': 'uuid',
            '.login': 'login',
            '.email': 'email',
            '.phone': 'phone',
            '.company': 'company',
            '.groups': 'groups',
            '.registered-developer': {
                observe: 'registered_developer',
                onGet: function(val) {
                    if (val === "true") {
                        return 'yes';
                    } else {
                        return 'no';
                    }
                },
                attributes: [{
                    'name': 'class',
                    observe: 'registered_developer',
                    onGet: function(val) {
                        if (val && val === 'true') {
                            return 'yes';
                        } else {
                            return 'no';
                        }
                    }
                }]
            },
            '.provisioning': {
                observe: 'approved_for_provisioning',
                onGet: function(val) {
                    if (val === "true") {
                        return 'approved';
                    } else {
                        return 'disabled';
                    }
                },
                attributes: [{
                    'name': 'class',
                    observe: 'approved_for_provisioning',
                    onGet: function(val) {
                        if (val && val === 'true') {
                            return 'approved';
                        } else {
                            return 'disabled';
                        }
                    }
                }]
            }
        });
    }
});

UserView.__name__ = 'UserView';

module.exports = UserView;
