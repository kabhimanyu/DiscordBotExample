const Constants = require('../constants');

class PacketHandler {
	constructor(connection){
		this.connection = connection;
	}	

	handlePacket(packet){
		if(packet.op === Constants.OPCodes.DISPATCH && packet.t === Constants.Events.MESSAGE_CREATE){
			if(packet.d && packet.d.content && packet.d.content.toLowerCase() === '!ping'){
				this.connection.client.sendMessage('pong',packet.d.channel_id)
			}
		} else {
			return;
		}
	}
}

module.exports = PacketHandler;