document.getElementById('loginButton').addEventListener('click', login);

function login() {
    document.getElementById('loginError').style.display = 'none';

    var username = document.getElementById('loginUsername').value;
    var password = document.getElementById('loginPassword').value;

    firebase.auth().signInWithEmailAndPassword(username, password)
        .then(function() {
            window.location.replace('/dashboard');
        })
        .catch(function(error) {
            // Handle Errors here.
            var errorCode = error.code;
            var errorMessage = error.message;
            console.log('Error code: ' + errorCode);
            console.log('Error message: ' + errorMessage);
            document.getElementById('loginError').innerHTML = errorMessage;
            document.getElementById('loginError').style.display = 'block';
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
