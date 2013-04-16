var Backbone = require('backbone');


var Platforms = require('../models/platforms');
var Platform = Backbone.Model.extend({});
var ViewModel = Backbone.Model.extend({});
var ChangePlatformTemplate = function() {
    return '<select class="input chosen chosen-mini" data-placeholder-text="Choose Platform"></select><button class="btn btn-primary save">Save</button><button class="btn cancel">Cancel</button>';
};
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
        this.listenTo(this.platforms, 'sync', this.applyBindings);
        this.viewModel = new ViewModel();
        this.viewModel.set({
            platform: options.model.get('boot_platform')
        });
    },
    save: function() {
        var self = this;
        var platform = this.$('select').val();
        this.model.update({
            'boot_platform': platform
        }, function() {
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
                initialize: function($el, model, options) {
                    $el.chosen();
                },
                selectOptions: {
                    collection: 'this.platforms',
                    labelPath: 'version',
                    valuePath: 'version'
                }
            }
        });
    }
});

module.exports = ChangePlatformForm;
