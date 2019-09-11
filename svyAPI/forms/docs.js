/**
 * @properties={typeid:24,uuid:"ED5985D2-144F-4C2C-84C3-BAC9B99F681E"}
 */
function ws_read(path) {
	if(path == 'swagger.json') {
//		application.output(		JSON.stringify(scopes.swaggerJSON.generateSwaggerJSON()))
		return scopes.swaggerJSON.generateSwaggerJSON();
	} else {
		return '';
	}
}
