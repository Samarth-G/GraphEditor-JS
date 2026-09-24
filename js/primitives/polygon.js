class Polygon {
    constructor(points) {
        this.points = points;
    }

    static rectangle(center, width, depth, angle) { //width runs along angle, depth across it
        const along = new Point(Math.cos(angle), Math.sin(angle));
        const across = perpendicular(along);
        const hw = width / 2;
        const hd = depth / 2;
        return new Polygon([
            add(center, add(scale(along, -hw), scale(across, -hd))),
            add(center, add(scale(along, hw), scale(across, -hd))),
            add(center, add(scale(along, hw), scale(across, hd))),
            add(center, add(scale(along, -hw), scale(across, hd)))
        ]);
    }

    static convexHull(points) { //monotone chain
        const sorted = [...points].sort((a, b) => a.x - b.x || a.y - b.y);
        const cross = (o, a, b) => (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
        const lower = [];
        for (const p of sorted) {
            while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
            lower.push(p);
        }
        const upper = [];
        for (const p of sorted.reverse()) {
            while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
            upper.push(p);
        }
        return new Polygon([...lower.slice(0, -1), ...upper.slice(0, -1)]);
    }

    edges() {
        const edges = [];
        for (let i = 0; i < this.points.length; i++) {
            edges.push([this.points[i], this.points[(i + 1) % this.points.length]]);
        }
        return edges;
    }

    centroid() {
        let x = 0;
        let y = 0;
        for (const p of this.points) {
            x += p.x;
            y += p.y;
        }
        return new Point(x / this.points.length, y / this.points.length);
    }

    containsPoint(point) { //ray casting
        let inside = false;
        const pts = this.points;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
            const a = pts[i];
            const b = pts[j];
            if ((a.y > point.y) != (b.y > point.y) &&
                point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x) {
                inside = !inside;
            }
        }
        return inside;
    }

    intersectsPolygon(other) {
        for (const [a, b] of this.edges()) {
            for (const [c, d] of other.edges()) {
                if (getIntersection(a, b, c, d)) {
                    return true;
                }
            }
        }
        return this.containsPoint(other.points[0]) || other.containsPoint(this.points[0]);
    }

    distanceToPoint(point) {
        let min = Number.MAX_VALUE;
        for (const [a, b] of this.edges()) {
            min = Math.min(min, distanceToSegment(point, a, b));
        }
        return min;
    }

    distanceToSegment(p1, p2) {
        for (const [a, b] of this.edges()) {
            if (getIntersection(a, b, p1, p2)) {
                return 0;
            }
        }
        if (this.containsPoint(p1)) {
            return 0;
        }
        let min = Math.min(this.distanceToPoint(p1), this.distanceToPoint(p2));
        for (const p of this.points) {
            min = Math.min(min, distanceToSegment(p, p1, p2));
        }
        return min;
    }

    draw(ctx, {fill = "rgba(0, 0, 255, 0.3)", stroke = null, lineWidth = 1} = {}) {
        ctx.beginPath();
        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length; i++) {
            ctx.lineTo(this.points[i].x, this.points[i].y);
        }
        ctx.closePath();
        if (fill) {
            ctx.fillStyle = fill;
            ctx.fill();
        }
        if (stroke) {
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = stroke;
            ctx.lineJoin = "round";
            ctx.stroke();
        }
    }
}
