//This page include the following
// - roles of every employee that has an account connected to the business
// - every location that the business is currently paying for

//The business's profile page should have been fetched already and saved locally. All data needed will be on that document.
// - every business has a profile document. This will contain an array of the uid's of
//   all employees that have an account connected to the business. 
//   The document also has a key of dictionaries with a structure that looks like the following
//   (userUID): {
//               name: (user's name)
//               role: (user's role) 
//              }
//   the path of this document is Firebase.firebase().collection("businesses").document(businessID)

//get the business profile document
var businessProfileDoc = sessionStorage.getItem("businessProfieDoc");
var userProfileDoc = sessionStorage.getItem("userProfileDoc");

//get the user's name and business name
var profileName = userProfileDoc.get("name");
var profileBusiness = businessProfileDoc.get("name");

//set the user's name and business in the top nav bar
docUserName = document.getElementById('userName');
docUserName.textContent = profileName;

docBusinessName = document.getElementById('businessName');
docBusinessName.textContent = profileBusiness;

//get the location names, user names, and user roles
var locations = businessProfileDoc.get("locations");
var userIDs = businessProfileDoc.get("userIDs")

var userNames = [];
var userRoles = [];
for (var i = 0; i < userIDs.length; i++) {
    var userName = businessProfileDoc.get(`${userIDs[0]}.name`);
    var userRole = businessProfileDoc.get(`${userIDs[0]}.role`);

    userNames.append(userName);
    userRoles.append(userRole);
}

//set the role names
userNamesList = document.getElementById("role_names");
for (var i = 0; i < userNames.length; i++) {
    listName = document.createElement('li');
    listName.textContext = userNames[i];
    userNamesList.appendChild(listName);
}

//set the location names
locationsList = document.getElementById("location_names");
for (var i = 0; i < locations.length; i++) {
    listLocation = document.createElement('li');
    listLocation.textContext = locations[i];
    locationsList.appendChild(listLocation);
}

//set the admin role html element

//set the user role html element