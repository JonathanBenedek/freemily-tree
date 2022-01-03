// @ts-nocheck



var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
var paramsFromUrl = {}
var isUserSignIn = false;
const nextSearchButton = document.getElementById('next_search');
nextSearchButton.onclick = presentNextSearch;

const hideSearchDialogButton = document.getElementById('button_hide_search_dialog');
hideSearchDialogButton.onclick = closeSearchDiaolog;




var connectToCSVButton = document.getElementById("connect_csv_button");
connectToCSVButton.onclick = connectToCSV;

var chooseGoogleButton = document.getElementById("choose_google_button");

var chooseSvgButton = document.getElementById("choose_svg_button");


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


function getParamsFromUrl(){
	var query = getQueryParams(document.location.search);
	return query;
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

function hideDbDialog() {
	$("#choose_db")[0].close()
}

function chooseDbDialogShow(){
	return new Promise((resolve, reject) => {
	$("#choose_db")[0].showModal();
		chooseSvgButton.onclick = getFromUserCsv;
		chooseGoogleButton.onclick = getFromUserGoogleSheetId;
		function getFromUserCsv(){
			resolve("csv");
			hideDbDialog();
		}
		function getFromUserGoogleSheetId(){
			resolve("googleSheet");
			hideDbDialog();
		}
	})
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
	return new Promise<void>((resolve, reject) => {
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
			resolve(url);
			//loadFamilyTree(url);
			hideWellcomeDialog();
			$("#urlSheet")[0] = "";
			if(rootToSearch){
				doSearch({isParamsFromUrl : true})
		
			}
		}

		const connectToUrlButton = document.getElementById("conect_button");
		connectToUrlButton.onclick = connectToSheetRemote;
	})

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

function connectToCSV(){

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

function handleClientLoad() {
	return new Promise<void>((resolve, reject) => {
		gapi.load('client:auth2', function(){
			resolve();
		});
	})
}

async function readData(){
	let dataArray = [];
	const dbType: string =  await chooseDbDialogShow();
	if (dbType === "csv"){
		dataArray = await getFromUserCsv();
	} else if (dbType === "googleSheet"){
		dataArray = await getFromUserGoogleSheetId();
	} else {
		console.log("error: unknwon db type");
		throw("error: unknwon db type");
	}
	return dataArray;
}

function showDialogLoadCSV(){
	return new Promise((resolve, reject)=>{
		//show
		$("#load_csv_file")[0].showModal();

		function handleUserChooseCSVFile(){
			
			const fileCSVInput = document.getElementById('fileCSVInput');

			var reader = new FileReader();
			reader.onload = function () {
				resolve(reader.result);
				$("#load_csv_file")[0].close()
			};
			// start reading the file. When it is done, calls the onload event defined above.
			reader.readAsBinaryString(fileCSVInput.files[0]);

		}

		const userChooseCSVFile = document.getElementById('userChooseCSVFile');
		userChooseCSVFile.onclick = handleUserChooseCSVFile;

	})
}


async function getFromUserCsv(params:type) {
	const csvFile =  await showDialogLoadCSV();
	const dataArray = parseCsvToMultiArray(csvFile)
	return dataArray;
}

async function getFromUserGoogleSheetId(params:type) {
	await handleClientLoad();
	if (!isUserSignIn){
		const res : boolean = await initClient(); // authentication	
		if (!res){ // not authorize
			showAuthDialog();
			authorizeButton.style.display = "visible";
			return;
		}
	}

	const sheetIdInput = await showWellcomeDialog();

	const dataArray = await readFromGoogleSheets(sheetIdInput);
	return dataArray;

}


async function start() {
	console.log("start");

	const data : Array =  await readData();
	loadFamilyTree(data);


	updateHeaderDetails("");
	paramsFromUrl = getParamsFromUrl();
	if (paramsFromUrl.db){
		//loadFamilyTree(data);
		//connectToSheetRemote(paramsFromUrl.db, paramsFromUrl.root);
	}else{
		//showWellcomeDialog();
	}
	
}



