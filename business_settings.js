//This page include the following
// - roles of every employee that has an account connected to the business
// - every location that the business is currently paying for

//The business's profile page should have been fetched already and saved locally. All data needed will be on that document.
// - every business has a profile document. This will contain an array of the uid's of
//   all employees that have an account connected to the business. 
//   The document also has an array of dictionaries with a structure that looks like the following
//   users[{
//          name: (user's name),
//          role: (user's role),
//          uid: (user's uid)
//   }]
//   the path of this document is Firebase.firebase().collection("businesses").document(businessID)


//get the user's name and business name from session storage
var profileName = sessionStorage.getItem("userName");
var profileBusiness = sessionStorage.getItem("businessName");
var businessUID = sessionStorage.getItem("businessUID");

//set the user's name and business in the top nav bar
docUserName = document.getElementById('userName');
docUserName.textContent = profileName;

docBusinessName = document.getElementById('businessName');
docBusinessName.textContent = profileBusiness;

//get the location names, user names, and user roles from firebase
var businessDoc = firebase.firestore().collection("businesses").doc(businessUID);

businessDoc.get()
.then(function(docBusiness) {
    if (docBusiness.exists) {
        var locations = docBusiness.get("locations");
        var users = docBusiness.get("users");
        console.log(locations);
        console.log(users);

        console.log("Test before first loop");
        var userNames = [];
        var userRoles = [];
        var userUIDS = [];
        for (var i = 0; i < users.length; i++) {
            var userName = users[i].name
            var userRole = users[i].role
            var userUID = users[i].uid

            userNames.push(userName);
            userRoles.push(userRole);
            userUIDS.push(userUID);
        }
        console.log("Test after first loop")
        console.log(userNames);
        console.log(userRoles);
        console.log(userUIDS);

        //set the role names
        var userNamesList = document.getElementById("role_names");
        for (var i = 0; i < userNames.length; i++) {
            var listName = document.createElement('li');
            listName.textContent = userNames[i];
            userNamesList.appendChild(listName);
        }

        //set the role roles
        var roleList = document.getElementById("role_roles");
        for (var i = 0; i < userRoles.length; i++) {
            var listRole = document.createElement('li');
            listRole.textContent = userRoles[i];
            roleList.appendChild(listRole);
        }

        //set the location names
        var locationsList = document.getElementById("location_names");
        for (var i = 0; i < locations.length; i++) {
            console.log("setting the location list");
            var listLocation = document.createElement('li');
            listLocation.textContent = locations[i];
            locationsList.appendChild(listLocation);
        }

        //set the admin role html element

        //set the user role html element
    }
})
.catch(function(businessError) {
    console.log("Error reading business doc:", businessError);
});

//handle the new user submission
var newName = document.getElementById("new_name");
var newEmail = document.getElementById("new_email");
var newPassword = document.getElementById("new_password")

var adminButton = document.getElementById("admin_button");
var userButton = document.getElementById("user_button");

var submitNewUserButton = document.getElementById("submit_new_user_button")

submitNewUserButton.addEventListener('click', SubmitNewUser);

function SubmitNewUser() {
    //create the user

    //set up their business_user doc

    //add them to their business's userIDs array and to the user map

    //verify that this has happened and add append this user to the users list and close the modal

    //OR notify the user of an error and prompt them to try again
}
