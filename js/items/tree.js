class Tree {
    constructor(center, size, {height = size * random(2.8, 4.2), hue = random(95, 135), noise = null} = {}) {
        this.center = center;
        this.size = size;
        this.height = height;
        this.hue = hue;
        this.noise = noise || Array.from({length: 10}, () => random(0.75, 1.1)); //makes each canopy lumpy in its own way
        this.radius = size;
    }

    static load(saved) {
        return new Tree(new Point(saved.center.x, saved.center.y), saved.size, saved);
    }

    toJSON() {
        return {
            center: {x: this.center.x, y: this.center.y},
            size: this.size,
            height: this.height,
            hue: this.hue,
            noise: this.noise
        };
    }

    draw(ctx, viewPoint, camHeight) {
        const {center, size} = this;

        ctx.beginPath();
        ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
        ctx.arc(center.x + size * 0.3, center.y + size * 0.4, size, 0, 2 * Math.PI);
        ctx.fill();

        const trunkTop = getFake3dPoint(center, viewPoint, this.height * 0.35, camHeight);
        ctx.beginPath();
        ctx.moveTo(center.x, center.y);
        ctx.lineTo(trunkTop.x, trunkTop.y);
        ctx.lineWidth = size * 0.3;
        ctx.lineCap = "round";
        ctx.strokeStyle = "#5d4037";
        ctx.stroke();

        const levels = 5;
        const n = this.noise.length;
        for (let level = 0; level < levels; level++) {
            const t = level / (levels - 1);
            const c = getFake3dPoint(center, viewPoint, lerp(this.height * 0.3, this.height, t), camHeight);
            const radius = lerp(size, size * 0.3, t);

            ctx.beginPath();
            for (let i = 0; i < n; i++) {
                const angle = i / n * 2 * Math.PI + level * 0.6;
                const r = radius * this.noise[(i + level) % n];
                ctx.lineTo(c.x + Math.cos(angle) * r, c.y + Math.sin(angle) * r);
            }
            ctx.closePath();
            ctx.fillStyle = `hsl(${this.hue}, 45%, ${lerp(20, 42, t)}%)`;
            ctx.fill();
        }
    }
}
