/**
 * Created by nikita on 11.11.2016.
 */

const db = require('./db');
const carder = require('./carder');
const Messenger = require('./messenger');
let cards; require('./cards').then(function (card_objs) {cards = card_objs;});
let gameconf; require('./gameconf_array').then(function (arr) {gameconf = arr;});

class Match {
    constructor() {
        this.id = 0;
        this.type = 0;
        /** @type {Player} */
        this.player1 = {};
        /** @type {Player} */
        this.player2 = {};
        this.botTimer = 0;
    }

    newMatch(player1, player2, type, callback) {
        let self = this;

        this.type = type;
        this.player1 = player1;
        this.player2 = player2;

        let query = 'INSERT INTO matches (match_type) VALUES ('+ self.type +')';
        db.query(query, function(err, result) {
            console.log(result);
            console.log(err);
            self.id = result.insertId;

            query = 'INSERT INTO playermatch (match_id, player_id) VALUES ('+ self.id +', '+ self.player1.id +')';
            if (self.player2.id != 0) {
                query += ',('+ self.id +', '+ self.player2.id +')';
            }
            db.query(query, function(err, result) {
                self.player1.match = self;
                self.player2.match = self;

                self.player1.inSearch = false;
                self.player2.inSearch = false;

                self.player1.inGame = true;
                self.player2.inGame = true;

                self.setTurnRandom();

                Messenger.send(self.player1.socket, "gameStart", {opponent_name: self.player2.name, opponent_deck_type: 1});
                Messenger.send(self.player2.socket, "gameStart", {opponent_name: self.player1.name, opponent_deck_type: 1});
                callback();
            });
        });
    }

    // TODO: заглушка
    setTurnRandom() {
        this.player1.turn = true;
        this.player2.turn = false;
    }

    isReadyPlayers() {
        return (this.player1.ready && this.player2.ready);
    }

    isChangedStartCardsPlayers() {
        return (this.player1.changedStartCards && this.player2.changedStartCards);
    }

    sendStartCards() {
        let self = this;
        self.player1.setGameDeck(function () {
            self.player2.setGameDeck(function () {
                Messenger.send(self.player1.socket, "startStatus", {turn: self.player1.turn});
                Messenger.send(self.player2.socket, "startStatus", {turn: self.player2.turn});
                //sendStatus();
                self.player1.setStartCardsToHand();
                self.player2.setStartCardsToHand();
            });
        });
    };

    sendStartStatus() {
        this.player1.setStartPlayerStatus();
        this.player2.setStartPlayerStatus();
        this.sendStatus();
    };

    sendStatus() {
        Messenger.send(this.player1.socket, "playerStatus", this.player1.getPlayerStatus());
        Messenger.send(this.player1.socket, "opponentStatus", this.player2.getPlayerStatus());
        Messenger.send(this.player2.socket, "playerStatus", this.player2.getPlayerStatus());
        Messenger.send(this.player2.socket, "opponentStatus", this.player1.getPlayerStatus());
    }

    getOpponent(player_id) {
        if (player_id == this.player1.id) {
            return this.player2;
        } else if (player_id == this.player2.id) {
            return this.player1;
        } else {
            return false;
        }
    }

    getPlayer(player_id) {
        if (player_id == this.player1.id) {
            return this.player1;
        } else if (player_id == this.player2.id) {
            return this.player2;
        } else {
            return false;
        }
    }

    isWin() {
        if (this.player1.tower_hp <= 0 || this.player2.tower_hp >= gameconf.tower_hp_win) {
            if (this.player2.tower_hp <= 0 || this.player1.tower_hp >= gameconf.tower_hp_win) {
                return 'DRAWerror';
            } else {
                return this.player2.id;
            }
        } else if (this.player2.tower_hp <= 0 || this.player1.tower_hp >= gameconf.tower_hp_win) {
            return this.player1.id;
        } else {
            return false;
        }
    }

