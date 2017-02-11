/**
 * Created by nikita on 11.11.2016.
 */

const Collection = require('./collection');
const carder = require('./carder');
const Messenger = require('./messenger');
const db = require('./db');

class Player {
    constructor(socket = false) {
        this.id = 0;
        this.name = '';
        this.login = '';
        this.socket = socket;
        this.collection = {};
        this.inGame = false;
        this.inSearch = false;
        this.ready = false;
        this.gameDeckNum = 0;
    }

    loadPlayerByID(id, callback) {
        let self = this;
        let query = 'SELECT * FROM player WHERE player_id='+id+' LIMIT 1';
        db.query(query, function(err, result) {
            if (err == null) {
                self.id = result[0]['player_id'];
                self.name = result[0]['player_name'];
                self.login = result[0]['player_login'];
                self.collection = new Collection(self.id, callback);
            } else {
                console.error('Ошибка базы данных. Метод loadPlayerByID');
            }
        });
    };

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

    this.setInSearch = function (bool) {inSearch = bool;};
    this.getInSearch = function () {return inSearch;};
    this.setReady = function (bool) {ready = bool;};
    this.getReady = function () {return ready;};
    this.setChangeReady = function (bool) {changeReady = bool;};
    this.getChangeReady = function () {return changeReady;};
    this.setInGame = function (bool) {inGame = bool;};
    this.getInGame = function () {return inGame;};
    this.getParam = function (type) {
        switch (type) {
            case 'turn':return turn;
            case 'tower_hp':return tower_hp;
            case 'wall_hp':return wall_hp;
            case 'res1':return res1;
            case 'res2':return res2;
            case 'res3':return res3;
            case 'gen1':return gen1;
            case 'gen2':return gen2;
            case 'gen3':return gen3;
            case 'player_id':return player_id;
            case 'player_name':return player_name;
            case 'player_login':return player_login;
        }
    };
    this.setParam = function (type, value) {
        switch (type) {
            case 'turn':turn = value; break;
            case 'tower_hp':tower_hp = value; break;
            case 'wall_hp':wall_hp = value; break;
            case 'res1':res1 = value; break;
            case 'res2':res2 = value; break;
            case 'res3':res3 = value; break;
            case 'gen1':gen1 = value; break;
            case 'gen2':gen2 = value; break;
            case 'gen3':gen3 = value; break;
            case 'player_id':player_id = value; break;
        }
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