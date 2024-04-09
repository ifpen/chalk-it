// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ widgetsEditorToolboxDefinition                                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2019-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID, Ghiles HIDEUR   │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

// Define here how widgets are associated to callpses for display in editor toolbox

var widgetsEditorToolboxDefinition = {
    "collapse-basic": {
        "name": "Basic inputs & controls",
        "widgets": ["flatUiNumericInput", "flatUiTextInput", "flatUiCheckbox", "flatUiSwitch", "flatUiHorizontalSlider", "flatUiVerticalSlider",
            "flatUiDoubleSlider", "flatUiButton", "loadFile", "saveToFileButton", "flatUiSelect", "flatUiMultiSelect", "flatUiList",
            "flatUiTable"]
    },
    "collapse-gauges": {
        "name": "Basic displays",
        "widgets": ["flatUiValueDisplay", "kpiCard", "advancedKpiCard", "ledStatus", "flatUiProgressBar",
            "scoringFullCircularGauge", "scoringSemiCircularGauge", "scoringArchCircularGauge"
        ]
    },
    "collapse-plotly": {
        "name": "Plots",
        "widgets": ["plotlyLine", "plotlyBar", "plotlyPie", "plotly3dSurface", "plotlyGeneric", "plotlyPyGeneric", "matplotlib", "plotlyRealTime", "vegaGeneric", "echartsGeneric"]
    },
    "collapse-geotime": {
        "name": "Geo & Time",
        "widgets": ["openStreetMaps", "mapGeoJson", "foliumMaps", "flatUiHereAutocompleteValue", "datepickerSimple", "dateRangePicker", "calendarD3", "timepickerSimple"]
    },
    "collapse-annotations": {
        "name": "Annotation & Video",
        "widgets": ["annotationIconInfo", "annotationLabel", "annotationImage", "annotationMarkdown", "annotationHtml", "annotationVideo"]
    }
};
