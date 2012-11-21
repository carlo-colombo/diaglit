var expect = require('chai').expect
ender.domReady(function() {
	describe('diaglit', function() {
		var diaglit, d, _ = require('underscore'),
			dialog1 = {
				"tabs": {
					"tab1": {
						"label": "Tab 1",
						"fields": [{
							"name": "title",
							"type": "text",
							"placeholder": "Insert name here",
							"label": "Character name"
						}, {
							"name": "characterClass",
							"type": "text",
							"label": "class"
						}, {
							"name": "level",
							"type": "number",
							"max": 30,
							"min": 1,
							"value": 1
						}]
					},
					"tab2": {
						"label": "Tab 2",
						"fields": [{
							"name": "select",
							"type": "select",
							"options": ["option 1", "option 2"]
						},{
							"name": "radio",
							"type": "radio",
							"options" :["first radio", "second radio"]
						}]
					}
				},
				"title": "Properties"
			}

		it('should be exposed', function() {
			diaglit = require('diaglit');
		})

		it('should not throws any error', function() {
			d = diaglit(dialog1)
		})

		it('should accept config object as 2nd argument', function() {
			d = diaglit(dialog1, {});
		})

		it('should accept callback function as 2nd argument', function() {
			d = diaglit(dialog1, function() {})
		})

		describe('when created', function() {
			it('should initialize dialog using data option', function() {
				var d = require('diaglit')(dialog1, {
					data: {
						'title': 'overriding title',
						'level': 30
					}
				}),
					title = d.$dialog.find('[name=title]'),
					level = d.$dialog.find('[name=level]')

					expect(title.attr('value')).to.be.equal('overriding title')
					expect(level.attr('value')).to.be.equal('30')

					d.$dialog.modal('show')
			})
		})

		describe('pluggable controls', function() {
			it('should accept additional control', function() {
				var c = require('diaglit.controls');

				c['custom'] = function() {
					return $('<span class="kustom">').text('kustom Kontrol')
				}

				var d = require('diaglit')({
					title: 'kustomized control',
					tabs: {
						tab: {
							label: 'tab',
							fields: [{
								type: 'custom',
								name: 'Kustom'
							}]
						}
					}
				})

				expect(d.$dialog.find('.kustom')).to.be.not.empty
				expect(d.$dialog.find('.kustom').is('span')).to.be.true
			})
		})
	})
})