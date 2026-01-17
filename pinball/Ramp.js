import { TABLE_WIDTH, TABLE_HEIGHT, matterToThree } from './utils.js';

export class Ramp {
    constructor(engine, scene, vertices, position, path) {
        this.engine = engine;
        this.scene = scene;
        this.vertices = vertices;
        this.path = path;
        
        // Center the vertices around (0,0) before creating the body
        const center = Matter.Vertices.centre(vertices);
        const centeredVertices = vertices.map(v => ({ x: v.x - center.x, y: v.y - center.y }));
        
        this.body = Matter.Bodies.fromVertices(position.x, position.y, [centeredVertices], { isStatic: true, isSensor: true, label: 'ramp' });
        Matter.World.add(this.engine.world, this.body);

        const shape = new THREE.Shape();
        shape.moveTo(centeredVertices[0].x, -centeredVertices[0].y);
        for(let i=1; i<centeredVertices.length; i++) {
            shape.lineTo(centeredVertices[i].x, -centeredVertices[i].y);
        }
        const geometry = new THREE.ShapeGeometry(shape);
        const material = new THREE.MeshBasicMaterial({color: 0x888888, transparent: true, opacity: 0.5});
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(position.x - TABLE_WIDTH/2, -position.y + TABLE_HEIGHT/2, 0);
        this.scene.add(this.mesh);

        this.ballOnRamp = null;
        this.t = 0;
    }

    update() {
        if (this.ballOnRamp) {
            this.t += 0.01;
            if (this.t > 1) {
                this.detachBall();
            } else {
                const point = this.path.getPointAt(this.t);
                Matter.Body.setPosition(this.ballOnRamp, {x: point.x + TABLE_WIDTH/2, y: -point.y + TABLE_HEIGHT/2});
            }
        }
    }

    attachBall(ball) {
        this.ballOnRamp = ball;
        this.ballOnRamp.isSensor = true;
        this.t = 0;
    }

    detachBall() {
        this.ballOnRamp.isSensor = false;
        if (this.onDetach) {
            this.onDetach(this.ballOnRamp);
        } else {
            const velocity = this.path.getTangentAt(1);
            Matter.Body.setVelocity(this.ballOnRamp, {x: velocity.x * 30, y: -velocity.y * 30});
        }
        this.ballOnRamp = null;
    }
}