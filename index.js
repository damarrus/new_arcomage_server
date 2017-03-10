/**
 * Created by nikita on 15.10.2016.
 */

const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const templating = require('consolidate');
const request = require('request');
const cheerio = require('cheerio');
const net = require('net');
const async = require('async');

const Game = require('./classes/game');
const carder = require('./classes/carder');
const Player = require('./classes/player');
const Match = require('./classes/match');
const db = require('./classes/db');
const Deck = require('./classes/deck');
const Messenger = require('./classes/messenger');
const Card = require('./classes/card');

const isTestClient = (process.argv[2] == 'test');
console.log("test mode " + isTestClient);

/*let player = new Player();
player.loadPlayerByID(1, function () {


});*/

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.engine('hbs', templating.handlebars);
app.set('view engine', 'hbs');
app.set('views', __dirname + '/views');

app.get('/', function(req, res){
    res.render('test', {});
});
app.get('/cardcreator', function(req, res){
    res.render('cardcreator', {});
});
app.listen(8000);

let game = new Game();

//game.newPlayer('asdf', 'fdsa', 1);
//game.searcher();
// Keep track of the chat clients
let clients = [];
//var searchGame = [];
game.resetGameStatus(function () {
    
});
// Обработчик сообщений
function socketServer(socket, data) {

    //console.log(data);
    data = data.toString('utf8').replace(/\0+$/, "");
    //console.log(data);
    try {
        //console.log(data);
        data = JSON.parse(data);
        console.log(data);
        switch (data['messageType']) {
            case 'checkHash':
                game.checkHash(socket, data['hash']);
                break;
            case 'auth':
                game.auth(socket, data['login'], data['password']);
                break;
            case 'unAuth':
                game.unAuth(socket);
                break;
            case 'getCollection':
                game.getCollection(socket);
                break;
            case 'setDeckCards':
                game.setDeckCards(socket, data['deck_num'], data['card_ids']);
                break;
            case 'setDeckName':
                game.setDeckName(socket, data['deck_num'], data['deck_name']);
                break;
            case 'createDeck':
                game.createDeck(socket, data['deck_name'], data['card_ids']);
                break;
            case 'deleteDeck':
                game.deleteDeck(socket, data['deck_num']);
                break;
            case 'deleteAllDecks':
                game.deleteAllDecks(socket);
                break;
            case 'newGame':
                let game_mode = data['game_mode'].split(',');
                switch(game_mode[0]) {
                    case '0':
                        switch(game_mode[1]) {
                            case '0':
                                game.searchGame(socket, false, data['deck_num']);
                                break;
                            case '1':
                                game.searchGame(socket, true, data['deck_num']);
                                break;
                        }
                        break;
                    case '1':
                        switch(game_mode[1]) {
                            case '0':
                                game.gameWithBot(socket, data['deck_num']);
                                break;
                        }
                        break;
                }
                break;
            case 'ready':
                game.startGame(socket);
                break;
            case 'changeStartCards':
                game.changeStartCards(socket, data['card_ids']);
                break;
            case 'useCard':
                game.useCard(socket, data['card_id'], data['discard']);
                break;
            case 'endTurn':
                game.endTurn(socket);
                break;
            /*case 'getAllDecks':
                game.getAllDecks(socket);
                break;
            case 'getDeckCards':
                game.getDeckCards(data['deck_num'], socket);
                break;
            case 'buyPack':
                game.buyPack(data['pack_count'], socket);
                break;*/
        }
    } catch (e) {
        console.log(e);
    }
}

if (isTestClient) {
    const WebSocketServer = require('ws').Server;
    const wss = new WebSocketServer({ port: 5000 });

    wss.on('connection', function connection(socket) {
        //socket.setNoDelay(true);
        // Identify this client
        socket.name = 0;//socket.remoteAddress + ":" + socket.remotePort;
        clients.push(socket);
        console.log('client join');
        // Handle incoming messages from clients.
        socket.on('message', function incoming(data) { // function incoming //message/data
            socketServer(socket, data);
        });
        // Клиент отключился
        socket.on('close', function close() { //close
            clients.splice(clients.indexOf(socket), 1);
            console.log('client left');
        });
    });
} else {
    net.createServer(function (socket) {
        socket.on('error', (err) => {
            console.log(err);
        });

        //socket.setNoDelay(true);
        // Identify this client
        socket.name = 0;//socket.remoteAddress + ":" + socket.remotePort;
        clients.push(socket);
        console.log('client join');

        // Handle incoming messages from clients.
        socket.on('data', function (data) { // function incoming //message/data
            socketServer(socket, data);
        });
        // Клиент отключился
        socket.on('close', function () { //close
            /*if (socket.player) {
                socket.player.clearTimer();
                if (socket.player.getInGame()) {
                    game.endMatch(socket);
                }
            }*/
            if (socket.player) {
                game.players.splice(game.players.indexOf(socket.player), 1);
                if (socket.player.match) {
                    socket.player.match.getOpponent(socket.player.id);
                    game.endMatch(socket, socket.player.match.getOpponent(socket.player.id), function () {

                    });
                }
            }
            socket.player.disconnect(function () {});
            clients.splice(clients.indexOf(socket), 1);
            console.log('client left');
        });
    }).listen(5000);
}

// Put a friendly message on the terminal of the server.
console.log("Chat server running at port 5000\n");

