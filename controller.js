const scrollElement = document.getElementById("containOfContentContainer");


const nextSearchButton = document.getElementById('next_search');
nextSearchButton.onclick = presentNextSearch;

const hideSearchDialogButton = document.getElementById('button_hide_search_dialog');
hideSearchDialogButton.onclick = closeSearchDiaolog;

const connectToUrlButton = document.getElementById("conect_button");
connectToUrlButton.onclick = connectToSheetRemote;

const goTOSearchButton = document.getElementById('go_to_search');
goTOSearchButton.onclick = showSearchDialog;


const doSearchButton = document.getElementById('do_search');
doSearchButton.onclick = doSearch;

const cancelButtonTextField = document.getElementById("cancelPersonDetails");
cancelButtonTextField.onclick = closeDialogFields;

const zoomInButton = document.getElementById("zoom_in");
zoomInButton.onclick = handleZoomIn;
zoomInButton.addEventListener("wheel", handleZoomIn);

const body = document.getElementById("containOfContentContainer");
body.addEventListener("wheel", handleZoomIn);
body.addEventListener("mousewheel", handleZoomIn, false);
body.addEventListener("onmousewheel", handleZoomIn, false);
body.addEventListener("touchmove", handleZoomInMobile, false);
//body.addEventListener("touchstart", touchstar_handler, false);
body.addEventListener('touchend', process_touchend, false);

//body.onpointermove = pointermove_handler;
//body.pointerdown = pointerdown_handler;

var zoomValue = 1;
var scale = 1;


const slider = document.getElementById("containOfContentContainer");
let isDown = false;
let startX;
let startY;
let scrollLeft;
let scrollTop;

slider.addEventListener('mousedown', (e) => {
	isDown = true;
	slider.classList.add('active');
	startX = e.pageX - slider.offsetLeft;
	startY = e.pageY - slider.offsetTop;
	scrollLeft = slider.scrollLeft;
	scrollTop = slider.scrollTop
});
slider.addEventListener('mouseleave', () => {
	isDown = false;
	slider.classList.remove('active');
});
slider.addEventListener('mouseup', () => {
	isDown = false;
	slider.classList.remove('active');
});
slider.addEventListener('mousemove', (e) => {
	if (!isDown) return;
	e.preventDefault();
	const x = e.pageX - slider.offsetLeft;
	const y = e.pageY - slider.offsetTop;
	const walkY = (y - startY);
	const walk = (x - startX); //scroll-fast
	slider.scrollLeft = scrollLeft - walk;
	slider.scrollTop = scrollTop - walkY;
	console.log(walk);
});




var tracks = []
var tracksDistance = []

function calculateDistance(points) {
	var x1 = points[0][0];
	var y1 = points[0][1];
	var x2 = points[1][0];
	var y2 = points[1][1];
	var a = x1 - x2;
	var b = y1 - y2;
	var distance = Math.sqrt(a * a + b * b);
	return distance;
}

//*************************START -  ZOOM MOBILE*****************************8 */
// Global vars to cache event state
var evCache = new Array();
var prevDiff = -1;


function initZoomMobile() {
	// Install event handlers for the pointer target
	var el = body
	el.onpointerdown = pointerdown_handler;
	el.onpointermove = pointermove_handler;

	// Use same handler for pointer{up,cancel,out,leave} events since
	// the semantics for these events - in this app - are the same.
	el.onpointerup = pointerup_handler;
	el.onpointercancel = pointerup_handler;
	el.onpointerout = pointerup_handler;
	el.onpointerleave = pointerup_handler;
}


function pointerup_handler(ev) {
	console.log("--------------pointerup_handler");
	//  log(ev.type, ev);
	// Remove this pointer from the cache and reset the target's
	// background and border
	remove_event(ev);
	//ev.target.style.background = "white";
	//ev.target.style.border = "1px solid black";

	// If the number of pointers down is less than two then reset diff tracker
	if (evCache.length < 2) {
		prevDiff = -1;
	}
}

function process_touchend(ev) {
	tracks = [];
}

function touchstar_handler(ev) {
	//  ev.preventDefault();
	console.log("----------pointerdown_handler")
	switch (ev.touches.length) {
		case 1:
			handle_one_touch(ev);
			break;
		case 2:
			ev.preventDefault();
			handle_two_touches(ev);
			break;
		case 3:
			handle_three_touches(ev);
			break;
		default:
			gesture_not_supported(ev);
			break;
	}
	// The pointerdown event signals the start of a touch interaction.
	// This event is cached to support 2-finger gestures
	evCache.push(ev);
	// log("pointerDown", ev);
}

