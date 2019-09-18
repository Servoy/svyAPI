/**
 * Returns a map of status codes to quantities
 * 
 * @summary Returns pet inventories by status
 * @returns {Array<{propertyName: String}>} 200
 * 
 * @properties={typeid:24,uuid:"F2CEADA9-A7EA-4A42-A17E-5F3FD380F090"}
 */
function ws_read_inventory() {
	
	return [{propertyName: 'Amsterdam-Pets'}]
}

/**
 * Order placed for purchasing the pet
 * 
 * @summary Place an order for a pet
 * 
 * @properties={typeid:24,uuid:"B0389404-8139-4E11-BA64-F489B444B816"}
 */
function ws_create() {
	return 'ok';
}