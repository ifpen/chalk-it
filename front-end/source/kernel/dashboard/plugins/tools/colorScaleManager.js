// ┌────────────────────────────────────────────────────────────────────┐ \\
// │                                                                    │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2023 IFPEN                                        │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Author(s) : Benoit LEHMAN                      │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

var colorScaleManager = (function() {

    var privateColorScales = [

        // interpolate used by flair // legacy of the Heat Map
        { 
            names : ["interpolateBlCyLiYeRed", "interpolateFlair", "interpolateLegacyHeatMap"],
            scale : d3.scaleLinear,
            colors : [d3.rgb("blue"), d3.rgb("cyan"), d3.rgb("lime"), d3.rgb("yellow"), d3.rgb("red")],
            interpolator : d3.interpolateHcl,
            domain : [0, 0.25, 0.5, 0.75, 1]
        }
    ];

    
    // Search private color Scale 
    function getPrivateColorScale(name) {
      
        let colorScalePrivateObjectDef = null;
        privateColorScales.forEach(function(d) {
            if(d.names.includes(name)) {
                colorScalePrivateObjectDef = d;
            }
        })
        return colorScalePrivateObjectDef;
    }
  
    // Search D3 interpolator
    function getD3colorScale(name) {
     
        if(  !(_.isUndefined(d3[name])) && (name.includes("interpolate")) ) {
           return d3[name];
        }

        return null;
    }

    function getHomogeneousColorScale(name) {
        if(d3.color(name) !== null) {
            return d3.interpolate(name, name);
        }
        
        return null;
    }
  
    function publicGetColorScale(colorScaleName, min, max) {

        // First remove the _r which means that the colorScale is reversed
        let reverseColorScale = false;
        let domain = [0,1];
        var colorScale;
        if(colorScaleName.endsWith("_r")) {
            reverseColorScale = true;
            colorScaleName = colorScaleName.slice(0, -2);
        }

        // check internal private colorScale

        if(getPrivateColorScale(colorScaleName) != null) {
            var privateColorScale = getPrivateColorScale(colorScaleName);
            colorScale = privateColorScale.scale().interpolate(privateColorScale.interpolator).range(privateColorScale.colors);
            domain = privateColorScale.domain;
        } else if(getD3colorScale(colorScaleName) !=null) {
            var interpolator = getD3colorScale(colorScaleName);
            colorScale = d3.scaleSequential().interpolator(interpolator);
        } else if(getHomogeneousColorScale(colorScaleName)) {
            var interpolator = getHomogeneousColorScale(colorScaleName);
            colorScale = d3.scaleSequential().interpolator(interpolator)
        } else {
            return null;
        }

        var delta = max - min;

        var minMaxReal = domain.map(function(d) { return (min + (d*delta))})
        if(reverseColorScale) {
            minMaxReal.reverse();
        }

        return colorScale.domain(minMaxReal);
    }
  

    // Expose public functions
    return {
      getColorScale : publicGetColorScale,
    };
  })();