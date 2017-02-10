/**
 * Created by nikita on 11.11.2016.
 */

const db = require('./db');
const carder = require('./carder');
const Messenger = require('./messenger');

function Match(socket_1, socket_2, gameconf, type = "", callback) {
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