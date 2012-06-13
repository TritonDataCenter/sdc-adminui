'use strict'

var View = require('views/base');

// eventBus.trigger('watch-job', {job_uuid:"a0a00582-b69b-4511-a3a4-6afc53e32ca2", vm_uuid:"6020ae91-63df-44ea-ad8e-c8d92a72f924"})

var Job = Backbone.Model.extend({
  defaults: {
    "name":""
  },
  urlRoot: "/_/jobs",
  idAttribute: "uuid",
  startWatching: function() {
    var self = this;
    this._interval = setInterval(function() {
      console.log('fetching model');
      self.fetch();
    }, 1000);
  },
  stopWatching: function() {
    clearInterval(this._interval);
  }
});

var JobItemView = View.extend({
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
    }

    var elm = this.template(tplVars);

    this.$el.html(elm);

    return this;
  }
});

var Jobs = Backbone.Collection.extend({ });

var NotifierView = View.extend({
  initialize: function(options) {
    _.bindAll(this);
    this.jobs = new Jobs();
    this.jobs.on('add', this.addOne);
  },

  appEvents: {
    'watch-job': 'watchJob'
  },

  addOne: function(job) {
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


var Topbar = module.exports = View.extend({
  template: "topbar",

  events: {
    'click a[data-trigger=signout]': 'signout'
  },

  initialize: function(options) {
  },

  signout: function() {

  },

  render: function() {
    this.$el.append(this.template());
    this.notifier = new NotifierView({el: this.$("#notifier-feed")});
    this.notifier.render();
    $a.eventBus.trigger('watch-job', {job_uuid:"a0a00582-b69b-4511-a3a4-6afc53e32ca2", vm_uuid:"6020ae91-63df-44ea-ad8e-c8d92a72f924"})
    return this;
  }
});
