import Util from 'voyant/src/util';

// Based on code from https://github.com/renhongl/json-viewer-js

/**
 * @ignore
 */
class DataViewer {

	constructor(options) {
		this.cls = 'spyral-dv-';

		let defaults = {
			container: document.body,
			data: '{}',
			name: undefined,
			expand: false
		};
		this.options = Object.assign(defaults, options);

		this.options.container.setAttribute('class', `${this.cls}container`);

		this.exportData = {};
		this.exportDataContext = this.exportData;

		this.render(0, this.options.container, this.options.name, this.options.data);
	}

	render(indent, parent, key, data) {
		let {type, basicType} = getTypeData(data);

		this.exportDataContext[key] = {
			type: type,
			value: undefined
		};
		this.exportDataContext = this.exportDataContext[key];

		let createdItem = this.createItem(indent, parent, key, data);
		
		if (basicType) {
			createdItem.right.setAttribute('class', `${this.cls}${type} ${this.cls}right`);
			if (type === 'Null') data = 'null';
			else if (type === 'String') data = '"'+data+'"';
			createdItem.right.innerText = data;
			
			this.exportDataContext.value = data;
		} else {
			const exportDataParentContext = []
			this.exportDataContext.value = exportDataParentContext;

			if (type === 'Node') {
				for (let n of data.childNodes) {
					let key = n.tagName || '#text';
					if (key === '#text') {
						n = n.textContent.trim();
						if (n.length === 0) continue;
					}

					exportDataParentContext.push({});
					this.exportDataContext = exportDataParentContext[exportDataParentContext.length-1];

					this.render(indent+0, createdItem.right, key, n);
				}
			} else if (type === 'Object') {
				for (let key in data) {
					if (data.hasOwnProperty(key)) {

						exportDataParentContext.push({});
						this.exportDataContext = exportDataParentContext[exportDataParentContext.length-1];

						this.render(indent+0, createdItem.right, key, data[key]);
					}
				}
			} else {
				for (let i = 0, l = data.length; i < l; i++) {
					
					exportDataParentContext.push({});
					this.exportDataContext = exportDataParentContext[exportDataParentContext.length-1];

					this.render(indent+0, createdItem.right, i, data[i]);
				}
			}
		}
	}
	 
	createItem(indent, parent, key, data) {
		let container = document.createElement('span');
		container.style.marginLeft = indent*2 + 'px';
		container.setAttribute('class', `${this.cls}content`);

		let left = document.createElement('span');
		let right = document.createElement('span');
		container.appendChild(left);
		container.appendChild(right);

		parent.appendChild(container);
		
		let {type, basicType} = getTypeData(data);

		if (basicType) {
			if (key !== undefined) left.innerHTML = key+':&nbsp;';
			left.setAttribute('class', `${this.cls}left`);
		} else {
			let numChildren;
			let bracketL;
			let bracketR;
			if (type === 'Node') {
				numChildren = data.childNodes.length;
				bracketL = '<';
				bracketR = '>';
			} else if (type === 'Object') {
				numChildren = Object.keys(data).length;
				bracketL = '{';
				bracketR = '}';
			} else {
				numChildren = data.length;
				bracketL = '[';
				bracketR = ']';
			}
			
			left.innerHTML = `${key}: <span class="${this.cls}type">${type}</span><span class="${this.cls}length">${bracketL}${numChildren}${bracketR}</span> `;

			if (numChildren > 0) {
				let expandCls = this.options.expand ? `${this.cls}expanded` : `${this.cls}collapsed`;

				let folderIcon = document.createElement('span');
				folderIcon.setAttribute('class', `${this.cls}folder-icon ${expandCls}`);
				folderIcon.innerHTML = '<svg width="8" height="8" class="open"><path d="M4 7L0 1h8z" fill="#000"></path></svg>'+'<svg width="8" height="8" class="closed"><path d="M7 4L1 8V0z" fill="#000"></path></svg>';
				left.append(folderIcon);
				
				left.setAttribute('class', `${this.cls}left ${this.cls}folder`);
				
				let self = this;
				left.onclick = function(e) {
					let target = e.currentTarget;
					let collapsedParent = e.currentTarget.closest(`.${self.cls}collapsed`);
					if (collapsedParent !== null) {
						target = collapsedParent.previousElementSibling;
					}
					self.toggleItem(target);
					self.options.container.dispatchEvent(new Event(`${self.cls}toggle`));
				}

				right.setAttribute('class', `${this.cls}${type} ${this.cls}right ${expandCls}`);
			}
		}
			
		return {
			left: left,
			right: right
		};
	}
	 
	toggleItem(folderEl) {
		let iconEl = folderEl.querySelector(`.${this.cls}folder-icon`);
		let contentsEl = folderEl.nextElementSibling;
		
		let doExpand = iconEl.classList.contains(`${this.cls}expanded`) === false;
	
		if (doExpand) {
			iconEl.classList.remove(`${this.cls}collapsed`);
			iconEl.classList.add(`${this.cls}expanded`);
			contentsEl.classList.remove(`${this.cls}collapsed`);
			contentsEl.classList.add(`${this.cls}expanded`);
		} else {
			iconEl.classList.remove(`${this.cls}expanded`);
			iconEl.classList.add(`${this.cls}collapsed`);
			contentsEl.classList.remove(`${this.cls}expanded`);
			contentsEl.classList.add(`${this.cls}collapsed`);
			contentsEl.querySelectorAll(`.${this.cls}expanded`).forEach(function(expandedChild) {
				expandedChild.classList.remove(`${this.cls}expanded`);
				expandedChild.classList.add(`${this.cls}collapsed`);
			}.bind(this));
		}
	}

	getExportData() {
		return this.exportData;
	}
}

function getTypeData(val) {
	let type = 'Undefined';
	if (Util.isNode(val)) type = 'Node';
	if (Util.isObject(val)) type = 'Object';
	if (Util.isArray(val)) type = 'Array';
	if (Util.isString(val)) type = 'String';
	if (Util.isNumber(val)) type = 'Number';
	if (Util.isBoolean(val)) type = 'Boolean';
	if (Util.isNull(val)) type = 'Null';

	const basicType = type !== 'Node' && type !== 'Object' && type !== 'Array';

	return {type, basicType};
}

export default DataViewer;