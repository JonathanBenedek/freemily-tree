var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry/i.test(navigator.userAgent);
var treeManager = new FreemilyTree();
var paramsFromUrl = {};
var isUserSignIn = false;
var nextSearchButton = document.getElementById('next_search');
nextSearchButton.onclick = treeManager.presentNextSearch;
var hideSearchDialogButton = document.getElementById('button_hide_search_dialog');
hideSearchDialogButton.onclick = treeManager.closeSearchDiaolog;
var connectToCSVButton = document.getElementById("connect_csv_button");
connectToCSVButton.onclick = connectToCSV;
var chooseGoogleButton = document.getElementById("choose_google_button");
var chooseSvgButton = document.getElementById("choose_svg_button");
var goTOSearchButton = document.getElementById('go_to_search');
goTOSearchButton.onclick = showSearchDialog;
var confirmAuthRequestPopupButton = document.getElementById('confirm_auth_request_button');
confirmAuthRequestPopupButton.onclick = handleClickconfirmAuthRequestPopupButton;
var doSearchButton = document.getElementById('do_search');
doSearchButton.onclick = doSearch;
var newUserConnectButton = document.getElementById('new_user_connect_button');
newUserConnectButton.onclick = newUserConnectClicked;
var newUserButton = document.getElementById('new_user_button');
newUserButton.onclick = newUserClicked;
var cancelButtonTextField = document.getElementById("cancelPersonDetails");
cancelButtonTextField.onclick = treeManager.closeDialogFields;
var contentElement = document.getElementById('content');
var zoomInButton = document.getElementById('zoom_in_button');
zoomInButton.onclick = handleZoomInClicked;
var zoomOutButton = document.getElementById('zoom_out_button');
zoomOutButton.onclick = handleZoomOutClicked;
var zoomInValue = 1;
function handleZoomOutClicked() {
    var basicExample = document.getElementById('basic-example');
    zoomInValue = zoomInValue - 0.1;
    basicExample.style['transform'] = "scale(" + zoomInValue + ")";
}
function doSearch(isParamsFromUrl) {
    treeManager.whoNextToSearch = 0;
    var firstNameInput = "";
    var lastNameInput = "";
    if (isParamsFromUrl.isParamsFromUrl) {
        firstNameInput = paramsFromUrl.firstName;
        lastNameInput = paramsFromUrl.lastName;
    }
    else {
        firstNameInput = document.getElementById('firstName_search').value;
        lastNameInput = document.getElementById('lastName_search').value;
    }
    treeManager.idsAfterSearch = [];
    treeManager.idsAfterSearch = treeManager.getIdsByName(firstNameInput, lastNameInput);
    treeManager.presentNextSearch();
    treeManager.closeSearchDiaolog();
}
function randerDownTree(event) {
    var temp = chart_config.slice(0, 1);
    chart_config = temp;
    var event = { target: { id: "build_tree_children_button", who: event.target.value } };
    treeManager.buildTree(event);
    window.setTimeout(treeManager.scrollToCenter, 1000);
}
function addSpouse(event) {
    var person = event.target.person;
    var firstNameSpouse = document.getElementById('firstName_input').value;
    var lsatNameParentSpouse = document.getElementById('lastName_input').value;
    var commentsSpouse = document.getElementById('textFiledInputcomment').value;
    var idSpouse = treeManager.getNewId();
    treeManager.addSpouseToLocalDataBase(idSpouse, firstNameSpouse, lsatNameParentSpouse, person.id, commentsSpouse);
    var range = "";
    var bodyId = {
        values: [
            [idSpouse]
        ]
    };
    var bodyFirstName = {
        values: [
            [firstNameSpouse]
        ]
    };
    var bodyLastName = {
        values: [
            [lsatNameParentSpouse]
        ]
    };
    var bodySpouse = {
        values: [
            [idSpouse]
        ]
    };
    var bodyIdPerson = {
        values: [
            [person.id]
        ]
    };
    var rowRange = 1 + idSpouse;
    range = "A" + (rowRange);
    treeManager.editCell(bodyId, range);
    treeManager.addFirstNameToSheets(rowRange, bodyFirstName);
    treeManager.addLastNameToSheets(rowRange, bodyLastName);
    treeManager.addSpouseToSheets(rowRange, bodyIdPerson);
    treeManager.addCommentToSheets(rowRange, commentsSpouse);
    treeManager.addSpouseToSheets((parseInt(person.id) + 1), bodySpouse);
    var children = treeManager.getAllChildren(person.id);
    if (children) {
        children.forEach(function (child) {
            treeManager.addParentToChildLocalDataBase(idSpouse, null, null, child);
            var value = {
                values: [
                    [idSpouse]
                ]
            };
            treeManager.addParentToChildToSheet(child, value);
        });
    }
    var dialogFields = document.getElementById('dialogFields');
    treeManager.closeDialogFields();
    treeManager.syncTreeAfterInsertNewData(person, "down");
    var buttonSavePerson = document.getElementById("savePersonDetails");
    buttonSavePerson.removeEventListener("click", addSpouse);
}
function handleAddSpouse(event) {
    var person = event.target.person;
    var buttonSavePerson = document.getElementById("savePersonDetails");
    buttonSavePerson.addEventListener('click', addSpouse);
    buttonSavePerson.person = person;
    var dialogAdd = document.getElementById('dialogAdd');
    var dialogFields = document.getElementById('dialogFields');
    dialogAdd.close();
    dialogFields.showModal();
    var buttonAddSpouse = document.getElementById("button_add_spouse");
    buttonAddSpouse.removeEventListener("click", handleAddSpouse);
}
function handleAddParent(event) {
    var person = event.target.person;
    var buttonSavePerson = document.getElementById("savePersonDetails");
    buttonSavePerson.addEventListener('click', addParentToChild);
    buttonSavePerson.person = person;
    var dialogAdd = document.getElementById('dialogAdd');
    var dialogFields = document.getElementById('dialogFields');
    dialogAdd.close();
    dialogFields.showModal();
    var buttonAddParent = document.getElementById("button_add_parent");
    buttonAddParent.removeEventListener("click", handleAddParent);
}
function handleAddChild(event) {
    var person = event.target.person;
    var buttonSavePerson = document.getElementById("savePersonDetails");
    buttonSavePerson.addEventListener('click', addChildToParent);
    buttonSavePerson.person = person;
    var dialogAdd = document.getElementById('dialogAdd');
    var dialogFields = document.getElementById('dialogFields');
    dialogAdd.close();
    dialogFields.showModal();
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
    var body = {
        values: [
            ["dfvdsv"]
        ]
    };
}
function randerUpTree(event) {
    var temp = chart_config.slice(0, 1);
    chart_config = temp;
    var event = { target: { id: "build_tree_parents_button", who: event.target.value } };
    treeManager.buildTree(event);
    window.setTimeout(treeManager.scrollToCenter, 1000);
}
function handleZoomInClicked() {
    var basicExample = document.getElementById('basic-example');
    if (zoomInValue === 1 || zoomInValue >= 1) {
        return;
    }
    zoomInValue = zoomInValue + 0.1;
    basicExample.style['transform'] = "scale(" + zoomInValue + ")";
}
function setContentClass() {
    if (isMobile) {
        contentElement.classList.add("dragscroll");
    }
    else {
        contentElement.classList.add("dragscroll");
    }
}
function getParamsFromUrl() {
    var query = getQueryParams(document.location.search);
    return query;
}
function newUserClicked() {
    hideWellcomeDialog();
    showNewUserDialog();
}
function showNewUserDialog() {
    $("#new_user_dialog")[0].showModal();
}
function hideNewUserDialog() {
    $("#new_user_dialog")[0].close();
}
function newUserConnectClicked() {
    hideNewUserDialog();
    showWellcomeDialog();
    url = $("#urlSheet_newUser").val();
    listMajors(url);
}
function getQueryParams(qs) {
    qs = qs.split('+').join(' ');
    var params = {}, tokens, re = /[?&]?([^=]+)=([^&]*)/g;
    while (tokens = re.exec(qs)) {
        params[decodeURIComponent(tokens[1])] = decodeURIComponent(tokens[2]);
    }
    return params;
}
function addChildToParent(event) {
    var person = event.target.person;
    var firstNameChild = $("#firstName_input").val();
    var lsatNameChild = $("#lastName_input").val();
    var commentsChild = $("#textFiledInputcomment").val();
    var idChild = treeManager.getNewId();
    treeManager.addChildrenToLocalDataBase(idChild, firstNameChild, lsatNameChild, person.id, parseInt(person.spouse), commentsChild);
    var range = "";
    var bodyId = {
        values: [
            [idChild]
        ]
    };
    var bodyFirstName = {
        values: [
            [firstNameChild]
        ]
    };
    var bodyLastName = {
        values: [
            [lsatNameChild]
        ]
    };
    var bodyParent1 = {
        values: [
            [person.id]
        ]
    };
    var rowRange = 1 + idChild;
    range = "A" + (rowRange);
    treeManager.editCell(bodyId, range);
    treeManager.addFirstNameToSheets(rowRange, bodyFirstName);
    treeManager.addLastNameToSheets(rowRange, bodyLastName);
    treeManager.addParentToChildToSheet(idChild, bodyParent1, null, 1);
    treeManager.addCommentToSheets(rowRange, commentsChild);
    if (person.spouse) {
        var bodyParent2 = {
            values: [
                [treeManager.localDataBase[parseInt(person.spouse)].id]
            ]
        };
        treeManager.addParentToChildToSheet(idChild, bodyParent2);
    }
    var dialogFields = document.getElementById('dialogFields');
    treeManager.closeDialogFields();
    treeManager.syncTreeAfterInsertNewData(person, "down");
    var buttonSavePerson = document.getElementById("savePersonDetails");
    buttonSavePerson.removeEventListener("click", addChildToParent);
}
function addParentToChild(event) {
    var child = event.target.person;
    var firstNameParent = document.getElementById('firstName_input').value;
    var lsatNameParent = document.getElementById('lastName_input').value;
    var commentsParent = document.getElementById('textFiledInputcomment').value;
    var idParent = treeManager.getNewId();
    treeManager.addParentToChildLocalDataBase(idParent, firstNameParent, lsatNameParent, child.id, commentsParent);
    var range = "";
    var bodyId = {
        values: [
            [idParent]
        ]
    };
    var bodyFirstName = {
        values: [
            [firstNameParent]
        ]
    };
    var bodyLastName = {
        values: [
            [lsatNameParent]
        ]
    };
    var bodyComments = {
        values: [
            [commentsParent]
        ]
    };
    var rowRange = 1 + idParent;
    range = "A" + (rowRange);
    treeManager.editCell(bodyId, range);
    range = "B" + rowRange;
    treeManager.editCell(bodyFirstName, range);
    range = "C" + rowRange;
    treeManager.editCell(bodyLastName, range);
    treeManager.addCommentToSheets(rowRange, bodyComments);
    var value = {
        values: [
            [idParent]
        ]
    };
    treeManager.addParentToChildToSheet(child.id, value, function () {
        treeManager.connectSpouseRelationshipByChildLocalDatabase(child.id, idParent);
        treeManager.connectSpouseRelationshipByChildRemoteStorageSheets(child.id, idParent);
        var dialogFields = document.getElementById('dialogFields');
        treeManager.closeDialogFields();
        treeManager.syncTreeAfterInsertNewData(child);
    });
    var buttonSavePerson = document.getElementById("savePersonDetails");
    buttonSavePerson.removeEventListener("click", addParentToChild);
}
function ScrollZoom(container, max_scale, factor) {
    var target = container.children().first();
    var size = { w: target.width(), h: target.height() };
    var pos = { x: 0, y: 0 };
    var zoom_target = { x: 0, y: 0 };
    var zoom_point = { x: 0, y: 0 };
    var scale = 1;
    target.css('transform-origin', '0 0');
    target.on("mousewheel DOMMouseScroll", scrolled);
    function scrolled(e) {
        console.log("scrol-----------");
        var offset = container.offset();
        zoom_point.x = e.pageX - offset.left;
        zoom_point.y = e.pageY - offset.top;
        e.preventDefault();
        var delta = e.delta || e.originalEvent.wheelDelta;
        if (delta === undefined) {
            delta = e.originalEvent.detail;
        }
        delta = Math.max(-1, Math.min(1, delta));
        zoom_target.x = (zoom_point.x - pos.x) / scale;
        zoom_target.y = (zoom_point.y - pos.y) / scale;
        scale += delta * factor * scale;
        scale = Math.max(1, Math.min(max_scale, scale));
        pos.x = -zoom_target.x * scale + zoom_point.x;
        pos.y = -zoom_target.y * scale + zoom_point.y;
        if (pos.x > 0)
            pos.x = 0;
        if (pos.x + size.w * scale < size.w)
            pos.x = -size.w * (scale - 1);
        if (pos.y > 0)
            pos.y = 0;
        if (pos.y + size.h * scale < size.h)
            pos.y = -size.h * (scale - 1);
        update();
    }
    function update() {
        target.css('transform', 'translate(' + (pos.x) + 'px,' + (pos.y) + 'px) scale(' + scale + ',' + scale + ')');
    }
}
function handleClickconfirmAuthRequestPopupButton() {
    hideAuthDialog();
}
function showSearchDialog() {
    $("#search_dialog")[0].showModal();
}
function hideDbDialog() {
    $("#choose_db")[0].close();
}
function chooseDbDialogShow() {
    return new Promise(function (resolve, reject) {
        $("#choose_db")[0].showModal();
        chooseSvgButton.onclick = getFromUserCsv;
        chooseGoogleButton.onclick = getFromUserGoogleSheetId;
        function getFromUserCsv() {
            resolve("csv");
            hideDbDialog();
        }
        function getFromUserGoogleSheetId() {
            resolve("googleSheet");
            hideDbDialog();
        }
    });
}
function showAuthDialog() {
    $("#auth_dialog")[0].showModal();
}
function hideAuthDialog() {
    $("#auth_dialog")[0].close();
}
function showWellcomeDialog() {
    var wellcomeDialog = document.getElementById('wellcome_dialog');
    wellcomeDialog.showModal();
    return new Promise(function (resolve, reject) {
        function connectToSheetRemote(urlParam, rootToSearch) {
            var url = null;
            if (typeof urlParam === 'string') {
                url = urlParam;
            }
            else {
                url = $("#urlSheet").val();
            }
            resolve(url);
            hideWellcomeDialog();
            $("#urlSheet")[0] = "";
            if (rootToSearch) {
                doSearch({ isParamsFromUrl: true });
            }
        }
        var connectToUrlButton = document.getElementById("conect_button");
        connectToUrlButton.onclick = connectToSheetRemote;
    });
}
function hideWellcomeDialog() {
    $("#wellcome_dialog")[0].close();
}
function callbackLoadFamilyTreeSuccess() {
    if (paramsFromUrl.lastName || paramsFromUrl.firstName) {
        var isParamsFromUrl = { isParamsFromUrl: true };
        doSearch(isParamsFromUrl);
    }
}
function connectToCSV() {
}
function updateHeaderDetails(text) {
    $("#header_current_person_details")[0].append(text);
}
$(document).ready(function () {
    setContentClass();
});
function handleClientLoad() {
    return new Promise(function (resolve, reject) {
        gapi.load('client:auth2', function () {
            resolve();
        });
    });
}
function readData() {
    return __awaiter(this, void 0, void 0, function () {
        var dataArray, dbType;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    dataArray = [];
                    return [4, chooseDbDialogShow()];
                case 1:
                    dbType = _a.sent();
                    if (!(dbType === "csv")) return [3, 3];
                    return [4, getFromUserCsv()];
                case 2:
                    dataArray = _a.sent();
                    return [3, 6];
                case 3:
                    if (!(dbType === "googleSheet")) return [3, 5];
                    return [4, getFromUserGoogleSheetId()];
                case 4:
                    dataArray = _a.sent();
                    return [3, 6];
                case 5:
                    console.log("error: unknwon db type");
                    throw ("error: unknwon db type");
                case 6: return [2, dataArray];
            }
        });
    });
}
function showDialogLoadCSV() {
    return new Promise(function (resolve, reject) {
        $("#load_csv_file")[0].showModal();
        function handleUserChooseCSVFile() {
            var fileCSVInput = document.getElementById('fileCSVInput');
            var reader = new FileReader();
            reader.onload = function () {
                resolve(reader.result);
                $("#load_csv_file")[0].close();
            };
            reader.readAsBinaryString(fileCSVInput.files[0]);
        }
        var userChooseCSVFile = document.getElementById('userChooseCSVFile');
        userChooseCSVFile.onclick = handleUserChooseCSVFile;
    });
}
function getFromUserCsv(params) {
    return __awaiter(this, void 0, void 0, function () {
        var csvFile, dataArray;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, showDialogLoadCSV()];
                case 1:
                    csvFile = _a.sent();
                    dataArray = parseCsvToMultiArray(csvFile);
                    return [2, dataArray];
            }
        });
    });
}
function getFromUserGoogleSheetId(params) {
    return __awaiter(this, void 0, void 0, function () {
        var res, sheetIdInput, dataArray;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, handleClientLoad()];
                case 1:
                    _a.sent();
                    if (!!isUserSignIn) return [3, 3];
                    return [4, initClient()];
                case 2:
                    res = _a.sent();
                    if (!res) {
                        showAuthDialog();
                        authorizeButton.style.display = "visible";
                        return [2];
                    }
                    _a.label = 3;
                case 3: return [4, showWellcomeDialog()];
                case 4:
                    sheetIdInput = _a.sent();
                    return [4, readFromGoogleSheets(sheetIdInput)];
                case 5:
                    dataArray = _a.sent();
                    return [2, dataArray];
            }
        });
    });
}
function listMajorsApi4(sheetId) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2, new Promise(function (resolve, reject) {
                    gapi.client.sheets.spreadsheets.values.get({
                        spreadsheetId: sheetId,
                        range: 'A1:H'
                    }).then(function (response) {
                        treeManager.isUserHavePremission = true;
                        SHEET_ID = sheetId;
                        resolve(response.result.values);
                    }, function (err) {
                        console.log(err);
                        document.getElementById("error_sheetUrl").classList.remove("hidden");
                        document.getElementById("error_sheetUrl").classList.add("shown");
                        reject(err);
                        return;
                    })["catch"](function (err) {
                        console.log(err);
                        document.getElementById("error_sheetUrl").classList.remove("hidden");
                        document.getElementById("error_sheetUrl").classList.add("shown");
                        reject(err);
                        return;
                    });
                })];
        });
    });
}
function readFromGoogleSheets(sheetIdInput) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4, listMajorsApi4(sheetIdInput)];
                case 1: return [2, _a.sent()];
            }
        });
    });
}
function createTitlesInGoogleSheets() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2];
        });
    });
}
function askFromUserInsertTheFirstPerson() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2];
        });
    });
}
function start() {
    return __awaiter(this, void 0, void 0, function () {
        var data, err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("start");
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 7, , 8]);
                    return [4, readData()];
                case 2:
                    data = _a.sent();
                    if (!!data) return [3, 6];
                    return [4, createTitlesInGoogleSheets()];
                case 3:
                    _a.sent();
                    return [4, askFromUserInsertTheFirstPerson()];
                case 4:
                    _a.sent();
                    return [4, readData()];
                case 5:
                    data = _a.sent();
                    _a.label = 6;
                case 6: return [3, 8];
                case 7:
                    err_1 = _a.sent();
                    console.log(err_1);
                    return [3, 8];
                case 8:
                    treeManager.loadFamilyTree(data);
                    updateHeaderDetails("");
                    paramsFromUrl = getParamsFromUrl();
                    if (paramsFromUrl.db) {
                    }
                    else {
                    }
                    return [2];
            }
        });
    });
}
//# sourceMappingURL=controller.js.map