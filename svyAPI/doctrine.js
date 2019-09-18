//Partly based on: https://github.com/eslint/doctrine/blob/master/lib/doctrine.js

/**
 * @protected 
 * 
 * @type {Number}
 *
 * @properties={typeid:35,uuid:"7B0833C5-BFEA-4BB1-8C84-D88E0DFC46A6",variableType:4}
 */
var index = 0;

/**
 * @protected 
 * 
 * @type {Number}
 *
 * @properties={typeid:35,uuid:"D85FDD34-AF8B-4E89-803C-4D2CF90B6FF1",variableType:4}
 */
var lineNumber = 0;

/**
 * @protected 
 * 
 * @type {String}
 *
 * @properties={typeid:35,uuid:"510616BB-50A0-4C5E-86B1-61CFD773019D"}
 */
var source = '';

/**
 * @protected 
 * @enum 
 * 
 * @properties={typeid:35,uuid:"0A2D7BF8-A4B3-4FF9-BB25-BEB31B40D969",variableType:-4}
 */
var jsdoc = {
    singleLine: /^\s*(\/\*{2}.*\*\/)\s*$/,
    start: /^\s*\/\*{2}\s*$/,
    line: /^\s*\*.*$/,
    end: /^\s*\*\/\s*$/
}

/**
 * @constructor 
 * @properties={typeid:24,uuid:"969472F8-23AC-40A1-9462-F24E2CAF011B"}
 */
function Extractor() {
	
	/**
	 * @public  
	 * 
	 * @param {String} chunk
	 * @return {{description:String,tags:Array<{title: String, description: String}>}}
	 */
	this.transform = function(chunk) {
        const lines = chunk.toString().split(/\r?\n/);

        var obj;
        while (!obj) {
        	obj = this.consumeLine(lines.shift());
        }
        return obj;
    }
	
	this.unfinishedChunk = [];
	this.parsed = [];
	
	/**
	 * @public 
	 * 
	 * @param {String} jsDoc
	 * @return {{description:String,tags:Array<{title: String, description: String}>}}
	 */
	this.parse = function(jsDoc) {
		return jsDocParser(jsDoc)
	}
	
	/**
	 * @protected 
	 * 
	 * @param {String} line
	 * @param {Boolean} [reset] = Default: false
	 */
	this.addLine = function(line, reset) {
        if (reset) this.resetChunk();
        this.unfinishedChunk.push(line);
    }
    
    /**
	 * @protected 
	 */
    this.resetChunk = function() {
        this.unfinishedChunk = [];
    }
    
	/**
	 * @protected 
	 * 
	 * @return {String}
	 */
    this.getRawCommentAndReset = function(){
        const comment = this.unfinishedChunk.join('\n');
        this.resetChunk();

        return comment;
    }
    
	/**
	 * @protected 
	 * 
	 * @param {String} docBlock
	 * @return {{description:String,tags:Array<{title: String, description: String}>}}
	 */
	this.addDoc = function(docBlock) {
        const comment = this.parse(docBlock);
        return comment;
    }
	/**
	 * @protected 
	 * 
	 * @param {String} line
	 * @return {{description:String,tags:Array<{title: String, description: String}>}}
	 */
	this.consumeLine = function(line){
        const match = line.match(jsdoc.singleLine);
        if (match) {
            // singleline
            return this.addDoc(match[1].trim());
        } else if (line.match(jsdoc.start)) {
            // start multiline
            this.addLine(line, true);
        } else if (this.unfinishedChunk.length) {
            if (line.match(jsdoc.end)) {
                // end multiline
                this.addLine(line);

                return this.addDoc(this.getRawCommentAndReset());
            } else if (line.match(jsdoc.line)) {
                // line multiline
                this.addLine(line);
            } else {
                // invalid line inbetween jsdoc
                this.resetChunk();
            }
        }

        return null;
    }
	/**
	 * @protected  
	 * 
	 * @param {String} content
	 * @return {Array<{}>}
	 */
	this.extract = function(content) {
        const comments = [];
        const lines = content.toString().split(/\r?\n/);

        while (lines.length) {
            const comment = this.consumeLine(lines.shift());
            if (comment) comments.push(comment);
        }

        return comments;
    }
	return this;
}

