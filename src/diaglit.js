/**
 *
 */
!function (name, context, definition) {
  if (typeof module !== 'undefined') module.exports = definition(name, context);
  else if (typeof define === 'function' && typeof define.amd  === 'object') define(definition);
  else context[name] = definition(ender);
}('diaglit', this, function ($) {
	return function(dialog, options){
	
		var _ = require('underscore')
		if(_.isFunction(options)){
			options = {
				callback: options
			}
		}
		options = _.defaults(options || {}, {
			appendTo : 'body'
		})

		var _diaglit = {}

		//dialog skeleton
		_diaglit.$dialog  = $(_.template('\
			<div id="<%= id %>" title="<%= title %>" class="modal">\
				<div class="modal-header">\
		            <a href="#" class="close">x</a>\
		            <h3><%= title %></h3>\
		        </div>\
		        <div class="modal-body">\
		        	<ul class="tabs" data-tabs="tabs"></ul>\
		        	<form class="tab-content"></form>\
	        	</div>\
	        	<div class="modal-footer">\
		            <a href="#" class="btn secondary cancel">Cancel</a>\
		            <a href="#" class="btn primary save">Save</a>\
		         </div>\
			</div>\
		',{
			id: 'dialog_'+dialog.title.replace(' ',''),
			title: dialog.title,			
		})).appendTo(options.appendTo)

		//tabs and fieldset appending
		_(dialog.tabs).map(function(v,k){
			return [
				$('<li>').append($('<a>').attr({
					href: '#'+k
				}).text(v.label || k)),
				_.reduce(v.fields,function($fieldset, field){
					return $fieldset.append($('<input>').attr(field))//todo complete
				},$('<fieldset>'))
			]
		}).reduce(function(memo,tab){
			return _(memo).each(function(v,i){
				$(v).append(tab[i])
			})
		},_diaglit.$dialog.find('ul,form'))

		_diaglit.open = function(){
			_diaglit.$dialog.show()	
		}

		return _diaglit;
	}
})