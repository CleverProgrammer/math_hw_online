/**
 * AnimationEffect Object
 * This object is utilize to show the efect for each group of functions inside the panel.
 * 
 * @author Perretta Marcelo - VPA 2012
 */
var AnimationsEffect = function(){
	
	var $ = jQuery;

	var $open; // Active List
	var $links = $('a.mathPanelTitle'); // Collection of anchors
	var $lists = $('div.buttonPanel'); // Collection of lists
	var $rows = $('a.singleRowArrow');// Collection of rows
	
	/**
	 * This method display the effect for each group of buttons.
	 * Hide and show the extra panel
	 */
	function accordionList(){
		// Apply Accordion funcionality to all links
		$('#padContainer').on('click', 'a.mathPanelTitle', function(event) {
			$.INST().panel.detectFocus();
			event.preventDefault();

			activatePanel([this]);
		});
		
		extraButtons();
	}

	function activatePanel(panels) {
		$.each(panels, function(index, panel) {
			if ($open) {
			    // close the currently open panel
			    $open.siblings('.buttonPanel').hide();
	            $open.removeClass('activePanel');
			}

			if ($(panel).is($open)) {
				$open = '';
			} else {
			    // open whichever panel was clicked
				$(panel).next().show();
				$(panel).addClass('activePanel');
				$open = $(panel);

				// calculate the offset for the opened panel
				calculatePanelPosition($(panel));
			}
		});
	}

	/**
	 * Positions the buttonPanels relative to the drawer title
	 * 
	 * @param jQuery object $title (eg. $(<a href="#" class="mathPanelTitle">operations</a>))
	 */
	function calculatePanelPosition($title) {

		$title.siblings('.buttonPanel').each(function(index, panel) {
			var $panel = $(panel);

			// we don't need to recalculate the offset
			if ($panel.css('top') != '0px') {
				return;
			}

			var offset,
				padding = 9, // amount of top padding for panel buttons
				h = $panel.height(),
				h2 = $('.mathContainer').height(),
				h3 = $title.height(),
				dx = (h2 - h) / 2,
				dy = $title.offset().top - $('.mathContainer').offset().top,
				dz = $('.mathContainer').offset().top + h - $title.offset().top;

			if (h > h2) { // drawer is bigger than pad
				offset = -(dy);
			} else if (dx > dy) { // panel would be too low if centered
				offset = -(padding);
			} else if ((dx + h) < dz) { // panel would be too high if centered
				offset = -(h - h3 - padding);
			} else { // panel should be centered
				offset = dx - dy;
			}

			$panel.css('top', offset);
		});
	}
	
	/**
	 * This method allows paging through multipage panels
	 */
	function extraButtons(){
		$('#padContainer').on('click', 'a.singleRowArrow', function(event) {
			$page = $(this).closest('.buttonPanel');
			if($(this).children().attr('class') == 'nextPage'){
				$page.hide();
				$page.next().show();
			} else {
				$page.hide();
				$page.prev().show();
			}
		});
	}
	
	/**
	 * This method display close all panels
	 */
	function closeExpandedPanel(){
	    if( $open ) {
    		$open.siblings('.buttonPanel').hide();
    		$open.removeClass('activePanel');
    		$open = '';
        }
        $('.defaultOpen').addClass('activePanel');
	}
	
	return {
		/**
		 * This method call the private method accordionList 
		 * to ceate the effect.
		 * 
		 * @returns
		 */
		accordionList:function(){
			return accordionList();
		},
		/**
		 * This method call the private method closeExpandedPanel 
		 * to ceate the effect.
		 * 
		 * @returns
		 */
		closeExpandedPanel:function(){
			return closeExpandedPanel();
		},

		/**
		 * Activates a panel and deactivates the rest
		 */
		activatePanel:function(panels){
			return activatePanel(panels);
		}
	};
};