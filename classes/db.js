/**
 * Created by nikita on 16.11.2016.
 */

const mysql = require('mysql');
const db = mysql.createConnection({
    host : 'localhost',
    database : 'arcomage',
    user : 'root',
    password : '123456'
});
db.connect(function(err) {
    if (err)
        console.error(err);
});

class DataBase {
    constructor() {

    }
    /**
     * Возвращает все карты из базы данных.
     * @return {Promise.<Array>}
     */
    static getAllCards() {
        return new Promise(function (resolve, reject) {
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
    };

    /**
     * Возвращает версию базы данных.
     * @return {Promise.<int>}
     */
    static getHash() {
        return new Promise(function (resolve, reject) {
            let query = "SELECT gameconf_hash FROM gameconf WHERE gameconf_id = 1";
            db.query(query, function(err, result) {
                if (err == null) {
                    resolve(result[0].gameconf_hash);
                } else {
                    console.error('Ошибка базы данных');
                    reject();
                }
            });
        });
    };

    /**
     * Проверяет существование игрока с данными логином и паролем.
     * @param {string} login
     * @param {string} password
     * @return {Promise.<int>}
     */
    static getIdByLoginAndPassword(login, password) {
        return new Promise(function (resolve, reject) {
            if (login == '' || password == '') {
                reject('LoginOrPasswordIsEmpty');
            }
            let query = "SELECT player_id, count(player_id) as count_player FROM player WHERE player_login='"+login+"' AND player_password='"+password+"' LIMIT 1";
            db.query(query, function(err, result) {
                if (err == null) {
                    if (result[0].count_player != 0) {
                        resolve(result[0].player_id);
                    } else {
                        reject('PlayerIsNotFound');
                    }
                } else {
                    reject('DataBaseError');
                }
            });
        });
    }

    /**
     * Возвращает информацию об игроке.
     * @param {int} id
     * @return {Promise.<Array>}
     */
    static getPlayerInfoByID(id) {
        return new Promise(function (resolve, reject) {
            let query = 'SELECT * FROM player WHERE player_id='+id+' LIMIT 1';
            db.query(query, function(err, result) {
                if (err == null) {
                    resolve(result[0]);
                } else {
                    console.error('Ошибка базы данных');
                    reject('DataBaseError');
                }
            });
        });
    };
}

module.exports = db;