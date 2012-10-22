define(function(require) {
  var ko = require('knockout');
  var BaseView = require('views/base');
  var VmsList = require('views/vms-list');
  var Vms = require('models/vms');

  var User = require('models/user');

  var UserView = Marionette.ItemView.extend({
    template: require('text!tpl/user.html'),
    sidebar: 'users',
    uri: function() {
      return _.str.sprintf('/users/%s', this.model.get('uuid'));
    },

    initialize: function(options) {
      if (options.user) {
        this.model = options.user;
      } else {
        this.model = new User({uuid:options.uuid});
      }
      this.model.fetch();
      this.bindTo(this.model, 'reset', this.render, this);

      this.vms = new Vms({params: {owner_uuid: this.model.get('uuid')}});
      this.vms.fetch();
      this.vmsList = new VmsList({ collection: this.vms });
    },

    onRender: function() {
      this.vmsList.setElement(this.$('.vms-list tbody')).render();

      var viewModel = kb.viewModel(
        this.model, {
          keys: ['uuid', 'cn', 'sn', 'email', 'login', 'memberof', 'member']
        }
      );
      viewModel.member = ko.computed(function() {
        var mb = viewModel.memberof() || [];
        return mb.join(',');
      }, this);

      kb.applyBindings(viewModel, this.el);
    }
  });

  return UserView;
});