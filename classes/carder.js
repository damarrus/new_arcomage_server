/**
 * Created by nikita on 16.11.2016.
 */

const db = require('./db');

class Carder {
    constructor() {

    }
    static getAllCards() {
        return new Promise(function (resolve, reject) {
            let query = 'SELECT * FROM card';
            db.query(query, function(err, result) {
                if (err == null) {
                    resolve(result);
                } else {
                    reject();
                }
            });
        });
    };

    old_getAllCards(callback) {
        var query = 'SELECT * FROM card';
        db.query(query, function(err, result) {
            callback(result);
        });
    };

}
var card = {
    getCardByID: function(card_id, callback) {
        var query = 'SELECT * FROM card WHERE card_id='+card_id;
        db.query(query, function(err, result) {
            callback(result[0]);
        });
    },
    getCardByMultipleID: function(card_ids, callback) {
        var query = 'SELECT * FROM card WHERE ';
        var count = 0;
        card_ids.forEach(function (card_id, i, arr) {
            ++count;
            query += 'card_id='+card_id+' OR ';
            if (count == card_ids.length) {
                query = query.substring(0, query.length-4);
                db.query(query, function(err, result) {
                    callback(result);
                });
            }
        });
    },
    getAllCards: function(callback) {
        var query = 'SELECT * FROM card';
        db.query(query, function(err, result) {
            callback(result);
        });
    },
    getCardRandom: function(callback) {
        var query = 'SELECT count(*) as count_card FROM card';
        db.query(query, function(err, result) {
            var id = Math.floor(Math.random() * (result[0].count_card)) + 1;
            query = 'SELECT * FROM card WHERE card_id='+id;
            db.query(query, function(err, result) {
                callback(result[0]);
            });
        });
    },
    changeNull: function (callback) {
        var query = "UPDATE card SET card_enemy_res1 = 0 WHERE card_enemy_res1 is null";
        db.query(query, function(err, result) {
            var query = "UPDATE card SET card_enemy_res2 = 0 WHERE card_enemy_res2 is null";
            db.query(query, function(err, result) {
                var query = "UPDATE card SET card_enemy_res3 = 0 WHERE card_enemy_res3 is null";
                db.query(query, function(err, result) {
                    callback(result);
                });
            });
        });
    }

};

module.exports = Carder;