/**
 * @protected
 * @type {Object}
 * @properties={typeid:35,uuid:"85CF64ED-BFB9-4808-A01C-67528198420C",variableType:-4}
 */
var swaggerBasicDoc = {
	swagger:"2.0",
	info: {
		"version": application.getSolutionRelease(),
		"title": "i18n:servoy.swaggerDocTitle"
	},
	host: parsedHostUrl(),
	produces: ["application/json"],
	schemes: (application.isInDeveloper() ? "http" : "https"),
	definitions: {},
	parameters: {},
	paths: {},
	responses: {},
	securityDefinitions: {},
	tags:[]
	
	
}

/**
 * @private
 * @return {String}
 * @properties={typeid:24,uuid:"60AA4139-BDA1-41A2-BD47-11D57973EC8C"}
 */
function parsedHostUrl() {
	var host = scopes.svyNet.parseUrl(application.getServerURL());
	return host.host + ":" + host.port + '/servoy-service/rest_ws/' + application.getSolutionName()
}

/**
 * @private
 *  
 * @return {Array<{paths: String, tags:Array<*>}>}
 * 
 * @properties={typeid:24,uuid:"89DDAB94-EBD7-45BC-94C4-A6DA14D9C65F"}
 */
function getAllApiForms() {
	var apiFiles = scopes.svyUI.getJSFormInstances('api');
	/**@type {Array<{paths: String, tags:Array<*>}>} */
	var comments = [];
	var docExtractor = new scopes.doctrine.Extractor()
	apiFiles.forEach(/**@param {JSForm} jsForm */ function(jsForm) {
		var methods = jsForm.getMethods(true);
		for each (var method in methods) {
			if (method.getName().match(/^ws_/)) {
				var parsedDoc = docExtractor.transform(method.code);
				comments.push(addServoyRequirements(parsedDoc, jsForm.name, method.getName()));
			}
		}	
	})
	return comments;
}


/**
 * @private
 *  
 * @return {Array<{paths: String, tags:Array<*>}>}
 * 
 * @properties={typeid:24,uuid:"4C4AB8A4-F21B-4995-9670-67B88F91C457"}
 */
function getAllApiScopes() {
	var scopeNames = solutionModel.getScopeNames().filter(function(item) {
		return solutionModel.getGlobalMethods(item).filter(function(method) {
			return method.getName().match(/^ws_/)
		}).length
	});
	
	/**@type {Array<{paths: String, tags:Array<*>}>} */
	var comments = [];
	var docExtractor = new scopes.doctrine.Extractor()
	scopeNames.forEach(/**@param {String} scopeName */ function(scopeName) {
		var methods = solutionModel.getGlobalMethods(scopeName);
		for each (var method in methods) {
			if (method.getName().match(/^ws_/)) {
				var parsedDoc = docExtractor.transform(method.code);
				comments.push(addServoyRequirements(parsedDoc, scopeName, method.getName()));
			}
		}	
	})
	return comments;
}

/**
 * @private 
 * 
 * @param {Object} parsedDoc
 * @param {String} uriName
 * @param {String} methodName
 * 
 * @return {Object}
 *
 * @properties={typeid:24,uuid:"9EB8ED1B-D693-46DF-8F3C-904C1B2B5FE7"}
 */
