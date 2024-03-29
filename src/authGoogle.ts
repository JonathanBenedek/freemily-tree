// @ts-nocheck



//			https://docs.google.com/spreadsheets/d/13D2fRpETQ4EIMDAI0SMNV4QmfNo4pw6hG2s-PYfLY-Y/edit?usp=sharing

// Client ID and API key from the Developer Console
// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/spreadsheets";

var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');


/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */

function initClient() {
	return new Promise((reslove, reject)=>{
		gapi.client.init({
			apiKey: API_KEY,
			clientId: CLIENT_ID,
			discoveryDocs: DISCOVERY_DOCS,
			scope: SCOPES
		}).then(function () {
			// Listen for sign-in state changes.
			function priveteUpdateSigninStatus(isSignedIn){
				updateSigninStatus(isSignedIn);
			}
			const isUserSignIn = gapi.auth2.getAuthInstance().isSignedIn.get();
			gapi.auth2.getAuthInstance().isSignedIn.listen(priveteUpdateSigninStatus);
	
			// Handle the initial sign-in state.
			//priveteUpdateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get(), reslove);
			authorizeButton.onclick = handleAuthClick;
			signoutButton.onclick = handleSignoutClick;
			reslove(isUserSignIn);
		}).catch((err) => {
			console.log(err)
			reject(err);
		});
	});

}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn, resolve) {
	if (isSignedIn) {
		isUserSignIn = true;
		hideAuthDialog();
		//authorizeButton.style.display = 'none';
		signoutButton.style.display = 'block';
		//listMajors();
		//continueAfterUserAuthorized();
			//getFromUserGoogleSheetId();
			//resolve(true);
			//getFromUserGoogleSheetId();
			start();


	} else {
		isUserSignIn = false ; 
		authorizeButton.style.display = 'block';
		signoutButton.style.display = 'none';
		showAuthDialog();
		resolve(false);
	}
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
	console.log("handleAuthClick");
	gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
	gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
	var pre = document.getElementById('content');
	var textContent = document.createTextNode(message + '\n');
	pre.appendChild(textContent);
}

