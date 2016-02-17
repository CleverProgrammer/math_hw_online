/**
 * ButtonsOperation Object
 * This object set the symbols for each button and run the corresponding operation
 * 
 * @author Perretta Marcelo - VPA 2012
 */
var ButtonsOperation = function() {
	var $ = jQuery;

	function init(){
		var buttonConfig = $.INST().data.buttonConfig;
		$('#padContainer').on('click', '.operation', function(event) {
			event.preventDefault();
			// @todo: Replace closest('a') with something more reliable
			var buttonId = $(event.target).closest('a').attr('id');
			runOperation(buttonConfig.operations[buttonId]);
		});
		render(buttonConfig);
	}
	
	/**
	 * This method set the label for each button operation
	 * 
	 * @param object val
	 */
	function setLabel(val){
		/*BUTTONS*/
		var linkOperation = $('.mathContainer').find('a#' + val.id + '.operation');
		if( val.label ) {
		  linkOperation.html(val.label);
		}
		if(val.rendered) {
            MathQuill.StaticMath(linkOperation[0]);
		}
		if(val.graphic) {
		    linkOperation.addClass('graphic').append('<span></span>');
		}
	}
	
	/**
	 * This method run the correct operation and draw the formula in the correct input
	 * 
	 * @param object dataButton
	 */
	function runOperation(dataButton){
		$.INST().panel.detectFocus();
		var thisPad = MathQuill($.latexMath()[0]);
		var script = dataButton.script;

        // Buttons can trigger a script, which utilizes MathQuill's cmd, keystroke,
        // and typedText functions to create input that would otherwise be ugly
        // if produced by latex directly or hacking in some sort of cursor placer code.
        // For example, how else would we insert a general log? (log_{x}(y)). This also
        // helps place highlighted text into the operation versus just clobbering it
		if (script) {
            $.each(script, function(key, operation) {
                if (operation.cmd) {
                    thisPad.cmd(operation.cmd);
                }
                else if (operation.keystroke) {
                    thisPad.keystroke(operation.keystroke);
                }
                else if (operation.typedText) {
                    thisPad.typedText(operation.typedText);
                }
            });
        }
        else {
		    var operation = dataButton.symbol.split(',');
		    $.each(operation, function(key, value){
		        if ( value.match(/^\\[a-zA-Z]+$/) ) {
                    thisPad.cmd(value);
		        }
		        else {
                    thisPad.write(value);
		        }
		    });
        }
	}

	/**
	 * Render buttons
	 *
	 * @param object data
	 */
	function render(data) {
		$.each(data.operations, function(key, val) {
            setLabel(val);
        });
	}

	return {
		/**
		 * This method call the private method init 
		 * 
		 * @returns
		 */
		init:function(){
			return init();
		},
		
		render:function(data){
		    return render(data);
		}
	}
}
