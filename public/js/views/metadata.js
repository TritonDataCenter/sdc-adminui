var Backbone = require('backbone');
var ko = require('knockout');
var _ = require('underscore');

var adminui = require('adminui');

var BaseView = require('./base');
var metadataViewModalTemplate = require('../tpl/metadata-view-modal.hbs');
var metadataEditModalTemplate = require('../tpl/metadata-edit-modal.hbs');
var JobProgressView = require('./job-progress');

var MetadataViewModel = function(m) {
    m = m || {};
    this.key = ko.observable(m.key);
    this.value = ko.observable(m.value);
    this.multiline = ko.computed(function() {
        return (/\n/).test(this.value());
    }, this);
    this.dataIsGood = ko.computed(function() {
        return this.key() && this.value();
    }, this);
};

var MetadataList = Backbone.Marionette.ItemView.extend({

    template: require("../tpl/metadata.hbs"),

    initialize: function(options) {
        _.bindAll(this);
        if (!options.vm) {
            throw new TypeError('options.vm required');
        }
        this.vm = options.vm;
        this.metadata = ko.observableArray([]);
    },

    showContent: function(m) {
        var view = $(metadataViewModalTemplate()).modal();
        ko.applyBindings(m, view.get(0));
        view.modal('show');
    },

    showAddPane: function() {
        var self = this;

        var view = $(metadataEditModalTemplate()).modal({
            show: false,
            backdrop: 'static'
        });

        var viewModel = new MetadataViewModel();
        viewModel.editAction = this.edit;
        viewModel.showAction = this.showContent;
        viewModel.removeAction = this.removeItem;
        viewModel.saveAction = function(m) {
            self.metadata.push(m);
            self.save(function(err, job) {
                adminui.vent.trigger('showjob', job);
                view.modal('hide').remove();
            });
        };

        ko.applyBindings(viewModel, view.get(0));
        view.on('shown', function() {
            console.log('shown');
            view.find('input:first').focus();
        });
        view.modal('show');
    },

    removeItem: function(m) {
        this.metadata.remove(m);
        this.save(function(err, job) {
            adminui.vent.trigger('showjob', job);
        });
    },

    save: function(cb) {
        var data = {};
        _(this.metadata()).each(function(m) {
            data[m.key()] = m.value();
        });
        this.vm.set({ customer_metadata: data });
        this.vm.saveCustomerMetadata(cb);
        return data;
    },

    edit: function(m) {
        var view = $(metadataEditModalTemplate()).modal({
            backdrop: 'static',
            show: false
        });
        m.saveAction = function() {
            this.save(function(err, job) {
                view.modal('hide');
                adminui.vent.trigger('showjob', job);
            });
        }.bind(this);
        ko.applyBindings(m, view.get(0));
        view.on('shown', function() {
            view.find('textarea').focus();
        });
        view.modal('show');
    },

    onRender: function() {
        this.metadata.removeAll();
        _.each(this.vm.get('customer_metadata'), function(v, k) {
            var viewModel = new MetadataViewModel({
                key: k,
                value: v
            });
            viewModel.editAction = this.edit;
            viewModel.showAction = this.showContent;
            viewModel.removeAction = this.removeItem;
            this.metadata.push(viewModel);
        }, this);

        ko.applyBindings({
            metadata: this.metadata,
            addAction: this.showAddPane
        }, this.el);
    }
});

module.exports = MetadataList;
