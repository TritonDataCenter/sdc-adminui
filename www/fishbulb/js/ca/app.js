/*
 * www/js/ca/app.js: CA demo portal
 *
 * This application makes use of the general-purpose facilities in
 * www/js/ca/ca.js to actually render a useful panel.
 */

/* jsl:import ca.js */
/* jsl:import subr.js */

/*
 * Global state
 */
var capBackend;				/* see ca.js */
var capConf;				/* see ca.js */
var capPanel;				/* see ca.js */
var capWidgetTimer;			/* timer handle for updating widgets */
var capWidgets = [];			/* all widgets in the panel */

/*
 * DOM nodes
 */
var capDomContent;			/* body of the panel */

var capDefaultIp = '10.2.211.21';	/* default backend IP */
var capLegendWidth = 200;		/* legend width */
var capSliderWidth = 50;		/* heat map slider width */
var capGraphHeight = 200;		/* graph height */
var capGraphWidth;			/* graph width (auto-configured) */

var capConfig = {			/* CA backend configuration */
    'type': 'direct',
    'host': capDefaultIp
};

/*
 * Prompt the user for backend configuration details once the whole document is
 * loaded.
 */
$(document).ready(capPromptConfig);

function capPromptConfig()
{
	var table = $([
	    '<div>',
	    '<p>Enter the IP address or hostname of the Cloud Analytics ' +
	    'operator endpoint.  This address must be reachable from your ',
	    'web browser.</p>',
	    '<table class="caConfigTable">',
	    '    <tr>',
	    '        <td class="caConfigLabel">CA Service IP</td>',
	    '        <td class="caConfigValue">',
	    '            <input id="capConfigIp" type="text" size="16" ' +
	        'value="' + capDefaultIp + '"/>:23181',
	    '        </td>',
	    '        <td class="caConfigHelp capLightText">(e.g., ' +
	        capDefaultIp + ')</td>',
	    '    </tr>',
	    '</table>',
	    '</div>'
	].join('\n'));

	$(table).dialog({
	    'resizable': false,
	    'modal': true,
	    'title': 'Configure',
	    'width': '500px',
	    'closeOnEscape': false,
	    'buttons': {
	        'Connect': function () {
		    $(this).fadeOut(250, function () {
			$(this).dialog('close');
			capConfig['host'] = $('#capConfigIp').val();
			capInitConfig();
		    });
		}
	    }
	});
}

/*
 * Initialize this application based on the user-entered configuration
 * describing how to connect to the remote CA service.
 */
function capInitConfig()
{
	capDomContent = $('.capConsole');

	capBackend = caBackendCreate(capConfig);
	capPanel = new caPanel({ 'backend': capBackend });
	capPanel.on('error', capError);
	capConf = new caConf({ 'backend': capBackend });

	capConf.load(function (err) {
		if (err)
			jsFatalError(err);

		capGraphWidth = $(capDomContent).width() - capLegendWidth - 30 -
		    capSliderWidth;
		capInitSelectors();
		capPanel.unpause();
		capWidgetTimer = setInterval(capTick, 1000);
	});
}

/*
 * Initialize the main metric selector widget based on the available metrics.
 */
function capInitSelectors()
{
	var groupdiv, div, widget;

	groupdiv = jsCreateElement('div', 'capControls');
	capDomContent[0].appendChild(groupdiv);
	capDomContent[0].appendChild(
	    jsCreateElement('div', 'capHorizontalSeparator'));

	widget = new caWidgetCreateInstn({
	    'conf': capConf,
	    'oncreate': capInstnCreate
	});
	groupdiv.appendChild(widget.caElement);

	div = jsCreateElement('div');
	div.appendChild(jsCreateText('Load server instrumentations'));
	groupdiv.appendChild(div);
	$(div).button().click(function () {
		$(div).fadeOut(250, function () { $(div).remove(); });
		capLoadServerInstns();
	});
}

/*
 * Invoked when the user clicks "Create" to create a new instrumentation as well
 * as a new widget to present it.
 */
