const Constants = require('../constants');
const WebSocket = require('ws');
const PacketHandler = require('./packetHandler')

class WebSocketConnection {
	constructor(manager,gateway){
		this.manager = manager;
		this.client = manager.client;
		this.ws = null;
		this.status = Constants.Status.IDLE;
		this.lastPingTimestamp = 0;
		this.expectingClose = false;
		this.connect(gateway);
		this.packetHandler = new PacketHandler(this);
	}

	connect(gateway){
		if(this.ws){
			return false;
		}
		this.gateway = `${gateway}/?v=6&&encoding=json`;
		const ws = this.ws = new WebSocket(gateway);
		ws.onmessage = this.onMessage.bind(this);
		ws.onopen = this.onOpen.bind(this);
	  ws.onerror = this.onError.bind(this);
	  ws.onclose = this.onClose.bind(this);
	  this.status = Constants.Status.CONNECTING;
	  return true;
	}

	onMessage(event) {
	 let data;
	  try {
	   data = this.unpack(event.data);
	  }catch (err) {
	 }
	 return this.onPacket(data);
  }

	unpack(data) {
  	if (data instanceof ArrayBuffer) data = Buffer.from(new Uint8Array(data));
	  else if (data instanceof Buffer) data = zlib.inflateSync(data).toString();

  	return JSON.parse(data);
	}

	onOpen(event) {
  	if (event && event.target && event.target.url) this.gateway = event.target.url;
  	console.log(`Connected to gateway ${this.gateway}`);
  	this.identify();
	}

	onClose(event) {
    console.log(`${this.expectingClose ? 'Client' : 'Server'} closed the WebSocket connection: ${event.code}`);
    this.closeSequence = this.sequence;
    this.emit('close', event);
    this.heartbeat(-1);
    this.expectingClose = false;
    this.reconnect();
	}

	onError(error) {
		console.log("Error",error.message);
    if (error && error.message === 'uWs client connection error') {
      this.reconnect();
      return;
    }
  
	}

	reconnect() {
  	this.connect(this.gateway);
  }

	onPacket(packet) {
    if (!packet) {
      return false;
    }
    switch (packet.op) {
      case Constants.OPCodes.HELLO:
        return this.heartbeat(packet.d.heartbeat_interval);
      case Constants.OPCodes.RECONNECT:
        return this.reconnect();
      case Constants.OPCodes.INVALID_SESSION:
        if (!packet.d) this.sessionID = null;
        this.sequence = -1;
        return this.identify(packet.d ? 2500 : 0);
      case Constants.OPCodes.HEARTBEAT_ACK:
        return
      case Constants.OPCodes.HEARTBEAT:
        return this.heartbeat();
      default:
      	this.sequence = packet.s;
      	return this.packetHandler.handlePacket(packet);
    }
  }

  heartbeat(time) {
    if (!isNaN(time)) {
      if (time === -1) {
        this.manager.clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      } else {
        this.heartbeatInterval = this.manager.setInterval(() => this.heartbeat(), time);
      }
      return;
    }
    console.log('Sending a heartbeat');
    this.lastPingTimestamp = Date.now();
    this.send({
      op: Constants.OPCodes.HEARTBEAT,
      d: this.sequence,
    });
  }

  send(data) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.debug(`Tried to send packet ${JSON.stringify(data)} but no WebSocket is available!`);
      return;
    }
    this.ws.send(this.pack(data));
  }

  pack(data){
  	return JSON.stringify(data);
  }

  identify(after) {
    if (after) return this.manager.setTimeout(this.identify.bind(this), after);
    return this.sessionID ? this.identifyResume() : this.identifyNew();
  }

  identifyNew() {
    if (!this.client.token) {
      this.debug('No token available to identify a new session with');
      return;
    }
    const d = Object.assign({ token: this.client.token }, this.client.options.ws);

    this.send({ op: Constants.OPCodes.IDENTIFY, d });
  }

  // identifyResume() {
  //   if (!this.sessionID) {
  //     this.debug('Warning: wanted to resume but session ID not available; identifying as a new session instead');
  //     return this.identifyNew();
  //   }
  //   this.debug(`Attempting to resume session ${this.sessionID}`);

  //   const d = {
  //     token: this.client.token,
  //     session_id: this.sessionID,
  //     seq: this.sequence,
  //   };

  //   return this.send({
  //     op: Constants.OPCodes.RESUME,
  //     d,
  //   });
  // }

}

WebSocketConnection.WebSocket = WebSocket;
module.exports = WebSocketConnection;