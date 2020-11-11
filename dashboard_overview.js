//what I need to do is put up an error screen if the fetch fails
console.log("In the dashboard js file")
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
                                var numDaysToCheck = 7;

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

                                var dateArray = getDates(new Date(), (new Date()).subtractDays(numDaysToCheck + trailingRange));

                                //check the year(s) needed for the data
                                var yearsNeeded = []
                                for (i = 0; i < dateArray.length; i++) {
                                    var checkYear = String(dateArray[i].getFullYear())
                                    if (!yearsNeeded.includes(checkYear)) {
                                        yearsNeeded.push(checkYear);
                                    }
                                }

                                //totals for all of the locations
                                var totalCountArray = []
                                var totalDetractorsArray = []
                                var totalPromotersArray = []
                                var npsDateArray = []
                                for (i = 0; i < yearsNeeded.length; i++) {
                                    for (j = 0; j < locations.length; j++) {
                                    let locationNPSDoc = businessDoc.collection("locations").doc(String(j)).collection("campaigns").doc("NPS").collection("year").doc(yearsNeeded[i]);
                                    var npsScoreArray = [];
                                    npsDateArray = [];

                                    locationNPSDoc.get()
                                        .then(function(docLocationNPS) {
                                            if(docLocationNPS.exists) {

                                                var totalCount = 0;
                                                var totalDetractors = 0;
                                                var totalPromoters = 0;

                                                //get the data needed for all of the dates in the date array
                                                var npsCountArray = [];
                                                var npsDetractorsArray = [];
                                                var npsPromotersArray = [];
                                                for (k = 0; k < dateArray.length; k++) {
                                                    let yearStr = String(dateArray[k].getFullYear());
                                                    let monthStr = String(dateArray[k].getMonth() + 1);
                                                    let dayStr = String(dateArray[k].getDate());
                                                    let dateStr = yearStr + '-' + monthStr + '-' + dayStr;

                                                    //get the totals from this date in the document
                                                    var dayCount = 0;
                                                    var numDetractors = 0;
                                                    var numPromoters = 0;

                                                    dayCount = docLocationNPS.get(`${dateStr}.day_count`);
                                                    numDetractors = docLocationNPS.get(`${dateStr}.num_detractors`);
                                                    numPromoters = docLocationNPS.get(`${dateStr}.num_promoters`);

                                                    //store the totals in an array (0 if no data)
                                                    if (dayCount != undefined) {
                                                        npsCountArray.push(dayCount);
                                                        npsDetractorsArray.push(numDetractors);
                                                        npsPromotersArray.push(numPromoters);  
                                                    }
                                                    else {
                                                        npsCountArray.push(0);
                                                        npsDetractorsArray.push(0);
                                                        npsPromotersArray.push(0);  
                                                    }    
                                                    
                                                    //sum up the totals into their array per day
                                                    if (totalCountArray.length = 0) {
                                                        npsDateArray.push(dateStr);
                                                        totalCountArray.push(dayCount);
                                                        totalDetractorsArray.push(numDetractors);
                                                        totalPromotersArray.push(numPromoters);
                                                    }
                                                    else {
                                                        totalCountArray[k] += dayCount;
                                                        totalDetractorsArray[k] += numDetractors;
                                                        totalPromotersArray[k] += numPromoters;
                                                    }
                                                }

                                                //get the nps scores for the number of days to check
                                                for (k = 0; k < numDaysToCheck; k++) {
                                                    daysScore = calculateNpsScore(k, trailingRange, npsCountArray, npsDetractorsArray, npsPromotersArray);
                                                    npsScoreArray.push(daysScore);
                                                }

                                                //get the nps score for today
                                                todaysNPS = npsScoreArray[0]
                                                var npsScoresList = document.getElementById('nps_scores');
                                                var score = document.createElement('li');
                                                score.textContent = todaysNPS;
                                                npsScoresList.appendChild(score);
                                                
                                                //set the shift since yesterday
                                                yesterdaysNPS = npsScoreArray[1]
                                                var shift = todaysNPS - yesterdaysNPS;
                                                var shiftStr = shift.toFixed(1);
                                                console.log(shiftStr);
                                                var npsShiftList = document.getElementById('nps_shift');
                                                var liShift = document.createElement('li');
                                                liShift.textContent = shiftStr;
                                                npsShiftList.appendChild(liShift);

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
                                //set up the graph
                                //FIXME: Need to calulate the total nps score for all locations, not each one individually
                                //What is happening now is that each location is pushing to the array and then this is getting a lot of data.
                                console.log(npsDateArray);
                                console.log(totalCountArray);
                                var ctx = document.getElementById('npsChart').getContext('2d');
                                var chart = new Chart(ctx, {
                                    // The type of chart we want to create
                                    type: 'line',

                                    // The data for our dataset
                                    data: {
                                        labels: npsDateArray.reverse(),
                                        datasets: [{
                                            label: 'My First dataset',
                                            backgroundColor: 'rgb(255, 99, 132)',
                                            borderColor: 'rgb(255, 99, 132)',
                                            data: npsScoreArray
                                        }]
                                    },

                                    // Configuration options go here
                                    options: {}
                                });
                                
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
    if (document.getElementById('loadingScreen')) {
        document.getElementById('loadingScreen').style.display = 'none';
    }
}

//calculates the nps score given days since today's date and the arrays that stores all of the totals
function calculateNpsScore(daysSinceToday, trailingRange, countArray, detractorsArray, promotersArray) {
    var totalCount = 0;
    var totalDetractors = 0;
    var totalPromoters = 0;
    for (i = 0; i < trailingRange; i++) {
        totalCount += countArray[daysSinceToday + i];
        totalDetractors += detractorsArray[daysSinceToday + i];
        totalPromoters += promotersArray[daysSinceToday + i];
    }

    if (totalCount != 0) {
        npsScore = (totalPromoters - totalDetractors) / totalCount * 100;
    }
    else {
        npsScore = 0;
    }
    
    npsScore = npsScore.toFixed(1);
    return npsScore;
    
}