/**
 * @jsx React.DOM
 */

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
var Probes = require('../models/probes');

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
var NotesView = require('./notes');

var FirewallToggleButton = React.createClass({
    getInitialState: function() {
        value = this.props.initialValue || false;
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
                <button key="on" onClick={this.toggleValue} className="btn btn-success">ON</button>,
                <button key="off" onClick={this.toggleValue} className="btn">OFF</button>
            ];
        } else {
            node = [
                <button key="on" onClick={this.toggleValue} className="btn">ON</button>,
                <button key="off" onClick={this.toggleValue} className="btn btn-danger">OFF</button>
            ];
        }
        return <div className="firewall-toggle-button-component">{node}</div>;
    }
});


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
    events: {
        'click .server-hostname': 'clickedServerHostname',
        'click .start': 'clickedStartVm',
        'click .stop': 'clickedStopVm',
        'click .reboot': 'clickedRebootVm',
        'click .delete': 'clickedDeleteVm',
        'click .rename': 'clickedRename',
        'click .owner-name': 'clickedOwnerName',
        'click .package': 'clickedPackage',
        'click .image-name-version': 'clickedImage',
        'click .resize': 'clickedResize',
        'click .change-owner': 'clickChangeOwner',
        'click .show-fwrules-form': 'clickShowFwrulesForm',
        'click .edit-metadata': 'clickEditMetadata'
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
        this.listenTo(this.vm, 'change:nics', this.renderNics, this);
        this.listenTo(this.vm, 'change:firewall_enabled', this.onFirewallStateChange, this);
        this.listenTo(this.vm, 'sync', this.loadImage);

        this.customerMetadataListView = new MetadataList({
            vm: this.vm,
            property: 'customer_metadata'
        });

        this.internalMetadataListView = new MetadataList({
            vm: this.vm,
            property: 'internal_metadata',
            readonly: true
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
        this.vent.trigger('showview', 'user', {
            user: this.owner
        });
    },

    clickedPackage: function(e) {
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
        if (confirm) {
            this.vm.reboot(function(job) {
                var jobView = new JobProgressView({ model: job });
                jobView.show();
            });
        }
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

    clickedServerHostname: function(e) {
        if (e.metaKey || e.ctrlKey) {
            return;
        }
        e.preventDefault();
        this.vent.trigger('showview', 'server', {
            server: this.server
        });
    },

    clickEditMetadata: function(e) {
        this.listenTo(
            this.customerMetadataListView,
            'editing:begin',
            function() {
                this.$('.edit-metadata').hide();
                var top = this.$('section.customer-metadata').offset().top;
                $("html, body").animate({ scrollTop: top + "px" });
            },
        this);

        this.listenTo(
            this.customerMetadataListView,
            'editing:end',
            function() {
                this.$('.edit-metadata').show();
            },
        this);

        this.customerMetadataListView.editingMode();
    },

    clickShowFwrulesForm: function() {
        var self = this;

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

        var input = $('<input type="text">').val(this.vm.get('alias'));
        var save = $('<button class="btn btn-primary btn-mini">').html('Save');
        var cancel = $('<button class="btn btn-cancel btn-mini">').html('Cancel');
        this.$('.alias').append(input);
        this.$('.alias').append(save);
        this.$('.alias').append(cancel);
        input.keyup(function(e) {
            if (e.which === 13) {
                save.click();
            }
        });

        cancel.click(cancelAction);
        save.click(saveAction);

        input.focus();

        function saveAction() {
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

    onRender: function() {
        this.nicsRegion.show(this.nicsList);
        this.fwrulesListRegion.show(this.fwrulesList);
        this.fwToggleButton = new FirewallToggleButton({
            initialValue: this.vm.get('firewall_enabled'),
            onToggle: this.onToggleFirewallEnabled.bind(this)
        });
        React.renderComponent(this.fwToggleButton, this.$(".firewall-toggle-button").get(0));


        this.snapshotsListView = new SnapshotsList({
            vm: this.vm,
            el: this.$('.snapshots')
        });

        this.notesView = new NotesView({
            itemUuid: this.vm.get('uuid'),
            el: this.$('.notes')
        });

        this.notesView.render();

        this.renderTags();
        this.renderMetadata();
        this.renderSnapshots();

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

        this.stickit(this.owner, {
            '.owner-name': 'cn',
            '.owner-uuid': 'uuid'
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
                        return moment(date).utc().format('LLL');
                    } else {
                        return '';
                    }
                }
            },
            '.created': {
                observe: 'create_timestamp',
                onGet: function(date) {
                    if (date) {
                        return moment(date).utc().format('LLL');
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
                        return ips.join(',');
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
            '.owner-link': {
                attributes: [{
                    'observe':'owner_uuid',
                    'name': 'href',
                    'onGet': function(v) {
                        return '/users/'+v;
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
    }

});

module.exports = VmView;
