/**
 *
 */
!function (name, context, definition) {
  if (typeof module !== 'undefined') module.exports = definition(name, context);
  else if (typeof define === 'function' && typeof define.amd  === 'object') define(definition);
  else context[name] = definition(ender);
}('diaglit', this, function ($) {
	return function(dialog, options){
	
		var _ = require('underscore'),
			controls = require('diaglit.controls')
			_diaglit = {},
			li = _.template('\
				<li>\
					<a href="<%= href %>"><%= label %></a>\
				</li>\
			') //li template definition

		if(_.isFunction(options)){
			options = {
				onSubmit: options
			}
		}
		options = _.defaults(options || {}, {
			appendTo : 'body'
		})

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
			id: _.uniqueId('dialog_'+dialog.title.replace(' ','')),
			title: dialog.title,			
		}))
		.hide()
		.appendTo(options.appendTo)
		.modal({
			backdrop:true
		})

		//tabs and fieldset appending
		_(dialog.tabs).map(function(v,k){
			return [
				$(li({
					href: '#'+k,
					label: v.label || k
				})),
				_.reduce(v.fields,function($fieldset, field){
					return $fieldset.append(controls.field(field))
				},$('<fieldset>'))
			]
		}).reduce(function(memo,tab){
			return _(memo).each(function(v,i){
				$(v).append(tab[i])
			})
		},_diaglit.$dialog.find('ul,form'));

		(function(d){
			d.find('li:eq(1),fieldset:eq(1)').addClass('active')
			d.find('.btn.cancel').bind('click',function(e){
				e.stop()
				d.modal('hide')
			})
		})(_diaglit.$dialog);

		return _diaglit;
	}
})

!function (name, context, definition) {
  if (typeof module !== 'undefined') module.exports = definition(name, context);
  else if (typeof define === 'function' && typeof define.amd  === 'object') define(definition);
  else context[name] = definition(ender);
}('diaglit.controls', this, function ($) {
	var _controls ={},
		_ = require('underscore'),
		control_tpl = _.template('\
			<div class="clearfix">\
				<label for="<%= name %>"><%= label %></label>\
				<div class="input">\
					<% if(help) { %>\
						<span class="help-block"><%= help %></span>\
					<% } %>\
				</div>\
			</div>')

	//export control type
	_.each(['text','time','date','datetime', 'password', 'email','range','number'],function(ctrl){
		_controls[ctrl] = field(input);
	});

	//textarea control	
	_controls['textarea'] = field(function(control,data){
		var prop = _.extend(control,{
			id: control.name
		});

		return $('<textarea>')
			.attr(prop)
			.text(data && data[control.name] || control.value);
	});

	//input type hidden doesn't need field
	_controls['hidden'] = input;

	// field generator
	function field (makeInput) {
		return function(control,data){
			var label = control.label || function(name){
					return name.charAt(0).toUpperCase()
						+ name.substring(1).replace('_',' ');
				},
				_field = $(control_tpl({
					name : control.name,
					label: _.isFunction(label) ? label(control.name) : label,
					help : control.help
				}))
				_field.find('.input')
				.prepend(makeInput(control,data))

			return _field 
		}
	}

	// input generator
	function input(control){
		return $('<input>')
			.attr(_(control).extend({
				id: control.name
			})).css('height','auto');  // ??? fix ???
	}

	_controls['NotImplementedException'] = function(type){this.message = type + " is not implemented"}
	_controls['NotImplementedException'].prototype = new Error()
	_controls['NotImplementedException'].prototype.name = 'NotImplementedException'

	Object.defineProperties(_controls,{
		'field':{
			enumerable: false,
			value : function (field,data){
				if (!!field.type && !_controls[field.type]) {
					throw new _controls['NotImplementedException'](field.type)
				}
				return _controls[field.type || 'text' ](_(field).defaults({type:'text'}),data)
			},
		}
	})



	return _controls
})
