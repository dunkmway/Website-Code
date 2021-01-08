class GAPFeatureData {
    featureName;
    featureIndex;

    featureImportanceCount;
    featureImportanceSum;
    featurePerformanceCount;
    featurePerformanceSum;

    constructor(featureName, featureIndex) {
        this.featureName = featureName;
        this.featureIndex = featureIndex;

        this.featureImportanceCount = [];
        this.featureImportanceSum = [];
        this.featurePerformanceCount = [];
        this.featurePerformanceSum = [];
    }

    fetchFeatureData(locationIndex, dates, businessUID) {
        let db = firebase.firestore();
        //set up the feature data arrays
        for (var i = 0; i < dates.length; i++) {
            this.featureImportanceCount.push(0);
            this.featureImportanceSum.push(0);
            this.featurePerformanceCount.push(0);
            this.featurePerformanceSum.push(0);
        }

        //will return this array of promises
        var featurePromises = [];

        //extract the data separately by year
        var years = this.getYearsNeeded(dates);
        var strDates = this.formatDates(dates);

        for (var i = 0; i < years.length; i++) {
            var year = years[i];
            let featureYearRef = db.collection("businesses")
                                   .doc(businessUID)
                                   .collection("locations")
                                   .doc(String(locationIndex))
                                   .collection("campaigns")
                                   .doc("GAP")
                                   .collection("features")
                                   .doc(String(this.featureIndex))
                                   .collection("year")
                                   .doc(year);
            var featurePromise = featureYearRef.get();
            var self = this;
            function passIntoPromise(year) {
                featurePromise.then((doc) => self.extractFeatureData(doc, strDates, year));
            }
        passIntoPromise(year);
        featurePromises.push(featurePromise);
        }
        return Promise.all(featurePromises);
    }

    /**
     * PRIVATE METHOD:
     * Extracts all nps data from the given dates and year then stores it to the location object.
     * @param {any} doc snapshot of document from Firebase
     * @param {array} dates array of date objects to extract from
     * @param {string} years string of year for the  doc to fetch
     */
    extractFeatureData(doc, dates, year) {
        if (doc.exists) {
            //run through each day
            for (var i = 0; i < dates.length; i++) {
                //check that the date is for this year
                if (dates[i].includes(year)) {
                    var importanceCount = doc.get(`${dates[i]}.importance_day_count`);
                    var importanceSum = doc.get(`${dates[i]}.importance_day_sum`);
                    var performanceCount = doc.get(`${dates[i]}.performance_day_count`);
                    var performanceSum = doc.get(`${dates[i]}.performance_day_sum`);

                    //the day has data
                    if (importanceCount != undefined) {
                        this.featureImportanceCount[i] = importanceCount;
                        this.featureImportanceSum[i] = importanceSum;
                    }
                    if (performanceCount != undefined) {
                        this.featurePerformanceCount[i] = performanceCount;
                        this.featurePerformanceSum[i] = performanceSum;
                    }
                    //or the day has no data so do nothing since it is already set to 0
                }
            }
        }
        //or all the survey data is presumed to be 0 and it is already set to 0
    }

    /**
     * PRIVATE METHOD:
     * Formats date objects into the form yyyy-mm-dd.
     * Returns an array of strings.
     * @param {array} dates array of date objects
     */
    formatDates(dates) {
        var strRange = [];
        for (var i = 0; i < dates.length; i++) {
            let yearStr = String(dates[i].getFullYear());
            let monthStr = ("0" + String(dates[i].getMonth() + 1)).slice(-2);
            let dayStr = ("0" + String(dates[i].getDate())).slice(-2);
            let dateStr = yearStr + '-' + monthStr + '-' + dayStr;
            strRange.push(dateStr);
        }
        return strRange;
    }

    /**
     * PRIVATE METHOD:
     * gets the years as strings from an array of dates
     * Returns an array of strings
     * @param {array} dateRange array of date objects
     */
    getYearsNeeded(dateRange) {
        var years = [];
        for (var i = 0; i < dateRange.length; i++) {
            var checkYear = String(dateRange[i].getFullYear())
            //if the year has not been separated yet
            if (!years.includes(checkYear)) {
            //push a new year into the array
                years.push(checkYear);
            }
            //else do nothing
        }
        return years;
    }
}