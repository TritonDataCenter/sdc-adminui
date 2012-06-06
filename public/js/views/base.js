var View = Backbone.View.extend({
  constructor: function(args) {
    if (typeof(this.template) === 'string') {
      this.template = this._getTemplate(this.template);
    }

    // super
    Backbone.View.prototype.constructor.call(this, args);
  },

  delegateEvents: function(events) {
    Backbone.View.prototype.delegateEvents.call(this, events);

    this.appEvents = this.appEvents || {}

    for (var evt in this.appEvents) {
      var handler = this.appEvents[evt];
      this.eventBus.bind(evt, _.bind(this[handler], this));
    }
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
