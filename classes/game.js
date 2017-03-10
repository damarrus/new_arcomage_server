/**
 * Created by nikita on 16.11.2016.
 */

    // TODO: static methods
    // TODO: проверки на статус игрока
const async = require('async');
const Match = require('./match');
const Player = require('./player');
const Carder = require('./carder');
const db = require('./db');
const Messenger = require('./messenger');

let gameconf; require('./gameconf_array').then(function (arr) {gameconf = arr;});
let cardsArray; require('./cards_array').then(function (cards) {cardsArray = cards;});

/*let players = [];
let search = [];
let matches = [];*/

class Game {
    constructor() {
        this.players = [];
        this.search = [];
        this.searchRatingTimer = {};
        this.matches = [];

    };

    resetGameStatus(callback) {
        let query = "UPDATE player SET player_online = 0";
        db.query(query, function(err, result) {
            let query = "UPDATE matches SET match_result = 2 WHERE match_result = 0";
            db.query(query, function(err, result) {
                callback();
            });
        });
    }

    cardIDsToArray(card_ids) {
        if (card_ids == '')
            return [];

        return card_ids.split(',').map(Number);
    }

    getPlayerByID(player_id, callback) {
        let self = this;
        self.players.every(function (player, i, arr) {
            if (player.id == player_id) {
                callback(player);
                return false;
            }
        })
    }

    /**
     * Производит авторизацию игрока
     * @param {Socket} socket
     * @param {string} player_login
     * @param {string} player_password
     */
    auth(socket, player_login, player_password) {
        if (socket.player)
            return Messenger.send(socket, "error", {method: "auth", typeError: "alreadyAuth"});

        if (player_login == '' || player_password == '')
            return Messenger.send(socket, "auth", {valid: false});

        let self = this;

        let query = "SELECT player_id, player_online FROM player " +
            "WHERE player_login='"+player_login+"' AND player_password='"+player_password+"' LIMIT 1";
        db.query(query, function(err, result) {
            if (result.length == 0)
                return Messenger.send(socket, "auth", {valid: false});

            if (result[0].player_online == 1) {
                self.getPlayerByID(result[0].player_id, function (player) {
                    Messenger.send(player.socket, "error", {method: "auth", typeError: "anotherPlayerLogin"});
                    player.socket.destroy();
                    player.socket.player = null;
                    player.socket = socket;
                    socket.player = player;
                    player.resetPlayerStatus();
                    return Messenger.send(socket, "auth", {valid: true, player_name: player.name});
                });
            } else {
                let player_id = result[0].player_id;
                let player = new Player(socket);
                player.loadPlayerByID(player_id, function () {
                    socket.player = player;
                    self.players.push(player);
                    return Messenger.send(socket, "auth", {valid: true, player_name: player.name});
                });
            }
        });
    };

    /**
     * Деавторизует игрока.
     * @param {Socket} socket
     * @return
     */
    unAuth(socket) {
        if (!socket.player)
            return Messenger.send(socket, "error", {method: "unAuth", typeError: "notAuth"});

        if (socket.player.inGame)
            return Messenger.send(socket, "error", {method: "unAuth", typeError: "inGame"});

        let player = socket.player;

        if (player.inSearch) {
            this.search.splice(this.search.indexOf(player), 1);
        }

        this.players.splice(this.players.indexOf(player), 1);
        player.disconnect(function () {
            socket.player = null;
            Messenger.send(socket, "unAuth", {valid: true});
        });
};

    /**
     * Проверяет хэш базы данных на клиенте. В случае несовпадения передает актуальную версию базы данных и хэш.
     * @param {Socket} socket
     * @param {int} hash
     */
    checkHash(socket, hash) {
        if (hash != gameconf.gameconf_hash) {
            Messenger.send(socket, "checkHash", {valid:false, hash:hash});
            Messenger.send(socket, "getDatabaseCardsCount", {value:cardsArray.length});
            Messenger.multipleSend(socket, "getDatabaseCards", cardsArray);
            return;
        } else {
            return Messenger.send(socket, "checkHash", {valid:true});
        }
    };

