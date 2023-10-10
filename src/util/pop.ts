import NeuralNetwork from "./nn";

class Species {
    maxUnimprovedGenerations: number = 10
    notImprovedGenerations: number = 0
    genome: NeuralNetwork
    constructor({
        genome
    }: {
        genome: NeuralNetwork
    }) {
        this.genome = genome;
    }
}

class Population {
    maxSpecies: number = 10
    species: Species[] = []
    genomes: NeuralNetwork[] = []
    generation: number = 0
    populationSize: number = 0
    brain: NeuralNetwork;
    best: NeuralNetwork;
    constructor({
        populationSize,
        brain
    }: {
        populationSize: number,
        brain: NeuralNetwork
    }) {
        this.brain = brain;
        this.populationSize = populationSize;
        for (let i = 0; i < populationSize; i++) {
            this.genomes.push(brain.clone());
        }
        this.best = this.genomes[0].clone();
    }

    nextGeneration() {
        // sort by fitness
        this.genomes.sort((a, b) => b.fitness - a.fitness);
        if (this.genomes[0].fitness > this.best.fitness) {
            this.best = this.genomes[0].clone();
            this.best.fitness = this.genomes[0].fitness;
        }
        // get top 30%
        const top30 = this.genomes.slice(0, Math.floor(this.genomes.length * 0.3));

        const rest70 = this.genomes.slice(Math.floor(this.genomes.length * 0.3), this.genomes.length);
        // crossover top 30%
        const newGenomes = [];
        for (let i = 0; i < this.populationSize * 0.3; i++) {
            const parentA = top30[Math.floor(Math.random() * top30.length)];
            const parentB = top30[Math.floor(Math.random() * top30.length)];
            const child = parentA.crossover(parentB);

            newGenomes.push(child);
        }

        // mutate rest70
        for (let i = 0; i < rest70.length; i++) {
            rest70[i].mutate(0.3, 0.2);
        }
        // add new genomes to genomes
        this.genomes = [...newGenomes, ...rest70];

        this.generation++;
    }
}

export default Population;