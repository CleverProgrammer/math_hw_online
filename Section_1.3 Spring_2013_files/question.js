angular.module('QuestionApp', ['Latex.Service', 'Question.Directives'])

    .controller("WrapperCtrl", function($scope, $http) {

        // The seed is set in an ng-init in the template returned by QWS.
        // We watch it so that we can fetch the correct version of the question template.
        $scope.$watch("seed", function(seed) {
            if (seed) {
                // The following code is solely to support a feature in WA1
                // Namely: Question preview on the Ask Your Teacher faculty page
                if (window && window.parent && window.parent.jQuery) {
                    setTimeout(function() {
                        window.parent.jQuery('iframe[src*="' + document.location.search + '"]')
                            .trigger("wa2");
                    }, 0);
                }
            }
        });

        var boxes       = {}; // Flag that indicates we have a watch on the box ID.
        $scope.answers  = {}; // The previously submitted answer to the question
        $scope.boxes    = {}; // The current value of the user's response
        $scope.status   = {}; // An array of classes to be added to a box based on correct/incorrect, etc.
        $scope.disabled = {}; // A boolean indicating if the box should be disabled
        $scope.key      = {}; // A string representing a box's key.  Not always present.
        $scope.saved    = {}; // A flag indicating if a box has a saved response
        $scope.feedback = {}; // A string representing a box's feedback.  Not always present.
        $scope.solution = { solution: "" }; // A string representing the solution to the question.  Not always present.

        // Populates the object and string value of the saved response
        function populateSavedValue(responseList, boxId) {
            var arrayRegex = /^\[(\"[a-f0-9]*\")(,\"[a-f0-9]*\")*\]$/i;

            //Is the saved value an array stored as a string?
            if (arrayRegex.test(responseList[boxId].saved_value)) {
                //Save both the string version and the array version
                responseList[boxId].saved_value_string = responseList[boxId].saved_value;
                responseList[boxId].saved_value = JSON.parse(responseList[boxId].saved_value);
            } else {
                //Otherwise both versions are strings
                responseList[boxId].saved_value_string = responseList[boxId].saved_value;
            }
        }

        // Populates the object and string values of the submitted response
        function populateSubmittedValue(responseList, boxId) {
            //If the value being returned is an array
            if (typeof responseList[boxId].value === "object") {
                //Let's store the string version of it as well
                responseList[boxId].value_string = JSON.stringify(responseList[boxId].value);
            } else {
                //Otherwise they're both string versions
                responseList[boxId].value_string = responseList[boxId].value;
            }
        }

        // Processes the status of the student's saved response and sets visual flags
        // based on said data.
        function processSaved(responseList, boxId) {
            //Let's keep track that this was saved
            $scope.saved[boxId] = true;
            //This value will indicate if the box was submitted
            if (responseList[boxId].correct != null ) {
                //If it was submitted, let's set the class of the box to either 'correct' or 'incorrect'
                $scope.status[boxId] = responseList[boxId].correct ? ['correct'] : ['incorrect'];
            }
            //If we have a saved value
            if (responseList[boxId].saved_value_string !== null) {
                //Let's set the value of the box to the saved value
                $scope.boxes[boxId] = responseList[boxId].saved_value;
                //If the saved value is not the same as the submitted value, we'll make the checkbox/x grayed out
                if($scope.status[boxId] && responseList[boxId].saved_value_string !== responseList[boxId].value_string){
                    $scope.status[boxId].push("gray");
                }
            } else {
                //Otherwise, let's just set the boxes value to the submitted value.
                $scope.boxes[boxId] = responseList[boxId].value;
            }
        }

        // Process the status of the student's submitted answer and sets marks as appropriate.
        function processSubmitted(responseList, boxId) {
            //If we don't have a saved response...
            $scope.saved[boxId] = false;
            //Set the boxes value to the submitted value
            $scope.boxes[boxId] = responseList[boxId].value;
            //Check for correctness so we can add the right class to the box
            if ( responseList[boxId].correct != null ) {
                if ( responseList[boxId].correct ) {
                    $scope.status[boxId] = ['correct'];
                } else {
                    $scope.status[boxId] = ['incorrect'];
                    if ( responseList[boxId].best_grading_mark ) {
                        $scope.status[boxId].push("best");
                    }
                }
            }
        }

        // Builds the key, previously submitted answer, disabled flag and feedback for a given
        // box ID.
        function buildStaticData(responseList, boxId) {
            //Let's get the keys and feedback while storing the submitted answer disabling the boxes if
            //need be.
            $scope.key[boxId] = responseList[boxId].key ? responseList[boxId].key : null;
            $scope.answers[boxId]  = copy($scope.boxes[boxId]);
            $scope.disabled[boxId] = responseList[boxId].disabled == 'true' ? true : false;
            $scope.feedback[boxId] = responseList[boxId].feedback;
            $scope.solution.solution = responseList[boxId].solution;
        }

        // Watch the previous response data so we can update the question visuals to match
        // the saved/submitted state.
        $scope.$watch("responses", function(responseList) {
            var value;
            var savedValue;

            //Loop over the boxes in the response
            for (var boxId in responseList) {
                if (responseList[boxId] !== null) {

                    populateSavedValue(responseList, boxId);

                    populateSubmittedValue(responseList, boxId);

                    //If we have saved a response (i.e. there was a previous submission, saved or submitted)
                    if (responseList[boxId].saved === 'true') {
                        processSaved(responseList, boxId);
                    } else {
                        processSubmitted(responseList, boxId);
                    }

                    //build keys and feedback, disable fields and store the submitted answer
                    buildStaticData(responseList, boxId);
                }
            }
        });

        // Function used to return the correct class values for multiplechoice and multipleselect
        // box types based on saved/submitted status of the box.
        $scope.keyClass = function(boxId, value) {
            var result = "";
            var key;
            if ($scope.key[boxId]) {
                key = typeof $scope.key[boxId] === "object" ? JSON.stringify($scope.key[boxId]) : $scope.key[boxId];
                if (key.indexOf(value) >= 0) {
                    result = "selected";
                }
            }
            return result;
        };

        // Watches the user input for box answers and updates the marks if the box value has changed
        // from the submitted value.
        $scope.$watch("boxes", function(boxList) {
            for (var boxId in boxList) {
                if (!boxes[boxId]) {
                    (function(boxId){
                        $scope.$watch("boxes." + boxId, function(box) {
                            if ($scope.status[boxId] != null && !contains($scope.status[boxId], "gray")) {
                                if ($scope.answers[boxId] && $scope.answers[boxId].toString() !== $scope.boxes[boxId].toString()) {
                                    $scope.status[boxId].push("gray");
                                }
                            }
                        }, true);
                    })(boxId);
                    boxes[boxId] = true;
                }
            }
        }, true);

        // Basic copy utility
        function copy(value) {
            if (typeof value === "object" && value.length) {
                return value.slice(0);
            } else {
                return value;
            }
        }

        // Basic contains utility
        function contains(a, value) {
            if (a && a.length) {
                for (i = 0; i < a.length; i++) {
                    if (a[i] === value) {
                        return true;
                    }
                }
            }
            return false;
        }

    });


// Code that bootstraps the angular code onto the correct questions on an assignment.
// Each WA2 question wrapper hosts its own Angular application corresponding to the question.

var bootstrapped = false;

(function($) {
    $(document).on('ready', function() {
        if (!bootstrapped) {
            $(".wa2_question").each(function(index) {
                angular.bootstrap(this, ["QuestionApp"]);
            });
            bootstrapped = true;
        }
    });
})(jQuery);



