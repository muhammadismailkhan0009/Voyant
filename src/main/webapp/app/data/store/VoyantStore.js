Ext.define('Voyant.data.store.VoyantStore', {
	mixins: ['Voyant.util.Localization'],
	config: {
		corpus: undefined,
		parentPanel: undefined
	},
	statics: {
		i18n: {
			maxTime: 'This tool has exceeded the maximum run time and has returned partial results.'
		}
	},
	constructor: function(config, extras) {
		var me = this;
		config = config || {};
		Ext.applyIf(config, {
			remoteSort: true,
			autoLoad: false,
//			listeners: {
//				beforeload: function(store, operation) {
//					var parent = this.getParentPanel();
//					if (parent !== undefined) {
//						var params = parent.getApiParams();
//						operation = operation ? (operation===1 ? {} : operation) : {};
//						operation.params = operation.params || {};
//						for (var key in params) {
//							operation.params[key] = params[key];
//						}
//					}
//				}
//			},
//			scope: this,
			// define buffered configuration even if ignored when this isn't a buffered store
			pagePurgeCount : 0, // don't purge any data
			pageSize : 100, // each request is more intenstive, so do fewer of them then default
			leadingBufferZone : 200 // stay two pages ahead
		});
		config.proxy = config.proxy || {};
		Ext.applyIf(config.proxy, {
			type: 'ajax',
			url: Voyant.application.getTromboneUrl(),
			actionMethods: {read: 'POST'},
			timeout: extras['proxy.timeout'] || 30000,
			reader: {
				type: 'json',
				rootProperty: extras['proxy.reader.rootProperty'],
				totalProperty: extras['proxy.reader.totalProperty'],
				metaProperty: extras['proxy.reader.metaProperty'] || 'metaData'
			},
			simpleSortMode: true,
			listeners: {
				exception: function(proxy, request, operation) {
					if (me.parentPanel && me.parentPanel.showError) {
						// FIXME: this should probably send the request, not the operation
						me.parentPanel.showError(operation)
					}
				},
				endprocessresponse: function(proxy, response, operation) {
					if (operation.wasSuccessful()) {
						// check for tool messages from the server
						var config = proxy.getReader().initialConfig;
						var rootPropertyParent = config.rootProperty.split('.')[0];
						var json = JSON.parse(response.responseText);
						var parent = json[rootPropertyParent];
						if (parent && parent.messages) {
							var message = '';
							var firstMessage = parent.messages[0];
							if (firstMessage.code === 'maxTime') {
								message = me.localize('maxTime');
							} else {
								message = firstMessage.message;
							}
							if (me.parentPanel && me.parentPanel.toastInfo) {
								me.parentPanel.toastInfo(message);
							} else {
								console.warn('VoyantStore server message: '+message);
							}
						}
					}
				}
			}
		})
		config.proxy.extraParams = config.proxy.extraParams || {};
		Ext.applyIf(config.proxy.extraParams, {
			tool: extras['proxy.extraParams.tool']
		});
		
		if (config.parentPanel !== undefined) {
			Ext.applyIf(config.proxy.extraParams, {
				forTool: config.parentPanel.xtype
			});
			this.setParentPanel(config.parentPanel);
			config.parentPanel.on("loadedCorpus", function(src, corpus) {
				this.setCorpus(corpus);
			}, this);
			config.listeners = config.listeners || {};
			config.listeners.beforeload = {
					fn: function(store, operation) {
						var parent = this.getParentPanel(), proxy = store.getProxy();
						if (parent !== undefined) {

							var params = parent.getApiParams();
							operation = operation ? (operation===1 ? {} : operation) : {};
							operation.params = operation.params || {};
							
							// unset any previously set extra params (only applies with proxy and buffered store)
							if (proxy && this.isBufferedStore) {
								Ext.Array.from(this.previouslySetExtraParams).forEach(function(key) {
									proxy.setExtraParam(key, undefined);
								});
								this.previouslySetExtraParams = [];
							}
							for (var key in params) {
								
								/* TODO NOT SURE ABOUT THIS
								// don't sent stopList when there's a query
								if (key=="stopList" && "query" in params && params.query) {continue;}
								*/
								
								if (proxy && this.isBufferedStore) { // also set proxy for automatic buffering calls
									this.previouslySetExtraParams.push(key);
									proxy.setExtraParam(key, params[key]);
								}
								operation.params[key] = params[key];
							}
						}
					},
					scope: this
			}
		}
		
		Ext.apply(this, config);
	},
	setCorpus: function(corpus) {
		if (corpus && this.getProxy && this.getProxy()) {
			this.getProxy().setExtraParam('corpus', Ext.isString(corpus) ? corpus : corpus.getId());
		}
		this.callParent(arguments);
	},
	getString: function(config) {
		var count = this.getCount();
		return "This store contains "+this.getCount()+" items"+(count>0 ? " with these fields: "+this.getAt(0).getFields().map(function(field) {return field.getName()}).join(", ") : "")+"."
	}
	
});