var expect = require('chai').expect
ender.domReady(function(){
	describe('diaglit',function(){
		var diaglit,
			d,
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

			it('should contain Control')

			describe('Control',function(){
				
			})
		})
	})
})