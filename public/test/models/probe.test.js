module('models/probe');

var Probe = require('models/probe');

test('probe name', function() {
  var probe = new Probe();
  equal(false, probe.set({name: ''}), 'empty string');
  equal(false, probe.set({name: null}), 'null value');
});

test('log-scan', function() {
  var probe = new Probe({
    type:'log-scan',
    name:'my-log-scan-probe'
  });

  equal(false, probe.set({ path:'bad_path' }), 'fails on proper path');
  ok( probe.set({path: '/var/log/messages'}) , 'passes on proper path');
});
