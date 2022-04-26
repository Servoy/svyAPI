/**
 * @protected
 * @type {Array<String>} 
 * @properties={typeid:35,uuid:"7D3FD02D-A20A-4E80-A9AB-D666D65CABBA",variableType:-4}
 */
var swaggerSchemaWrongProperties = ['consume','produce','path','tag','definition','securityDefinition','scheme','response','parameter','deprecated'];

/**
 * @public  
 * 
 * Adds the data in to the swagger object.
 * 
 * @param {object} swaggerObject - Swagger object which will be written to
 * @param {Array<{paths: String, tags:Array<*>}>} data - objects of parsed swagger data from yml or jsDoc comments
 * 
 * @return {Object}
 * @properties={typeid:24,uuid:"3D78424E-B3E8-49A4-BF11-A9BC9B934A24"}
 */
function addDataToSwaggerObject(swaggerObject, data) {
	if (!swaggerObject || !data) {
		throw new Error('swaggerObject and data are required!');
	}

	for (var i = 0; i < data.length; i = i + 1) {
		var pathObject = data[i];
		var propertyNames = Object.getOwnPropertyNames(pathObject);
		// Iterating the properties of the a given pathObject.
		for (var j = 0; j < propertyNames.length; j = j + 1) {
			var propertyName = propertyNames[j];
			// Do what's necessary to organize the end specification.
			swaggerObject = organizeSwaggerProperties(swaggerObject, pathObject, propertyName);
		}
	}
	
	return swaggerObject;
}

/**
 * @private 
 * 
 * Handles swagger propertyName in pathObject context for swaggerObject.
 * 
 * @param {object} swaggerObject - The swagger object to update.
 * @param {object} pathObject - The input context of an item for swaggerObject.
 * @param {string} propertyName - The property to handle.
 * 
 * @return {Object};
 *
 * @properties={typeid:24,uuid:"E3C60FE4-5747-4456-8CB4-021D3926268E"}
 */
function organizeSwaggerProperties(swaggerObject, pathObject, propertyName) {
	var simpleProperties = [
		'consume',
		'consumes',
		'produce',
		'produces',
		'schema',
		'schemas',
		'securityDefinition',
		'securityDefinitions',
		'response',
		'responses',
		'parameter',
		'parameters',
		'definition',
		'definitions',
	];

	// Common properties.
	if (simpleProperties.indexOf(propertyName) !== -1) {
		var keyName = correctSwaggerKey(propertyName);
		var definitionNames = Object
			.getOwnPropertyNames(pathObject[propertyName]);
		for (var k = 0; k < definitionNames.length; k++) {
			var definitionName = definitionNames[k];
			swaggerObject[keyName][definitionName] =
				pathObject[propertyName][definitionName];
		}
		// Tags.
	} else if (propertyName === 'tag' || propertyName === 'tags') {
		var tag = pathObject[propertyName];
		attachTags({
			tag: tag,
			swaggerObject: swaggerObject,
			propertyName: propertyName
		});
		// Paths.
	} else {
		var routes = Object
			.getOwnPropertyNames(pathObject[propertyName]);

		for (var i = 0; i < routes.length; i++) {
			var route = routes[i];
			if(!swaggerObject.paths){
				swaggerObject.paths = {};
			}
			var key = Object.keys(pathObject[propertyName][route])[0];
			pathObject[propertyName][route][key] = sortPathObject(pathObject[propertyName][route][key]);
			swaggerObject.paths[route] = objectMerge(
				swaggerObject.paths[route], pathObject[propertyName][route]
			);
		}
	}
	
	return swaggerObject;
}

/**
 * Function to sort the pathObject to the strict swagger order
 * @private 
 * 
 * @param {Object} objectToSort
 * @return {Object}
 * 
 * @properties={typeid:24,uuid:"5CF7A887-F79E-429B-8E0F-1CB3DBB94E6C"}
 */
function sortPathObject(objectToSort) {
	var striktOrder = ['tags','summary','description', 'operationId','consumes','produces','parameters','responses','security'];
	var sorted = Object.keys(objectToSort).sort(function(a, b) {
		 return striktOrder.indexOf(a) - striktOrder.indexOf(b);
	}).reduce(function(r, k) {
		r[k] = objectToSort[k];
		return r;
	}, {});

	return sorted;
}

/**
 * @private 
 * 
 * Makes a deprecated property plural if necessary.
 * @function
 * @param {string} propertyName - The swagger property name to check.
 * @returns {string} The updated propertyName if neccessary.
 *
 * @properties={typeid:24,uuid:"CFB3790B-1B8E-42ED-9CD2-0672D69770ED"}
 */
function correctSwaggerKey(propertyName) {
	if (swaggerSchemaWrongProperties.indexOf(propertyName) > 0) {
		// Returns the corrected property name.
		return propertyName + 's';
	}
	return propertyName;
}

/**
 * @private 
 * Adds the tags property to a swagger object.
 * @param {{tag: Array, swaggerObject: {}, propertyName: String}} conf - Flexible configuration.
 *
 * @properties={typeid:24,uuid:"EAA053B6-9CAF-4D9F-A677-CFF729078382"}
 */
function attachTags(conf) {
	var tag = conf.tag;
	var swaggerObject = conf.swaggerObject;
	var propertyName = conf.propertyName;

	// Correct deprecated property.
	if (propertyName === 'tag') {
		propertyName = 'tags';
	}

	if (Array.isArray(tag)) {
		for (var i = 0; i < tag.length; i = i + 1) {
			if (!tagDuplicated(swaggerObject[propertyName], tag[i])) {
				swaggerObject[propertyName].push(tag[i]);
			}
		}
	} else {
		if (!tagDuplicated(swaggerObject[propertyName], tag)) {
			swaggerObject[propertyName].push(tag);
		}
	}
}

/**
 * @private 
 * 
 * Checks if tag is already contained withing target.
 * The tag is an object of type http://swagger.io/specification/#tagObject
 * The target, is the part of the swagger specification that holds all tags.
 * @param {object} target - Swagger object place to include the tags data.
 * @param {object} tag - Swagger tag object to be included.
 * @returns {boolean} Does tag is already present in target
 *
 * @properties={typeid:24,uuid:"3621C00B-FB90-4188-936F-07E29A4349A1"}
 */
function tagDuplicated(target, tag) {
	// Check input is workable.
	if (target && target.length && tag) {
		for (var i = 0; i < target.length; i = i + 1) {
			var targetTag = target[i];
			// The name of the tag to include already exists in the taget.
			// Therefore, it's not necessary to be added again.
			if (targetTag.name === tag.name) {
				return true;
			}
		}
	}

	// This will indicate that `tag` is not present in `target`.
	return false;
}

/**
 * @private 
 * Merges two objects
 * @param {object} obj1 - Object 1
 * @param {object} obj2 - Object 2
 * @returns {object} Merged Object
 *
 * @properties={typeid:24,uuid:"4433891E-5A5C-4A70-931F-89DB4951AE56"}
 */
function objectMerge(obj1, obj2) {
	var obj3 = {};
	for (var attr in obj1) {
		if (obj1.hasOwnProperty(attr)) {
			obj3[attr] = obj1[attr];
		}
	}
	for (var name in obj2) {
		if (obj2.hasOwnProperty(name)) {
			obj3[name] = obj2[name];
		}
	}
	return obj3;
}
