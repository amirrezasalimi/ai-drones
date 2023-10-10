import * as p5 from 'p5';
import Drone from './util/drone';
import NeuralNetwork from './util/nn';
import { fanPower } from './util/constants';
import Population from './util/pop';

const game = (p: p5) => {

    let target = p.createVector(p.width / 2, 50);
    let drones: Drone[] = [];
    // 
    let baseBrain = new NeuralNetwork([6, 8, 8, 2]);

    const json = localStorage.getItem("best__brain");
    if (json) {
        // baseBrain = NeuralNetwork.fromJson(JSON.parse(json));
    }
    const pop = new Population({
        brain: baseBrain,
        populationSize: 350,
    })
    const nextGen = () => {
        pop.nextGeneration();


        // save best brain
        localStorage.setItem("best__brain", JSON.stringify(pop.best.toJson()));


        drones = [];
        pop.genomes.forEach((genome, i) => {
            const x = p.random(0, p.width);
            const y = p.random(0, p.height - 100);
            const drone = new Drone({
                p,
                position: p.createVector(x, y),
                brain: genome,
            });
            if (i <= 2) {
                // drone.showFires = true;
            }
            // random color
            // @ts-ignore
            drone.color = p.color(p.random(0, 255), p.random(0, 255), p.random(0, 255));
            drones.push(drone);
        })
    }
    p.setup = () => {
        p.createCanvas(800, innerHeight);

        nextGen();
    };
    const targetSize = 50;

    p.draw = () => {
        p.background(10);


        p.fill(255);
        p.textSize(20);
        // show alive drones count
        p.text(`Alive: ${drones.filter(drone => !drone.dead).length}`, 10, 30);
        // show generation
        p.text(`Generation: ${pop.generation}`, 10, 60);
        // Best score
        p.text(`Best score: ${pop.best.fitness}`, 10, 90);

        for (let i = 0; i < drones.length; i++) {
            const drone = drones[i];
            if (drone.dead) continue;
            const _distanceToTarget = distanceToTarget(drone);
            drone.think({
                distanceToTarget: _distanceToTarget,
            });
            drone.update();
            drone.display();
            if (isDroneOut(drone)) {
                drone.kill();
            }
            if (isDroneTouchingTarget(drone)) {
                drone.win();
            }
        }
        // if all drones are dead
        if (drones.every(drone => drone.dead)) {
            nextGen();
            // random target pos
            target = p.createVector(p.random(0, p.width), p.random(0, p.height));
        }

        // draw target circle
        p.fill("red");
        p.circle(target.x, target.y, targetSize);

        const size=200;
        // visualize best drone
        pop.best.visualize({
            p5: p,
            size: [size, size],
            position: p.createVector(p.width-size, p.height-size),
        });

    };
    const distanceToTarget = (drone: Drone) => {
        const distance = p.dist(drone.position.x, drone.position.y, target.x, target.y);
        return distance;
    }
    const isDroneTouchingTarget = (drone: Drone) => {
        const distance = p.dist(drone.position.x, drone.position.y, target.x, target.y);
        if (distance < targetSize) {
            return true;
        }
        return false;
    }
    const isDroneOut = (drone: Drone) => {
        // if out of screen
        if (drone.position.x < 0 || drone.position.x > p.width || drone.position.y < 0 || drone.position.y > p.height) {
            return true;
        }
        return false;
    }

    let forceActive: boolean = false;
    p.mouseClicked = () => {

        target = p.createVector(p.mouseX, p.mouseY);
    }
    p.keyPressed = () => {
        const drone = drones[0];
        // space
        if (p.key === " ") {
            if (forceActive) {
                drone.leftFirePower = fanPower;
                drone.rightFirePower = fanPower;
            } else {
                drone.leftFirePower = 100;
                drone.rightFirePower = 100;
            }
            forceActive = !forceActive;
        }
        // left
        if (p.key === "a") {
            drone.leftFirePower += 0.2;
        }
        // right
        if (p.key === "d") {
            drone.rightFirePower += 0.2;
        }

        // down
        if (p.key === "s") {
            drone.leftFirePower -= 2;
            drone.rightFirePower -= 2;
        }
    }
};

export default game;