define(function(require) {
  var Job = require('models/job');
  var topbarTpl = require('tpl!topbar');
  var Marionette = require('backbone.marionette');

  var JobItemView = Backbone.View.extend({
    tagName: 'li',
    template: "notifier-job",

    initialize: function() {
      _.bindAll(this);
      this.model.bind("change", this.render);

    },

    render: function() {
      var chainResults = this.model.get('chain_results') || [];

      var tplVars = {
        execution: this.model.get('execution'),
        uuid: this.model.get('uuid'),
        name: this.model.get('name').split("-")[0],
        chainResults: chainResults
      };

      var elm = this.template(tplVars);

      this.$el.html(elm);

      return this;
    }
  });



  var Jobs = Backbone.Collection.extend({ });




  var NotifierView = Backbone.View.extend({
    initialize: function(options) {
      _.bindAll(this);
      this.$badge = options.badge;
      this.jobs = new Jobs();
      this.jobs.on('add', this.addOne);
    },

    appEvents: {
      'watch-job': 'watchJob'
    },

    addOne: function(job) {
      this.$badge.html(this.jobs.length);

      var jobItem = new JobItemView({model:job});
      this.$el.append(jobItem.render().el);
    },

    watchJob: function(obj) {
      var job = new Job({uuid:obj.job_uuid});
      this.jobs.add(job);
      job.startWatching();
    },

    render: function() {
      return this;
    }
  });


  var Topbar = Backbone.Marionette.Layout.extend({
    template: topbarTpl,

    regions: {
      mainnav: "#mainnav" 
    },

    events: {
      'click a[data-trigger=signout]': 'signout'
    },

    initialize: function(options) {
      this.user = options.user;
    },

    signout: function() {
      var app = require('adminui');
      app.vent.trigger('signout');
    },

    serializeData: function() {
      return { user: this.user };
    },

    onRender: function() {
      
      this.notifier = new NotifierView({
        el: this.$("#notifier-feed"),
        badge: this.$('.badge')
      });

      this.notifier.render();
      return this;
    }
  });

  return Topbar;
});