var Backbone = require('backbone');


var ChangeRackFormTemplate = function() {
    return '<input class="input input" type="text"><button class="btn btn-primary save">Save</button><button class="btn cancel">Cancel</button>';
};

var ChangeRackForm = Backbone.Marionette.ItemView.extend({
    attributes: {
        'class': 'change-rack-form'
    },
    template: ChangeRackFormTemplate,
    events: {
        'keyup': 'keyup',
        'click button.save': 'save',
        'click button.cancel': 'cancel'
    },
    keyup: function(e) {
        if (e.which === 13) {
            this.save();
        }
    },
    save: function() {
        var self = this;
        var rid = this.$('input').val();
        this.model.save({rack_identifier: rid }, {patch: true}).done(function() {
            self.trigger('save', rid);
        });
    },
    cancel: function() {
        this.trigger('cancel');
        this.remove();
    }
});

module.exports = ChangeRackForm;