    useCard(player_id, card_id, discard, callback) {
        let self = this;

        let player;
        let opponent;
        if (player_id == this.player1.id) {
            player = this.player1;
            opponent = this.player2;
        } else if (player_id == this.player2.id) {
            player = this.player2;
            opponent = this.player1;
        } else {
            return false;
        }

        let card = cards[card_id];

        if (!discard) {
            if (!player.consumingResByCard(card)) {
                callback('notEnoughRes');
                return;
            }

            Messenger.send(player.socket, "useCard", {valid:true});

            player.changePlayerStatusByCard(true, card);
            opponent.changePlayerStatusByCard(false, card);
            self.sendStatus();

            Messenger.send(opponent.socket, 'getCardOpponent', {card_id: card.id, discard: false});

            let result = self.isWin();
            if (result) {
                callback(result);
                return;
            }

            if (card.endturn) {
                self.endTurn(player.id, false);
                self.sendStatus();
            }

            result = self.isWin();
            if (!result) {
                player.changeCardFromHand(card.id, function () {
                    if (self.type == 2 && card.endturn) {
                        self.useCardBot(function (result) {
                            callback(result);
                        });
                    }
                });
            } else {
                callback(result);
            }
        // Если дискард
        } else {
            Messenger.send(player.socket, "useCard", {valid:true});

            self.endTurn(player.id, false);
            self.sendStatus();

            Messenger.send(opponent.socket, 'getCardOpponent', {card_id: card.id, discard: true});

            let result = self.isWin();
            if (!result) {
                player.changeCardFromHand(card.id, function () {
                    if (self.type == 2) {
                        self.useCardBot(function (result) {
                            callback(result);
                        });
                    }
                });
            } else {
                callback(result);
            }
        }
    };

    useCardBot(callback) {
        let self = this;

        let player = self.player1;
        let bot = self.player2;

        self.botTimerID = setTimeout(function () {
            let card = cards[bot.getRandomCardFromHand()];

            if (bot.consumingResByCard(card)) {

                bot.changePlayerStatusByCard(true, card);
                player.changePlayerStatusByCard(false, card);
                self.sendStatus();

                Messenger.send(player.socket, 'getCardOpponent', {card_id: card.id, discard: false});

                let result = self.isWin();
                if (result)
                    callback(result);

                if (card.endturn) {
                    self.endTurn(bot.id, false);
                    self.sendStatus();
                }

                result = self.isWin();
                if (!result) {
                    bot.changeCardFromHand(card.id, function () {
                        if (!card.endturn) {
                            self.useCardBot(callback);
                        } else {
                            callback(result);
                        }
                    });
                } else {
                    callback(result);
                }
            } else {
                self.endTurn(bot.id, false);
                self.sendStatus();

                Messenger.send(player.socket, 'getCardOpponent', {card_id: card.id, discard: true});

                let result = self.isWin();
                if (!result) {
                    bot.changeCardFromHand(card.id, function () {

                    });
                } else {
                    callback(result);
                }
            }
        }, 2000);
    }

    endTurn(player_id, time_is_over) {
        let player;
        let opponent;

        if (player_id == this.player1.id) {
            player = this.player1;
            opponent = this.player2;
        } else if (player_id == this.player2.id) {
            player = this.player2;
            opponent = this.player1;
        } else {
            return false;
        }

        if (player_id == 0) {

        }

        if (player.turn) {
            Messenger.send(player.socket, "endTurn", {valid:true});
            player.setTurn(false);
            opponent.setTurn(true);
        }
    };

    endMatch(player_id, result, callback) {
        let self = this;

        let query = 'UPDATE matches SET match_result ='+result+', match_win_player_id ='+player_id+' WHERE match_id='+self.id;
        db.query(query, function(err, result) {
            if (self.type == 2) {
                clearTimeout(self.botTimerID);
            }
            // TODO: opponent send to win, player send to loose
            self.player1.resetPlayerStatus();
            self.player2.resetPlayerStatus();
            callback();
        });
    }
}

