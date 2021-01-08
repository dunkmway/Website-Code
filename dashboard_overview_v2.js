//user variables
var userName = "";
var role = "";
var userUID = "";

//business variables
var businessName = "";
var businessUID = "";
var locationData = [];
var gapFeatures = [];

//date variables
var dateRangeNPS = [];
var dateRangeGAP = [];
var dateRangeParticpation = [];

//constants used
let trailingRangeNPS = 7;
let numDaysToCheckNPS = 14;

let trailingRangeGAP = 7;
let numDaysToCheckGAP = 14;

let numDaysToCheckParticipation = 14;

let allowedRoles = ['admin'];
let db = firebase.firestore();

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        //get the current user's profile doc
        userUID = firebase.auth().currentUser.uid;
        userRef = db.collection("business_users").doc(userUID);

        userRef.get()
        //handle the userRef.get() promise
        .then((docUser) => GetUserData(docUser))
        .catch((error) => HandleErrors(error))
        //handle the businessRef.get() promise
        .then((docBusiness) => GetBusinessData(docBusiness))
        .catch((error) => HandleErrors(error))
        //get nps, gap, and participation data
        //all of these documents can be grabbed asynchronously
        //the function we call here will return a promise that will resolve
        //when all of the data has been collected [Promise.all()]
        .then(() => GetSurveyData())
        .catch((error) => HandleErrors(error))
        //calculate and display the data from firebase
        .then(function() {
            displayNav();
            displayNPS();
        })
        .catch((error) => HandleErrors(error));

    }
});

//function retrieves all user data from profile doc
function GetUserData(doc) {
    if (doc.exists) {
        userName = doc.get('name');
        role = doc.get('role');
        businessUID = doc.get('business'); 

        if (allowedRoles.includes(role)) {
            businessRef = db.collection("businesses").doc(businessUID);
            return businessRef.get()
        }
        else {
            //user is not allow access to the dashboard
            document.getElementById("accessDenied").style.display = "flex";
            document.getElementById('accessDeniedButton').addEventListener('click', Logout);
            return Promise.reject("user is not allowed to acces this data")
        }
    }
    else {
        return Promise.reject("User doc does not exist");
    }
    
}

//function retrives all business data from business doc
function GetBusinessData(doc) {
    if (doc.exists) {
        businessName = doc.get('name');
        var locations = doc.get('locations');
        gapFeatures = doc.get('all_gap_features');

        for (var i = 0; i < locations.length; i++) {
            locationData.push(new LocationData(i, locations[i], gapFeatures));
        }
        return Promise.resolve()
    }
    else {
        return Promise.reject("Business doc does not exist");
    }
}

//This function will handle getting all of the survey data
function GetSurveyData() {
    var surveyDataPromises = []

    //get the dates needed for each survey type
    var daysNeededNPS = numDaysToCheckNPS + trailingRangeNPS;
    dateRangeNPS = getDateRange(new Date(), (new Date()).subtractDays(daysNeededNPS));

    var daysNeededGAP = numDaysToCheckGAP + trailingRangeGAP;
    dateRangeGAP = getDateRange(new Date(), (new Date()).subtractDays(daysNeededGAP));
    
    var daysNeededParticpation = numDaysToCheckParticipation;
    dateRangeParticpation = getDateRange(new Date(), (new Date()).subtractDays(daysNeededParticpation));

    //run through each location object and fetch all of the data
    for (var i = 0; i < locationData.length; i++) {
        var npsPromise = locationData[i].fetchNPSData(dateRangeNPS, businessUID);
        surveyDataPromises.concat(npsPromise);

        var gapPromise = locationData[i].fetchGAPData(dateRangeGAP, gapFeatures, businessUID);
        surveyDataPromises.concat(gapPromise);

        var participationPromise = locationData[i].fetchParticipationData(dateRangeParticpation, businessUID);
        surveyDataPromises.concat(participationPromise);
    }

    //return a promise that resolves when all promises have resolved
    //or rejects if one promise rejected
    return Promise.all(surveyDataPromises);
}

//returns a date n number of days from this.date
Date.prototype.subtractDays = function(days) {
    var dat = new Date(this.valueOf())
    dat.setDate(dat.getDate() - days);
    return dat;
}

//returns dates from startDate back to stopDate exclusive
function getDateRange(startDate, stopDate) {
    var dateArray = new Array();
    var currentDate = startDate;
    while (currentDate > stopDate) {
        dateArray.push(currentDate)
        currentDate = currentDate.subtractDays(1);
    }
    return dateArray;
}

//handle firebase fetch errors
//FIXME: this should also show an error screen that prompts the user to 
//it can depend on an error code. For example if the error code shows that
//the user doesn't have access we display the access denied screen 
//firebase errors can show something else
function HandleErrors(err) {
    console.log(err);
    //pass a rejected promise to the next .then
    return Promise.reject(err);
}

