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

		// afterEach(function(done){
		// 	// d && d.$dialog.remove()
		// 	done()
		// })

		describe('when created',function(){
			var d = require('diaglit')(dialog1)

			describe('show method',function(){
				it('should exist',function(){
					expect(d.show).to.be.a('function')
				})

				it('should work',function(){
					d.show()
				})
			})

			
			describe('hide method',function(){
				it('should exist',function(){
					expect(d.hide).to.be.a('function')
				})

				it('should work',function(){
					d.hide()
				})
			})

			// afterEach(function(done){
			// 	done()
			// })
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
							'help-block' :'this is a help-block'
						}
					]
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
						expect(help.text()).to.be.equal('this is a help-block')
					})
				})

			})
		})
	})
})