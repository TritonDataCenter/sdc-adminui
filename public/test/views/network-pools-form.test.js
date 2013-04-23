var adminui = require('./adminui');

var View = require('./views/network-pools-form');
var Networks = require('./models/networks');
var NetworkPool = require('./models/network-pool');

suite('views - NetworkPoolsForm', function() {
    setup(function() {
        this.view = new View();
    });

    test('basic setup', function() {
        assert.isObject(this.view, 'view should be an object');
        assert.isObject(this.view.networkPool, 'view.networkPool should be an object'),
        assert.instanceOf(this.view.networkPool, NetworkPool);
    });

    test('renders template', function() {
        var $el = this.view.render().$el;
        assert.notEqual($el.find('form').length, 0, 'contains a form');
        assert.notEqual($el.find('label').length, 0, 'contains a label');
        assert.notEqual($el.find('input[name=name]').length, 0, 'contains a name input');
    });

    test('attaches network selector', function() {
        var $el = this.view.render().$el;
        assert.notEqual($el.find('.chzn-container').length, 0, 'contains a .chzn-container');
        assert.notEqual($el.find('.chzn-container-multi').length, 0, 'contains a .chzn-container');
    });

    test('attaches user typeahead input', function() {
        this.view.render();
        assert.ok(this.view.ui.ownerInput);
        assert.equal(this.view.ui.ownerInput.get(0), this.view.userInput.el);
    })

    test('form starts disabled and enabled after a change', function() {
        this.view.render();
        assert.ok(this.view.render().ui.saveButton.prop('disabled'));
        this.view.$('input:first').trigger('input');
        assert.equal(this.view.ui.saveButton.prop('disabled'), false);
    });
});

suite('Edit Network Pool', function() {
    setup(function() {
        var networksFixture = [{
            "uuid": "567bd4ac-0a95-40e2-92a2-38030f462ba6",
            "name": "admin",
            "vlan_id": 0,
            "subnet": "10.99.99.0/24",
            "netmask": "255.255.255.0",
            "provision_start_ip": "10.99.99.37",
            "provision_end_ip": "10.99.99.254",
            "nic_tag": "admin",
            "resolvers": []
        },
        {
            "uuid": "a7bf8140-383b-45bb-94b6-a276eabb4511",
            "name": "external",
            "vlan_id": 0,
            "subnet": "10.88.88.0/24",
            "netmask": "255.255.255.0",
            "provision_start_ip": "10.88.88.3",
            "provision_end_ip": "10.88.88.199",
            "nic_tag": "external",
            "resolvers": [
            "8.8.8.8",
            "8.8.4.4"
            ],
            "gateway": "10.88.88.2"
        }];

        this.networks = new Networks(networksFixture);
        this.networkPool = new NetworkPool({
            "uuid": "a1cf93b8-1a82-4f29-bb05-ce06bc94d744",
            "name": "a-entwork-pool-3",
            "owner_uuid": "c478d1c8-1a14-47e2-b0be-dcf98603333e"
            "networks": [
                "567bd4ac-0a95-40e2-92a2-38030f462ba6",
                "a7bf8140-383b-45bb-94b6-a276eabb4511"
            ]
        });

        this.view = new View({
            networks: this.networks,
            networkPool: this.networkPool
        });
    });

    test('renders form with values entered', function() {
        this.view.render();
        assert.equal(this.view.ui.nameInput.val(), this.networkPool.get('name'));
        assert.equal(this.view.ui.ownerInput.val(), this.networkPool.get('owner_uuid'));
    });
});