/**
 * @constructor 
 * @param {String} jsDoc
 * @return {{description: String, tags:Array<{title: String, description: String}>}}
 * @properties={typeid:24,uuid:"33A0E6B3-454B-4668-BE2E-CC6F02BA2AA5"}
 */
function jsDocParser(jsDoc) {
	index = 0;
	lineNumber = 0;
	var tags = [], tag, description;
	
    var WHITESPACE = '[ \\f\\t\\v\\u00a0\\u1680\\u180e\\u2000-\\u200a\\u202f\\u205f\\u3000\\ufeff]';

    var STAR_MATCHER = '(' + WHITESPACE + '*(?:\\*' + WHITESPACE + '?)?)(.+|[\r\n\u2028\u2029])';
    
    source = jsDoc
		    .replace(/^\/\*\*?/, '') // remove /**
		    .replace(/\*\/$/, '') 	 // remove */
		    .replace(new RegExp(STAR_MATCHER, 'g'), '$2') // remove ' * ' at the beginning of a line
		    .replace(/\s*$/, ''); // remove trailing whitespace
		    
	description = scanJSDocDescription();
    while (true) {
        tag = parseTag();
        if (!tag) {
            break;
        }
        tags.push(tag);
    }
	
	return {
        description: description,
        tags: tags
    };
}

/**
 * @return {String}
 * @properties={typeid:24,uuid:"4CC1A9A9-D6D6-467B-A0E3-6590ED782DA1"}
 */
function scanJSDocDescription() {
    var description = '';
    var ch;
    var atAllowed = true;
    while (index < source.length) {
        ch = source.charCodeAt(index);

        if (atAllowed && ch === 0x40  /* '@' */) {
            break;
        }

        if (scopes.esutils.isLineTerminator(ch)) {
            atAllowed = true;
        } else if (atAllowed && !scopes.esutils.isWhiteSpace(ch)) {
            atAllowed = false;
        }
        description += advance();
    }
    return description.trim();
}

/**
 * @properties={typeid:24,uuid:"33B2FCE4-6266-45F8-9020-EC1E8AE896BE"}
 */
function parseTag() {
	var title = scanTitle();
	
	var parser = new TagParser(title);
    var tag = parser.parse();
    
    // Seek global index to end of this tag.
    while (index < parser._last) {
        advance();
    }
    
    return tag;
}

/**
 * @return {String}
 *
 * @properties={typeid:24,uuid:"3254A9F4-FCD1-4A24-8D5D-AB9AD402DF15"}
 */
function advance() {
    var ch = source.charCodeAt(index);
    index += 1;
    if (scopes.esutils.isLineTerminator(ch) && !(ch === 0x0D  /* '\r' */ && source.charCodeAt(index) === 0x0A  /* '\n' */)) {
        lineNumber += 1;
    }
    return String.fromCharCode(ch);
}

/**
 * @properties={typeid:24,uuid:"4FFE010F-124E-4D4B-BD85-C0C6BBC8E068"}
 */
function scanTitle() {
    var title = '';
    // waste '@'
    advance();

    while (index < source.length && scopes.esutils.isASCIIAlphanumeric(source.charCodeAt(index))) {
        title += advance();
    }

    return title;
}

/**
 * @properties={typeid:24,uuid:"27A15A68-9817-475C-8974-E99AFB536730"}
 */
function seekContent() {
    var ch, waiting, last = index;

    waiting = false;
    while (last < source.length) {
        ch = source.charCodeAt(last);
        if (scopes.esutils.isLineTerminator(ch) && !(ch === 0x0D  /* '\r' */ && source.charCodeAt(last + 1) === 0x0A  /* '\n' */)) {
            waiting = true;
        } else if (waiting) {
            if (ch === 0x40  /* '@' */) {
                break;
            }
            if (!scopes.esutils.isWhiteSpace(ch)) {
                waiting = false;
            }
        }
        last += 1;
    }
    return last;
}

