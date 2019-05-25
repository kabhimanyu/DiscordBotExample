const Constants = require('../constants');
const APIRequest = require('./apiRequest');
const WebSocketManager = require('../websocket/webSocketManager');

class Client {
	constructor(options = {}) {
		this.options = Constants.DefaultOptions;
		Object.defineProperty(this,'token',{writable : true});
		if(!this.token && 'BOT_TOKEN' in process.env) {
			this.token = process.env.BOT_TOKEN;
		} else {
			this.token = null;
		}
		this.webSocketManager = new WebSocketManager(this)
	}

	login(){
		let apiRequest = new APIRequest(this,'get','/gateway/bot',true,null)
		apiRequest.generateRequest().then(response=>{
			this.webSocketManager.connect(response.data.url);
		}).catch(error=>{
		});
	}

	sendMessage(message,channelId){
		let apiRequest = new APIRequest(this,'post',`/channels/${channelId}/messages`,true,{'content' : message,'tts' : false})
		apiRequest.generateRequest().then(response => {
		}).catch(error => {
		})
	}
}
module.exports = Client;