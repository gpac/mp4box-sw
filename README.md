# mp4box-sw
Service Worker for MP4 files

This project shows the use of [MP4Box.js](https://github.com/gpac/mp4box.js) as a Service Worker.

This Service Worker intercepts requests to resources in its scope, checks if the response is an MP4 file. If so, it parses it and determines if there is HTML content in the MP4 file (stored as a primary item in a 'meta' box whose handler is 'html'). If so, the Service Worker forwards first the HTML content to the browser. All further requests made by the browser (because referenced from the HTML page) will be checked by the Service Worker to see if the resource is in the MP4 file. The MP4 file acts as a package for resources associated to the MP4 file.

# Creating Content
To create MP4 files with web content in them, 
- download first the command-line tool [MP4Box](gpac.io/downloads/gpac-nightly-builds/), 
- then find your favorite MP4 file, and run the following commands:

```
MP4Box -set-meta html file.mp4
```
This will add a `meta` top-level box to your MP4 file, enabling the packaging of additional resouces. The code `html` is used by the service worker to know if the content in the `meta` box is meant for the browser or not.

```
MP4Box -add-item file.html:mime=text/html:id=1 file.mp4
MP4Box -add-item file.css:mime=text/css:id=2 file.mp4
MP4Box -add-item file.js:mime=text/javascript:id=3 file.mp4
MP4Box -add-item image/file.svg:mime=image/svg+xml:id=4 file.mp4
```
Each of these commands will add a resource to the MP4 file. Any resource can be added (HTML, JS, CSS, SVG, XML, JSON, ...) and the provided mime type is used by the service worker to serve the file to the browser. The given path the to resource when packaging is preserved in the MP4 file so that you don't have to change path links in your content.

```
MP4Box -set-primary 1 file.mp4
```
This last command tells the Service Worker which resource is to be served first to the browser, called the primary item. The parameter is the id provided previously with the `:id=` part.

You can call all the commands above in a single call:
```
MP4Box -set-meta html 
       -add-item file.html:mime=text/html:id=1
       -add-item file.css:mime=text/css:id=2
       -add-item file.js:mime=text/javascript:id=3
       -add-item image/file.svg:mime=image/svg+xml:id=4 file.mp4
```
There are several other commands that you can use (e.g. removing resources), you can check them with:
```
MP4Box -h meta
```

You can check that the resulting packaging is correct using:
```
MP4Box -info file.mp4
```
or using [MP4Box Online File Analyzer](download.tsi.telecom-paristech.fr/gpac/mp4box.js/filereader.html)
