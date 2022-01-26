// @ts-nocheck

class FreemilyTree {




personsUpBottom : {[key:string]: any} = {};
persons = {};
localDataBase : {[key:string]: any} = {};
//TODO: change diraction in tree bottom up . the childern should be  
//TODO: add spouse in tree bottom up
//TODO: is log in should consider if the the user have access to the sheet. then maybe change the function name
//TODO: make sure that the user understand which spouse is the  real children

isUserHavePremission = false;

 isLogIn() {
    try {
        return (this.isUserHavePremission && gapi.auth2.getAuthInstance().isSignedIn.get());
    } catch (err) {
        return false;
    }
}

 editCell(body: any, range: any, cb: Function=()=>{}) {
     // @ts-ignore
    gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SHEET_ID,
        range: range,
        valueInputOption: 'RAW',
        resource: body
    }).then((response: any) => {
        var result = response.result;
        console.log(`${result.updatedCells} cells updated.`);
        if (cb) { cb(); }
    }).catch((err: any) => {
        console.log(err);
            cb();
    });
}

 getNewId() : number {
    return Object.keys(this.localDataBase).length + 1;
}

 getAllChildren(idParent: string) {
    if (this.personsUpBottom[parseInt(idParent)]) {
        return this.personsUpBottom[parseInt(idParent)].children;
    }
    return null;
}

 addParentToChildLocalDataBase(id: number, firstName: string, lastName:string, idChild:string, comments?:string) {
    if (!this.localDataBase[id]) {
        var person: {[key:string]: any} = {};
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
    } else {
        if (!this.localDataBase[idChild].parent2) {
            this.localDataBase[idChild].parent2 = id.toString();
        } else {
            console.log("error to add parent to local data base, its seems that there is already 2 parents");
        }
    }
}

 getRangeForParentToChild(childId: string | number) {
    var child = this.localDataBase[childId];
    var res = "D"
    if (child.parent2) {
        res = "E"
    }
    res = res + (parseInt(childId as string) + 1).toString();
    return res;
}

 addSpouseToLocalDataBase(idSpouse: number, firstNameSpouse: string, lsatNameParentSpouse: string, idPerson: string, comments: string) {
    var person: {[key:string]: any} = {};
    person["id"] = idSpouse.toString();
    person["firstName"] = firstNameSpouse;
    person["lastName"] = lsatNameParentSpouse;
    person["spouse"] = idPerson;
    if (comments) {
        person["comments"] = comments;
    }
    this.localDataBase[idSpouse] = person;
    this.localDataBase[idPerson].spouse = idSpouse.toString();

}

 addChildrenToLocalDataBase(idChild:number, firstNameChild:string, lsatNameChild:string, idPerson: string, spouseId: number, comments: string) {
    var person: {[key:string]: any} = {};
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
}

addLastNameToSheets(rowRange: number, bodyFirstName: any, cb?: Function) {
    const range = "C" + rowRange;
    this.editCell(bodyFirstName, range, cb);
}

addFirstNameToSheets(rowRange: number, bodyFirstName: any, cb?: Function) {
    const range = "B" + rowRange;
    this.editCell(bodyFirstName, range, cb);
}

addParentToChildToSheet(childId: number | string, value: any, cb:Function = () => {}, parent?: number) {
    let range;
    if (1 === parent) {
        //res = res + (parseInt(childId) + 1).toString();
        range = "D" + (parseInt(childId as string) + 1).toString();
    } else if (2 === parent) {
        range = "E" + (parseInt(childId as string) + 1).toString();
    } else {
        range = this.getRangeForParentToChild(childId);
    }
    this.editCell(value, range, cb);
}

