import p5 from 'p5';
import DroneFire from './drone-fire';
import NeuralNetwork from './nn';
import { fanPower, gravity } from './constants';

const maxFuel = 50;
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
    fuel: number = maxFuel;
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

    inputs(params: {
        position_x: number,
        position_y: number,
        velocity_x: number,
        velocity_y: number,
        left_fire_power: number,
        right_fire_power: number,
        target_x: number,
        target_y: number

    }) {
        // Return an array of input values for the genetic algorithm
        return [params.position_x, params.position_y, params.velocity_x, params.velocity_y, params.left_fire_power, params.right_fire_power, params.target_x, params.target_y];
    }

    fitness({ position_x, position_y, velocity_x, velocity_y, target_x, target_y }: {
        position_x: number,
        position_y: number,
        velocity_x: number,
        velocity_y: number,
        left_fire_power: number,
        right_fire_power: number,
        target_x: number,
        target_y: number
    }) {
        // Calculate the Euclidean distance between the current drone position and the target position
        const distanceToTarget = Math.sqrt((position_x - target_x) ** 2 + (position_y - target_y) ** 2);

        // Calculate the difference in velocities (to encourage stability)
        const velocityDifference = Math.abs(velocity_x - velocity_y);

        // Calculate a score based on the distance to the target and velocity difference
        // You may need to adjust the weights for distance and stability based on your game's requirements
        const distanceWeight = 1.0;
        const stabilityWeight = 0.2;

        const fitnessScore = distanceWeight * (1 / (1 + distanceToTarget)) + stabilityWeight * (1 / (1 + velocityDifference));

        // Return the fitness score to be maximized
        return fitnessScore;
    }

    think({
        target,
    }: {
        target: p5.Vector,
        targetDistance: number
    }) {

        const { p, velocity, brain, position } = this;
        // normalize

        const inputs = this.inputs({
            position_x: position.x,
            position_y: position.y,
            velocity_x: velocity.x,
            velocity_y: velocity.y,
            left_fire_power: this.leftFirePower,
            right_fire_power: this.rightFirePower,
            target_x: target.x,
            target_y: target.y,
        })

        // normalize

        let inputs_norm = [
            p.map(inputs[0], 0, p.width, 0, 1),
            p.map(inputs[1], 0, p.height, 0, 1),
            p.map(inputs[2], -10, 10, 0, 1),
            p.map(inputs[3], -10, 10, 0, 1),
            p.map(inputs[4], 0, 100, 0, 1),
            p.map(inputs[5], 0, 100, 0, 1),
            p.map(inputs[6], 0, p.width, 0, 1),
            p.map(inputs[7], 0, p.height, 0, 1),
        ]

        const outputs = brain.predict(inputs_norm);
        // leftFirePower , rightFirePower map to 0 50
        this.leftFirePower = p.map(outputs[0], 0, 1, 0, 50);
        this.rightFirePower = p.map(outputs[1], 0, 1, 0, 50);
    }
    startTime = Date.now();
    kill() {
        this.dead = true;
        // score from 1 to Infinity
        this.brain.fitness = 0;
    }
    win({
        target
    }: {
        targetDistance: number
        target: p5.Vector
    }) {
        this.dead = true;

        this.brain.fitness = this.fitness({
            position_x: this.position.x,
            position_y: this.position.y,
            velocity_x: this.velocity.x,
            velocity_y: this.velocity.y,
            left_fire_power: this.leftFirePower,
            right_fire_power: this.rightFirePower,
            target_x: target.x,
            target_y: target.y,
        });
    }
    update({
        targetDistance,
        target
    }: {
        targetDistance: number
        target: p5.Vector
    }) {
        const { p, leftFirePower, rightFirePower, acceleration, velocity } = this;

        // decrease fuel based on power usage of fires
        if (this.fuel > 0) {
            this.fuel -= ((leftFirePower + rightFirePower) / maxFuel) / 14;
        } else {
            this.win({
                targetDistance,
                target
            });
        }

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


        // show fuel  , size based on size of drone
        p.fill("white");
        p.textSize(this.size[0] / 6);
        p.textAlign(p.CENTER, p.CENTER);
        p.text(this.fuel.toFixed(2), this.position.x, this.position.y);

        p.textAlign(p.LEFT, p.TOP);
    }
}

export default Drone;