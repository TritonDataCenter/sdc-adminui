define(function(require) {
    var Img = require('models/image');
    var ImageView = Backbone.Marionette.ItemView.extend({
        sidebar: 'images',
        id: 'page-image',
        template: require('text!tpl/image.html'),
        url: function() {
            return _.str.sprintf('images/%s', this.model.get('uuid'));
        },

        events: {
            'click .activate': 'onClickActivate',
            'click .disable': 'onClickDisable',
            'click .enable': 'onClickEnable',
            'click .add-file': 'onClickAddFile'
        },

        modelEvents: {
            'change': 'render',
            'error': 'onError'
        },

        templateHelpers: {
            'active': function() {
                return this.state === 'active';
            },

            'unactivated': function() {
                return this.state === 'unactivated';
            },

            'activatable': function() {
                return this.state !== 'active';
            },


            'enableable': function() {
                return this.disabled === true;
            },

            'disableable': function() {
                return this.disabled === false;
            }
        },

        initialize: function(options) {
            if (options.uuid) {
                this.model = new Img({uuid: options.uuid});
            } else if (options.image) {
                this.model = options.image;
            }
            this.model.fetch();
        },

        onError: function(model, res) {
            app.vent.trigger('error', {
                xhr: res,
                context: 'images / imgapi'
            });
        },

        onClickActivate: function(e) {
            e.preventDefault();
            var self = this;
            this.model.activate(function() {
                self.model.fetch();
            });
        },

        onClickDisable: function(e) {
            e.preventDefault();
            var self = this;
            alert('blocked on imgapi.disableImage'); //XXX
            this.model.disable(function() {
                self.model.fetch();
            });
        },

        onClickEnable: function(e) {
            e.preventDefault();
            var self = this;
            alert('blocked on imgapi.enableImage'); //XXX
            this.model.enable(function() {
                self.model.fetch();
            });
        },

        onClickAddFile: function() {
            this.$('.fileinput').click();
        }
    });

    return ImageView;
});