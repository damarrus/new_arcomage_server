/**
 * Created by nikita on 18.11.2016.
 */

const db = require('./db');
const Deck = require('./deck');
const async = require('async');
const carder = require('./carder');

class Collection {
    constructor(player_id, callback) {
        let self = this;

        this.player_id = player_id;
        this.cardsArr = [];
        this.decks = [];

        let query = 'SELECT card_id FROM collection WHERE player_id='+player_id;
        db.query(query, function(err, result) {

            let count = 0;
            result.forEach(function (card, i, arr) {
                ++count;
                self.cardsArr.push(card.card_id);

                if (count >= arr.length) {
                    query = 'SELECT deck_id, deck_num, deck_name FROM deck WHERE player_id='+player_id;
                    db.query(query, function(err, result) {

                        let count_deck = 0;
                        result.forEach(function (deck_info, i, arr) {
                            let deck = new Deck(self.cardsArr, self.player_id);
                            deck.loadDeck(deck_info.deck_id, deck_info.deck_num, deck_info.deck_name, function () {
                                ++count_deck;
                                self.decks.push(deck);
                                if (count_deck >= arr.length) {
                                    callback();
                                }
                            });
                        });
                    });
                }
            });
        });
    }

    getDeckByNum(deck_num) {
        let deck = this.decks[deck_num - 1];
        return (deck.num == deck_num) ? deck : false;
    }

    createDeck(deck_name, card_ids, callback) {
        let deck = new Deck(this.cardsArr, this.player_id);
        deck.newDeck(deck_name, card_ids, callback);
    }

    deleteDeck(deck_num, callback) {
        let self = this;

        let deck = this.getDeckByNum(deck_num);
        if (deck) {
            deck.deleteDeck(function (result) {
                if (result == true) {
                    self.decks.splice(self.decks.indexOf(deck), 1);
                    deck = null;
                    let query = "SELECT count(deck_num) as count_deck FROM deck " +
                        "WHERE player_id='"+self.player_id+"' AND deck_num > '"+deck_num+"'";
                    db.query(query, function(err, result) {
                        (result[0].count_deck > 0) ? self._switchDeckNum(callback, result[0].count_deck, deck_num) :
                            callback(true);
                    });
                } else {
                    callback(result);
                }
            });
        } else {
            callback('serverErrorDeckNumNotEqual');
        }
    };

    /**
     * Вспомогательная рекурсивная функция.
     * Приводит в порядок по возрастанию deck_num.
     * @param {function} callback
     * @param {int} count_deck
     * @param {int} deck_num
     * @param {int} count
     * @private
     */
    _switchDeckNum(callback, count_deck, deck_num, count = 0) {
    if (count == count_deck) {
        callback(true);
    } else {
        let self = this;

        ++count;
        let query = "UPDATE deck SET deck_num = '"+ (deck_num + count - 1) +"' " +
            "WHERE player_id='"+self.player_id+"' AND deck_num = '"+ (deck_num + count) +"'";
        db.query(query, function(err, result) {
            let deck = self.getDeckByNum(deck_num);
            if (deck) {
                deck.num = deck_num + count - 1;
                self._switchDeckNum(callback, count_deck, deck_num, count);
            } else {
                callback('serverErrorDeckNumNotEqual')
            }
        });
    }
}
}

