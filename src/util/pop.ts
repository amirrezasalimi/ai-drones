import NeuralNetwork from "./nn";

class Population {
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
            const b = brain.clone();
            b.mutate(0.3, 0.2);
            this.genomes.push(b);
        }
        this.best = this.genomes[0].clone();
    }

    tournamentSelection(): NeuralNetwork {
        const tops = this.genomes.slice(0, Math.floor(this.genomes.length * 0.2));
        const tournamentSize = 4;
        const tournament = [];
        for (let i = 0; i < tournamentSize; i++) {
            tournament.push(tops[Math.floor(Math.random() * tops.length)]);
        }
        tournament.sort((a, b) => b.fitness - a.fitness);
        return tournament[0];
    }
    wheelSelection(): NeuralNetwork {
        const totalFitness = this.genomes.reduce((prev, curr) => prev + curr.fitness, 0);
        const random = Math.random() * totalFitness;
        let current = 0;
        for (let i = 0; i < this.genomes.length; i++) {
            current += this.genomes[i].fitness;
            if (current > random) {
                return this.genomes[i];
            }
        }
        return this.genomes[0];
    }
    nextGeneration() {
        // sort by fitness
        this.genomes.sort((a, b) => b.fitness - a.fitness);
        const tournament_best = this.tournamentSelection();
        this.best = tournament_best.clone();
        this.best.fitness = tournament_best.fitness;
        const ellitRatio = 0.3;

        // get top 30%
        const tops = this.genomes.slice(0, Math.floor(this.genomes.length * ellitRatio));

        const restSize = this.genomes.length - tops.length;
        // crossover tops
        const newGenomes = [];
        for (let i = 0; i < this.populationSize * ellitRatio; i++) {
            const parentA = this.wheelSelection();
            const parentB = this.wheelSelection();

            let child: NeuralNetwork;
            if (parentA.fitness == 0 && parentB.fitness == 0) {
                child = parentA.clone();
                child.mutate(0.5, 0.1);
            } else {
                child = parentA.crossover(parentB);
            }
            // calc needed mutation rate , amount based on fitness
            // const mutationRate = 0.3;
            // const mutationAmount = (1 / Math.sqrt(
            //     (parentA.fitness + parentB.fitness)
            // )) / 6;
            // console.log(
            //     "mutationRate:", mutationAmount
            // );

            // child.mutate(0.3, 0.1);
            newGenomes.push(child);
        }

        // mutate rest
        for (let i = 0; i < restSize; i++) {
            const newBaby = this.best.clone();
            newBaby.mutate(0.5, 0.2);
            newGenomes.push(newBaby);
        }
        newGenomes[0] = this.genomes[0].clone();
        // add new genomes to genomes
        this.genomes = [...newGenomes];

        this.generation++;
    }

}

export default Population;