/**
 * Created by nikita on 16.11.2016.
 */


class Messenger {
    constructor() {

    }

    static send(socket, messageType, data = {}) {
        data.messageType = messageType;
        data = JSON.stringify(data);
        socket.write(data);
        console.log(data);
        return true;
    }

    static multipleSend(socket, messageType, array = []) {
        let data = '';
        let count = 0;
        array.forEach(function (item, i, arr) {
            ++count;
            item.messageType = messageType;
            data += JSON.stringify(item);
            if ((count % 3 == 0 && count != 0) || count == array.length) {
                let data1 = data;
                data = '';
                if (count % 3 != 0) {count = count + 25 - (count % 25);}
                setTimeout(function () {
                    socket.write(data1);
                    //console.log('send multiple '+messageType);
                }, 100 * count / 3);
            }
        });
    };

    static arraySend(socket, messageType, array = [], data = {}) {
    let string = '';
    let count = 0;
    array.forEach(function (item, i, arr) {
        ++count;
        string += item+',';
        if (count == array.length) {
            string = string.substring(0, string.length - 1);
            data.messageType = messageType;
            data.card_ids = string;
            data = JSON.stringify(data);
            socket.write(data);
            console.log('send array '+messageType);
        }
    });
};
}

function old_Messenger() {

    const isTestClient = (process.argv[2] == 'test');

    this.send = function (socket, messageType, data = {}) {
        data.messageType = messageType;
        data = JSON.stringify(data);
        (isTestClient) ? socket.send(data) : socket.write(data);
        console.log(data);
    };
    this.multipleSend = function (socket, messageType, array = []) {
        var data = '';
        var count = 0;
        array.forEach(function (item, i, arr) {
            ++count;
            item.messageType = messageType;
            data += JSON.stringify(item);
            if ((count % 3 == 0 && count != 0) || count == array.length) {
                var data1 = data;
                data = '';
                if (count % 3 != 0) {count = count + 25 - (count % 25);}
                setTimeout(function () {
                    (isTestClient) ? socket.send(data1) : socket.write(data1);
                    //console.log('send multiple '+messageType);
                }, 100 * count / 3);
            }
        });
    };
    this.arraySend = function (socket, messageType, array = [], data = {}) {
        var string = '';
        var count = 0;
        array.forEach(function (item, i, arr) {
            ++count;
            string += item+',';
            if (count == array.length) {
                string = string.substring(0, string.length - 1);
                data.messageType = messageType;
                data.card_ids = string;
                data = JSON.stringify(data);
                (isTestClient) ? socket.send(data) : socket.write(data);
                console.log('send array '+messageType);
            }
        });
    };
}

module.exports = Messenger;