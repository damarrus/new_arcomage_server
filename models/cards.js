/**
 * Created by nikita on 15.10.2016.
 */

const mysql = require('mysql');
const connection = mysql.createConnection({
    host : 'localhost',
    database : 'arcomage',
    user : 'root',
    password : '123456'
});
connection.connect(function(err) {
    if (err)
        console.error(err);
});

var cards = {
    getCardByID: function(card_id, callback) {
        var query = 'SELECT * FROM card WHERE card_id='+card_id;
        connection.query(query, function(err, result) {
            callback(result[0]);
        });
    },
    getCardRandom: function(callback) {
        var query = 'SELECT count(*) as count_card FROM card';
        connection.query(query, function(err, result) {
            var id = Math.floor(Math.random() * (result[0].count_card)) + 1;
            query = 'SELECT * FROM card WHERE card_id='+id;
            connection.query(query, function(err, result) {
                callback(result[0]);
            });
        });
    },
};
module.exports = cards;