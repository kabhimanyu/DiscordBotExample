const Constants = require('../Constants');
const WebSocketConnection = require('./webSocketConnection');

class WebSocketManager  {
	constructor(client){
		this.client = client;
		this.connection = null;
		this._intervals = new Set();
		this._timeouts = new Set();
	}

	connect(gatewayUrl){
		if(!this.connection){
			this.connection = new WebSocketConnection(this,gatewayUrl);
			return true;
		}
		switch (this.connection.status){
			case Constants.Status.IDLE:
			case Constants.Status.DISCONNECTED:
				 this.connection.connect(gatewayUrl,1000);
				 return true;
			default:
				return false;
		}
	}

	setInterval(fn, delay, ...args) {
    	const interval = setInterval(fn, delay, ...args);
    	this._intervals.add(interval);
    	return interval;
  	}

  	clearInterval(interval) {
    	clearInterval(interval);
    	this._intervals.delete(interval);
  	}

  	setTimeout(fn, delay, ...args) {
    	const timeout = setTimeout(() => {
      	fn(...args);
      	this._timeouts.delete(timeout);
    	}, delay);
    	this._timeouts.add(timeout);
    	return timeout;
  	}

 	clearTimeout(timeout) {
    	clearTimeout(timeout);
    	this._timeouts.delete(timeout);
  	}

}

module.exports = WebSocketManager;