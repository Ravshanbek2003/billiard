import * as THREE from '../../libs/three137/three.module.js';
import * as CANNON from '../../libs/cannon-es.js';

class Ball{
    static RADIUS = 0.05715 / 2;
    static MASS = 0.17;
    static MATERIAL = new CANNON.Material("ballMaterial");
    
    constructor(game, x, z, id=0) {
        this.id = id;
    
        this.startPosition = new THREE.Vector3(x, Ball.RADIUS, z);
        this.mesh = this.createMesh(game.scene);
        
        this.world = game.world;
        this.game = game;

        this.rigidBody = this.createBody(x, Ball.RADIUS, z);
        this.world.addBody(this.rigidBody);
        this.reset();

        this.name = `ball${id}`;
    }

    get isSleeping(){
      return this.rigidBody.sleepState == CANNON.Body.SLEEPING;
    }

    reset(){
      this.rigidBody.velocity = new CANNON.Vec3(0);
      this.rigidBody.angularVelocity = new CANNON.Vec3(0);
      this.rigidBody.position.copy( this.startPosition );
      this.world.removeBody(this.rigidBody);
      this.world.addBody(this.rigidBody);
      this.mesh.position.copy( this.startPosition );
      this.mesh.rotation.set(0,0,0);
      this.mesh.visible = true;
      this.fallen = false;
    }

    onEnterHole() {
      this.rigidBody.velocity = new CANNON.Vec3(0);
      this.rigidBody.angularVelocity = new CANNON.Vec3(0);
      this.world.removeBody(this.rigidBody);
      this.fallen = true;
      this.mesh.visible = false;
      this.game.updateUI({event: 'balldrop', id: this.id } );
    }
    
    createBody(x,y,z) {
      const body = new CANNON.Body({
        mass: Ball.MASS, // kg
        position: new CANNON.Vec3(x,y,z), // m
        shape: new CANNON.Sphere(Ball.RADIUS),
        material: Ball.MATERIAL
      });
    
      body.linearDamping = body.angularDamping = 0.5; // Hardcode
      body.allowSleep = true;
     
      body.sleepSpeedLimit = 2;  
      body.sleepTimeLimit = 0.1; 
    
      return body;
    }

    createMesh (scene) {
        const geometry = new THREE.SphereGeometry(Ball.RADIUS, 24, 24);
        geometry.rotateX(Math.random() * Math.PI);
        geometry.rotateY(Math.random() * Math.PI);
        geometry.rotateZ(Math.random() * Math.PI);

        const material = new THREE.MeshStandardMaterial({
            metalness: 0.0,
            roughness: 0.1,
            envMap: scene.environment,
        });

        if (this.id == 0) {
          material.color.setHex( 0xffeecd);
        }
  
        if (this.id>0){
            const textureLoader = new THREE.TextureLoader().setPath('../../assets/pool-table/').load(`${this.id}ball.png`, tex => {
                material.map = tex;
                material.needsUpdate = true;
            });
        }
  
        const mesh = new THREE.Mesh(geometry, material);

        if (this.id == 0) {
          mesh.ballType = 'cue';
        } else if (this.id < 8) {
          mesh.ballType = 'solid';
        } else if (this.id == 8) {
          mesh.ballType = 'black';
        } else {
          mesh.ballType = 'striped';
        }
    
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = `ball${this.id}`;
        scene.add(mesh); 

        return mesh;
    };
 
    update(dt){
        if (this.fallen) return;

        this.mesh.position.copy(this.rigidBody.position);
        this.mesh.quaternion.copy(this.rigidBody.quaternion);
      
        if (this.rigidBody.position.y < -Ball.RADIUS && !this.fallen) {
          this.onEnterHole();
        }
    }
}

export { Ball };