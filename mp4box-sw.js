// Note: in serviceworker environnement the global object is called self (not window) 

importScripts('mp4box.all.js');

// Set the callback for the install step
self.addEventListener('install', function(event) {
	console.log("[mp4box-sw] Installed");
    // Perform install steps
	console.log(event);
});

self.addEventListener('activate', function(event) {
  console.log("[mp4box-sw] activated");
});

function createResponse(type, data) {
	console.log("[mp4box-sw] Creating response of type "+type);
	var init = { status: 200 };
	var response = new Response(data,init);
	// the response already has a content-type = text/plain, we need to remove it and replace it with svg
	response.headers.delete('Content-Type');
	response.headers.append('Content-Type', type);
	return response;	
}

/* Cache of MP4Box instances by URL */
var urlToMP4Box = [];

// Set the callback for when the pages make URL requests 
self.addEventListener('fetch', function(event) {
	// Need to clone the request because we are consuming it when reading headers
	var req = event.request.clone();	
	console.log("[mp4box-sw] Fetch request received for URL:", req.url);
	console.log("[mp4box-sw] Request object:", req);
	req.headers.forEach(function(value, key) {
		console.log("[mp4box-sw]    "+key +": "+value);
	});

	/* Closure-bound variable holding the MP4Box object for use in Promise onFullfilled callbacks */
	var mp4box;

	function fetchPromiseSuccessCallback(response) {
		console.log("[mp4box-sw] Received response for URL:", response.url);
		console.log("[mp4box-sw] Response object:", response);
		response.headers.forEach(function(value, key) {
			console.log("[mp4box-sw]    "+ key +": "+value);
		});

		/* if the response is an MP4 file, get an ArrayBuffer of it and inspect it 
		   otherwise simply return the response
		*/
		var contentType = response.headers.get("Content-Type");
		if (contentType === "video/mp4") {
			console.log("[mp4box-sw] The resource is an MP4 file");
			console.log("[mp4box-sw] Creating MP4Box instance for "+ req.url);
			mp4box = new MP4Box(true, false);
			urlToMP4Box[req.url] = mp4box;
			mp4box.originalResponse = response;
			return response.arrayBuffer();
		} else {
			return response;
		}
	}

	function arrayBufferPromiseSuccessCallback(arrayBufferOrResponse) {
		if (arrayBufferOrResponse instanceof ArrayBuffer) {
			console.log("[mp4box-sw] Processing ArrayBuffer");
			var arrayBuffer = arrayBufferOrResponse;
			var ok = false;
			arrayBuffer.fileStart = 0;
			mp4box.appendBuffer(arrayBuffer);
			var metaHandler = mp4box.inputIsoFile.getMetaHandler();
			if (metaHandler === 'html') {
				var item = mp4box.inputIsoFile.getPrimaryItem();
				console.log("[mp4box-sw] Found primary item in MP4 of type "+item.content_type);					
				arrayBufferResponse = createResponse(item.content_type, item.data.buffer);
				ok = true;
			} 
			if (!ok) {
				console.log("[mp4box-sw] Could not find useful resource, sending the original response");
				arrayBufferResponse = mp4box.originalResponse;
			}
			return arrayBufferResponse;
		} else {
			console.log("[mp4box-sw] Forwarding response");
			return arrayBufferOrResponse;
		}
	}

	var item_id;
	var item_name;
	mp4box = urlToMP4Box[req.referrer];
	var checkInMP4 = false;
	if (mp4box) {
		console.log("[mp4box-sw] There is an MP4Box instance for the referrer of this resource");
		if (req.url == req.referrer) {
			console.log("[mp4box-sw] The MP4Box instance was created for this resource, sending the original response");
			return mp4box.originalResponse;
		} else {
			/* The requested URL is different from the MP4 referer */
			console.log("[mp4box-sw] Check if this MP4Box has an item for this resource");
			item_name = req.url.substring(req.url.lastIndexOf('/')+1);
			item_id = mp4box.inputIsoFile.hasItem(item_name);
			if (item_id == -1) {
				console.log("[mp4box-sw] Could not find item "+item_name+" in MP4");
				/* continue to issue the fetch for the resource */
			} else {
				return createResponseFromItemId(mp4box, item_id);
			}
		}	
	} 

	console.log("[mp4box-sw] Fetching resource");
	event.respondWith(fetch(event.request).then(fetchPromiseSuccessCallback).then(arrayBufferPromiseSuccessCallback));
});

function createResponseFromItemId(mp4box, item_id) {	
	var item = mp4box.inputIsoFile.getItem(item_id);
	console.log("[mp4box-sw] Found item "+item_id+" in MP4 of type "+item.content_type);
	return createResponse(item.content_type, item.data.buffer);
}