function addServoyRequirements(parsedDoc, uriName, methodName) {
	var servoyRoute = {
		title: "route",
		method: "",
		uri: "/" + uriName
	}

	var funcSplit = methodName.replace(/^ws_/, '').split('_');
	switch (funcSplit.shift()) {
	case 'read':
		servoyRoute.method = 'get';
		break;
	case 'create':
		servoyRoute.method = 'post';
		parsedDoc.tags.push({ title: "param", name: "body", parameter_type: "body", type: { type: "object" } });
		if (!parsedDoc.tags.some(function(item) {return (item.title === 'returns' && item.description && item.description.match('200'))})) {
			parsedDoc.tags.push({title:"returns", description:"204 - Indicate that the content in the body of the HTTP Request is missing,"});
		}
		if (!parsedDoc.tags.some(function(item) {return (item.title === 'returns' && item.description && item.description.match('500'))})) {
			parsedDoc.tags.push({title:"returns", description:"500 - Indicate that the body content cannot be converted to a JavaScript object / string based on the Content-Type"});
		}
		
		break;
	case 'delete':
		servoyRoute.method = 'delete';
		if (!parsedDoc.tags.some(function(item) {return (item.title === 'returns' && item.description && item.description.match('200'))})) {
			parsedDoc.tags.push({title:"returns", description:"200 - Indicate successful deletion"});
		}
		if (!parsedDoc.tags.some(function(item) {return (item.title === 'returns' && item.description && item.description.match('404'))})) {
			parsedDoc.tags.push({title:"returns", description:"404 - Indicate delete failure"});
		}
		
		break;
	case 'update':
		servoyRoute.method = 'put';
		parsedDoc.tags.push({ title: "param", name: "body", parameter_type: "body", type: { type: "object" } });
		
		//Add default returntypes
		if (!parsedDoc.tags.some(function(item) {return (item.title === 'returns' && item.description && item.description.match('200'))})) {
			parsedDoc.tags.push({title:"returns", description:"200 - Indicate successful update"});
		}
		if (!parsedDoc.tags.some(function(item) {return (item.title === 'returns' && item.description && item.description.match('204'))})) {
			parsedDoc.tags.push({title:"returns", description:"204 - Indicate that the content in the body of the HTTP Request is missing,"});
		}
		if (!parsedDoc.tags.some(function(item) {return (item.title === 'returns' && item.description && item.description.match('404'))})) {
			parsedDoc.tags.push({title:"returns", description:"404 - Indicate update failure"});
		}
		if (!parsedDoc.tags.some(function(item) {return (item.title === 'returns' && item.description && item.description.match('500'))})) {
			parsedDoc.tags.push({title:"returns", description:"500 - Indicate that the body content cannot be converted to a JavaScript object / string based on the Content-Type"});
		}
		
		break;
	}
	if (funcSplit.length) {
		servoyRoute.uri += '/' + funcSplit.join('/');
	}
	parsedDoc.tags.unshift(servoyRoute);

	//Add group tag when not defined in jsdoc
	if (!parsedDoc.tags.some(function(item) {return item.title === 'group'})) {
		parsedDoc.tags.push({ title: 'group', 'description': uriName });
	}

	//Add produces tag when not defined in jsdoc
	if (!parsedDoc.tags.some(function(item) {return item.title === 'produces'})) {
		parsedDoc.tags.push({ title: "produces", description: "application/json" });
	}
	
	return parsedDoc;
}

/**
 * @return {Object}
 * @properties={typeid:24,uuid:"F04F2948-1378-430E-9E2E-C26A4BD14456"}
 */
function generateSwaggerJSON() {
	var comments = new Array().concat(getAllApiForms(), getAllApiScopes());
	var swaggerObject = swaggerBasicDoc;
	for (var j in comments) {
				var parsed = fileFormat(comments[j])
				swaggerObject = scopes.swaggerHelpers.addDataToSwaggerObject(swaggerObject, [{
						paths: parsed.parameters,
						tags: parsed.tags
					}]);
		}
	return swaggerObject;
}

/**
 * @private
 * @param {{title: String}} tags
 * @return {Array<String>}
 *
 * @properties={typeid:24,uuid:"83BEE7A7-3B31-476A-A345-AEB32E5D8751"}
 */
function parseTag(tags) {
	for (var i in tags) {
		if (tags[i]['title'] == 'group') {
			return tags[i]['description'].split("-")
		}
	}
	return ['default', '']
}

/**
 * @param {Array<Object>} tags
 * @return {Object}
 *
 * @properties={typeid:24,uuid:"EA18C33B-518B-4EE2-BE01-EA73AA9B19D3"}
 */
