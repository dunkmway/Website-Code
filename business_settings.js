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
//   },]
//   the path of this document is Firebase.firebase().collection("businesses").document(businessID)


//get the user's name and business name from session storage
var profileName = sessionStorage.getItem("userName");
var profileBusiness = sessionStorage.getItem("businessName");
var businessUID = sessionStorage.getItem("businessUID");

var users = [];

var adminSelected = false;
var userSelected = false;

const editUserImg = "https://uploads-ssl.webflow.com/5f4b05025c871a872cab8713/5ff4b69b2d2ad13718d57d0d_edit%20X.png";

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
        users = docBusiness.get("users");
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
        var namesList = document.getElementById("role_names");
        for (var i = 0; i < userNames.length; i++) {
            var listName = document.createElement('li');
            listName.textContent = userNames[i];
            namesList.appendChild(listName);
        }

        //set the role roles
        var roleList = document.getElementById("role_roles");
        for (var i = 0; i < userRoles.length; i++) {
            var listRole = document.createElement('li');
            listRole.textContent = userRoles[i];
            roleList.appendChild(listRole);
        }

        //set the role edit x's
        var editList = document.getElementById("role_edit");
        for (var i = 0; i < userNames.length; i++) {
            var listEdit = document.createElement('img')
            listEdit.src = editUserImg;
            editList.appendChild(listEdit);
        }
        editList.addEventListener('click', (e) => removeUser(e));

        //set the location names
        var locationsList = document.getElementById("location_names");
        for (var i = 0; i < locations.length; i++) {
            console.log("setting the location list");
            var listLocation = document.createElement('li');
            listLocation.textContent = locations[i];
            locationsList.appendChild(listLocation);
        }
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

var errorMessage = document.getElementById("new_error");
var submitNewUserButton = document.getElementById("submit_new_user_button");
var closeModalButton = document.getElementById("close-modal-button");

submitNewUserButton.addEventListener('click', SubmitNewUser);
adminButton.addEventListener('click', adminPressed);
userButton.addEventListener('click', userPressed);
closeModalButton.addEventListener('click', closeModal);

function SubmitNewUser() {
    // disable the submit button so that multiple function arent called
    submitNewUserButton.disabled = true;
    errorMessage.textContent = "This might take a few moments...";
    //create the user
    var name = newName.value;
    var email = newEmail.value;
    var password = newPassword.value;
    var role;

    if (adminSelected) {
        role = "admin";
    }
    if (userSelected) {
        role = "user";
    }

    if (name == undefined || email == undefined || password == undefined || role == undefined) {
        errorMessage.textContent = "Please fill in all fields and select a role."
        return
    }
    else {
        const createUser = firebase.functions().httpsCallable('adminAddUser');
        createUser({
            name: name,
            email: email,
            password: password,
            role: role,
            businessUID, businessUID,
            allUsers: users,
        })
        .then((result) => {
            console.log(result);

            //add the new user to the list
            var namesList = document.getElementById("role_names");
            var roleList = document.getElementById("role_roles");
            var editList = document.getElementById("role_edit");

            var listName = document.createElement('li');
            listName.textContent = name;
            namesList.appendChild(listName);

            var listRole = document.createElement('li');
            listRole.textContent = role;
            roleList.appendChild(listRole);

            var listEdit = document.createElement('img')
            listEdit.src = editUserImg;
            editList.appendChild(listEdit);

            //reset all of the fields
            adminSelected = false;
            userSelected = false;

            newName.value = "";
            newEmail.value = "";
            newPassword.value = "";
            adminButton.style.backgroundColor = "#7bbf51";
            userButton.style.backgroundColor = "#7bbf51";

            //close the modal
            document.getElementById("new-user-modal").style.display = "none";

            //reenable the button
            submitNewUserButton.disabled = false;
        })
        .catch((error) => {
            errorMessage.textContent = error;

            submitNewUserButton.disabled = false;
        });
    }

    //verify that this has happened and add append this user to the users list and close the modal

    //OR notify the user of an error and prompt them to try again
}

function adminPressed() {
    adminSelected = true;
    userSelected = false;

    adminButton.style.backgroundColor = "#468a00";
    userButton.style.backgroundColor = "#7bbf51";
}

function userPressed() {
    adminSelected = false;
    userSelected = true;

    adminButton.style.backgroundColor = "#7bbf51";
    userButton.style.backgroundColor = "#468a00";
    
}

function closeModal() {
    //clear all of the fields and let webflow handle the modal transistion
    adminSelected = false;
    userSelected = false;

    newName.value = "";
    newEmail.value = "";
    newPassword.value = "";
    adminButton.style.backgroundColor = "#7bbf51";
    userButton.style.backgroundColor = "#7bbf51";
}

function removeUser(e) {
    const modal = document.getElementById("remove-user-modal");
    const userName = document.getElementById("remove-user-name");
    const errMsg = document.getElementById("remove-error");
    const noButton = document.getElementById("remove-user-no-button");
    const yesButton = document.getElementById("remove-user-yes-button");

    const child = e.target;
    // if one of the x's was pressed
    if (child.tagName == "IMG") {
        const index = Array.from(child.parentNode.children).indexOf(child);

        errMsg.textContent = "";
        modal.style.display = "flex";
        userName.textContent = users[index].name;
        noButton.addEventListener('click', function() {
            errMsg.textContent = "";
            modal.style.display = "none";
        });
        yesButton.addEventListener('click', function() {
            yesButton.disabled = true;
            errMsg.textContent = "This might take a few moments...";
            const removeUser = firebase.functions().httpsCallable('adminRemoveUser');
            removeUser({
                userData: users[index],
                businessUID: businessUID,
            }).then((result) => {
                console.log(result);

                //remove that user from the lists
                var namesList = document.getElementById("role_names");
                var roleList = document.getElementById("role_roles");
                var editList = document.getElementById("role_edit");
                
                namesList.removeChild(Array.from(namesList.children)[index]);
                roleList.removeChild(Array.from(roleList.children)[index]);
                editList.removeChild(Array.from(editList.children)[index]);

                //close the modal
                modal.style.display = "none";
                yesButton.disabled = false;
            }).catch((err) => {
                errMsg.textContent = err;
                yesButton.disabled = false;
            });
        });
    }
}

function Logout() {
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
