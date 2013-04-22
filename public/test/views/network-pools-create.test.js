var adminui = require('./adminui');
var View = require('./views/network-pools-create');
var NetworkPool = require('./models/network-pool');

suite('views - NetworkPoolsCreate', function() {
    test('basic setup', function() {
        var view = new View();
        assert.isObject(view, 'view should be an object');
        assert.isObject(view.networkPool, 'view.networkPool should be an object'),
        assert.instanceOf(view.networkPool, NetworkPool);
    });

    test('renders template', function() {
        var view = new View();
        var $el = view.render().$el;
        assert.notEqual($el.find('form').length, 0, 'contains a form');
        assert.notEqual($el.find('label').length, 0, 'contains a label');
        assert.notEqual($el.find('input[name=name]').length, 0, 'contains a name input');
    });

    test('attaches network selector', function() {
        var view = new View();
        var $el = view.render().$el;
        assert.notEqual($el.find('.chzn-container').length, 0, 'contains a .chzn-container');
        assert.notEqual($el.find('.chzn-container-multi').length, 0, 'contains a .chzn-container');
    });
});
