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
                        // если есть хотя бы одна дека
                        if (result.length > 0) {
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
                        } else {
                            callback();
                        }
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
        let self = this;

        let deck = new Deck(this.cardsArr, this.player_id);
        deck.newDeck(deck_name, card_ids, function (result) {
            callback(result);
            self.decks.push(deck);
            // Вывод дек нумов
            /*for (let i = 0; i < self.decks.length; ++i) {
                console.log(self.decks[i].num);
            }*/
        });
    }

    deleteDeck(deck_num, callback) {
        let self = this;

        let deck = this.getDeckByNum(deck_num);

        if (deck == false) {
            callback('serverErrorDeckNumNotEqual, deleteDeck');
            return;
        }

        deck.deleteDeck(function (result) {
            if (result != true) {
                callback(result);
                return;
            }

            self.decks.splice(self.decks.indexOf(deck), 1);
            deck = null;

            if (self.decks.length <= deck_num - 1) {
                callback(true);
                return;
            }

            let count = 0;
            self.decks.forEach(function (deck, i, arr) {
                if (deck.num > deck_num) {
                    deck.lowerDeckNum(function () {
                        ++count;
                        if (count >= arr.length) {
                            callback(true);
                        }
                    });
                } else {
                    ++count;
                }
            });
        });
    };
}

module.exports = Collection;