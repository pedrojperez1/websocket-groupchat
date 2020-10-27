/** Functionality related to chatting. */

const axios = require("axios");
// Room is an abstraction of a chat channel
const Room = require('./Room');

/** ChatUser is a individual connection from client -> server to chat. */

class ChatUser {
  /** make chat: store connection-device, rooom */

  constructor(send, roomName) {
    this._send = send; // "send" function for this user
    this.room = Room.get(roomName); // room user will be in
    this.name = null; // becomes the username of the visitor

    console.log(`created chat in ${this.room.name}`);
  }

  /** send msgs to this client using underlying connection-send-function */

  send(data) {
    try {
      this._send(data);
    } catch (e){
      console.log(e);
    }
  }

  /** handle joining: add to room members, announce join */

  handleJoin(name) {
    this.name = name;
    this.room.join(this);
    this.room.broadcast({
      type: 'note',
      text: `${this.name} joined "${this.room.name}".`
    });
  }

  /** handle a chat: broadcast to room. */

  handleChat(text) {
    this.room.broadcast({
      name: this.name,
      type: 'chat',
      text: text
    });
  }

  /** handle a joke: reply to user. */

  async handleJoke() {
    const config = {
      method: "get",
      url: "https://icanhazdadjoke.com/",
      headers: { "Accept": "application/json"}
    }
    const joke = await axios(config);
    console.log(joke.data);
    const jokeData = {
      type: "chat", 
      text: joke.data.joke,
      name: "Server"
    }
    this.send(JSON.stringify(jokeData));
  }

  handleGetMembers() {
    const members = [...this.room.members].map(m => m.name);
    const membersString = `In room: ${members.join(", ")}`;
    this.send(JSON.stringify({
      type: "chat",
      text: membersString,
      name: "Server"
    }))
  }

  /** Handle messages from client:
   *
   * - {type: "join", name: username} : join
   * - {type: "chat", text: msg }     : chat
   */

  handleMessage(jsonData) {
    let msg = JSON.parse(jsonData);
    switch (msg.type) {
      case "join":
        this.handleJoin(msg.name);
        break;
      case "chat":
        this.handleChat(msg.text);
        break;
      case "joke":
        this.handleJoke();
        break;
      case "members":
        this.handleGetMembers();
        break;
      default:
        throw new Error(`bad message: ${msg.type}`)
    }
  }

  /** Connection was closed: leave room, announce exit to others */

  handleClose() {
    this.room.leave(this);
    this.room.broadcast({
      type: 'note',
      text: `${this.name} left ${this.room.name}.`
    });
  }
}

module.exports = ChatUser;
