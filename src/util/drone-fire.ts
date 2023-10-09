import p5 from "p5";

class DroneFire {
    position: p5.Vector;
    p: p5;
    particles: Particle[] = [];
    power: number = 1;
    constructor({
        p,
        position,
    }: {
        p: p5
        position: p5.Vector
    }) {
        this.p = p;
        this.position = position;

    }
    update() {
        const { p, particles } = this;

        for (let i = 0; i < this.power * 2; i++) {
            let _p = new Particle(p);
            _p.x = this.position.x;
            _p.y = this.position.y;
            particles.push(_p);
        }
        for (let i = particles.length - 1; i >= 0; i--) {
            particles[i].update();
            particles[i].show();
            if (particles[i].finished()) {
                particles.splice(i, 1);
            }
        }
    }

}


class Particle {
    p: p5;
    x: number = 0;
    y: number = 0;
    vx: number;
    vy: number;
    alpha: number;
    d: number;

    constructor(p: p5) {
        this.p = p;
        this.vx = p.random(-1, 1);
        this.vy = p.random(-5, -1);
        this.alpha = 255;
        this.d = 6;
    }

    finished() {
        return this.alpha < 0;
    }

    update() {
        this.x += this.vx;
        this.y -= this.vy;
        this.alpha -= 20;
        this.d -= this.p.random(0.01, 0.1);
    }

    show() {
        const { p } = this;
        this.p.noStroke();


        // const a = p.map(this.alpha, 0, 255, 0.2, 0.);
        // const color = `rgba(90, 34, 139,${a})`;
        // this.p.fill(color);

        this.p.fill(p.random(200, 230), p.random(50, 150), 10, this.alpha);
        p.ellipse(this.x, this.y, this.d);
    }
}

export default DroneFire;