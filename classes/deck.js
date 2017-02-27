/**
 * Created by nikita on 18.11.2016.
 */

const db = require('./db');
const async = require('async');

const maxCardsInDeck = 20;

// TODO: сделать проверку на дубли в деке
class Deck {
    constructor(collectionCardsArr, player_id) {
        this.id = 0;
        this.num = 0;
        this.name = '';
        this.cardsArr = [];
        this.collectionCardsArr = collectionCardsArr;
        this.full = true;
        this.player_id = player_id;
    }

    loadDeck(deck_id, deck_num, deck_name, callback) {
        let self = this;

        this.id = deck_id;
        this.num = deck_num;
        this.name = deck_name;

        let query = 'SELECT card_id FROM deckcard WHERE deck_id='+this.id;
        db.query(query, function(err, result) {
            self.full = true;
            let count = 0;
            result.forEach(function (card, i, arr) {
                if (card.card_id == 0) {
                    self.full = false;
                }
                ++count;
                self.cardsArr.push(card.card_id);
                if (count >= arr.length) {
                    callback();
                }
            });

        });
    }

    newDeck(deck_name, card_ids, callback) {
        let self = this;

        self.isUniqueDeckName(deck_name, function (result) {
            if (result) {
                self.name = deck_name;
                    let query = "SELECT max(deck_num) as max_num FROM deck WHERE player_id='"+self.player_id+"'";
                    db.query(query, function(err, result) {
                        self.num = (result[0].max_num != null) ? result[0].max_num+1 : 1;

                        query = "INSERT INTO deck (deck_num, deck_name, player_id) VALUES " +
                            "('" + self.num + "','" + deck_name + "','" + self.player_id + "')";
                        db.query(query, function (err, result) {
                            self.id = result.insertId;
                            self.setDeckCards(card_ids, callback);
                        });
                    });
            } else {
                callback('deckNameIsNotUnique');
            }
        });
    }

    getDeckInfo() {
        return {
            deck_num: this.num,
            deck_name: this.name
        };
    }

    isCardsInCollection(card_ids, callback) {
        let result = true;
        let count = 0;
        card_ids.forEach(function (card_id, i, arr) {
            ++count;
            if (this.collectionCardsArr.indexOf(card_id) == -1 && card_id != 0) result = false;
            if (count >= arr.length) callback(result);
        }, this);
    }

    setDeckCards(card_ids, callback) {
        let self = this;

        this.isCardsInCollection(card_ids, function (result) {
            if (result) {
                self.full = (card_ids.indexOf(0) == -1);
                let query = 'DELETE FROM deckcard WHERE deck_id=' + self.id;
                db.query(query, function (err, result) {
                    query = 'INSERT INTO deckcard (deck_id, card_id) VALUES';
                    let count = 0;
                    card_ids.forEach(function (card_id, i, arr) {
                        ++count;
                        query += ' (' + self.id + ', ' + card_id + '),';
                        if (count == card_ids.length) {
                            query = query.substring(0, query.length - 1);
                            db.query(query, function (err, result) {
                                self.cardsArr = card_ids;
                                callback(true);
                            });
                        }
                    });
                });
            } else {
                callback('cardNotInCollection');
            }
        });
    }

    isUniqueDeckName(deck_name, callback) {
        let query = "SELECT count(deck_name) as count_deck_name FROM deck " +
            "WHERE deck_name='"+deck_name+"' AND player_id='"+this.player_id+"' LIMIT 1";
        db.query(query, function(err, result) {
            (result[0].count_deck_name == 0) ? callback(true) : callback(false);
        });
    }

    setDeckName(deck_name, callback) {
        if (deck_name != this.name) {
            let self = this;
            this.isUniqueDeckName(deck_name, function (result) {
                if (result) {
                    let query = "UPDATE deck SET deck_name='"+deck_name+"' WHERE deck_id="+self.id;
                    db.query(query, function(err, result) {
                        self.name = deck_name;
                        callback(true);
                    });
                } else {
                    callback('deckNameIsNotUnique');
                }
            });
        } else {
            callback(true);
        }
    };

    lowerDeckNum(callback) {
        let self = this;
        let query = "UPDATE deck SET deck_num='"+ (self.num - 1) +"' WHERE deck_id="+self.id;
        db.query(query, function(err, result) {
            --self.num;
            callback(true);
        });
    }

    deleteDeck(callback) {
        let self = this;

        let query = "DELETE FROM deck WHERE deck_id="+self.id;
        db.query(query, function(err, result) {
            query = "DELETE FROM deckcard WHERE deck_id="+self.id;
            db.query(query, function(err, result) {
                callback(true);
            });
        });
    };
}

module.exports = Deck;