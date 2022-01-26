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
var FreemilyTree = (function () {
    function FreemilyTree() {
        this.personsUpBottom = {};
        this.persons = {};
        this.localDataBase = {};
        this.isUserHavePremission = false;
        this.handleButtonsMaping = {
            addButton: handleButtonEditClick,
            showUpTree: { onClick: randerUpTree, label: ".\\resources\\icons\\up.svg" },
            showDownTree: { onClick: randerDownTree, label: ".\\resources\\icons\\down.svg" }
        };
        this.idsAfterSearch = [];
        this.whoNextToSearch = 0;
    }
    FreemilyTree.prototype.isLogIn = function () {
        try {
            return (this.isUserHavePremission && gapi.auth2.getAuthInstance().isSignedIn.get());
        }
        catch (err) {
            return false;
        }
    };
    FreemilyTree.prototype.editCell = function (body, range, cb) {
        if (cb === void 0) { cb = function () { }; }
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
            cb();
        });
    };
    FreemilyTree.prototype.getNewId = function () {
        return Object.keys(this.localDataBase).length + 1;
    };
    FreemilyTree.prototype.getAllChildren = function (idParent) {
        if (this.personsUpBottom[parseInt(idParent)]) {
            return this.personsUpBottom[parseInt(idParent)].children;
        }
        return null;
    };
    FreemilyTree.prototype.addParentToChildLocalDataBase = function (id, firstName, lastName, idChild, comments) {
        if (!this.localDataBase[id]) {
            var person = {};
            person["id"] = id.toString();
            person["firstName"] = firstName;
            person["lastName"] = lastName;
            if (comments) {
                person["comments"] = comments;
            }
            this.localDataBase[id] = person;
        }
        if (!this.localDataBase[idChild].parent1) {
            this.localDataBase[idChild].parent1 = id.toString();
        }
        else {
            if (!this.localDataBase[idChild].parent2) {
                this.localDataBase[idChild].parent2 = id.toString();
            }
            else {
                console.log("error to add parent to local data base, its seems that there is already 2 parents");
            }
        }
    };
    FreemilyTree.prototype.getRangeForParentToChild = function (childId) {
        var child = this.localDataBase[childId];
        var res = "D";
        if (child.parent2) {
            res = "E";
        }
        res = res + (parseInt(childId) + 1).toString();
        return res;
    };
    FreemilyTree.prototype.addSpouseToLocalDataBase = function (idSpouse, firstNameSpouse, lsatNameParentSpouse, idPerson, comments) {
        var person = {};
        person["id"] = idSpouse.toString();
        person["firstName"] = firstNameSpouse;
        person["lastName"] = lsatNameParentSpouse;
        person["spouse"] = idPerson;
        if (comments) {
            person["comments"] = comments;
        }
        this.localDataBase[idSpouse] = person;
        this.localDataBase[idPerson].spouse = idSpouse.toString();
    };
    FreemilyTree.prototype.addChildrenToLocalDataBase = function (idChild, firstNameChild, lsatNameChild, idPerson, spouseId, comments) {
        var person = {};
        person["id"] = idChild.toString();
        person["firstName"] = firstNameChild;
        person["lastName"] = lsatNameChild;
        person["parent1"] = idPerson;
        if (comments) {
            person["comments"] = comments;
        }
        if (this.localDataBase[spouseId]) {
            person["parent2"] = spouseId.toString();
        }
        this.localDataBase[idChild] = person;
    };
    FreemilyTree.prototype.addLastNameToSheets = function (rowRange, bodyFirstName, cb) {
        var range = "C" + rowRange;
        this.editCell(bodyFirstName, range, cb);
    };
    FreemilyTree.prototype.addFirstNameToSheets = function (rowRange, bodyFirstName, cb) {
        var range = "B" + rowRange;
        this.editCell(bodyFirstName, range, cb);
    };
    FreemilyTree.prototype.addParentToChildToSheet = function (childId, value, cb, parent) {
        if (cb === void 0) { cb = function () { }; }
        var range;
        if (1 === parent) {
            range = "D" + (parseInt(childId) + 1).toString();
        }
        else if (2 === parent) {
            range = "E" + (parseInt(childId) + 1).toString();
        }
        else {
            range = this.getRangeForParentToChild(childId);
        }
        this.editCell(value, range, cb);
    };
    FreemilyTree.prototype.addSpouseToSheets = function (rowRange, bodyFirstName, cb) {
        if (cb === void 0) { cb = function () { }; }
        var bodyrequest = ("object" == typeof bodyFirstName) ? bodyFirstName : {
            values: [
                [bodyFirstName]
            ]
        };
        var range = "F" + rowRange;
        this.editCell(bodyrequest, range, cb);
    };
    FreemilyTree.prototype.addCommentToSheets = function (rowRange, bodyFirstName, cb) {
        var bodyrequest = ("object" == typeof bodyFirstName) ? bodyFirstName : {
            values: [
                [bodyFirstName]
            ]
        };
        var range = "H" + rowRange;
        this.editCell(bodyrequest, range, cb);
    };
    FreemilyTree.prototype.syncTreeAfterInsertNewData = function (person, diraction) {
        if (diraction === void 0) { diraction = "up"; }
        var dir = "build_tree_parents_button";
        if ("down" === diraction) {
            dir = "build_tree_children_button";
        }
        var temp = chart_config.slice(0, 1);
        chart_config = temp;
        var event = { target: { id: dir, who: person.id } };
        this.persons = {};
        this.personsUpBottom = {};
        for (var personId in this.localDataBase) {
            this.insertDataBottomUp(parseInt(personId));
            this.insertDataUpBottom(parseInt(personId));
        }
        this.buildTree(event);
    };
    FreemilyTree.prototype.connectSpouseRelationshipByChildRemoteStorageSheets = function (chidId, spouseId) {
        var parentId = (this.localDataBase[chidId].parent1 && this.localDataBase[chidId].parent1 != spouseId) ? (this.localDataBase[chidId].parent1) :
            ((this.localDataBase[chidId].parent2 && this.localDataBase[chidId].parent2 != spouseId) ? this.localDataBase[chidId].parent2 :
                null);
        if (parentId) {
            this.addSpouseToSheets((parseInt(parentId) + 1), spouseId);
            this.addSpouseToSheets((spouseId + 1), parentId);
        }
        else {
            return;
        }
    };
    FreemilyTree.prototype.connectSpousesLocalDatabase = function (spouse1, spouse2) {
        this.localDataBase[spouse1].spouse = spouse2;
        this.localDataBase[spouse2].spouse = spouse1;
    };
    FreemilyTree.prototype.connectSpouseRelationshipByChildLocalDatabase = function (chidId, spouseId) {
        var parentId = (this.localDataBase[chidId].parent1 && this.localDataBase[chidId].parent1 != spouseId) ? (this.localDataBase[chidId].parent1) :
            ((this.localDataBase[chidId].parent2 && this.localDataBase[chidId].parent2 != spouseId) ? this.localDataBase[chidId].parent2 :
                null);
        if (parentId) {
            this.connectSpousesLocalDatabase(parentId, spouseId);
        }
        else {
            return;
        }
    };
    FreemilyTree.prototype.closeDialogFields = function () {
        var dialogFields = document.getElementById('dialogFields');
        dialogFields.close();
    };
    FreemilyTree.prototype.getRelevantButtons = function (event) {
        var res = [];
        var personId = event.target.value;
        var person = this.localDataBase[personId];
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
    };
    FreemilyTree.prototype.scrollToCenter = function () {
        var currntId = "containerPerson_" + chart_config[1].button.id;
        document.getElementById(currntId).scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    };
    FreemilyTree.prototype.saveCommentsToSheet = function () {
        var commentsField = document.getElementById("commentsField");
        var commeent = commentsField.value;
    };
    FreemilyTree.prototype.getSpouseIdById = function (id) {
        var spouse = (this.localDataBase[id].spouse) ? this.localDataBase[id].spouse : null;
        return spouse;
    };
    FreemilyTree.prototype.getCommentsById = function (id) {
        try {
            return (this.localDataBase[id].comments) ? this.localDataBase[id].comments : null;
        }
        catch (err) {
            console.log("err in getcommentBy id with param : id= " + id + "error: " + err);
        }
    };
    FreemilyTree.prototype.getFirstName = function (id) {
        try {
            return this.localDataBase[id]["firstName"];
        }
        catch (err) {
            console.log("error in get first name funtion with params=" + id + ".  err=" + err);
        }
    };
    FreemilyTree.prototype.getLastName = function (id) {
        try {
            return this.localDataBase[id].lastName;
        }
        catch (err) {
            console.log("error in get last name funtion with params=" + id + ".  err=" + err);
        }
    };
    FreemilyTree.prototype.getFullNameById = function (id) {
        return this.getFirstName(id) + " " + this.getLastName(id);
    };
    FreemilyTree.prototype.getParentsById = function (id) {
        var arr = [];
        arr.push(this.localDataBase[id].parent1);
        arr.push(this.localDataBase[id].parent2);
        return arr;
    };
    FreemilyTree.prototype.insertParentsRec = function (personId, graphPerson) {
        var parents = this.getParentsById(personId);
        if (parents[0] != null && "" !== parents[0]) {
            var temp1 = { text: { name: this.getFullNameById(parents[0]) }, parent: graphPerson, button: { id: parents[0], label: "+", onClick: this.handleButtonsMaping } };
            var title1 = this.getCommentsById(parents[0]);
            (title1) ? temp1.text["title"] = title1 : null;
            chart_config.push(temp1);
            this.insertParentsRec(parents[0], temp1);
        }
        if (parents[1] != null && "" !== parents[1]) {
            if (true) {
                var temp2 = { text: { name: this.getFullNameById(parents[1]) }, parent: graphPerson, button: { id: parents[1], label: "+", onClick: this.handleButtonsMaping } };
            }
            else {
                var temp2 = { text: { name: this.getFullNameById(parents[1]) }, parent: graphPerson };
            }
            var title2 = this.getCommentsById(parents[1]);
            (title2) ? temp2.text["title"] = title2 : null;
            chart_config.push(temp2);
            this.insertParentsRec(parents[1], temp2);
        }
    };
    FreemilyTree.prototype.insertChildernRec = function (parentID, grapObject) {
        if (this.personsUpBottom[parentID]) {
            if (this.personsUpBottom[parentID].children) {
                for (var i = 0; i < this.personsUpBottom[parentID].children.length; i++) {
                    var childId = this.personsUpBottom[parentID].children[i];
                    if (true) {
                        var child = { text: { name: this.getFullNameById(childId) }, parent: grapObject, button: { id: childId, label: "+", onClick: this.handleButtonsMaping } };
                    }
                    var title = this.getCommentsById(childId);
                    (title) ? child.text["title"] = title : null;
                    var spouseId = this.getSpouseIdById(childId);
                    var spouse = (spouseId) ? { text: { name: this.getFullNameById(spouseId), button: { id: spouseId, label: "+", onClick: this.handleButtonsMaping }, comments: this.getCommentsById(spouseId) } } : null;
                    if (spouse) {
                        child.spouse = spouse;
                    }
                    chart_config.push(child);
                    this.insertChildernRec(this.personsUpBottom[parentID].children[i], child);
                }
            }
        }
    };
    FreemilyTree.prototype.makeTreeBottomUp = function (personId) {
        var root = { text: { name: this.getFullNameById(personId) }, button: { id: personId, label: "+", onClick: this.handleButtonsMaping } };
        (this.getCommentsById(personId)) ? root["title"] = (this.getCommentsById(personId)) : null;
        chart_config.push(root);
        chart_config[0].rootOrientation = "SOUTH";
        this.insertParentsRec(personId, root);
        return chart_config;
    };
    FreemilyTree.prototype.getIdsByName = function (firstNameInput, lastNameInput) {
        var res = [];
        var idsByFirstNames = [];
        var idsByLastNames = [];
        if (firstNameInput && firstNameInput !== "") {
            idsByFirstNames = this.doSearchFirstName(firstNameInput);
        }
        if (lastNameInput && lastNameInput !== "") {
            var idsByLastNames = this.doSearchLastName(lastNameInput);
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
    };
    FreemilyTree.prototype.makeTreeUpBottom = function (personId) {
        if (true) {
            var root = { text: { name: this.getFullNameById(personId) }, button: { id: personId, label: "+", onClick: this.handleButtonsMaping } };
        }
        else {
            var root = { text: { name: this.getFullNameById(personId) } };
        }
        var title = this.getCommentsById(personId);
        (title) ? root.text["title"] = title : null;
        var spouseId = this.getSpouseIdById(personId);
        var spouse;
        if (true) {
            spouse = (spouseId) ? { text: { name: this.getFullNameById(spouseId), comments: this.getCommentsById(spouseId) }, button: { id: spouseId, label: "+", onClick: this.handleButtonsMaping } } : null;
        }
        else {
            spouse = (spouseId) ? { text: { name: this.getFullNameById(spouseId), comments: this.getCommentsById(spouseId) } } : null;
        }
        if (spouse) {
            root.spouse = spouse;
        }
        chart_config.push(root);
        chart_config[0].rootOrientation = "NORTH";
        this.insertChildernRec(personId, root);
        return chart_config;
    };
    FreemilyTree.prototype.handleParent = function (idParent1, perosnId) {
        if (!this.personsUpBottom[idParent1]) {
            var person = { "name": this.getFullNameById(idParent1), "children": [], "id": idParent1 };
            person.children.push(perosnId);
            this.personsUpBottom[idParent1] = person;
        }
        else {
            this.personsUpBottom[idParent1].children.push(perosnId);
        }
        if (this.localDataBase[idParent1].spouse) {
            this.personsUpBottom[idParent1].spouse = this.localDataBase[idParent1].spouse;
        }
    };
    FreemilyTree.prototype.insertDataUpBottom = function (perosnId) {
        var idParent1 = this.localDataBase[perosnId].parent1;
        var idParent2 = this.localDataBase[perosnId].parent2;
        ("" !== idParent1 && idParent1) ? this.handleParent(idParent1, perosnId) : null;
        ("" !== idParent2 && idParent2) ? this.handleParent(idParent2, perosnId) : null;
    };
    FreemilyTree.prototype.connect = function (chart_config) {
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
    };
    FreemilyTree.prototype.updateHeaderDetailsById = function (id) {
        if (id) {
            updateHeaderDetails(this.localDataBase[id].firstName);
        }
    };
    FreemilyTree.prototype.buildTree = function (event) {
        var pre = document.getElementById("content");
        $("#content").empty();
        var container = document.createElement("div");
        container.id = "basic-example";
        container.classList.add("chart");
        pre.appendChild(container);
        var chart_config;
        this.updateHeaderDetailsById(event.target.who);
        if ("build_tree_children_button" === event.target.id) {
            chart_config = this.startMakeTreeUpBottom(event.target);
        }
        else if ("build_tree_parents_button" === event.target.id) {
            chart_config = this.startMakeTreeBottomUp(event.target);
        }
        else {
            console.log("err");
        }
        new Treant(chart_config);
        this.connect(chart_config);
    };
    FreemilyTree.prototype.closeSearchDiaolog = function () {
        $("#search_dialog")[0].close();
        document.getElementById('firstName_search').value = "";
        document.getElementById('lastName_search').value = "";
    };
    FreemilyTree.prototype.presentNextSearch = function () {
        var currentIndexForSearch = this.whoNextToSearch % this.idsAfterSearch.length;
        var event = { target: { value: this.idsAfterSearch[currentIndexForSearch] } };
        randerDownTree(event);
        this.whoNextToSearch = currentIndexForSearch + 1;
    };
    FreemilyTree.prototype.doSearchFirstName = function (name) {
        var ids = [];
        for (index in this.localDataBase) {
            if (this.localDataBase[index].firstName.toLowerCase() == name.toLowerCase()) {
                ids.push(this.localDataBase[index].id);
            }
        }
        return ids;
    };
    FreemilyTree.prototype.doSearchLastName = function (name) {
        var ids = [];
        for (index in this.localDataBase) {
            if (this.localDataBase[index].lastName.toLowerCase() == name.toLowerCase()) {
                ids.push(this.localDataBase[index].id);
            }
        }
        return ids;
    };
    FreemilyTree.prototype.startMakeTreeUpBottom = function (target) {
        console.log("start");
        var idInput = (target.who) ? { value: target.who } : document.getElementById('id_input');
        var id = idInput.value;
        var temp = chart_config.slice(0, 1);
        chart_config = temp;
        return this.makeTreeUpBottom(id);
    };
    FreemilyTree.prototype.startMakeTreeBottomUp = function (target) {
        console.log("start");
        var idInput = (target.who) ? { value: target.who } : document.getElementById('id_input');
        var id = idInput.value;
        var temp = chart_config.slice(0, 1);
        chart_config = temp;
        return this.makeTreeBottomUp(id);
    };
    FreemilyTree.prototype.insertDataBottomUp = function (perosnId) {
        var name = this.localDataBase[perosnId].firstName + this.localDataBase[perosnId].lastName;
        var parent1 = parseInt(this.localDataBase[perosnId].parent1);
        var parent2 = parseInt(this.localDataBase[perosnId].parent2);
        var person = {};
        if (perosnId) {
            var person = { "name": name };
            if (parent1) {
                person.parent1 = parent1;
            }
            if (parent2) {
                person.parent2 = parent2;
            }
            this.persons[perosnId] = person;
        }
    };
    FreemilyTree.prototype.insertNewRowToLocalDataBase = function (row) {
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
        this.localDataBase[id] = {
            "id": id,
            "firstName": firstName,
            "lastName": lastName,
            "parent1": parent1,
            "parent2": parent2,
            "spouse": spouse,
            "comments": comments
        };
    };
    FreemilyTree.prototype.listMajors = function (sheetIdInput) {
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
            this.isUserHavePremission = true;
            SHEET_ID = sheetId;
            this.parseDataSheetsToMultiArray(data.feed.entry);
            this.loadFamilyTree(sheetIdInput);
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
    };
    FreemilyTree.prototype.parseDataSheetsToMultiArray = function (data) {
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
    };
    FreemilyTree.prototype.parseCsvToMultiArray = function (csv) {
        var res = [];
        var index = 0;
        var data = csv.split("\n");
        for (index; index < data.length; index++) {
            res.push(data[index].split(","));
        }
        return res;
    };
    FreemilyTree.prototype.readCsv = function (path) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                type: "GET",
                url: path,
                dataType: "text",
                success: function (response) {
                    var dataArray = this.parseCsvToMultiArray(response);
                    resolve(dataArray);
                }
            });
        });
    };
    FreemilyTree.prototype.loadFamilyTree = function (dataArray) {
        return __awaiter(this, void 0, void 0, function () {
            var i;
            return __generator(this, function (_a) {
                if (dataArray) {
                    for (i = 0; i < dataArray.length; i++) {
                        this.insertNewRowToLocalDataBase(dataArray[i]);
                    }
                    for (personId in this.localDataBase) {
                        this.insertDataBottomUp(parseInt(personId));
                        this.insertDataUpBottom(parseInt(personId));
                    }
                }
                else {
                    throw new Error('empty table');
                }
                callbackLoadFamilyTreeSuccess();
                hideWellcomeDialog();
                return [2, true];
            });
        });
    };
    return FreemilyTree;
}());
//# sourceMappingURL=freemilyTree.js.map