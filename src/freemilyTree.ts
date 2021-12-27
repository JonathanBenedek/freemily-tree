// @ts-nocheck

personsUpBottom = {};
persons = {};
localDataBase = {};
//TODO: change diraction in tree bottom up . the childern should be  
//TODO: add spouse in tree bottom up
//TODO: is log in should consider if the the user have access to the sheet. then maybe change the function name
//TODO: make sure that the user understand which spouse is the  real children

let isUserHavePremission = false;

function isLogIn() {
    try {
        return (isUserHavePremission && gapi.auth2.getAuthInstance().isSignedIn.get());
    } catch (err) {
        return false;
    }
}

function editCell(body, range, cb) {
    gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: range,
        valueInputOption: 'RAW',
        resource: body
    }).then((response) => {
        var result = response.result;
        console.log(`${result.updatedCells} cells updated.`);
        if (cb) { cb(); }
    }).catch((err) => {
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
    } else {
        if (!localDataBase[idChild].parent2) {
            localDataBase[idChild].parent2 = id.toString();
        } else {
            console.log("error to add parent to local data base, its seems that there is already 2 parents");
        }
    }
}

function getRangeForParentToChild(childId) {
    var child = localDataBase[childId];
    var res = "D"
    if (child.parent2) {
        res = "E"
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
    const range = "C" + rowRange;
    editCell(bodyFirstName, range, cb);
}


function addFirstNameToSheets(rowRange, bodyFirstName, cb) {
    const range = "B" + rowRange;
    editCell(bodyFirstName, range, cb);
}

function addParentToChildToSheet(childId, value, cb = () => {}, parent) {
    let range;
    if (1 === parent) {
        //res = res + (parseInt(childId) + 1).toString();
        range = "D" + (parseInt(childId) + 1).toString();
    } else if (2 === parent) {
        range = "E" + (parseInt(childId) + 1).toString();
    } else {
        range = getRangeForParentToChild(childId);
    }
    editCell(value, range, cb);
}

function addSpouseToSheets(rowRange, bodyFirstName, cb) {

    const bodyrequest = ("object" == typeof bodyFirstName) ? bodyFirstName : {
        values: [
            [bodyFirstName]
        ]
    };
    const range = "F" + rowRange;
    editCell(bodyrequest, range, cb);
}

function addCommentToSheets(rowRange, bodyFirstName, cb) {

    const bodyrequest = ("object" == typeof bodyFirstName) ? bodyFirstName : {
        values: [
            [bodyFirstName]
        ]
    };
    const range = "H" + rowRange;
    editCell(bodyrequest, range, cb);
}

function syncTreeAfterInsertNewData(person, diraction) {
    var dir = "build_tree_parents_button";
    if ("down" === diraction) {
        dir = "build_tree_children_button"
    }
    var temp = chart_config.slice(0, 1);
    chart_config = temp;
    var event = { target: { id: dir, who: person.id } }
    persons = {};
    personsUpBottom = {};
    for (personId in localDataBase) {
        insertDataBottomUp(parseInt(personId));
        insertDataUpBottom(parseInt(personId));
    }
    buildTree(event);
}

function addChildToParent(event) {
    const person = event.target.person;
    var firstNameChild = $("#firstName_input").val();
    var lsatNameChild = $("#lastName_input").val();
    var commentsChild = $("#textFiledInputcomment").val();
    var idChild = getNewId();
    addChildrenToLocalDataBase(idChild, firstNameChild, lsatNameChild, person.id, parseInt(person.spouse), commentsChild);
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
    rowRange = 1 + idChild;
    range = "A" + (rowRange);
    editCell(bodyId, range);

    addFirstNameToSheets(rowRange, bodyFirstName);
    addLastNameToSheets(rowRange, bodyLastName);
    addParentToChildToSheet(idChild, bodyParent1, null, 1);
    addCommentToSheets(rowRange, commentsChild)

    if (person.spouse) {

        var bodyParent2 = {
            values: [
                [localDataBase[parseInt(person.spouse)].id]
            ]
        }
        addParentToChildToSheet(idChild, bodyParent2);
    }
    //
    var dialogFields = document.getElementById('dialogFields');
    closeDialogFields();
    syncTreeAfterInsertNewData(person, "down");

    var buttonSavePerson = document.getElementById("savePersonDetails");
    buttonSavePerson.removeEventListener("click", addChildToParent);

}


//TODO: make one pice code of add spuse add perosn add child add.. 
function addSpouse(event) {
    const person = event.target.person;
    var firstNameSpouse = document.getElementById('firstName_input').value;
    var lsatNameParentSpouse = document.getElementById('lastName_input').value;
    var commentsSpouse = document.getElementById('textFiledInputcomment').value;
    var idSpouse = getNewId();
    addSpouseToLocalDataBase(idSpouse, firstNameSpouse, lsatNameParentSpouse, person.id, commentsSpouse);
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
    rowRange = 1 + idSpouse;
    range = "A" + (rowRange);
    editCell(bodyId, range);
    // First Name
    addFirstNameToSheets(rowRange, bodyFirstName);
    // Last Name
    addLastNameToSheets(rowRange, bodyLastName)
        // Spouse
    addSpouseToSheets(rowRange, bodyIdPerson)
        //comment
    addCommentToSheets(rowRange, commentsSpouse);

    // ** add to spouse the new preson
    addSpouseToSheets((parseInt(person.id) + 1).toString(), bodySpouse, editCell(bodySpouse, range, () => {
            //location.reload();
        }))
        // ** ADD the all children of person to the new spouse **
    var children = getAllChildren(person.id);
    if (children) {
        children.forEach(child => {
            addParentToChildLocalDataBase(idSpouse, null, null, child);
            var value = {
                values: [
                    [idSpouse]
                ],
            }
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
    } else {
        return;
    }
}

function connectSpousesLocalDatabase(spouse1, spouse2) {
    localDataBase[spouse1].spouse = spouse2;
    localDataBase[spouse2].spouse = spouse1;
}

function connectSpouseRelationshipByChildLocalDatabase(chidId, spouseId) {
    //check if exit already parent if exist connect to spouseId
    parentId = (localDataBase[chidId].parent1 && localDataBase[chidId].parent1 != spouseId) ? (localDataBase[chidId].parent1) :
        ((localDataBase[chidId].parent2 && localDataBase[chidId].parent2 != spouseId) ? localDataBase[chidId].parent2 :
            null);
    if (parentId) {
        connectSpousesLocalDatabase(parentId, spouseId);
    } else {

        return;
    }
}

function addParentToChild(event) {
    const child = event.target.person;
    var firstNameParent = document.getElementById('firstName_input').value;
    var lsatNameParent = document.getElementById('lastName_input').value;
    var commentsParent = document.getElementById('textFiledInputcomment').value;
    var idParent = getNewId();
    addParentToChildLocalDataBase(idParent, firstNameParent, lsatNameParent, child.id, commentsParent);
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
    rowRange = 1 + idParent;
    range = "A" + (rowRange);
    editCell(bodyId, range);
    // First Name
    range = "B" + rowRange;
    editCell(bodyFirstName, range);
    // Last Name
    range = "C" + rowRange;
    editCell(bodyLastName, range);
    //comment
    addCommentToSheets(rowRange, bodyComments);

    // ** ADD PARENT TO CHILD **
    var value = {
        values: [
            [idParent]
        ],
    }

    addParentToChildToSheet(child.id, value, () => {
        //location.reload();
        connectSpouseRelationshipByChildLocalDatabase(child.id, idParent);
        connectSpouseRelationshipByChildRemoteStorageSheets(child.id, idParent);
        var dialogFields = document.getElementById('dialogFields');
        closeDialogFields();
        syncTreeAfterInsertNewData(child);
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

function handleAddSpouse(event) {
    const person = event.target.person;
    var buttonSavePerson = document.getElementById("savePersonDetails");
    buttonSavePerson.addEventListener('click', addSpouse);
    buttonSavePerson.person = person;
    //addSpouse(person);
    var dialogAdd = document.getElementById('dialogAdd');
    var dialogFields = document.getElementById('dialogFields');
    dialogAdd.close();
    dialogFields.showModal();
    //buttonAddSpouse.removeEventListener("click");
    var buttonAddSpouse = document.getElementById("button_add_spouse");
    buttonAddSpouse.removeEventListener("click", handleAddSpouse);
}

function handleAddParent(event) {
    const person = event.target.person;
    var buttonSavePerson = document.getElementById("savePersonDetails");
    buttonSavePerson.addEventListener('click', addParentToChild);
    buttonSavePerson.person = person;
    //addParentToChild(person);
    var dialogAdd = document.getElementById('dialogAdd');
    var dialogFields = document.getElementById('dialogFields');
    dialogAdd.close();
    dialogFields.showModal();
    //buttonAddParent.removeEventListener("click");
    var buttonAddParent = document.getElementById("button_add_parent");
    buttonAddParent.removeEventListener("click", handleAddParent);
}


function closeDialogFields() {
    var dialogFields = document.getElementById('dialogFields');
    dialogFields.close();
}

function handleAddChild(event) {
    const person = event.target.person;
    var buttonSavePerson = document.getElementById("savePersonDetails");
    buttonSavePerson.addEventListener('click', addChildToParent);
    buttonSavePerson.person = person;
    //addChildToParent(person);
    var dialogAdd = document.getElementById('dialogAdd');
    var dialogFields = document.getElementById('dialogFields');
    dialogAdd.close();
    dialogFields.showModal();
    //buttonAddChild.removeEventListener("click");
    var buttonAddChild = document.getElementById("button_add_child");
    buttonAddChild.removeEventListener("click", handleAddChild);
}

function getRelevantButtons(event) {
    //TODO: understand which buttons should have and return array with buttons element
    //The buttons returns wih eventlistener 
    var res = [];
    var personId = event.target.value;
    var person = localDataBase[personId];
    var buttonAddParent = document.getElementById("button_add_parent");
    var buttonAddSpouse = document.getElementById("button_add_spouse");
    var buttonAddChild = document.getElementById("button_add_child");
    var buttonCancel = document.getElementById("button_cancel_add_person");
    //buttonCancel.hidden = true //beacuse we want cancel button be the last one
    buttonAddParent.hidden = true;
    buttonAddSpouse.hidden = true;
    //always we can add children therefor buttonAddChild.hidden = true;
    buttonAddChild.addEventListener('click', handleAddChild);
    buttonAddChild.person = person;
    if ((undefined == person.parent1) || (undefined == person.parent2) ||
        ("" == person.parent1) || ("" == person.parent2)) {
        //Add Parent is evalble
        //Now Need to create button - Add Parent

        buttonAddParent.value = event.target.value;
        buttonAddParent.addEventListener('click', handleAddParent)
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
    //location.reload();
    var temp = chart_config.slice(0, 1);
    chart_config = temp;
    var event = { target: { id: "build_tree_parents_button", who: event.target.value } }
    buildTree(event);
    window.setTimeout(scrollToCenter, 1000)
}

function scrollToCenter() {
    //scrollElement.scrollTo(screen.width / 2, screen.height / 2);
    var currntId = "containerPerson_" + chart_config[1].button.id
    document.getElementById(currntId).scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    //  scrollElement.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" })

}

function randerDownTree(event) {
    //location.reload();
    var temp = chart_config.slice(0, 1);
    chart_config = temp;
    var event = { target: { id: "build_tree_children_button", who: event.target.value } }
    buildTree(event);
    //var temp = chart_config.slice(0, 1);
    //chart_config = temp;
    //makeTreeUpBottom(event.target.value)
    window.setTimeout(scrollToCenter, 1000)
        //scrollToCenter();

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

var handleButtonsMaping = {
    addButton: handleButtonEditClick,
    showUpTree: { onClick: randerUpTree, label: ".\\resources\\icons\\up.svg" },
    showDownTree: { onClick: randerDownTree, label: ".\\resources\\icons\\down.svg" },
}


function getSpouseIdById(id) {
    const spouse = (localDataBase[id].spouse) ? localDataBase[id].spouse : null;
    return spouse;
}

function getCommentsById(id) {
    try {
        return (localDataBase[id].comments) ? localDataBase[id].comments : null;
    } catch (err) {
        console.log("err in getcommentBy id with param : id= " + id + "error: " + err);
    }
}

function getFirstName(id) {
    try {
        return localDataBase[parseInt(id)]["firstName"];
    } catch (err) {
        console.log("error in get first name funtion with params=" + id + ".  err=" + err);
    }
}

function getLastName(id) {
    try {
        return localDataBase[parseInt(id)].lastName;

    } catch (err) {
        console.log("error in get last name funtion with params=" + id + ".  err=" + err);
    }
}

function getFullNameById(id) {
    return getFirstName(id) + " " + getLastName(id);
}

function getParentsById(id) {
    let arr = [];
    arr.push(localDataBase[parseInt(id)].parent1);
    arr.push(localDataBase[parseInt(id)].parent2);
    return arr;
}

function insertParentsRec(personId, graphPerson) {
    const parents = getParentsById(personId);
    if (parents[0] != null && "" !== parents[0]) {
        if (true) {
            var temp1 = { text: { name: getFullNameById(parents[0]) }, parent: graphPerson, button: { id: parents[0], label: "+", onClick: handleButtonsMaping } };
        } else {
            var temp1 = { text: { name: getFullNameById(parents[0]) }, parent: graphPerson };

        }
        const title1 = getCommentsById(parents[0]);
        (title1) ? temp1.text["title"] = title1: null;
        //temp1.text["id"] = parents[0];
        chart_config.push(temp1);
        insertParentsRec(parents[0], temp1);
    }
    if (parents[1] != null && "" !== parents[1]) {
        if (true) {
            var temp2 = { text: { name: getFullNameById(parents[1]) }, parent: graphPerson, button: { id: parents[1], label: "+", onClick: handleButtonsMaping } }
        } else {
            var temp2 = { text: { name: getFullNameById(parents[1]) }, parent: graphPerson }

        }
        const title2 = getCommentsById(parents[1]);
        //temp2.text["id"] = parents[1];
        (title2) ? temp2.text["title"] = title2: null;
        chart_config.push(temp2);
        insertParentsRec(parents[1], temp2);
    }
    //insertParentsRec(person.parent1);
    //insertParentsRec(person.parent2);
    //chart_config.push(cto);


}

function insertChildernRec(parentID, grapObject) {
    if (personsUpBottom[parentID]) {
        if (personsUpBottom[parentID].children) {
            for (var i = 0 in personsUpBottom[parentID].children) {
                var childId = personsUpBottom[parentID].children[i]
                if (true) {
                    var child = { text: { name: getFullNameById(childId) }, parent: grapObject, button: { id: childId, label: "+", onClick: handleButtonsMaping } };
                } else {
                    var child = { text: { name: getFullNameById(childId) }, parent: grapObject };

                }
                const title = getCommentsById(childId);
                (title) ? child.text["title"] = title: null;
                const spouseId = getSpouseIdById(childId);
                const spouse = (spouseId) ? { text: { name: getFullNameById(spouseId), button: { id: spouseId, label: "+", onClick: handleButtonsMaping }, comments: getCommentsById(spouseId) } } : null;
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
    // debugger;
    var root = { text: { name: getFullNameById(personId) }, button: { id: personId, label: "+", onClick: handleButtonsMaping } };
    (getCommentsById(personId)) ? root["title"] = (getCommentsById(personId)): null;
    //root["id"] = personId;
    chart_config.push(root);
    chart_config[0].rootOrientation = "SOUTH";
    insertParentsRec(personId, root);
    return chart_config;
}

function makeTreeUpBottom(personId) {
    // debugger;
    if (true) {
        var root = { text: { name: getFullNameById(personId) }, button: { id: personId, label: "+", onClick: handleButtonsMaping } };
    } else {
        var root = { text: { name: getFullNameById(personId) } };
    }
    const title = getCommentsById(personId);
    (title) ? root.text["title"] = title: null;
    //root.text["id"] = personId;
    const spouseId = getSpouseIdById(personId);
    let spouse;
    if (true) {
        spouse = (spouseId) ? { text: { name: getFullNameById(spouseId), comments: getCommentsById(spouseId) }, button: { id: spouseId, label: "+", onClick: handleButtonsMaping } } : null;
    } else {
        spouse = (spouseId) ? { text: { name: getFullNameById(spouseId), comments: getCommentsById(spouseId) } } : null;
    }
    if (spouse) {
        //spouse.text["id"] = spouseId;
        root.spouse = spouse;
    }
    chart_config.push(root);
    chart_config[0].rootOrientation = "NORTH";
    insertChildernRec(personId, root);
    return chart_config;
}


function handleParent(idParent1, perosnId) {
    //personsUpBottom= {};
    if (!personsUpBottom[idParent1]) {
        var person = { "name": getFullNameById(idParent1), "children": [], "id": idParent1 };
        person.children.push(personId);
        //personsUpBottom.parentName = person;
        personsUpBottom[idParent1] = person; //children.push(childName);

    } else {
        personsUpBottom[idParent1].children.push(perosnId);
    }
    //debugger;
    if (localDataBase[idParent1].spouse) {
        personsUpBottom[idParent1].spouse = localDataBase[idParent1].spouse;
    }
}

function insertDataUpBottom(perosnId) {
    // debugger;
    var idParent1 = localDataBase[perosnId].parent1;
    var idParent2 = localDataBase[perosnId].parent2;
    //var nameChild = localDataBase[perosnId].name;
    ("" !== idParent1 && idParent1) ? handleParent(idParent1, perosnId): null;
    ("" !== idParent2 && idParent2) ? handleParent(idParent2, perosnId): null;
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
    container.classList.add("chart")
    pre.appendChild(container);
    var chart_config;
    updateHeaderDetailsById(event.target.who);
    if ("build_tree_children_button" === event.target.id) {
        chart_config = startMakeTreeUpBottom(event.target);
    } else if ("build_tree_parents_button" === event.target.id) {
        chart_config = startMakeTreeBottomUp(event.target);
    } else {
        console.log("err");
    }
    new Treant(chart_config);
    connect(chart_config);



}

var idsAfterSearch = [];
var whoNextToSearch = 0;



function closeSearchDiaolog() {
    $("#search_dialog")[0].close();
    document.getElementById('firstName_search').value = ""
    document.getElementById('lastName_search').value = ""
}


function doSearch(isParamsFromUrl) {
	whoNextToSearch = 0;
	var firstNameInput = "";
	var lastNameInput = "";
	if (isParamsFromUrl.isParamsFromUrl){
		firstNameInput= paramsFromUrl.firstName;
		lastNameInput = paramsFromUrl.lastName;
	}else{
		 firstNameInput = document.getElementById('firstName_search').value;
		 lastNameInput = document.getElementById('lastName_search').value;
	}
	idsAfterSearch = [];
	idsAfterSearch = getIdsByName(firstNameInput, lastNameInput);
	presentNextSearch();
	closeSearchDiaolog();

}

function presentNextSearch() {
	var currentIndexForSearch =  whoNextToSearch % idsAfterSearch.length
	const event = { target: { value: idsAfterSearch[currentIndexForSearch] } }
	randerDownTree(event);
	whoNextToSearch = currentIndexForSearch + 1;
}

function doSearchFirstName(name) {
    let ids = [];
    for (index in localDataBase) {
        if (localDataBase[index].firstName.toLowerCase() == name.toLowerCase()) {
            ids.push(localDataBase[index].id);
        }
    }
    return ids;
}

function doSearchLastName(name) {
    let ids = [];
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
    for (let id in idsByFirstNames) {

        if (-1 != idsByLastNames.indexOf(idsByFirstNames[id])) {
            //Found First & Last name
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
    //var idInput = document.getElementById('id_input');
    var temp = chart_config.slice(0, 1);
    chart_config = temp;
    return makeTreeUpBottom(id);
}

function startMakeTreeBottomUp(target) {
    console.log("start");
    //(event.res)? 
    var idInput = (target.who) ? { value: target.who } : document.getElementById('id_input');
    var id = idInput.value;
    var temp = chart_config.slice(0, 1);
    chart_config = temp;
    return makeTreeBottomUp(id);
}


function insertDataBottomUp(perosnId) {
    //persons ={};
    //	debugger;
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
        //var person = {"name": name, "parent1": parent1, "parent2": parent2};
        persons[perosnId] = person;
    }

}

function insertNewRowToLocalDataBase(row) {
    //debugger;
    //TODO: improve condition
    if ("id" == row[0]) { return; }
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
        "comments": comments,
    }
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
		range: 'A1:H',
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
	}).catch((err) => {
		console.log(err);
		document.getElementById("error_sheetUrl").classList.remove("hidden");
		document.getElementById("error_sheetUrl").classList.add("shown");
		return;
	});

}


//TODO: write config file for secure
//getRow return array. the array represent line at spreedsheet. which cell is string at the array
function parseDataSheetsToMultiArray(data) {
	const res = [];
	let index = 8; // skip first line TODO: make ocnfigurable
	let lastNumberLine = data[index].gs$cell.row;
	let tempLineData = ["", "", "", "", "", "", "", ""];
	for (index; index < data.length; index++) {
		let numberLine = data[index].gs$cell.row;
		let columnLine = data[index].gs$cell.col;
		if (parseInt(lastNumberLine) < parseInt(numberLine)) {
			res.push(tempLineData);
			tempLineData = ["", "", "", "", "", "", "", ""];
			lastNumberLine = numberLine;
		}
		let c = parseInt(columnLine) - 1;
		tempLineData[c] = data[index].gs$cell.$t;
	}
	res.push(tempLineData);
	return res;
	//let cell = (lineNumber-1) * 8;
	//cell = cell + firstLine;

}


function parseCsvToMultiArray(csv) {
	const res = [];
	let index = 0 // skip first line TODO: make ocnfigurable
	var data = csv.split("\n");

	for (index; index < data.length; index++){
		res.push(data[index].split(","));
	}

	return res;
	//let cell = (lineNumber-1) * 8;
	//cell = cell + firstLine;

}


function readCsv(){
return new Promise((resolve, reject) => {
	$.ajax({
		type: "GET",  
		url: "db.csv",
		dataType: "text",      
		//TODO: add error handler 
		success: function(response)  
		{
		  const dataArray = parseCsvToMultiArray(response);

		  resolve();
		  //callbackLoadFamilyTreeSuccess();
		}   
	  });
})
var data;

}

 function listMajorsApi4(sheetId) {
	 return new Promise((resolve, reject)=> {
		gapi.client.sheets.spreadsheets.values.get({
			spreadsheetId: sheetId,
			range: 'A1:H',
		}).then(function (response) {
			isUserHavePremission = true;
			SHEET_ID = sheetId;
			resolve(response.result.values);
			//parseDataSheetsToMultiArray(response.result.values);
			//loadFamilyTree();
			//hideWellcomeDialog();
		}, function (err) {
			console.log(err);
			document.getElementById("error_sheetUrl").classList.remove("hidden");
			document.getElementById("error_sheetUrl").classList.add("shown");
			return;
		}).catch((err) => {
			console.log(err);
			document.getElementById("error_sheetUrl").classList.remove("hidden");
			document.getElementById("error_sheetUrl").classList.add("shown");
			return;
		});
	 })

  }

async function readFromGoogleSheets(sheetIdInput){
	 return await listMajorsApi4(sheetIdInput);
}



async function loadFamilyTree(sheetIdInput) {

	 //const  dataArray = await readCsv();
	 const dataArray = await readFromGoogleSheets(sheetIdInput);

	 for (var i = 0; i < dataArray.length; i++) {
		insertNewRowToLocalDataBase(dataArray[i]);
	}
	for (personId in localDataBase) {
		insertDataBottomUp(parseInt(personId));
		insertDataUpBottom(parseInt(personId));
	}
	 callbackLoadFamilyTreeSuccess();
		hideWellcomeDialog();	 

}


/*
const buildTreeChildrenButton = document.getElementById('build_tree_children_button');
buildTreeChildrenButton.onclick = buildTree;

const buildTreeParentsButton = document.getElementById('build_tree_parents_button');
buildTreeParentsButton.onclick = buildTree;

const nextSearchButton = document.getElementById('next_search');
nextSearchButton.onclick = presentNextSearch;


const doSearchButton = document.getElementById('do_search');
doSearchButton.onclick = doSearch;

const cancelButtonTextField = document.getElementById("cancelPersonDetails");
cancelButtonTextField.onclick = closeDialogFields;

*/