function handle_one_touch(ev) {
	console.log('handle_one_touch')
}

function handle_two_touches(ev) {
	console.log('handle_two_touches')
	// tracks.push(ev);
	// handleZoomInMobile(ev);


}

function handle_three_touches(ev) {
	console.log('handle_three_touches')


}

function gesture_not_supported(ev) {
	console.log('gesture_not_supported')

}

function remove_event(ev) {
	console.log("-----------remove_event")
	// Remove this event from the target's cache
	for (var i = 0; i < evCache.length; i++) {
		if (evCache[i].pointerId == ev.pointerId) {
			evCache.splice(i, 1);
			break;
		}
	}
}

function touchmove_handler(ev) {
	// ev.preventDefault();
	console.log("-----pointermove_handler")
	// This function implements a 2-pointer horizontal pinch/zoom gesture. 
	//
	// If the distance between the two pointers has increased (zoom in), 
	// the taget element's background is changed to "pink" and if the 
	// distance is decreasing (zoom out), the color is changed to "lightblue".
	//
	// This function sets the target element's border to "dashed" to visually
	// indicate the pointer's target received a move event.
	//  log("pointerMove", ev);
	//ev.target.style.border = "dashed";

	// Find this event in the cache and update its record with this event
	for (var i = 0; i < evCache.length; i++) {
		if (ev.pointerId == evCache[i].pointerId) {
			evCache[i] = ev;
			break;
		}
	}

	// If two pointers are down, check for pinch gestures
	if (evCache.length == 2) {
		// Calculate the distance between the two pointers
		var curDiff = Math.abs(evCache[0].clientX - evCache[1].clientX);

		if (prevDiff > 0) {
			if (curDiff > prevDiff) {
				// The distance between the two pointers has increased
				//      log("Pinch moving OUT -> Zoom in", ev);
				//ev.target.style.background = "pink";
				doZoomInOnMobile();
			}
			if (curDiff < prevDiff) {
				// The distance between the two pointers has decreased
				//     log("Pinch moving IN -> Zoom out", ev);
				// ev.target.style.background = "lightblue";
				doZoomOutOnMobile();
			}
		}

		// Cache the distance for the next move event 
		prevDiff = curDiff;
	}
}


//**************************END - ZOOM MOBILE****************************8 */

function analyzeWhichOperationTodo() {
	console.log(tracks);
	let result = ""
	var distance1 = calculateDistance(tracks[0]);
	var distance2 = calculateDistance(tracks[1]);
	if (distance1 > distance2) {
		//zoom out
		result = "zoomOut";
	} else if (distance1 < distance2) {
		//zoom in
		result = "zoomIn";
	} else {
		result = "drag";
	}
	return result;
}

function handleZoomInMobile(event) {
	//event.preventDefault();

	//only run code if the user has two fingers touching
	if (event.touches.length >= 2) {
		// event.preventDefault()

		//handleZoomIn();
		//track the touches, I'm setting each touch as an array inside the tracks array
		//each touch array contains an X and Y coordinate
		tracks.push([
			[event.touches[0].pageX, event.touches[0].pageY],
			[event.touches[1].pageX, event.touches[1].pageY]
		]);

		if (tracks.length >= 2) {
			var zoomInOrOut = analyzeWhichOperationTodo();
			if ("zoomOut" == zoomInOrOut) {
				//  handleZoomIn()
						 event.preventDefault()
				doZoomOutOnMobile();
			} else if ("zoomIn" == zoomInOrOut) {
				event.preventDefault()
				doZoomInOnMobile();
			} else { // darg

			}
			tracks.shift();
		}
	}
}

function doZoomInOnMobile() {
	scale += 3 * 0.01;
	// Restrict scale
	scale = Math.min(scale, 2);
	// Apply scale transform
	const divTozoom = document.getElementById("content");
	divTozoom.style.transform = `scale(${scale})`;
	console.log("doZoomInOnMobile === " + scale);
}



