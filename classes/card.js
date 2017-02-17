/**
 * Created by nikita on 09.02.2017.
 */

class Card {
    constructor (data = {}) {
        this.id = data['card_id'] || 0;
        this.name = data['card_name'] || 0;
        this.res1 = data['card_res1'] || 0;
        this.res2 = data['card_res2'] || 0;
        this.res3 = data['card_res3'] || 0;
        this.endturn = data['card_endturn'] || 0;

        this.self_tower_hp = data['card_self_tower_hp'] || 0;
        this.enemy_tower_hp = data['card_enemy_tower_hp'] || 0;
        this.self_wall_hp = data['card_self_wall_hp'] || 0;
        this.enemy_wall_hp = data['card_enemy_wall_hp'] || 0;
        this.self_hp = data['card_self_hp'] || 0;
        this.enemy_hp = data['card_enemy_hp'] || 0;

        this.self_res1 = data['card_self_res1'] || 0;
        this.self_res2 = data['card_self_res2'] || 0;
        this.self_res3 = data['card_self_res3'] || 0;
        this.enemy_res1 = data['card_enemy_res1'] || 0;
        this.enemy_res2 = data['card_enemy_res2'] || 0;
        this.enemy_res3 = data['card_enemy_res3'] || 0;

        this.self_gen1 = data['card_self_gen1'] || 0;
        this.self_gen2 = data['card_self_gen2'] || 0;
        this.self_gen3 = data['card_self_gen3'] || 0;
        this.enemy_gen1 = data['card_enemy_gen1'] || 0;
        this.enemy_gen2 = data['card_enemy_gen2'] || 0;
        this.enemy_gen3 = data['card_enemy_gen3'] || 0;
    }
}

module.exports = Card;