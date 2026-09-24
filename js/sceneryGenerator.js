const ZONES = {
    city: { //tall flat-roofed blocks packed along the road, two rows deep
        width: [40, 85], depth: [40, 75], height: [60, 180], roofHeight: [0, 0],
        gap: [8, 12], spacing: [6, 14], rows: 2, rowGap: 10,
        colors: () => {
            const hue = randomItem([210, 215, 30, 40, 0]);
            const sat = hue == 0 ? 0 : random(10, 30);
            return {
                wallColor: `hsl(${hue}, ${sat}%, ${random(55, 78)}%)`,
                roofColor: `hsl(${hue}, ${sat * 0.5}%, ${random(38, 55)}%)`
            };
        }
    },
    suburb: { //small houses with pitched roofs and gardens between them
        width: [26, 40], depth: [22, 32], height: [14, 22], roofHeight: [10, 16],
        gap: [14, 24], spacing: [14, 34], rows: 1, rowGap: 0,
        colors: () => ({
            wallColor: `hsl(${random(30, 50)}, ${random(25, 50)}%, ${random(76, 90)}%)`,
            roofColor: Math.random() < 0.7 ?
                `hsl(${random(0, 22)}, ${random(40, 60)}%, ${random(30, 45)}%)` :
                `hsl(210, 10%, ${random(28, 40)}%)`
        })
    }
};

const TREE_SETTINGS = { //cellArea: how much ground each planting attempt covers
    city: {cellArea: 2500, size: [8, 13], max: 800},
    suburb: {cellArea: 700, size: [9, 16], max: 2500},
    mixed: {cellArea: 800, size: [9, 16], max: 2500},
    forest: {cellArea: 220, size: [10, 18], max: 4000}
};

class SceneryGenerator {
    constructor(world) {
        this.world = world;
    }

    generate(style = "mixed") { //replaces the current buildings and trees
        const world = this.world;
        world.refresh();
        world.buildings.length = 0;
        world.trees.length = 0;

        const points = world.graph.points;
        if (points.length == 0) {
            return false;
        }

        const center = new Point(
            points.reduce((sum, p) => sum + p.x, 0) / points.length,
            points.reduce((sum, p) => sum + p.y, 0) / points.length);
        const maxDist = Math.max(1, ...points.map((p) => distance(p, center)));
        const downtown = (point) => distance(point, center) / maxDist < 0.45; //for mixed: city core, suburbs outside

        if (style != "forest") {
            for (const seg of world.graph.segments) {
                let zone = style;
                if (style == "mixed") {
                    zone = downtown(average(seg.p1, seg.p2)) ? "city" : "suburb";
                }
                this.#lineRoadWithBuildings(seg, ZONES[zone]);
            }
        }
        this.#plantTrees(TREE_SETTINGS[style], style == "mixed" ? downtown : null);
        return true;
    }

    #lineRoadWithBuildings(seg, zone) {
        const length = seg.length();
        const dir = seg.directionVector();
        const across = perpendicular(dir);
        const angle = Math.atan2(dir.y, dir.x);

        for (const side of [-1, 1]) {
            for (let row = 0; row < zone.rows; row++) {
                let t = random(0, zone.spacing[1]);
                while (t < length) {
                    const width = random(...zone.width);
                    const depth = random(...zone.depth);
                    const offset = this.world.roadWidth / 2 + random(...zone.gap) +
                        row * (zone.depth[1] + zone.rowGap) + depth / 2;
                    const center = add(add(seg.p1, scale(dir, t + width / 2)), scale(across, side * offset));
                    const building = new Building({
                        center, width, depth, angle,
                        height: random(...zone.height),
                        roofHeight: random(...zone.roofHeight),
                        ...zone.colors()
                    });
                    if (this.#canPlaceBuilding(building)) {
                        this.world.buildings.push(building);
                        t += width + random(...zone.spacing);
                    } else {
                        t += 10;
                    }
                }
            }
        }
    }

    #canPlaceBuilding(building) {
        if (this.world.polygonClearance(building.base) < 6) {
            return false;
        }
        const padded = Polygon.rectangle(building.center, building.width + 6, building.depth + 6, building.angle);
        for (const other of this.world.buildings) {
            if (distance(other.center, building.center) < other.radius + building.radius + 6 &&
                padded.intersectsPolygon(other.base)) {
                return false;
            }
        }
        return true;
    }

    #plantTrees(settings, downtown) {
        const world = this.world;
        const margin = 220;
        const xs = world.graph.points.map((p) => p.x);
        const ys = world.graph.points.map((p) => p.y);
        const left = Math.min(...xs) - margin;
        const right = Math.max(...xs) + margin;
        const top = Math.min(...ys) - margin;
        const bottom = Math.max(...ys) + margin;

        const attempts = Math.min(settings.max * 3, (right - left) * (bottom - top) / settings.cellArea);
        const cellSize = 40;
        const grid = new Map(); //spatial hash so spacing checks stay fast
        const key = (cx, cy) => cx + "," + cy;

        for (let i = 0; i < attempts && world.trees.length < settings.max; i++) {
            const p = new Point(random(left, right), random(top, bottom));
            const size = random(...settings.size);

            if (downtown && downtown(p) && Math.random() < 0.75) continue; //few trees downtown
            if (world.distanceToRoad(p) < size * 0.8 + 4) continue;

            let blocked = false;
            for (const b of world.buildings) {
                if (distance(b.center, p) < b.radius + size + 4 &&
                    (b.base.containsPoint(p) || b.base.distanceToPoint(p) < size * 0.7 + 2)) {
                    blocked = true;
                    break;
                }
            }
            if (blocked) continue;

            const cx = Math.floor(p.x / cellSize);
            const cy = Math.floor(p.y / cellSize);
            for (let gx = cx - 1; gx <= cx + 1 && !blocked; gx++) {
                for (let gy = cy - 1; gy <= cy + 1 && !blocked; gy++) {
                    for (const other of grid.get(key(gx, gy)) || []) {
                        if (distance(other.center, p) < (other.size + size) * 0.8) {
                            blocked = true;
                            break;
                        }
                    }
                }
            }
            if (blocked) continue;

            const tree = new Tree(p, size);
            world.trees.push(tree);
            if (!grid.has(key(cx, cy))) grid.set(key(cx, cy), []);
            grid.get(key(cx, cy)).push(tree);
        }
    }
}