    /**
     * Передает коллекцию игрока.
     * @param {Socket} socket
     */
    getCollection(socket) {
        if (!socket.player)
            return Messenger.send(socket, "error", {method: "getCollection", typeError: "notAuth"});

        let player = socket.player;

        Messenger.send(socket, "getCollectionCardsCount", {value:player.collection.cardsArr.length});
        Messenger.arraySend(socket, "getCollectionCards", player.collection.cardsArr);
        Messenger.send(socket, "getDecksCount", {value:player.collection.decks.length});

        player.collection.decks.forEach(function (deck, i, arr) {
            Messenger.arraySend(socket, "getDeck", deck.cardsArr, deck.getDeckInfo());
        });
    };

    setDeckCards(socket, deck_num, card_ids) {
    if (!socket.player)
        return Messenger.send(socket, "error", {method: "setDeckCards", typeError: "notAuth"});

    let player = socket.player;

    let deck = player.collection.getDeckByNum(deck_num);
    if (!deck)
        return Messenger.send(socket, "error", {method: "setDeckCards", typeError: "serverErrorDeckNumNotEqual"});

    card_ids = this.cardIDsToArray(card_ids);
    deck.setDeckCards(card_ids, function (result) {
        return (result == true) ? Messenger.send(socket, "setDeckCards", {valid:true}) :
            Messenger.send(socket, "error", {method: "setDeckCards", typeError: result});
    });
};

    setDeckName(socket, deck_num, deck_name) {
        if (!socket.player)
            Messenger.send(socket, "error", {method: "setDeckName", typeError: "notAuth"});


        let player = socket.player;

        let deck = player.collection.getDeckByNum(deck_num);
        if (deck)
            Messenger.send(socket, "error", {method: "setDeckName", typeError: "serverErrorDeckNumNotEqual"});

        deck.setDeckName(deck_name, function (result) {
            return (result == true) ? Messenger.send(socket, "setDeckName", {valid:true}) :
                Messenger.send(socket, "error", {method: "setDeckName", typeError: result});
        });
    };

    createDeck(socket, deck_name, card_ids) {
        if (!socket.player)
            Messenger.send(socket, "error", {method: "createDeck", typeError: "notAuth"});

        let player = socket.player;

        card_ids = this.cardIDsToArray(card_ids);
        player.collection.createDeck(deck_name, card_ids, function (result) {
            return (result == true) ? Messenger.send(socket, "createDeck", {valid:true}) :
                Messenger.send(socket, "error", {method: "createDeck", typeError: result});
        });
    };

    deleteDeck(socket, deck_num) {
        if (!socket.player)
            Messenger.send(socket, "error", {method: "createDeck", typeError: "notAuth"});

        let player = socket.player;

        player.collection.deleteDeck(deck_num, function (result) {
            return (result == true) ? Messenger.send(socket, "deleteDeck", {valid:true}) :
                Messenger.send(socket, "error", {method: "deleteDeck", typeError: result});
        });
    };

    deleteAllDecks(socket) {
        if (!socket.player)
            Messenger.send(socket, "error", {method: "createDeck", typeError: "notAuth"});

        let player = socket.player;

        let count = 0;
        player.collection.decks.forEach(function (deck, i, arr) {
            ++count;
            player.collection.deleteDeck(deck.num, function () {});
            if (count == arr.length) Messenger.send(socket, "deleteAllDecks", {valid:true});
        });
    };

