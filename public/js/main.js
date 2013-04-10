var Router = require('./router');
var adminui = window.$a = require('./adminui');

var router = new Router({app: adminui});
adminui.start({router: router});