/**
 * @protected 
 * 
 * @constructor 
 * @param title
 *
 * @properties={typeid:24,uuid:"9DEC5405-93E1-4A4A-9CBF-0F565AC5D531"}
 */
function TagParser(title) {
    this._title = title.toLowerCase();
    this._tag = {
        title: title,
        description: null
    };
    this._first = index - title.length - 1;
    this._last = 0;
    // space to save special information for title parsers.
    this._extra = { };
    
    this.parseType = function () {
        // type required titles
        if (isTypeParameterRequired(this._title)) {
            try {
                this._tag.type = parseType(this._title, this._last);
                if (!this._tag.type) {
                    if (!isParamTitle(this._title) && !isReturnTitle(this._title)) {
                          return false;
                    }
                }
            } catch (error) {
                this._tag.type = null;
                    return false;
            }
        } else if (isAllowedType(this._title)) {
            // optional types
            try {
                this._tag.type = parseType(this._title, this._last);
            } catch (e) {
                //For optional types, lets drop the thrown error when we hit the end of the file
            }
        }
        return true;
    };
    
    this._parseNamePath = function (optional) {
        var name;
        name = parseName(this._last, true && isAllowedOptional(this._title), true);
        if (!name) {
            if (!optional) {
                    return false;
            }
        }
        this._tag.name = name;
        return true;
    };

    
	this.parseNamePath = function () {
	    return this._parseNamePath(false);
	};
	
	this.parseNamePathOptional = function () {
	    return this._parseNamePath(true);
	};    
	
	this.parseName = function () {
	    var assign, name;

	    // param, property requires name
	    if (isAllowedName(this._title)) {
	        this._tag.name = parseName(this._last, true && isAllowedOptional(this._title), isAllowedNested(this._title));
	        if (!this._tag.name) {
	            if (!isNameParameterRequired(this._title)) {
	                return true;
	            }

	            // it's possible the name has already been parsed but interpreted as a type
	            // it's also possible this is a sloppy declaration, in which case it will be
	            // fixed at the end
	            if (isParamTitle(this._title) && this._tag.type && this._tag.type.name) {
	                this._extra.name = this._tag.type;
	                this._tag.name = this._tag.type.name;
	                this._tag.type = null;
	            } else {
	                    return false;
	            }
	        } else {
	            name = this._tag.name;
	            if (name.charAt(0) === '[' && name.charAt(name.length - 1) === ']') {
	                // extract the default value if there is one
	                // example: @param {string} [somebody=John Doe] description
	                assign = name.substring(1, name.length - 1).split('=');
	                if (assign.length > 1) {
	                    this._tag['default'] = assign.slice(1).join('=');
	                }
	                this._tag.name = assign[0];

	                // convert to an optional type
	                if (this._tag.type && this._tag.type.type !== 'OptionalType') {
	                    this._tag.type = {
	                        type: 'OptionalType',
	                        expression: this._tag.type
	                    };
	                }
	            }
	        }
	    }


	    return true;
	};
    
	this.parseDescription = function parseDescription() {
	    var description = sliceSource(source, index, this._last).trim();
	    if (description) {
	        if ((/^-\s+/).test(description)) {
	            description = description.substring(2);
	        }
	        this._tag.description = description;
	    }
	    return true;
	};
	
	this.parseCaption = function parseDescription() {
	    var description = sliceSource(source, index, this._last).trim();
	    var captionStartTag = '<caption>';
	    var captionEndTag = '</caption>';
	    var captionStart = description.indexOf(captionStartTag);
	    var captionEnd = description.indexOf(captionEndTag);
	    if (captionStart >= 0 && captionEnd >= 0) {
	        this._tag.caption = description.substring(
	            captionStart + captionStartTag.length, captionEnd).trim();
	        this._tag.description = description.substring(captionEnd + captionEndTag.length).trim();
	    } else {
	        this._tag.description = description;
	    }
	    return true;
	};
	
	this.parseKind = function parseKind() {
	    var kind, kinds;
	    kinds = {
	        'class': true,
	        'constant': true,
	        'event': true,
	        'external': true,
	        'file': true,
	        'function': true,
	        'member': true,
	        'mixin': true,
	        'module': true,
	        'namespace': true,
	        'typedef': true
	    };
	    kind = sliceSource(source, index, this._last).trim();
	    this._tag.kind = kind;
	    if (!kinds.hasOwnProperty(kind)) {
	            return false;
	    }
	    return true;
	};

	this.parseAccess = function parseAccess() {
	    var access;
	    access = sliceSource(source, index, this._last).trim();
	    this._tag.access = access;
	    if (access !== 'private' && access !== 'protected' && access !== 'public') {
	            return false;
	    }
	    return true;
	};

	this.parseThis = function parseThis() {
	    // this name may be a name expression (e.g. {foo.bar}),
	    // an union (e.g. {foo.bar|foo.baz}) or a name path (e.g. foo.bar)
	    var value = sliceSource(source, index, this._last).trim();
	    if (value && value.charAt(0) === '{') {
	        var gotType = this.parseType();
	        if (gotType && this._tag.type.type === 'NameExpression' || this._tag.type.type === 'UnionType') {
	            this._tag.name = this._tag.type.name;
	            return true;
	        } else {
	            return false;
	        }
	    } else {
	        return this.parseNamePath();
	    }
	};

	this.parseVariation = function parseVariation() {
	    var variation, text;
	    text = sliceSource(source, index, this._last).trim();
	    variation = parseFloat(text);
	    this._tag.variation = variation;
	    if (isNaN(variation)) {
	            return false;
	    }
	    return true;
	};

	this.ensureEnd = function () {
	    var shouldBeEmpty = sliceSource(source, index, this._last).trim();
	    if (shouldBeEmpty) {
	            return false;
	    }
	    return true;
	};

	this.epilogue = function epilogue() {
	    var description;

	    description = this._tag.description;
	    // un-fix potentially sloppy declaration
	    if (isAllowedOptional(this._title) && !this._tag.type && description && description.charAt(0) === '[') {
	        this._tag.type = this._extra.name;
	        if (!this._tag.name) {
	            this._tag.name = undefined;
	        }

	        if (!true) {
	                return false;
	        }
	    }

	    return true;
	};

	var Rules = {
	    // http://usejsdoc.org/tags-access.html
	    'access': ['parseAccess'],
	    // http://usejsdoc.org/tags-alias.html
	    'alias': ['parseNamePath', 'ensureEnd'],
	    // http://usejsdoc.org/tags-augments.html
	    'augments': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
	    // http://usejsdoc.org/tags-constructor.html
	    'constructor': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
	    // Synonym: http://usejsdoc.org/tags-constructor.html
	    'class': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
	    // Synonym: http://usejsdoc.org/tags-extends.html
	    'extends': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
	    // http://usejsdoc.org/tags-example.html
	    'example': ['parseCaption'],
	    // http://usejsdoc.org/tags-deprecated.html
	    'deprecated': ['parseDescription'],
	    // http://usejsdoc.org/tags-global.html
	    'global': ['ensureEnd'],
	    // http://usejsdoc.org/tags-inner.html
	    'inner': ['ensureEnd'],
	    // http://usejsdoc.org/tags-instance.html
	    'instance': ['ensureEnd'],
	    // http://usejsdoc.org/tags-kind.html
	    'kind': ['parseKind'],
	    // http://usejsdoc.org/tags-mixes.html
	    'mixes': ['parseNamePath', 'ensureEnd'],
	    // http://usejsdoc.org/tags-mixin.html
	    'mixin': ['parseNamePathOptional', 'ensureEnd'],
	    // http://usejsdoc.org/tags-member.html
	    'member': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
	    // http://usejsdoc.org/tags-method.html
	    'method': ['parseNamePathOptional', 'ensureEnd'],
	    // http://usejsdoc.org/tags-module.html
	    'module': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
	    // Synonym: http://usejsdoc.org/tags-method.html
	    'func': ['parseNamePathOptional', 'ensureEnd'],
	    // Synonym: http://usejsdoc.org/tags-method.html
	    'function': ['parseNamePathOptional', 'ensureEnd'],
	    // Synonym: http://usejsdoc.org/tags-member.html
	    'var': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
	    // http://usejsdoc.org/tags-name.html
	    'name': ['parseNamePath', 'ensureEnd'],
	    // http://usejsdoc.org/tags-namespace.html
	    'namespace': ['parseType', 'parseNamePathOptional', 'ensureEnd'],
	    // http://usejsdoc.org/tags-private.html
	    'private': ['parseType', 'parseDescription'],
	    // http://usejsdoc.org/tags-protected.html
	    'protected': ['parseType', 'parseDescription'],
	    // http://usejsdoc.org/tags-public.html
	    'public': ['parseType', 'parseDescription'],
	    // http://usejsdoc.org/tags-readonly.html
	    'readonly': ['ensureEnd'],
	    // http://usejsdoc.org/tags-requires.html
	    'requires': ['parseNamePath', 'ensureEnd'],
	    // http://usejsdoc.org/tags-since.html
	    'since': ['parseDescription'],
	    // http://usejsdoc.org/tags-static.html
	    'static': ['ensureEnd'],
	    // http://usejsdoc.org/tags-summary.html
	    'summary': ['parseDescription'],
	    // http://usejsdoc.org/tags-this.html
	    'this': ['parseThis', 'ensureEnd'],
	    // http://usejsdoc.org/tags-todo.html
	    'todo': ['parseDescription'],
	    // http://usejsdoc.org/tags-typedef.html
	    'typedef': ['parseType', 'parseNamePathOptional'],
	    // http://usejsdoc.org/tags-variation.html
	    'variation': ['parseVariation'],
	    // http://usejsdoc.org/tags-version.html
	    'version': ['parseDescription']
	};

	this.parse = function parse() {
	    var i, iz, sequences, method;


	    // empty title
	    if (!this._title) {
	            return null;
	    }

	    // Seek to content last index.
	    this._last = seekContent();

	    if (Rules.hasOwnProperty(this._title)) {
	        sequences = Rules[this._title];
	    } else {
	        // default sequences
	        sequences = ['parseType', 'parseName', 'parseDescription', 'epilogue'];
	    }

	    for (i = 0, iz = sequences.length; i < iz; ++i) {
	        method = sequences[i];
	        if (!this[method]()) {
	            return null;
	        }
	    }

	    return this._tag;
	};
}

