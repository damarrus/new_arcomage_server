/**
 * Created by nikita on 09.02.2017.
 */

class Card {
    constructor (data) {
        this.id = data['card_id'];
        this.name = data['card_name'];
        this.res1 = data['card_res1'];
    }
}

module.exports = Card;