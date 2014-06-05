var Backbone = require('backbone');
var _ = require('underscore');
var adminui = require('../adminui');
var React = require('react');
var ProvisioningLimits = require('../components/provisioning-limits/main.jsx');


var Vms = require('../models/vms');
var VmsList = require('./vms-list');
var VmsFilter = require('./user-vms-filter');

var SSHKeys = require('../models/sshkeys');
var UserForm = require('./user-form');
var AddKeyView = require('./sshkey-create');

var ImagesCollection = require('../models/images');
var ImagesList = require('./images-list');

var NotesComponent = require('../components/notes');

var Networks = require('../models/networks');
var NetworksList = require('../views/networks-list');

var NetworkPools = require('../models/network-pools');
var NetworkPoolsList = require('../views/network-pools-list');

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
        'vmsRegion': '.vms-region',
        'networksRegion': '.networks-region',
        'networkPoolsRegion': '.network-pools-region',
        'vmsFilterRegion': '.vms-filter-region',
        'imagesListRegion': '.images-list-region'
    },
    events: {
        'click .edit-user': 'onClickEditUser',
        'click .add-key': 'onClickAddKey',
        'click .toggle-2fa': 'onToggle2fa'
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

    renderNetworkPools: function() {
        var self = this;
        var user = this.model;

        self.networkPools = new NetworkPools(null, {params: { provisionable_by: self.model.get('uuid')} });
        self.networkPoolsView = new NetworkPoolsList({
            networks: self.allNetworks,
            collection: self.networkPools
        });

        self.networkPoolsRegion.show(self.networkPoolsView);

        self.listenTo(self.networkPoolsView, 'select', function(model) {
            adminui.vent.trigger('showview', 'network', {model: model});
        }, self);

        self.listenTo(self.networkPools, 'sync', function(collection, resp, options) {
            var filtered = collection.filter(function(m) {
                var ownerUuids = m.get('owner_uuids') || [];
                return (ownerUuids.indexOf(user.get('uuid')) !== -1);
            });

            if (filtered.length === 0) {
                self.networkPoolsRegion.close();
                return;
            }

            collection.reset(filtered);
        });

        self.networkPools.fetch();
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
            perPage: 20
        });

        var user = this.model;
        var self = this;

        this.allNetworks = new Networks();
        this.allNetworks.fetch().done(function() {
            self.renderNetworkPools.apply(self);
        });

        this.networks = new Networks(null, {params: { provisionable_by: this.model.get('uuid')} });
        this.networksView = new NetworksList({ collection: this.networks });

        this.listenTo(this.networks, 'sync', function(collection, resp, options) {
            var filtered = collection.filter(function(m) {
                var ownerUuids = m.get('owner_uuids') || [];
                return (ownerUuids.indexOf(user.get('uuid')) !== -1);
            });
            collection.reset(filtered);
        });

        this.listenTo(this.networksView, 'select', function(model) {
            adminui.vent.trigger('showview', 'network', {model: model});
        }, this);


        this.imagesListView = new ImagesList({
            collection: new ImagesCollection(null, {
                params: { owner: this.model.get('uuid') }
            })
        });



        this.sshkeys = new SSHKeys(null, {user: this.model.get('uuid') });
        this.vmsList = new VmsList({collection: this.vms });
        this.sshkeysList = new SSHKeysList({collection: this.sshkeys });
        this.vmsFilter = new VmsFilter();
    },

    onShow: function() {
        this.vmsRegion.show(this.vmsList);

        React.renderComponent(
            new ProvisioningLimits({
                user: this.model.get('uuid'),
                readonly: !adminui.user.role('operators')
            }),
            this.$(this.limitsRegion.el).get(0)
        );

        this.networksRegion.show(this.networksView);
        this.vmsFilterRegion.show(this.vmsFilter);

        this.sshkeysList.setElement(this.$('.ssh-keys .items')).render();
        this.imagesListRegion.show(this.imagesListView);

        this.listenTo(this.vmsFilter, 'query', this.onVmFilter);
    },

    onVmFilter: function(params) {
        this.vms.fetch({params: params});
    },

    onToggle2fa: function() {
        var self = this;
        var url = '/api/users/'+this.model.get('uuid')+'/2fa';
        $.get(url, function(d) {
            var enabled = !d.enabled;
            $.ajax({
                url: url,
                dataType: 'json',
                type: 'patch',
                data: {enabled: enabled}
            }).done(function() {
                self.fetchAndRender2fa();
            });
        });
    },

    fetchAndRender2fa: function() {

        var self = this;

        $.get('/api/users/'+this.model.get('uuid')+'/2fa', function(d) {
            if (d.enabled) {
                self.$('.portal-2fa').html('enabled');
                self.$('.toggle-2fa').html('Disable');
            } else {
                self.$('.toggle-2fa').hide();
                self.$('.portal-2fa').addClass('disabled');
                self.$('.portal-2fa').html('disabled');
            }
        });

    },

    onRender: function() {
        React.renderComponent(
            new NotesComponent({item: this.model.get('uuid')}),
            this.$('.notes-component-container').get(0)
        );
        this.sshkeys.fetch();
        this.model.fetch();
        this.vms.fetch();
        this.networks.fetch();

        this.fetchAndRender2fa();

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

module.exports = UserView;
