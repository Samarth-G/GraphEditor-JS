class World {
    constructor(graph, {roadWidth = 40} = {}) {
        this.graph = graph;
        this.roadWidth = roadWidth;
        this.roundaboutRadius = roadWidth * 1.05;
        this.islandRadius = roadWidth * 0.45;

        this.buildings = [];
        this.trees = [];
        this.cars = [];
        this.activeCar = null;

        this.nodes = []; //each graph point with its role: roundabout, turn, dead end...
        this.signature = null;
        this.refresh();
    }

    static load(graph, saved) {
        const world = new World(graph);
        world.buildings = (saved.buildings || []).map((b) => Building.load(b));
        world.trees = (saved.trees || []).map((t) => Tree.load(t));
        world.cars = (saved.cars || []).map((c) => Car.load(c));
        world.activeCar = world.cars[saved.activeCar] || world.cars[world.cars.length - 1] || null;
        world.pruneScenery(); //roads may have changed in the graph editor since this was saved
        return world;
    }

    toJSON() {
        return {
            buildings: this.buildings,
            trees: this.trees,
            cars: this.cars,
            activeCar: this.cars.indexOf(this.activeCar)
        };
    }

    #computeSignature() {
        const points = this.graph.points.map((p) => p.x + "," + p.y).join(";");
        const segments = this.graph.segments.map((s) => s.p1.x + "," + s.p1.y + ">" + s.p2.x + "," + s.p2.y).join(";");
        return points + "|" + segments;
    }

    refresh() { //rebuilds road data whenever the graph was edited
        const signature = this.#computeSignature();
        if (signature == this.signature) return;
        this.signature = signature;

        this.nodes = this.graph.points.map((point) => {
            const degree = this.graph.segmentsOfPoint(point).length;
            return {point, degree, roundabout: degree >= 3};
        });
        this.pruneScenery();
    }

    pruneScenery() { //anything a road now runs through gets bulldozed
        this.buildings = this.buildings.filter((b) => this.polygonClearance(b.base) >= 2);
        this.trees = this.trees.filter((t) => this.distanceToRoad(t.center) >= t.size * 0.5);
    }

    clear() {
        this.buildings.length = 0;
        this.trees.length = 0;
        this.cars.length = 0;
        this.activeCar = null;
    }

    nodeRadius(node) {
        return node.roundabout ? this.roundaboutRadius : this.roadWidth / 2;
    }

    distanceToRoad(point) { //negative when the point is on the road
        let min = Number.MAX_VALUE;
        for (const seg of this.graph.segments) {
            min = Math.min(min, seg.distanceToPoint(point) - this.roadWidth / 2);
        }
        for (const node of this.nodes) {
            min = Math.min(min, distance(point, node.point) - this.nodeRadius(node));
        }
        return min;
    }

    polygonClearance(polygon) { //gap between a polygon and the nearest road
        let min = Number.MAX_VALUE;
        for (const seg of this.graph.segments) {
            min = Math.min(min, polygon.distanceToSegment(seg.p1, seg.p2) - this.roadWidth / 2);
        }
        for (const node of this.nodes) {
            const dist = polygon.containsPoint(node.point) ? 0 : polygon.distanceToPoint(node.point);
            min = Math.min(min, dist - this.nodeRadius(node));
        }
        return min;
    }

    isOnRoad(point) {
        for (const node of this.nodes) {
            if (node.roundabout && distance(point, node.point) < this.islandRadius) {
                return false; //the grass island in the middle of a roundabout
            }
        }
        return this.distanceToRoad(point) <= 0;
    }

    overlapsObstacle(polygon, center, reach, {exclude = null, ignoreOverlapsOf = null} = {}) {
        const treeHit = (poly, tree) => poly.containsPoint(tree.center) || poly.distanceToPoint(tree.center) < tree.size * 0.35;

        for (const b of this.buildings) {
            if (distance(center, b.center) > b.radius + reach) continue;
            if (polygon.intersectsPolygon(b.base) && !(ignoreOverlapsOf && ignoreOverlapsOf.intersectsPolygon(b.base))) {
                return true;
            }
        }
        for (const t of this.trees) {
            if (distance(center, t.center) > t.size * 0.35 + reach) continue;
            if (treeHit(polygon, t) && !(ignoreOverlapsOf && treeHit(ignoreOverlapsOf, t))) {
                return true;
            }
        }
        for (const car of this.cars) {
            if (car == exclude || distance(center, car) > car.radius + reach) continue;
            if (polygon.intersectsPolygon(car.polygon) && !(ignoreOverlapsOf && ignoreOverlapsOf.intersectsPolygon(car.polygon))) {
                return true;
            }
        }
        return false;
    }

    collides(polygon, car) { //things the car is already stuck in are ignored so it can drive out
        return this.overlapsObstacle(polygon, polygon.centroid(), car.radius, {exclude: car, ignoreOverlapsOf: car.polygon});
    }

    getCarAt(point) {
        for (let i = this.cars.length - 1; i >= 0; i--) {
            if (this.cars[i].polygon.containsPoint(point)) {
                return this.cars[i];
            }
        }
        return null;
    }

    getCarPlacement(point) { //snaps a click to the right-hand lane of the nearest road
        let nearest = null;
        let minDist = Number.MAX_VALUE;
        for (const seg of this.graph.segments) {
            const dist = seg.distanceToPoint(point);
            if (dist < minDist) {
                minDist = dist;
                nearest = seg;
            }
        }
        if (!nearest || minDist > this.roadWidth / 2 + 6) {
            return null;
        }

        const projected = nearest.projectPoint(point).point;
        const dir = nearest.directionVector();
        const right = perpendicular(dir);
        const side = dot(subtract(point, projected), right) >= 0 ? 1 : -1;
        const position = add(projected, scale(right, side * this.roadWidth / 4));
        const angle = Math.atan2(dir.y * side, dir.x * side);

        const footprint = Polygon.rectangle(position, 30, 16, angle);
        const valid = this.isOnRoad(position) && !this.overlapsObstacle(footprint, position, 20);
        return {x: position.x, y: position.y, angle, valid};
    }

    addCar(car) {
        this.cars.push(car);
        this.activeCar = car;
    }

    removeCar(car) {
        this.cars.splice(this.cars.indexOf(car), 1);
        if (this.activeCar == car) {
            this.activeCar = this.cars[this.cars.length - 1] || null;
        }
    }

    setActiveCar(car) {
        this.activeCar = car;
    }

    cycleActiveCar() {
        if (this.cars.length == 0) return;
        const index = this.cars.indexOf(this.activeCar);
        this.activeCar = this.cars[(index + 1) % this.cars.length];
    }

    update(dt, controls) {
        this.refresh();
        for (const car of this.cars) {
            car.update(dt, car == this.activeCar ? controls : NO_INPUT, this);
        }
    }

    #strokeRoads(ctx, width, color) {
        ctx.beginPath();
        for (const seg of this.graph.segments) {
            ctx.moveTo(seg.p1.x, seg.p1.y);
            ctx.lineTo(seg.p2.x, seg.p2.y);
        }
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.setLineDash([]);
        ctx.stroke();
    }

    #fillNodes(ctx, extra, color) { //roundabouts and lone points; turns are covered by the round line caps
        ctx.beginPath();
        for (const node of this.nodes) {
            if (node.roundabout || node.degree == 0) {
                const r = this.nodeRadius(node) + extra;
                ctx.moveTo(node.point.x + r, node.point.y);
                ctx.arc(node.point.x, node.point.y, r, 0, 2 * Math.PI);
            }
        }
        ctx.fillStyle = color;
        ctx.fill();
    }

    #drawRoads(ctx) {
        const sidewalk = "#b9b3a8";
        const asphalt = "#3b3b3f";
        this.#strokeRoads(ctx, this.roadWidth + 10, sidewalk);
        this.#fillNodes(ctx, 5, sidewalk);
        this.#strokeRoads(ctx, this.roadWidth, asphalt);
        this.#fillNodes(ctx, 0, asphalt);

        for (const node of this.nodes) {
            if (!node.roundabout) continue;
            const {x, y} = node.point;
            ctx.beginPath();
            ctx.arc(x, y, this.islandRadius + 3, 0, 2 * Math.PI);
            ctx.fillStyle = "#e8e8e8"; //curb
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, this.islandRadius, 0, 2 * Math.PI);
            ctx.fillStyle = "#3f9b3f";
            ctx.fill();
            ctx.beginPath();
            ctx.arc(x, y, this.islandRadius * 0.5, 0, 2 * Math.PI);
            ctx.fillStyle = "#2c7a2c";
            ctx.fill();
        }

        //center lines, stopping at the edge of roundabouts
        const clipOf = (point) => {
            const node = this.nodes.find((n) => n.point == point);
            return node && node.roundabout ? this.roundaboutRadius : 0;
        };
        ctx.beginPath();
        for (const seg of this.graph.segments) {
            const length = seg.length();
            const start = clipOf(seg.p1);
            const end = length - clipOf(seg.p2);
            if (end <= start) continue;
            const dir = seg.directionVector();
            const a = add(seg.p1, scale(dir, start));
            const b = add(seg.p1, scale(dir, end));
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
        }
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
        ctx.lineCap = "butt";
        ctx.setLineDash([12, 10]);
        ctx.stroke();

        //give-way lines where roads enter a roundabout
        ctx.beginPath();
        for (const node of this.nodes) {
            if (!node.roundabout) continue;
            for (const seg of this.graph.segmentsOfPoint(node.point)) {
                const other = seg.p1 == node.point ? seg.p2 : seg.p1;
                const dir = normalize(subtract(other, node.point));
                const mid = add(node.point, scale(dir, this.roundaboutRadius + 2));
                const across = scale(perpendicular(dir), this.roadWidth / 2);
                ctx.moveTo(mid.x - across.x, mid.y - across.y);
                ctx.lineTo(mid.x + across.x, mid.y + across.y);
            }
        }
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
    }

    #drawNodes(ctx) {
        for (const node of this.nodes) {
            ctx.beginPath();
            ctx.arc(node.point.x, node.point.y, 7, 0, 2 * Math.PI);
            ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
            ctx.stroke();
        }
    }

    draw(ctx, viewPoint, {zoom = 1, bounds = null, showNodes = false} = {}) {
        this.#drawRoads(ctx);

        for (const car of this.cars) {
            car.draw(ctx, {active: car == this.activeCar});
        }

        const margin = 300; //tall things lean into view from off-screen
        const visible = (item) => !bounds || (
            item.center.x + item.radius + margin > bounds.left &&
            item.center.x - item.radius - margin < bounds.right &&
            item.center.y + item.radius + margin > bounds.top &&
            item.center.y - item.radius - margin < bounds.bottom);
        const distSq = (p) => (p.x - viewPoint.x) ** 2 + (p.y - viewPoint.y) ** 2;
        const items = [...this.buildings, ...this.trees]
            .filter(visible)
            .sort((a, b) => distSq(b.center) - distSq(a.center)); //farthest first
        const camHeight = 1400 * zoom;
        for (const item of items) {
            item.draw(ctx, viewPoint, camHeight);
        }

        if (showNodes) {
            this.#drawNodes(ctx);
        }
    }
}
