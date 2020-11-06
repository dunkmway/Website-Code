
if (document.getElementById('navLogout')) {
    document.getElementById('navLogout').addEventListener('click', logout);
}
if (document.getElementById('dashLogout')) {
    document.getElementById('dashLogout').addEventListener('click', logout);
}

function logout() {
    firebase.auth().signOut()
    .then(function() {
        // Sign-out successful.
        window.location.replace('/');
    })
    .catch(function(error) {
        // An error happened.
        var errorCode = error.code;
        var errorMessage = error.message;
        console.log('Error code: ' + errorCode);
        console.log('Error message: ' + errorMessage);
    });
}

//this goes at the end of every page.
//each page must have modify pageReady when everything has loaded in and then call the function.
function closeLoadingScreen() {
    if (siteWideReady && pageReady) {
        if (document.getElementById('loadingScreen')) {
            document.getElementById('loadingScreen').style.display = 'none';
        }
    }
}
