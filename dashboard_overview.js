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
                    docUserName = document.getElementById('userName');
                    docUserName.textContent = userName;
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
                                docBusinessName = document.getElementById('businessName');
                                docBusinessName.textContent = businessName;
                                var locations = docBusiness.get("locations");
                                var gapFeatures = docBusiness.get("all_gap_features");
                                
                                //populate nps_locations list
                                var npsLocationList = document.getElementById('nps_locations');
                                for (var i = 0; i < locations.length; i++) {
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
                                for (var i = 0; i < dateArray.length; i++) {
                                    var checkYear = String(dateArray[i].getFullYear())
                                    if (!yearsNeeded.includes(checkYear)) {
                                        yearsNeeded.push(checkYear);
                                    }
                                }

                                //totals for all of the locations
                                var totalCountArray = new Array(dateArray.length).fill(0);
                                var totalDetractorsArray = new Array(dateArray.length).fill(0);
                                var totalPromotersArray = new Array(dateArray.length).fill(0);

                                //This array will store a list of arrays that contain zeros for each day in dateArray for each feature
                                // var gapImportanceCountTotals = []
                                // var gapPerformanceCountTotals = []
                                // var gapImportanceSumTotals = []
                                // var gapPerformanceSumTotals = []
                                // for (var i = 0; i < gapFeatures.length; i++) {
                                //     gapImportanceCountTotals.push(0)
                                //     gapPerformanceCountTotals.push(0)
                                //     gapImportanceSumTotals.push(0)
                                //     gapPerformanceSumTotals.push(0)
                                // }

                                var gapGraphPoints = [];

                                var strDateArray = []

                                for (var i = 0; i < dateArray.length; i++) {
                                    let yearStr = String(dateArray[i].getFullYear());
                                    let monthStr = String(dateArray[i].getMonth() + 1);
                                    let dayStr = String(dateArray[i].getDate());
                                    let dateStr = yearStr + '-' + monthStr + '-' + dayStr;
                                    strDateArray.push(dateStr);
                                }

                                console.log({npsDateArray: strDateArray});
                                var npsPromises = [];
                                var gapPromises = [];

                                for (var i = 0; i < yearsNeeded.length; i++) {
                                    for (var j = 0; j < locations.length; j++) {
                                    let locationNPSDoc = businessDoc.collection("locations").doc(String(j)).collection("campaigns").doc("NPS").collection("year").doc(yearsNeeded[i]);

                                    //NPS data
                                    var promise = locationNPSDoc.get()
                                        .then(function(docLocationNPS) {
                                            if(docLocationNPS.exists) {

                                                //get the data needed for all of the dates in the date array
                                                var npsCountArray = [];
                                                var npsDetractorsArray = [];
                                                var npsPromotersArray = [];
                                                var npsScoreArray = [];

                                                console.log({npsDateArray: strDateArray});
                                                for (var k = 0; k < strDateArray.length; k++) {
                                                    //get the totals from this date in the document
                                                    var dayCount = 0;
                                                    var numDetractors = 0;
                                                    var numPromoters = 0;

                                                    dayCount = docLocationNPS.get(`${strDateArray[k]}.day_count`);
                                                    numDetractors = docLocationNPS.get(`${strDateArray[k]}.num_detractors`);
                                                    numPromoters = docLocationNPS.get(`${strDateArray[k]}.num_promoters`);

                                                    //store the totals in an array (0 if no data)
                                                    if (dayCount != undefined) {
                                                        npsCountArray.push(dayCount);
                                                        npsDetractorsArray.push(numDetractors);
                                                        npsPromotersArray.push(numPromoters); 
                                                        
                                                        //sum up the totals into their array per day
                                                        totalCountArray[k] = totalCountArray[k] + dayCount;
                                                        totalDetractorsArray[k] = totalDetractorsArray[k] + numDetractors;
                                                        totalPromotersArray[k] = totalPromotersArray[k] + numPromoters;
                                                    }
                                                    else {
                                                        npsCountArray.push(0);
                                                        npsDetractorsArray.push(0);
                                                        npsPromotersArray.push(0);  

                                                        //sum up the totals into their array per day
                                                        //nothing was saved so don't add anything
                                                    }
                                                }

                                                //get the nps scores for the number of days to check
                                                console.log({npsCountArray});
                                                console.log({npsDetractorsArray});
                                                console.log({npsPromotersArray});
                                                for (var k = 0; k < numDaysToCheck; k++) {
                                                    var daysScore = calculateNpsScore(k, trailingRange, npsCountArray, npsDetractorsArray, npsPromotersArray);
                                                    console.log({daysScore});
                                                    npsScoreArray.push(daysScore);
                                                }

                                                //get the nps score for today
                                                console.log({npsScoreArray})
                                                var todaysNPS = npsScoreArray[0]
                                                console.log({todaysNPS});
                                                var npsScoresList = document.getElementById('nps_scores');
                                                var score = document.createElement('li');
                                                score.textContent = todaysNPS.toFixed(1);
                                                npsScoresList.appendChild(score);
                                                
                                                //set the shift since yesterday
                                                var yesterdaysNPS = npsScoreArray[1]
                                                console.log({yesterdaysNPS});
                                                var shift = todaysNPS - yesterdaysNPS;
                                                var shiftStr = shift.toFixed(1);
                                                console.log(shiftStr);
                                                var npsShiftList = document.getElementById('nps_shift');
                                                var liShift = document.createElement('li');
                                                liShift.textContent = shiftStr;
                                                //set the color based on the shift
                                                if (shift < 0) {
                                                    liShift.style.color = 'red'
                                                }
                                                else if (shift > 0) {
                                                    liShift.style.color = 'green'
                                                }
                                                npsShiftList.appendChild(liShift);
                                            }
                                            else {
                                                // doc.data() will be undefined in this case
                                                console.log("No such nps year document!");
                                                //set the location data to 0 if they don't have documents

                                                //get the nps score for today
                                                var todaysNPS = 0
                                                console.log({todaysNPS});
                                                var npsScoresList = document.getElementById('nps_scores');
                                                var score = document.createElement('li');
                                                score.textContent = todaysNPS.toFixed(1);
                                                npsScoresList.appendChild(score);
                                                
                                                //set the shift since yesterday
                                                var yesterdaysNPS = 0
                                                console.log({yesterdaysNPS});
                                                var shift = todaysNPS - yesterdaysNPS;
                                                var shiftStr = shift.toFixed(1);
                                                console.log(shiftStr);
                                                var npsShiftList = document.getElementById('nps_shift');
                                                var liShift = document.createElement('li');
                                                liShift.textContent = shiftStr;
                                                npsShiftList.appendChild(liShift);
                                            }
                                        })
                                        .catch(function(locationNPSError) {
                                            console.log("Error getting nps year document", locationNPSError);
                                        });
                                        npsPromises.push(promise);
                                    }

                                    for (var k = 0; k < gapFeatures.length; k++) {
                                        //set the feature list
                                        var gapFeatureList = document.getElementById('gap_features');
                                        var feature = document.createElement('li');
                                        feature.textContent = gapFeatures[k];
                                        gapFeatureList.appendChild(feature);

                                        let locationGAPDoc = businessDoc.collection("locations").doc(String(j)).collection("campaigns").doc("GAP").collection("features").doc(String(k)).collection("year").doc(yearsNeeded[i])
                                        var promise = locationGapDoc.get()
                                            .then(function(docLocationGAP) {

                                                importanceCountTotal = 0;
                                                importanceSumTotal = 0;
                                                performanceCountTotal = 0;
                                                performanceSumTotal = 0;
                                                for (var l = 0; l < strDateArray.length; l++) {
                                                    //get the totals from this date in the document
                                                    var importanceCount = 0;
                                                    var importanceSum = 0;
                                                    var performanceCount = 0;
                                                    var performanceSum = 0;

                                                    importanceCount = docLocationGAP.get(`${strDateArray[l]}.importance_day_count`);
                                                    importanceSum = docLocationGAP.get(`${strDateArray[l]}.importance_day_sum`);
                                                    performanceCount = docLocationGAP.get(`${strDateArray[l]}.performance_day_count`);
                                                    performanceSum = docLocationGAP.get(`${strDateArray[l]}.performance_day_sum`);

                                                    //store the totals in an array (0 if no data)
                                                    if (importanceCount != undefined) {
                                                        importanceCountTotal += importanceCountTotal + importanceCount;
                                                        importanceSumTotal += importanceSumTotal + importanceSum;
                                                    }
                                                    if (performanceCount != undefined) {
                                                        performanceCountTotal += performanceCountTotal + performanceCount;
                                                        performanceSumTotal += performanceSumTotal + performanceSum;
                                                    }
                                                }
                                                //calculate the averages for the perforamnce and importance
                                                var importanceAvg = importanceCountTotal/importanceSumTotal;
                                                var importanceAvgSTR = importanceAvg.toFixed(1);

                                                var performanceAvg = performanceSumTotal/performanceCount;
                                                var performanceAvgSTR = performanceAvg.toFixed(1);

                                                gapGraphPoints.push(new Point(importanceAvg, performanceAvg))

                                                //set the averages for the feature in performance and importance
                                                var gapPerforamnceList = document.getElementById('gap_performance');
                                                var score = document.createElement('li');
                                                score.textContent = performanceAvgSTR;
                                                gapPerforamnceList.appendChild(score);

                                                var gapImportanceList = document.getElementById('gap_importance');
                                                var score = document.createElement('li');
                                                score.textContent = importanceAvgSTR;
                                                gapImportanceList.appendChild(score);
                                            })
                                            .catch (function(locationGAPError) {
                                                console.log("Error getting gap year document", locationGAPError);
                                            });
                                        gapPromises.push(promise);
                                    }
                                }
                                //set up the graph
                                //FIXME: Need to calulate the total nps score for all locations, not each one individually
                                //What is happening now is that each location is pushing to the array and then this is getting a lot of data.

                                //need to only get the npsDates that we are requesting which is numDaysToCheck
                                //if this is the final time calulating the scores then calculate the totals
                                Promise.allSettled(npsPromises).then(function(getNPSTotals) {
                                    console.log("In the if statement to create the graph.")
                                    var tmpDateArray = []
                                    for (k = 0; k < numDaysToCheck; k++) {
                                        tmpDateArray.push(strDateArray[k]);
                                    }
                                    strDateArray = tmpDateArray;
                                    console.log({totalCountArray})
                                    console.log({totalDetractorsArray})
                                    console.log({totalPromotersArray})

                                    var npsTotalScores = []
                                    for (k = 0; k < strDateArray.length; k++) {
                                        daysScore = calculateNpsScore(k, trailingRange, totalCountArray, totalDetractorsArray, totalPromotersArray);
                                        npsTotalScores.push(daysScore.toFixed(1));
                                    }
                                    //get the totals for today and yesterday for the shift
                                    //get the nps score for today
                                    var todaysTotalNPS = parseFloat(npsTotalScores[0]);
                                    console.log({todaysTotalNPS});
                                    var totalScoreElement = document.getElementById('currentTotalNPS');
                                    totalScoreElement.textContent = todaysTotalNPS.toFixed(1);
                                    
                                    //set the shift since yesterday
                                    var yesterdaysTotalNPS = parseFloat(npsTotalScores[1]);
                                    console.log({yesterdaysTotalNPS});
                                    var totalShift = todaysTotalNPS - yesterdaysTotalNPS;
                                    var totalShiftElement = document.getElementById("currentTotalNPSShift");
                                    totalShiftElement.textContent = totalShift.toFixed(1);
                                    //set the color based on the shift
                                    if (totalShift < 0) {
                                        totalShiftElement.style.color = "red"
                                    }
                                    else if (totalShift > 0) {
                                        totalShiftElement.style.color = "green"
                                    }

                                    closeLoadingScreen();
                                    var ctxNPS = document.getElementById('npsChart').getContext('2d');
                                    var chart = new Chart(ctxNPS, {
                                        // The type of chart we want to create
                                        type: 'line',
                                    
                                        // The data for our dataset
                                        data: {
                                            labels: strDateArray.reverse(),
                                            datasets: [{
                                                backgroundColor: '#707070',
                                                borderColor: '#707070',
                                                fill: false,
                                                data: npsTotalScores.reverse()
                                            }]
                                        },
                                    
                                        // Configuration options go here
                                        options: {
                                            scales: {
                                                yAxes: [{
                                                    ticks: {
                                                        precision: 0,
                                                        maxTicksLimit: 5
                                                    },
                                                    position: 'right'
                                                }],
                                                xAxes: [{
                                                    ticks: {
                                                        display: false
                                                    },
                                                    gridLines: {
                                                        display: false
                                                    },
                                                    scaleLabel: {
                                                        display: false
                                                    }
                                                }]
                                            },
                                            legend: {
                                                display: false
                                            },
                                            layout: {
                                                padding: {
                                                    left: 10
                                                }
                                            }
                                        }
                                    });
                                });

                                Promise.allSettled(gapPromises).then(function(setGAPGraph) {
                                    //create the data points
                                    var ctxGAP = document.getElementById('gapChart').getContext('2d');
                                    var chart = new Chart(ctxGAP, {
                                        // The type of chart we want to create
                                        type: 'scatter',
                                        data: {
                                            datasets: [{
                                                data: gapGraphPoints
                                            }]
                                        }
                                    });
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
    var npsScore = 0;
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
    
    return npsScore;
    
}
