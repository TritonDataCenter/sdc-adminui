## OVERVIEW

This is a library providing UI and client-side visualization for cloud-analytics.

### Core
 - analyticsVis.js - DOM and rendering for visualizations.
 - caRawDataStore.js - cache/store used for querying raw data.
 - color.js - provides color/hue data for server-side heatmap visualization.
 - metrics.js - DOM and abstraction of cloud-analytics metrics, modules, fields, types.
 - updater.js - centralized queueing/throttling of requests to CA server.
 - css/vis.css - CSS styles derived from the reference portal used to render the included DOM.
 
### Optional
 - extlib.js - JS polyfill to provide Function.bind() and Object.keys() to browsers that lack them.  Could be replaced with any number of similar libraries.
 - jquery-ui-1.8.8.custom.min.js - patched jQuery UI used to give independently-stylable slider handles.  Used in the current portal DOM, but not required.

## Requirements

**d3** [http://github.com/mbostock/d3]() - Data-driven visualization library.  d3 is bundled with this library, see integration notes.

**jQuery** [http://jquery.com/]() v >= 1.4 - Javascript framework. jQuery is assumed to already be installed.  Currently this is required in both the included DOM derived from the user portal, and in the d3 visualization itself.  It's a current goal to eliminate jQuery dependency from the d3 portion of the visualization.

**jQuery-ui** [http://jqueryui.com/]() v >= 1.8.9 - Javascript UI using jQuery.  Assumed to already be installed.

And clearly, a server running cloud-analytics is required for this library to be of use on the client side.

## Demo/Sandbox

    node demo/demo.js ip:port

 - canonically 10.99.99.9:23181 - the default CA address on CoaL.
    

Then connect on:

    http://localhost:4124

## Integration notes

As git submodule:
git submodule add git@git.joyent.com:ca-vis

To install bundled d3:
git submodule update --init --recursive

## General architecture

