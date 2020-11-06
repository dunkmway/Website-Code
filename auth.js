src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/2.8.0/Chart.js";

//<!-- The core Firebase JS SDK is always required and must be listed first -->
src="https://www.gstatic.com/firebasejs/8.0.0/firebase-app.js";

//<!-- TODO: Add SDKs for Firebase products that you want to use https://firebase.google.com/docs/web/setup#available-libraries -->
src="https://www.gstatic.com/firebasejs/8.0.0/firebase-analytics.js"
src="https://www.gstatic.com/firebasejs/8.0.0/firebase-auth.js"
src="https://www.gstatic.com/firebasejs/8.0.0/firebase-firestore.js"

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
var firebaseConfig = {
apiKey: "AIzaSyAul6SMVDguBf97OjE8sDNFyXyb9LfPQls",
authDomain: "n-gauge.firebaseapp.com",
databaseURL: "https://n-gauge.firebaseio.com",
projectId: "n-gauge",
storageBucket: "n-gauge.appspot.com",
messagingSenderId: "769784749835",
appId: "1:769784749835:web:5fefde03c89ebc4e7fcc0e",
measurementId: "G-CBSGBT32PW"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

//set auth persistence to session
firebase.auth().setPersistence(firebase.auth.Auth.Persistence.SESSION)
.then(function() {
// Existing and future Auth states are now persisted in the current
// session only. Closing the window would clear any existing state even
// if a user forgets to sign out.
// ...
// New sign-in will be persisted with session persistence.
return firebase.auth().signInWithEmailAndPassword(email, password);
})
.catch(function(error) {
// Handle Errors here.
var errorCode = error.code;
var errorMessage = error.message;
});

var privatePages = [
    '/dashboard'
]

var publicPages = [
    '/login'
]

var siteWideReady = false;

firebase.auth().onAuthStateChanged(function (user) {
    var currentPath = window.location.pathname;
    if (user) {
        //User is logged in
        if (publicPages.includes(currentPath)) {
            window.location.replace('/');
        }
        else {
            console.log('User is logged in!');
            if (document.getElementById('navDashboard')) {
                document.getElementById('navDashboard').style.display = 'inline-block';
            }
            if (document.getElementById('navLogout')) {
                document.getElementById('navLogout').style.display = 'inline-block';
            }
            if (document.getElementById('navLogin')) {
                document.getElementById('navLogin').style.display = 'none';
            }
            siteWideReady = true;
            closeLoadingScreen();
        }
    }
    else {
        //User is logged out
        if (privatePages.includes(currentPath)) {
            window.location.replace('/');
        }
        else {
            console.log('No user is logged in')
            if (document.getElementById('navDashboard')) {
                document.getElementById('navDashboard').style.display = 'none';
            }
            if (document.getElementById('navLogout')) {
                document.getElementById('navLogout').style.display = 'none';
            }
            if (document.getElementById('navLogin')) {
                document.getElementById('navLogin').style.display = 'inline-block';
            }
            siteWideReady = true;
            closeLoadingScreen();
        }
    }
})


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