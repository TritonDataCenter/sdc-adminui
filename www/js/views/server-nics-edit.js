/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

var Backbone = require('backbone');
var _ = require('underscore');
var adminui = require('../adminui');
var $ = require('jquery');
var Nics = require('../models/nics');
var NicTags = require('../models/nictags');

function mergeSysinfo(sysinfo, napinics) {
    var nics = [];
    _.each(sysinfo['Network Interfaces'], function(el, i) {
        el.kind = "nic";
        var n = _.findWhere(napinics, {mac: el['MAC Address']});
        var nic = _.extend(el, n);
        nic.ifname = i;
        nics.push(nic);
    });
    _.each(sysinfo['Virtual Network Interfaces'], function(el, i) {
        el.kind = "vnic";
        var n = _.findWhere(napinics, {mac: el['MAC Address']});
        var nic = _.extend(el, n);
        nic.ifname = i;
        nics.push(nic);
    });
    _.each(sysinfo['Link Aggregations'], function(el, i) {
        el.kind = "aggr";
        var n = _.findWhere(napinics, {mac: el['MAC Address']});
        var nic = _.extend(el, n);
        nic.ifname = i;
        nics.push(nic);
    });

    return nics;
}


var NicTagSelect = Backbone.Marionette.ItemView.extend({
    attributes: {
        'class': 'form-group'
    },
    events: {
        'change select': 'onChange'
    },
    initialize: function(options) {
        this.nic_tags = options.nic_tags;
        this.nic_tags.each(function(tag) {
            this.listenTo(tag, 'change:selected', this.updateChosen, this);
        }, this);
    },
    updateChosen: function(model) {
        process.nextTick(function() {
            var currentTags = this.model.get('nic_tags_provided');
            var tag = model.get('ifname');
            if (_.indexOf(currentTags, tag) === -1) {
                if (model.get('selected') === true) {
                    var sel = _.str.sprintf('option[value=%s]:not(:selected)', tag);
                    this.$(sel).remove();
                    this.$('select').trigger("chosen:updated");
                } else {
                    if (0 === this.$(_.str.sprintf('option[value=%s]', tag)).length) {
                        this.$('select').append($('<option />').val(tag).html(tag));
                        this.$('select').trigger("chosen:updated");
                    }
                }
            }
        }.bind(this));
    },
    template: function() {
        return [
            '<label class="control-label col-sm-4">{{this.ifname}}</label>',
            '<div class="col-sm-8">',
            '<div class="chosen">',
            '<select data-placeholder="Choose a NIC Tag..." class="form-control" multiple></select>',
            '</div>',
            '<span class="help-block mac"></span>',
            '</div>'
        ].join('\n');
    },
    onChange: function(e, change) {
        var selected = change.selected ? true : false;
        var tag = change.selected || change.deselected;
        this.nic_tags.findWhere({'name': tag}).set('selected', selected);
    },
    onRender: function() {
        this.stickit(this.model, {
            '.mac': 'mac',
            '.control-label': 'ifname',
            'select': {
                attributes: [{
                    observe: 'mac',
                    'name': 'name'
                }],
                observe: 'nic_tags_provided',
                selectOptions: {
                    collection: 'this.nic_tags',
                    labelPath: 'name',
                    valuePath: 'name'
                },
                initialize: function($el, model, options) {
                    process.nextTick(function() {
                        $el.chosen({no_results_text: 'No NIC Tags available.'});
                    });
                }
            }
        });

    }
});

var ServerNicsEditTemplate = require('../tpl/server-nics-edit.hbs');
var ServerNicsEditView = Backbone.Marionette.ItemView.extend({
    id: "server-nics-edit",
    template: ServerNicsEditTemplate,
    attributes: {
        'class': 'modal'
    },
    ui: {
        'form': 'form'
    },
    events: {
        'click .save': 'save'
    },
    initialize: function(options) {
        this.server = options.server;
        this.nics = options.nics;
        this.nic_tags = options.nic_tags || new NicTags();
        this.listenTo(this.nic_tags, 'sync', this.renderSelects, this);
        this.nic_tags.fetch();
    },

    show: function() {
        this.render();
        this.$el.modal('show');
    },

    renderSelects: function() {
        var nics = mergeSysinfo(this.server.get('sysinfo'), this.nics.toJSON());
        var nicModels = new Nics(nics);
        nicModels.where({kind: 'nic'}).forEach(function(nic) {
            var select = new NicTagSelect({model: nic, nic_tags: this.nic_tags});
            this.ui.form.append(select.render().el);
        }, this);

        var nic_tags = this.nic_tags;
        nicModels.where({kind: 'nic'}).forEach(function(nic) {
            _.each(nic.get('nic_tags_provided'), function(tag) {
                nic_tags.findWhere({'name': tag}).set({selected: true});
            });
        });
        this.nicModels = nicModels;
    },

    save: function() {
        var data = this.nicModels.where({kind:'nic'}).map(function(n) {
            return {
                mac: n.get('mac'),
                nic_tags_provided: n.get('nic_tags_provided')
            };
        });
        console.log('server.updateNics', data);
        this.server.updateNics({nics: data, action: 'replace'}, this.onUpdateNicsJob.bind(this));
    },

    onUpdateNicsJob: function(job) {
        this.$el.modal('hide');
        adminui.vent.trigger('showjob', job);
        this.listenTo(job, 'change:execution', function(j) {
            var execution = j.get('execution');
            if (execution === 'succeeded') {
                this.nics.fetch();
            }
        }, this);
    },

    serializeData: function() {
        var data = {
            nics: this.nics.toJSON(),
            server: this.server.toJSON()
        };
        return data;
    }
});

module.exports = ServerNicsEditView;
