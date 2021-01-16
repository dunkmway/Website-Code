//user variables
var userName = "";
var userRole = "";
var userUID = "";

//business variables
var businessName = "";
var businessUIDs = [];
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

let priorNumDaysParticipation = 7;
let currentNumDaysParticipation = 7;

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
            setSessionStorage();
            console.log("Should have grabbed all of the data by now. Moving to display the data");
            displayNav();
            displayNPS();
            displayGAP();
            displayParticipation();
        })
        .catch((error) => HandleErrors(error));

    }
});

//function retrieves all user data from profile doc
function GetUserData(doc) {
    console.log("In GetUserData()");
    if (doc.exists) {
        userName = doc.get('name');
        userRole = doc.get('role');
        businessUIDs = doc.get('business'); 
        businessUID = businessUIDs[0];

        if (allowedRoles.includes(userRole)) {
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
    console.log("In GetBusinessData()");
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
    console.log("In GetSurveyData()");
    var surveyDataPromises = []

    //get the dates needed for each survey type
    var daysNeededNPS = numDaysToCheckNPS + trailingRangeNPS;
    dateRangeNPS = getDateRange(new Date(), (new Date()).subtractDays(daysNeededNPS));

    var daysNeededGAP = numDaysToCheckGAP + trailingRangeGAP;
    dateRangeGAP = getDateRange(new Date(), (new Date()).subtractDays(daysNeededGAP));
    
    var daysNeededParticpation = currentNumDaysParticipation + priorNumDaysParticipation;
    dateRangeParticpation = getDateRange(new Date(), (new Date()).subtractDays(daysNeededParticpation));

    //run through each location object and fetch all of the data
    for (var i = 0; i < locationData.length; i++) {
        var npsPromise = locationData[i].fetchNPSData(dateRangeNPS, businessUID);
        console.log({npsPromise});
        surveyDataPromises.push(npsPromise);

        var gapPromise = locationData[i].fetchGAPData(dateRangeGAP, gapFeatures, businessUID);
        surveyDataPromises.push(gapPromise);

        var participationPromise = locationData[i].fetchParticipationData(dateRangeParticpation, businessUID);
        surveyDataPromises.push(participationPromise);
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

    for (var i = 0; i < trailing; i++) {
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
        var npsToday = calculateNpsScore(0, trailingRangeNPS, loc.npsCount, loc.npsDetractors, loc.npsPromoters);
        var npsYesterday = calculateNpsScore(1, trailingRangeNPS, loc.npsCount, loc.npsDetractors, loc.npsPromoters);
        var shift = npsToday - npsYesterday;

        var location = document.createElement('li');
        location.textContent = loc.locationName;
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
        for (var j = 0; j < loc.npsCount.length; j++) {
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
        npsTotalScores.push(Math.round(npsTotal * 10) / 10);
    }

    var npsTodayTotal = npsTotalScores[0];
    var npsYesterdayTotal = npsTotalScores[1];
    var shiftTotal = npsTodayTotal - npsYesterdayTotal;

    var totalScoreElement = document.getElementById('currentTotalNPS');
    totalScoreElement.textContent = npsTodayTotal.toFixed(1);

    var totalShiftElement = document.getElementById("currentTotalNPSShift");
    totalShiftElement.textContent = shiftTotal.toFixed(1);
    if (shiftTotal < 0) {
        totalShiftElement.style.color = '#ea6463'
    }
    else if (shiftTotal > 0) {
        totalShiftElement.style.color = '#61c959'
    }

    //the chart
    GraphNPS(npsTotalScores, traditionalFormatDates(dateRangeNPS).slice(0, numDaysToCheckNPS));
}

function displayGAP() {
    var gapFeatureList = document.getElementById('gap_features');
    var gapImportanceList = document.getElementById('gap_importance');
    var gapPerformanceList = document.getElementById('gap_performance');

    var gapChartPoints = [];

    //run through each feature and sum up the totals for the locations
    for (var i = 0; i < gapFeatures.length; i++) {
        var totalImportanceCount = 0;
        var totalImportanceSum = 0;
        var totalPerformanceCount = 0;
        var totalPerformanceSum = 0;

        var feature = document.createElement('li');
        feature.textContent = gapFeatures[i];
        gapFeatureList.appendChild(feature);

        for (var j = 0; j < locationData.length; j++) {
            var loc = locationData[j];
            var feat = loc.gapFeatureData[i];
            for (var k = 0; k < feat.featureImportanceCount.length; k++) {
                totalImportanceCount += feat.featureImportanceCount[k];
                totalImportanceSum += feat.featureImportanceSum[k];
                totalPerformanceCount += feat.featurePerformanceCount[k];
                totalPerformanceSum += feat.featurePerformanceSum[k];
            }
        }

        var featureImportanceScore;
        var featurePerformanceScore

        if (totalImportanceCount != 0) {
            featureImportanceScore = totalImportanceSum / totalImportanceCount;
        }
        else {
            featureImportanceScore = 0;
        }

        if (totalPerformanceCount != 0) {
            featurePerformanceScore = totalPerformanceSum / totalPerformanceCount;
        }
        else {
            featurePerformanceScore = 0;
        }

        var importanceScore = document.createElement('li');
        importanceScore.textContent = featureImportanceScore.toFixed(1);
        gapImportanceList.appendChild(importanceScore);

        var performanceScore = document.createElement('li');
        performanceScore.textContent = featurePerformanceScore.toFixed(1);
        gapPerformanceList.appendChild(performanceScore);

        //set the points to be used in the chart
        gapChartPoints.push({x:Math.round(featureImportanceScore * 10) / 10, y:Math.round(featurePerformanceScore * 10) / 10});
    }

    GraphGAP(gapChartPoints);
}

function displayParticipation() {
    var totalParticipationCount = [];

    for (var i = 0; i < locationData.length; i++) {
        var loc = locationData[i];
        for (var j = 0; j < loc.participationCount.length; j++) {
            if (totalParticipationCount[j] == undefined) {
                totalParticipationCount.push(loc.participationCount[j]);
            }
            else {
                totalParticipationCount[j] += loc.participationCount[j];
            }
        }
    }

    console.log(totalParticipationCount);

    var currentTotal = 0;
    for (var i = 0; i < currentNumDaysParticipation; i++) {
        currentTotal += totalParticipationCount[i];
    }

    var priorTotal = 0;
    for (var i = currentNumDaysParticipation; i < totalParticipationCount.length; i++) {
        priorTotal += totalParticipationCount[i];
    }

    var weeklyTotalElement = document.getElementById('participationWeeklyTotal');
    var priorWeeklyTotalElement = document.getElementById('participationPriorWeeklyTotal');

    weeklyTotalElement.textContent = currentTotal;
    priorWeeklyTotalElement.textContent = priorTotal;

    //get the past "currentNumDaysParticipation" written in terms of the abbreviations
    let dayAbbrev = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S'];
    var strParticipationDates = [];
    for (i = 0; i < currentNumDaysParticipation; i++) {
        var day = dayAbbrev[(dateRangeParticpation[i].getDay()) % dayAbbrev.length];
        strParticipationDates.push(day);
    }

    //get the average value for the past "currentNumDaysParticipation"
    var avg = currentTotal / currentNumDaysParticipation.length;

    //graph the chart 
    GraphParticipation(strParticipationDates, totalParticipationCount.slice(0, currentNumDaysParticipation), avg);

}

function GraphNPS(scores, days) {
    var ctxNPS = document.getElementById('npsChart').getContext('2d');
    var chart = new Chart(ctxNPS, {
        // The type of chart we want to create
        type: 'line',
    
        // The data for our dataset
        data: {
            labels: days.reverse(),
            datasets: [{
                backgroundColor: '#707070',
                borderColor: '#707070',
                fill: false,
                data: scores.reverse()
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

function GraphGAP(scores) {
    var ctxGAP = document.getElementById("gapChart").getContext("2d");

    var config = {
        // The type of chart we want to create
        type: 'scatter',
        data: {
            labels: gapFeatures,
            datasets: [{
            data: scores,
            borderColor: '#47a2ee',
            backgroundColor: '#47a2ee',
            pointRadius: 4
            }]
        },

        // Configuration options go here
        options: {
            optimalLine: true,
            responsive: true,
            maintainAspectRatio: false,
            aspectRatio: 1,
            scales: {
                yAxes: [{
                    ticks: {
                        display: false,
                        min: 0,
                        max: 11
                    },
                    gridLines: {
                        drawOnChartArea: false,
                        lineWidth: 3,
                        color: '#707070',
                        drawTicks: false
                    },
                    scaleLabel: {
                        display: true,
                        labelString: "performance",
                        fontColor: '#a9a9a9',
                        fontSize: 24,
                        fontFamily: "Arial"
                    }
                }],
                xAxes: [{
                    ticks: {
                        display: false,
                        min: 0,
                        max: 11
                    },
                    gridLines: {
                        drawOnChartArea: false,
                        lineWidth: 3,
                        color: '#707070',
                        drawTicks: false
                    },
                    scaleLabel: {
                        display: true,
                        labelString: "importance",
                        fontColor: '#a9a9a9',
                        fontSize: 24,
                        fontFamily: "Arial"
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
                mode: 'index',
                callbacks: {
                    title: function(tooltipItem, data) {
                        return data.labels[tooltipItem[0].index];
                    },
                    label: function(tooltipItem, data) {
                        var xValue = tooltipItem.xLabel;
                        var yValue = tooltipItem.yLabel;
                        return ["performance: " + yValue, "importance: " + xValue];
                    }
                }
            }
        }
    }
    let gapChart = new Chart(ctxGAP, config);
}

function GraphParticipation(days, counts, average) {
    var ctxParticipation = document.getElementById('participationChart').getContext('2d');
    var chart = new Chart(ctxParticipation, {
        // The type of chart we want to create
        type: 'bar',
        data: {
            labels: days.reverse(),
            datasets: [{
                borderColor: '##a9a9a9',
                backgroundColor: '#a9a9a9',
                barPercentage: .5,
                data: counts.reverse()
            }]
        },

        // Configuration options go here
        options: {
            lineValue: average,
            responsive: true,
            maintainAspectRatio: false,
            layout: {
                padding: {
                    left: 20,
                    right: 20,
                }
            },
            //aspectRatio: 1,
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
                        display: true,
                        fontFamily: 'Arial',
                        fontColor: '#a9a9a9'
                    },
                    gridLines: {
                        drawOnChartArea: false,
                        drawTicks: false
                    }
                }]
            },
            legend: {
                display: false
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

/**
 * Logs the user out and returns them to the home page
 */
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

/**
 * Formats date objects into the form mm-dd-yyyy.
 * Returns an array of strings.
 * @param {array} dates array of date objects
 */
function traditionalFormatDates(dates) {
    var strRange = [];
    for (var i = 0; i < dates.length; i++) {
        let yearStr = String(dates[i].getFullYear());
        let monthStr = ("0" + String(dates[i].getMonth() + 1)).slice(-2);
        let dayStr = ("0" + String(dates[i].getDate())).slice(-2);
        let dateStr = monthStr + '-' + dayStr + '-' + yearStr;
        strRange.push(dateStr);
    }
    return strRange;
}

/**
 * Any variables that will be stored to the session must be set in this function
 */
function setSessionStorage() {
    sessionStorage.setItem("userName", userName);
    sessionStorage.setItem("userRole", userRole);
    sessionStorage.setItem("userUID", userUID);

    sessionStorage.setItem("businessName", businessName);
    sessionStorage.setItem("businessUID", businessUID);
}

//set up the chart plugins

//Draw a diagonal line from the bottom left to the top right of the graph and label it "optimal"
Chart.pluginService.register({
    afterDraw: function(chart) {
        if (chart.config.options.optimalLine) {
            var ctxPlugin = chart.chart.ctx;
            var xAxis = chart.scales[chart.config.options.scales.xAxes[0].id];
            var yAxis = chart.scales[chart.config.options.scales.yAxes[0].id];
            
            ctxPlugin.strokeStyle = '#a9a9a9';
            ctxPlugin.beginPath();
            ctxPlugin.moveTo(xAxis.left, yAxis.bottom);
            ctxPlugin.lineTo(xAxis.right, yAxis.top);
            ctxPlugin.stroke();

            ctxPlugin.save();
            ctxPlugin.translate(xAxis.right - 50,yAxis.top + 45);
            var rotation = Math.atan((yAxis.top - yAxis.bottom) / (xAxis.right - xAxis.left))
            ctxPlugin.rotate(rotation);

            var diagonalText = 'optimal';
            ctxPlugin.font = "12px Arial";
            ctxPlugin.fillStyle = "#a9a9a9";
            ctxPlugin.fillText(diagonalText, 0, 0);
            ctxPlugin.restore();
        }
    }
});

//draw a horizontal line at the given y value
Chart.pluginService.register({
    afterDraw: function(chart) {
        var lineValue = chart.config.options.lineValue;
        if (chart.config.options.lineValue) {
        var ctxPlugin = chart.chart.ctx;
        var xAxis = chart.scales[chart.config.options.scales.xAxes[0].id];
        var point = chart.scales[chart.config.options.scales.yAxes[0].id].getPixelForValue(lineValue)
    
        ctxPlugin.strokeStyle = '#ea6463';
        ctxPlugin.beginPath();
        ctxPlugin.moveTo(xAxis.left, point);
        ctxPlugin.lineTo(xAxis.right, point);
        ctxPlugin.stroke();
    
        var text = 'avg';
        ctxPlugin.font = "12px Arial";
        ctxPlugin.fillStyle = "#ea6463";
        ctxPlugin.fillText(text, xAxis.left - 20, point + 3); 
        }
    }
    });