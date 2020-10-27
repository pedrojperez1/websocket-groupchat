/** Client-side of groupchat. */

const urlParts = document.URL.split("/");
const roomName = urlParts[urlParts.length - 1];
const ws = new WebSocket(`ws://localhost:3000/chat/${roomName}`);


const name = prompt("Username?");


/** called when connection opens, sends join info to server. */

ws.onopen = function(evt) {
  console.log("open", evt);

  let data = {type: "join", name: name};
  ws.send(JSON.stringify(data));
};


/** called when msg received from server; displays it. */

ws.onmessage = function(evt) {
  console.log("message", evt);

  let msg = JSON.parse(evt.data);
  let item;

  switch(msg.type) {
    case "note":
      item = $(`<li><i>${msg.text}</i></li>`);
      break;
    case "chat":
      item = $(`<li><b>${msg.name}: </b>${msg.text}</li>`);
      break;
    default:
      return console.error(`bad message: ${msg}`);
  }


  $('#messages').append(item);
};


/** called on error; logs it. */

ws.onerror = function (evt) {
  console.error(`err ${evt}`);
};


/** called on connection-closed; logs it. */

ws.onclose = function (evt) {
  console.log("close", evt);
};


/** send message when button pushed. */

$('form').submit(function (evt) {
  evt.preventDefault();
  let data;
  
  switch ($("#m").val()) {
    case "/joke":
      data = {type: "joke"};
      break;
    case "/members":
      data = {type: "members"};
      break;
    default:
      data = {type: "chat", text: $("#m").val()};
  }
  
  ws.send(JSON.stringify(data));

  $('#m').val('');
});

