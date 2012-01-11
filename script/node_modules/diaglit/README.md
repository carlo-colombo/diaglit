diaglit (Dialog builder based on twitter-bootstrap)
===================================================

Feature
-------
* Multiple tab
* Built in controls
  * input of type hidden, text, time, date, datetime, password, email, range, number
  * textarea
  * select
  * ...
* Pluggable custom controls
* Dialog initializazion

Dependencies
------------
* [qwery](https://github.com/ded/qwery)
* [bean](https://github.com/fat/bean)
* [ender-twitter-bootstrap](http://rvagg.github.com/bootstrap/javascript.html)
* [underscorejs](http://documentcloud.github.com/underscore)

Use
------------
* include `<link rel="stylesheet" href="http://twitter.github.com/bootstrap/1.4.0/bootstrap.min.css">` in your html
* ```
	var diaglit =require('diaglit'), //require diaglit
		dialog = diaglit({...});

	dialog.$dialog.modal('show')
```
* Example object description
* ```
	{
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
``` 
* Configurable submit function 
* ```
	dialog = diaglit({...}, {
		onSubmit : function(){...}
	});
``` 
shortcut: `dialog = diaglit({...}, function(){})`
* Data initialization 
* ```
	dialog = diaglit({...}, {
		data: {
			field_name1: 'value1',
			field_name2: 12
		}		
	});
```
* Custom controls
* ```
	var controls = require('diaglit.controls');
		controls['custom'] = function(field,data){
			... return some DOM
		}

	var	dialog = require('diaglit')({
		....
		"fields" : [
			{
				type : "custom",
				name : "custom name"
			}
		]
	})
```
