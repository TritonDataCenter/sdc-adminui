/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

"use strict";

var $ = require('jquery');
var Backbone = require('backbone');
var _ = require('underscore');
var moment = require('moment');

var adminui = require('../adminui');
var React = require('react');

var Vm = require('../models/vm');
var Img = require('../models/image');
var Server = require('../models/server');
var User = require('../models/user');
var Package = require('../models/package');

var VMDeleteModal = require('./vm-delete-modal');
var TagsList = require('./tags-list');
var NicsList = require('./nics');
var MetadataList = require('./metadata');
var SnapshotsList = require('./snapshots');
var FWRulesList = require('./fwrules-list');
var FWRulesForm = require('./fwrules-form');


var ResizeVmView = require('./resize-vm');
var JobsList = require('./jobs-list');

var JobProgressView = require('./job-progress');
var VmChangeOwner = require('./vm-change-owner');

var NotesComponent = React.createFactory(require('../components/notes'));
var UserTileComponent = React.createFactory(require('../components/user-tile'));
var ReprovisionVmComponent = React.createFactory(require('../components/pages/vm/reprovision'));

var FirewallToggleButton = React.createFactory(React.createClass({
    getInitialState: function() {
        var value = this.props.initialValue || false;
        return {value: value};
    },
    toggleValue: function() {
        var newValue = !this.state.value;
        this.setState({value: newValue});
        if (this.props.onToggle) {
            this.props.onToggle(newValue);
        }
    },
    render: function() {
        var node;
        if (this.state.value === true) {
            node = [
                <button key="on" onClick={this.toggleValue} className="btn btn-sm btn-success">ON</button>,
                <button key="off" onClick={this.toggleValue} className="btn btn-sm btn-default">OFF</button>
            ];
        } else {
            node = [
                <button key="on" onClick={this.toggleValue} className="btn btn-sm btn-default">ON</button>,
                <button key="off" onClick={this.toggleValue} className="btn btn-sm btn-danger">OFF</button>
            ];
        }
        return <div className="firewall-toggle-button-component">{node}</div>;
    }
}));


/**
 * VmView
 *
 * options.uuid uuid of VM
 * options.vm vm attrs
 */
