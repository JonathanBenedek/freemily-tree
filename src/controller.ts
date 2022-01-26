// @ts-nocheck



var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
let treeManager = new FreemilyTree();
var paramsFromUrl = {}
var isUserSignIn = false;
const nextSearchButton = document.getElementById('next_search');

nextSearchButton.onclick = treeManager.presentNextSearch;

const hideSearchDialogButton = document.getElementById('button_hide_search_dialog');
hideSearchDialogButton.onclick = treeManager.closeSearchDiaolog;




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
cancelButtonTextField.onclick = treeManager.closeDialogFields;

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

function doSearch(isParamsFromUrl) {
	treeManager.whoNextToSearch = 0;
	var firstNameInput = "";
	var lastNameInput = "";
	if (isParamsFromUrl.isParamsFromUrl){
		firstNameInput= paramsFromUrl.firstName;
		lastNameInput = paramsFromUrl.lastName;
	}else{
		 firstNameInput = document.getElementById('firstName_search').value;
		 lastNameInput = document.getElementById('lastName_search').value;
	}
	treeManager.idsAfterSearch = [];
	treeManager.idsAfterSearch = treeManager.getIdsByName(firstNameInput, lastNameInput);
	treeManager.presentNextSearch();
	treeManager.closeSearchDiaolog();

}

function randerDownTree(event) {
    //location.reload();
    var temp = chart_config.slice(0, 1);
    chart_config = temp;
    var event = { target: { id: "build_tree_children_button", who: event.target.value } }
    treeManager.buildTree(event);
    //var temp = chart_config.slice(0, 1);
    //chart_config = temp;
    //makeTreeUpBottom(event.target.value)
    window.setTimeout(treeManager.scrollToCenter, 1000)
        //scrollToCenter();

}

//TODO: make one pice code of add spuse add perosn add child add.. 
function addSpouse(event:any) {
    const person = event.target.person;
    var firstNameSpouse = (<HTMLInputElement>document.getElementById('firstName_input')).value;
    var lsatNameParentSpouse = (<HTMLInputElement>document.getElementById('lastName_input')).value;
    var commentsSpouse = (<HTMLInputElement>document.getElementById('textFiledInputcomment')).value;
    const idSpouse: number = treeManager.getNewId();
    treeManager.addSpouseToLocalDataBase(idSpouse, firstNameSpouse, lsatNameParentSpouse, person.id, commentsSpouse);
    var range = "";
    var bodyId = {
        values: [
            [idSpouse]
        ],
    }
    var bodyFirstName = {
        values: [
            [firstNameSpouse]
        ],
    }
    var bodyLastName = {
        values: [
            [lsatNameParentSpouse]
        ],
    }
    var bodySpouse = {
        values: [
            [idSpouse]
        ],
    }
    var bodyIdPerson = {
            values: [
                [person.id]
            ],
        }
        // ** ADD PERSON **
        // ID
    const rowRange = 1 + idSpouse;
    range = "A" + (rowRange);
    treeManager.editCell(bodyId, range);
    // First Name
    treeManager.addFirstNameToSheets(rowRange, bodyFirstName);
    // Last Name
    treeManager.addLastNameToSheets(rowRange, bodyLastName)
        // Spouse
		treeManager.addSpouseToSheets(rowRange, bodyIdPerson)
        //comment
		treeManager.addCommentToSheets(rowRange, commentsSpouse);

    // ** add to spouse the new preson
    treeManager.addSpouseToSheets((parseInt(person.id) + 1), bodySpouse);
        // ** ADD the all children of person to the new spouse **
    var children : [any] = treeManager.getAllChildren(person.id);
    if (children) {
        children.forEach(child => {
            treeManager.addParentToChildLocalDataBase(idSpouse, null, null, child);
            var value = {
                values: [
                    [idSpouse]
                ],
            }
            treeManager.addParentToChildToSheet(child, value);
        });
    }
    var dialogFields = document.getElementById('dialogFields');
    treeManager.closeDialogFields();
    treeManager.syncTreeAfterInsertNewData(person, "down");

    var buttonSavePerson = document.getElementById("savePersonDetails");
    buttonSavePerson.removeEventListener("click", addSpouse);

}

