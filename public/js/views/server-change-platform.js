define(function(require) {
    var Platforms = require('models/platforms');
    var Platform = Backbone.Model.extend({});
    var ViewModel = Backbone.Model.extend({});
    var template = '<select class="input"></select><button class="btn btn-primary save">Save</button><button class="btn cancel">Cancel</button>';
    var ChangePlatformTemplate = Handlebars.compile(template);
    var ChangePlatformForm = Backbone.Marionette.ItemView.extend({
        attributes: {
            'class': 'change-platform-form'
        },
        template: ChangePlatformTemplate,
        events: {
            'click button.save': 'save',
            'click button.cancel': 'cancel'
        },
        initialize: function(options) {
            this.platforms = new Platforms();
            this.platforms.fetch();
            this.bindTo(this.platforms, 'sync', this.applyBindings);
            this.viewModel = new ViewModel();
            this.viewModel.set({platform: options.model.get('boot_platform')});
        },
        save: function() {
            var self = this;
            var platform = this.$('select').val();
            this.model.update({'boot_platform': platform }, function() {
                self.trigger('save', platform);
            });
        },
        cancel: function() {
            this.trigger('cancel');
            this.remove();
        },
        applyBindings: function() {
            this.stickit(this.viewModel, {
                'select': {
                    observe: 'platform',
                    selectOptions: {
                        collection: 'this.platforms',
                        labelPath: 'version',
                        valuePath: 'version'
                    }
                }
            });
        }
    });

    return ChangePlatformForm;
});