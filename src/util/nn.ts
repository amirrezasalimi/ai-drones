import P5 from "p5";
// utils

// -1 , 1
const randWeight = () => Math.random() * 2 - 1;

class NeuralNetwork {
    public fitness: number = 0;
    private layers: number[] = [];
    private weights: number[][][] = [];
    private biases: number[][] = [];

    constructor(layerSizes: number[]) {
        if (layerSizes.length < 2) {
            throw new Error("Network must have at least input and output layers.");
        }

        this.layers = layerSizes;

        for (let i = 1; i < layerSizes.length; i++) {
            const inputSize = layerSizes[i - 1];
            const outputSize = layerSizes[i];

            const layerWeights: number[][] = [];
            const layerBiases: number[] = [];

            for (let j = 0; j < outputSize; j++) {
                const neuronWeights: number[] = [];
                for (let k = 0; k < inputSize; k++) {
                    // Initialize weights with small random values
                    neuronWeights.push(randWeight());
                }
                layerWeights.push(neuronWeights);
                // Initialize biases with small random values
                layerBiases.push(randWeight());
            }

            this.weights.push(layerWeights);
            this.biases.push(layerBiases);
        }
    }
    public toJson() {
        return {
            layers: this.layers,
            weights: this.weights,
            biases: this.biases,
        }
    }
    public static fromJson(json: any) {
        const nn = new NeuralNetwork(json.layers);
        nn.weights = json.weights;
        nn.biases = json.biases;
        return nn;
    }
    public mutate(rate: number, amount: number = 0.1): void {
        for (let i = 0; i < this.weights.length; i++) {
            const layerWeights = this.weights[i];
            const layerBiases = this.biases[i];

            for (let j = 0; j < layerWeights.length; j++) {
                for (let k = 0; k < layerWeights[j].length; k++) {
                    if (Math.random() < rate) {
                        // Apply mutation (uniform or Gaussian)
                        const mutationValue = randWeight() * amount;
                        layerWeights[j][k] += mutationValue;
                    }
                }

                if (Math.random() < rate) {
                    // Apply mutation to biases (uniform or Gaussian)
                    const mutationValue = randWeight() * amount
                    layerBiases[j] += mutationValue;
                }
            }
        }
    }

    clone(): NeuralNetwork {
        const clone = new NeuralNetwork(this.layers);
        for (let i = 0; i < this.weights.length; i++) {
            const layerWeights = this.weights[i];
            const layerBiases = this.biases[i];

            for (let j = 0; j < layerWeights.length; j++) {
                for (let k = 0; k < layerWeights[j].length; k++) {
                    clone.weights[i][j][k] = layerWeights[j][k];
                }

                clone.biases[i][j] = layerBiases[j];
            }
        }

        return clone;
    }
    // crossover
    crossover(partner: NeuralNetwork): NeuralNetwork {
        const child = new NeuralNetwork(this.layers);

        for (let i = 0; i < this.weights.length; i++) {
            const layerWeights = this.weights[i];
            const layerBiases = this.biases[i];

            for (let j = 0; j < layerWeights.length; j++) {
                for (let k = 0; k < layerWeights[j].length; k++) {
                    if (Math.random() < 0.5) {
                        child.weights[i][j][k] = layerWeights[j][k];
                    } else {
                        child.weights[i][j][k] = partner.weights[i][j][k];
                    }
                }

                if (Math.random() < 0.5) {
                    child.biases[i][j] = layerBiases[j];
                } else {
                    child.biases[i][j] = partner.biases[i][j];
                }
            }
        }
        return child;
    }



    private sigmoid(x: number): number {
        return 1 / (1 + Math.exp(-x));
    }

    private feedForward(inputData: number[]): number[] {
        let layerOutput = inputData;
        for (let i = 0; i < this.layers.length - 1; i++) {
            const layerWeights = this.weights[i];
            const layerBiases = this.biases[i];

            const nextLayerSize = this.layers[i + 1];
            const nextLayerOutput: number[] = new Array(nextLayerSize).fill(0);

            for (let j = 0; j < nextLayerSize; j++) {
                let sum = 0;
                for (let k = 0; k < layerOutput.length; k++) {
                    sum += layerOutput[k] * layerWeights[j][k];
                }
                sum += layerBiases[j];
                nextLayerOutput[j] = this.sigmoid(sum);
            }

            layerOutput = nextLayerOutput;
        }

        return layerOutput;
    }

    public predict(inputData: number[]): number[] {
        if (inputData.length !== this.layers[0]) {
            throw new Error("Input size does not match network input size.");
        }

        return this.feedForward(inputData);
    }

    visualize(p5: P5) {
        const neuronPos: Record<string, number[]> = {};


        // find neurons positions
        for (let i = 0; i < this.layers.length; i++) {
            const layerSize = this.layers[i];
            for (let j = 0; j < layerSize; j++) {
                const x = (p5.width / (this.layers.length + 1)) * (i + 1);
                const y = (p5.height / (layerSize + 1)) * (j + 1);
                neuronPos[`${i},${j}`] = [x, y];
            }
        }

        p5.noFill();
        p5.stroke("green");
        // draw weights as lines
        for (let i = 0; i < this.weights.length; i++) {
            const layerWeights = this.weights[i];
            for (let j = 0; j < layerWeights.length; j++) {
                const neuronWeights = layerWeights[j];
                for (let k = 0; k < neuronWeights.length; k++) {
                    const weight = neuronWeights[k];
                    const x1 = neuronPos[`${i},${k}`][0];
                    const y1 = neuronPos[`${i},${k}`][1];
                    const x2 = neuronPos[`${i + 1},${j}`][0];
                    const y2 = neuronPos[`${i + 1},${j}`][1];
                    // p5.stroke(color);
                    p5.strokeWeight(p5.map(Math.abs(weight), 0, 1, 1, 5));
                    p5.line(x1, y1, x2, y2);
                }
            }
        }

        // draw neurons as rect
        p5.noStroke();
        for (let i = 0; i < this.layers.length; i++) {
            const layerSize = this.layers[i];
            for (let j = 0; j < layerSize; j++) {
                const x = neuronPos[`${i},${j}`][0];
                const y = neuronPos[`${i},${j}`][1];
                p5.fill(255);
                const neuronSize = p5.width / 35;

                p5.rect(x - neuronSize / 2, y - neuronSize / 2, neuronSize, neuronSize);
            }
        }
    }
}

export default NeuralNetwork;