    searchGame(socket, rating, deck_num) {
        if (!socket.player)
            return Messenger.send(socket, "error", {method: "searchGame", typeError: "notAuth"});

        let player = socket.player;

        if (!player.collection.getDeckByNum(deck_num).full)
            return Messenger.send(socket, "error", {method: "searchGame", typeError: "deckIsNotFull"});
        if (player.inGame)
            return Messenger.send(socket, "error", {method: "searchGame", typeError: "alreadyInGame"});
        // TODO: сделать нормальную отмену поиска
        if (player.inSearch) {
            this.search.splice(this.search.indexOf(player), 1);
            player.inSearch = false;
            return Messenger.send(socket, "searchGame", {valid:false});
        }

        // Встаём в поиск игры
        if (rating) {

        } else {
            if (!this.search[0]) {
                this.search.push(player);
                player.inSearch = true;
                player.gameDeckNum = deck_num;
                return Messenger.send(socket, "searchGame", {valid: true});
            }
        }


        // Игра найдена
        console.log('игра найдена');
        player.gameDeckNum = deck_num;
        let opponent = this.search[0];
        this.search.splice(this.search.indexOf(opponent), 1);

        /*opponent.opponent = socket;
        socket.opponent = opponent;*/
        opponent.inSearch = false;

        let match = new Match();
        this.matches.push(match);
        match.newMatch(player, opponent, 1, function () {

        });
    };

    /**
     * Поиск противника по рейтингу
     * @param {Player} player
     * @param {Function} callback
     */
    searchRatingOpponent(player, callback) {
        let difference = 20;
        let query = "SELECT player_id, player_rating FROM ratingsearch WHERE " +
            "player_rating > " + (player.rating - 20) + " AND player_rating > " + (player.rating + 20);
        db.query(query, function(err, result) {
            if (result.length != 0) {

            }
        });
    }

    searcher() {
        if (this.searchRatingTimer._repeat != null) {
            return;
        }
        let self = this;
        let timerID = setInterval(function () {
            let query = "SET @result = 0; CALL procedure1(@result); SELECT @result";
            db.query(query, function(err, result) {
                console.log(result);
                if (result.length == 0) {
                    clearInterval(timerID);
                    return;
                }
            });
        }, 1000);
    }



    gameWithBot(socket, deck_num) {
        if (!socket.player)
            return Messenger.send(socket, "error", {method: "gameWithBot", typeError: "notAuth"});

        let player = socket.player;

        if (!player.collection.getDeckByNum(deck_num).full)
            return Messenger.send(socket, "error", {method: "gameWithBot", typeError: "deckIsNotFull"});
        if (player.inGame)
            return Messenger.send(socket, "error", {method: "gameWithBot", typeError: "alreadyInGame"});
        // TODO: сделать нормальную отмену поиска
        if (player.inSearch) {
            this.search.splice(this.search.indexOf(player), 1);
            player.inSearch = false;
        }

        player.gameDeckNum = deck_num;

        let self = this;

        let bot = new Player();
        bot.loadBot(function () {
            let match = new Match();
            self.matches.push(match);
            match.newMatch(player, bot, 2, function () {

            });
        });
    };

    startGame(socket) {
        if (!socket.player)
            return Messenger.send(socket, "error", {method: "searchGame", typeError: "notAuth"});

        let player = socket.player;

        if (!player.inGame)
            return Messenger.send(socket, "error", {method: "startGame", typeError: "notInGame"});

        if (player.ready)
            return Messenger.send(socket, "error", {method: "startGame", typeError: "AllreadyReady"});

        player.ready = true;

        if (player.match.isReadyPlayers()) {
            player.match.sendStartCards();
        }
    };

    changeStartCards(socket, card_ids) {
        if (!socket.player)
            return Messenger.send(socket, "error", {method: "changeStartCards", typeError: "notAuth"});

        let player = socket.player;

        if (!player.inGame)
            return Messenger.send(socket, "error", {method: "changeStartCards", typeError: "notInGame"});

        if (!player.ready)
            return Messenger.send(socket, "error", {method: "changeStartCards", typeError: "notReady"});

        if (!player.match.isReadyPlayers())
            return Messenger.send(socket, "error", {method: "changeStartCards", typeError: "serverErrorOpponentNotReady"});

        card_ids = this.cardIDsToArray(card_ids);
        player.isCardsInHand(card_ids, function (result) {
            if (result == true) {
                Messenger.send(socket, "changeStartCards", {valid:true});
                player.changeStartCards(card_ids, function () {
                    player.changedStartCards = true;
                    if (player.match.isChangedStartCardsPlayers()) {
                        player.match.sendStartStatus();
                    }
                });
            } else {
                return Messenger.send(socket, "error", {method: "changeStartCards", typeError: result});
            }
        });
    };

