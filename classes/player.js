/**
 * Created by nikita on 11.11.2016.
 */

const Collection = require('./collection');
const carder = require('./carder');
const Messenger = require('./messenger');
const db = require('./db');
let gameconf; require('./gameconf_array').then(function (arr) {gameconf = arr;});

class Player {
    constructor(socket = false) {
        this.id = 0;
        this.name = '';
        this.login = '';
        this.gold = 0;
        this.rating = 0;
        this.socket = socket;
        this.collection = {};
        this.inGame = false;
        this.inSearch = false;
        this.ready = false;

        this.match = false;
        this.gameDeckNum = 0;
        this.changedStartCards = false;
        this.turn = false;
        this.deckCards = [];
        this.handCards = [];
        this.discardPileCards = [];

        this.tower_hp = 0;
        this.wall_hp = 0;
        this.res1 = 0;
        this.res2 = 0;
        this.res3 = 0;
        this.gen1 = 0;
        this.gen2 = 0;
        this.gen3 = 0;
    }

    loadPlayerByID(id, callback) {
        let self = this;
        let query = 'SELECT * FROM player WHERE player_id='+id+' LIMIT 1';
        db.query(query, function(err, result) {
            if (err == null) {

                self.id = result[0]['player_id'];
                self.name = result[0]['player_name'];
                self.login = result[0]['player_login'];
                self.gold = result[0]['player_rating'];
                self.rating = result[0]['player_rating'];

                if (result[0]['player_online'] == 0) {
                    let query = "UPDATE player SET player_online = 1 WHERE player_id = '"+self.id+"'";
                    db.query(query, function(err, result) {
                        self.collection = new Collection(self.id, callback);
                    });
                } else {
                    self.collection = new Collection(self.id, callback);
                }
            } else {
                console.error('Ошибка базы данных. Метод loadPlayerByID');
            }
        });
    };