function handleAddSpouse(event: any) {
    const person = event.target.person;
    let buttonSavePerson: any = document.getElementById("savePersonDetails");
    buttonSavePerson.addEventListener('click', addSpouse);
    buttonSavePerson.person = person;
    //addSpouse(person);
    var dialogAdd: any= document.getElementById('dialogAdd');
    var dialogFields: any = document.getElementById('dialogFields');
    dialogAdd.close();
    dialogFields.showModal();
    //buttonAddSpouse.removeEventListener("click");
    var buttonAddSpouse = document.getElementById("button_add_spouse");
    buttonAddSpouse.removeEventListener("click", handleAddSpouse);
}

function handleAddParent(event: any) {
    const person = event.target.person;
    var buttonSavePerson: any = document.getElementById("savePersonDetails");
    buttonSavePerson.addEventListener('click',  addParentToChild);
    buttonSavePerson.person = person;
    //addParentToChild(person);
    var dialogAdd: any = document.getElementById('dialogAdd');
    var dialogFields: any = document.getElementById('dialogFields');
    dialogAdd.close();
    dialogFields.showModal();
    //buttonAddParent.removeEventListener("click");
    var buttonAddParent = document.getElementById("button_add_parent");
    buttonAddParent.removeEventListener("click", handleAddParent);
}

function handleAddChild(event: any) {
    const person = event.target.person;
    var buttonSavePerson: any = document.getElementById("savePersonDetails");
    buttonSavePerson.addEventListener('click', addChildToParent);
    buttonSavePerson.person = person;
    //addChildToParent(person);
    var dialogAdd: any = document.getElementById('dialogAdd');
    var dialogFields: any = document.getElementById('dialogFields');
    dialogAdd.close();
    dialogFields.showModal();
    //buttonAddChild.removeEventListener("click");
    var buttonAddChild = document.getElementById("button_add_child");
    buttonAddChild.removeEventListener("click", handleAddChild);
}

function handleButtonEditClick(event) {
    var dialog = document.getElementById('dialogAdd');
    var buttonSavePerson = document.getElementById("savePersonDetails");
    buttonSavePerson.addEventListener('click', treeManager.saveCommentsToSheet);
    var containerButtonsAddDialog = document.getElementById("containerButtonsAddDialog");
    var buttons = treeManager.getRelevantButtons(event);
    for (button in buttons) {
        containerButtonsAddDialog.insertAdjacentElement("beforeend", buttons[button]);
    }
    dialog.showModal();

    //TODO: save comment at remote databaes


    //var person = prompt("Please enter your name", "Harry Potter");
    //console.log(person);
    //document.location.href = "./EditForm.html";
    var body = {
            values: [
                ["dfvdsv"]
            ],
        }
        //console.log(event.target.value);
        //editCell(body, "A1")
}


