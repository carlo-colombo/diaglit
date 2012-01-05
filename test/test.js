var expect = require('chai').expect
ender.domReady(function(){

	describe('diaglit',function(){
		var diaglit,
			d,
			_ = require('underscore'),
		    dialog1 = {
				"tabs":{
					"tab1" : {
						"label" : "Tab 1",
						"fields":[
							{
								"name": "title",
								"type": "text",
								"placeholder": "Insert name here",
								"label": "Character name"
							},
							{
								"name": "characterClass",
								"type": "text",
								"label": "class"
							},
							{
								"name": "level",
								"type": "number",
								"max": 30,
								"min":1,
								"value": 1
							}			]
					}
				},
				"title": "Properties"
			}

		it('should be exposed',function(){
			diaglit =require('diaglit');
		})

		it('should not throws any error',function(){
			d = diaglit(dialog1)
		})

		it('should accept config object as 2nd argument', function(){
			d = diaglit(dialog1, {});
		})

		it('should accept callback function as 2nd argument',function(){
			d = diaglit(dialog1,function () {})
		})

		describe('when created',function(){
			var d = require('diaglit')(dialog1)

			describe('show method',function(){
				it('should work',function(){
					d.$dialog.modal('show')
					expect(d.$dialog.css('display')).to.be.not.equal('none')
				})
			})

			
			describe('hide method',function(){
				it('should work',function(){
					d.$dialog.modal('hide')
					expect(d.$dialog.css('display')).to.be.equal('none')
				})
			})
			
			describe('toggle method',function(){
				var state = d.$dialog.css('display')

				it('should work',function(){
					d.$dialog.modal('toggle')
					expect(d.$dialog.css('display')).to.be.not.equal(state)
				})
			})
		})

		describe('controls',function(){
			var controls;

			it('should be exposed', function(){
				controls = require('diaglit.controls')
			})

			it('should contain Control',function(){
				_(controls).each(function(c){
					expect(c).to.be.a('function')
				})
			})

			describe('Control',function(){
				var fields = [
						{
							name: 'text_field',
							type: 'text',
							placeholder: 'this is a placeholder',
						},{
							name: 'minimal_configuration_field'
						},{
							name: 'minimal_with_help',
							'help' :'this is a help-block'
						},{
							name:  'textarea_field',
							type:  'textarea',
							value: 'this is a textarea value'
						},{
							name:  'hidden_field',
							type:  'hidden',
							value: 'hide this'
						}
					]
				
				controls = require('diaglit.controls')

				describe('text field',function(){
					
					it('should create a text field',function(){
						var text = controls.field(fields[0]),
							input = text.find('input'),
							label = text.find('label'),
							help  = text.find('.help-block')

						expect(text).to.be.not.empty
						expect(input).to.be.not.empty
						expect(help).to.be.empty

						expect(input.attr('type')).to.be.equal('text')		
						expect(input.attr('name')).to.be.equal('text_field')
						expect(input.attr('id')).to.be.equal('text_field')

						expect(label.attr('for')).to.be.equal('text_field')
						expect(label.text()).to.be.equal('Text field')
					})

					it('should work with name as only parameter',function(){
						var input = controls.field(fields[1]).find('input')
				
						expect(input.attr('type')).to.be.equal('text')
					})

					it('should create span.help-block',function() {
						var help = controls.field(fields[2]).find('.help-block')
						
						expect(help).to.be.not.empty
						expect(help.text().trim()).to.be.equal('this is a help-block')
					})
				})

				describe('textarea field',function() {
					var textarea = controls.field(fields[3])
						.find('textarea')
					
					it('should create a textarea',function() {
						expect(textarea).to.be.not.empty
					})

					it('should use value to defining inner text',function() {
						expect(textarea.text().trim()).to.be.equal('this is a textarea value')
					})
				})

				describe('hidden input field',function() {
					var hidden = controls.field(fields[4])
					it('should be only an input tag',function() {

						expect(hidden.is('input')).to.be.true
					})

					it('should have type equal hidden',function() {
						expect(hidden.attr('type')).to.be.equal('hidden')
					})


					it('should have value as configured',function() {
						expect(hidden.attr('value')).to.be.equal('hide this')
					})
				})
			})
		})
	})
})