addSpouseToSheets(rowRange: number, bodyFirstName: any, cb: Function = ()=>{}) {

    const bodyrequest = ("object" == typeof bodyFirstName) ? bodyFirstName : {
        values: [
            [bodyFirstName]
        ]
    };
    const range = "F" + rowRange;
    this.editCell(bodyrequest, range, cb);
}

 addCommentToSheets(rowRange: number, bodyFirstName: any, cb?: Function) {

    const bodyrequest = ("object" == typeof bodyFirstName) ? bodyFirstName : {
        values: [
            [bodyFirstName]
        ]
    };
    const range = "H" + rowRange;
    this.editCell(bodyrequest, range, cb);
}

 syncTreeAfterInsertNewData(person:any, diraction: "down"| "up" = "up") {
    var dir = "build_tree_parents_button";
    if ("down" === diraction) {
        dir = "build_tree_children_button"
    }
    var temp = chart_config.slice(0, 1);
    chart_config = temp;
    var event = { target: { id: dir, who: person.id } }
    this.persons = {};
    this.personsUpBottom = {};
    for (let personId in this.localDataBase) {
        this.insertDataBottomUp(parseInt(personId));
        this.insertDataUpBottom(parseInt(personId));
    }
    this.buildTree(event);
}






 connectSpouseRelationshipByChildRemoteStorageSheets(chidId: number, spouseId: number) {
    const parentId = (this.localDataBase[chidId].parent1 && this.localDataBase[chidId].parent1 != spouseId) ? (this.localDataBase[chidId].parent1) :
        ((this.localDataBase[chidId].parent2 && this.localDataBase[chidId].parent2 != spouseId) ? this.localDataBase[chidId].parent2 :
            null);
    if (parentId) {
        this.addSpouseToSheets((parseInt(parentId) + 1), spouseId);
        this.addSpouseToSheets((spouseId + 1), parentId);
    } else {
        return;
    }
}

 connectSpousesLocalDatabase(spouse1: number, spouse2: number) {
    this.localDataBase[spouse1].spouse = spouse2;
    this.localDataBase[spouse2].spouse = spouse1;
}

 connectSpouseRelationshipByChildLocalDatabase(chidId: number, spouseId: number) {
    //check if exit already parent if exist connect to spouseId
    const parentId = (this.localDataBase[chidId].parent1 && this.localDataBase[chidId].parent1 != spouseId) ? (this.localDataBase[chidId].parent1) :
        ((this.localDataBase[chidId].parent2 && this.localDataBase[chidId].parent2 != spouseId) ? this.localDataBase[chidId].parent2 :
            null);
    if (parentId) {
        this.connectSpousesLocalDatabase(parentId, spouseId);
    } else {

        return;
    }
}







 closeDialogFields() {
    var dialogFields: any = document.getElementById('dialogFields');
    dialogFields.close();
}



 getRelevantButtons(event: any) {
    //TODO: understand which buttons should have and return array with buttons element
    //The buttons returns wih eventlistener 
    var res = [];
    var personId = event.target.value;
    var person = this.localDataBase[personId];
    var buttonAddParent: any = document.getElementById("button_add_parent");
    var buttonAddSpouse: any = document.getElementById("button_add_spouse");
    var buttonAddChild: any = document.getElementById("button_add_child");
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



 scrollToCenter() {
    //scrollElement.scrollTo(screen.width / 2, screen.height / 2);
    // @ts-ignore
    var currntId = "containerPerson_" + chart_config[1].button.id
    document.getElementById(currntId).scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    //  scrollElement.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" })

}



 saveCommentsToSheet() {
    var commentsField: any = document.getElementById("commentsField");
    var commeent = commentsField.value;
}


handleButtonsMaping = {
    addButton: handleButtonEditClick,
    showUpTree: { onClick: randerUpTree, label: ".\\resources\\icons\\up.svg" },
    showDownTree: { onClick: randerDownTree, label: ".\\resources\\icons\\down.svg" },
}


 getSpouseIdById(id: number) {
    const spouse = (this.localDataBase[id].spouse) ? this.localDataBase[id].spouse : null;
    return spouse;
}

 getCommentsById(id: number) {
    try {
        return (this.localDataBase[id].comments) ? this.localDataBase[id].comments : null;
    } catch (err) {
        console.log("err in getcommentBy id with param : id= " + id + "error: " + err);
    }
}

 getFirstName(id: number) {
    try {
        return this.localDataBase[id]["firstName"];
    } catch (err) {
        console.log("error in get first name funtion with params=" + id + ".  err=" + err);
    }
}

 getLastName(id: number) {
    try {
        return this.localDataBase[id].lastName;

    } catch (err) {
        console.log("error in get last name funtion with params=" + id + ".  err=" + err);
    }
}

 getFullNameById(id: number) {
    return this.getFirstName(id) + " " + this.getLastName(id);
}

 getParentsById(id: number) {
    let arr = [];
    arr.push(this.localDataBase[id].parent1);
    arr.push(this.localDataBase[id].parent2);
    return arr;
}

 insertParentsRec(personId: number, graphPerson: any) {
    const parents = this.getParentsById(personId);
    if (parents[0] != null && "" !== parents[0]) {
        var temp1 = { text: { name: this.getFullNameById(parents[0]) }, parent: graphPerson, button: { id: parents[0], label: "+", onClick: this.handleButtonsMaping } };
        const title1 = this.getCommentsById(parents[0]);
        //@ts-ignore
        (title1) ? temp1.text["title"] = title1: null;
        //temp1.text["id"] = parents[0];
                //@ts-ignore
        chart_config.push(temp1);
        this.insertParentsRec(parents[0], temp1);
    }
    if (parents[1] != null && "" !== parents[1]) {
        if (true) {
            var temp2 = { text: { name: this.getFullNameById(parents[1]) }, parent: graphPerson, button: { id: parents[1], label: "+", onClick: this.handleButtonsMaping } }
        } else {
                    //@ts-ignore
            var temp2 = { text: { name: this.getFullNameById(parents[1]) }, parent: graphPerson }

        }
        const title2 = this.getCommentsById(parents[1]);
        //temp2.text["id"] = parents[1];
                //@ts-ignore
        (title2) ? temp2.text["title"] = title2: null;
                //@ts-ignore
        chart_config.push(temp2);
        this.insertParentsRec(parents[1], temp2);
    }
    //insertParentsRec(person.parent1);
    //insertParentsRec(person.parent2);
    //chart_config.push(cto);


}

 insertChildernRec(parentID: number, grapObject: any) {
    if (this.personsUpBottom[parentID]) {
        if (this.personsUpBottom[parentID].children) {
            for (var i = 0; i< this.personsUpBottom[parentID].children.length; i++) {
                var childId = this.personsUpBottom[parentID].children[i]
                if (true) {
                    var child = { text: { name: this.getFullNameById(childId) }, parent: grapObject, button: { id: childId, label: "+", onClick: this.handleButtonsMaping } };
                }
                const title = this.getCommentsById(childId);
                //@ts-ignore
                (title) ? child.text["title"] = title: null;
                const spouseId = this.getSpouseIdById(childId);
                const spouse = (spouseId) ? { text: { name: this.getFullNameById(spouseId), button: { id: spouseId, label: "+", onClick: this.handleButtonsMaping }, comments: this.getCommentsById(spouseId) } } : null;
                if (spouse) {
                                    //@ts-ignore
                    child.spouse = spouse;
                }
                                //@ts-ignore

                chart_config.push(child);
                this.insertChildernRec(this.personsUpBottom[parentID].children[i], child);
            }
        }
    }
}


 makeTreeBottomUp(personId: number) {
    // debugger;
    var root = { text: { name: this.getFullNameById(personId) }, button: { id: personId, label: "+", onClick: this.handleButtonsMaping } };
    (this.getCommentsById(personId)) ? root["title"] = (this.getCommentsById(personId)): null;
    //root["id"] = personId;
    chart_config.push(root);
    chart_config[0].rootOrientation = "SOUTH";
	this.insertParentsRec(personId, root);
    return chart_config;
}

getIdsByName(firstNameInput, lastNameInput) {
    var res = [];
    var idsByFirstNames = [];
    var idsByLastNames = [];
    if (firstNameInput && firstNameInput !== "") {
        idsByFirstNames = this.doSearchFirstName(firstNameInput);
    }
    if (lastNameInput && lastNameInput !== "") {
        var idsByLastNames = this.doSearchLastName(lastNameInput);
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

 makeTreeUpBottom(personId) {
    // debugger;
    if (true) {
        var root = { text: { name: this.getFullNameById(personId) }, button: { id: personId, label: "+", onClick: this.handleButtonsMaping } };
    } else {
        var root = { text: { name: this.getFullNameById(personId) } };
    }
    const title = this.getCommentsById(personId);
    (title) ? root.text["title"] = title: null;
    //root.text["id"] = personId;
    const spouseId = this.getSpouseIdById(personId);
    let spouse;
    if (true) {
        spouse = (spouseId) ? { text: { name: this.getFullNameById(spouseId), comments: this.getCommentsById(spouseId) }, button: { id: spouseId, label: "+", onClick: this.handleButtonsMaping } } : null;
    } else {
        spouse = (spouseId) ? { text: { name: this.getFullNameById(spouseId), comments: this.getCommentsById(spouseId) } } : null;
    }
    if (spouse) {
        //spouse.text["id"] = spouseId;
        root.spouse = spouse;
    }
    chart_config.push(root);
    chart_config[0].rootOrientation = "NORTH";
    this.insertChildernRec(personId, root);
    return chart_config;
}


 handleParent(idParent1, perosnId) {
    //personsUpBottom= {};
    if (!this.personsUpBottom[idParent1]) {
        var person = { "name": this.getFullNameById(idParent1), "children": [], "id": idParent1 };
        person.children.push(perosnId);
        //personsUpBottom.parentName = person;
        this.personsUpBottom[idParent1] = person; //children.push(childName);

    } else {
        this.personsUpBottom[idParent1].children.push(perosnId);
    }
    //debugger;
    if (this.localDataBase[idParent1].spouse) {
        this.personsUpBottom[idParent1].spouse = this.localDataBase[idParent1].spouse;
    }
}

 insertDataUpBottom(perosnId) {
    // debugger;
    var idParent1 = this.localDataBase[perosnId].parent1;
    var idParent2 = this.localDataBase[perosnId].parent2;
    //var nameChild = localDataBase[perosnId].name;
    ("" !== idParent1 && idParent1) ? this.handleParent(idParent1, perosnId): null;
    ("" !== idParent2 && idParent2) ? this.handleParent(idParent2, perosnId): null;
}

 connect(chart_config) {
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

 updateHeaderDetailsById(id) {
    if (id) {
        updateHeaderDetails(this.localDataBase[id].firstName);
    }
}


 buildTree(event) {
    var pre = document.getElementById("content");
    $("#content").empty();
    var container = document.createElement("div");
    container.id = "basic-example";
    container.classList.add("chart")
    pre.appendChild(container);
    var chart_config;
    this.updateHeaderDetailsById(event.target.who);
    if ("build_tree_children_button" === event.target.id) {
        chart_config = this.startMakeTreeUpBottom(event.target);
    } else if ("build_tree_parents_button" === event.target.id) {
        chart_config = this.startMakeTreeBottomUp(event.target);
    } else {
        console.log("err");
    }
    new Treant(chart_config);
    this.connect(chart_config);
}

 idsAfterSearch = [];
 whoNextToSearch = 0;



 closeSearchDiaolog() {
    $("#search_dialog")[0].close();
    (<HTMLInputElement>document.getElementById('firstName_search')).value = "";
    (<HTMLInputElement>document.getElementById('lastName_search')).value = ""
}




 presentNextSearch() {
	var currentIndexForSearch =  this.whoNextToSearch % this.idsAfterSearch.length
	const event = { target: { value: this.idsAfterSearch[currentIndexForSearch] } }
	randerDownTree(event);
	this.whoNextToSearch = currentIndexForSearch + 1;
}

 doSearchFirstName(name) {
    let ids = [];
    for (index in this.localDataBase) {
        if (this.localDataBase[index].firstName.toLowerCase() == name.toLowerCase()) {
            ids.push(this.localDataBase[index].id);
        }
    }
    return ids;
}

 doSearchLastName(name) {
    let ids = [];
    for (index in this.localDataBase) {
        if (this.localDataBase[index].lastName.toLowerCase() == name.toLowerCase()) {
            ids.push(this.localDataBase[index].id);
        }
    }
    return ids;
}



 startMakeTreeUpBottom(target) {
    console.log("start");
    var idInput = (target.who) ? { value: target.who } : document.getElementById('id_input');


    var id = idInput.value;
    //var idInput = document.getElementById('id_input');
    var temp = chart_config.slice(0, 1);
    chart_config = temp;
    return this.makeTreeUpBottom(id);
}

 startMakeTreeBottomUp(target) {
    console.log("start");
    //(event.res)? 
    var idInput = (target.who) ? { value: target.who } : document.getElementById('id_input');
    var id = idInput.value;
    var temp = chart_config.slice(0, 1);
    chart_config = temp;
    return 	this.makeTreeBottomUp(id);
}


 insertDataBottomUp(perosnId) {
    //persons ={};
    //	debugger;
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
        //var person = {"name": name, "parent1": parent1, "parent2": parent2};
        this.persons[perosnId] = person;
    }

}

 insertNewRowToLocalDataBase(row) {
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

    this.localDataBase[id] = {
        "id": id,
        "firstName": firstName,
        "lastName": lastName,
        "parent1": parent1,
        "parent2": parent2,
        "spouse": spouse,
        "comments": comments,
    }
}

 listMajors(sheetIdInput) {
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
	}).catch((err) => {
		console.log(err);
		document.getElementById("error_sheetUrl").classList.remove("hidden");
		document.getElementById("error_sheetUrl").classList.add("shown");
		return;
	});

}


//TODO: write config file for secure
//getRow return array. the array represent line at spreedsheet. which cell is string at the array
 parseDataSheetsToMultiArray(data) {
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


 parseCsvToMultiArray(csv) {
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


 readCsv(path){
return new Promise((resolve, reject) => {
	$.ajax({
		type: "GET",  
		url: path,
		dataType: "text",      
		//TODO: add error handler 
		success: function(response)  
		{
		  const dataArray = this.parseCsvToMultiArray(response);

		  resolve(dataArray);
		  //callbackLoadFamilyTreeSuccess();
		}   
	  });
})
}







async  loadFamilyTree(dataArray) {

	 //const  dataArray = await readCsv();
	 //const dataArray = await readFromGoogleSheets(sheetIdInput);
	if (dataArray){
		for (var i = 0; i < dataArray.length; i++) {
			this.insertNewRowToLocalDataBase(dataArray[i]);
		}
		for (personId in this.localDataBase) {
			this.insertDataBottomUp(parseInt(personId));
			this.insertDataUpBottom(parseInt(personId));
		}
	} else {
		throw new Error('empty table');  
		// new table or a problem that not recognaized.
	}

	callbackLoadFamilyTreeSuccess();
	hideWellcomeDialog();	
	return true; 

}

}