function capInstnCreate(params)
{
	capBackend.instnCreate(params, function (err, instn) {
		if (err)
			jsFatalError(err);

		capInstnMakeWidget(instn, capInstnRemoveNew);
	});
}

/*
 * Load instrumentations that already exist on the server and create widgets for
 * each one.
 */
function capLoadServerInstns()
{
	capBackend.instnsList(function (err, instns) {
		if (err)
			jsFatalError(err);

		instns.forEach(function (instn) {
			capInstnMakeWidget(instn, capInstnRemoveServer);
		});
	});
}

/*
 * Invoked once per second to update each widget.
 */
function capTick()
{
	capWidgets.forEach(function (w) { w.tick(); });
}

/*
 * Create a new widget for the given instrumentation.  This is used for both
 * instrumentations created by this user during this session as well as those
 * which were loaded from the server.  The "remove" callback is invoked when the
 * user asks to removes the widget, and this callback is responsible for
 * actually removing the widget and optionally deleting the instrumentation.
 */
function capInstnMakeWidget(instn, removecb)
{
	var options, cons, widget;

	options = {
	    'title': instn.title(),
	    'panel': capPanel,
	    'pxHeight': capGraphHeight,
	    'pxWidth': capGraphWidth,
	    'onremove': function () {
		removecb(widget, instn);
	    },
	    'oninstn': function (newinstn) {
		capInstnMakeWidget(newinstn, capInstnRemoveNew);
	    }
	};

	if (instn.isNumericDecomposition()) {
		cons = caWidgetHeatMap;
		options['source'] = instn;
	} else {
		cons = caWidgetLineGraph;
		options['sources'] = [ { 'instn': instn } ];
	}

	capPanel.instnAdd(instn);
	widget = new cons(options);
	capWidgets.push(widget);

	$(widget.caElement).hide();
	$(widget.caElement).appendTo(capDomContent);
	$(widget.caElement).slideDown(100);
}

/*
 * Removes the given widget from the UI.
 */
function capWidgetRemove(widget, callback)
{
	$(widget.caElement).fadeOut(250, function () {
		$(widget.caElement).remove();
		capWidgets.splice(capWidgets.indexOf(widget), 1);
		callback();
	});
}

/*
 * "remove" callback for instrumentations created by the user.  This removes the
 * widget itself and then deletes the instrumentation from the server.
 */
function capInstnRemoveNew(widget, instn)
{
	capWidgetRemove(widget, function () {
		capPanel.widgetRemove(widget);
		capBackend.instnDelete(instn, function () {});
	});
}

/*
 * "remove" callback for instrumentaitons loaded from the server.  This presents
 * the user with the option of just removing the widget or also deleting the
 * instrumentaiton from the server.
 */
function capInstnRemoveServer(widget, instn)
{
	var div = $([
	    '<div>',
	    'This instrumentation was loaded from the server and another user ',
	    'may still be using it.',
	    '</div>'
	].join('\n'));

	$(div).dialog({
	    'resizable': false,
	    'modal': true,
	    'title': 'Remove loaded instrumentation',
	    'width': '400px',
	    'buttons': {
		'Just remove it from this screen': function () {
			$(this).dialog('close');
			capWidgetRemove(widget, function () {
				capPanel.widgetRemove(widget);
			});
		},
	        'Delete it anyway': function () {
			$(this).dialog('close');
			capInstnRemoveNew(widget, instn);
		}
	    }
	});
}

/*
 * Report an error to the user.
 */
function capError(err)
{
	var div = $([
	    '<div>',
	    '<p><span class="ui-icon ui-icon-alert caDialogIcon"></span>',
	    err.message,
	    '</p>',
	    '</div>'
	].join('\n'));

	$(div).dialog({
	    'resizable': false,
	    'modal': true,
	    'title': 'Error',
	    'width': '400px',
	    'buttons': {
	        'OK': function () {
			$(this).dialog('close');
		}
	    }
	});
}
