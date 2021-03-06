!function(name, context, definition) {
	if (typeof module !== 'undefined') module.exports = definition(ender);
	else if (typeof define === 'function' && typeof define.amd === 'object') define(ender);
	else context[name] = definition(ender);
}('diaglit.controls', this, function($) {
	var _controls = {},
		_ = require('underscore'),
		control_tpl = _.template('\
			<div class="control-group">\
				<label class="control-label" for="<%= name %>"><%= label %></label>\
				<div class="controls">\
					<% if(help) { %>\
						<span class="help-block"><%= help %></span>\
					<% } %>\
				</div>\
			</div>')

		//export control type
		_.each(['text', 'time', 'date', 'datetime', 'password', 'email', 'range', 'number'], function(ctrl) {
			_controls[ctrl] = field(input);
		});

	//textarea control	
	_controls['textarea'] = field(function(control, data) {
		var prop = _.extend(control, {
			id: control.name
		});

		return $('<textarea>').attr(prop).text(data && data[control.name] || control.value);
	});

	//input type hidden doesn't need field
	_controls['hidden'] = input;

	//select option field
	_controls['select'] = field(function(control, data) {
		var t_opt = _.template('<option <%=selected%> value="<%=value %>" ><%=label%></option>'),
			prop = _(control).clone();

		//removing options from select properties
		delete prop['options']

		return _(control.options).map(getOption).map(function(opt) {
			opt['selected'] = data && data[control.name] == opt['value'] || !! opt['selected'] ? 'selected' : '';
			return t_opt(opt)
		}).reduce(function(select, opt) {
			return select.append(opt)
		}, $('<select>').attr(prop))
	})

	_controls['radio'] = _controls['checkbox'] = field(function(control,data){
		var t_control = _.template('\
			<label class="<%= type %>">\
              <input type="<%= type %>" name="<%=name %>" <%=checked %> value="<%=value %>"><%=label%>\
            </label>');

		return _(control.options)
			.map(getOption)
			.map(function(opt){
				opt['name'] = control['name'];
				opt['type'] = control['type'];
				return opt
			}).map(function(opt){
				if (opt['checked'] 
						&& data
						&& data[opt.name] 
						&& data[opt.name] != opt.value ){
					opt['checked'] = null 
				}
				opt['checked'] = data && data[control.name] == opt['value'] || !! opt['checked'] ? 'checked' : '';
				return t_control(opt)
			}).reduce(function(base,html){
				return base + html
			},'')
	})

	// field generator
	function field(makeInput) {
		return function(control, data) {
			var label = control.label ||
			function(name) {
				return name.charAt(0).toUpperCase() + name.substring(1).replace('_', ' ');
			}, _field = $(control_tpl({
				name: control.name,
				label: _.isFunction(label) ? label(control.name) : label,
				help: control.help
			}))
			_field.find('.controls').prepend(makeInput(control, data))

			return _field
		}
	}

	// input generator

	function input(control, data) {
		control['value'] = data && data[control.name] || control['value'];
		return $('<input>').attr(_(control).extend({
			'id': control.name
		})).css('height', 'auto'); // ??? fix ???
	}

	function getOption(opt){
		return (_.isString(opt)) ? {
			'value': opt,
			'label': opt
		} : opt ;
	}

	_controls['NotImplementedException'] = function(type) {
		this.message = type + " is not implemented"
	}
	_controls['NotImplementedException'].prototype = new Error()
	_controls['NotImplementedException'].prototype.name = 'NotImplementedException'

	Object.defineProperties(_controls, {
		'field': {
			enumerable: false,
			value: function(field, data) {
				if ( !! field.type && !_controls[field.type]) {
					throw new _controls['NotImplementedException'](field.type)
				}
				return _controls[field.type || 'text'](_(field).defaults({
					type: 'text'
				}), data)
			},
		}
	})

	return _controls
})