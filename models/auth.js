/**
 * Created by nikita on 11.11.2016.
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

function auth(player_login, player_password, callback) {
    var query = 'SELECT * FROM player WHERE player_login='+player_login+' AND player_password='+player_password;
    connection.query(query, function(err, result) {
        if ( 1 == 1 ){//result.length != 0) {
            callback(result[0]);
        } else {
            callback(false);
        }
    });
}
module.exports = auth;