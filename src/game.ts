import p5, { Vector } from 'p5';
import Drone from './util/drone';
import NeuralNetwork from './util/nn';
import Population from './util/pop';
import dataManager from './util/data';
import { calculateFitnessImprovement, findBestSafeZonePosition } from './util/common';
import drawScoreGraph from './util/score-graph';


dataManager.loadData();
let baseBrain = new NeuralNetwork([8, 6, 4, 2]);
const data = dataManager.data;
if (data?.best) {
    console.log(
        data
    );

    baseBrain = NeuralNetwork.fromJson(data.best);
}
const pop = new Population({
    brain: baseBrain,
    populationSize: 50,
})

const gameSketch = (p: p5) => {
    let target = p.createVector(p.width / 2, 50);
    let drones: Drone[] = [];
    let avgGenerationsScore: number[] = data?.scores["avgGenerationsScore"]?.scores ?? [];
    let targetDistanceDiffPerGeneration: number[] = data?.scores["targetDistanceDiffPerGeneration"]?.scores ?? [];

    let paused = false;

    const nextGen = (first_gen = true) => {


        if (!first_gen) {
            avgGenerationsScore.push(pop.genomes.reduce((prev, curr) => prev + curr.fitness, 0) / pop.genomes.length);
            dataManager.saveData({
                scores: {
                    ...dataManager.data?.scores ?? {},
                    "avgGenerationsScore": {
                        color: "",
                        scores: avgGenerationsScore
                    }
                }
            })
        }

        pop.nextGeneration();


        // save best brain
        dataManager.saveData({
            best: pop.best.toJson()
        })


        // save avg scor

        // make a light color for drones
        const droneBaseColor = [Math.floor(Math.random() * 255), Math.floor(Math.random() * 255), Math.floor(Math.random() * 255)];

        for (let i = 0; i < drones.length; i++) {
            const drone = drones[i];
            console.log("drone #" + i, drone.brain.fitness);
        }

        drones = [];
        pop.genomes.forEach((genome, i) => {
            // random position
            const x = p.width / 2;
            const y = p.height - 100;
            const drone = new Drone({
                p,
                position: p.createVector(x, y),
                brain: genome,
            });
            if (i <= 2) {
                drone.showFires = true;
            }
            //make p5 color , from first to end , opacity should be like 255 to 50
            //@ts-ignore
            drone.color = p.color(droneBaseColor[0], droneBaseColor[1], droneBaseColor[2], p.map(i, 0, pop.genomes.length, 255, 10));
            drones.push(drone);
        })
        console.log("next gen created:");


    }
    p.setup = () => {
        p.createCanvas(735, innerHeight);

        pop.generation = avgGenerationsScore.length;
        nextGen();
        // make a button to reset brain 
        const btn = p.createElement("button")
        btn.html("clear brain")
        btn.mouseClicked(() => {
            // e.preventDefault();
            dataManager.removeData();
            window.location.reload();
        });
        btn.position(0, 0);

        target = p.createVector(400, 100);

        if (!data?.scores) {
            dataManager.saveData({
                scores: {
                    "avgGenerationsScore": {
                        color: "",
                        scores: []
                    },
                    "targetDistanceDiffPerGeneration": {
                        color: "",
                        scores: []
                    }
                }
            })
        }
        pop.generation = avgGenerationsScore.length;

        p.frameRate(60);
    };
    const targetSize = 30;

    p.draw = () => {
        p.background(10);

        const alives = drones.filter(drone => !drone.dead).length;
        p.fill(255);
        p.textSize(20);
        // show alive drones count
        p.text(`Alive: ${alives}`, 10, 30);
        // show generation
        p.text(`Generation: ${pop.generation}`, 10, 60);
        // Best score
        p.text(`Best score: ${pop.best.fitness}`, 10, 90);
        // fps
        p.text(`FPS: ${Math.floor(p.frameRate())}`, 10, 120);

        for (let i = 0; i < drones.length; i++) {
            const ts = distanceToTarget(drones[i]);
            const drone = drones[i];
            if (drone.dead) continue;
            drone.think({
                target,
                targetDistance: ts
            });
            drone.update({
                targetDistance: ts,
                target
            });
            drone.display();
            if (isDroneOut(drone)) {
                drone.win(
                    {
                        targetDistance: ts,
                        target,
                    }
                );
            }
            if (isDroneTouchingTarget(drone)) {
                drone.win({
                    targetDistance: ts,
                    target,
                });
            }
        }
        // if all drones are dead
        if (alives == 0 && !paused) {
            paused = true;
            // target distance diff per generation , from last target to new target

            let newTarget: Vector = target;
            // random target pos
            const pos = findBestSafeZonePosition({
                width: p.width,
                height: p.height
            }, drones);
            if (
                avgGenerationsScore.length % 2 == 0
            ) {
                newTarget = p.createVector(pos.x, pos.y);
            }

            targetDistanceDiffPerGeneration.push(p.dist(target.x, target.y, newTarget.x, newTarget.y));
            target = newTarget;

            dataManager.saveData({
                scores: {
                    ...dataManager.data?.scores ?? {},
                    "targetDistanceDiffPerGeneration": {
                        color: "",
                        scores: targetDistanceDiffPerGeneration
                    }
                }
            })
            nextGen(false);
            paused = false;
        }

        // draw target circle
        p.fill("red");
        p.circle(target.x, target.y, targetSize);


        const visSize = 200;
        pop.best.visualize({
            p5: p,
            position: p.createVector(p.width - visSize, p.height - visSize),
            size: [visSize, visSize]
        });




        // debug stuff
        //  draw bg 
        p.push();
        p.noStroke();
        p.fill(10, 0.8);
        p.rect(0, p.height - visSize / 2, p.width - visSize, visSize / 2);
        p.pop();


        const graphSize: [
            number,
            number
        ] = [p.width - visSize, visSize / 2];

        let improvementsScores = calculateFitnessImprovement(avgGenerationsScore, targetDistanceDiffPerGeneration);

        improvementsScores = improvementsScores.map((score) => {
            //    keep in graph height , find min and max
            const min = Math.min(...improvementsScores);
            const max = Math.max(...improvementsScores);
            return p.map(score, min, max, 0, graphSize[1]);
        })
        // only select first 10  and last 10 of each
        let normalizedData = {
            "avg fitness": avgGenerationsScore.slice(0, 10).concat(avgGenerationsScore.slice(avgGenerationsScore.length - 10, avgGenerationsScore.length)),
            "target distance diff": targetDistanceDiffPerGeneration.slice(0, 10).concat(targetDistanceDiffPerGeneration.slice(targetDistanceDiffPerGeneration.length - 10, targetDistanceDiffPerGeneration.length)),
            "improvements fitness": improvementsScores.slice(0, 10).concat(improvementsScores.slice(improvementsScores.length - 10, improvementsScores.length)),
        }
        if (normalizedData["avg fitness"].length < 10) {
            normalizedData["improvements fitness"] = improvementsScores;
        } else {
            const halfIndex = Math.floor(normalizedData["avg fitness"].length / 2);
            // add 0 in the middle 
            normalizedData["improvements fitness"].splice(halfIndex, 0, 0);
            normalizedData["avg fitness"].splice(halfIndex, 0, 0);
            normalizedData["target distance diff"].splice(halfIndex, 0, 0);
        }



        const avgFitness =( avgGenerationsScore.reduce((prev, curr) => prev + curr, 0) / avgGenerationsScore.length).toFixed(4);
        
        drawScoreGraph({
            p5: p,
            position: p.createVector(0, (p.height - visSize / 2) - 8),
            size: graphSize,
            scores: {
                [
                    `avg fitness ${avgFitness}`
                ]: {
                    color: "red",
                    scores: normalizedData["avg fitness"]
                },
                "target distance diff": {
                    color: "blue",
                    scores: normalizedData["target distance diff"]
                },
                // "improvements fitness": {
                //     color: "green",
                //     scores: normalizedData["improvements fitness"]
                // }
            }
        })
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

    // only for test drone
    // let forceActive: boolean = false;
    p.mouseClicked = () => {

        target = p.createVector(p.mouseX, p.mouseY);
    }
    p.keyPressed = () => {
        /*         const drone = drones[0];
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
                } */
    }
};
const run = () => {
    new p5(gameSketch);
    // new p5(brainSketch);
}
export default run;