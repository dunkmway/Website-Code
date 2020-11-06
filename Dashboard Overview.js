//what I need to do is put up an error screen if the fetch fails
var pageReady = false;

var userName = ""
var businessName = ""
var locations = []

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        // User is signed in.
        var db = firebase.firestore();
        var curUser = firebase.auth().currentUser;
        console.log("current user uid:", curUser.uid)

        var profileDoc = db.collection("business_users").doc(curUser.uid);

        profileDoc.get()
            .then(function(docProfile) {
                if (docProfile.exists) {
                    console.log("got user doc")
                    userName = docProfile.get("name");
                    var business = docProfile.get("business");
                    console.log("username:", userName);
                    console.log("business ID:", business);
                    //set user name
                    //document.getElementById('profileName').innerHTML = userName;

                    var businessDoc = db.collection("businesses").doc(business);
                    
                    businessDoc.get()
                        .then(function(docBusiness) {
                            if (docBusiness.exists) {
                                console.log("got business doc")
                                businessName = docBusiness.get("name");
                                locations = docBusiness.get("locations");
                                
                                //populate nps_locations list
                                var npsLocationList = document.getElementById('nps_locations');
                                for (i = 0; i < locations.length; i++) {
                                    var location = document.createElement('li');
                                    location.textContent = locations[i];
                                    npsLocationList.appendChild(location);
                                }
                                
                                //handle getting the range of dates for the previous n days
                                var trailingRange = 7;

                                Date.prototype.subtractDays = function(days) {
                                    var dat = new Date(this.valueOf())
                                    dat.setDate(dat.getDate() - days);
                                    return dat;
                                }

                                function getDates(startDate, stopDate) {
                                    var dateArray = new Array();
                                    var currentDate = startDate;
                                    while (currentDate >= stopDate) {
                                        dateArray.push(currentDate)
                                        currentDate = currentDate.subtractDays(1);
                                    }
                                    return dateArray;
                                }

                                var dateArray = getDates(new Date(), (new Date()).subtractDays(trailingRange));

                                //check the year(s) needed for the data
                                var yearsNeeded = []
                                for (i = 0; i < dateArray.length; i++) {
                                    var checkYear = String(dateArray[i].getFullYear())
                                    if (!yearsNeeded.includes(checkYear)) {
                                        yearsNeeded.push(checkYear);
                                    }
                                }

                                for (i = 0; i < yearsNeeded.length; i++) {
                                    for (j = 0; j < locations.length; j++) {
                                    let locationNPSDoc = businessDoc.collection("locations").doc(String(j)).collection("campaigns").doc("NPS").collection("year").doc(yearsNeeded[i]);

                                    locationNPSDoc.get()
                                        .then(function(docLocationNPS) {
                                            if(docLocationNPS.exists) {

                                                var totalCount = 0;
                                                var totalDetractors = 0;
                                                var totalPromoters = 0;

                                                for (k = 0; k < dateArray.length; k++) {
                                                    let yearStr = String(dateArray[k].getFullYear());
                                                    let monthStr = String(dateArray[k].getMonth() + 1);
                                                    let dayStr = String(dateArray[k].getDate());
                                                    let dateStr = yearStr + '-' + monthStr + '-' + dayStr;

                                                    //get the totals from this date in the document
                                                    var dayCount = 0
                                                    var numDetractors = 0
                                                    var numPromoters = 0

                                                    dayCount = docLocationNPS.get(`${dateStr}.day_count`);
                                                    numDetractors = docLocationNPS.get(`${dateStr}.num_detractors`);
                                                    numPromoters = docLocationNPS.get(`${dateStr}.num_promoters`);

                                                    if (dayCount != undefined) {
                                                        totalCount += dayCount;
                                                        totalDetractors += numDetractors;
                                                        totalPromoters += numPromoters; 
                                                    }                                             
                                                }
                                                //check the total count so it won't divide by zero
                                                if (totalCount != 0) {
                                                    npsScore = (totalPromoters - totalDetractors) / totalCount * 100;
                                                }
                                                else {
                                                    npsScore = 0;
                                                }
                                                
                                                npsScore = npsScore.toFixed(1);

                                                var npsScoresList = document.getElementById('nps_scores');
                                                var score = document.createElement('li');
                                                score.textContent = npsScore;
                                                npsScoresList.appendChild(score); 

                                                pageReady = true;
                                                closeLoadingScreen();

                                            }
                                            else {
                                                // doc.data() will be undefined in this case
                                                console.log("No such nps year document!");
                                            }
                                        })
                                        .catch(function(locationNPSError) {
                                            console.log("Error getting nps year document", locationNPSError);
                                        });
                                    }
                                }
                                
                            }
                            else {
                                // doc.data() will be undefined in this case
                                console.log("No such business document!");
                            }
                        })
                        .catch(function(businessError) {
                        console.log("Error getting business document:", businessError);
                        });
                }
                else {
                    // doc.data() will be undefined in this case
                    console.log("No such user document!");
                }
            })
            .catch(function(profileError) {
                console.log("Error getting user document:", profileError);
            });
    }
    else {}
});

function closeLoadingScreen() {
    if (siteWideReady && pageReady) {
        if (document.getElementById('loadingScreen')) {
            document.getElementById('loadingScreen').style.display = 'none';
        }
    }
}