define(function(require) {
    var FormTemplate = require('text!tpl/packages-form.html');
	var PackageForm = Backbone.Marionette.ItemView.extend({
        template: FormTemplate
	});

    return PackageForm;
})