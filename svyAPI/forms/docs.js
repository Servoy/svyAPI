/**
 * @return {Object}
 * @properties={typeid:24,uuid:"ED5985D2-144F-4C2C-84C3-BAC9B99F681E"}
 */
function ws_read(path) {
	if(path == 'swagger.json') {
		
		//https://swagger.io/docs/specification/2-0/describing-request-body/
		var restRequest = plugins.rest_ws.getRequest();
		var host = restRequest.getHeader('host');
		if(host && (!host.startsWith('http://') || !host.startsWith('https://'))) {
			host = 'https://' + host;
		}
		var json = scopes.swaggerJSON.generateSwaggerJSON(host);
		application.output(JSON.stringify(json), LOGGINGLEVEL.DEBUG)
		return json;
	} else {
		return {};
	}
}
