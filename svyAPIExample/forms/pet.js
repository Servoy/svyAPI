/**
 * @enum 
 * @properties={typeid:35,uuid:"A2904217-EB27-4A8E-B608-0E66A3AE1EBA",variableType:-4}
 */
var STATUS = {
	AVAILABLE: 1,
	PENDING: 2,
	SOLD: 3
}
/**
 * Returns a single pet
 * 
 * @summary Find pet by ID
 * @param {Number} petId ID of pet to return
 * 
 * @returns {{id: Number, name: String, photoUrls: Array<String>, tags: Array<String>, status: Number}} 200
 * @returns 400 - Invalid ID Supplied
 * @returns 404 - Pet not found
 * 
 * @properties={typeid:24,uuid:"CEFCB98D-8D4D-4FA6-BD30-E92C83C7DFEF"}
 */
function ws_read(petId) {
	return {
		  "id": petId,
		  "name": "MyCat-" + petId,
		  "photoUrls": [],
		  "tags": [],
		  "status": STATUS.AVAILABLE
	}
}

/**
 * Status values that need to be considered for filter
 * 
 * @summary Finds Pets by status
 * 
 * @param {Array<forms.pet.STATUS>} status Status values that need to be considered for filter
 * 
 * @returns {{id: Number, name: String, photoUrls: Array<String>, tags: Array<String>, status: Number}} 200
 * @returns 400 - Invalid ID Supplied
 * @returns 404 - Pet not found
 * 
 * @properties={typeid:24,uuid:"0F7E9934-92EB-47D1-8005-A6195FE34322"}
 */
function ws_read_findByStatus(status) {
	application.output(JSON.stringify(arguments), LOGGINGLEVEL.DEBUG);
	if(STATUS[status] == STATUS.AVAILABLE) {
		return {
			  "id": 11,
			  "name": "MyCat-11",
			  "photoUrls": [],
			  "tags": [],
			  "status": STATUS.AVAILABLE
		}
	} else if(STATUS[status] == STATUS.PENDING) {
		return {
			  "id": 12,
			  "name": "MyCat-12",
			  "photoUrls": [],
			  "tags": [],
			  "status": STATUS.PENDING
		}
	} else {
		return {
			  "id": 13,
			  "name": "MyCat-13",
			  "photoUrls": [],
			  "tags": [],
			  "status": STATUS.SOLD
		}
	}

}

/**
 * Returns a single pet
 * 
 * @summary Finds Pets by tags
 * @deprecated 
 * @param {String} name PetName of pet to return
 * 
 * @returns {{id: Number, name: String, photoUrls: Array<String>, tags: Array<String>, status: Number}} 200
 * @returns 400 - Invalid ID Supplied
 * @returns 404 - Pet not found
 * 
 * @properties={typeid:24,uuid:"6BAA8E92-489D-41E3-AD54-AEC904C7FF4A"}
 */
function ws_read_findByName(name) {
	return {
		  "id": 11,
		  "name": "MyCat-11",
		  "photoUrls": [],
		  "tags": [],
		  "status": STATUS.AVAILABLE
	}
}

/**
 * Deletes a pet
 * 
 * @summary Deletes a pet
 * 
 * @param {Number} petId Pet id to delete
 * 
 * @returns {Boolean} 200 - Pet id found and succesful deleted
 * 
 * @properties={typeid:24,uuid:"C33FD680-B121-4BD8-90E0-BB347824414E"}
 */
function ws_delete(petId) {
	return true
}

/**
 * Pet object that needs to be added to the store
 * 
 * @summary Update an existing pet
 * 
 * @properties={typeid:24,uuid:"BE3C00BA-0945-4EA9-B453-F0966DC1B8AF"}
 */
function ws_update() {
	return 'ok';
}

/**
 * Pet object that needs to be added to the store
 * 
 * @summary Add a new pet to the store
 * @
 * 
 * @properties={typeid:24,uuid:"BDA6E110-E532-47F3-B218-3DB02FE44406"}
 */
function ws_create() {
	return true;
}