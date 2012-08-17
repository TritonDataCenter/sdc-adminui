module('models/probe');

var Probe = require('models/probe');

test('validate', function() {
    var p = new Probe();

    ok( p.validate({}).name, 'error on name');
    ok( p.validate({}).type, 'error on type');
    ok( p.validate({name:'', type:''}).name, 'errors on name');
    ok( p.validate({name:null, type: null}).name, 'errors on name');
    ok( p.validate({name:'', type:''}).type, 'errors on type');
    ok( p.validate({name:null, type: null}).type, 'errors on type');
});

test('validate probe type', function() {
    var p = new Probe();

    equal( undefined, p.validate({type:'log-scan'}).type, 'does not error on valid type');
    ok( p.validate({type:'no-such-probe'}).type, 'errors on no such probe');
});