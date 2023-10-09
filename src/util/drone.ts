import p5 from 'p5';
import DroneFire from './drone-fire';
import NeuralNetwork from './nn';
import { fanPower, gravity } from './constants';


class Drone {
    p: p5;
    position: p5.Vector;
    velocity: p5.Vector;
    acceleration: p5.Vector;
    mass: number;

    size: [number, number] = [80, 30];
    color: string = "green";
    showFires: boolean = false;
    // fans

    leftFirePower: number = fanPower; // Power of the left fan
    rightFirePower: number = fanPower; // Power of the right fan

    leftFire: DroneFire;
    rightFire: DroneFire;

    brain: NeuralNetwork;

    dead: boolean = false;
    constructor({
        p,
        position,
        brain,
    }: {
        p: p5
        position: p5.Vector
        brain: NeuralNetwork
    }) {
        this.p = p;
        this.position = position;
        this.velocity = p.createVector(0, 0);
        this.acceleration = p.createVector(0, 0);
        this.mass = 25; // Mass of the drone

        // fans
        this.leftFire = new DroneFire({
            p,
            position: p.createVector(position.x - this.size[0] / 2 - 10, position.y - this.size[1] / 2),
        });

        this.rightFire = new DroneFire({
            p,
            position: p.createVector(position.x + this.size[0] / 2, position.y - this.size[1] / 2),
        });

        this.brain = brain;
    }

    applyForce(force: p5.Vector) {
        // Newton's second law: F = m * a
        // We assume mass is constant, so a = F / m
        // @ts-ignore
        let f: p5.Vector = p5.Vector.div(force, this.mass);
        this.acceleration.add(f);
    }

    think() {
        const inputs = [
            this.position.x,
            this.position.y,
            this.velocity.x,
            this.velocity.y,
        ]
        const outputs = this.brain.predict(inputs);
        // leftFirePower , rightFirePower map to 0 50
        this.leftFirePower = this.p.map(outputs[0], 0, 1, 0, 50);
        this.rightFirePower = this.p.map(outputs[1], 0, 1, 0, 50);
    }
    startTime = Date.now();
    kill() {
        this.dead = true;
        // score from 1 to Infinity
        const score = (Date.now() - this.startTime);
        this.brain.fitness = score;
    }
    update() {
        const { p, leftFirePower, rightFirePower, acceleration, velocity } = this;
        // Update velocity
        this.velocity.add(acceleration);
        // Apply damping to simulate air resistance
        this.velocity.mult(0.99);
        // Update position
        this.position.add(velocity);
        // Reset acceleration
        this.acceleration.mult(0);

        //  apply fires forces to the drone itself + gravity and mass
        this.applyForce(p.createVector(0, gravity * this.mass));

        // Apply fan forces
        let leftForce: p5.Vector = p.createVector(-leftFirePower, 0);
        let rightForce: p5.Vector = p.createVector(rightFirePower, 0);

        // apply both sides of the drone
        this.applyForce(leftForce);
        this.applyForce(rightForce);

        // also apply the both forces to the drone itself , not x side * 0.1

        this.applyForce(p.createVector(0, -leftFirePower * 0.01));
        this.applyForce(p.createVector(0, -rightFirePower * 0.01));


        if (this.showFires) {
            // fan particles
            this.leftFire.power = leftFirePower;
            this.leftFire.position = p.createVector(this.position.x - this.size[0] / 2 - 5, this.position.y - this.size[1] / 2 + 5);
            this.leftFire.update();

            // fan particles
            this.rightFire.power = rightFirePower;
            this.rightFire.position = p.createVector(this.position.x + this.size[0] / 2 + 5, this.position.y - this.size[1] / 2 + 5);
            this.rightFire.update();
        }
    }
    display() {

        const { p } = this;
        p.fill(this.color);
        p.rect(this.position.x - this.size[0] / 2, this.position.y - this.size[1] / 2, this.size[0], this.size[1]);

        // draw fans


        // left fan
        p.fill("brown");
        p.rect(this.position.x - this.size[0] / 2 - 10, this.position.y - this.size[1] / 2, 10, 10);
        // right fan
        p.fill("brown");
        p.rect(this.position.x + this.size[0] / 2, this.position.y - this.size[1] / 2, 10, 10);

    }
}

export default Drone;