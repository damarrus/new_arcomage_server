/**
 * Created by nikita on 09.02.2017.
 */

const db = require('./db');

let promise = new Promise(function (resolve, reject) {
    let query = 'SELECT * FROM card';
    db.query(query, function(err, result) {
        if (err == null) {
            resolve(result);
        } else {
            console.error('Ошибка базы данных');
            reject();
        }
    });
});

module.exports = promise;