function doZoomOutOnMobile() {
	scale += 3 * -0.01;
	// Restrict scale
	scale = Math.max(scale, 0.5);
	// Apply scale transform
	const divTozoom = document.getElementById("content");
	divTozoom.style.transform = `scale(${scale})`;
	console.log("doZoomOutOnMobile === " + scale);

}
let testCounter = 1;
function handleZoomIn(event) {
	console.log("handleZoomIn");
	event.preventDefault()


	event.deltaY = Math.min(event.deltaY, 1);
	event.deltaY = Math.max(event.deltaY, -1);
	scale += event.deltaY * -0.01;
	// Restrict scale
	scale = Math.min(scale, 4.0);
	scale = Math.max(scale, 0.02);

	// Apply scale transform
	const divTozoom = document.getElementById("content");
	//console.log("---handleZoomIn")
	translateX = (event.x - 900) * -1;
	translateY = (event.y - 900) * -1;

	testCounter = testCounter + 1;
	divTozoom.style.transform = `scale(${scale})`// translate(${translateY}px,${translateX}px)`;
	//	divTozoom.style.transform = `scale(${scale}) translate(${translateY}px,${translateX}px)`;
	console.log("translte x = " + translateX + "   translte y = " + translateY);
	//divTozoom.style.transform = `transform(${300,300})`;
	//setTimeout(()=>{moveToTest(event.x, event.y);},0);

}

function moveToTest(x, y) {
	const divTozoom = document.getElementById("content");
	//slider.scrollTop = y;
	//slider.scrollLeft = x;
	divTozoom.style.transform = `translate(${x},${y})`;

	console.log(`moveToTest x ${x}, y= ${y} `);
	//divTozoom.scrollTo(x,y);
	//setTimeout(window.scrollTo(x, y),500);

}

function ScrollZoom(container, max_scale, factor) {
	var target = container.children().first()
	var size = { w: target.width(), h: target.height() }
	var pos = { x: 0, y: 0 }
	var zoom_target = { x: 0, y: 0 }
	var zoom_point = { x: 0, y: 0 }
	var scale = 1
	target.css('transform-origin', '0 0')
	target.on("mousewheel DOMMouseScroll", scrolled)

	function scrolled(e) {
		console.log("scrol-----------")
		var offset = container.offset()
		zoom_point.x = e.pageX - offset.left
		zoom_point.y = e.pageY - offset.top

		e.preventDefault();
		var delta = e.delta || e.originalEvent.wheelDelta;
		if (delta === undefined) {
			//we are on firefox
			delta = e.originalEvent.detail;
		}
		delta = Math.max(-1, Math.min(1, delta)) // cap the delta to [-1,1] for cross browser consistency

		// determine the point on where the slide is zoomed in
		zoom_target.x = (zoom_point.x - pos.x) / scale
		zoom_target.y = (zoom_point.y - pos.y) / scale

		// apply zoom
		scale += delta * factor * scale
		scale = Math.max(1, Math.min(max_scale, scale))

		// calculate x and y based on zoom
		pos.x = -zoom_target.x * scale + zoom_point.x
		pos.y = -zoom_target.y * scale + zoom_point.y


		// Make sure the slide stays in its container area when zooming out
		if (pos.x > 0)
			pos.x = 0
		if (pos.x + size.w * scale < size.w)
			pos.x = -size.w * (scale - 1)
		if (pos.y > 0)
			pos.y = 0
		if (pos.y + size.h * scale < size.h)
			pos.y = -size.h * (scale - 1)

		update()
	}

	function update() {
		target.css('transform', 'translate(' + (pos.x) + 'px,' + (pos.y) + 'px) scale(' + scale + ',' + scale + ')')
	}
}


function showSearchDialog() {
	$("#search_dialog")[0].showModal();


}

function showAuthDialog() {
	$("#auth_dialog")[0].showModal();
}

function hideAuthDialog() {
	$("#auth_dialog")[0].close()
}


function showWellcomeDialog() {
	$("#wellcome_dialog")[0].showModal();
}

function hideWellcomeDialog() {
	$("#wellcome_dialog")[0].close()
}


function connectToSheetRemote() {
	var url = $("#urlSheet").val();

	//	URL_SHEET = url
	//	handleClientLoad();
	listMajors(url);
	//loadFamilyTree(url);
	//hideWellcomeDialog();
	$("#urlSheet")[0] = "";
	// initZoomMobile();
}

function updateHeaderDetails(text) {
	//$("#header_current_person_details")[0].empty();
	$("#header_current_person_details")[0].append(text)
}

$(document).ready(function () {
	//showSearchDialog();
	//showAuthDialog();
	showWellcomeDialog();
	updateHeaderDetails("");

});

//new ScrollZoom($('#content'), 4, 0.5)