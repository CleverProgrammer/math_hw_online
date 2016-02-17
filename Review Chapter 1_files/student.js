angular.module('StudentApp', ["QuestionApp"])
  .controller("studentView", function($scope, $http, $element, $timeout) {

    $scope.messages = [];
    $scope.text = "";
    $scope.wait = true;
    $scope.show = false;
    $scope.last = {};

    $scope.$watch("show", function(newVal) {
        if (newVal && $scope.messages.length > 0) {
            var messageIds = [],
                messages   = [],
                i          = 0;
            for (; i < $scope.messages.length; i++) {
                if ($scope.messages[i].isRead === false && $scope.messages[i].originator === "faculty") {
                    messages.push($scope.messages[i]);
                    messageIds.push($scope.messages[i]._id);
                }
            };
            if (messageIds.length > 0) {
                $http.post('/web/Rest/AYT/read_messages', {
                    isRead: 1,
                    messageIds: messageIds,
                    sectionId: $scope.sectionId
                })
                .success(function(response) {
                    for (var i = 0; i < messages.length; i++) {
                        messages[i].isRead = true;
                    }
                    if ($scope.icon) {
                        $scope.icon.addClass('sent').removeClass('received');
                    }
                });
            }
        }
    });

    $scope.submit = function($event) {
        $event.preventDefault();
        var text = $scope.text;
        $scope.sendError = false;
        $scope.wait = true;
        $http.post('/web/Rest/AYT/submit_message', {
            studentId: $scope.studentId,
            deploymentId: $scope.deploymentId,
            questionId: $scope.questionId,
            sectionId: $scope.sectionId,
            text: $scope.text,
            originator: "student"
        }).success(function(response, status, headers, config){
            $scope.messages.push(response.result);
            $scope.wait = false;
            $scope.text = "";
            $scope.show = false;
            $scope.last = response.result;
            updateIcon();
            markAsUnanswered();
        }).error(function(data, status, headers, config){
            $scope.wait = false;
            $scope.sendError = true;
            $timeout(function(){
                var errorMessage = angular.element($element.find('.ayt-messages'));
                errorMessage.scrollTop(9001);
            });
        });
        //http post text, studentId, questionId, deploymentId
        //on success $scope.text = ""; $scope.wait = false; add message to $scope.messages
    };

    function updateIcon() {
        $scope.icon.toggle();
        $scope.icon.addClass('sent').removeClass('received');
        $scope.icon.find('.alt-text').html('Ask your teacher message sent');
        $scope.icon.find('.ayt-notify').show().delay(5000).toggle("slide");
    }
   
    function markAsUnanswered() {
        var messageIds = [];
        var hasFaculty = false;

        for (var i = 0; i < $scope.messages.length; i++) {
            messageIds.push($scope.messages[i]._id);
            if ($scope.messages[i].originator === "faculty") {
                hasFaculty = true;
            }
        }

        if (hasFaculty) {
            $http.post('/web/Rest/AYT/answer_messages', {
                isAnswered: 0,
                messageIds: messageIds
            })
            .success(function() {})
            .error(function() {});
        }
    } 

    $scope.$watchCollection('[studentId, questionId, deploymentId, sectionId]', function(newVals, oldVals) {
        if (newVals && newVals.length) {
            for (var val in newVals) {
                if (val == null) {
                    return;
                }
            }

            $scope.wait = false;

            $scope.$watch("check", function(check) {
                if (check === true) {
                    $http.get("/web/Rest/AYT/messages_for_question?studentId=" + $scope.studentId + "&deploymentId=" + $scope.deploymentId + "&questionId=" + $scope.questionId)
                        .success(function(response, status, headers, config) {
                            $scope.messages = response.result;
  
                            if( $scope.messages.length ) {
                                $scope.last = $scope.messages[$scope.messages.length - 1];
                                if( hasNewMessage($scope.last)){
                                    $scope.icon.addClass('received').removeClass('sent');
                                    $scope.icon.find('.alt-text').html('Ask your teacher Response available');
                                } else {
                                    $scope.icon.addClass('sent').removeClass('received');
                                    $scope.icon.find('.alt-text').html('Ask your teacher mmessage sent');
                                }
                            }
                        })
                        .error(function(data, status, headers, config) {

                        });
                    //http get all messages
                }
            });
        }
    });

    function hasNewMessage(last){
      return (last && last.originator && last.originator === 'faculty' && last.isRead !== true)
    }
  });


(function($) {
    $(document).on('ready', function() {
        $("._ayt").each(function(index) {

            var el          =   this;
            angular.bootstrap(el, ["StudentApp"]);

            var scope       =   angular.element($(el).find("._ayt-controller")).scope(),
                $body       =   $(el).parents('body'),
                $controls   =   $(el).parents('.waQBox').find('.detailsLink.expand'),
                $icon       =   $controls.closest('._aytIcon'),

                toggle = function(scope) {
                    var $el = $(el).find(".ayt-messages");
                    $icon.toggleClass('close open');
                    scope.$apply(function() {
                        scope.show = !scope.show;
                    });

                    $el.scrollTop($el.prop('scrollHeight'));
                };

            $controls.each(function(i) {

                if( $(this).hasClass('_aytIcon') ) {
                    // AYT Clicked
                    $(this).on("click", function(event) {
                        if( $controls.closest('.open:not(._aytIcon)').length ) {
                            $controls.closest('.open:not(._aytIcon)').click();
                        }
                        toggle(scope);
                    });

                    // Set the Icon $scope variable
                    var $iconEl = $(this).find('.ayt-icon');
                    scope.$apply(function() {
                        scope.icon = $iconEl;
                        scope.icon.toggle = function() {
                            $icon.toggleClass('close open');
                        };
                    });

                } else {
                    // Other Control Clicked
                    $(this).on("click", function(event) {
                        if( $controls.closest('._aytIcon').hasClass('open') ) {
                            toggle(scope);
                        }
                    });
                }
                
            });
        });
    });
})(jQuery)
