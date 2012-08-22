define(['backbone'], function(Backbone) {

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

            this.appEvents = this.appEvents || {};

            for (var evt in this.appEvents) {
                var handler = this.appEvents[evt];
                this.eventBus.bind(evt, _.bind(this[handler], this));
            }
        },

        viewWillAppear: function() { },

        viewDidAppear: function() { },

        viewWillDisappear: function() {
            for (var evt in this.appEvents) {
                var handler = this.appEvents[evt];
                this.eventBus.unbind(evt);
            }
        },

        viewDidDisappear: function() {
            this.undelegateEvents();
        },

        _getTemplate: function(template) {
            if (template[0] === '<') {
                return _.template(template);
            }
            var contents = $("#template-"+template).html();
            if (contents === null) {
                console.log('template not found...');
            } else {
                return _.template(contents);
            }
        }
    });

    return View;
});