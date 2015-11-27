import React from 'react';


export default class AutoComponent extends React.Component {
	constructor() {
		super()
		var cls = this.constructor
		var methods, methodName
		while (cls !== AutoComponent) {
			methods = Object.getOwnPropertyNames(cls.prototype)
			for (var i in methods) {
				methodName = methods[i]
				if (methodName.match(/^on[A-Z]/) !== null) {
					this[methodName] = this[methodName].bind(this)
				}
			}
			cls = cls.__proto__
		}
	}
}
