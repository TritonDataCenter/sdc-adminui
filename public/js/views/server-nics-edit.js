var Backbone = require('backbone');
var _ = require('underscore');
var adminui = require('../adminui');
var NicTags = require('../models/nictags');
var assert = require('assert-plus');


var NicTagSelect = Backbone.Marionette.ItemView.extend({
    attributes: {
        'class': 'control-group'
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
            var tag = model.get('name');
            if (_.indexOf(currentTags, tag) === -1) {
                if (model.get('selected') === true) {
                    var sel = _.str.sprintf('option[value=%s]:not(:selected)', tag);
                    this.$(sel).remove();
                    this.$('select').trigger("liszt:updated");
                } else {
                    if (0 === this.$(_.str.sprintf('option[value=%s]', tag)).length) {
                        this.$('select').append($('<option />').val(tag).html(tag));
                        this.$('select').trigger("liszt:updated");
                    }
                }
            }
        }.bind(this));
    },
    template: function() {
        return [
            '<label class="control-label">{{this.name}}</label>',
            '<div class="controls">',
            '<div class="chosen">',
            '<select data-placeholder="Choose a NIC Tag..."  class="chzn-select" multiple></select>',
            '</div>',
            '<span class="help-inline mac"></span>',
            '</div>'
        ].join('\n');
    },
    onChange: function(e, change) {
        var selected = change.selected ? true : false;
        var tag = change.selected || change.deselected;
        this.nic_tags.findWhere({'name': tag}).set('selected', selected);
    },
    onRender: function() {
        var self = this;
        this.stickit(this.model, {
            '.mac': 'mac',
            '.control-label': 'name',
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
                        var chosen = $el.chosen({no_results_text: 'No NIC Tags available.'});
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
        this.nics.where({kind: 'nic'}).forEach(function(nic) {
            var select = new NicTagSelect({model: nic, nic_tags: this.nic_tags});
            this.ui.form.append(select.render().el);
        }, this);

        var nic_tags = this.nic_tags;
        this.nics.where({kind: 'nic'}).forEach(function(nic) {
            _.each(nic.get('nic_tags_provided'), function(tag) {
                nic_tags.findWhere({'name': tag}).set({selected: true});
            });
        });
    },

    save: function() {
        var self = this;
        var data = this.nics.where({kind:'nic'}).map(function(n) {
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
                this.nics.fetchNics();
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
