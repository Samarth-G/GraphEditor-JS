const LIGHT_DIRECTION = normalize(new Point(-1, -1.5));

class Building {
    constructor({center, width, depth, angle, height, roofHeight = 0, wallColor, roofColor}) {
        this.center = center;
        this.width = width;
        this.depth = depth;
        this.angle = angle;
        this.height = height;
        this.roofHeight = roofHeight; //0 = flat roof, otherwise a pitched (gable) roof
        this.wallColor = wallColor;
        this.roofColor = roofColor;

        this.base = Polygon.rectangle(center, width, depth, angle);
        this.radius = Math.hypot(width, depth) / 2;
    }

    static load(saved) {
        return new Building({...saved, center: new Point(saved.center.x, saved.center.y)});
    }

    toJSON() {
        return {
            center: {x: this.center.x, y: this.center.y},
            width: this.width,
            depth: this.depth,
            angle: this.angle,
            height: this.height,
            roofHeight: this.roofHeight,
            wallColor: this.wallColor,
            roofColor: this.roofColor
        };
    }

    #shade(ctx, polygon, normal) { //darken faces that point away from the light
        const light = (dot(normal, LIGHT_DIRECTION) + 1) / 2;
        polygon.draw(ctx, {fill: `rgba(0, 0, 0, ${0.45 * (1 - light)})`});
    }

    #outwardNormal(a, b) {
        const normal = normalize(perpendicular(subtract(b, a)));
        return dot(normal, subtract(average(a, b), this.center)) < 0 ? scale(normal, -1) : normal;
    }

    draw(ctx, viewPoint, camHeight) {
        const base = this.base.points;
        const top = base.map((p) => getFake3dPoint(p, viewPoint, this.height, camHeight));
        const pitched = this.roofHeight > 0;

        //the ridge of a pitched roof runs along the longer side, so the short sides are gables
        const gableEdges = this.width >= this.depth ? [1, 3] : [0, 2];
        const ridge = {};
        if (pitched) {
            for (const i of gableEdges) {
                const mid = average(base[i], base[(i + 1) % 4]);
                ridge[i] = getFake3dPoint(mid, viewPoint, this.height + this.roofHeight, camHeight);
            }
        }

        //shadow cast by the whole block, away from the light
        const shadowOffset = scale(LIGHT_DIRECTION, -this.height * 0.3);
        Polygon.convexHull([...base, ...base.map((p) => add(p, shadowOffset))])
            .draw(ctx, {fill: "rgba(0, 0, 0, 0.2)"});

        //walls, farthest first so nearer ones cover them
        const walls = [];
        for (let i = 0; i < 4; i++) {
            const j = (i + 1) % 4;
            const points = pitched && ridge[i] ?
                [base[i], base[j], top[j], ridge[i], top[i]] :
                [base[i], base[j], top[j], top[i]];
            walls.push({
                polygon: new Polygon(points),
                normal: this.#outwardNormal(base[i], base[j]),
                dist: distance(average(base[i], base[j]), viewPoint)
            });
        }
        walls.sort((a, b) => b.dist - a.dist);
        for (const wall of walls) {
            wall.polygon.draw(ctx, {fill: this.wallColor, stroke: "rgba(0, 0, 0, 0.25)"});
            this.#shade(ctx, wall.polygon, wall.normal);
        }

        if (!pitched) {
            const roof = new Polygon(top);
            roof.draw(ctx, {fill: this.roofColor, stroke: "rgba(0, 0, 0, 0.3)"});
            const centroid = roof.centroid();
            new Polygon(top.map((p) => lerp2D(centroid, p, 0.82)))
                .draw(ctx, {fill: null, stroke: "rgba(0, 0, 0, 0.18)", lineWidth: 2}); //parapet
            return;
        }

        const slopes = [];
        for (let i = 0; i < 4; i++) {
            if (gableEdges.includes(i)) continue;
            const j = (i + 1) % 4;
            slopes.push({
                polygon: new Polygon([top[i], top[j], ridge[j], ridge[(i + 3) % 4]]),
                normal: this.#outwardNormal(base[i], base[j]),
                dist: distance(average(base[i], base[j]), viewPoint)
            });
        }
        slopes.sort((a, b) => b.dist - a.dist);
        for (const slope of slopes) {
            slope.polygon.draw(ctx, {fill: this.roofColor, stroke: "rgba(0, 0, 0, 0.35)"});
            this.#shade(ctx, slope.polygon, slope.normal);
        }
    }
}