var VmView = Backbone.Marionette.Layout.extend({
    template: require('../tpl/vm.hbs'),
    id: 'page-vm',
    sidebar: 'vms',
    title: function() {
        return _.str.sprintf('vm:', this.vm.get('alias'));
    },
    events: {
        'click .server-hostname': 'clickedServerHostname',
        'click li:not(.disabled) .start': 'clickedStartVm',
        'click li:not(.disabled) .stop': 'clickedStopVm',
        'click li:not(.disabled) .reboot': 'clickedRebootVm',
        'click li:not(.disabled) .delete': 'clickedDeleteVm',
        'click .resize': 'clickedResize',
        'click .reprovision': 'clickedReprovision',
        'click .rename': 'clickedRename',
        'click .package': 'clickedPackage',
        'click .image-name-version': 'clickedImage',
        'click .change-owner': 'clickChangeOwner',
        'click .show-fwrules-form': 'clickShowFwrulesForm',
        'click .edit-customer-metadata': 'clickedEditCustomerMetadata',
        'click .edit-internal-metadata': 'clickedEditInternalMetadata'
    },
    regions: {
        'nicsRegion': '.nics-region',
        'jobsListRegion': '.jobs-list-region',
        'fwrulesListRegion': '.fwrules-list-region',
        'fwrulesFormRegion': '.fwrules-form-region',
        'internalMetadataRegion': '.internal-metadata-region',
        'customerMetadataRegion': '.customer-metadata-region'
    },

    url: function() {
        return _.str.sprintf('vms/%s', this.vm.get('uuid'));
    },

    initialize: function(options) {

        this.vent = adminui.vent;

        if (options.uuid) {
            this.vm = new Vm({uuid: options.uuid });
        }

        if (options.vm) {
            this.vm = options.vm;
        }

        this.owner = new User();
        this.image = new Img();
        this.server = new Server();
        this.pkg = new Package();
        this.jobsListView = new JobsList({
            perPage: 1000,
            params: {vm_uuid: this.vm.get('uuid')}
        });

        if (this.vm.get('billing_id')) {
            this.pkg.set({ uuid: this.vm.get('billing_id') });
            this.pkg.fetch();
        }

        this.server.set({ uuid: this.vm.get('server_uuid') });
        if (!this.server.get('last_modified')) {
            this.server.fetch();
        }

        this.owner.set({ uuid: this.vm.get('owner_uuid') });

        if (!this.owner.get('dn')) {
            this.owner.fetch();
        }

        this.listenTo(this.image, 'error', function(image, xhr, options) {
            if (xhr.status === 404) {
                this.$('.image-name-version').html('No Image Information Available');
                this.$('.image-name-version').addClass('disabled');
            } else {
                this.$('.image-name-version').html('Error retrieving image information');
                this.$('.image-name-version').addClass('error');
            }
        }, this );

        this.listenTo(this.vm, 'change:owner_uuid', function(m) {
            this.renderUserTile();
            this.owner.set({uuid: m.get('owner_uuid')});
            this.owner.fetch();
        }, this);

        this.listenTo(this.vm, 'change:server_uuid', function(m) {
            this.server.set({uuid: m.get('server_uuid')});
            this.server.fetch();
        }, this);

        this.listenTo(this.vm, 'change:billing_id', function(m) {
            this.pkg.set({uuid: m.get('billing_id')});
            this.pkg.fetch();
        }, this);

        this.listenTo(this.vm, 'change:customer_metadata', this.renderMetadata, this);
        this.listenTo(this.vm, 'change:internal_metadata', this.renderMetadata, this);
        this.listenTo(this.vm, 'change:tags', this.renderTags, this);
        this.listenTo(this.vm, 'change:state', this.updateDropdown, this);
        this.listenTo(this.vm, 'change:nics', this.renderNics, this);
        this.listenTo(this.vm, 'change:firewall_enabled', this.onFirewallStateChange, this);
        this.listenTo(this.vm, 'sync', this.loadImage);
        this.listenTo(this.vm, 'sync', this.updateDropdown);
        this.listenTo(this.server, 'sync', this.renderFirewall, this);

        this.customerMetadataListView = new MetadataList({
            vm: this.vm,
            property: 'customer_metadata'
        });

        this.internalMetadataListView = new MetadataList({
            vm: this.vm,
            property: 'internal_metadata'
        });

        this.tagsListView = new TagsList({model: this.vm});
        this.nicsList = new NicsList({ vm: this.vm });
        this.fwrulesList = new FWRulesList({vm: this.vm });

        this.listenTo(this.fwrulesFormRegion, 'show', function() {
            this.$('.show-fwrules-form').hide();
        }, this);

        this.listenTo(this.fwrulesFormRegion, 'close', function() {
            this.$('.show-fwrules-form').show();
        }, this);


        this.fwrulesList.on('itemview:edit:rule', function(iv) {
            iv.$el.addClass('editing');
            this.fwrulesForm = new FWRulesForm({model: iv.model });
            this.fwrulesFormRegion.show(this.fwrulesForm);

            this.fwrulesForm.on('close', function() {
                iv.$el.removeClass('editing');
                this.fwrulesFormRegion.close();
            }, this);

            this.fwrulesForm.on('rule:saved', function() {
                this.fwrulesFormRegion.close();
                this.fwrulesList.collection.fetch();
            }, this);
        }, this);

        this.vm.fetch();
    },

    loadImage: function(model, resp, options) {
        if (this.vm.get('brand') === 'kvm') {
            var disks = this.vm.get('disks');
            if (disks.length && disks[0].image_uuid) {
                this.image.set({uuid: disks[0].image_uuid});
            } else {
                console.error('Unexpected error: kvm branded has no image_uuid in first disk');
                return;
            }
        } else {
            this.image.set({uuid: this.vm.get('image_uuid')});
        }
        this.image.fetch();
    },

    clickedStartVm: function(e) {
        var self = this;
        this.vm.start(function(job) {
            var jobView = new JobProgressView({ model: job });
            jobView.on('succeeded', function() {
                self.vm.fetch();
            });
            jobView.show();
        });
    },

    clickedResize: function() {
        var view = new ResizeVmView({
            vm: this.vm
        });
        view.show();
    },

    clickedOwnerName: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        this.vent.trigger('showcomponent', 'user', {
            user: this.owner
        });
    },

    clickedPackage: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }

        e.preventDefault();
        this.vent.trigger('showview', 'package', {
            model: this.pkg
        });
    },

    clickedImage: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }

        e.preventDefault();
        this.vent.trigger('showview', 'image', {
            uuid: this.image.get('uuid')
        });
    },

    clickedStopVm: function(e) {
        var vm = this.vm;
        var confirm = window.confirm('Are you sure you want to stop this VM?');

        if (confirm) {
            this.vm.stop(function(job) {
                var jobView = new JobProgressView({model: job});
                jobView.on('succeeded', function() {
                    vm.fetch();
                });
                jobView.show();
            });
        }
    },

    clickedRebootVm: function(e) {
        var confirm = window.confirm('Are you sure you want to reboot this VM?');
        if (! confirm) {
            return false;
        }

        this.vm.reboot(function(job) {
            var jobView = new JobProgressView({ model: job });
            jobView.show();
        });
    },

    clickedDeleteVm: function(e) {
        var vmDeleteView = new VMDeleteModal({
            vm: this.vm,
            owner: this.owner
        });
        vmDeleteView.show();
    },

    clickChangeOwner: function() {
        var vmChangeOwner = new VmChangeOwner({
            vm: this.vm
        });
        vmChangeOwner.show();
    },

    clickedReprovision: function() {
        var self = this;
        var $container = $('<div class="reprovision-vm-component-container"></div>');
        $(document.body).append($container);
        React.render(new ReprovisionVmComponent({
            uuid: this.vm.get('uuid'),
            onReprovisionCancel: function() {
                React.unmountComponentAtNode($container.get(0));
            },
            onJobCreated: function(job) {
                var jobView = new JobProgressView({ model: job });
                jobView.show();
                self.listenTo(jobView, 'finished', function() {
                    self.vm.fetch();
                }, self);
            }
        }), $container.get(0));
    },

    clickedServerHostname: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        this.vent.trigger('showview', 'server', {
            server: this.server
        });
    },
    serializeData: function() {
        var data = _.clone(this.vm.toJSON());
        data.kvm = data.brand === 'kvm';
        return data;
    },

    clickedEditCustomerMetadata: function(e) {
        this.listenTo(this.customerMetadataListView, 'editing:begin',
            function() {
                this.$('.edit-customer-metadata').hide();
                var top = this.$('section.customer-metadata').offset().top;
                $("html, body").animate({ scrollTop: top + "px" });
            }, this);

        this.listenTo(this.customerMetadataListView,
            'editing:end',function() {
                this.$('.edit-customer-metadata').show();
            }, this);

        this.customerMetadataListView.editingMode();
    },

    clickedEditInternalMetadata: function(e) {
        this.listenTo(this.internalMetadataListView, 'editing:begin',
            function() {
                this.$('.edit-internal-metadata').hide();
                var top = this.$('section.internal-metadata-and-tags').offset().top;
                $("html, body").animate({ scrollTop: top + "px" });
            }, this);

        this.listenTo(this.internalMetadataListView, 'editing:end',function() {
            this.$('.edit-internal-metadata').show();
        }, this);

        this.internalMetadataListView.editingMode();
    },

    clickShowFwrulesForm: function() {
        this.fwrulesForm = new FWRulesForm({vm: this.vm });
        this.fwrulesFormRegion.show(this.fwrulesForm);

        this.fwrulesForm.on('close', function() {
            this.fwrulesFormRegion.close();
        }, this);

        this.fwrulesForm.on('rule:saved', function() {
            this.fwrulesFormRegion.close();
            this.fwrulesList.collection.fetch();
        }, this);

    },

    clickedRename: function() {
        var vm = this.vm;
        var renameBtn = this.$('.alias .rename');
        var value = this.$('.alias .value');

        renameBtn.hide();
        value.hide();

        var input = $('<input class="form-control input-sm" style="width:300px;" type="text">').val(this.vm.get('alias'));
        var save = $('<button class="btn btn-primary btn-sm">').html('Save');
        var cancel = $('<button class="btn btn-link btn-sm">').html('Cancel');
        this.$('.alias form').append(input);
        this.$('.alias form').append(save);
        this.$('.alias form').append(cancel);
        input.keyup(function(e) {
            if (e.which === 13) {
                save.click();
            }
        });

        cancel.click(cancelAction);
        save.click(saveAction);

        input.focus();

        function saveAction(e) {
            e.preventDefault();
            value.html(input.val());
            vm.set({ alias: input.val() });
            vm.saveAlias(function(err, job) {
                if (err) {
                    input.tooltip({placement: 'bottom', title: err.message}).tooltip('show');
                } else {
                    var jobView = new JobProgressView({ model: job });
                    jobView.show();

                    cancelAction();
                }
            });
        }

        function cancelAction() {
            input.tooltip('hide');
            input.tooltip('destroy');
            renameBtn.show();
            input.remove();
            save.remove();
            cancel.remove();
            value.show();
        }
    },

    renderTags: function() {
        this.tagsListView.setElement(this.$('.tags-container')).render();
    },

    renderMetadata: function() {
        this.customerMetadataRegion.show(this.customerMetadataListView);
        this.internalMetadataRegion.show(this.internalMetadataListView);
    },

    renderSnapshots: function() {
        this.snapshotsListView.render();
    },

    onToggleFirewallEnabled: function(value) {
        var vm = this.vm;
        vm.update({firewall_enabled: value}, function(job) {
            var jobView = new JobProgressView({ model: job });
            jobView.on('finished', function() {
                vm.fetch();
            });
            jobView.show();
        });
    },

    onFirewallStateChange: function() {
        this.fwToggleButton.setState({value: this.vm.get('firewall_enabled')});
    },

    updateDropdown: function() {
        if (this.vm.get('state') === 'running') {
            this.$('.dropdown-menu .start').parent('li').addClass('disabled');
            this.$('.dropdown-menu .reboot').parent('li').removeClass('disabled');
            this.$('.dropdown-menu .stop').parent('li').removeClass('disabled');
        }
        if (this.vm.get('state') === 'stopped') {
            this.$('.dropdown-menu .start').parent('li').removeClass('disabled');
            this.$('.dropdown-menu .reboot').parent('li').addClass('disabled');
            this.$('.dropdown-menu .stop').parent('li').addClass('disabled');
        }
    },
    templateHelpers: {
        isDocker: function() {
            return this.docker === true || this.tags.JPC_tag === 'DockerHost';
        }
    },

    renderUserTile: function() {
        if (this.vm.get('owner_uuid')) {
            React.render(
                UserTileComponent({
                    uuid: this.vm.get('owner_uuid'),
                    onUserDetails: function(user) {
                        adminui.vent.trigger('showcomponent', 'user', {uuid: user.uuid });
                    }
                }), this.$('.user-tile-container').get(0));
        }
    },

    renderFirewall: function() {
        if (! this.server.get('current_platform')) {
            this.$('.fwrules').hide();
            return;
        }
        var pl = (this.server.get('current_platform').slice(0, 8));
        if (!adminui.user.role('operators') || (this.vm.get('brand') === 'kvm' && Number(pl) <= 20140314)) {
            this.$('.fwrules').hide();
            return;
        }


        this.fwrulesListRegion.show(this.fwrulesList);
        this.fwToggleButton = React.render(FirewallToggleButton({
            initialValue: this.vm.get('firewall_enabled'),
            onToggle: this.onToggleFirewallEnabled.bind(this)
        }), this.$('.firewall-toggle-button').get(0));
        this.$('.fwrules').show();
    },
    renderDiskQuota: function() {
        var quota = 0;
        if (this.vm.get('brand') === 'kvm') {
            this.vm.get('disks').forEach(function(k) {
                quota = quota + k.image_size;
            });
        } else {
            quota = this.vm.get('quota');
        }

        this.$('.vm-disk-quota').html(quota + ' GB');
    },
    onRender: function() {
        adminui.vent.trigger('settitle', _.str.sprintf('vm: %s', ( this.vm.get('alias') || this.vm.get('uuid')) ));

        this.nicsRegion.show(this.nicsList);
        this.renderUserTile();
        this.renderDiskQuota();

        this.snapshotsListView = new SnapshotsList({
            vm: this.vm,
            el: this.$('.snapshots')
        });

        this.renderFirewall();
        this.renderTags();
        this.renderMetadata();
        this.renderSnapshots();

        React.render(
            new NotesComponent({item: this.vm.get('uuid')}),
            this.$('.notes-component-container').get(0)
        );

        this.stickit(this.image, {
            '.image-uuid': 'uuid',
            '.image-name-version': {
                observe: ['name', 'version'],
                onGet: function(val, attr) {
                    var name = val[0];
                    var version = val[1];
                    if (!name || !version) {
                        return '';
                    } else {
                        return val.join(" ");
                    }
                },
                attributes: [{
                    observe: 'uuid',
                    name: 'href',
                    onGet: function(val) {
                        return '/images/'+val;
                    }
                }]
            }
        });

        this.stickit(this.vm, {
            '.vm-alias': {
                observe: 'alias',
                onGet: function(alias) {
                    return alias || '<UNNAMED>';
                }
            },
            '.vm-memory': 'ram',
            '.vm-swap': 'max_swap',
            '.vm-uuid': 'uuid',
            '.last-modified': {
                observe: 'last_modified',
                onGet: function(date) {
                    if (date) {
                        return moment(date).utc().format('D MMMM, YYYY HH:mm:ss z');
                    } else {
                        return '';
                    }
                }
            },
            '.created': {
                observe: 'create_timestamp',
                onGet: function(date) {
                    if (date) {
                        return moment(date).utc().format('D MMMM, YYYY HH:mm:ss z');
                    } else {
                        return '';
                    }
                }
            },

            '.vm-state': {
                observe: 'state',
                attributes: [{
                    'name': 'class',
                    onGet: function(state) {
                        return state;
                    }
                }]
            },
            '.vm-ips': {
                observe: 'nics',
                onGet: function(val) {
                    if (val.length) {
                        var ips = _.map(val, function(nic) {
                            return nic.ip;
                        });
                        return ips.join(' ');
                    }
                }
            },
            '.package': {
                attributes: [{
                    name: 'href',
                    observe: 'billing_id',
                    onGet: function(val) {
                        return '/packages/' + val;
                    }
                }]
            },
            '.billing-id': 'billing_id'
        });

        this.stickit(this.pkg, {
            '.package-name': 'name',
            '.package-version': 'version',
        });

        this.stickit(this.server, {
            '.server-hostname': {
                observe: 'hostname',
                attributes: [{
                    observe: 'uuid',
                    name: 'href',
                    onGet: function(uuid) {
                        return '/servers/'+uuid;
                    }
                }]
            },
            '.server-uuid': 'uuid'
        });

        this.jobsListRegion.show(this.jobsListView);

        return this;
    },
    onClose: function() {
        React.unmountComponentAtNode(this.$('.user-tile-container').get(0));
        React.unmountComponentAtNode(this.$('.firewall-toggle-button').get(0));
        React.unmountComponentAtNode(this.$('.notes-component-container').get(0));
    }

});

module.exports = VmView;
