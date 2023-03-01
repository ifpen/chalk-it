// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ geoConversion                                                      │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2017-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Mongi BEN GAID, Francis PRADEL                │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

var geoJsonColors = ['#800080', '#FF00FF', '#000080', '#0000FF', '#008080', '#00FFFF', '#FFFF00', '#800000'];

var geoConversion = (function () {

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                           geoJson2dqTrip                           | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\
    function geoJson2dqTrip(geoJsonTrace) {
        // MBG TODO : take into account coordTimes and altitude/heading

        var dqJson = { 'longitude': [], 'latitude': [] };

        for (i = 0; i < geoJsonTrace.features.length; i++) {
            if (geoJsonTrace.features[i].geometry.type != "LineString") break;
            var coordinates = geoJsonTrace.features[i].geometry.coordinates;
            for (k = 0; k < coordinates.length; k++) {
                curLat = Number((coordinates[k])[1]);
                curLng = Number((coordinates[k])[0]);
                dqJson['latitude'].push(curLat);
                dqJson['longitude'].push(curLng);
            }
        }

        return dqJson;
    }

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                           latLng2geoJson                           | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\
    function latLng2geoJson(mylat, mylong, legend, indexColor) {

        var ligne = [];
        // a feature collection
        var gj = {
            type: 'FeatureCollection',
            features: []
        };
        for (var i = 0; i < mylong.length; i++) {
            ligne.push([mylong[i], mylat[i]])
        }
        var feature = {
            type: 'Feature',
            geometry: {
                type: 'LineString',
                coordinates: ligne
            },
            properties: { style: { color: geoJsonColors[indexColor], weight: 4, opacity: 0.9 }, description: '<span style="color: ' + geoJsonColors[indexColor] + '">' + legend + '</span>' }
        };
        if (feature) gj.features.push(feature);

        return gj;
    }

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                           dqTrip2geoJson                           | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\
    function dqTrip2geoJson(dqJson, fileName, indexColor) {
        var
            //mydate = dqJson['date'],
            mylong = dqJson['longitude'],
            mylat = dqJson['latitude'];//,
        //myacc = dqJson['gpsAccuracy'];

        var legend = fileName + '_gpsTrace';
        var gj = null;//ABK
        //if (!_.isUndefined(mydate) && !_.isUndefined(mylong) && !_.isUndefined(mylat) && !_.isUndefined(myacc))//ABK
        if (!_.isUndefined(mylong) && !_.isUndefined(mylat))//ABK
            gj = latLng2geoJson(mylat, mylong, legend, indexColor);

        return gj;
    }

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                             dqTrip2Csv                             | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\
    function dqTrip2Csv(dqJson) {
        var csvContent = "latitude,longitude\n";
        for (var k = 0; k < dqJson.longitude.length; k++) {
            csvContent = csvContent + dqJson.latitude[k] + ',' + dqJson.longitude[k] + '\n';
        }
        return csvContent;
    }

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                           hereMm2geoJson                           | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\
    function hereMm2geoJson(mapMatchingResult, fileName, indexColor) {

        // sanity checks
        if (_.isUndefined(mapMatchingResult)) return {};
        if (mapMatchingResult == {}) return {};

        if (_.isUndefined(mapMatchingResult.RouteLinks)) return {};

        var curLat, curLng;
        var myLat = [];
        var myLng = [];

        for (var k = 0; k < mapMatchingResult.RouteLinks.length; k++) {
            var routeLink = mapMatchingResult.RouteLinks[k];
            var tokenizedShape = routeLink.shape.split(' ');
            for (var i = 0; i < tokenizedShape.length; i = i + 2) {
                curLat = Number(tokenizedShape[i]);
                myLat.push(curLat);
                curLng = Number(tokenizedShape[i + 1]);
                myLng.push(curLng);
            }
        }

        var legend = fileName + '_here';

        var gj = latLng2geoJson(myLat, myLng, legend, indexColor);

        return gj;

    }

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                        graphHopper2geoJson                         | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\
    function graphHopper2geoJson(json, fileName, mapMatchingService, indexColor) {

        var gj = {};
        var elevation = undefined;
        // conversion to geoJson
        if (json.paths) {
            for (var i = 0; i < json.paths.length; i++) {
                var path = json.paths[i];
                // convert encoded polyline to geo json
                if (path.points_encoded) {
                    var tmpArray = graphhopper.util.decodePath(path.points, elevation);
                    path.points = {
                        "type": "LineString",
                        "coordinates": tmpArray
                    };
                }
            }

            var matchedPath = json.paths[0];
            var geojsonFeature = {
                type: "Feature",
                geometry: matchedPath.points,
                properties: { style: { color: geoJsonColors[indexColor], weight: 4, opacity: 0.9 }, description: '<span style="color: ' + geoJsonColors[indexColor] + '">' + fileName + '_mapMatch_' + mapMatchingService + '</span>' }
            };

            gj = {
                type: 'FeatureCollection',
                features: [geojsonFeature]
            };
        }

        return gj;
    }

    // Public functions
    return {
        geoJson2dqTrip: geoJson2dqTrip,
        dqTrip2geoJson: dqTrip2geoJson,
        dqTrip2Csv: dqTrip2Csv,
        hereMm2geoJson: hereMm2geoJson,
        graphHopper2geoJson: graphHopper2geoJson
    };

}());

// from https://stackoverflow.com/questions/2855189/sort-latitude-and-longitude-coordinates-into-clockwise-ordered-quadrilateral
// MBG to refactor!

// A representation of a 2D Point.
function Point(label, lat, lon) {

    this.label = label;
    this.x = (lon + 180) * 360;
    this.y = (lat + 90) * 180;

    this.distance = function (that) {
        var dX = that.x - this.x;
        var dY = that.y - this.y;
        return Math.sqrt((dX * dX) + (dY * dY));
    }

    this.slope = function (that) {
        var dX = that.x - this.x;
        var dY = that.y - this.y;
        return dY / dX;
    }

    this.toString = function () {
        return this.label;
    }
}


function Points(value) {
    this.points = value;

    // Find the upper most point. In case of a tie, get the left most point.
    function upperLeft(points) {
        var top = points[0];
        for (var i = 1; i < points.length; i++) {
            var temp = points[i];
            if (temp.y > top.y || (temp.y == top.y && temp.x < top.x)) {
                top = temp;
            }
        }
        return top;
    }

    upper = upperLeft(value)

    // A custom sort function that sorts p1 and p2 based on their slope
    // that is formed from the upper most point from the array of points.
    function pointSort(p1, p2) {
        // Exclude the 'upper' point from the sort (which should come first).
        if (p1 == upper) return -1;
        if (p2 == upper) return 1;

        // Find the slopes of 'p1' and 'p2' when a line is 
        // drawn from those points through the 'upper' point.
        var m1 = upper.slope(p1);
        var m2 = upper.slope(p2);

        // 'p1' and 'p2' are on the same line towards 'upper'.
        if (m1 == m2) {
            // The point closest to 'upper' will come first.
            return p1.distance(upper) < p2.distance(upper) ? -1 : 1;
        }

        // If 'p1' is to the right of 'upper' and 'p2' is the the left.
        if (m1 <= 0 && m2 > 0) return -1;

        // If 'p1' is to the left of 'upper' and 'p2' is the the right.
        if (m1 > 0 && m2 <= 0) return 1;

        // It seems that both slopes are either positive, or negative.
        return m1 > m2 ? -1 : 1;
    }

    return {
        pointSort
    };

}