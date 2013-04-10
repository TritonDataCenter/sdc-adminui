var Backbone = require('backbone');


var app = require('../adminui');
var Img = require('../models/image');
var ImageImportTemplate = require('../tpl/image-import.hbs');
var ImageImportView = Backbone.Marionette.ItemView.extend({
    id: 'page-image-import',
    sidebar: 'images',
    url: 'image-import',
    template: ImageImportTemplate,
    events: {
        'click input[name=import-source]': 'onChangeImportSource',
        'click button.import': 'onClickImport',
        'submit form': 'onClickImport'
    },
    ui: {
        'urlControlGroup': '.control-group.url',
        'manifestControlGroup': '.control-group.manifest',
        'importSource': 'input[name=import-source]',
        'alert': '.alert'
    },
    onShow: function() {
        this.ui.manifestControlGroup.hide();
        this.ui.urlControlGroup.hide();
        this.ui.alert.hide();
    },
    onChangeImportSource: function() {
        var val = this.ui.importSource.filter(':checked').val();
        if (val === 'manifest') {
            this.ui.urlControlGroup.hide();
            this.ui.manifestControlGroup.show();
        } else {
            this.ui.urlControlGroup.show();
            this.ui.manifestControlGroup.hide();
        }
    },
    showError: function(message) {
        this.ui.alert.html(message);
        this.ui.alert.show();
    },
    onClickImport: function(e) {
        e.preventDefault();
        var self = this;
        var val = this.ui.importSource.filter(':checked').val();
        if (val == 'manifest') {
            var manifestJSON = this.$("textarea[name=manifest]").val();
            var manifest;
            try {
                manifest = JSON.parse(manifestJSON);
            } catch (ex) {
                self.showError('Invalid Image Manifest JSON: ' + ex.message);
                return;
            }

            var img = new Img(manifest);
            img.adminImport().done(function(a, b, c) {
                app.vent.trigger('showview', 'image', {uuid: img.get('uuid')});
            }).fail(function(xhr, jqErr, statusText) {
                console.log(statusText, 'statusText');
                if (statusText == 'Conflict') {
                    var err = JSON.parse(xhr.responseText);
                    self.showError(err.message);
                } else {
                    app.vent.trigger('error', {
                        xhr: xhr,
                        context: 'images / imgapi'
                    });
                }
            });
        } else {
            alert('not implemented yet');
            // ...
        }

        return false;
    }
});

module.exports = ImageImportView;