/**
 * @private
 * 
 * @param {String} title
 * @return {Boolean}
 *
 * @properties={typeid:24,uuid:"19BF976F-B574-42A5-A94D-2EDA04E4FB07"}
 */
function isTypeParameterRequired(title) {
    return isParamTitle(title) || isReturnTitle(title) ||
        title === 'define' || title === 'enum' ||
        title === 'implements' || title === 'this' ||
        title === 'type' || title === 'typedef' || isProperty(title);
}

/**
 * @private 
 * 
 * @param {String} title
 * @return {Boolean}
 * 
 * @properties={typeid:24,uuid:"A1A8666D-FE56-4CF7-B9D2-783CDC005EBC"}
 */
function isParamTitle(title) {
    return title === 'param' || title === 'argument' || title === 'arg';
}

/**
 * @private
 * 
 * @param {String} title
 * @return {Boolean}
 *
 * @properties={typeid:24,uuid:"70ABB450-04DE-4EB9-AF28-FE5C1021CA64"}
 */
function isReturnTitle(title) {
    return title === 'return' || title === 'returns';
}

/**
 * @private
 * 
 * @param {String} title
 * @return {Boolean}
 *
 * @properties={typeid:24,uuid:"DDD2F580-A7AC-4462-BAD5-8810A33519FD"}
 */
