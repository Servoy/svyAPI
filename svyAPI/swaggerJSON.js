/**
 * @protected
 * @type {Object}
 * @properties={typeid:35,uuid:"85CF64ED-BFB9-4808-A01C-67528198420C",variableType:-4}
 */
var swaggerBasicDoc = {
	swagger:"2.0",
	info: {
		"version": application.getSolutionRelease().toString(),
		"title": "i18n:servoy.apiDocTitle"
	},
	host: null,
	produces: ["application/json"],
	schemes: (application.isInDeveloper() ?[ "http"] : ["https"]),
	securityDefinitions: {basicAuth: {type: 'basic'}},
	definitions: {},
	parameters: {},
	paths: {},
	responses: {},
	tags:[]
}

/**
 * @protected 
 * @enum {String}
 * 
 * @properties={typeid:35,uuid:"F869F141-13D5-4923-9B28-7994F5242175",variableType:-4}
 */
var ENDPOINT_TYPE = {
	FORM: 'jsform',
	SCOPE: 'scope'
}

/**
 * @private
 * @param {String} [apiHost]
 * @return {String}
 * @properties={typeid:24,uuid:"60AA4139-BDA1-41A2-BD47-11D57973EC8C"}
 */
function parsedHostUrl(apiHost) {
	var host = scopes.svyNet.parseUrl(apiHost||application.getServerURL());
	if(host.port) {
		return host.host + ":" + host.port + '/servoy-service/rest_ws/' + application.getSolutionName();
	} else {
		return host.host + '/servoy-service/rest_ws/' + application.getSolutionName();
	}
}

/**
 * @private
 *  
 * @return {Array<{paths: String, tags:Array<*>}>}
 * 
 * @properties={typeid:24,uuid:"89DDAB94-EBD7-45BC-94C4-A6DA14D9C65F"}
 */
