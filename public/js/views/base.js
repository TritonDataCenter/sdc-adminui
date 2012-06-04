var View = Backbone.View.extend({
  constructor: function(args) {
    if (typeof(this.template) === 'string') {
      this.template = this._getTemplate(this.template);
    }

    // super
    Backbone.View.prototype.constructor.call(this, args);
  },
  _getTemplate: function(template) {
    var contents = $("#template-"+template).html();
    if (contents == null) {
      console.error("Template not found: "+template);
    }
    return _.template(contents);
  }
});

module.exports = View;
