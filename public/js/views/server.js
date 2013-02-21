define(function(require) {

    var ChangeRackFormTemplate = Handlebars.compile('<input class="input" type="text"><button class="btn btn-primary save">Save</button><button class="btn cancel">Cancel</button>');
    var ChangeRackForm = Backbone.Marionette.ItemView.extend({
        template: ChangeRackFormTemplate,
        events: {
            'click button.save': 'save',
            'click button.cancel': 'cancel'
        },
        save: function() {
            var self = this;
            var rid = this.$('input').val();
            this.model.set({rack_identifier: rid });
            this.model.save(null, {success: function() {
                self.trigger('save', rid);
            }});
        },
        cancel: function() {
            this.trigger('cancel');
            this.remove();
        }
    });

    var Server = require('models/server');
    var NotesView = require('views/notes');
    var BaseView = require('views/base');
    var ServerTemplate = require('text!tpl/server.html');
    var TraitsModal = require('views/traits-editor');

    var ServerView = Backbone.Marionette.ItemView.extend({
        id: 'page-server',
        sidebar: 'servers',

        template: ServerTemplate,

        events: {
            'click .setup': 'setup',
            'click .change-rack-id': 'showChangeRackField',
            'click .modify-traits': 'showTraitsModal'
        },

        modelEvents: {
            'change': 'render'
        },

        initialize: function(options) {
            this.model = options.server || new Server();

            if (options.uuid) {
                this.model.set({uuid: options.uuid});
                this.model.fetch();
            }
        },

        templateHelpers: {
            platform_version: function() {
                return this.sysinfo['Live Image'];
            },
            cpu_type: function() {
                return this.sysinfo['CPU Type'];
            },
            cpu_cores: function() {
                return this.sysinfo['CPU Physical Cores'];
            },
            serial_number: function() {
                return this.sysinfo['Serial Number'];
            },
            total_memory: function() {
                return this.sysinfo['MiB of Memory'];
            }
        },

        serializeData: function() {
            var data = Marionette.ItemView.prototype.serializeData.call(this);
            data.disks = _.map(data.sysinfo['Disks'], function(v, k) {
                return {name: k, size: v['Size in GB']};
            });
            data.traits = _.map(data.traits, function(v, k) {
                return {name: k, value: v};
            });
            return data;
        },

        showChangeRackField: function() {
            var view = new ChangeRackForm({model: this.model});
            this.bindTo(view, 'cancel', function() {
                this.$('.rack td a').show();
            }, this);
            this.$('.rack td').append(view.el);
            this.$('.rack td a').hide();
            view.render();
        },

        showTraitsModal: function() {
            var modal = new TraitsModal({traits: this.model.get('traits')});
            var server = this.model;
            modal.show();
            this.bindTo(modal, 'save-traits', function(traits) {
                server.set({traits: traits});
                server.update({traits: traits}, function() {
                    modal.close();
                });
            });
        },

        setup: function() {
            this.model.setup();
        },
        
        onRender: function() {
            this.notesView = new NotesView({itemUuid: this.model.get('uuid'), el: this.$('.notes')});
            this.notesView.render();
        },

        url: function() {
            return _.str.sprintf('servers/%s', this.model.get('uuid'));
        }
    });

    return ServerView;
});