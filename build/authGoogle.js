var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
var SCOPES = "https://www.googleapis.com/auth/spreadsheets";
var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');
function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
    })["catch"](function (err) {
        console.log(err);
    });
}
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        isUserSignIn = true;
        hideAuthDialog();
        signoutButton.style.display = 'block';
        continueAfterUserAuthorized();
    }
    else {
        isUserSignIn = false;
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
        showAuthDialog();
    }
}
function handleAuthClick(event) {
    console.log("handleAuthClick");
    gapi.auth2.getAuthInstance().signIn();
}
function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}
function appendPre(message) {
    var pre = document.getElementById('content');
    var textContent = document.createTextNode(message + '\n');
    pre.appendChild(textContent);
}
//# sourceMappingURL=authGoogle.js.map