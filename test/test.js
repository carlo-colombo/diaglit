var expect = require('chai').expect

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

	afterEach(function(done){
		// d && d.$dialog.remove()
		done()
	})

	describe('when created',function(){
		var d = require('diaglit')(dialog1)

		it('should have method open',function(){
			expect(d.open).to.be.a('function')
			d.open()
		})

		it('should have method close',function(){
			expect(d.close).to.be.a('function')
		})
			
		it('should have a DOM read-only property')

		afterEach(function(done){
			done()
		})
	})

	describe('Control',function(){
		var Control;

		it('should be exposed', function(){
			Control = require('diaglit.Control')
		})
	})
})