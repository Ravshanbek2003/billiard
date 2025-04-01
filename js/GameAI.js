

import { Vector3 } from '../../libs/three137/three.module.js';

class GameAI {
    constructor(game) {
        this.game = game;
        this.ball = game.balls[0];
        this.state = 'idle';
        this.target = new Vector3();
        this.strength = 0.7;
        this.timer = 0;
        this.timeToHit =  1;
        this.ballType = '?';
        this.targetType = '?';
    }


    setTargetType() {
        if (this.game.gameState.sides.player2 === '?') {
            this.targetType = Math.random() > 0.5 ? 'solid' : 'striped';
        } else {
            this.targetType = this.game.gameState.sides.player2;
        }

    }

    autoRotate() {
        this.game.gameState.game.controls.enabled = false;
        this.game.gameState.game.controls.autoRotate = true;
        this.game.gameState.game.controls.autoRotateSpeed = Math.random() > 0.5 ? -3 : 3;

    }

    stopAutoRotate() {
        this.game.gameState.game.controls.enabled = true;
        this.game.gameState.game.controls.autoRotate = false;
    }

    setBallType(type) {
        this.ballType = type;
    }

    update(dt) {

            switch (this.state) {
                case 'idle':

                    break;
                case 'aim':
                    if (this.timer == 0) {
                        this.autoRotate();
                        this.setTargetType();
                    }
                    this.timer += dt;
                    break;
                case 'hit':

                    this.timer += dt;
                    if (this.timer > this.timeToHit * 0.5) {
                        this.stopAutoRotate();
                    }

                    if (this.timer > this.timeToHit) {

                        this.timer = 0;
                        this.state = 'idle';
                        this.game.gameState.hit(this.strength);
                    }
                    break;
            }
        }
    }



export { GameAI };