function getAllApiForms() {
	var apiFiles = scopes.svyUI.getJSFormInstances('api').sort(/** @param {JSForm} A 
																   @param {JSForm} B */ function(A, B) {
		return A.name.localeCompare(B.name);
		
	});
	/**@type {Array<{paths: String, tags:Array<*>}>} */
	var comments = [];
	var docExtractor = new scopes.doctrine.Extractor()
	apiFiles.forEach(/**@param {JSForm} jsForm */ function(jsForm) {
		var methods = jsForm.getMethods(true);
		for(var methodIndex in methods) {
			var method = methods[methodIndex];
			if (method.getName().match(/^ws_/)) {
				var parsedDoc = docExtractor.transform(method.code);
				comments.push(addServoyRequirements(parsedDoc, jsForm.name, method.getName(), ENDPOINT_TYPE.FORM));
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
	}).sort(	/** @param {String} A 
				    @param {String} B */ function(A, B) {
		return A.localeCompare(B);
		
	});
	
	/**@type {Array<{paths: String, tags:Array}>} */
	var comments = [];
	var docExtractor = new scopes.doctrine.Extractor()
	scopeNames.forEach(/**@param {String} scopeName */ function(scopeName) {
		var methods = solutionModel.getGlobalMethods(scopeName);
		for(var methodIndex in methods) {
			var method = methods[methodIndex];
			if (method.getName().match(/^ws_/)) {
				var parsedDoc = docExtractor.transform(method.code);
				comments.push(addServoyRequirements(parsedDoc, scopeName, method.getName(), ENDPOINT_TYPE.SCOPE));
			}
		}	
	})
	return comments;
}

/**
 * @private 
 * 
 * @param {{paths: String, tags:Array}} parsedDoc
 * @param {String} uriName
 * @param {String} methodName
 * @param {ENDPOINT_TYPE|String} endpointType
 * 
 * @return {{paths: String, tags:Array}}
 *
 * @properties={typeid:24,uuid:"9EB8ED1B-D693-46DF-8F3C-904C1B2B5FE7"}
 */
function addServoyRequirements(parsedDoc, uriName, methodName, endpointType) {
	var servoyRoute = {
		title: "route",
		method: "",
		uri: "/" + uriName,
		security: false
	}
	
	if((endpointType == ENDPOINT_TYPE.FORM && forms[uriName] && forms[uriName].ws_authenticate) || (endpointType == ENDPOINT_TYPE.SCOPE && scopes[uriName] && scopes[uriName].ws_authenticate)) {
		servoyRoute.security = true;
	}
	
	var funcSplit = methodName.replace(/^ws_/, '').split('_');
	switch (funcSplit.shift()) {
	case 'read':
		servoyRoute.method = 'get';
		break;
	case 'create':
		servoyRoute.method = 'post';
		if (!parsedDoc.tags.some(function(item) {return (item.title === 'param' && item.name == 'body')})) {
			parsedDoc.tags.push({ title: "param", name: "body", parameter_type: "body", schema: { type: "object"}});
		}
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
		if (!parsedDoc.tags.some(function(item) {return (item.title === 'param' && item.name == 'body')})) {
			parsedDoc.tags.push({ title: "param", name: "body", parameter_type: "body", schema: { type: "object"} });	
		}
		
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
	case 'authenticate':
		return null;
	}
	
	
	if (funcSplit.length) {
		servoyRoute.uri += '/' + funcSplit.join('/');
	}
	
	for(var tagIndex in parsedDoc.tags) {
		/**@type {{title: String, name: String, parameter_type: String, type: String}} */
		var tag = parsedDoc.tags[tagIndex];
		if(tag['title'] == 'param') {
			if(servoyRoute.method == 'put' || servoyRoute.method == 'post') {
				if(tag['name'] && tag['name'] == 'body') {
					tag['parameter_type'] = "body";
					var schema = {};
					if(tag && tag['type']) {
						var parsedData = parseExpressionToJSONSample(tag['type']['expression']||tag['type']);
						schema['required'] = parsedData.required;
						if(tag.type && tag.type instanceof String && tag.type.toLocaleLowerCase().startsWith('array')) {
							schema['type'] = 'array';
							schema['items'] = {
								'$ref': '#/definitions/' + servoyRoute.method + servoyRoute.uri.replace(/\//g,'_')
							}
						} else {
							schema['$ref'] = '#/definitions/' + servoyRoute.method + servoyRoute.uri.replace(/\//g,'_');
						}
						
						//Always push $ref_data to same point.. will be removed in later stage
						schema['$ref_data'] = {type: 'object', properties: parsedData.properties};
					}
					tag['schema'] = schema;
					delete tag['type'];
					continue
				}
			}
			if(tag['type'] && !(tag['type']['type'] && tag['type']['type'] == 'OptionalType')) {
				if(!tag['parameter_type'] || tag['parameter_type'] == 'path') {
					servoyRoute.uri += '/{' + tag['name'] +'}'
				}
			}
		}
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
 * @private 
 * @param {String} expression
 * @return {Object}
 * @properties={typeid:24,uuid:"689E932A-89DE-4A7A-9F4A-B5603FBA1243"}
 */
function parseExpressionToJSONSample(expression) {
	if(expression) {
		//For now trying to manual parse the string object and try to resolve most of it.
		var newObj = {required:[], properties: {}};
		
		expression = expression.trim();
		expression.replace(/\{.*\}/g,regexParser);
		return newObj;
	}
	return {};
	
	/** 
	 * @param {String} value
	 */
	function regexParser(value) {
		if(value.startsWith('{') && value.endsWith('}')) {
			//Replace first and lost char
			value = value.replace(/^\{/,'');
			value = value.replace(/\}$/,'');
			
			if(value.match(/\{.*\}/)) {
				value = value.replace(/\{.*\}/g,regexParser)
			} else {
				value.split(',').forEach(/**@param {String} objItem */function(objItem) {
					const item = objItem.split(':');
					if(item.length == 2) {
						newObj.properties[item[0].trim().replace(/\[|\]/g,'')] = {};
						parseType(item[1].trim(), newObj.properties[item[0].trim().replace(/\[|\]/g,'')]);
						if(!item[0].trim().startsWith('[') && !item[0].trim().endsWith(']')) {
							newObj.required.push(item[0].trim().replace(/\[|\]/g,''))
						}
					}
				});
			}
		}
		return value;
	}
}
/**
 * @public 
 * @param {String} [apiHost]
 * @return {Object}
 * @properties={typeid:24,uuid:"F04F2948-1378-430E-9E2E-C26A4BD14456"}
 */
function generateSwaggerJSON(apiHost) {
	var comments = new Array().concat(getAllApiForms(), getAllApiScopes());
	var swaggerObject = swaggerBasicDoc;
	swaggerObject.host = parsedHostUrl(apiHost)
	for (var j in comments) {
				var parsed = fileFormat(comments[j])
				swaggerObject = scopes.swaggerHelpers.addDataToSwaggerObject(swaggerObject, [{
						paths: parsed.parameters,
						tags: parsed.tags,
						definitions: parsed.definitions
					}]);
		}
	return swaggerObject;
}

/**
 * @private
 * @param {Array<Object>} tags
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
//				application.output('return type without code & description will use 200 as default return type.\nPlease at correct returntype for example: `200 - Array with values`', LOGGINGLEVEL.INFO);
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
		var typeValue = type.toLocaleLowerCase();
		if(typeValue.match(/forms|scopes/)) {
			//TODO: This can't be correct.. should be fixed
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
		} else if(typeValue.startsWith('number')){
			properties.type = 'number';
		} else if(typeValue.startsWith('string') || typeValue.startsWith('uuid')){
			properties.type = 'string';
		} else if(typeValue.startsWith('boolean')){
			properties.type = 'boolean';
		} else if(typeValue.startsWith('array')) {
			var match = typeValue.match(/<(.*)>/);
			if(match && match[1]) {
				if(match[1].startsWith('{')) {
					properties.type = 'array'
				} else {
					/**@type {{type: String}} */
					var resolvedType = parseType(match[1],{type: ''});
					if(resolvedType && resolvedType.type) {
						properties.type = resolvedType.type;
					} else {
						properties.type = 'array'
					}
				}
			} else {
				properties.type = 'array'
			}
		} else if(typeValue.startsWith('{') || typeValue.startsWith('object')) {
			properties.type = 'object'
		} else if(typeValue.startsWith('*')) {
			properties.type = null
		}
	}
	
	return properties;
}

/**
 * @private 
 * 
 * @param {Object} schema
 * @param {Object} properties
 * 
 * @return {Object}
 *
 * @properties={typeid:24,uuid:"4E3FD1A5-57E5-45D7-A553-6E47C3DBDF9A"}
 */
function parseSchema(schema, properties) {
	if(schema) {
		properties.schema = {};
		for(var itemIndex in Object.keys(schema)) {
			var item = Object.keys(schema)[itemIndex];
			properties.schema[item] = schema[item];
		}
	}
	return properties;
}

/**
 * @private
 * @param comments
 * @return {{parameters: {}, tags: Array<String>, definitions: {}}}
 *
 * @properties={typeid:24,uuid:"E3F01E91-DA92-42CB-B566-7A2C015C2C5F"}
 */
function fileFormat(comments) {
	var route, parameters = { }, params = [], tags = [], definitions = {};
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
					if(comments[i][j].security) {
						parameters[route.uri][route.method].security = [{'basicAuth': []}];
					}
					break;
				case 'param':
					var properties = {
						name: comments[i][j].name,
						in: comments[i][j].parameter_type || 'path',
						description: comments[i][j].description || '',
						required: (comments[i][j]['type'] && comments[i][j]['type']['type'] && comments[i][j]['type']['type'] == 'OptionalType' ? false : true)
					}
					properties = parseType(comments[i][j]['type'],properties);
					properties = parseSchema(comments[i][j]['schema'],properties);
					if(comments[i][j]['schema'] && comments[i][j]['schema']['$ref']) {
						definitions[comments[i][j]['schema']['$ref'].split('/').pop()] = comments[i][j]['schema']['$ref_data'];
						delete comments[i][j]['schema']['$ref_data'];
					} else if(comments[i][j]['schema'] && comments[i][j]['schema']['items'] && comments[i][j]['schema']['items']['$ref']) {
						definitions[comments[i][j]['schema']['items']['$ref'].split('/').pop()] = comments[i][j]['schema']['$ref_data'];
						delete comments[i][j]['schema']['$ref_data'];
					}
					if(properties["schema"] && properties["schema"]['$ref_data']) {
						delete properties["schema"]['$ref_data'];
					}
					params.push(properties)
					break;
				case 'summary':
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
	return { parameters: parameters, tags: tags, definitions: definitions }
}
