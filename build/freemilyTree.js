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
personsUpBottom = {};
persons = {};
localDataBase = {};
var isUserHavePremission = false;
function isLogIn() {
    try {
        return (isUserHavePremission && gapi.auth2.getAuthInstance().isSignedIn.get());
    }
    catch (err) {
        return false;
    }
}
function editCell(body, range, cb) {
    gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: range,
        valueInputOption: 'RAW',
        resource: body
    }).then(function (response) {
        var result = response.result;
        console.log(result.updatedCells + " cells updated.");
        if (cb) {
            cb();
        }
    })["catch"](function (err) {
        console.log(err);
        if (cb) {
            cb();
        }
    });
}
function getNewId() {
    return Object.keys(localDataBase).length + 1;
}
function getAllChildren(idParent) {
    if (personsUpBottom[parseInt(idParent)]) {
        return personsUpBottom[parseInt(idParent)].children;
    }
    return null;
}
function addParentToChildLocalDataBase(id, firstName, lastName, idChild, comments) {
    if (!localDataBase[id]) {
        var person = {};
        person["id"] = id.toString();
        person["firstName"] = firstName;
        person["lastName"] = lastName;
        if (comments) {
            person["comments"] = comments;
        }
        localDataBase[id] = person;
    }
    if (!localDataBase[idChild].parent1) {
        localDataBase[idChild].parent1 = id.toString();
    }
    else {
        if (!localDataBase[idChild].parent2) {
            localDataBase[idChild].parent2 = id.toString();
        }
        else {
            console.log("error to add parent to local data base, its seems that there is already 2 parents");
        }
    }
}
function getRangeForParentToChild(childId) {
    var child = localDataBase[childId];
    var res = "D";
    if (child.parent2) {
        res = "E";
    }
    res = res + (parseInt(childId) + 1).toString();
    return res;
}
function addSpouseToLocalDataBase(idSpouse, firstNameSpouse, lsatNameParentSpouse, idPerson, comments) {
    var person = {};
    person["id"] = idSpouse.toString();
    person["firstName"] = firstNameSpouse;
    person["lastName"] = lsatNameParentSpouse;
    person["spouse"] = idPerson;
    if (comments) {
        person["comments"] = comments;
    }
    localDataBase[idSpouse] = person;
    localDataBase[idPerson].spouse = idSpouse.toString();
}
function addChildrenToLocalDataBase(idChild, firstNameChild, lsatNameChild, idPerson, spouseId, comments) {
    var person = {};
    person["id"] = idChild.toString();
    person["firstName"] = firstNameChild;
    person["lastName"] = lsatNameChild;
    person["parent1"] = idPerson;
    if (comments) {
        person["comments"] = comments;
    }
    if (localDataBase[spouseId]) {
        person["parent2"] = spouseId.toString();
    }
    localDataBase[idChild] = person;
}
function addLastNameToSheets(rowRange, bodyFirstName, cb) {
    var range = "C" + rowRange;
    editCell(bodyFirstName, range, cb);
}
function addFirstNameToSheets(rowRange, bodyFirstName, cb) {
    var range = "B" + rowRange;
    editCell(bodyFirstName, range, cb);
}
function addParentToChildToSheet(childId, value, cb, parent) {
    if (cb === void 0) { cb = function () { }; }
    var range;
    if (1 === parent) {
        range = "D" + (parseInt(childId) + 1).toString();
    }
    else if (2 === parent) {
        range = "E" + (parseInt(childId) + 1).toString();
    }
    else {
        range = getRangeForParentToChild(childId);
    }
    editCell(value, range, cb);
}
function addSpouseToSheets(rowRange, bodyFirstName, cb) {
    var bodyrequest = ("object" == typeof bodyFirstName) ? bodyFirstName : {
        values: [
            [bodyFirstName]
        ]
    };
    var range = "F" + rowRange;
    editCell(bodyrequest, range, cb);
}
function addCommentToSheets(rowRange, bodyFirstName, cb) {
    var bodyrequest = ("object" == typeof bodyFirstName) ? bodyFirstName : {
        values: [
            [bodyFirstName]
        ]
    };
    var range = "H" + rowRange;
    editCell(bodyrequest, range, cb);
}
function syncTreeAfterInsertNewData(person, diraction) {
    var dir = "build_tree_parents_button";
    if ("down" === diraction) {
        dir = "build_tree_children_button";
    }
    var temp = chart_config.slice(0, 1);
    chart_config = temp;
    var event = { target: { id: dir, who: person.id } };
    persons = {};
    personsUpBottom = {};
    for (personId in localDataBase) {
        insertDataBottomUp(parseInt(personId));
        insertDataUpBottom(parseInt(personId));
    }
    buildTree(event);
}
function addChildToParent(event) {
    var person = event.target.person;
    var firstNameChild = $("#firstName_input").val();
    var lsatNameChild = $("#lastName_input").val();
    var commentsChild = $("#textFiledInputcomment").val();
    var idChild = getNewId();
    addChildrenToLocalDataBase(idChild, firstNameChild, lsatNameChild, person.id, parseInt(person.spouse), commentsChild);
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
    rowRange = 1 + idChild;
    range = "A" + (rowRange);
    editCell(bodyId, range);
    addFirstNameToSheets(rowRange, bodyFirstName);
    addLastNameToSheets(rowRange, bodyLastName);
    addParentToChildToSheet(idChild, bodyParent1, null, 1);
    addCommentToSheets(rowRange, commentsChild);
    if (person.spouse) {
        var bodyParent2 = {
            values: [
                [localDataBase[parseInt(person.spouse)].id]
            ]
        };
        addParentToChildToSheet(idChild, bodyParent2);
    }
    var dialogFields = document.getElementById('dialogFields');
    closeDialogFields();
    syncTreeAfterInsertNewData(person, "down");
    var buttonSavePerson = document.getElementById("savePersonDetails");
    buttonSavePerson.removeEventListener("click", addChildToParent);
}
function addSpouse(event) {
    var person = event.target.person;
    var firstNameSpouse = document.getElementById('firstName_input').value;
    var lsatNameParentSpouse = document.getElementById('lastName_input').value;
    var commentsSpouse = document.getElementById('textFiledInputcomment').value;
    var idSpouse = getNewId();
    addSpouseToLocalDataBase(idSpouse, firstNameSpouse, lsatNameParentSpouse, person.id, commentsSpouse);
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
    rowRange = 1 + idSpouse;
    range = "A" + (rowRange);
    editCell(bodyId, range);
    addFirstNameToSheets(rowRange, bodyFirstName);
    addLastNameToSheets(rowRange, bodyLastName);
    addSpouseToSheets(rowRange, bodyIdPerson);
    addCommentToSheets(rowRange, commentsSpouse);
    addSpouseToSheets((parseInt(person.id) + 1).toString(), bodySpouse, editCell(bodySpouse, range, function () {
    }));
    var children = getAllChildren(person.id);
    if (children) {
        children.forEach(function (child) {
            addParentToChildLocalDataBase(idSpouse, null, null, child);
            var value = {
                values: [
                    [idSpouse]
                ]
            };
            addParentToChildToSheet(child, value);
        });
    }
    var dialogFields = document.getElementById('dialogFields');
    closeDialogFields();
    syncTreeAfterInsertNewData(person, "down");
    var buttonSavePerson = document.getElementById("savePersonDetails");
    buttonSavePerson.removeEventListener("click", addSpouse);
}
function connectSpouseRelationshipByChildRemoteStorageSheets(chidId, spouseId) {
    parentId = (localDataBase[chidId].parent1 && localDataBase[chidId].parent1 != spouseId) ? (localDataBase[chidId].parent1) :
        ((localDataBase[chidId].parent2 && localDataBase[chidId].parent2 != spouseId) ? localDataBase[chidId].parent2 :
            null);
    if (parentId) {
        addSpouseToSheets((parseInt(parentId) + 1).toString(), spouseId);
        addSpouseToSheets((parseInt(spouseId) + 1).toString(), parentId);
    }
    else {
        return;
    }
}
function connectSpousesLocalDatabase(spouse1, spouse2) {
    localDataBase[spouse1].spouse = spouse2;
    localDataBase[spouse2].spouse = spouse1;
}
function connectSpouseRelationshipByChildLocalDatabase(chidId, spouseId) {
    parentId = (localDataBase[chidId].parent1 && localDataBase[chidId].parent1 != spouseId) ? (localDataBase[chidId].parent1) :
        ((localDataBase[chidId].parent2 && localDataBase[chidId].parent2 != spouseId) ? localDataBase[chidId].parent2 :
            null);
    if (parentId) {
        connectSpousesLocalDatabase(parentId, spouseId);
    }
    else {
        return;
    }
}
function addParentToChild(event) {
    var child = event.target.person;
    var firstNameParent = document.getElementById('firstName_input').value;
    var lsatNameParent = document.getElementById('lastName_input').value;
    var commentsParent = document.getElementById('textFiledInputcomment').value;
    var idParent = getNewId();
    addParentToChildLocalDataBase(idParent, firstNameParent, lsatNameParent, child.id, commentsParent);
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
    rowRange = 1 + idParent;
    range = "A" + (rowRange);
    editCell(bodyId, range);
    range = "B" + rowRange;
    editCell(bodyFirstName, range);
    range = "C" + rowRange;
    editCell(bodyLastName, range);
    addCommentToSheets(rowRange, bodyComments);
    var value = {
        values: [
            [idParent]
        ]
    };
    addParentToChildToSheet(child.id, value, function () {
        connectSpouseRelationshipByChildLocalDatabase(child.id, idParent);
        connectSpouseRelationshipByChildRemoteStorageSheets(child.id, idParent);
        var dialogFields = document.getElementById('dialogFields');
        closeDialogFields();
        syncTreeAfterInsertNewData(child);
    });
    var buttonSavePerson = document.getElementById("savePersonDetails");
    buttonSavePerson.removeEventListener("click", addParentToChild);
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
function closeDialogFields() {
    var dialogFields = document.getElementById('dialogFields');
    dialogFields.close();
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
function getRelevantButtons(event) {
    var res = [];
    var personId = event.target.value;
    var person = localDataBase[personId];
    var buttonAddParent = document.getElementById("button_add_parent");
    var buttonAddSpouse = document.getElementById("button_add_spouse");
    var buttonAddChild = document.getElementById("button_add_child");
    var buttonCancel = document.getElementById("button_cancel_add_person");
    buttonAddParent.hidden = true;
    buttonAddSpouse.hidden = true;
    buttonAddChild.addEventListener('click', handleAddChild);
    buttonAddChild.person = person;
    if ((undefined == person.parent1) || (undefined == person.parent2) ||
        ("" == person.parent1) || ("" == person.parent2)) {
        buttonAddParent.value = event.target.value;
        buttonAddParent.addEventListener('click', handleAddParent);
        buttonAddParent.person = person;
        buttonAddParent.hidden = false;
        res.push(buttonAddParent);
    }
    if ((undefined == person.spouse || "" == person.spouse || (!person.spouse))) {
        buttonAddSpouse.value = event.target.value;
        buttonAddSpouse.addEventListener('click', handleAddSpouse);
        buttonAddSpouse.person = person;
        buttonAddSpouse.hidden = false;
        res.push(buttonAddSpouse);
    }
    res.push(buttonCancel);
    return res;
}
function randerUpTree(event) {
    var temp = chart_config.slice(0, 1);
    chart_config = temp;
    var event = { target: { id: "build_tree_parents_button", who: event.target.value } };
    buildTree(event);
    window.setTimeout(scrollToCenter, 1000);
}
function scrollToCenter() {
    var currntId = "containerPerson_" + chart_config[1].button.id;
    document.getElementById(currntId).scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
}
function randerDownTree(event) {
    var temp = chart_config.slice(0, 1);
    chart_config = temp;
    var event = { target: { id: "build_tree_children_button", who: event.target.value } };
    buildTree(event);
    window.setTimeout(scrollToCenter, 1000);
}
function saveCommentsToSheet() {
    var commentsField = document.getElementById("commentsField");
    var commeent = commentsField.value;
}
function handleButtonEditClick(event) {
    var dialog = document.getElementById('dialogAdd');
    var buttonSavePerson = document.getElementById("savePersonDetails");
    buttonSavePerson.addEventListener('click', saveCommentsToSheet);
    var containerButtonsAddDialog = document.getElementById("containerButtonsAddDialog");
    var buttons = getRelevantButtons(event);
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
var handleButtonsMaping = {
    addButton: handleButtonEditClick,
    showUpTree: { onClick: randerUpTree, label: ".\\resources\\icons\\up.svg" },
    showDownTree: { onClick: randerDownTree, label: ".\\resources\\icons\\down.svg" }
};
function getSpouseIdById(id) {
    var spouse = (localDataBase[id].spouse) ? localDataBase[id].spouse : null;
    return spouse;
}
function getCommentsById(id) {
    try {
        return (localDataBase[id].comments) ? localDataBase[id].comments : null;
    }
    catch (err) {
        console.log("err in getcommentBy id with param : id= " + id + "error: " + err);
    }
}
function getFirstName(id) {
    try {
        return localDataBase[parseInt(id)]["firstName"];
    }
    catch (err) {
        console.log("error in get first name funtion with params=" + id + ".  err=" + err);
    }
}
function getLastName(id) {
    try {
        return localDataBase[parseInt(id)].lastName;
    }
    catch (err) {
        console.log("error in get last name funtion with params=" + id + ".  err=" + err);
    }
}
function getFullNameById(id) {
    return getFirstName(id) + " " + getLastName(id);
}
function getParentsById(id) {
    var arr = [];
    arr.push(localDataBase[parseInt(id)].parent1);
    arr.push(localDataBase[parseInt(id)].parent2);
    return arr;
}
function insertParentsRec(personId, graphPerson) {
    var parents = getParentsById(personId);
    if (parents[0] != null && "" !== parents[0]) {
        if (true) {
            var temp1 = { text: { name: getFullNameById(parents[0]) }, parent: graphPerson, button: { id: parents[0], label: "+", onClick: handleButtonsMaping } };
        }
        else {
            var temp1 = { text: { name: getFullNameById(parents[0]) }, parent: graphPerson };
        }
        var title1 = getCommentsById(parents[0]);
        (title1) ? temp1.text["title"] = title1 : null;
        chart_config.push(temp1);
        insertParentsRec(parents[0], temp1);
    }
    if (parents[1] != null && "" !== parents[1]) {
        if (true) {
            var temp2 = { text: { name: getFullNameById(parents[1]) }, parent: graphPerson, button: { id: parents[1], label: "+", onClick: handleButtonsMaping } };
        }
        else {
            var temp2 = { text: { name: getFullNameById(parents[1]) }, parent: graphPerson };
        }
        var title2 = getCommentsById(parents[1]);
        (title2) ? temp2.text["title"] = title2 : null;
        chart_config.push(temp2);
        insertParentsRec(parents[1], temp2);
    }
}
function insertChildernRec(parentID, grapObject) {
    if (personsUpBottom[parentID]) {
        if (personsUpBottom[parentID].children) {
            for (var i = 0 in personsUpBottom[parentID].children) {
                var childId = personsUpBottom[parentID].children[i];
                if (true) {
                    var child = { text: { name: getFullNameById(childId) }, parent: grapObject, button: { id: childId, label: "+", onClick: handleButtonsMaping } };
                }
                else {
                    var child = { text: { name: getFullNameById(childId) }, parent: grapObject };
                }
                var title = getCommentsById(childId);
                (title) ? child.text["title"] = title : null;
                var spouseId = getSpouseIdById(childId);
                var spouse = (spouseId) ? { text: { name: getFullNameById(spouseId), button: { id: spouseId, label: "+", onClick: handleButtonsMaping }, comments: getCommentsById(spouseId) } } : null;
                if (spouse) {
                    child.spouse = spouse;
                }
                chart_config.push(child);
                insertChildernRec(personsUpBottom[parentID].children[i], child);
            }
        }
    }
}
function makeTreeBottomUp(personId) {
    var root = { text: { name: getFullNameById(personId) }, button: { id: personId, label: "+", onClick: handleButtonsMaping } };
    (getCommentsById(personId)) ? root["title"] = (getCommentsById(personId)) : null;
    chart_config.push(root);
    chart_config[0].rootOrientation = "SOUTH";
    insertParentsRec(personId, root);
    return chart_config;
}
function makeTreeUpBottom(personId) {
    if (true) {
        var root = { text: { name: getFullNameById(personId) }, button: { id: personId, label: "+", onClick: handleButtonsMaping } };
    }
    else {
        var root = { text: { name: getFullNameById(personId) } };
    }
    var title = getCommentsById(personId);
    (title) ? root.text["title"] = title : null;
    var spouseId = getSpouseIdById(personId);
    var spouse;
    if (true) {
        spouse = (spouseId) ? { text: { name: getFullNameById(spouseId), comments: getCommentsById(spouseId) }, button: { id: spouseId, label: "+", onClick: handleButtonsMaping } } : null;
    }
    else {
        spouse = (spouseId) ? { text: { name: getFullNameById(spouseId), comments: getCommentsById(spouseId) } } : null;
    }
    if (spouse) {
        root.spouse = spouse;
    }
    chart_config.push(root);
    chart_config[0].rootOrientation = "NORTH";
    insertChildernRec(personId, root);
    return chart_config;
}
function handleParent(idParent1, perosnId) {
    if (!personsUpBottom[idParent1]) {
        var person = { "name": getFullNameById(idParent1), "children": [], "id": idParent1 };
        person.children.push(personId);
        personsUpBottom[idParent1] = person;
    }
    else {
        personsUpBottom[idParent1].children.push(perosnId);
    }
    if (localDataBase[idParent1].spouse) {
        personsUpBottom[idParent1].spouse = localDataBase[idParent1].spouse;
    }
}
function insertDataUpBottom(perosnId) {
    var idParent1 = localDataBase[perosnId].parent1;
    var idParent2 = localDataBase[perosnId].parent2;
    ("" !== idParent1 && idParent1) ? handleParent(idParent1, perosnId) : null;
    ("" !== idParent2 && idParent2) ? handleParent(idParent2, perosnId) : null;
}
function connect(chart_config) {
    var i = 1;
    for (i; i < chart_config.length; i++) {
        if (children = chart_config[i].children) {
            for (child in children) {
                var child = children[child];
                var id = child.text.id;
                var elemChild = document.getElementById('containerPerson_' + id);
                if (elemChild && elemChild.parentElement) {
                    var elemParent = elemChild.parentElement;
                    elemParent.id = "tempId_" + id;
                }
            }
        }
    }
}
function updateHeaderDetailsById(id) {
    if (id) {
        updateHeaderDetails(localDataBase[id].firstName);
    }
}
function buildTree(event) {
    var pre = document.getElementById("content");
    $("#content").empty();
    var container = document.createElement("div");
    container.id = "basic-example";
    container.classList.add("chart");
    pre.appendChild(container);
    var chart_config;
    updateHeaderDetailsById(event.target.who);
    if ("build_tree_children_button" === event.target.id) {
        chart_config = startMakeTreeUpBottom(event.target);
    }
    else if ("build_tree_parents_button" === event.target.id) {
        chart_config = startMakeTreeBottomUp(event.target);
    }
    else {
        console.log("err");
    }
    new Treant(chart_config);
    connect(chart_config);
}
var idsAfterSearch = [];
var whoNextToSearch = 0;
function closeSearchDiaolog() {
    $("#search_dialog")[0].close();
    document.getElementById('firstName_search').value = "";
    document.getElementById('lastName_search').value = "";
}
function doSearch(isParamsFromUrl) {
    whoNextToSearch = 0;
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
    idsAfterSearch = [];
    idsAfterSearch = getIdsByName(firstNameInput, lastNameInput);
    presentNextSearch();
    closeSearchDiaolog();
}
function presentNextSearch() {
    var currentIndexForSearch = whoNextToSearch % idsAfterSearch.length;
    var event = { target: { value: idsAfterSearch[currentIndexForSearch] } };
    randerDownTree(event);
    whoNextToSearch = currentIndexForSearch + 1;
}
function doSearchFirstName(name) {
    var ids = [];
    for (index in localDataBase) {
        if (localDataBase[index].firstName.toLowerCase() == name.toLowerCase()) {
            ids.push(localDataBase[index].id);
        }
    }
    return ids;
}
function doSearchLastName(name) {
    var ids = [];
    for (index in localDataBase) {
        if (localDataBase[index].lastName.toLowerCase() == name.toLowerCase()) {
            ids.push(localDataBase[index].id);
        }
    }
    return ids;
}
function getIdsByName(firstNameInput, lastNameInput) {
    var res = [];
    var idsByFirstNames = [];
    var idsByLastNames = [];
    if (firstNameInput && firstNameInput !== "") {
        idsByFirstNames = doSearchFirstName(firstNameInput);
    }
    if (lastNameInput && lastNameInput !== "") {
        var idsByLastNames = doSearchLastName(lastNameInput);
    }
    for (var id in idsByFirstNames) {
        if (-1 != idsByLastNames.indexOf(idsByFirstNames[id])) {
            res.push(idsByFirstNames[id]);
        }
    }
    if (0 == res.length) {
        res = idsByFirstNames.concat(idsByLastNames);
    }
    return res;
}
function startMakeTreeUpBottom(target) {
    console.log("start");
    var idInput = (target.who) ? { value: target.who } : document.getElementById('id_input');
    var id = idInput.value;
    var temp = chart_config.slice(0, 1);
    chart_config = temp;
    return makeTreeUpBottom(id);
}
function startMakeTreeBottomUp(target) {
    console.log("start");
    var idInput = (target.who) ? { value: target.who } : document.getElementById('id_input');
    var id = idInput.value;
    var temp = chart_config.slice(0, 1);
    chart_config = temp;
    return makeTreeBottomUp(id);
}
function insertDataBottomUp(perosnId) {
    var name = localDataBase[perosnId].firstName + localDataBase[perosnId].lastName;
    var parent1 = parseInt(localDataBase[perosnId].parent1);
    var parent2 = parseInt(localDataBase[perosnId].parent2);
    var person = {};
    if (perosnId) {
        var person = { "name": name };
        if (parent1) {
            person.parent1 = parent1;
        }
        if (parent2) {
            person.parent2 = parent2;
        }
        persons[perosnId] = person;
    }
}
function insertNewRowToLocalDataBase(row) {
    if ("id" == row[0]) {
        return;
    }
    var person = {};
    var id = row[0];
    var firstName = row[1];
    var lastName = row[2];
    var parent1 = row[3];
    var parent2 = row[4];
    var spouse = row[5];
    var comments = "";
    if (row[7]) {
        comments = comments + " " + row[7];
    }
    localDataBase[id] = {
        "id": id,
        "firstName": firstName,
        "lastName": lastName,
        "parent1": parent1,
        "parent2": parent2,
        "spouse": spouse,
        "comments": comments
    };
}
function listMajors(sheetIdInput) {
    var sheetId = sheetIdInput;
    if (!sheetId) {
        document.getElementById("error_sheetUrl").classList.remove("hidden");
        document.getElementById("error_sheetUrl").classList.add("shown");
        return;
    }
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: sheetId,
        range: 'A1:H'
    }).then(function (response) {
        isUserHavePremission = true;
        SHEET_ID = sheetId;
        parseDataSheetsToMultiArray(data.feed.entry);
        loadFamilyTree(sheetIdInput);
        hideWellcomeDialog();
    }, function (err) {
        console.log(err);
        document.getElementById("error_sheetUrl").classList.remove("hidden");
        document.getElementById("error_sheetUrl").classList.add("shown");
        return;
    })["catch"](function (err) {
        console.log(err);
        document.getElementById("error_sheetUrl").classList.remove("hidden");
        document.getElementById("error_sheetUrl").classList.add("shown");
        return;
    });
}
function parseDataSheetsToMultiArray(data) {
    var res = [];
    var index = 8;
    var lastNumberLine = data[index].gs$cell.row;
    var tempLineData = ["", "", "", "", "", "", "", ""];
    for (index; index < data.length; index++) {
        var numberLine = data[index].gs$cell.row;
        var columnLine = data[index].gs$cell.col;
        if (parseInt(lastNumberLine) < parseInt(numberLine)) {
            res.push(tempLineData);
            tempLineData = ["", "", "", "", "", "", "", ""];
            lastNumberLine = numberLine;
        }
        var c = parseInt(columnLine) - 1;
        tempLineData[c] = data[index].gs$cell.$t;
    }
    res.push(tempLineData);
    return res;
}
function parseCsvToMultiArray(csv) {
    var res = [];
    var index = 0;
    var data = csv.split("\n");
    for (index; index < data.length; index++) {
        res.push(data[index].split(","));
    }
    return res;
}
function readCsv(path) {
    return new Promise(function (resolve, reject) {
        $.ajax({
            type: "GET",
            url: path,
            dataType: "text",
            success: function (response) {
                var dataArray = parseCsvToMultiArray(response);
                resolve(dataArray);
            }
        });
    });
}
function listMajorsApi4(sheetId) {
    return new Promise(function (resolve, reject) {
        gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: sheetId,
            range: 'A1:H'
        }).then(function (response) {
            isUserHavePremission = true;
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
function loadFamilyTree(dataArray) {
    return __awaiter(this, void 0, void 0, function () {
        var i;
        return __generator(this, function (_a) {
            if (dataArray) {
                for (i = 0; i < dataArray.length; i++) {
                    insertNewRowToLocalDataBase(dataArray[i]);
                }
                for (personId in localDataBase) {
                    insertDataBottomUp(parseInt(personId));
                    insertDataUpBottom(parseInt(personId));
                }
            }
            else {
            }
            callbackLoadFamilyTreeSuccess();
            hideWellcomeDialog();
            return [2];
        });
    });
}
//# sourceMappingURL=freemilyTree.js.map