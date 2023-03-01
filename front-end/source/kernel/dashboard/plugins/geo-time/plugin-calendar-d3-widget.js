// ┌─────────────────────────────────────────────────────────────────────────────┐ \\
// │                                                                             │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2023 IFPEN                                                 │ \\
// | Licensed under the Apache License, Version 2.0                              │ \\
// ├─────────────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Benoit LEHMAN, Tristan BARTEMENT, Guillaume CORBELIN   │ \\
// └─────────────────────────────────────────────────────────────────────────────┘ \\


/*******************************************************************/
/*************************** plugin data ***************************/
/*******************************************************************/


// models
modelsHiddenParams.calendarD3 = { "CalendarValues": undefined, "SelectedDate": undefined };

// Parameters
modelsParameters.calendarD3 = {
    "AllYearsVisible": true,
    "UndefinedValueColor": "#F6F6F6"
};

// Layout (default dimensions)
modelsLayout.calendarD3 = { 'height': '5vh', 'width': '19vw', 'minWidth': '100px', 'minHeight': '100px' };


/*******************************************************************/
/*************************** plugin code ***************************/
/*******************************************************************/

function calendarD3WidgetPluginClass() {

    // ├────────────────────────────────────────────────────────────────────┤ \\
    // |                         Time picker widget                         | \\
    // ├────────────────────────────────────────────────────────────────────┤ \\
    this.calendarD3Widget = function (idDivContainer, idWidget, idInstance, bInteractive) {
        this.constructor(idDivContainer, idWidget, idInstance, bInteractive);


        var self = this;

        this.enable = function () { };

        this.disable = function () { };

        this.updateValue = function (e) {
            self.SelectedDate.updateCallback(self.SelectedDate, self.SelectedDate.getValue());
        }


        this.rescale = function () {
            this.render();
        };


        this.render = function () {

            var widgetHtml = document.createElement('div');
            widgetHtml.setAttribute("style", 'display: table;text-align: left; height: inherit; width: inherit; cursor: inherit');
            widgetHtml.setAttribute("id", "div-for-calendarD3" + idWidget);
            $("#" + idDivContainer).html(widgetHtml);

            const bbox = widgetHtml.getBoundingClientRect();

            var width = bbox.width;
            var heightDiv = bbox.height;

            var tableForCalendar;

            var formatOut = d3.timeFormat("%Y-%m-%d");
            // Create Data 

            if (!_.isUndefined(modelsHiddenParams[idInstance].CalendarValues)) {
                tableForCalendar = modelsHiddenParams[idInstance].CalendarValues;
            } else {

                var dateForVal = d3.timeDay.range(new Date(2020, 5, 2), Date.now());

                var tableForCalendar = dateForVal.map(d => { return { "date": formatOut(d), "value": undefined } });
            }

            var parseIn = d3.timeParse("%Y-%m-%d");
            tableForCalendar = tableForCalendar.map(d => { return { "date": parseIn(d.date), "value": d.value } });


            tableForCalendar = tableForCalendar.sort(function (a, b) { return (a.date.getTime() - b.date.getTime()); });
            // all Date to draw
            var allDate = d3.timeDay.range(tableForCalendar[0].date, tableForCalendar[tableForCalendar.length - 1].date);
            var dateWithNoVal = _.difference(allDate.map(function (d) { return d.getTime(); }), tableForCalendar.map(function (d) { return d.date.getTime(); }));

            if (dateWithNoVal.length > 0) {

                dateWithNoVal.forEach(function (d) {
                    tableForCalendar.push({ "date": new Date(d), "value": undefined });
                });

                tableForCalendar = tableForCalendar.sort(function (a, b) { return (a.date.getTime() - b.date.getTime()); });

            }

            console.log(dateWithNoVal.map(function (d) { return new Date(d); }));

            // Option for visualization
            var option = modelsParameters[idInstance].AllYearsVisible ? "full" : "single"; // can be full or single 


            var weekday = "monday"; // either: weekday, sunday, or monday
            var formatDay = i => "SMTWTFS"[i]; // given a day number in [0, 6], the day-of-week label

            var formatMonth = "%b"; // format specifier string for months (above the chart)
            var yFormat = "+%"
            var colors = d3.interpolateRdYlGn;

            var timeTrans = 1500;
            var opacityOther = 1;

            // Internal variable for display

            var X1 // all possible Date

            var X // Date where there is value;
            var Y // Values associated with date;

            var I // Array of all years [2021,2022,2023,...];

            // Use for single mode 
            var firstYear;
            var lastYear;
            var currentYear;

            var countDay;
            var timeWeek;
            var weekDays;


            var height;
            var max;
            var color;

            // Construct formats.
            var formatMonth;
            var formatDate;
            var formatValue;

            var years;

            var marginLeftForYandD = 40;

            lastYear = tableForCalendar[tableForCalendar.length - 1].date.getFullYear();
            firstYear = tableForCalendar[0].date.getFullYear();
            currentYear = lastYear;

            var cellSize;
            let centerHoriz = 0;
            let centerVert = 0;

            computeCalendar();

            function computeCalendar() {

                if (option === "single") {
                    X = tableForCalendar.filter(d => { return currentYear == d.date.getFullYear() }).map(d => { return d.date });
                    Y = tableForCalendar.filter(d => { return currentYear == d.date.getFullYear() }).map(d => { return d.value });
                } else {
                    X = tableForCalendar.map(d => { return d.date });
                    Y = tableForCalendar.map(d => { return d.value });
                }


                I = d3.range(X.length);
                // Group the index by year, in reverse input order. (Assuming that the input is
                // chronological, this will show years in reverse chronological order.)
                years = d3.groups(I, i => X[i].getFullYear()).reverse();

                countDay = weekday === "sunday" ? i => i : i => (i + 6) % 7;
                timeWeek = weekday === "sunday" ? d3.timeSunday : d3.timeMonday;
                weekDays = weekday === "weekday" ? 5 : 7;


                let maxY = (heightDiv) / ((weekDays + 2) * years.length);

                let maxX = (width - marginLeftForYandD) / (53);

                cellSize = Math.min(maxY, maxX);

                height = cellSize * (weekDays + 2);


                centerHoriz = (width - (marginLeftForYandD + cellSize * 53)) / 2.0;

                if (centerHoriz < 0 || option === "single") {
                    centerHoriz = 0;
                }

                centerVert = (heightDiv - height * years.length) / 2.0;
                if (centerVert < 0 || option === "single") {
                    centerVert = 0;
                }

                max = d3.quantile(Y, 0.9975);
                color = d3.scaleSequential([0, max], ["#d5f4c7", "red"]).unknown("none");

                // Construct formats.
                formatMonth = d3.timeFormat(formatMonth);

                // Compute titles.
                formatDate = d3.timeFormat("%B %-d, %Y");
                formatValue = color.tickFormat(100, yFormat);
                title = i => `${formatDate(X[i])}\n${formatValue(Y[i])}`;
            }

            function pathMonth(t) {
                const d = Math.max(0, Math.min(weekDays, countDay(t.getDay())));
                const w = timeWeek.count(d3.timeYear(t), t);
                return `${d === 0 ? `M${w * cellSize},0`
                    : d === weekDays ? `M${(w + 1) * cellSize},0`
                        : `M${(w + 1) * cellSize},0V${d * cellSize}H${w * cellSize}`}V${weekDays * cellSize}`;
            }




            d3.selection.prototype.conditionalDraw =
                function () {
                    var midX = (22 * cellSize + marginLeftForYandD);
                    var midY = (height * years.length) / 2.0;
                    return (option === "single") ? this.attr("x", midX).attr("y", midY).style("opacity", 0).transition().duration(500) : this;

                };

            const svg = d3.select(widgetHtml).append("svg")
                .attr("width", width)
                .attr("height", height * years.length + 40)
                .attr("viewBox", [0, 0, width, height * years.length + 40])
                .attr("style", "max-width: 100%; height: auto; height: intrinsic;")
                .attr("font-family", "sans-serif")
                .attr("font-size", cellSize);


            var tip = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("position", "absolute")
                .style("pointer-events", "none")
                .style("background", "#fff")
                .style("color", "#000")
                .style("border", "2px solid #000")
                .style("opacity", 0)


            if (option === "single") {

                var pathPlusSVG = 'M 1 1 L 12 10 L 1 19 L 1 1';
                var pathMinusSVG = 'M 12 1 L 1 10 L 12 19 L 12 1';


                var pathPlus = svg.append("path").attr("d", pathPlusSVG).style("fill-rule", "evenodd")
                    .attr("transform", "translate(" + (28 * cellSize + marginLeftForYandD) + ", " + (height * years.length) + ") ").attr("stroke-width", "0.0").attr("stroke", "black").attr("fill", "#888888");

                pathPlus.on('click', function () { redrawCalendar(1); });


                var pathMinus = svg.append("path").attr("d", pathMinusSVG).style("fill-rule", "evenodd")
                    .attr("transform", "translate(" + (22 * cellSize + marginLeftForYandD) + ", " + (height * years.length) + ") ").attr("stroke-width", "0.0").attr("stroke", "black").attr("fill", "#888888");

                pathMinus.on('click', function () { redrawCalendar(-1); });
                pathPlus.attr("opacity", 0.2);

            }


            drawCalendar();

            async function redrawCalendar(i) {

                var midX = (22 * cellSize + marginLeftForYandD);
                var midY = (height * years.length) / 2.0;

                var newYear = currentYear + i;

                if (newYear > lastYear || newYear < firstYear) {
                    return;
                }

                currentYear = newYear;

                await svg.selectAll(".year").selectAll("*").transition().duration(500).attr("x", midX).attr("y", midY).style("opacity", 0).end();

                svg.selectAll(".year").remove();

                if (newYear == firstYear) {
                    pathMinus.attr("opacity", 0.2);
                    pathPlus.attr("opacity", 1);
                } else if (newYear == lastYear) {
                    pathMinus.attr("opacity", 1);
                    pathPlus.attr("opacity", 0.2);
                } else {
                    pathMinus.attr("opacity", 1);
                    pathPlus.attr("opacity", 1);
                }


                computeCalendar();
                drawCalendar();
            }

            var formatOut = d3.timeFormat("%Y-%m-%d");

            function drawCalendar() {

                let year = svg.selectAll("g")
                    .data(years)
                    .join("g")

                year
                    .attr("class", "year")
                    .attr("transform", (d, i) => `translate(` + (marginLeftForYandD + centerHoriz) + `,${(height * i + cellSize * 1.5) + centerVert})`);

                year.append("text")
                    .conditionalDraw()
                    .attr("x", -5)
                    .attr("y", -5)
                    .attr("font-weight", "bold")
                    .attr("text-anchor", "end")
                    .text(([key]) => key)
                    .style("opacity", 1)

                year.append("g")
                    .attr("text-anchor", "end")
                    .selectAll("text")
                    .data(weekday === "weekday" ? d3.range(1, 6) : d3.range(7))
                    .join("text")
                    .conditionalDraw()
                    .attr("x", -5)
                    .attr("y", i => (countDay(i) + 0.5) * cellSize)
                    .attr("dy", "0.31em")
                    .text(formatDay)
                    .style("opacity", 1);


                const cell = year.append("g")
                    .selectAll("rect")
                    .data(weekday === "weekday"
                        ? ([, I]) => I.filter(i => ![0, 6].includes(X[i].getDay()))
                        : ([, I]) => I)
                    .join("rect")
                    .attr("width", cellSize - 1)
                    .attr("height", cellSize - 1)
                    .attr("fill", function (e, i) {
                        return !_.isUndefined(Y[e]) ? color(Y[e]) : modelsParameters[idInstance].UndefinedValueColor
                    })
                    .on('mouseover', function (e, i) {
                        if (!_.isUndefined(Y[i])) {
                            d3.select(this)
                                .attr("height", cellSize - 2).attr("width", cellSize - 2).attr("transform", `translate(1,1)`).style("stroke", "black").style("stroke-width", 1).style("stroke-opacity", 1);

                            tip.style("opacity", 1)
                                .html("<center>" + formatOut(X[i]) + "</center>" + "Value : " + Y[i])
                                .style("left", (e.pageX + 10) + "px")
                                .style("top", (e.pageY + 10) + "px")

                        }
                    })
                    .on('mouseout', function (e, i) {
                        if (!_.isUndefined(Y[i])) {
                            d3.select(this).style("stroke", "black").style("stroke-width", 0).style("stroke-opacity", 0).attr("transform", `translate(0,0)`).attr("width", cellSize - 1)
                                .attr("height", cellSize - 1);
                            tip.style("opacity", 0);
                        }
                    })

                    // For the actuator 
                    .on('click', function (e, d) {

                        modelsHiddenParams[idInstance].SelectedDate = formatOut(X[d]);
                        self.updateValue();

                        console.log(formatOut(X[d]))
                    })
                    .conditionalDraw()
                    .style("opacity", 1)
                    .attr("x", i => timeWeek.count(d3.timeYear(X[i]), X[i]) * cellSize + 0.5)
                    .attr("y", i => countDay(X[i].getDay()) * cellSize + 0.5)

                const month = year.append("g")
                    .selectAll("g")
                    .data(([, I]) => d3.timeMonths(d3.timeMonth(X[I[0]]), X[I[I.length - 1]]))
                    .join("g");

                month.filter((d, i) => i).append("path")
                    .attr("fill", "none")
                    .attr("stroke", "#fff")
                    .attr("stroke-width", 2)
                    .attr("d", pathMonth);

                month.append("text")
                    .text(formatMonth)
                    .conditionalDraw()
                    .style("opacity", 1)
                    .attr("x", d => timeWeek.count(d3.timeYear(d), timeWeek.ceil(d)) * cellSize + 3)
                    .attr("y", -5)
                    .style("opacity", 1);


            };
            function pathMonth(t) {
                const d = Math.max(0, Math.min(weekDays, countDay(t.getDay())));
                const w = timeWeek.count(d3.timeYear(t), t);
                return `${d === 0 ? `M${w * cellSize},0`
                    : d === weekDays ? `M${(w + 1) * cellSize},0`
                        : `M${(w + 1) * cellSize},0V${d * cellSize}H${w * cellSize}`}V${weekDays * cellSize}`;
            }
        };


        // Schema Actuator
        const _SCHEMA_CALENDAR_INPUT = {

            $schema: WidgetPrototypesManager.SCHEMA_VERSION,
            $id: WidgetPrototypesManager.ID_URI_SCHEME + "xdash:calendarD3Widget_input",
            type: "array",
            items: {
                type: "object",
                properties: {
                    date: { type: "string" },
                    value: { type: "number" },
                },
            },
        };

        const _CALENDAR_VALUES_DESCRIPTOR = new WidgetActuatorDescription(
            "CalendarValues",
            "Calendar Values Array[{date : YYYY-MM-DD, value : number}]",
            WidgetActuatorDescription.READ,
            _SCHEMA_CALENDAR_INPUT,
        );

        const _DATE_SCHEMA = {
            $schema: WidgetPrototypesManager.SCHEMA_VERSION,
            $id: WidgetPrototypesManager.ID_URI_SCHEME + "xdash:calendarD3Widget_dateSelected",
            type: "string"
        };

        const _DATE_START_DESCRIPTOR = new WidgetActuatorDescription("SelectedDate",
            "Selected date as YYYY-MM-DD", WidgetActuatorDescription.WRITE, _DATE_SCHEMA);




        this.getActuatorDescriptions = function () {
            return [_CALENDAR_VALUES_DESCRIPTOR, _DATE_START_DESCRIPTOR];
        };

        this.CalendarValues = {
            updateCallback: function () { },
            setValue: function (val) {
                modelsHiddenParams[idInstance].CalendarValues = val;
                self.render();
            },
            getValue: function () {
                return modelsHiddenParams[idInstance].timeValue;
            },
            addValueChangedHandler: function (updateDataFromWidget) {
                this.updateCallback = updateDataFromWidget;
                self.enable();
            },
            removeValueChangedHandler: function (updateDataFromWidget) {
                self.disable();
            }

        };

        this.SelectedDate = {
            updateCallback: function () { },
            setValue: function (val) {
                modelsHiddenParams[idInstance].SelectedDate = val;
            },
            getValue: function () {
                return modelsHiddenParams[idInstance].SelectedDate;
            },
            addValueChangedHandler: function (updateDataFromWidget) {
                this.updateCallback = updateDataFromWidget;
            },
            removeValueChangedHandler: function (updateDataFromWidget) { }
        };


        self.render();
    };

    // Inherit from baseWidget class
    this.calendarD3Widget.prototype = baseWidget.prototype;

    // Plugin definition
    this.pluginDefinition = {
        'name': 'calendarD3',
        'widgetsDefinitionList': {
            calendarD3: { factory: "calendarD3Widget", title: "Year Calenddar", icn: "year-calendar", help: "wdg/wdg-geo-time/#simple-clock" }
        },
    };

    this.constructor();
}

// Inherit from basePlugin class
calendarD3WidgetPluginClass.prototype = basePlugin.prototype;

// Instantiate plugin
var calendarD3Plugin = new calendarD3WidgetPluginClass();

/*******************************************************************/
/************************ plugin declaration ***********************/
/*******************************************************************/

widgetsPluginsHandler.loadWidgetPlugin(calendarD3Plugin);