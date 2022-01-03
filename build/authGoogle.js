var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];
var SCOPES = "https://www.googleapis.com/auth/spreadsheets";
var authorizeButton = document.getElementById('authorize_button');
var signoutButton = document.getElementById('signout_button');
function initClient() {
    return new Promise(function (reslove, reject) {
        gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES
        }).then(function () {
            function priveteUpdateSigninStatus(isSignedIn) {
                updateSigninStatus(isSignedIn, reslove);
            }
            gapi.auth2.getAuthInstance().isSignedIn.listen(priveteUpdateSigninStatus);
            priveteUpdateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get(), reslove);
            authorizeButton.onclick = handleAuthClick;
            signoutButton.onclick = handleSignoutClick;
        })["catch"](function (err) {
            console.log(err);
            reject(err);
        });
    });
}
function updateSigninStatus(isSignedIn, resolve) {
    if (isSignedIn) {
        isUserSignIn = true;
        hideAuthDialog();
        signoutButton.style.display = 'block';
        resolve(true);
    }
    else {
        isUserSignIn = false;
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
        showAuthDialog();
        resolve(false);
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