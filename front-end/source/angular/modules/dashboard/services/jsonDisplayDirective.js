// ┌─────────────────────────────────────────────────────────────────────────────────────────────────┐ \\
// │ jsonDisplayDirective                                                                              │ \\
// ├─────────────────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2022 IFPEN                                                                     │ \\
// ├─────────────────────────────────────────────────────────────────────────────────────────────────┤ \\
// │ Author(s) : Abir EL FEKI, Mondher AJIMI                                                         │ \\
// └─────────────────────────────────────────────────────────────────────────────────────────────────┘ \\

angular
    .module('modules.dashboard')
    .directive('jsonDisplay', function jsonDisplay() {
        const NO_OPTIONS = {};
        function link(scope, element) {
            let currentValue = undefined;
            let currentOptions = undefined;
            let lastElement = null;

            function update() {
                if (lastElement) {
                    lastElement.remove();
                    lastElement = null;
                }
                lastElement = formatJson(currentValue, currentOptions);
                element.append(lastElement);
            }

            scope.$watch(function (values) {
                const json = values.jsonDisplay;
                const options = values.options ?? NO_OPTIONS;
                if (currentValue !== json || currentOptions !== options) {
                    currentValue = json;
                    currentOptions = options;
                    update();
                }
            });
        }

        return {
            scope: {
                jsonDisplay: '<',
                options: '<',
            },
            link,
        };
    });