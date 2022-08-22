Ext.define("Voyant.notebook.editor.button.Run", {
	extend: "Ext.button.Button",
	mixins: ["Voyant.util.Localization"],
	alias: 'widget.notebookwrapperrun',
	statics: {
		i18n: {
		}
	},
	glyph: 'xf04b@FontAwesome',
	constructor: function(config) {
		config = config || {};
		config.tooltip = this.localize('tip');
		this.callParent(arguments);
	},
	listeners: {
		click: function(btn, e) {
			var ed = Voyant.notebook.editor.EditorWrapper.currentEditor;
			ed.run.call(ed);
		}
	}
})