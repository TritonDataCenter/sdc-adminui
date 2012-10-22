/**
 * views/provision-vm.js
 *
 * Provision a VM
*/

define(function(require) {
  var Base = require('views/base');
  var Images = require('models/images');
  var Users = require('models/users');
  var Package = require('models/package');
  var Packages = require('models/packages');
  var Networks = require('models/networks');
  var Vm = require('models/vm');


  var PackageSelectOption = Backbone.Marionette.ItemView.extend({
    attributes: function() {
      return {
        name: this.model.get('name'),
        value: this.model.get('uuid')
      }
    },
    tagName: 'option',
    template: Handlebars.compile('{{name}} {{version}}')
  });

  var PackageSelect = Backbone.Marionette.CollectionView.extend({
    itemView: PackageSelectOption,
    tagName: 'select',
    events: {
      'change': 'onChange'
    },
    onChange: function(e) {
      var uuid = $(e.target).val();
      this.trigger('select', this.collection.get(uuid));
    }
  });

  var tplProvisionVm = require('text!tpl/provision-vm.html');

  var View = Backbone.Marionette.ItemView.extend({
    name: 'provision-vm',

    sidebar: 'vms',

    template: _.template(tplProvisionVm),

    events: {
      'submit form': 'provision',
      'change input': 'checkFields'
    },
    ui: {
      'form': 'form',
      'alert': '.alert'
    },

    initialize: function(options) {
      this.packages = new Packages();
      this.packageSelect = new PackageSelect({ collection: this.packages });
      this.selectedPackage = new Package();

      this.packages.on('reset', function(collection) {
        this.selectedPackage.set(collection.models[0].attributes);
      }, this);

      this.packageSelect.on('select', function(package) {
          this.selectedPackage.set(package.attributes);
      }, this);

      this.packageBinder = new Backbone.ModelBinder();

      this.imagesSource = [];
      this.usersSource = [];

      this.usersCollection = new Users();
      this.imagesCollection = new Images();
      this.networks = new Networks();

      this.usersCollection.on('reset', function(users) {
        this.userSource = [];
        users.each(function(u) { this.usersSource.push(u); }, this);
      }, this);

      this.imagesCollection.on('reset', function(images) {
        this.imagesSource = [];
        images.each(function(img) { this.imagesSource.push(img); }, this);
      }, this);

      this.networks.on('reset', function(networks) {
        this.populateNetworks(networks);
      }, this);

      this.imagesCollection.fetch();
      this.usersCollection.searchByLogin('');
      this.networks.fetch();
      this.packages.fetchActive();
    },

    viewDidAppear: function() {
      Base.prototype.viewDidAppear.call(this);
      this.$("input:first").focus();
    },

    onRender: function() {
      this.packageSelect.setElement(this.$('select[name=package]')).render();
      this.packageBinder.bind(this.selectedPackage, this.$('.package-details'));

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

      this.checkFields();

      return this;
    },

    populateNetworks: function(networks) {
      var container = this.$('.network-checkboxes');
      var elm = container.find('label:first').clone();
      container.find('label').remove();
      networks.each(function(n) {
        elm.find('.name').html(
          [n.get('name'),
          n.get('subnet')].join(' - ')
        );
        elm.find('input').val(n.get('uuid'));
        elm.clone().prependTo(container);
      }, this);
    },


    checkFields: function() {
      this.hideError();
      var values = this.extractFormValues();
      if (!values.owner_uuid.length || !values.networks.length || !values.image_uuid.length) {
        this.disableProvisionButton();
      } else {
        this.enableProvisionButton();
      }
    },

    disableProvisionButton: function() {
      this.$('button[type=submit]').attr('disabled', 'disabled');
    },

    enableProvisionButton: function() {
      this.$('button[type=submit]').removeAttr('disabled');
    },

    extractFormValues: function() {
      var formData = this.ui.form.serializeObject();
      var values = {
        image_uuid: formData.image,
        dataset_uuid: formData.image, // XXX Backwards compat.
        ram: formData.memory,
        owner_uuid: formData.owner,
        brand: formData.brand,
        alias: formData.alias
      };

      var package = this.packages.get(formData.package);

      if (package) {
        values['billing_id'] = package.get('uuid');
        values['package_name'] = package.get('name');
        values['package_version'] = package.get('version');
        values['cpu_cap'] = package.get('cpu_cap');
        values['max_lwps'] = package.get('max_lwps');
        values['max_swap'] = package.get('max_swap')
        values['quota'] = package.get('quota');
        values['vcpus'] = package.get('vcpus');
        values['zfs_io_priority'] = package.get('zfs_io_priority');
      }

      var networksChecked = this.ui.form.find('.network-checkboxes input[type=checkbox]:checked');
      values.networks = _.map(networksChecked, function(obj) {
        return $(obj).val();
      });

      return values;
    },

    hideError: function() {
      console.log(this.ui.alert);
      this.ui.alert.hide();
    },

    showError: function(message) {
      this.ui.alert.find('.message').html(message);
      this.ui.alert.show();
    },

    provision: function(e) {
      var self = this;
      e.preventDefault();

      var vm = new Vm();
      vm.set(this.extractFormValues());
      vm.save(null, {
        success: function(m, obj) {
          alert('Machine being provisioned. This will get fancier.. trust me!');
          console.log(obj);
          self.eventBus.trigger('watch-job', {
            job_uuid:obj.job_uuid,
            name:'Provision Machine'
          });
          self.eventBus.trigger('wants-view', 'vms', {});
        },
        error: function(m, xhr) {
          var err = JSON.parse(xhr.responseText);
          self.showError(err.message);
        }
      });
    }

  });
  return View;
});
