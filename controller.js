


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

function showAuthDialog(){
	$("#auth_dialog")[0].showModal();
}

function hideAuthDialog(){
	$("#auth_dialog")[0].close()
}


function showWellcomeDialog(){
	$("#wellcome_dialog")[0].showModal();
}

function hideWellcomeDialog(){
	$("#wellcome_dialog")[0].close()
}


function connectToSheetRemote(){
	var url = $("#urlSheet").val();
//	URL_SHEET = url
	//handleClientLoad();
	listMajors(url);
	loadFamilyTree(url);
	hideWellcomeDialog();
}

function updateHeaderDetails(text){
	//$("#header_current_person_details")[0].empty();
	$("#header_current_person_details")[0].append(text)
}

$(document).ready(function () {
	//showSearchDialog();
	//showAuthDialog();
	showWellcomeDialog();
	updateHeaderDetails("");
});

new ScrollZoom($('#content'), 4, 0.5)