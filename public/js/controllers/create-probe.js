var BaseView = require('views/base')
var SelectProbeTypeView = require('views/monitoring/select-probe-type');
var SelectMonitorView = require('views/monitoring/select-monitor');

var ProbeConfigViews = {
  'log-scan': require('views/monitoring/config-log-scan')
}


var Probe = require('models/probe');

var CreateProbeController = BaseView.extend({
  initialize: function(options) {
    _.bindAll(this);

    this.probe = options.probe || new Probe();
    this.vm = options.vm
    this.probe.set({
      user: this.vm.get('owner_uuid'),
      agent: this.vm.get('uuid'),
      machine: this.vm.get('uuid')
    });

    this.showSelectProbeView();
  },

  showSelectProbeView: function() {
    this.selectionView = new SelectProbeTypeView();
    this.selectionView.on('select', this.onSelectProbe);
    this.selectionView.render().$el.modal();
  },

  onSelectProbe: function(p) {
    this.probe.set({type: p});
    this.showProbeConfig(p);
  },

  showProbeConfig: function(p) {
    this.probeConfigView = new (ProbeConfigViews[p]);
    this.probeConfigView.render().$el.modal();
    this.probeConfigView.on('done', this.onDoneProbeConfig);
    this.probeConfigView.focus();
  },


  onDoneProbeConfig: function(config) {
    var self = this;
    this.probe.set(config);
    this.probe.save({}, {
      success: function() {
        self.probeConfigView.hide();
        self.eventBus.trigger('probe:added', probe);
      },
      error: function() {
        alert('Error saving probe');
      }
    });
  }
});


module.exports = CreateProbeController;
