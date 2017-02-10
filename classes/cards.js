/**
 * Created by nikita on 09.02.2017.
 */

const db = require('./db');
const Card = require('./card');

let cards = [];

let promise = new Promise(function (resolve, reject) {
    let query = 'SELECT * FROM card';
    db.query(query, function(err, result) {
        if (err == null) {
            // TODO: forEach
            for (let i = 0; i < result.length; i++) {
                cards.push(new Card(result[i]));
            }
            resolve(cards);
        } else {
            console.error('Ошибка базы данных');
            reject();
        }
    });
});

module.exports = promise;

