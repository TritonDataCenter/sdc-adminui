/*jsl:import analyticsVis.js */
/*jsl:import color.js */
/*jsl:import metrics.js */
/*jsl:import updater.js */
/*jsl:import visConfig.js.sample */

/*
 * Sets up visualization creation on DOM ready.
 */

var addThrober;
var createInstrumentation;

$(document).ready(function() {
  gInitColors();

  var target = $(visConfig.visualizationContainerSelector);
  var visUpdater = new Updater();
  var visualizations = {
    'numeric-decomposition' : Heatmap,
    'discrete-decomposition' : BarChart,
    'scalar' : BarChart
  };

  var createVisualization = function(data) {
    $('.ca_throbber').remove();
    $("#error").hide();
    var visType = visualizations[data['value-arity']];
    var vis = new visType(data, visUpdater, createVisualization);
    target.prepend(vis.el);
    Visualization.add(vis);
  };

  var postError = function(jqXHR, textStatus, errorThrown) {
    $('.ca_throbber').remove();
    $(visConfig.visualizationErrorSelector).empty();
    $(visConfig.visualizationErrorSelector).html('<div id="error_header"><div class="title">Error</div></div><div id="error_body"><ul><li></li></ul></div>');
    var x = JSON.parse(jqXHR.responseText);
    $("#error_body").find('li').html(x.errors[0]);
    $(visConfig.visualizationErrorSelector).show();
  };

  addThrober = function() {
    var img_src = 'data:image/gif;base64,' +
    		'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' +
    		'5B8TgRwSRKIHQtaLCwg1RAAAOwAAAAAAAAAAAA==';

      var throb = document.createElement('DIV');
      throb.className = 'ca_throbber';
    	throb.style.width = '884px';
    	throb.style.height = '200px';
    	throb.style.paddingTop = '100px';
    	throb.style.textAlign = 'center';

    	var img_node = document.createElement('img');
    	img_node.src = img_src;
    	throb.appendChild(img_node);
    	return throb;


  };

  createInstrumentation = function(metric, field1, field2, predicate) {
    var decomps = [];

    var postURL = visConfig.postInstrumentation;
    if (typeof postURL === 'function') postURL = postURL();

    if (field1) decomps.push(field1.name);
    if (field2) decomps.push(field2.name);

    Metrics.selectedField1 = null;
    Metrics.selectedField2 = null;

    var dataParams = {
      module : metric.module.name,
      stat : metric.stat,
      decomposition : decomps
    };

    if (predicate) {
      dataParams['predicate'] = predicate;
    }

    if (visConfig.beforeCreateHook) {
      dataParams = visConfig.beforeCreateHook(dataParams);
    }

    target.prepend(addThrober());

    $.ajax({
      url : postURL,
      type : "POST",
      dataType : "json",
      data : dataParams,
      traditional : true,
      headers : visConfig.requestHeaders,
      success : createVisualization,
      error : postError
    });
  };

  initMetrics(visConfig.getMetrics, function() {
    if (visConfig.haveMetrics) visConfig.haveMetrics();
    Metrics.createLeafList(visConfig.leaflistContainerSelector);
    Metrics.getSelectedMetric(visConfig.visCreateButton, visConfig.createInstrumentation || createInstrumentation ); // Plug in the old method.

    // Instantiate existing instrumentations, if any.
    $.ajax({
      url: visConfig.getAllInstrumentations,
      type : "GET",
      dataType : "json",
      headers : visConfig.requestHeaders,
      success: function(data) {
        // This should be an array or empty array.
        if (Array.isArray(data)) {
          data.forEach(function(d) {
            createVisualization(d);
          });
        }
      }
    });
  });


});
