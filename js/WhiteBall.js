import { Ball } from './Ball.js';

import * as THREE from '../../libs/three137/three.module.js';
import * as CANNON from '../../libs/cannon-es.js';

class WhiteBall extends Ball{
    constructor(game, x, z){
        super(game, x, z);

        this.forward = new THREE.Vector3();

        this.guideLine = this.createGuideLine();
        game.scene.add(this.guideLine);

        this.dot = this.createIntersectionDot();
        game.scene.add(this.dot);

        this.raycaster = new THREE.Raycaster();

        this.game = game;
        
    }

    createGuideLine() {
        const points = [];
        points.push( new THREE.Vector3( 0, 0, 0 ) );
        points.push( new THREE.Vector3( 0, 0, -1 ) );

        const geometry = new THREE.BufferGeometry().setFromPoints( points );

        const material = new THREE.LineDashedMaterial( { color: 0xffffff, dashSize: 0.05, gapSize: 0.05, linewidth: 1 } )

        const line = new THREE.Line(geometry, material);
        
        line.scale.z = 3;
        line.visible = false;

        line.computeLineDistances(); 

        return line;
    }

    createIntersectionDot() {
        const geometry = new THREE.SphereBufferGeometry(0.005, 8, 8);
        const material = new THREE.MeshBasicMaterial({opacity: 0.8, transparent: true, color: 0xcccc00});
        return new THREE.Mesh(geometry, material);
    }

    update(dt) {
        super.update(dt);
      
        if (this.rigidBody.sleepState == CANNON.Body.SLEEPING) {
            this.updateGuideLine();
        } else {
            this.guideLine.visible = false;
            this.dot.visible = false;
        }
    }
        
    updateGuideLine() {
        if (this.balls === undefined){
            this.balls = this.game.balls.map( ball => ball.mesh );
            this.balls.shift();
        }

        const angle = this.game.controls.getAzimuthalAngle();
        
        this.guideLine.position.copy(this.mesh.position);
        this.guideLine.rotation.y = angle;
        const guideLength = this.guideLine.scale.z

        this.guideLine.material.gapSize = 0.05 / guideLength;
        this.guideLine.material.dashSize = 0.05 / guideLength;

        if (this.game.gameState.state === 'turn') {
            this.guideLine.visible = true;
            if (this.game.gameState.turn === 'player1') {
                this.guideLine.material.color.set(0x0055cc);  
            } else {
                this.guideLine.material.color.set(0xffa500);  
            }
        }


        this.guideLine.getWorldDirection(this.forward);
        this.forward.negate();

        this.raycaster.set(this.mesh.position, this.forward );

        let intersects = this.raycaster.intersectObjects( this.balls );

        if (intersects.length>0){
            this.guideLine.scale.z = intersects[0].distance;
            this.dot.position.copy(intersects[0].point);
            this.dot.visible = true;

            if (this.game.gameState.state === 'turn' && this.game.gameState.turn === 'player2') {
            if(intersects[0].object.ballType === this.game.gameState.ai.targetType)   {
            
                this.game.gameState.ai.state = 'hit';
            }
            if(this.game.gameState.sides.player2 === '?' || intersects[0].object.ballType === 'black') {
                this.game.gameState.ai.state = 'hit';
            }
        }

        }else{
            intersects = this.raycaster.intersectObject( this.game.edges );

            if (intersects.length>0){

                this.guideLine.scale.z = intersects[0].distance;
            }
            this.dot.visible = false;
        }
    }

    hit(strength) {
        this.rigidBody.wakeUp();
        
        const position = new CANNON.Vec3();
        position.copy(this.rigidBody.position);
      
        const vec = new CANNON.Vec3();
        vec.copy(this.forward);
      
        vec.normalize();
        vec.scale(Ball.RADIUS, vec);
        position.vsub(vec, position);
      
        const force = new CANNON.Vec3();
        force.copy(this.forward.normalize());
        force.scale(strength, force);
        this.rigidBody.applyImpulse(force, new CANNON.Vec3());
    }
      
    onEnterHole() {
        this.rigidBody.velocity = new CANNON.Vec3(0);
        this.rigidBody.angularVelocity = new CANNON.Vec3(0);
        this.rigidBody.position.copy(this.startPosition);
        this.game.updateUI({ event:'whitedrop' });
    }
}

export { WhiteBall };