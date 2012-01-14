describe('diaglit.controls', function() {
	var expect = require('chai').expect,
		_ = require('underscore'),
		controls;

	it('should be exposed', function() {
		controls = require('diaglit.controls')
	})

	it('should contain Control', function() {
		_(controls).each(function(c) {
			expect(c).to.be.a('function')
		})
	})

	var fields = [{
			name: 'text_field',
			type: 'text',
			placeholder: 'this is a placeholder'
		}, {
			name: 'minimal_configuration_field'
		}, {
			name: 'minimal_with_help',
			'help': 'this is a help-block',
			value: 'default value'
		}, {
			name: 'textarea_field',
			type: 'textarea',
			value: 'this is a textarea value'
		}, {
			name: 'hidden_field',
			type: 'hidden',
			value: 'hide this'
		}, {
			name: 'text_field',
			type: 'text',
			value: 'this is a default value'
		}]

	describe('field function', function() {
		it('should throw NotImplementedException if control is not implemented', function() {
			expect(function() {
				controls.field({
					type: 'not implemented'
				})
			}).to.
			throw (controls.NotImplementedException())
		})
	})

	describe('Fields', function() {
		controls = require('diaglit.controls')

		describe('text', function() {

			it('should create a text field', function() {
				var text = controls.field(fields[0]),
					input = text.find('input'),
					label = text.find('label'),
					help = text.find('.help-block')

					expect(text).to.be.not.empty
					expect(input).to.be.not.empty
					expect(help).to.be.empty

					expect(input.attr('type')).to.be.equal('text')
					expect(input.attr('name')).to.be.equal('text_field')
					expect(input.attr('id')).to.be.equal('text_field')

					expect(label.attr('for')).to.be.equal('text_field')
					expect(label.text()).to.be.equal('Text field')
			})

			it('should work with name as only parameter', function() {
				var input = controls.field(fields[1]).find('input')

				expect(input.attr('type')).to.be.equal('text')
			})

			it('should create span.help-block', function() {
				var help = controls.field(fields[2]).find('.help-block')

				expect(help).to.be.not.empty
				expect(help.text().trim()).to.be.equal('this is a help-block')
			})

			describe('data', function() {
				it('should used to initialize control', function() {
					var text = controls.field(fields[0], {
						'text_field': 'this is data'
					}),
						input = text.find('input')

						expect(input.attr('value')).to.be.equal('this is data')
				})

				it('should override default value', function() {
					var input = controls.field(fields[5], {
						'text_field': 'this override default'
					}).find('input')

					expect(input.attr('value')).to.be.equal('this override default')
				})

			})
		})

		describe('textarea', function() {
			it('should create textarea as configured', function() {
				var textarea = controls.field(fields[3]).find('textarea')

				expect(textarea).to.be.not.empty
				expect(textarea.text().trim()).to.be.equal('this is a textarea value')
			})

			it('should use data to initialize textarea overriding default', function() {
				var textarea = controls.field(fields[3], {
					'textarea_field': 'this is data'
				}).find('textarea')

				expect(textarea.text()).to.be.equal('this is data')
			})
		})

		describe('hidden', function() {
			it('should create input as configured', function() {
				var hidden = controls.field(fields[4])

				expect(hidden.is('input')).to.be.true
				expect(hidden.attr('type')).to.be.equal('hidden')
				expect(hidden.attr('name')).to.be.equal('hidden_field')
				expect(hidden.attr('value')).to.be.equal('hide this')
			})

			it('should use data to initialize input overriding default', function() {
				var hidden = controls.field(fields[4], {
					'hidden_field': 'this is data'
				})

				expect(hidden.attr('value')).to.be.equal('this is data')
			})
		})

		describe('select', function() {
			var field = {
				name: 'select_field',
				type: 'select',
				options: ['value option',
				{
					'label': 'label',
					'value': 'value'
				}, {
					'label': 'label2',
					'value': 'value2',
					'selected': true
				}]
			}


			var select = controls.field(field);

			it('should create html select with name attribute', function() {
				expect(select.find('select')).to.be.not.empty;
				expect(select.find('select').attr('name')).to.be.equal('select_field')
			})

			it('should create 3 options inside select', function() {
				expect(select.find('select > option')).to.be.not.empty;
				expect(select.find('select > option').length).to.be.equal(3)
			})

			it('should set first option configured as String', function() {
				expect(select.find('select > option:nth-child(1)').val()).to.be.equal('value option')
				expect(select.find('select > option:nth-child(1)').text().trim()).to.be.equal('value option')
			})

			it('should set second option configured as Object', function() {
				expect(select.find('select > option:nth-child(2)').val()).to.be.equal('value')
				expect(select.find('select > option:nth-child(2)').text().trim()).to.be.equal('label')
			})

			it('should set selected where attribute is present', function() {
				expect(select.find('select > option[selected]:nth-child(3)')).to.be.not.empty
			})

			it('should permit data overriding selected value', function() {
				var selectWithData = controls.field(field, {
					'select_field': 'value option'
				})

				expect(selectWithData.find('select > option[selected]:nth-child(1)')).to.be.not.empty
			})
		})
	})
})