function old_Match(socket_1, socket_2, gameconf, type = "", callback) {
    var self = this;
    var messenger = new Messenger();
    var matchID = 0;
    var player_1_id = socket_1.player.getParam('player_id');
    var player_2_id = socket_2.player.getParam('player_id');
    var query = 'INSERT INTO matches (match_player1_id, match_player2_id, match_result) VALUES ('+
        player_1_id +','+
        player_2_id +',0)';
    db.query(query, function(err, result) {
        matchID = result.insertId;
        socket_1.matchID = matchID;
        socket_2.matchID = matchID;
        callback(self, matchID);
    });
    if (type == "gameWithBot") {
        var botTimerID;
    }

    socket_1.player.setMatch(this);
    socket_2.player.setMatch(this);

    socket_1.player.setInSearch(false);
    socket_2.player.setInSearch(false);

    socket_1.player.setInGame(true);
    socket_2.player.setInGame(true);

    messenger.send(socket_1, "gameStart", {opponent_name: socket_2.player.player_name, opponent_deck_type: 1});
    if (type != "gameWithBot") {
        messenger.send(socket_2, "gameStart", {opponent_name: socket_1.player.player_name, opponent_deck_type: 1});
    }

    this.getMatchID = function () {
        return matchID;
    };

    this.sendStartCards = function () {
        messenger.send(socket_1, "startStatus", {turn: true});
        if (type != "gameWithBot") {
            messenger.send(socket_2, "startStatus", {turn: false});
        }
        //sendStatus();
        socket_1.player.setCardsToDeck();
        socket_2.player.setCardsToDeck();
    };

    this.sendStartStatus = function () {
        socket_1.player.setPlayerStatus(true, gameconf.tower_hp, gameconf.wall_hp, gameconf.res, gameconf.res, gameconf.res, gameconf.gen, gameconf.gen, gameconf.gen);
        socket_2.player.setPlayerStatus(false, gameconf.tower_hp, gameconf.wall_hp, gameconf.res, gameconf.res, gameconf.res, gameconf.gen, gameconf.gen, gameconf.gen);
        sendStatus();
    };

    function sendStatus() {
        messenger.send(socket_1, "playerStatus", socket_1.player.getPlayerStatus());
        messenger.send(socket_1, "opponentStatus", socket_2.player.getPlayerStatus());
        if (type != "gameWithBot") {
            messenger.send(socket_2, "playerStatus", socket_2.player.getPlayerStatus());
            messenger.send(socket_2, "opponentStatus", socket_1.player.getPlayerStatus());
        }
    }

    this.readyPlayer = function (player_id) {
        if (player_id == player_1_id) {
            socket_1.player.setReady(true);
        } else if (player_id == player_2_id) {
            socket_2.player.setReady(true);
        }
    };

    this.changeReadyPlayer = function (player_id) {
        if (player_id == player_1_id) {
            socket_1.player.setChangeReady(true);
        } else if (player_id == player_2_id) {
            socket_2.player.setChangeReady(true);
        }
    };

    this.getReadyPlayer = function () {
        return (socket_1.player.getReady() && socket_2.player.getReady());
    };

    this.getChangeReadyPlayer = function () {
        return (socket_1.player.getChangeReady() && socket_2.player.getChangeReady());
    };
    
    function isWin(callback) {
        if (socket_1.player.getParam('tower_hp') <= 0 || socket_2.player.getParam('tower_hp') >= gameconf.tower_hp_win) {
            if (socket_2.player.getParam('tower_hp') <= 0 || socket_1.player.getParam('tower_hp') >= gameconf.tower_hp_win) {
                callback(-1);
            } else {
                callback(socket_2.player.player_id);
            }
        } else if (socket_2.player.getParam('tower_hp') <= 0 || socket_1.player.getParam('tower_hp') >= gameconf.tower_hp_win) {
            callback(socket_1.player.player_id);
        } else {
            callback(false);
        }
    }

    this.endTurn = function (player_id, time_is_over, callback) {
        var self;
        var enemy;
        if (player_id == player_1_id) {
            self = socket_1;
            enemy = socket_2;
        } else if (player_id == player_2_id) {
            self = socket_2;
            enemy = socket_1;
        }
        if (self.player.getParam('turn')) {
            if (!time_is_over) {
                messenger.send(self, "endTurn", {valid:true});
            }
            self.player.changePlayerStatus(false,0,0,0,0,0,0,0,0,0, function () {
                enemy.player.changePlayerStatus(true,0,0,0,0,0,0,0,0,0, function () {
                    enemy.player.growthRes(false, function () {
                        sendStatus();
                        isWin(function (result) {
                            if (!result) {
                                if (type == "gameWithBot") {
                                    useCardBot(function (result) {
                                        callback(result);
                                    });
                                }
                            } else {
                                callback(result);
                            }
                        });
                    });
                });
            });
        }
    };

    this.useCard = function(player_id, card_id, discard, callback) {
        var self;
        var enemy;
        if (player_id == player_1_id) {
            self = socket_1;
            enemy = socket_2;
        } else if (player_id == player_2_id) {
            self = socket_2;
            enemy = socket_1;
        }
        carder.getCardByID(card_id, function (card) {
            if (!discard) {
                card.card_endturn = (card.card_endturn != 0);
                self.player.costCard(card, function (result) {
                    if (result) {
                        messenger.send(self, "useCard", {valid:true});
                        self.player.changePlayerStatus(card.card_endturn, card.card_self_tower_hp, card.card_self_wall_hp, card.card_self_hp,
                            card.card_self_res1, card.card_self_res2, card.card_self_res3,
                            card.card_self_gen1, card.card_self_gen2, card.card_self_gen3,
                        function () {
                            enemy.player.changePlayerStatus(!card.card_endturn, card.card_enemy_tower_hp, card.card_enemy_wall_hp, card.card_enemy_hp,
                                card.card_enemy_res1, card.card_enemy_res2, card.card_enemy_res3,
                                card.card_enemy_gen1, card.card_enemy_gen2, card.card_enemy_gen3,
                            function () {
                                sendStatus();
                                if (type != "gameWithBot") {
                                    messenger.send(enemy, 'getCardOpponent', {
                                        card_id: card.card_id,
                                        discard: false
                                    });
                                }
                                isWin(function (result) {
                                    if (!result) {
                                        enemy.player.growthRes(card.card_endturn, function () {
                                            sendStatus();
                                            isWin(function (result) {
                                                if (!result) {
                                                    self.player.changeCardFromHand(card_id, function () {

                                                    });
                                                    if (type == "gameWithBot") {
                                                        if (!card.card_endturn) {
                                                            useCardBot(function (result) {
                                                                callback(result);
                                                            });
                                                        }
                                                    }
                                                } else {
                                                    callback(result);
                                                }
                                            });
                                        });
                                    } else {
                                        callback(result);
                                    }
                                });

                            });
                        });
                    } else {
                        callback('error');
                    }
                });
            } else {
                messenger.send(self, "useCard", {valid:true});
                self.player.changePlayerStatus(false,0,0,0,0,0,0,0,0,0, function () {
                    enemy.player.changePlayerStatus(true,0,0,0,0,0,0,0,0,0, function () {
                        enemy.player.growthRes(false, function () {
                            if (type != "gameWithBot") {
                                messenger.send(enemy, 'getCardOpponent', {
                                    card_id: card.card_id,
                                    discard: true
                                });
                            }
                            sendStatus();
                            isWin(function (result) {
                                if (!result) {
                                    self.player.changeCardFromHand(card_id, function () {

                                    });
                                    if (type == "gameWithBot") {
                                        useCardBot(function (result) {
                                            callback(result);
                                        });
                                    }
                                } else {
                                    callback(result);
                                }
                            });
                        });
                    });
                });
            }
        });
    };
    
    function useCardBot(callback) {
        botTimerID = setTimeout(function () {
            var card_id = socket_2.player.getRandomCardFromHand();
            carder.getCardByID(card_id, function (card) {
                socket_2.player.costCard(card, function (result) {
                    if (result) {
                        card.card_endturn = (card.card_endturn != 0);
                        socket_2.player.changePlayerStatus(card.card_endturn, card.card_self_tower_hp, card.card_self_wall_hp, card.card_self_hp,
                            card.card_self_res1, card.card_self_res2, card.card_self_res3,
                            card.card_self_gen1, card.card_self_gen2, card.card_self_gen3,
                        function () {
                            socket_1.player.changePlayerStatus(!card.card_endturn, card.card_enemy_tower_hp, card.card_enemy_wall_hp, card.card_enemy_hp,
                                card.card_enemy_res1, card.card_enemy_res2, card.card_enemy_res3,
                                card.card_enemy_gen1, card.card_enemy_gen2, card.card_enemy_gen3,
                            function () {
                                sendStatus();
                                isWin(function (result) {
                                    if (!result) {
                                        socket_1.player.growthRes(card.card_endturn, function () {
                                            messenger.send(socket_1, 'getCardOpponent', {
                                                card_id: card.card_id,
                                                discard: false
                                            });
                                            sendStatus();
                                            isWin(function (result) {
                                                if (result) {
                                                    callback(result);
                                                } else {
                                                    socket_2.player.changeCardFromHand(card_id, function () {
                                                        if (card.card_endturn) {
                                                            useCardBot(callback);
                                                        } else {
                                                            callback(result);
                                                        }
                                                    });
                                                }
                                            });
                                        });
                                    } else {
                                        callback(result);
                                    }
                                });
                            });
                        });
                    } else {
                        socket_2.player.changePlayerStatus(false,0,0,0,0,0,0,0,0,0, function () {
                            socket_1.player.changePlayerStatus(true,0,0,0,0,0,0,0,0,0, function () {
                                socket_1.player.growthRes(false, function () {
                                    socket_2.player.changeCardFromHand(card_id, function () {
                                        messenger.send(socket_1, 'getCardOpponent', {
                                            card_id: card.card_id,
                                            discard: true
                                        });
                                        sendStatus();
                                    });
                                });
                            });
                        });
                    }
                });
            });
        }, 2000);
    }

    this.endMatch = function (result, callback) {
        var query = 'UPDATE matches SET match_result ='+result+' WHERE match_id='+matchID;
        db.query(query, function(err, result) {
            if (type == "gameWithBot") {
                clearTimeout(botTimerID);
            }
            socket_1.player.clearTimer();
            socket_2.player.clearTimer();
            socket_1.player.setInGame(false);
            socket_2.player.setInGame(false);
            socket_1.player.setReady(false);
            socket_2.player.setReady(false);
            socket_1.player.resetPlayerStatus();
            socket_2.player.resetPlayerStatus();
            callback();
        });
    }
}

module.exports = Match;