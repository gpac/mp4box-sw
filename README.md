# mp4box-sw
Service Worker for MP4 files

This page demonstrates the use of [MP4Box.js](https://github.com/gpac/mp4box.js) as a Service Worker.

This Service Worker intercepts requests to resources in the scipe, checks if the response is an MP4 file. If so, it parses it and determines if there is HTML content in the MP4 file (stored as a primary item in a 'meta' box whose handler is 'html'). If so, the Service Worker forwards first the HTML content to the browser. All further requests made by the browser (because referenced from the HTML page) will be checked by the Service Worker to see if the resource is in the MP4 file. The MP4 file acts as a package for resources associated to the MP4 file.