function isProperty(title) {
    return title === 'property' || title === 'prop';
}

/**
 * @private
 * 
 * @param {String} title
 * @return {Boolean}
 *
 * @properties={typeid:24,uuid:"8663C31E-4185-4A83-B083-05F18573BA7A"}
 */
function isNameParameterRequired(title) {
    return isParamTitle(title) || isProperty(title) ||
        title === 'alias' || title === 'this' || title === 'mixes' || title === 'requires';
}

/**
 * @private
 * 
 * @param {String} title
 * @return {Boolean}
 *
 * @properties={typeid:24,uuid:"9CE0B90C-7C5B-4CD6-9B9D-CFAF87E0F187"}
 */
function isAllowedName(title) {
    return isNameParameterRequired(title) || title === 'const' || title === 'constant';
}

/**
 * @private
 * @param {String} title
 * @return {Boolean}
 *
 * @properties={typeid:24,uuid:"022828B8-B41C-4B1B-901B-27030DBB06F4"}
 */
function isAllowedNested(title) {
    return isProperty(title) || isParamTitle(title);
}

/**
 * @private
 * 
 * @param {String} title
 * @return {Boolean}
 *
 * @properties={typeid:24,uuid:"EB94692D-3297-4ECD-AD7B-469F3D56745F"}
 */
