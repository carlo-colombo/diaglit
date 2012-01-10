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
			it('should have a Modal istance as attribute data-modal',function() {
				var d = require('diaglit')(dialog1)
				expect(d.$dialog.data('modal')).to.be.an.instanceof(ender.fn.modal.Modal)
			})

			it('should initialize dialog using data option',function() {
				var d = require('diaglit')(dialog1,{
						data:{
							'title' : 'overriding title',
							'level' : 30
						}
					}),
					title = d.$dialog.find('[name=title]'),
					level = d.$dialog.find('[name=level]')
				
				expect(title.attr('value')).to.be.equal('overriding title')
				expect(level.attr('value')).to.be.equal(30)
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
							placeholder: 'this is a placeholder'
						},{
							name: 'minimal_configuration_field'
						},{
							name: 'minimal_with_help',
							'help' :'this is a help-block',
							value: 'default value'
						},{
							name:  'textarea_field',
							type:  'textarea',
							value: 'this is a textarea value'
						},{
							name:  'hidden_field',
							type:  'hidden',
							value: 'hide this'
						},{
							name: 'text_field',
							type: 'text',
							value: 'this is a default value'
						}
					]
				
				controls = require('diaglit.controls')

				describe('field function',function(){
					it('should throw NotImplementedException if control is not implemented',function(){
						expect(function() {
							controls.field({
								type: 'not implemented'
							})
						}).to.throw(controls.NotImplementedException)
					})
				})

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

					describe('data',function() {
						it('should used to initialize control',function(){
							var text = controls.field(fields[0],{
									'text_field' : 'this is data'
								}),
								input = text.find('input')
							
							expect(input.attr('value')).to.be.equal('this is data')
						})

						it('should override default value',function() {
							var input = controls.field(fields[5],{
								'text_field' : 'this override default'
							}).find('input')

							expect(input.attr('value')).to.be.equal('this override default')
						})
						
					})
				})

				describe('textarea field',function() {
					var textarea = controls.field(fields[3])
						.find('textarea')
					it('should create textarea as configured',function() {
						expect(textarea).to.be.not.empty
						expect(textarea.text().trim()).to.be.equal('this is a textarea value')
					})

					var textarea = controls.field(fields[3],{
						'textarea_field' : 'this is data'
					}).find('textarea')

					it('should use data to initialize textarea overriding default',function() {
						expect(textarea.text()).to.be.equal('this is data')
					})
				})

				describe('hidden input field',function() {
					var hidden = controls.field(fields[4])
					it('should create input as configured',function() {
						expect(hidden.is('input')).to.be.true
						expect(hidden.attr('type')).to.be.equal('hidden')
						expect(hidden.attr('name')).to.be.equal('hidden_field')
						expect(hidden.attr('value')).to.be.equal('hide this')
					})

					var hidden = controls.field(fields[4],{
						'hidden_field' : 'this is data'
					})
					it('should use data to initialize input overriding default',function() {
						expect(hidden.attr('value')).to.be.equal('this is data')
					})
				})

				describe('select options field',function() {
					var field = {
							name: 'select_field',
							type: 'select',
							options: [
								'value option',
								{'label':'value'},
								{
									'label2':'value2',
									'selected': true
								}
							]
						}
						
					it('should create select-option html',function(){
						var select = controls.field(field).$dialog;

						expect(select.find('select')).to.be.not.null;
						expect(select.find('select > option'))
							.to.be.not.null
							.and
							.to.have.length(3)
					})

					it('should set selected where attribute is present',function() {
						var select = controls.field(field).$dialog;

						expect(select.find('select > option[selected]:eq(3)'))
							.to.be.not.null
							.and
							.to.have.length(1)
					})

					it('should permit data overriding selected value',function() {
						var selectWithData = controls.field(field,{
							'select_field' : 'value option'
						}).$dialog

						expect(selectWithData.find('select > option[selected]:eq(1)'))
							.to.be.not.null
							.and
							.to.have.length(1)
					})
				})
			})
		
			describe('pluggable controls',function() {
				it('should accept additional control',function() {
					var c = require('diaglit.controls');
					
					c['custom'] = function(){
						return $('<span class="kustom">').text('kustom Kontrol')
					}
					
					var d = require('diaglit')({
						title: 'kustomized control',
						tabs : {
							tab : {
								label  : 'tab',	
								fields : [
									{
										type: 'custom',
										name: 'Kustom'
									}
								]
							}
						}		
					})

					expect(d.$dialog.find('.kustom')).to.be.not.empty
					expect(d.$dialog.find('.kustom').is('span')).to.be.true
				})
			})
		})
	})

})