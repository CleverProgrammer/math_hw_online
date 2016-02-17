"use strict";

angular.module("Latex.Service", [])

.factory("latexService", function($window, mathJax) {
    return { 
        compileLatex: function(rootElement) {
            if ($window.LaTeX2HTML5) {
                jQuery(rootElement[0]).find('.wa-figure-latex').each(function (i, el) {
                    var $el = angular.element(el);
                    var TEX = new $window.LaTeX2HTML5.TeX({
                        tagName: 'section',
                        className: 'latex-container wa-math',
                        latex: $el.text()
                    });
                    TEX.render();
                    $el.replaceWith(TEX.$el);
                });
            } 

            if (mathJax && mathJax.Hub && mathJax.Hub.Queue) {
                mathJax.Hub.Queue(["Typeset", mathJax.Hub]);
            }
        }
    };
});