function isAllowedOptional(title) {
    return isProperty(title) || isParamTitle(title);
}

/**
 * @private
 * 
 * @param {String} title
 * @return {Boolean}
 *
 * @properties={typeid:24,uuid:"A32DB43C-532C-451B-B563-A7A007577453"}
 */
function isAllowedType(title) {
    return isTypeParameterRequired(title) || title === 'throws' || title === 'const' || title === 'constant' ||
        title === 'namespace' || title === 'member' || title === 'var' || title === 'module' ||
        title === 'constructor' || title === 'class' || title === 'extends' || title === 'augments' ||
        title === 'public' || title === 'private' || title === 'protected';
}

/**
 * @private
 * 
 * @param {Number} last
 *
 * @properties={typeid:24,uuid:"237656AE-7642-444B-B9C7-1DFC40ADB322"}
 */
function skipWhiteSpace(last) {
    while (index < last && (scopes.esutils.isWhiteSpace(source.charCodeAt(index)) || scopes.esutils.isLineTerminator(source.charCodeAt(index)))) {
        advance();
    }
}

/**
 * @private
 * 
 * @param {String} sourceText
 * @param {Number} givenIndex
 * @param {Number} last
 *
 * @return {String}
 * 
 * @properties={typeid:24,uuid:"279017B8-091F-4B59-BE72-26848D631499"}
 */
function sliceSource(sourceText, givenIndex, last) {
    return sourceText.slice(givenIndex, last);
}

/**
 * @private 
 * 
 * @param {Number} last
 * @return {String}
 *
 * @properties={typeid:24,uuid:"E2C99D78-9B31-4436-A3C2-3DFFACFF3B43"}
 */
function scanIdentifier(last) {
    var identifier;
    if (!scopes.esutils.isIdentifierStartES5(source.charCodeAt(index)) && !source[index].match(/[0-9]/)) {
        return null;
    }
    identifier = advance();
    while (index < last && scopes.esutils.isIdentifierPartES5(source.charCodeAt(index))) {
        identifier += advance();
    }
    return identifier;
}

/**
 * @private 
 * 
 * @param {Number} last
 * @param {Boolean} allowBrackets
 * @param {Boolean} allowNestedParams
 * 
 * @return {String}
 *
 * @properties={typeid:24,uuid:"72E87B4F-F4E4-4DB5-83B9-F7EBAD3E6072"}
 */
