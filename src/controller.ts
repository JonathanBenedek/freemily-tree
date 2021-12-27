// @ts-nocheck



var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
var paramsFromUrl = {}
const nextSearchButton = document.getElementById('next_search');
nextSearchButton.onclick = presentNextSearch;

const hideSearchDialogButton = document.getElementById('button_hide_search_dialog');
hideSearchDialogButton.onclick = closeSearchDiaolog;

const connectToUrlButton = document.getElementById("conect_button");
connectToUrlButton.onclick = connectToSheetRemote;

const goTOSearchButton = document.getElementById('go_to_search');
goTOSearchButton.onclick = showSearchDialog;

const confirmAuthRequestPopupButton = document.getElementById('confirm_auth_request_button');
confirmAuthRequestPopupButton.onclick = handleClickconfirmAuthRequestPopupButton;

const doSearchButton = document.getElementById('do_search');
doSearchButton.onclick = doSearch;

const newUserConnectButton = document.getElementById('new_user_connect_button');
newUserConnectButton.onclick = newUserConnectClicked;

const newUserButton = document.getElementById('new_user_button');
newUserButton.onclick = newUserClicked;
const cancelButtonTextField = document.getElementById("cancelPersonDetails");
cancelButtonTextField.onclick = closeDialogFields;

var contentElement = document.getElementById('content');

var zoomInButton = document.getElementById('zoom_in_button');
zoomInButton.onclick = handleZoomInClicked;
var zoomOutButton = document.getElementById('zoom_out_button');
zoomOutButton.onclick = handleZoomOutClicked;

var zoomInValue = 1;
function handleZoomOutClicked(){
	var basicExample = document.getElementById('basic-example');
	zoomInValue = zoomInValue - 0.1;
	basicExample.style['transform'] = `scale(${zoomInValue})`;
}

function handleZoomInClicked(){
	var basicExample = document.getElementById('basic-example');
	if ( zoomInValue === 1 || zoomInValue >= 1){
		return;
	}
	zoomInValue = zoomInValue + 0.1;
	basicExample.style['transform'] = `scale(${zoomInValue})`;
}

function setContentClass(){
	if (isMobile){
		contentElement.classList.add("dragscroll");
	}else{
		contentElement.classList.add("dragscroll");
	}
}

dragscroll
function getParamsFromUrl(){
	var query = getQueryParams(document.location.search);
	return query;
}
var isUserSignIn = true;
function handleClientLoad() {
	gapi.load('client:auth2', initClient);
}

function newUserClicked(){
	hideWellcomeDialog();
	showNewUserDialog();
}
function showNewUserDialog(){
	$("#new_user_dialog")[0].showModal();
}

function hideNewUserDialog(){
	$("#new_user_dialog")[0].close()
}
function newUserConnectClicked(){
	hideNewUserDialog();
	showWellcomeDialog();
	
	url = $("#urlSheet_newUser").val();
	listMajors(url);

}


function getQueryParams(qs) {
    qs = qs.split('+').join(' ');

    var params = {},
        tokens,
        re = /[?&]?([^=]+)=([^&]*)/g;

    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }

    return params;
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

function handleClickconfirmAuthRequestPopupButton(){
	hideAuthDialog();
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
	const wellcomeDialog = document.getElementById('wellcome_dialog');
	wellcomeDialog.showModal();
	//
	//$("#wellcome_dialog")[0].showModal();
}

function hideWellcomeDialog() {
	$("#wellcome_dialog")[0].close()
}

function callbackLoadFamilyTreeSuccess(){
	if (paramsFromUrl.lastName || paramsFromUrl.firstName){
		var isParamsFromUrl = {isParamsFromUrl : true};
		doSearch(isParamsFromUrl);
	}
}

function connectToSheetRemote(urlParam, rootToSearch) {
	var url = null;
	if (typeof urlParam === 'string'){
		url = urlParam;
	}else{
		url = $("#urlSheet").val();
	}
	//	URL_SHEET = url
	//	handleClientLoad();
	//listMajors(url);
	loadFamilyTree(url);
	//hideWellcomeDialog();
	$("#urlSheet")[0] = "";
	if(rootToSearch){
		doSearch({isParamsFromUrl : true})

	}
}

function updateHeaderDetails(text) {
	//$("#header_current_person_details")[0].empty();
	$("#header_current_person_details")[0].append(text)
}

$(document).ready(function () {
	setContentClass();
	//showSearchDialog();
	//showAuthDialog();
	//handleClientLoad();
	//showWellcomeDialog();
	//updateHeaderDetails("");
});

function continueAfterUserAuthorized(){
	if ( ! isUserSignIn){
		showAuthDialog();
		return;
	}
	updateHeaderDetails("");
	paramsFromUrl = getParamsFromUrl();
	if (paramsFromUrl.db){
		loadFamilyTree();
		//connectToSheetRemote(paramsFromUrl.db, paramsFromUrl.root);
	}else{
		showWellcomeDialog();

	}
}

new ScrollZoom($('#content'), 4, 0.5)

function callbacksuccess(){
	console.log("benedektest");
}

jQuery.loadScript = function (url, callback) {
    jQuery.ajax({
        url: 'jquery-csv.js',
        dataType: 'script',
        success: callbacksuccess,
        async: true
    });
}