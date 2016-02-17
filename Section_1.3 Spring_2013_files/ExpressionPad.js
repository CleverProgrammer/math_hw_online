(function($) {
	$.fn.ExpressionPad = function(options) {
    	return this.each(function() {
    		var self = this;
            var isIpad = navigator.userAgent.match(/iPad/i);

			function buildPad(padConfig, padName) {
				var padElements = [];
				padElements.push($('<div class="mathHeader '+padName+'"><h3>'+padName+'</h3></div>'));
				
				var $content = $('<div class="mathContent"></div>');
				$.each(padConfig[padName], function(index, drawer) {
					var $panel = $('<div class="mathPanel" id="'+drawer.name+'">');
					var $panelTitle = $('<a href="#" class="mathPanelTitle">'+drawer.name+'</a>');
					if (drawer.properties.open) {
						$panelTitle.addClass('defaultOpen activePanel');
					}
					$panel.append($panelTitle);
					
					$.each(drawer.buttons.pages, function(index, page) {
						$panel.append(buildPage(index, page, drawer.properties));
					});

					$content.append($panel);
				});


				padElements.push($content);
                padElements.push($('<div class="mathFooter"><a class="padHelp" topic="' + padName + 'pad">Help</a>'));

				return padElements;
			};

			function buildButton(name) {
				return $('<a href="#" title="'+name+'" id="'+name+'" class="operation"></a>');
			};

			function buildRow(buttons) {
				var $row = $('<div></div>').addClass('singleRow');
				$.each(buttons, function(i, buttonName) {
					$row.append(buildButton(buttonName));
				});
				return $row;
			};

			function buildPage(pageIndex, pageData, config) {
				var $page = $('<div class="buttonPanel"></div>'),
					buttons = [];

				$.each(pageData, function(key, value) {
					buttons.push(value);

					// create a new row with the current buttons
					if ((key % config.columns == (config.columns - 1)) || (key == pageData.length - 1)) {
						$page.append(buildRow(buttons));
						buttons = [];
					}
				});

				// @todo: fix this hack for greek letter styling to better handle any multipage drawer
				if (config.multipage) {
					if (config.columns == 3) {
						$page.find('.singleRow').addClass('singleGreek');
					}

					if (pageIndex == 0) {
						$page.addClass('firstPage');
						$page.append('<a class="singleRowArrow"><span class="nextPage"></span></a>');
					} else {
						$page.addClass('lastPage');
						$page.prepend('<a class="singleRowArrow"><span class="prevPage"></span></a>');
					}
				}

				return $page;
			};

			var cache = {};
			var padConfig = $(self).data('expressionpad'),
				buttonConfig = $(self).data('buttonconfig');

			/**
			 * Builds and renders the requested pad
			 *
			 * @param string type
			 */
			function render(type) {
				if (type == 'devmath') { type = 'math'; }

				if (!cache[type]) {
					cache[type] = buildPad(padConfig, type);
				}

				$(self).empty();
				cache[type].each(function(el) {
					$(self).append(el);
				});
				$.INST().operation.render(buttonConfig);
			}

			var INST = {
	        	data: {
	        		padConfig: padConfig,
	        		buttonConfig: buttonConfig
	        	},
				animate: new AnimationsEffect(),
				panel: new PanelContainer(),
				operation: new ButtonsOperation(),
				xmlGenerator: new XmlGenerator(),
				externalXml: new ExternalXml()
			};

			$.INST = function() {
				return INST;
			};

			var latexMath,
			xmlSource;

			$.latexMath = function(value) {
				if (value) {
					latexMath = value;
				}
				return latexMath;
			}

			$.xmlSource = function(value) {
				if (value) {
					xmlSource = value;
				}
				return xmlSource;
			}

			
			var idInputOperation = 1,
			    oldInput         = 0,
		        oldPadType       = 0;

			$.INST().operation.init();

			// Hide the modal dialog when someone clicks outside of it.
			$(document).bind('mousedown keyup', function (ev) {
				var t = $(ev.target);
			    if (!t.parents().andSelf().hasClass('mathquill-editable') && !t.parents().andSelf().hasClass('mathContainer')) {
			    	$('.mathquill-editable-focused').parents('.mathquill-scroll-wrapper').scrollLeft(0);
			    	$('.mathquill-editable-focused').removeClass('mathquill-editable-focused');
                    $('.mathquill-editable-focused').removeClass('mathquill-editable-focused-ipad');
			        $('.mathContainer').hide();
			        $.INST().animate.closeExpandedPanel();
			        oldInput = 0;

                    // Trigger a padChanged event to cause the mark to go grey (if the answer has changed)
                    $(".mathpad-wrapper").next().each(function() {
                        this.fireEvent("padChanged", this);
                    });
			    }
			});

            $('body').on('click', 'a.padHelp', function(evt) {
                var topic = $(evt.currentTarget).attr("topic");
                openWindow( '//www.webassign.net/manual/student_guide/?t=' + topic ,'Help','width=937,height=623,scrollbars=yes');
            });

            // MathQuill-ify the pads!
            $('.mathquill-editable').each(function() {
                MathQuill.MathField(this, {
                    restrictMismatchedBrackets: true,
                    autoCommands: 'ge le sqrt alpha beta gamma delta epsilon zeta eta theta iota kappa lambda mu nu xi omicron pi rho sigma tau upsilon phi chi psi omega Alpha Beta Gamma Delta Epsilon Zeta Eta Theta Iota Kappa Lambda Mu Nu Xi Omicron Pi Rho Sigma Tau Upsilon Phi Chi Psi Omega union intersect empty abs hbar infinity exp',
                    autoOperatorNames: 'NOSOLUTION UNDEFINED DNE sin asin arcsin sinh asinh arcsinh cos acos arccos cosh acosh arccosh tan atan arctan tanh atanh arctanh sec asec arcsec sech asech arcsech csc acsc arccsc csch acsch arccsch cot acot arccot coth acoth arccoth log ln'
                });
            });

            $('.mathquill-embedded-latex.disabled').each(function() {
                MathQuill.StaticMath(this);
            });

			// @todo: we should consider doing this only when the input 
			//        enters the viewport so that we don't have to parse 
			//        every question on the page on load
			$('.mathquill-editable, .mathquill-embedded-latex').each(function(){
				var latex,
					questionId = $(this).attr('id').split('editable-math-')[1],
					prevAnswer = $('#' + questionId).val();

				if (prevAnswer != '') {
					latex = $.INST().externalXml.xmlToLaTex(prevAnswer);
                    MathQuill(this).latex(latex);

                    // "Harden" any parens that didn't automagically harden on their own. This mainly
                    // affects langle and rangle brackets
                    jQuery(this).find('.mq-ghost').removeClass('mq-ghost');
				}
			});

			$('.mathquill-editable').bind('mathquill.cursormove', function(evt, cursor){
				var $this = $(this);
				if( !('scrollTimeout' in cursor) ) {
				    cursor.scrollTimeout = setTimeout(function(){
				    	delete cursor.scrollTimeout;
				    	if ( !cursor.parent().length ) return;
				    	var wrapper     = $this.parents('.mathquill-scroll-wrapper');
							borderLeft  = $this.offset().left,
							cursorPos   = cursor.offset().left - borderLeft,
							scrollPos   = wrapper.scrollLeft(),
							borderRight = wrapper.outerWidth() + scrollPos,
							padding     = 20;

						wrapper.find('textarea').css('left', cursorPos).css('top', wrapper.outerHeight()/2);
						if ( cursorPos < scrollPos+padding ) {
							wrapper.scrollLeft(cursorPos - padding);
						} else if ( cursorPos > borderRight-padding ) {
							wrapper.scrollLeft(scrollPos + (cursorPos - borderRight + padding));
						}
				    }, 1);
				}
			});

            function openPad(thisPad) {
				idInputOperation = $(thisPad).attr('id').split('editable-math-')[1];
				$('.mathquill-editable-focused').removeClass('mathquill-editable-focused');
				$(thisPad).addClass('mathquill-editable-focused');
                if (isIpad) {
                    $(thisPad).addClass('mathquill-editable-focused-ipad');
                }
				if(oldInput != idInputOperation){
					$.INST().animate.closeExpandedPanel();
					$.latexMath($(thisPad));
					$.INST().panel.detectFocus();
					var padType = $(thisPad).data('type');
					if (padType != oldPadType) {
                        render(padType);
                        oldPadType = padType;
                    }
					$.INST().panel.showPanel($(thisPad));
					oldInput = idInputOperation;
					$.xmlSource($('#' + idInputOperation));
				}
            };

            $(document).bind('keyup', function(evt) {
                var thisPad = $('.mq-focused');
                if (!thisPad.length || thisPad.hasClass('mathquill-editable-focused')) {
                    return;
                }

                openPad(thisPad[0]);
            });

			$('.mathquill-editable').bind('mousedown', function(evt) {
                openPad(this);
			});

			$.INST().animate.accordionList();
	    });
    };
})(jQuery)