function calculateNpsScore(dateIndex, trailing, count, detractors, promoters) {
    var totalCount = 0;
    var totalDetractors = 0;
    var totalPromoters = 0;
    var npsScore = 0;
    for (i = 0; i < trailing; i++) {
        totalCount += count[dateIndex + i];
        totalDetractors += detractors[dateIndex + i];
        totalPromoters += promoters[dateIndex + i];
    }

    if (totalCount != 0) {
        npsScore = (totalPromoters - totalDetractors) / totalCount * 100;
    }
    else {
        npsScore = 0;
    }
    
    return npsScore;
    
}

function displayNav() {
    var docUserName = document.getElementById('userName');
    docUserName.textContent = userName;

    var docBusinessName = document.getElementById('businessName');
    docBusinessName.textContent = businessName;
}

function displayNPS() {
    var totalCount = [];
    var totalDetractors = [];
    var totalPromoters = [];

    var npsLocationList = document.getElementById('nps_locations');
    var npsScoresList = document.getElementById('nps_scores');
    var npsShiftList = document.getElementById('nps_shift');

    for (var i = 0; i < locationData.length; i++) {
        //area breakdown
        var loc = locationData[i];
        var test = loc.npsCount;
        console.log({test});
        var npsToday = calculateNpsScore(0, trailingRangeNPS, loc.npsCount, loc.npsDetractors, loc.npsPromoters);
        var npsYesterday = calculateNpsScore(1, trailingRangeNPS, loc.npsCount, loc.npsDetractors, loc.npsPromoters);
        console.log({npsToday});
        console.log({npsYesterday});
        var shift = npsToday - npsYesterday;

        var location = document.createElement('li');
        location.textContent = locationData[i].locationName;
        npsLocationList.appendChild(location);

        var score = document.createElement('li');
        score.textContent = npsToday.toFixed(1);
        npsScoresList.appendChild(score);

        var liShift = document.createElement('li');
        liShift.textContent = shift.toFixed(1);
        //set the color based on the shift
        if (shift < 0) {
            liShift.style.color = '#ea6463'
        }
        else if (shift > 0) {
            liShift.style.color = '#61c959'
        }
        npsShiftList.appendChild(liShift);


        //sum all of the locations together
        for (var j = 0; j < loc.npsCount; j++) {
            if (totalCount[j] == undefined) {
                totalCount.push(loc.npsCount[j]);
                totalDetractors.push(loc.npsDetractors[j]);
                totalPromoters.push(loc.npsPromoters[j]);
            }
            else {
                totalCount[j] += loc.npsCount[j];
                totalDetractors[j] += loc.npsDetractors[j];
                totalPromoters[j] += loc.npsPromoters[j];
            }
        }

    }

    //current total nps
    var npsTotalScores = [];
    for (var i = 0; i < numDaysToCheckNPS; i++) {
        npsTotal = calculateNpsScore(i, trailingRangeNPS, totalCount, totalDetractors, totalPromoters);
        npsTotalScores.push(npsTotal);
    }

    var npsTodayTotal = npsTotalScores[0];
    var npsYesterdayTotal = npsTotalScores[1];
    var shiftTotal = npsTodayTotal - npsYesterdayTotal;

    var totalScoreElement = document.getElementById('currentTotalNPS');
    totalScoreElement.textContent = npsTodayTotal.toFixed(1);

    var totalShiftElement = document.getElementById("currentTotalNPSShift");
    totalShiftElement.textContent = shiftTotal.toFixed(1);

    //the chart
    GraphNPS(npsTotalScores);
}

function GraphNPS(npsTotalScores) {
    var ctxNPS = document.getElementById('npsChart').getContext('2d');
    var chart = new Chart(ctxNPS, {
        // The type of chart we want to create
        type: 'line',
    
        // The data for our dataset
        data: {
            labels: dateRangeNPS.reverse(),
            datasets: [{
                backgroundColor: '#707070',
                borderColor: '#707070',
                fill: false,
                data: npsTotalScores.reverse()
            }]
        },
    
        // Configuration options go here
        options: {
            responsive: true,
            maintainAspectRatio: false,
            //aspectRatio: 3.0,
            scales: {
                yAxes: [{
                    ticks: {
                        precision: 0,
                        maxTicksLimit: 5,
                        fontFamily: 'Arial',
                        fontColor: '#a9a9a9'
                    },
                    gridLines: {
                        drawBorder: false
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
            },
            tooltips: {
                custom: function(tooltip) {
                    if (!tooltip) return;
                    // disable displaying the color box;
                    tooltip.displayColors = false;
                },
            }
        }
    });
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