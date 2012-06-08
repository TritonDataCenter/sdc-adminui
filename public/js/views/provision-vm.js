/**
 * views/provision-vm.js
 *
 * Provision a VM
*/

var Base = require('views/base');
var Images = require('models/images');
var Users = require('models/users');
var Networks = require('models/networks');
var Vm = require('models/vm');

var View = module.exports = Base.extend({
  name: 'provision-vm',

  template: 'provision-vm',

  events: {
    'submit form': 'provision',
    'change input': 'checkFields'
  },

  initialize: function(options) {
    this.memoryValues = [
      ['128 MB', 128],
      ['256 MB', 256],
      ['512 MB', 512],
      ['1 GB', 1024],
      ['2 GB', 2048]
    ]

    this.$form = null;

    this.networks = new Networks();
    this.networks.on('reset', function(networks) {
      this.addNetworks(networks);
    }, this);
    this.networks.fetch();

    this.imagesSource = [];
    this.usersSource = [];

    this.usersCollection = new Users();
    this.usersCollection.on('reset', function(users) {
      users.each(function(u) { this.usersSource.push(u); }, this);
    }, this);

    this.usersCollection.searchByLogin('');

    this.imagesCollection = new Images();
    this.imagesCollection.on('reset', function(images) {
      images.each(function(img) { this.imagesSource.push(img); }, this);
    }, this);
    this.imagesCollection.fetch();
  },

  render: function() {
    this.setElement(this.template());
    this.$form = this.$('form');
    this.populateMemoryValues();
    this.hideError();

    this.$("input[name=image]").typeahead({
      source: this.imagesSource,
      labeler: function(obj) { return [obj.get('name'), obj.get('version')].join(" "); },
      valuer: function(obj) { return obj.get('uuid'); }
    });

    this.$("input[name=owner]").typeahead({
      source: this.usersSource,
      labeler: function(obj) { return [obj.get('login'), obj.get('cn')].join(" - "); },
      valuer: function(obj) { return obj.get('uuid'); }
    });

    return this;
  },

  addNetworks: function(networks) {
    var container = this.$('.network-checkboxes');
    var elm = container.find('label');
    container.find('label').remove();
    networks.each(function(n) {
      console.log(n);
      elm.find('.name').html(
        [n.get('name'),
        n.get('network')].join(' - ')
      );
      elm.find('input').val(n.get('uuid'));
      elm.clone().prependTo(container);
    }, this)
  },


  populateMemoryValues: function() {
    var select = this.$("select[name=memory]");
    select.empty();
    _.each(this.memoryValues, function(m, k, v) {
      var option = $("<option />");
      var label = m[0];
      var value = m[1];
      option.html(label);
      option.attr("value", value)
      select.append(option);
    });
  },

  checkFields: function() {
    this.hideError();
    var values = this.extractFormValues();
    console.log(values);
    if (!values.owner_uuid.length || !values.networks.length || !values.image_uuid.length) {
      this.disableProvisionButton();
    } else {
      this.enableProvisionButton();
    }
  },

  disableProvisionButton: function() {
    this.$('button[type=submit]').attr('disabled', 'disabled');
    console.log('provision button disabled');
  },

  enableProvisionButton: function() {
    this.$('button[type=submit]').removeAttr('disabled');
    console.debug("provision button enabled");
  },

  extractFormValues: function() {
    var formData = this.$form.serializeObject();
    var values = {
      image_uuid: formData.image,
      dataset_uuid: formData.image, // XXX Backwards compat.
      ram: formData.memory,
      owner_uuid: formData.owner,
      brand: formData.brand,
      alias: formData.alias
    }

    var networksChecked = this.$form.find('.network-checkboxes input[type=checkbox]:checked');
    values.networks = _.map(networksChecked, function(obj) {
      return $(obj).val();
    });

    return values;
  },

  hideError: function() {
    this.$('.alert').hide();
  },

  showError: function(message) {
    this.$('.alert .message').html(message);
    this.$('.alert').show();
  },

  provision: function(e) {
    var self = this;
    e.preventDefault();

    var vm = new Vm();
    vm.set(this.extractFormValues())
    vm.save(null, {
      success: function() {
        alert('Machine being provisioned. This will get fancier.. trust me!');
      },
      error: function(m, xhr) {
        var err = JSON.parse(xhr.responseText)
        self.showError(err.message);
      }
    });
  }

});