function old_Collection(player_id, callback) {

    var decks = [];
    var self = this;

    construct(callback);
    
    function construct(callback) {
        var query = 'SELECT count(*) as count_collection FROM collection WHERE player_id='+player_id;
        db.query(query, function(err, result) {
            if (result[0].count_collection == 0) {
                setStartCollectionAndDeck(function () {
                    loadCollection(function () {
                        loadDecks(callback);
                    });
                });
            } else {
                loadCollection(function () {
                    loadDecks(callback);
                });
            }
        });
    }
    function loadCollection(callback) {
        var query = 'SELECT card_id FROM collection WHERE player_id='+player_id;
        db.query(query, function(err, result) {
            var count = 0;
            result.forEach(function (item, i, arr) {
                ++count;
                cards.push(item.card_id);
                if (count == result.length) {
                    callback();
                }
            });
        });
    }
    function loadDecks(callback) {
        var query = 'SELECT count(*) as count_decks FROM deck WHERE player_id='+player_id;
        db.query(query, function(err, result) {
            if (result[0].count_decks == 0) {
                callback(false);
            } else {
                query = 'SELECT * FROM deck WHERE player_id=' + player_id;
                db.query(query, function (err, result) {
                    loadDecksRecursive(callback, result);
                });
            }
        });
    }
    function loadDecksRecursive(callback, decks_result, count = 0) {
        if (count == decks_result.length) {
            callback();
        } else {
            decks.push(new Deck(false, decks_result[count], function () {
                ++count;
                loadDecksRecursive(callback, decks_result, count);
            }));
        }
    }
    function setStartCollectionAndDeck(callback) {
        var query = 'INSERT INTO collection (player_id, card_id, card_amount) VALUES ' +
            '(' + player_id + ', 1, 1),' +
            '(' + player_id + ', 2, 1),' +
            '(' + player_id + ', 3, 1),' +
            '(' + player_id + ', 4, 1),' +
            '(' + player_id + ', 5, 1),' +
            '(' + player_id + ', 6, 1),' +
            '(' + player_id + ', 7, 1),' +
            '(' + player_id + ', 8, 1),' +
            '(' + player_id + ', 9, 1),' +
            '(' + player_id + ', 10, 1),' +
            '(' + player_id + ', 11, 1),' +
            '(' + player_id + ', 12, 1),' +
            '(' + player_id + ', 13, 1),' +
            '(' + player_id + ', 14, 1),' +
            '(' + player_id + ', 15, 1),' +
            '(' + player_id + ', 16, 1),' +
            '(' + player_id + ', 17, 1),' +
            '(' + player_id + ', 18, 1),' +
            '(' + player_id + ', 19, 1),' +
            '(' + player_id + ', 20, 1)';
        db.query(query, function (err, result) {
            query = "INSERT INTO deck (deck_num, deck_name, player_id) VALUES (1, 'startDeck', "+player_id+")";
            db.query(query, function (err, result) {
                query = 'INSERT INTO deckcard (deck_id, card_id) VALUES ' +
                    '(' + result.insertId + ', 1),' +
                    '(' + result.insertId + ', 2),' +
                    '(' + result.insertId + ', 3),' +
                    '(' + result.insertId + ', 4),' +
                    '(' + result.insertId + ', 5),' +
                    '(' + result.insertId + ', 6),' +
                    '(' + result.insertId + ', 7),' +
                    '(' + result.insertId + ', 8),' +
                    '(' + result.insertId + ', 9),' +
                    '(' + result.insertId + ', 10),' +
                    '(' + result.insertId + ', 11),' +
                    '(' + result.insertId + ', 12),' +
                    '(' + result.insertId + ', 13),' +
                    '(' + result.insertId + ', 14),' +
                    '(' + result.insertId + ', 15),' +
                    '(' + result.insertId + ', 16),' +
                    '(' + result.insertId + ', 17),' +
                    '(' + result.insertId + ', 18),' +
                    '(' + result.insertId + ', 19),' +
                    '(' + result.insertId + ', 20)';
                db.query(query, function (err, result) {
                    callback();
                });
            });
        });
    }
    this.getCardsID = function (callback) {
        callback(cards);
    };
    this.getAllDecks = function () {
        var result = [];
        async.each(decks, function (deck, callback) {
            result.push(deck.getDeckInfo());
            callback();
        }, function (err) {
            callback(result);
        })
    };
    this.getDeckByNum = function(deck_num, callback) {
        callback(decks[deck_num-1]);
    };
    function getDeckByNum(deck_num, callback) {
        //callback(decks[deck_num-1]);
        decks.forEach(function (deck, i, arr) {
            if (deck.getDeckNum() == deck_num) {
                callback(deck);
            }
        });
    }
    this.createDeck = function (deck_name, deck_num, card_ids, callback) {
        var deck = new Deck(true, {player_id:player_id,deck_name:deck_name,deck_num:deck_num}, function (result) {
            if (result == true) {
                decks.push(deck);
                card_ids = card_ids.split(',');
                deck.setDeckCards(card_ids, function () {
                    callback(result);
                });
            } else {
                callback(result);
            }
        });
    };
    this.deleteDeck = function (deck_num, callback) {
        this.getDeckByNum(deck_num, function (deck) {
            if (deck) {
                deck.deleteDeck(function (result) {
                    if (result == true) {
                        decks.splice(decks.indexOf(deck), 1);
                        var query = "SELECT count(deck_num) as count_deck FROM deck WHERE player_id='"+player_id+"' AND deck_num > '"+deck_num+"'";
                        db.query(query, function(err, result) {
                            if (result[0].count_deck > 0) {
                                switchDeckNum(callback, result[0].count_deck, deck_num);
                            } else {
                                callback(true);
                            }
                        });
                    } else {
                        callback(result);
                    }
                });
            } else {
                callback('invalidDeckNum');
            }
        });
    };
    function switchDeckNum(callback, count_deck, deck_num, count = 0) {
        if (count == count_deck) {
            callback(true);
        } else {
            ++count;
            var query = "UPDATE deck SET deck_num = '"+ (deck_num + count - 1) +"' " +
                "WHERE player_id='"+player_id+"' AND deck_num = '"+ (deck_num + count) +"'";
            db.query(query, function(err, result) {
                getDeckByNum(deck_num + count, function (deck) {
                    deck.setDeckNum(deck_num + count - 1);
                    switchDeckNum(callback, count_deck, deck_num, count);
                });
            });
        }
    }
    this.getDecks = function (callback) {
        callback(decks);
    };

}

module.exports = Collection;