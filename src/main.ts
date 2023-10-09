import './style.css'

import p5 from "p5";
import NeuralNetwork from "./util/nn";
import game from "./game";


const n=new NeuralNetwork([2,10,2]);

console.log(n);

const sketch = (p: p5) => {

    p.setup = () => {
        p.createCanvas(800, 600);
    };

    p.draw = () => {
        p.background(0);
        n.visualize(p);
    };
}

// new p5(sketch);
new p5(game);

 
