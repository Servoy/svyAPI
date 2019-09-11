/**
 * Returns a single pet
 * 
 * @param {String} username The name that needs to be fetched. Use user1 for testing.
 * 
 * @returns {{username: String, firstname: string, lastName: String}} 200
 * @returns 400 - Invalid username supplied
 * @returns 404 - User not found
 * 
 * @properties={typeid:24,uuid:"BF291B3E-491F-4C52-8290-156EFBFD5AC3"}
 */
function ws_read(username) {
	return {
		  "username": "servoy_piet",
		  "firstname": "Piet",
		  "lastName": "ApI User"
	}
}