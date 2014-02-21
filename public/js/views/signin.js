/**
 * ./signin !!
 */

var _ = require('underscore');
var Backbone = require('backbone');
var tplSignin = require('../tpl/signin.hbs');

var View = Backbone.Marionette.ItemView.extend({
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

    authenticate: function(e) {
        e.preventDefault();
        this.hideMessage();
        this.model.authenticate(this.ui.usernameField.val(), this.ui.passwordField.val());
    },

    onRender: function() {
        this.hideMessage();
    },

    centerSigninBox: function() {
        var w = $(window).width();
        var h = $(window).height();
        var x = (w/2)-220;
        var y = (h/2)-318/2;
        if (y < 0) { y = 0; }
        this.$el.css({
            left: x + 'px',
            top: y + 'px'
        });
    },

    onShow: function() {
        this.centerSigninBox();
        this.$("input[value='']:not(:checkbox,:button):visible:first").focus();
        $(window).on('resize', this.centerSigninBox.bind(this));
    },
    onClose: function() {
        $(window).off('resize', this.centerSigninBox.bind(this));
    }

});

module.exports = View;

