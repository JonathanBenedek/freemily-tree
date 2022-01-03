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
var paramsFromUrl = {};
var isUserSignIn = false;
var nextSearchButton = document.getElementById('next_search');
nextSearchButton.onclick = presentNextSearch;
var hideSearchDialogButton = document.getElementById('button_hide_search_dialog');
hideSearchDialogButton.onclick = closeSearchDiaolog;
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
cancelButtonTextField.onclick = closeDialogFields;
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
function start() {
    return __awaiter(this, void 0, void 0, function () {
        var data;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("start");
                    return [4, readData()];
                case 1:
                    data = _a.sent();
                    loadFamilyTree(data);
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