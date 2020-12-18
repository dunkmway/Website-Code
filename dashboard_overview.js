//what I need to do is put up an error screen if the fetch fails
//commit test
console.log("In the dashboard js file")
var userName = ""
var businessName = ""
var role = ""
var locations = []

let allowedRoles = ['admin'];

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
                    role = docProfile.get("role");
                    docUserName = document.getElementById('userName');
                    docUserName.textContent = userName;
                    var business = docProfile.get("business");
                    console.log("role: ", role);
                    console.log("username:", userName);
                    console.log("business ID:", business);
                    //set user name
                    //document.getElementById('profileName').innerHTML = userName;

                    var businessDoc = db.collection("businesses").doc(business);
                    
                    if (allowedRoles.includes(role)) {
                        businessDoc.get()
                        .then(function(docBusiness) {
                            if (docBusiness.exists) {
                                console.log("got business doc")
                                businessName = docBusiness.get("name");
                                docBusinessName = document.getElementById('businessName');
                                docBusinessName.textContent = businessName;
                                var locations = docBusiness.get("locations");
                                var gapFeatures = docBusiness.get("all_gap_features");

                                //cut the location names and feature names to be n characters long
                                let stringMaxLength = 14;
                                for (var i = 0; i < locations.length; i++) {
                                    if (locations[i].length > stringMaxLength) {
                                        locations[i] = locations[i].slice(0,stringMaxLength - 3) + "...";
                                    }
                                }

                                for (var i = 0; i < gapFeatures.length; i++) {
                                    if (gapFeatures[i].length > stringMaxLength) {
                                        gapFeatures[i] = gapFeatures[i].slice(0,stringMaxLength - 3) + "..."
                                    }
                                }
                                
                                //populate nps_locations list
                                var npsLocationList = document.getElementById('nps_locations');
                                for (var i = 0; i < locations.length; i++) {
                                    var location = document.createElement('li');
                                    location.textContent = locations[i];
                                    npsLocationList.appendChild(location);
                                }

                                //populate the gap_features list
                                for (var i = 0; i < gapFeatures.length; i++) {
                                    var gapFeatureList = document.getElementById('gap_features');
                                    var feature = document.createElement('li');
                                    feature.textContent = gapFeatures[i];
                                    gapFeatureList.appendChild(feature);
                                }
                                
                                //handle getting the range of dates for the previous n days
                                var trailingRange = 7;
                                var numDaysToCheck = 14;

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

                                //NPS totals
                                var totalCountArray = new Array(dateArray.length).fill(0);
                                var totalDetractorsArray = new Array(dateArray.length).fill(0);
                                var totalPromotersArray = new Array(dateArray.length).fill(0);

                                //GAP totals
                                var importanceCountTotals = new Array(gapFeatures.length).fill(0);
                                var importanceSumTotals = new Array(gapFeatures.length).fill(0);
                                var performanceCountTotals = new Array(gapFeatures.length).fill(0);
                                var performanceSumTotals = new Array(gapFeatures.length).fill(0);

                                //Participation totals
                                var totalParticipationCount = new Array(dateArray.length).fill(0);

                                var gapGraphPoints = [];

                                var strDateArray = []

                                for (var i = 0; i < dateArray.length; i++) {
                                    let yearStr = String(dateArray[i].getFullYear());
                                    let monthStr = ("0" + String(dateArray[i].getMonth() + 1)).slice(-2);
                                    let dayStr = ("0" + String(dateArray[i].getDate())).slice(-2);
                                    let dateStr = yearStr + '-' + monthStr + '-' + dayStr;
                                    strDateArray.push(dateStr);
                                }

                                console.log({strDateArray})

                                //console.log({npsDateArray: strDateArray});
                                var npsPromises = [];
                                var gapPromises = [];
                                var participationPromises = [];


                                for (var i = 0; i < yearsNeeded.length; i++) {
                                    for (var j = 0; j < locations.length; j++) {
                                        console.log("Grabbing NPS data for location " + String(j))

                                        //NPS data
                                        let locationNPSDoc = businessDoc.collection("locations").doc(String(j)).collection("campaigns").doc("NPS").collection("year").doc(yearsNeeded[i]);
                                        var npsPromise = locationNPSDoc.get()
                                            .then(function(docLocationNPS) {
                                                if(docLocationNPS.exists) {

                                                    //get the data needed for all of the dates in the date array
                                                    var npsCountArray = [];
                                                    var npsDetractorsArray = [];
                                                    var npsPromotersArray = [];
                                                    var npsScoreArray = new Array(numDaysToCheck).fill(0);

                                                    //console.log({npsDateArray: strDateArray});
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
                                                    console.log("Outputting the arrays for each day")
                                                    console.log({npsCountArray});
                                                    console.log({npsDetractorsArray});
                                                    console.log({npsPromotersArray});
                                                    for (var k = 0; k < numDaysToCheck; k++) {
                                                        var daysScore = calculateNpsScore(k, trailingRange, npsCountArray, npsDetractorsArray, npsPromotersArray);
                                                        console.log({daysScore});
                                                        npsScoreArray[k] = daysScore;
                                                    }

                                                    console.log({npsScoreArray});

                                                    //get the nps score for today
                                                    //console.log({npsScoreArray});
                                                    var todaysNPS = npsScoreArray[0]
                                                    //console.log({todaysNPS});
                                                    var npsScoresList = document.getElementById('nps_scores');
                                                    var score = document.createElement('li');
                                                    score.textContent = todaysNPS.toFixed(1);
                                                    npsScoresList.appendChild(score);
                                                    
                                                    //set the shift since yesterday
                                                    var yesterdaysNPS = npsScoreArray[1]
                                                    //console.log({yesterdaysNPS});
                                                    var shift = todaysNPS - yesterdaysNPS;
                                                    var shiftStr = shift.toFixed(1);
                                                    //console.log(shiftStr);
                                                    var npsShiftList = document.getElementById('nps_shift');
                                                    var liShift = document.createElement('li');
                                                    liShift.textContent = shiftStr;
                                                    //set the color based on the shift
                                                    if (shift < 0) {
                                                        liShift.style.color = '#ea6463'
                                                    }
                                                    else if (shift > 0) {
                                                        liShift.style.color = '#62eb62'
                                                    }
                                                    npsShiftList.appendChild(liShift);
                                                }
                                                else {
                                                    // doc.data() will be undefined in this case
                                                    console.log("No such nps year document!");
                                                    //set the location data to 0 if they don't have documents

                                                    //get the nps score for today
                                                    var todaysNPS = 0
                                                    //console.log({todaysNPS});
                                                    var npsScoresList = document.getElementById('nps_scores');
                                                    var score = document.createElement('li');
                                                    score.textContent = todaysNPS.toFixed(1);
                                                    npsScoresList.appendChild(score);
                                                    
                                                    //set the shift since yesterday
                                                    var yesterdaysNPS = 0
                                                    //console.log({yesterdaysNPS});
                                                    var shift = todaysNPS - yesterdaysNPS;
                                                    var shiftStr = shift.toFixed(1);
                                                    //console.log(shiftStr);
                                                    var npsShiftList = document.getElementById('nps_shift');
                                                    var liShift = document.createElement('li');
                                                    liShift.textContent = shiftStr;
                                                    npsShiftList.appendChild(liShift);
                                                }
                                            })
                                            .catch(function(locationNPSError) {
                                                console.log("Error getting nps year document", locationNPSError);
                                            });
                                        npsPromises.push(npsPromise);

                                        //GAP data
                                        //FIXME: Need to include check that the year data exists (see NPS for example)
                                        for (var k = 0; k < gapFeatures.length; k++) {
                                            let locationGAPDoc = businessDoc.collection("locations").doc(String(j)).collection("campaigns").doc("GAP").collection("features").doc(String(k)).collection("year").doc(yearsNeeded[i])
                                            function gapPromiseFunc(featureIndex) {
                                                var gapPromise = locationGAPDoc.get()
                                                .then(function(docLocationGAP) {
                                                    console.log("Got gap docs")
                                                    console.log("Grabbing GAP data for feature " + String(featureIndex))
                                                    var importanceCountTotal = 0;
                                                    var importanceSumTotal = 0;
                                                    var performanceCountTotal = 0;
                                                    var performanceSumTotal = 0;

                                                    for (var l = 0; l < numDaysToCheck; l++) {
                                                        //get the totals from this date in the document
                                                        console.log("Grabbing data for day " + String(l))
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
                                                            importanceCountTotal += importanceCount;
                                                            importanceSumTotal += importanceSum;
                                                            console.log({importanceCountTotal});
                                                            console.log({importanceSumTotal});
                                                        }
                                                        if (performanceCount != undefined) {
                                                            performanceCountTotal += performanceCount;
                                                            performanceSumTotal += performanceSum;
                                                            console.log({performanceCountTotal});
                                                            console.log({performanceSumTotal});
                                                        }
                                                    }
                                                    importanceCountTotals[featureIndex] += importanceCountTotal;
                                                    importanceSumTotals[featureIndex] += importanceSumTotal;
                                                    performanceCountTotals[featureIndex] += performanceCountTotal;
                                                    performanceSumTotals[featureIndex] += performanceSumTotal;
                                                })
                                                .catch (function(locationGAPError) {
                                                    console.log("Error getting gap year document", locationGAPError);
                                                });
                                                gapPromises.push(gapPromise);
                                                return gapPromise;
                                            }
                                            
                                            gapPromiseFunc(k);
                                            
                                        }

                                        //Particpation Data
                                        let locationParticipationDoc = businessDoc.collection("locations").doc(String(j)).collection("campaigns").doc("Participation").collection("year").doc(yearsNeeded[i]);
                                        var participationPromise = locationParticipationDoc.get()
                                            .then(function(docLocationParticipation) {
                                                if(docLocationParticipation.exists) {
                                                    //var participationCountArray = [];
                                                    console.log("participation document does exist")

                                                    //get the data needed for all of the dates in the date array
                                                    for (var k = 0; k < strDateArray.length; k++) {
                                                        //get the totals from this date in the document
                                                        var dayCount = 0;
                                                        dayCount = docLocationParticipation.get(strDateArray[k]);

                                                        //store the totals in an array (0 if no data)
                                                        if (dayCount != undefined) {
                                                            //participationCountArray.push(dayCount);

                                                            //sum up the totals into their array per day
                                                            totalParticipationCount[k] = totalParticipationCount[k] + dayCount;
                                                        }
                                                        else {
                                                            //participationCountArray.push(0);
                                                        }
                                                    }
                                                }
                                                else {
                                                    //document does not exist
                                                    //do nothing (total counts already set to 0)
                                                    console.log("participation document doesn't exist")
                                                }
                                            })
                                            .catch (function(locationParticipationError) {
                                                console.log("Error getting participation year document", locationParticipationError);
                                            });
                                        participationPromises.push(participationPromise);
                                    }
                                }
                                //set up the graph
                                //FIXME: Need to calulate the total nps score for all locations, not each one individually
                                //What is happening now is that each location is pushing to the array and then this is getting a lot of data.

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
                                            ctxPlugin.rotate(-0.25 * Math.PI);

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

                                //need to only get the npsDates that we are requesting which is numDaysToCheck
                                //if this is the final time calulating the scores then calculate the totals
                                Promise.allSettled(npsPromises).then(function(getNPSTotals) {
                                    console.log("In the if statement to create the nps graph.");
                                    var tmpDateArray = []
                                    for (k = 0; k < numDaysToCheck; k++) {
                                        tmpDateArray.push(strDateArray[k]);
                                    }
                                    //strDateArray = tmpDateArray;
                                    //console.log({totalCountArray})
                                    //console.log({totalDetractorsArray})
                                    //console.log({totalPromotersArray})

                                    var npsTotalScores = []
                                    for (k = 0; k < tmpDateArray.length; k++) {
                                        daysScore = calculateNpsScore(k, trailingRange, totalCountArray, totalDetractorsArray, totalPromotersArray);
                                        npsTotalScores.push(daysScore.toFixed(1));
                                    }
                                    //get the totals for today and yesterday for the shift
                                    //get the nps score for today
                                    var todaysTotalNPS = parseFloat(npsTotalScores[0]);
                                    //console.log({todaysTotalNPS});
                                    var totalScoreElement = document.getElementById('currentTotalNPS');
                                    totalScoreElement.textContent = todaysTotalNPS.toFixed(1);
                                    
                                    //set the shift since yesterday
                                    var yesterdaysTotalNPS = parseFloat(npsTotalScores[1]);
                                    //console.log({yesterdaysTotalNPS});
                                    var totalShift = todaysTotalNPS - yesterdaysTotalNPS;
                                    var totalShiftElement = document.getElementById("currentTotalNPSShift");
                                    totalShiftElement.textContent = totalShift.toFixed(1);
                                    //set the color based on the shift
                                    if (totalShift < 0) {
                                        totalShiftElement.style.color = "#ea6463"
                                    }
                                    else if (totalShift > 0) {
                                        totalShiftElement.style.color = "62eb62"
                                    }

                                    var ctxNPS = document.getElementById('npsChart').getContext('2d');
                                    var chart = new Chart(ctxNPS, {
                                        // The type of chart we want to create
                                        type: 'line',
                                    
                                        // The data for our dataset
                                        data: {
                                            labels: tmpDateArray.reverse(),
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
                                });

                                Promise.allSettled(gapPromises).then(function(setGAPGraph) {
                                    console.log("In the if statement to create the gap graph.");

                                    //calculate the averages for the performance and importance
                                    for (var i = 0; i < gapFeatures.length; i++) {
                                        if (importanceCountTotals[i] != 0) {
                                            var importanceAvg = importanceSumTotals[i]/importanceCountTotals[i];
                                        }
                                        else {
                                            var importanceAvg = 0;
                                        }
                                        var importanceAvgSTR = importanceAvg.toFixed(1);
                                        console.log({importanceAvgSTR})

                                        if (performanceCountTotals[i] != 0) {
                                            var performanceAvg = performanceSumTotals[i]/performanceCountTotals[i];
                                        }
                                        else {
                                            var performanceAvg = 0;
                                        }
                                        var performanceAvgSTR = performanceAvg.toFixed(1);
                                        console.log({performanceAvgSTR})

                                        gapGraphPoints.push({x:parseFloat(importanceAvgSTR), y:parseFloat(performanceAvgSTR)});

                                        //set the averages for the feature in performance and importance
                                        var gapPerformanceList = document.getElementById('gap_performance');
                                        var score = document.createElement('li');
                                        score.textContent = performanceAvgSTR;
                                        gapPerformanceList.appendChild(score);

                                        var gapImportanceList = document.getElementById('gap_importance');
                                        var score = document.createElement('li');
                                        score.textContent = importanceAvgSTR;
                                        gapImportanceList.appendChild(score);
                                    }

                                    //create the gap data points
                                    // var myLineExtend = Chart.controllers.line.prototype.draw;

                                    var ctxGAP = document.getElementById("gapChart").getContext("2d");

                                    var config = {
                                        // The type of chart we want to create
                                        type: 'scatter',
                                        data: {
                                            labels: gapFeatures,
                                            datasets: [{
                                            data: gapGraphPoints,
                                            borderColor: '#47a2ee',
                                            backgroundColor: '#47a2ee',
                                            pointRadius: 4
                                            }]
                                        },

                                        // Configuration options go here
                                        options: {
                                            optimalLine: true,
                                            responsive: true,
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
                                    // Chart.helpers.extend(Chart.controllers.line.prototype, {
                                    // draw: function() {

                                    //     myLineExtend.apply(this, arguments);

                                    //     var chart = this.chart;
                                    //     var ctx = chart.ctx;

                                    //     var test = chart.scales
                                    //     console.log({test})
                                    //     var xaxis = chart.scales['x-axis-1']
                                    //     var yaxis = chart.scales['y-axis-1']
                                        

                                    //     ctx.save();
                                    //     ctx.beginPath();
                                    //     ctx.moveTo(xaxis.left, yaxis.bottom);
                                    //     ctx.strokeStyle = '#a9a9a9';
                                    //     ctx.lineTo(xaxis.right, yaxis.top);
                                    //     ctx.stroke();
                                    //     ctx.restore();

                                    //     ctx.save();
                                    //     ctx.translate(xaxis.right - 50,yaxis.top + 45);
                                    //     ctx.rotate(-0.25 * Math.PI);

                                    //     var rText = 'optimal';
                                    //     ctx.font = "12px Arial";
                                    //     ctx.fillStyle = "#a9a9a9";
                                    //     ctx.fillText(rText, 0, 0);
                                    //     ctx.restore();
                                    // }
                                    // });
                                    let gapChart = new Chart(ctxGAP, config);
                                    //console.log(gapChart.scales)
                                });

                                Promise.allSettled(participationPromises).then(function(setParticpationGraph) {
                                    var tmpDateArray = []
                                    let dayAbbrev = ['Su', 'M', 'T', 'W', 'Th', 'F', 'S']
                                    for (k = 0; k < 7; k++) {
                                        var day = dayAbbrev[dateArray[k].getDay()];
                                        tmpDateArray.push(day);
                                    }
                                    console.log({totalParticipationCount})
                                    
                                    var weeklyTotal = 0;
                                    for (k = 0; k < 7; k++) {
                                        weeklyTotal += totalParticipationCount[k];
                                    }
                                    console.log({weeklyTotal});

                                    var priorWeeklyTotal = 0;
                                    for(k = 7; k < 14; k++) {
                                        priorWeeklyTotal += totalParticipationCount[k];
                                    }
                                    console.log({priorWeeklyTotal});

                                    var participationWeeklyTotalElement = document.getElementById('participationWeeklyTotal');
                                    participationWeeklyTotalElement.textContent = weeklyTotal;

                                    var participationPriorWeeklyTotalElement = document.getElementById('participationPriorWeeklyTotal');
                                    participationPriorWeeklyTotalElement.textContent = priorWeeklyTotal;

                                    //get the average particpation over the past 7 days
                                    var lastSevenParticipation = totalParticipationCount.slice(0,7)
                                    var average = 0.0;
                                    var sum = 0.0;
                                    for (var i = 0; i < lastSevenParticipation.length; i++) {
                                        sum += lastSevenParticipation[i];
                                    }
                                    average = sum / lastSevenParticipation.length;
                                    average = Math.round(average * 10) / 10

                                    //create the data points
                                    var ctxParticipation = document.getElementById('participationChart').getContext('2d');
                                    var chart = new Chart(ctxParticipation, {
                                        // The type of chart we want to create
                                        type: 'bar',
                                        data: {
                                            labels: tmpDateArray.reverse(),
                                            datasets: [{
                                                borderColor: '##a9a9a9',
                                                backgroundColor: '#a9a9a9',
                                                barPercentage: .5,
                                                data: lastSevenParticipation.reverse()
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
                                });
                                closeLoadingScreen();
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
                        //user is not allow access to the dashboard
                        document.getElementById("accessDenied").style.display = "flex";
                        document.getElementById('accessDeniedButton').addEventListener('click', logout);
                        closeLoadingScreen();
                    }
                    
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
