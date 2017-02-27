/**
 * Created by nikita on 16.11.2016.
 */

const mysql = require('mysql');
const db = mysql.createConnection({
    host : 'localhost',
    database : 'arcomage',
    user : 'root',
    password : '123456',
    multipleStatements: true
});
db.connect(function(err) {
    if (err)
        console.error(err);
});

module.exports = db;