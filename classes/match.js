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
        this.botTimerID = 0;
        this.turnTimerID = 0;
        this.baseTimer = 45000;
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

                self.turnTimerID = setTimeout(function () {
                    self.sendStartStatus();
                }, self.baseTimer);
            });
        });
    };

    sendStartStatus() {
        this.player1.setStartPlayerStatus();
        this.player2.setStartPlayerStatus();

        if (this.player1.turn == true) {
            this.startTurn(this.player1.id, function (result) {

            })
        } else {
            this.startTurn(this.player2.id, function (result) {

            })
        }

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
                self.endTurn(player.id, false, function (result) {
                    callback(result);
                });
            }

            self.sendStatus();

            result = self.isWin();
            if (!result) {
                player.changeCardFromHand(card.id, function () {
                    
                });
            } else {
                callback(result);
            }
        // Если дискард
        } else {
            Messenger.send(player.socket, "useCard", {valid:true});

            self.endTurn(player.id, false, function (result) {
                callback(result);
            });
            self.sendStatus();

            Messenger.send(opponent.socket, 'getCardOpponent', {card_id: card.id, discard: true});

            let result = self.isWin();
            if (!result) {
                player.changeCardFromHand(card.id, function () {
                    
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
            let card = self.getCardFromBotHand();

            if (bot.consumingResByCard(card)) {

                bot.changePlayerStatusByCard(true, card);
                player.changePlayerStatusByCard(false, card);
                self.sendStatus();

                Messenger.send(player.socket, 'getCardOpponent', {card_id: card.id, discard: false});

                let result = self.isWin();
                if (result)
                    callback(result);

                if (card.endturn) {
                    self.endTurn(bot.id, false, function () {
                        
                    });
                }

                self.sendStatus();

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
                self.endTurn(bot.id, false, function () {
                    
                });
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

    getCardFromBotHand() {
        let bot = this.player2;
        let player = this.player1;
        let self = this;

        let availableCards = [];

        // выбираем карты на которые хватает ресурсов
        bot.handCards.forEach(function (card_id, i, arr) {
            if (bot.isEnoughResForCard(cards[card_id])) {
                availableCards.push(cards[card_id]);
            }
        });

        if (availableCards.length > 0) {

            if (availableCards.length == 1)
                return availableCards[0];

            let strategy;

            // выбор защитной или атакующей стратегии
            if ((bot.tower_hp + bot.wall_hp) >= (player.tower_hp + player.wall_hp)) {
                strategy = 0;
            } else {
                strategy = 1;
            }

            let currentCard = false;

            switch (strategy) {
                case 0:
                    availableCards.forEach(function (card, i, arr) {
                        if (currentCard == false) {
                            currentCard = card;
                        } else if (Math.abs(card.enemy_tower_hp) >= Math.abs(currentCard.enemy_tower_hp)) {
                            currentCard = card;
                        }
                    });
                    return currentCard;
                    break;
                case 1:
                    availableCards.forEach(function (card, i, arr) {
                        if (currentCard == false) {
                            currentCard = card;
                        } else if ((card.self_tower_hp + card.self_wall_hp) >= (currentCard.self_tower_hp + currentCard.self_wall_hp)) {
                            currentCard = card;
                        }
                    });
                    return currentCard;
            }
        // Если нет карт, на которые хватает ресурсов
        } else {
            return cards[bot.getRandomCardFromHand()];
        }
    }

    startTurn(player_id, callback) {
        let player;
        let opponent;
        let self = this;

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

        player.setTurn(true);
        opponent.setTurn(false);
        clearTimeout(this.turnTimerID);
        this.turnTimerID = setTimeout(function () {
            self.endTurn(player.id, true, callback);
            self.sendStatus();
        }, self.baseTimer);

        if (self.type == 2 && player_id == 0) {
            self.useCardBot(function (result) {
                callback(result);
            });
        }
    };

    endTurn(player_id, time_is_over, callback) {
        let player;
        let opponent;
        let self = this;

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
            clearTimeout(this.turnTimerID);
            this.turnTimerID = setTimeout(function () {
                self.endTurn(opponent.id, true, callback);
                self.sendStatus();
            }, self.baseTimer);

            if (self.type == 2 && player_id != 0) {
                self.useCardBot(function (result) {
                    callback(result);
                });
            }
        }
    };

    endMatch(player_id, result, callback) {
        let self = this;

        let query = 'UPDATE matches SET match_result ='+result+', match_win_player_id ='+player_id+' WHERE match_id='+self.id;
        db.query(query, function(err, result) {
            if (self.type == 2) {
                clearTimeout(self.botTimerID);
            }
            clearTimeout(self.turnTimerID);
            // TODO: opponent send to win, player send to loose
            self.player1.resetPlayerStatus();
            self.player2.resetPlayerStatus();
            callback();
        });
    }
}

module.exports = Match;