const axios = require('axios');

class APIRequest {
	constructor(client,method,path,auth,data){
		this.client = client;
		this.method = method;
		this.path = path;
		this.auth = auth
		this.data = data;
	}
	getAuthHeader(){
		if(this.client && this.client.token){
			return {'Authorization' :`Bot ${this.client.token}`};
		} else {
			return {'Authorization' : `Bot ${process.env.BOT_TOKEN}`};
		}
	}
	generateRequest(){
		const ENDPOINT = `${this.client.options.http.host}/api/v${this.client.options.http.version}`;
		let options = {};
		options.url = `${ENDPOINT}${this.path}`;
		if(this.method){options.method = this.method;}
		if(this.data){options.data = this.data};
		if(this.auth){options.headers = this.getAuthHeader()};
		
		return axios(options)
	}
}

module.exports = APIRequest;