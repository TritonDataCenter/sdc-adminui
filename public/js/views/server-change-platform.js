define(function(require) {
    var Platforms = require('models/platforms');
    var Platform = Backbone.Model.extend({});
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
        },
        save: function() {
            var self = this;
            var rid = this.$('select').val();
            this.model.update({'boot_platform': rid }, function(){
                self.trigger('save', rid);
            });
        },
        cancel: function() {
            this.trigger('cancel');
            this.remove();
        },
        applyBindings: function() {
            this.stickit(this.model, {
                'select': {
                    observe: 'current_platform',
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