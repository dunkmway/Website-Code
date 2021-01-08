class LocationData {
    locationIndex;
    locationName;
    gapFeatures;

    npsCount;
    npsDetractors;
    npsPromoters;

    gapFeatureData;

    participationCount;

    constructor(locationIndex, locationName, gapFeatures) {
        this.locationIndex = locationIndex;
        this.locationName = locationName;
        this.gapFeatures = gapFeatures;

        this.npsCount = [];
        this.npsDetractors = [];
        this.npsPromoters = [];

        this.gapFeatureData = [];

        this.participationCount = [];
    }

    /**
     * Fetches all nps data from the given dates for this location.
     * Returns a promise that resolves when all the data has been fetched.
     * @param {array} dates array of date objects 
     */
    fetchNPSData(dates, businessUID) {
        let db = firebase.firestore();

        //set up the nps data arrays
        for (var i = 0; i < dates.length; i++) {
            this.npsCount.push(0);
            this.npsDetractors.push(0);
            this.npsPromoters.push(0);
        }

        //will return this array of promises
        var npsPromises = [];

        //extract the data separately by year
        var years = this.getYearsNeeded(dates);
        var strDates = this.formatDates(dates);

        for (var i = 0; i < years.length; i++) {
            var year = years[i];
            let npsYearRef = db.collection("businesses")
                               .doc(businessUID)
                               .collection("locations")
                               .doc(String(this.locationIndex))
                               .collection("campaigns")
                               .doc("NPS")
                               .collection("year")
                               .doc(year);
            var npsPromise = npsYearRef.get();
            var self = this;
            function passIntoPromise(year) {
                npsPromise.then((doc) => self.extractNPSData(doc, strDates, year));
            }
            passIntoPromise(year)
            npsPromises.push(npsPromise);
        }
        return Promise.all(npsPromises);
    }

    /**
     * PRIVATE METHOD:
     * Extracts all nps data from the given dates and year then stores it to the location object.
     * @param {any} doc snapshot of document from Firebase
     * @param {array} dates array of date objects to extract from
     * @param {string} years string of year for the  doc to fetch
     */
    extractNPSData(doc, dates, year) {
        if (doc.exists) {
            //run through each day
            for (var i = 0; i < dates.length; i++) {
                //check that the date is for this year
                if (dates[i].includes(year)) {
                    var dayCount = doc.get(`${dates[i]}.day_count`);
                    var numDetractors = doc.get(`${dates[i]}.num_detractors`);
                    var numPromoters = doc.get(`${dates[i]}.num_promoters`);

                    //the day has data
                    if (dayCount != undefined) {
                        this.npsCount[i] = dayCount;
                        this.npsDetractors[i] = numDetractors;
                        this.npsPromoters[i] = numPromoters;
                    }
                    //or the day has no data so do nothing since it is already set to 0
                }
            }
        }
        //or all the survey data is presumed to be 0 and it is already set to 0
    }

    fetchGAPData(dates, features, businessUID) {
        var gapPromises = [];

        for (var i = 0; i < features.length; i++) {
            var feature = new GAPFeatureData(features[i], i);
            var featurePromise = feature.fetchFeatureData(this.locationIndex, dates, businessUID);
            this.gapFeatureData.push(feature);
            gapPromises.push(featurePromise);
        }
        return gapPromises;
    }

    fetchParticipationData(dates, businessUID) {
        let db = firebase.firestore();

        //set up the participation data array
        for (var i = 0; i < dates.length; i++) {
            this.participationCount.push(0);
        }

        //will return this promise when all data is fetched
        var participationPromises = [];

        //extract the data separately by year
        var years = this.getYearsNeeded(dates);
        var strDates = this.formatDates(dates);

        for (var i = 0; i < years.length; i++) {
            var year = years[i];
            let participationYearRef = db.collection("businesses")
                               .doc(businessUID)
                               .collection("locations")
                               .doc(String(this.locationIndex))
                               .collection("campaigns")
                               .doc("Participation")
                               .collection("year")
                               .doc(year);
            var participationPromise = participationYearRef.get();
            var self = this;
            function passIntoPromise(year) {
                participationPromise.then((doc) => self.extractParticipationData(doc, strDates, year));
            }
            passIntoPromise(year)
            participationPromises.push(participationPromise);
        }
        return Promise.all(participationPromises);

    }

    extractParticipationData(doc, dates, year) {
        if(doc.exists) {
            //run through each day
            for (var i = 0; i < dates.length; i++) {
                //check that the date is for this year
                if (dates[i].includes(year)) {
                    var dayCount = doc.get(dates[i]);
                    //check that the date has data
                    if (dayCount != undefined) {
                        this.participationCount[i] = dayCount;
                    }
                }
            }
        }
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