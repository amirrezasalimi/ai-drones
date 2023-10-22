import p5 from "p5";

const drawScoreGraph = ({
    position,
    size,
    p5,
    scores
}: {
    position: p5.Vector,
    size: [number, number],
    p5: p5,
    scores: {
        // label: scores[],
        [key: string]: {
            color: string,
            scores: number[]
        }
    }
}) => {
    const graphSize = size;
    const graphPosition = position;

    p5.push();

    // draw bg
    p5.noStroke();
    p5.fill(0);
    const entries = Object.entries(scores);
    entries.forEach(([label, item], i) => {
        const { color } = item;
        // show lebel on left
        p5.fill(color);
        p5.textSize(14);
        p5.text(label, graphPosition.x + 10, graphPosition.y + 20 + i * 20);



    });
    entries.forEach(([, item]) => {
        const { color, scores } = item;
        for (let i = 0; i < scores.length; i++) {
            const graphPoints: p5.Vector[] = [];

            // find graph points
            for (let i = 0; i < scores.length; i++) {
                const score = scores[i];
                const x = p5.map(i, 0, scores.length, graphPosition.x, graphPosition.x + graphSize[0]);
                const maxY = Math.max(...scores);
                const y = p5.map(score, 0, maxY, graphPosition.y + graphSize[1], graphPosition.y);
                graphPoints.push(p5.createVector(x, y));
            }
            p5.stroke(color);
            p5.strokeWeight(1);
            p5.noFill();
            p5.beginShape();
            p5.curveVertex(graphPosition.x, graphPosition.y + graphSize[1] / 2);
            for (let i = 0; i < graphPoints.length; i++) {
                const point = graphPoints[i];
                p5.curveVertex(point.x, point.y);
            }
            p5.curveVertex(graphPosition.x + graphSize[0], graphPosition.y + graphSize[1] / 2);
            p5.endShape();

            // draw points
            p5.noStroke();
            for (let i = 0; i < graphPoints.length; i++) {
                const point = graphPoints[i];
                p5.fill(color);
                p5.circle(point.x, point.y, 5);
            }
        }
    });


    p5.pop();
}

export default drawScoreGraph;