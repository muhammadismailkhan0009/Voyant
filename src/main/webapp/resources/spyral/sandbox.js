window.Corpus = Spyral.Corpus;
window.Table = Spyral.Table;

window.loadCorpus = function() {
	return Spyral.Corpus.load.apply(Spyral.Corpus.load, arguments)
}

window.createTable = function() {
	return Spyral.Table.create.apply(Spyral.Table, arguments)
}

window.show = Spyral.Util.show;
window.showError = Spyral.Util.showError;

function Sandboxer(event) {
	var me = this;

	me.result = {
		type: 'result', // 'result' or 'error' or 'command'
		name: undefined, // variable name associated with result value
		value: undefined, // result of running the code
		output: undefined, // html result of running the code
		height: undefined, // height of the this document
		variables: [] // variables created as a result of running the code
	};

	this.handleEvent = function() {
		try {
			var messageObj = event.data;
			if (messageObj.type === 'code') {
				this.runCode(messageObj.value, messageObj.variables);
			} else {
				if (messageObj.type === 'command') {
					me.result.type = 'command';
					switch (messageObj.command) {
						case 'update':
							if (messageObj.html !== undefined) {
								document.body.classList.value = '';
								document.body.innerHTML = messageObj.html;
							} else {
								me.showData(messageObj.dataName, messageObj.dataValue);
							}
							break;
						case 'clear':
							document.body.innerHTML = '';
							document.body.classList.value = '';
							break;
						case 'getContents':
							me.result.value = document.body.outerHTML;
							break;
						case 'init':
							break;
					}
					me.result.command = messageObj.command;
					me.result.height = document.firstElementChild.offsetHeight;
					event.source.postMessage(me.result, event.origin);
				}
			}
		} catch (err) {
			me.handleError(err);
		}
	}



	this.getSpyralClass = function(thing) {
		if (thing != undefined) {
			if (thing instanceof Spyral.Categories) {
				return 'Spyral.Categories'
			} else if (thing instanceof Spyral.Chart) {
				return 'Spyral.Chart'
			} else if (thing instanceof Spyral.Corpus) {
				return 'Spyral.Corpus'
			} else if (thing instanceof Spyral.Metadata) {
				return 'Spyral.Metadata'
			} else if (thing instanceof Spyral.Notebook) {
				return 'Spyral.Notebook'
			} else if (thing instanceof Spyral.Table) {
				return 'Spyral.Table'
			}
		}
		return false;
	}

	this.notifyHeightChange = function(e) {
		me.result.type = 'command';
		me.result.command = 'update';
		me.result.height = document.firstElementChild.offsetHeight;
		event.source.postMessage(me.result, event.origin);
	}


	this.var2Blob = function(thing) {
		if (thing instanceof Blob) {
			return thing;
		}

		var type = '';
		var blobData = '';
		if (Spyral.Util.isString(thing)) {
			type = 'text/string';
			blobData = thing;
		} else if (Spyral.Util.isObject(thing) || Spyral.Util.isArray(thing)) {
			type = 'application/json';
			blobData = JSON.stringify(thing);
		} else if (Spyral.Util.isNode(thing)) {
			type = 'text/xml';
			blobData = new XMLSerializer().serializeToString(thing);
		}
		return new Blob([blobData], {type: type});
	}

	this.blob2Var = function(blob) {
		return new Promise(function(resolve, reject) {
			if (blob.type.search(/application\/[^json]/) === 0) {
				// probably a non-browser file type
				resolve(blob);
			} else {
				var reader = new FileReader();
				reader.addEventListener('loadend', function(ev) {
					var td = new TextDecoder();
					var data = td.decode(ev.target.result);
					if (blob.type === 'text/string' || blob.type === 'text/plain') {
						// already taken care of
					} else if (blob.type === 'application/json') {
						data = JSON.parse(data);
					} else if (blob.type === 'text/xml' || blob.type === 'text/html') {
						data = new DOMParser().parseFromString(data, 'text/xml');
					} else {
						reject('unknown blob type: '+blob.type);
					}
					resolve(data);
				});
				reader.readAsArrayBuffer(blob);
			}
		});
	}

	this.loadVariables = function(cvs) {
		if (cvs.length === 0) {
			return Promise.resolve();
		} else {
			var cv = cvs.shift();
			return me.loadVariable(cv).then(function() {
				return me.loadVariables(cvs);
			});
		}
	}

	this.loadVariable = function(cv) {
		return new Promise(function(resolve, reject) {
			me.blob2Var(cv.value).then(function(data) {
				if (cv.isSpyralClass) {
					switch (cv.isSpyralClass) {
						case 'Spyral.Categories':
							break;
						case 'Spyral.Chart':
							break;
						case 'Spyral.Corpus':
							return Spyral.Corpus.load(data.corpusid).then(function(corpus) {
								window[cv.name] = corpus;
								resolve();
							})
							break;
						case 'Spyral.Metadata':
							break;
						case 'Spyral.Notebook':
							break;
						case 'Spyral.Table':
							var table = new Spyral.Table();
							['_rows', '_headers', '_rowKeyColumnIndex'].forEach(function(prop) {
								if (data[prop] != undefined) {
									table[prop] = data[prop];
								}
							})
							window[cv.name] = table;
							resolve();
							break;
					}
					reject('no match for spyral class: '+cv.isSpyralClass);
				} else {
					window[cv.name] = data;
					resolve();
				}
			}, function(err) {
				reject(err);
			});
		});

	}

	this.getNewWindowKeys = function() {
		var newKeys = [];

		var currWindowKeys = Object.keys(window);
		for (var i = 0; i < currWindowKeys.length; i++) {
			var key = currWindowKeys[i];
			if (window['__defaultWindowKeys__'].indexOf(key) === -1) {
				newKeys.push(key);
			}
		}

		return newKeys;
	}



	this.runCode = function(code, priorVariables) {
		try {

			// collect all the declared variables
			var hasAssigner = false;
			var declaredVariables = [];
			var esr = esprima.parseScript(code, {}, function(node, metadata) {
				if (hasAssigner && node.type === 'Literal') {
					// hack to get variable name inside assign function
					declaredVariables.push(node.value);
					hasAssigner = false;
				} else if (node.type === 'VariableDeclaration') {
					if (node.declarations[0] && node.declarations[0].id && node.declarations[0].id.type === 'Identifier') {
						declaredVariables.push(node.declarations[0].id.name);
					}
				} else if (node.type === 'MemberExpression') {
					if (node.property.type === 'Identifier' && node.property.name === 'assign') {
						hasAssigner = true;
					}
				}
			});

			// remove variables from previous times this code has run
			this.getNewWindowKeys().forEach(function(newKey) {
				delete window[newKey];
			});

			this.loadVariables(priorVariables).then(function() {
				// actually run the code
				console.log('running code:', code);
				var result = undefined;
				var evalSuccess = true;
				try {
					result = eval.call(window, code);
				} catch (err) {
					evalSuccess = false;
					me.handleError(err);
				}
				// console.log('eval result', result);

				if (evalSuccess) {
					Promise.resolve(result).then(function(prResult) {
						// console.log('prResult', prResult);
						me.result.value = prResult;

						var newKeys = me.getNewWindowKeys();
						var variables = [];
						for (var i = 0; i < newKeys.length; i++) {
							var varName = newKeys[i];
							var varValue = window[varName];//eval.call(window, varName);

							if (varValue === me.result.value) {
								me.result.name = varName;
							}

							variables.push({name: varName, value: me.var2Blob(varValue), isSpyralClass: me.getSpyralClass(varValue)});
						}
						me.result.variables = variables;

						me.resolveEvent();
					}, function(err) {
						me.handleError(err);
					})
				}
			}, function(err) {
				me.handleError(err);
			});
		} catch (err) {
			me.handleError(err);
		}
	}

	this.showData = function(dataName, dataValue) {
		document.body.innerHTML = '<div></div>';
		var container = document.body.firstElementChild;
		container.removeEventListener('spyral-dv-toggle', me.notifyHeightChange); // unnecessary? removed by clear command
		var dataViewer = new Spyral.Util.DataViewer({
			container: container,
			name: dataName,
			data: dataValue
		});
		container.addEventListener('spyral-dv-toggle', me.notifyHeightChange);
	}

	this.handleError = function(error) {
		me.result.type = 'error';
		me.result.value = 'exception: '+error.message;
		me.result.error = error;
		me.resolveEvent();
	}

	this.resolveEvent = function() {
		try {
			if (me.result.type === 'error') {
				// always display error
				showError(me.result.error);
				// event listener to adjust height when showing error details
				document.body.querySelector('.error > pre > span:first-child').addEventListener('click', me.notifyHeightChange);

				// try to determine error location in the code that was run
				if (me.result.error.stack !== undefined) {
					var locationDetailsRegex = /<anonymous>:(\d+):(\d+)/;
					if (navigator.userAgent.indexOf('Chrome') === -1) { // very naive browser detection
						locationDetailsRegex = />\seval:(\d+):(\d+)/; // firefox style stack trace
					}
					var locationDetails = me.result.error.stack.match(locationDetailsRegex);
					if (locationDetails !== null) {
						me.result.error.row = parseInt(locationDetails[1]);
						me.result.error.column = parseInt(locationDetails[2]);
					}
				}
			} else {
				if (document.body.firstChild === null) {
					// .tool() output check
					if (me.result.name === undefined && Spyral.Util.isString(me.result.value) && me.result.value.indexOf('<iframe') === 0) {
						// probably tool output
						document.body.innerHTML = me.result.value;
					} else {
						me.showData(me.result.name, me.result.value);
					}
				}
			}
			
			setTimeout(function() {
				me.result.height = document.firstElementChild.offsetHeight;
				me.result.output = document.body.innerHTML;
				try {
					event.source.postMessage(me.result, event.origin);
				} catch (err) {
					// most likely an error sending the result value so remove it
					me.result.value = '';
					event.source.postMessage(me.result, event.origin);
				}
			}, 25);
		} catch (err) {
			var result = { type: 'error', value: 'exception: '+err.message };
			event.source.postMessage(result, event.origin);
		}
	}
}

window.addEventListener('load', function(event) {
	// store the default window keys
	window['__defaultWindowKeys__'] = [];
	window['__defaultWindowKeys__'] = Object.keys(window);
});

window.addEventListener('message', function(event) {
	var sandboxer = new Sandboxer(event);
	sandboxer.handleEvent();
});