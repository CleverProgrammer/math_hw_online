/**
 * PanelContainer Object
 * This object is utilize to show or hide the right panel.
 * Also, set the top position of this panel
 * 
 * @author Perretta Marcelo - VPA 2012
 */
var PanelContainer = function(){

	var $ = jQuery;

	/**
	 * This method detect form wich input it's called the panel, and show (hide) the same, 
	 * and set the position.
	 * 
	 * @param object inputDetected
	 * 
	 */
	function showPanel(inputDetected){
		var fieldElement = '#' + inputDetected.attr('id');
		var visualElement = '.mathContainer';
		var mathPosition = setPositionMathPanel(visualElement, fieldElement);
	    var div = $(visualElement).css('top', mathPosition).show();
	    $.INST().animate.activatePanel($('.mathPanelTitle.activePanel'));
	}
	
	/**
	 *This method detect wich element has the focus. 
	 *If the element who has focus it's different to a textarea, 
	 *the script force and applied the focus in that textarea.
	 *
	 *We do this, to maintence the keyboard available for the 
	 *user all the time in the iPad.
	 * 
	 */
	function detectFocus(){
		if(document.activeElement.tagName != "TEXTAREA"){
			jQuery.latexMath().find('textarea').focus();
		}
	}
	
	/**
	 * This method calculate the postion where the panel should be show it 
	 * 
	 * @param object mathPanel
	 * @param object inputCalling
	 * 
	 * @returns number setMathPosition
	 * 
	 */
	function setPositionMathPanel(mathPanel, inputCalling){
		var middleMathTool = $(mathPanel).height() / 2;
		
		var middleInputFormula = $(inputCalling).height() / 2;
		
		var positionInput = $(inputCalling).offset();
		var positionMiddle = positionInput.top + middleInputFormula;
		
		var setMathPosition = positionMiddle - middleMathTool;

        // Ensure that the drawer will never appear above the screen, such as in the
        // Class Insights question preview
	    if (setMathPosition < 0) {
            setMathPosition = 30;
        };

		return setMathPosition;	
	}
	
	return {
		/**
		 * This method call the private method showPanel 
		 * to ceate the effect.
		 * 
		 * @param object inputDetected
		 * 
		 * @returns
		 */
		showPanel:function(inputDetected){
			return showPanel(inputDetected);
		},
		/**
		 * This method call the private method detectFocus 
		 * to ceate the effect.
		 * 
		 * @returns
		 */
		detectFocus:function(){
			return detectFocus();
		}		
	};
};
