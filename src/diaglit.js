!function(name, context, definition) {
	if (typeof module !== 'undefined') module.exports = definition(ender);
	else if (typeof define === 'function' && typeof define.amd === 'object') define(ender);
	else context[name] = definition(ender);
}('diaglit', this, function($) {
	return function(dialog, options) {

		var _ = require('underscore'),
			controls = require('diaglit.controls'),
			_diaglit = {},
			li = _.template('\
				<li>\
					<a href="<%= href %>" data-toggle="tab"><%= label %></a>\
				</li>\
			') //li template definition
		if (_.isFunction(options)) {
			options = {
				'onSubmit': options
			}
		}
		options = _.defaults(options || {}, {
			appendTo: 'body',
			'data': {}
		})

		//dialog skeleton
		_diaglit.$dialog = $(_.template('\
			<div id="<%= id %>" title="<%= title %>" class="modal" data-show="false">\
				<div class="modal-header">\
		            <button type="button" class="close" data-dismiss="modal" aria-hidden="true">x</button>\
		            <h3><%= title %></h3>\
		        </div>\
		        <div class="modal-body">\
		        	<ul class="nav nav-tabs"></ul>\
		        	<form class="tab-content form-horizontal"></form>\
	        	</div>\
	        	<div class="modal-footer">\
		            <a href="#" class="btn secondary cancel">Cancel</a>\
		            <a href="#" class="btn primary save">Save</a>\
		         </div>\
			</div>\
		', {
			id: _.uniqueId('dialog_' + dialog.title.replace(' ', '')),
			title: dialog.title,
		})).hide().appendTo(options.appendTo).modal({
			backdrop: true
		})

		//tabs and fieldset appending
		_(dialog.tabs).map(function(v, k) {
			//iterate through tabs and generate <li> and <fieldset>
			var tabId = _.uniqueId(k)
			return [
			$(li({
				href: '#' + tabId,
				label: v.label || k
			})), _.reduce(v.fields, function($fieldset, field) {
				//generate fields and append to field
				return $fieldset.append(controls.field(field, options['data']))
			}, $('<fieldset>').attr({
				'id': tabId,
				'class': 'tab-pane'
			}))]
		}).reduce(function(memo, tab) { // [(li,fieldset),(li,fieldset),...]
			$(memo[0]).append(tab[0]); //ul += li
			$(memo[1]).append(tab[1]); //form += fieldset
			return memo
		}, _diaglit.$dialog.find('ul,form')); //memo

		(function(d) {
			d.find('li:nth-child(1),fieldset:nth-child(1)').addClass('active')

			//hide tabs for single tab dialogs
			if(d.find('.nav-tabs li').length == 1){
				d.find('ul.nav-tabs').hide()
			}

			d.find('.btn.cancel').bind('click', function(e) {
				e.stop()
				d.modal('hide')
			})
			if (options['onSubmit']) {
				d.find('.btn.save').bind('click', options['onSubmit'])
				if (options['hideOnSubmit']) {
					d.modal('hide')
				}
			}
		})(_diaglit.$dialog);

		return _diaglit;
	}
});