/**
 * Created by nikita on 21.12.2016.
 */

const db = require('./db');

let promise = new Promise(function (resolve, reject) {
    let query = 'SELECT * FROM gameconf WHERE gameconf_id = 1';
    db.query(query, function(err, result) {
        if (err == null) {
            resolve(result[0]);
        } else {
            console.error('Ошибка базы данных');
            reject();
        }
    });
});

module.exports = promise;
