class Graph {
    constructor(points = [], segments = []) {
        this.points = points;
        this.segments = segments;
    }

    static load(saved) {
        const points = saved.points.map((i) => new Point(i.x, i.y));
        const segments = saved.segments.map((i) => new Segment(
            points.find((p) => p.equals(i.p1)),
            points.find((p) => p.equals(i.p2))
        ));
        return new Graph(points, segments);
    }

    addPoint(point) {
        this.points.push(point);
    }

    containsPoint(point) {
        return this.points.find((p) => p.equals(point));
    }

    tryAddPoint(point) {
        if (!this.containsPoint(point)) {
            this.addPoint(point);
            return true;
        }
        return false;
    }

    addSegment(seg) {
        this.segments.push(seg);
    }

    containsSegment(segment) { 
       return this.segments.find((p) => p.equals(segment));
    }

    tryAddSegment(seg) {
        if (!this.containsSegment(seg) && !seg.p1.equals(seg.p2)) {
            this.addSegment(seg);
            return true;
        }
        return false;
    }

    removePoint(point) {
        const segs = this.segmentsOfPoint(point);
        for (const seg of segs) {
            this.removeSegment(seg);
        }
        this.points.splice(this.points.indexOf(point), 1);
    }

    segmentsOfPoint(point) {
        const segs = [];
        for (const seg of this.segments) {
            if (seg.includes(point)) {
                segs.push(seg);
            }
        }
        return segs;
    }

    removeSegment(seg) {
        this.segments.splice(this.segments.indexOf(seg), 1);
    }

    clear() {
        this.points.length = 0;
        this.segments.length = 0;
    }

    draw(ctx) {
        for (const seg of this.segments) {
            seg.draw(ctx);
        }

        for (const pt of this.points) {
            pt.draw(ctx);
        }
    }
}