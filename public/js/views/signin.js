/**
 * views/signin !!
 */

define(function(require) {
    var Marionette = require('backbone.marionette');
    var tplSignin = require('tpl!signin');

    var View = Marionette.ItemView.extend({
        attributes: {
            id: "signin"
        },

        template: tplSignin,

        events: {
          'submit form': 'authenticate'
        },

        modelEvents: {
            'change:authenticated': 'didAuthenticate',
            'error': 'didError'
        },

        ui: {
            'alert': '.alert',
            'alertmsg': '.alert .msg',
            'usernameField' : 'input[name=username]',
            'passwordField' : 'input[name=password]'
        },

        didAuthenticate: function(user, value) {
            if (value === true) {
                this.close();
            }
        },

        didError: function(message) {
            this.showMessage(message);
            this.ui.passwordField.val('');
        },

        initialize: function(options) {
            this.model = options.model;
        },

        showMessage: function(msg) {
            this.ui.alertmsg.html(msg);
            this.ui.alert.show();
        },

        hideMessage: function(e) {
            this.ui.alert.hide();
        },

        focus: function() {
            if (this.ui.usernameField.val().length === 0) {
                this.ui.usernameField.focus();
            } else {
                this.ui.passwordField.focus();
            }
        },

        authenticate: function(e) {
            e.preventDefault();
            this.hideMessage();
            this.model.authenticate(
                this.ui.usernameField.val(),
                this.ui.passwordField.val()
            );
        },

        onRender: function() {
            this.hideMessage();
        },

        onShow: function() {
            this.focus();
        }

    });

    return View;
});
