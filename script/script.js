(function($, _) {
	$.domReady(function() {
		var diaglit = require('diaglit');

		_($('.dialog-definition')).each(function(el) {
			var $el = $(el),
				d = diaglit(JSON.parse($el.text()));
			
			$el.previous()
				.attr('data-controls-modal',d.$dialog.attr('id'))
		})
	})
})(ender, require('underscore'))