function randerUpTree(event) {
    //location.reload();
    var temp = chart_config.slice(0, 1);
    chart_config = temp;
    var event = { target: { id: "build_tree_parents_button", who: event.target.value } }
    treeManager.buildTree(event);
    window.setTimeout(treeManager.scrollToCenter, 1000)
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

function addChildToParent(event: any) {
    const person: any = event.target.person;
    var firstNameChild: string = $("#firstName_input").val() as string;
    var lsatNameChild = $("#lastName_input").val() as string;
    var commentsChild = $("#textFiledInputcomment").val() as string;
    const idChild: number = treeManager.getNewId();
    treeManager.addChildrenToLocalDataBase(idChild, firstNameChild, lsatNameChild, person.id, parseInt(person.spouse), commentsChild);
    var range = "";
    var bodyId = {
        values: [
            [idChild]
        ],
    }
    var bodyFirstName = {
        values: [
            [firstNameChild]
        ],
    }
    var bodyLastName = {
        values: [
            [lsatNameChild]
        ],
    }
    var bodyParent1 = {
            values: [
                [person.id]
            ],
        }
        // ** ADD PERSON **
        // ID
    let rowRange = 1 + idChild;
    range = "A" + (rowRange);
    treeManager.editCell(bodyId, range);

    treeManager.addFirstNameToSheets(rowRange, bodyFirstName);
    treeManager.addLastNameToSheets(rowRange, bodyLastName);
    treeManager.addParentToChildToSheet(idChild, bodyParent1, null, 1);
    treeManager.addCommentToSheets(rowRange, commentsChild)

    if (person.spouse) {

        var bodyParent2 = {
            values: [
                [treeManager.localDataBase[parseInt(person.spouse)].id]
            ]
        }
        treeManager.addParentToChildToSheet(idChild, bodyParent2);
    }
    //
    var dialogFields = document.getElementById('dialogFields');
    treeManager.closeDialogFields();
    treeManager.syncTreeAfterInsertNewData(person, "down");

    var buttonSavePerson = document.getElementById("savePersonDetails");
    buttonSavePerson.removeEventListener("click", addChildToParent);

}

function  addParentToChild(event:any) {
    const child = event.target.person;
    var firstNameParent = (<HTMLInputElement>document.getElementById('firstName_input')).value;
    var lsatNameParent = (<HTMLInputElement>document.getElementById('lastName_input')).value;
    var commentsParent = (<HTMLInputElement>document.getElementById('textFiledInputcomment')).value;
    var idParent = treeManager.getNewId();
    treeManager.addParentToChildLocalDataBase(idParent, firstNameParent, lsatNameParent, child.id, commentsParent);
    var range = "";
    var bodyId = {
        values: [
            [idParent]
        ],
    }
    var bodyFirstName = {
        values: [
            [firstNameParent]
        ],
    }
    var bodyLastName = {
        values: [
            [lsatNameParent]
        ],
    }
    var bodyComments = {
            values: [
                [commentsParent]
            ],
        }
        // ** ADD PERSON **
        // ID
    const rowRange = 1 + idParent;
    range = "A" + (rowRange);
    treeManager.editCell(bodyId, range);
    // First Name
    range = "B" + rowRange;
    treeManager.editCell(bodyFirstName, range);
    // Last Name
    range = "C" + rowRange;
    treeManager.editCell(bodyLastName, range);
    //comment
    treeManager.addCommentToSheets(rowRange, bodyComments);

    // ** ADD PARENT TO CHILD **
    var value = {
        values: [
            [idParent]
        ],
    }

    treeManager.addParentToChildToSheet(child.id, value, () => {
        //location.reload();
        treeManager.connectSpouseRelationshipByChildLocalDatabase(child.id, idParent);
        treeManager.connectSpouseRelationshipByChildRemoteStorageSheets(child.id, idParent);
        var dialogFields = document.getElementById('dialogFields');
        treeManager.closeDialogFields();
        treeManager.syncTreeAfterInsertNewData(child);
    });

    //	buttonSavePerson.removeEventListener('click');

    // ** CONNECT(sposue reltionship) PARENT TO SECOND PARENT IF EXIST **
    // update local database
    //	connectSpouseRelationshipByChildLocalDatabase(child.id, idParent);

    // update data base sheets
    //	connectSpouseRelationshipByChildRemoteStorageSheets(child.id, idParent);
    var buttonSavePerson = document.getElementById("savePersonDetails");
    buttonSavePerson.removeEventListener("click", addParentToChild);

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

async function  listMajorsApi4(sheetId) {
	return new Promise((resolve, reject)=> {
	   gapi.client.sheets.spreadsheets.values.get({
		   spreadsheetId: sheetId,
		   range: 'A1:H',
	   }).then(function (response) {
		   treeManager.isUserHavePremission = true ;
		   SHEET_ID = sheetId;
		   resolve(response.result.values);
		   //parseDataSheetsToMultiArray(response.result.values);
		   //loadFamilyTree();
		   //hideWellcomeDialog();
	   }, function (err) {
		   console.log(err);
		   document.getElementById("error_sheetUrl").classList.remove("hidden");
		   document.getElementById("error_sheetUrl").classList.add("shown");
		   reject(err);
		   return;
	   }).catch((err) => {
		   console.log(err);
		   document.getElementById("error_sheetUrl").classList.remove("hidden");
		   document.getElementById("error_sheetUrl").classList.add("shown");
		   reject(err);
		   return;
	   });
	})

 }

async function readFromGoogleSheets(sheetIdInput){
	return await listMajorsApi4(sheetIdInput);
}

async function createTitlesInGoogleSheets() {
	//TODO:
}

async function askFromUserInsertTheFirstPerson() {
	//TODO:
}


async function start() {
	console.log("start");

	try{
		let data : Array =  await readData();
		if (!data){
			// empty table
			await createTitlesInGoogleSheets(); 
			await askFromUserInsertTheFirstPerson();
			data =  await readData();
		}
	} catch (err){
		console.log(err);
	}
	treeManager.loadFamilyTree(data);


	updateHeaderDetails("");
	paramsFromUrl = getParamsFromUrl();
	if (paramsFromUrl.db){
		//loadFamilyTree(data);
		//connectToSheetRemote(paramsFromUrl.db, paramsFromUrl.root);
	}else{
		//showWellcomeDialog();
	}
	
}