    loadBot(callback) {
        this.name = 'bot';
        this.login = 'bot_login';
        this.ready = true;
        this.changedStartCards = true;
        this.gameDeckNum = 1;
        this.deckCards = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20];
        callback();
    }

    setGameDeck(callback) {
        // проверка на бота
        if (this.id != 0) {
            let self = this;
            let deck = this.collection.getDeckByNum(this.gameDeckNum);
            let count = 0;
            deck.cardsArr.forEach(function (card_id, i, arr) {
                ++count;
                self.deckCards.push(card_id);
                if (count == arr.length)
                    callback(true);
            });
        } else {
            callback(true);
        }
    }

    setStartCardsToHand(callback = function() {}) {
        let self = this;
        this.handCards = [0,0,0,0,0,0];
        let count = 0;
        this.handCards.forEach(function (item, i, arr) {
            self.handCards.splice(0,1);
            self.setRandomCardFromDeckToHand(function () {
                ++count;
                if (count == arr.length)
                    callback(true);
            });

        });
    }

    setRandomCardFromDeckToHand(callback) {
        let i = Math.floor(Math.random() * this.deckCards.length);
        this.handCards.push(this.deckCards[i]);
        Messenger.send(this.socket, "getCardRandom", {card_id: this.deckCards[i]});
        this.deckCards.splice(i,1);
        if (this.deckCards.length == 0) {
            this.reshuffleDiscardPile(function (result) {
                callback();
            });
        } else {
            callback();
        }
    }

    setCardFromHandToDeck(card_id) {
        this.handCards.splice(this.handCards.indexOf(card_id),1);
        this.deckCards.push(card_id);
    }

    getRandomCardFromHand() {
        return this.handCards[Math.floor(Math.random() * this.handCards.length)];
    };

    reshuffleDiscardPile(callback) {
        let self = this;

        if (self.deckCards.length == 0) {
            let count = 0;
            self.discardPileCards.forEach(function (item, i, arr) {
                ++count;
                self.deckCards.push(item);
                if (count == self.discardPileCards.length) {
                    self.discardPileCards = [];
                    callback(true);
                }
            });
        } else {
            callback(false);
        }
    }

    /**
     * @param {Array} card_ids
     * @param callback
     */
    isCardsInHand(card_ids, callback) {
        if (card_ids.length == 0) {
            callback(true);
            return;
        }

        let result = true;
        let count = 0;
        card_ids.forEach(function (card_id, i, arr) {
            ++count;
            if (this.handCards.indexOf(card_id) == -1) result = 'cardsNotFoundInHand';
            if (count >= arr.length) callback(result);
        }, this);
    }

    changeStartCards(card_ids, callback) {
        if (card_ids.length == 0) {
            callback(true);
            return;
        }
        let self = this;

        let count = 0;
        card_ids.forEach(function (card_id, i, arr) {
            self.setRandomCardFromDeckToHand(function () {
                ++count;
                if (count == card_ids.length) {
                    count = 0;
                    card_ids.forEach(function (card_id, i, arr) {
                        ++count;
                        self.setCardFromHandToDeck(card_id);
                        if (count == card_ids.length) {
                            callback(true);
                        }
                    });
                }
            });
        });
    };

    changeCardFromHand(card_id, callback) {
        let self = this;

        let count = 0;
        self.handCards.forEach(function (item, i, arr) {
            if (count == 0 && item == card_id) {
                ++count;
                self.discardPileCards.push(item);
                self.handCards.splice(i,1);
                self.setRandomCardFromDeckToHand(callback);
            }
        });
    };

    setStartPlayerStatus() {
        this.tower_hp = gameconf.tower_hp;
        this.wall_hp = gameconf.wall_hp;
        this.res1 = gameconf.res;
        this.res2 = gameconf.res;
        this.res3 = gameconf.res;
        this.gen1 = gameconf.gen;
        this.gen2 = gameconf.gen;
        this.gen3 = gameconf.gen;
    }

    // TODO: сделать проверку на победу
    changePlayerStatusByCard(owner, card) {
        this.tower_hp += (owner) ? card.self_tower_hp : card.enemy_tower_hp;
        this.wall_hp += (owner) ? card.self_wall_hp : card.enemy_wall_hp;
        if (this.wall_hp < 0) {
            this.wall_hp = 0;
        }
        this.wall_hp += (owner) ? card.self_hp : card.enemy_hp;
        if (this.wall_hp < 0) {
            this.tower_hp += this.wall_hp;
            this.wall_hp = 0;
        }

        let res1 = (owner) ? card.self_res1 : card.enemy_res1;
        let res2 = (owner) ? card.self_res2 : card.enemy_res2;
        let res3 = (owner) ? card.self_res3 : card.enemy_res3;

        let gen1 = (owner) ? card.self_gen1 : card.enemy_gen1;
        let gen2 = (owner) ? card.self_gen2 : card.enemy_gen2;
        let gen3 = (owner) ? card.self_gen3 : card.enemy_gen3;

        let gen1_equally = (owner) ? card.self_gen1_equally : card.enemy_gen1_equally;
        let gen2_equally = (owner) ? card.self_gen2_equally : card.enemy_gen2_equally;
        let gen3_equally = (owner) ? card.self_gen3_equally : card.enemy_gen3_equally;

        this.res1 = ((this.res1 + res1) >= 0) ? (((this.res1 + res1) <= gameconf.res_max) ? (this.res1 + res1) : gameconf.res_max) : 0;
        this.res2 = ((this.res2 + res2) >= 0) ? (((this.res1 + res2) <= gameconf.res_max) ? (this.res2 + res2) : gameconf.res_max) : 0;
        this.res3 = ((this.res3 + res3) >= 0) ? (((this.res1 + res3) <= gameconf.res_max) ? (this.res3 + res3) : gameconf.res_max) : 0;

        this.gen1 = ((this.gen1 + gen1) >= 1) ? (this.gen1 + gen1) : 1;
        this.gen2 = ((this.gen2 + gen2) >= 1) ? (this.gen2 + gen2) : 1;
        this.gen3 = ((this.gen3 + gen3) >= 1) ? (this.gen3 + gen3) : 1;

        this.gen1 = (gen1_equally > 0) ? gen1_equally : this.gen1;
        this.gen2 = (gen2_equally > 0) ? gen2_equally : this.gen2;
        this.gen3 = (gen3_equally > 0) ? gen3_equally : this.gen3;

        return true;
    }

    getPlayerStatus() {
        return {
            turn: this.turn,
            tower_hp: this.tower_hp,
            wall_hp: this.wall_hp,
            res1: this.res1,
            res2: this.res2,
            res3: this.res3,
            gen1: this.gen1,
            gen2: this.gen2,
            gen3: this.gen3
        }
    }

    growthRes() {
        this.res1 = ((this.res1 + this.gen1) <= gameconf.res_max) ? (this.res1 + this.gen1) : gameconf.res_max;
        this.res2 = ((this.res1 + this.gen2) <= gameconf.res_max) ? (this.res2 + this.gen2) : gameconf.res_max;
        this.res3 = ((this.res1 + this.gen3) <= gameconf.res_max) ? (this.res3 + this.gen3) : gameconf.res_max;
    };

    consumingResByCard(card) {
        if (this.isEnoughResForCard(card)) {
            return false;
        } else {
            this.res1 -= card.res1;
            this.res2 -= card.res2;
            this.res3 -= card.res3;
            return true;
        }
    }

    isEnoughResForCard(card) {
        return (this.res1 - card.res1 < 0 || this.res2 - card.res2 < 0 || this.res3 - card.res3 < 0);
    }

    setTurn(value) {
        let self = this;

        if (value) {
            this.turn = true;
            this.growthRes();
        } else {
            this.turn = false;
        }
    }

    resetPlayerStatus() {
        this.inGame = false;
        this.ready = false;
        this.match = null;
        this.match = false;
        this.gameDeckNum = 0;
        this.changedStartCards = false;
        this.turn = false;
        this.deckCards = [];
        this.handCards = [];
        this.discardPileCards = [];

        this.tower_hp = 0;
        this.wall_hp = 0;
        this.res1 = 0;
        this.res2 = 0;
        this.res3 = 0;
        this.gen1 = 0;
        this.gen2 = 0;
        this.gen3 = 0;
    }

    disconnect(callback) {
        let self = this;

        let query = "UPDATE player SET player_online = 0 WHERE player_id = '"+self.id+"'";
        db.query(query, function(err, result) {
            if (err == null) {
                callback();
            } else {
                console.error('Ошибка базы данных. Метод disconnect');
            }
        });
    }
}

