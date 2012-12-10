/*
 * Configuration for the client visualization library; includes various paths
 * and options that may change depending on where the library is deployed.
 * ALL VALUES ARE REQUIRED.
 *
 * The current values are appropriate for the demo.
 * 
 * This file may be embedded elsewhere, but should supply the visConfig variable.
 */

var visConfig = {
  
  /*
   * API endpoints.  Called (generally via jQuery.ajax) to perform operations
   * on CA resources.
   */

  // get list of available metrics, fields, types, modules, etc.
  getMetrics : '/ca',

  // path to query to get all active instrumentations
  getAllInstrumentations : '/ca/instrumentations',
  
  // post a new instrumentation (usually the same as getAll)
  postInstrumentation : '/ca/instrumentations',
  
  // prefix to prepend to ids to create uris
  proxyPath:  '/ca/instrumentations/',
  
  /*
   * UI elements.
   */
  
  // CSS selector for the element that should contain the 
  // instrumentation-creation UI.
  leaflistContainerSelector : '#visCreate',
  
  // CSS selector for the instrumentation creation button.
  visCreateButton : '#visCreateButton',
  
  // CSS selector for the element that should contain the
  // actual visualizations
  visualizationContainerSelector : '#visContainer'
};