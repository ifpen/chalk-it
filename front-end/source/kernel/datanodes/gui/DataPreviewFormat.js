// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ DataPreviewFormat                                                  │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2023 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

function DataPreviewFormat() {

    if (typeof execOutsideEditor === "undefined") {
        this.execOutsideEditor = false;
    } else if (execOutsideEditor) {
        this.execOutsideEditor = true;
    } else {
        this.execOutsideEditor = false;
    }


    this.format = function (newData) {

        var previewData = '';
        var previewImage = '';

        if (typeof (newData) == 'string') {
            if (newData.match('base64ImageDetected')) {
                var b64 = newData.replace('base64ImageDetected', '');
                if (!this.execOutsideEditor) {
                    previewImage = '<img src="data:image/jpeg;base64,' + b64 + '"/>';
                }
                newData = b64;
                return { 'newData': b64, 'previewData': previewImage };
            } else if (newData.match('<div>\n<style scoped>\n')) {
                if (!this.execOutsideEditor) {
                    previewData = newData;
                }
                return { 'newData': newData, 'previewData': previewData };
            } else {
                if (!this.execOutsideEditor) {
                    previewData = syntaxHighlight(JSON.stringify(newData, undefined, 4));
                }
                return { 'newData': newData, 'previewData': previewData };
            }
        } else {
            if (!this.execOutsideEditor) {
                previewData = syntaxHighlight(JSON.stringify(newData, undefined, 4));
            }
            return { 'newData': newData, 'previewData': previewData };
        }
    }
}