function old_Player(info = {}, socket = false, callback = function () {}) {
    // Основные параметры игрока
    callback();
    var messenger = new Messenger();
    var self = this,
        inSearch = false,
        inGame = false,
        ready = false,
        changeReady = false,
        //collection_obj = false,
        //collection = false,
        deck_num = false,
        timerID,
        player_id = info.player_id || 0,
        player_name = info.player_name || 'bot_name',
        player_login = info.player_login || 'bot_login',
        player_gold = info.player_gold || -100;
    // Параметры игрока в игре
    var turn, tower_hp, wall_hp, res1, res2, res3, gen1, gen2, gen3;
    var deckCards = [];
    var handCards = [];
    var discardPileCards = [];
    var match;

    this.player_id = info.player_id || 0;
    this.player_name = info.player_name || 'bot_name';

    if (!socket) {
        ready = true;
        changeReady = true;
    }

    this.setMatch = function (match_obj) {
        match = match_obj;
    };

    this.setDeckNum = function (new_deck_num, callback) {
        this.collection.getDeckByNum(new_deck_num, function (deck) {
            if (deck.isDeckFull()) {
                deck_num = new_deck_num;
                callback(true);
            } else {
                callback(false);
            }
        });
    };

    this.collection = new Collection(player_id, function () {
        //callback();
    });

    this.setCardsToDeck = function (callback = function () {}) {
        setCardsToDeck(function () {
            setStartCardsToHand(function () {
                callback();
            });
        });

    };

    function setCardsToDeck(callback) {
        deckCards = [];
        handCards = [];
        discardPileCards = [];
        self.collection.getDeckByNum(deck_num, function (deck) {
            deck.getDeckCardsID(function (cards) {
                var count = 0;
                cards.forEach(function (item, i, arr) {
                    ++count;
                    deckCards.push(item);
                    if (count == cards.length) {
                        callback(true);
                    }
                });
            })
        });
    }

    function setStartCardsToHand (callback, count = 0) {
        if (count == 6) {
            callback();
        } else {
            setRandomCardFromDeckToHand(function () {
                ++count;
                setStartCardsToHand(callback, count);
            });
        }
    }

    function setRandomCardFromDeckToHand(callback = function () {}) {
        var i = Math.floor(Math.random() * deckCards.length);
        handCards.push(deckCards[i]);
        if (player_id != 0) {messenger.send(socket, "getCardRandom", {card_id: deckCards[i]});}
        if (deckCards.length == 1) {
            deckCards.splice(i,1);
            reshuffleDiscardPile(function () {
                callback();
            });
        } else {
            deckCards.splice(i,1);
            callback();
        }
    }

    function reshuffleDiscardPile(callback) {
        var count = 0;
        deckCards = [];
        discardPileCards.forEach(function (item, i, arr) {
            ++count;
            deckCards.push(item);
            if (count == discardPileCards.length) {
                discardPileCards = [];
                callback(true);
            }
        });
    }

    this.changeStartCards = function (card_ids, callback) {
        if (1 == 1) {
            if (card_ids != '') {
                var count = 0;
                card_ids = card_ids.split(',');
                card_ids.forEach(function (item, i, arr) {
                    ++count;
                    setRandomCardFromDeckToHand();
                    if (count == card_ids.length) {
                        count = 0;
                        card_ids.forEach(function (card_id, i, arr) {
                            ++count;
                            setCardFromHandToDeck(card_id, function () {
                                if (count == card_ids.length) {
                                    callback();
                                }
                            });
                        });
                    }
                });
            } else {
                callback();
            }
        }
    };

    function setCardFromHandToDeck(card_id, callback) {
        handCards.forEach(function (item, i, arr) {
            if (item == card_id) {
                deckCards.push(item);
                handCards.splice(i, 1);
                callback();
            }
        });
    }

    this.changeCardFromHand = function (card_id, callback) {
        var count = 0;
        handCards.forEach(function (item, i, arr) {
            if (count == 0 && item == card_id) {
                ++count;
                discardPileCards.push(item);
                handCards.splice(i,1);
                setRandomCardFromDeckToHand(function () {
                    callback();
                });
            }
        });
    };

    this.getRandomCardFromHand = function () {
        return handCards[Math.floor(Math.random() * handCards.length)];
    };

    this.getCollectionCardsID = function (callback) {
        this.loadCollection(function () {
            callback(collection.getCollectionCardsID());
        });
    };
    this.getCollectionCards = function (callback) {
        this.getCollectionCardsID(function (cards) {

        });
    };
    this.getDeckCards = function (deck_num, callback) {
        collection.getDeckCards(deck_num, function (cards) {
            carder.getCardByMultipleID(cards, function (result) {
                callback(result);
            });
        });
    };
    this.setDeckCards = function (deck_num, cards, callback) {
        collection.setDeckCards(deck_num, cards, function () {
            callback();
        });
    };

    this.getPlayerStatus = function () {
        return {
            turn: turn,
            tower_hp: tower_hp,
            wall_hp: wall_hp,
            res1: res1,
            res2: res2,
            res3: res3,
            gen1: gen1,
            gen2: gen2,
            gen3: gen3
        }
    };

    this.setPlayerStatus = function (turn_val, tower_hp_val, wall_hp_val,
                                     res1_val, res2_val, res3_val,
                                     gen1_val, gen2_val, gen3_val) {
        // Запускаем таймер хода
        clearTimeout(timerID);
        if (turn_val) {
            timerID = setTimeout(function () {
                match.endTurn(player_id, true, function () {});
            }, 45000);
        }
        turn = turn_val;
        tower_hp = tower_hp_val;
        wall_hp = wall_hp_val;
        res1 = res1_val;
        res2 = res2_val;
        res3 = res3_val;
        gen1 = gen1_val;
        gen2 = gen2_val;
        gen3 = gen3_val;
        if (turn_val) this.growthRes(false, function () {});

    };
    this.resetPlayerStatus = function () {
        turn = 0;
        tower_hp = 0;
        wall_hp = 0;
        res1 = 0;
        res2 = 0;
        res3 = 0;
        gen1 = 0;
        gen2 = 0;
        gen3 = 0;
        deckCards = [];
        handCards = [];
        discardPileCards = [];
        ready = false;
        changeReady = false;
    };
    this.changePlayerStatus = function (turn_val = turn, tower_hp_val = 0, wall_hp_val = 0, hp_val = 0,
                                        res1_val = 0, res2_val = 0, res3_val = 0,
                                        gen1_val = 0 , gen2_val = 0, gen3_val = 0, callback) {
        // Запускаем таймер хода
        clearTimeout(timerID);
        if (turn_val) {
            timerID = setTimeout(function () {
                match.endTurn(player_id, true, function () {});
            }, 45000);
        }
        turn = turn_val;
        tower_hp += tower_hp_val;
        wall_hp += wall_hp_val;
        if (wall_hp < 0) {
            wall_hp = 0;
        }
        wall_hp += hp_val;
        if (wall_hp < 0) {
            tower_hp += wall_hp;
            wall_hp = 0;
        }
        res1 = ((res1 + res1_val) >= 0) ? (res1 + res1_val) : 0;
        res2 = ((res2 + res2_val) >= 0) ? (res2 + res2_val) : 0;
        res3 = ((res3 + res3_val) >= 0) ? (res3 + res3_val) : 0;

        gen1 = ((gen1 + gen1_val) >= 1) ? (gen1 + gen1_val) : 1;
        gen2 = ((gen2 + gen2_val) >= 1) ? (gen2 + gen2_val) : 1;
        gen3 = ((gen3 + gen3_val) >= 1) ? (gen3 + gen3_val) : 1;
        callback();
    };
    this.growthRes = function (endTurn, callback) {
        if (!endTurn) {
            res1 += gen1;
            res2 += gen2;
            res3 += gen3;
        }
        callback();
    };
    this.costCard = function (card, callback) {
        if (res1 - card.card_res1 < 0 || res2 - card.card_res2 < 0 || res3 - card.card_res3 < 0) {
            callback(false);
        } else {
            res1 -= card.card_res1;
            res2 -= card.card_res2;
            res3 -= card.card_res3;
            callback(true);
        }
    };

    this.clearTimer = function () {
        clearTimeout(timerID);
    };

    this.cardsOnHand = [];

    this.newCard = function (card_id) {
        this.cardsOnHand.push(card_id);
    };

    this.buyPack = function (pack_count, callback) {

    };
}
module.exports = Player;