function parseReturn(tags) {
	var rets = { }
	for (var i in tags) {
		if (tags[i]['title'] == 'returns' || tags[i]['title'] == 'return') {
			if (!tags[i]['description']) {
				tags[i]['description'] = '200'
				application.output('return type without code & description will use 200 as default return type.\nPlease at correct returntype for example: `200 - Array with values`', LOGGINGLEVEL.INFO);
			}
			var description = tags[i]['description'].split("-"), key = description[0].trim()

			rets[key] = {
				description: description[1] ? description[1].trim() : ''
			};
		}
	}
	return rets
}

/**
 * @private 
 * 
 * @param {String|{type: String}} type
 * @param {Object} properties
 * 
 * @return {Object}
 * @properties={typeid:24,uuid:"9F139424-1C34-4B41-83B5-D783D71B62EE"}
 */
function parseType(type, properties) {
	if((typeof type) == "object") {
		type = type.type;
	}
	if(type) {
		if(type.toLocaleLowerCase().match(/forms|scopes/)) {
			if(type.toLocaleLowerCase().match('array')) {
				properties.type = 'array';
				properties.items = {};
				
				var enumVar = type.replace(/\w+\<|\>\w*/g,'');
				var enumItems = Object.keys(eval(enumVar));
				var returnValue = eval(enumVar + '.' + enumItems[0]);
				if(returnValue instanceof Number) {
					properties.items.type = 'number';
				} else {
					properties.items.type = 'string';
				}
				properties.items['enum'] = enumItems;
				
				
			}
		} else if(type.toLocaleLowerCase() == 'number'){
			properties.type = 'number';
		} else if(type.toLocaleLowerCase() == 'string'){
			properties.type = 'string';
		} else if(type.toLocaleLowerCase() == 'boolean'){
			properties.type = 'boolean';
		}
	}
	
	return properties;
}

/**
 * @private
 * @param comments
 * @return {{parameters: {}, tags: Array<String>}}
 *
 * @properties={typeid:24,uuid:"E3F01E91-DA92-42CB-B566-7A2C015C2C5F"}
 */
function fileFormat(comments) {
	var route, parameters = { }, params = [], tags = [];
	for (var i in comments) {
		var desc = (comments.description || '').replace('/**', '');
		if (i == 'tags') {
			for (var j in comments[i]) {
				switch (comments[i][j].title) {
				case 'route':
					route = { uri: comments[i][j].uri, method: comments[i][j].method }
					var tag = parseTag(comments[i])
					parameters[route.uri] = parameters[route.uri] || { }
					parameters[route.uri][route.method] = parameters[route.uri][route.method] || { }
					parameters[route.uri][route.method].parameters = []
					parameters[route.uri][route.method].description = desc
					parameters[route.uri][route.method].tags = [tag[0].trim()]
					tags.push({
						name: typeof tag[0] === 'string' ? tag[0].trim() : '',
						description: typeof tag[1] === 'string' ? tag[1].trim() : ''
					})
					break;
				case 'param':
					var properties = {
						name: comments[i][j].name,
						in: comments[i][j].parameter_type || 'path',
						description: comments[i][j].description || '',
						required: (comments[i][j]['type'].type && comments[i][j].type['type'] == 'OptionalType' ? false : true)
					}
					properties = parseType(comments[i][j]['type'],properties);
//					properties.schema = comments[i][j]['type']
					params.push(properties)
					break;
				case 'summery':
					if (route) {
						parameters[route.uri][route.method].summary = comments[i][j].description;
					}
					break;
				case 'produces':
					if (route) {
						parameters[route.uri][route.method].produces = comments[i][j].description.split(/\s+/);
					}
					break;
				case 'security':
					if (route) {
						//TODO: Do something with security here
					}
					break;
				case 'deprecated':
					if (route) {
						parameters[route.uri][route.method].deprecated = true;
					}
					break;

				}

			}

			if (route) {
				parameters[route.uri][route.method].parameters = params;
				parameters[route.uri][route.method].responses = parseReturn(comments[i]);
			}
		}
	}
	return { parameters: parameters, tags: tags }
}
