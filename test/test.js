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

			
			describe('show method',function(){
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
							name: 'minimal_configuration_field'
						},
						{
							name: 'text_field',
							type: 'text'
						},
						{
							name: 'with_placeholder',
							type: 'text',
							placeholder: 'this is a placeholder'
						}
					]

				it('should work with name as only parameter',function(){
					var text = controls.field(fields[0]),
						input = text.find('input'),
						label = text.find('label')

					expect(text).to.be.not.empty
					expect(input).to.be.not.empty
					expect(input).to.have.length(1)
					expect(input.attr('type')).to.be.equal('text')
					expect(input.attr('name')).to.be.equal('minimal_configuration_field')
					expect(input.attr('id')).to.be.equal('minimal_configuration_field')
					expetc(label.attr('for')).to.be.equal('minimal_configuration_field')
					expetc(label.text()).to.be.equal('Minimal configuration field')

				})
				it('should create a text field')
				it('should create a text field with placeholder')
			})
		})
	})
})