Ext.define('Voyant.widget.ColorPaletteOption', {
    extend: 'Ext.container.Container',
    mixins: ['Voyant.util.Localization'],
    alias: 'widget.colorpaletteoption',
    layout: 'hbox',
	margin: '0 0 5px 0',
    statics: {
    	i18n: {
    	}
    },
    
    paletteTpl: new Ext.XTemplate(
		'<tpl for=".">',
			'<div class="color" style="background-color: rgb({color});"></div>',
		'</tpl>'
	),
	paletteStore: new Ext.data.ArrayStore({
        fields: ['id', 'color'],
        listeners: {
        	update: function(store, record, op, mod, details) {
        	},
        	scope: this
        } 
    }),
    
    editPaletteWin: null,
    spectrum: null,
    
    initComponent: function(config) {
    	var me = this;

    	var app = this.up('window').panel.getApplication();
    	var data = [];
    	for (var key in app.getPalettes()) {
    		data.push({name: key, value: key});
    	}
    	var value = app.getApiParam('palette');
    	
    	Ext.apply(me, {
	    		items: [{
	    	        xtype: 'combo',
	    	        queryMode: 'local',
	    	        value: value,
	    	        triggerAction: 'all',
	    	        editable: true,
	    	        fieldLabel: me.localize('palette'),
	    	        labelAlign: 'right',
	    	        name: 'palette',
	    	        displayField: 'name',
	    	        valueField: 'value',
	    	        store: {
	    	            fields: ['name', 'value'],
	    	            data: data
	    	        }
	    		}, {width: 10}, {xtype: 'tbspacer'}, {
	    			xtype: 'button',
	    			text: this.localize('editList'),
		            ui: 'default-toolbar',
	    			handler: this.editPalette,
	    			scope: this
	    		}
//	    		, {width: 10}, {
//	    			xtype: 'checkbox',
//	    			name: 'paletteGlobal',
//	    			checked: true,
//	    			boxLabel: this.localize('applyGlobally')
//	    		}
	    		]
    	});
        me.callParent(arguments);
    },
    
    editPalette: function() {
    	var value = this.down('combo').getValue();
    	this.loadPalette(value);
    	
    	this.editPaletteWin = Ext.create('Ext.window.Window', {
			title: this.localize('paletteEditor'),
			modal: true,
			height: 300,
			width: 425,
			padding: 5,
			layout: {
				type: 'hbox',
				align: 'stretch'
			},
			items:[{
				flex: 1,
				layout: {
					type: 'vbox',
					align: 'stretch'
				},
				items: [{
					height: 24,
					margin: '0 0 5 0',
					items: [{
						xtype: 'button',
						text: this.localize('add'),
						margin: '0 5 0 0',
						handler: function(btn) {
							var color = this.spectrum.spectrum('get').toRgb();
							var dv = this.editPaletteWin.down('dataview');
							this.paletteStore.add([ [Ext.id(), [color.r, color.g, color.b]] ]);
							dv.refresh();
						},
						scope: this
					},{
						xtype: 'button',
						text: this.localize('remove'),
						margin: '0 5 0 0',
						handler: function(btn) {
							var dv = this.editPaletteWin.down('dataview');
							var sel = dv.getSelectionModel().getSelection()[0];
							if (sel != null) {
								this.paletteStore.remove(sel);
							}
							dv.refresh();
						},
						scope: this
					},{
						xtype: 'button',
						text: this.localize('clear'),
						handler: function(btn) {
							this.paletteStore.removeAll();
						},
						scope: this
					}]
				},{
					xtype: 'dataview',
					flex: 1,
					scrollable: 'y',
		        	store: this.paletteStore,
		        	tpl: this.paletteTpl,
		        	itemSelector: 'div.color',
		        	overItemCls: 'over',
		        	selectedItemCls: 'selected',
		        	selectionModel: {
		        		mode: 'SINGLE'
		        	},
		        	listeners: {
		        		selectionchange: function(viewmodel, selected, opts) {
		        			if (selected[0] != null) {
								var color = selected[0].get('color');
								var parentPanel = this.up('window').panel;
								var hex = parentPanel.getApplication().rgbToHex(color);
								this.spectrum.spectrum('set', hex);
							}
		        		},
		        		scope: this
		        	}
				}]
			},{
				itemId: 'colorEditor',
				width: 200,
				margin: '0 0 0 5',
				html: '<input type="text" style="display: none;" />'
			}],
			buttons: [{
				text: this.localize('saveNewPalette'),
				handler: function(btn) {
					this.savePalette();
					btn.up('window').close();
				},
				scope: this
			},{
				text: this.localize('cancel'),
				handler: function(btn) {
					btn.up('window').close();
				},
				scope: this
			}],
			listeners: {
				close: function(panel) {
					if (this.spectrum) {
						this.spectrum.spectrum('destroy');
						this.spectrum = null;
					}
				},
				scope: this
			}
    	}).show();
    	
    	this.initSpectrum();
    },
    
    setColorForSelected: function(color) {
    	if (this.spectrum !== null) { // need check due to https://github.com/bgrins/spectrum/issues/387
			var rgb = color.toRgb();
			var rgbA = [rgb.r, rgb.g, rgb.b];
			var dv = this.editPaletteWin.down('dataview');
			var sel = dv.getSelectionModel().getSelection()[0];
			if (sel != null) {
				sel.set('color', rgbA);
			}
    	}
	},
    
	initSpectrum: function() {
		if (this.spectrum === null) {
			var editor = this.editPaletteWin.down('#colorEditor');
			var input = editor.el.down('input');
			this.spectrum = $(input.dom).spectrum({
				flat: true,
				showInput: true,
				showButtons: false,
				preferredFormat: 'hex',
				change: this.setColorForSelected.bind(this),
				move: this.setColorForSelected.bind(this)
			});
		}
	},
	
    loadPalette: function(paletteId) {
    	var application = this.up('window').panel.getApplication();
    	
    	var palette = application.getColorPalette(paletteId);

		if (palette == undefined) {
			application.loadCustomColorPalette(paletteId).then(function(id) {
				this.loadPalette(paletteId);
			}.bind(this), function() {
				// error loading palette
			})
		} else {
			var paletteData = [];
			palette.forEach(function(c) {
				paletteData.push([Ext.id(), c]);
			}, this);
			this.paletteStore.loadData(paletteData);
		}
    },
    
    savePalette: function() {
    	var value = [];
    	this.paletteStore.each(function(c) {
    		value.push(c.get('color'));
    	});
    	
		this.up('window').panel.getApplication()
			.saveCustomColorPalette(value).then(function(id) {
				var combo = this.down('combo');
				var store = combo.getStore();
				store.add({name: id, value: id});
				combo.setValue(id);
				combo.updateLayout();
			}.bind(this));
    }
});