    useCard(socket, card_id, discard) {
        if (!socket.player)
            return Messenger.send(socket, "error", {method: "useCard", typeError: "notAuth"});

        let player = socket.player;

        if (!player.inGame)
            return Messenger.send(socket, "error", {method: "useCard", typeError: "notInGame"});

        if (!player.turn)
            return Messenger.send(socket, "error", {method: "useCard", typeError: "notYourTurn"});

        let self = this;

        player.match.useCard(player.id, card_id, discard, function (result) {
            if (result == false) {
                return;
            }
            if (!isNaN(parseFloat(result)) && isFinite(result)) {
                console.log('победил игрок ' + result);
                self.endMatch(socket, result, function () {

                });
            } else if (result == 'DRAWerror') {
                Messenger.send(socket, "error", {method: "useCard", typeError: "DRAW!!!!!"});
            } else {
                Messenger.send(socket, "error", {method: "useCard", typeError: result});
            }
        });
    };

    endTurn(socket) {
        if (!socket.player)
            return Messenger.send(socket, "error", {method: "useCard", typeError: "notAuth"});

        let player = socket.player;

        if (!player.inGame)
            return Messenger.send(socket, "error", {method: "useCard", typeError: "notInGame"});

        if (!player.turn)
            return Messenger.send(socket, "error", {method: "useCard", typeError: "notYourTurn"});

        let self = this;

        player.match.endTurn(player.id, false, function (result) {
            if (result == false) {
                return;
            }
            if (!isNaN(parseFloat(result)) && isFinite(result)) {
                console.log('победил игрок ' + result);
                self.endMatch(socket, result, function () {

                });
            } else if (result == 'DRAWerror') {
                Messenger.send(socket, "error", {method: "useCard", typeError: "DRAW!!!!!"});
            } else {
                Messenger.send(socket, "error", {method: "useCard", typeError: result});
            }
        });
    };

    endMatch(socket, player_id, callback) {
        this.matches.splice(this.matches.indexOf(socket.player.match), 1);
        socket.player.match.endMatch(player_id, 1, function () {
            console.log('Матч окончен');
            callback();
        });
    };

    disconnectPlayer() {

    }
}

function old_Game() {

    function addGold(player, callback) {
        var gold = gameconf.gold_take + player.player_gold;
        var query = "UPDATE player SET player_gold = '"+gold+"' WHERE player_id = '"+player.player_id+"'";
        db.query(query, function(err, result) {
            callback();
        });
    }

    this.endTurn = function (socket) {
        if (socket.player.getInGame()) {
            if (socket.player.getParam('turn')) {
                matches[socket.matchID].endTurn(socket.player.getParam('player_id'), false, function (result) {
                    if (result == 1 || result == 2 || result == 3) {
                        console.log('победил игрок ' + result);
                        matches[socket.matchID].endMatch(result, function () {
                            matches.splice(socket.matchID, 1);
                        });
                    }
                });
            } else {
                messenger.send(socket, "error", {
                    method: "useCard",
                    typeError: "notYourTurn"
                });
            }
        } else {
            messenger.send(socket, "error", {
                method: "useCard",
                typeError: "notInGame"
            });
        }
    };

    this.buyPack = function (pack_count, socket) {
        if (socket.player) {
            socket.player.buyPack(pack_count, function (result) {
                if (result == true) {

                } else {
                    messenger.send(socket, "error", {
                        method: "buyPack",
                        typeError: result
                    });
                }
            });
        } else {
            messenger.send(socket, "error", {
                method: "setDeck",
                typeError: "notAuth"
            });
        }
    };
}

module.exports = Game;