function parseName(last, allowBrackets, allowNestedParams) {
    var name = '',
        useBrackets,
        insideString;


    skipWhiteSpace(last);

    if (index >= last) {
        return null;
    }

    if (source.charCodeAt(index) === 0x5B  /* '[' */) {
        if (allowBrackets) {
            useBrackets = true;
            name = advance();
        } else {
            return null;
        }
    }

    name += scanIdentifier(last);

    if (allowNestedParams) {
        if (source.charCodeAt(index) === 0x3A /* ':' */ && (
                name === 'module' ||
                name === 'external' ||
                name === 'event')) {
            name += advance();
            name += scanIdentifier(last);

        }
        if(source.charCodeAt(index) === 0x5B  /* '[' */ && source.charCodeAt(index + 1) === 0x5D  /* ']' */){
            name += advance();
            name += advance();
        }
        while (source.charCodeAt(index) === 0x2E  /* '.' */ ||
                source.charCodeAt(index) === 0x2F  /* '/' */ ||
                source.charCodeAt(index) === 0x23  /* '#' */ ||
                source.charCodeAt(index) === 0x2D  /* '-' */ ||
                source.charCodeAt(index) === 0x7E  /* '~' */) {
            name += advance();
            name += scanIdentifier(last);
        }
    }

    if (useBrackets) {
        skipWhiteSpace(last);
        // do we have a default value for this?
        if (source.charCodeAt(index) === 0x3D  /* '=' */) {
            // consume the '='' symbol
            name += advance();
            skipWhiteSpace(last);

            var ch;
            var bracketDepth = 1;

            // scan in the default value
            while (index < last) {
                ch = source.charCodeAt(index);

                if (scopes.esutils.isWhiteSpace(ch)) {
                    if (!insideString) {
                        skipWhiteSpace(last);
                        ch = source.charCodeAt(index);
                    }
                }

                if (ch === 0x27 /* ''' */) {
                    if (!insideString) {
                        insideString = '\'';
                    } else {
                        if (insideString === '\'') {
                            insideString = '';
                        }
                    }
                }

                if (ch === 0x22 /* '"' */) {
                    if (!insideString) {
                        insideString = '"';
                    } else {
                        if (insideString === '"') {
                            insideString = '';
                        }
                    }
                }

                if (ch === 0x5B /* '[' */) {
                    bracketDepth++;
                } else if (ch === 0x5D  /* ']' */ &&
                    --bracketDepth === 0) {
                    break;
                }

                name += advance();
            }
        }

        skipWhiteSpace(last);

        if (index >= last || source.charCodeAt(index) !== 0x5D  /* ']' */) {
            // we never found a closing ']'
            return null;
        }

        // collect the last ']'
        name += advance();
    }

    return name;
}
    
/**
 * @private 
 * 
 * @param {String} title
 * @param {Number} last
 * 
 * @return {String}
 *
 * @properties={typeid:24,uuid:"E478E2A3-2268-4F78-B206-0A12D346E166"}
 */
function parseType(title, last) {
    var ch, brace, type, direct = false;


    // search '{'
    while (index < last) {
        ch = source.charCodeAt(index);
        if (scopes.esutils.isWhiteSpace(ch)) {
            advance();
        } else if (ch === 0x7B  /* '{' */) {
            advance();
            break;
        } else {
            // this is direct pattern
            direct = true;
            break;
        }
    }


    if (direct) {
        return null;
    }

    // type expression { is found
    brace = 1;
    type = '';
    while (index < last) {
        ch = source.charCodeAt(index);
        if (scopes.esutils.isLineTerminator(ch)) {
            advance();
        } else {
            if (ch === 0x7D  /* '}' */) {
                brace -= 1;
                if (brace === 0) {
                    advance();
                    break;
                }
            } else if (ch === 0x7B  /* '{' */) {
                brace += 1;
            }
            type += advance();
        }
    }

    if (brace !== 0) {
        // braces is not balanced
		throw new Error('Braces are not balanced')
    }

    if (isAllowedOptional(title)) {
        return type //typed.parseParamType(type, {startIndex: convertIndex(startIndex), range: addRange});
    }

    return type //typed.parseType(type, {startIndex: convertIndex(startIndex), range: addRange});
}







