class Segment {
    constructor(p1, p2) {
        this.p1 = p1;
        this.p2 = p2;
    }

    equals(other) {
        return this.includes(other.p1) && this.includes(other.p2);
    }

    includes(point) {
        return this.p1.equals(point) || this.p2.equals(point);
    }

    length() {
        return distance(this.p1, this.p2);
    }

    directionVector() {
        return normalize(subtract(this.p2, this.p1));
    }

    projectPoint(point) { //closest point on the segment, and how far along it is (0 to 1)
        const a = subtract(point, this.p1);
        const b = subtract(this.p2, this.p1);
        const lengthSq = dot(b, b);
        const offset = lengthSq == 0 ? 0 : Math.max(0, Math.min(1, dot(a, b) / lengthSq));
        return {point: add(this.p1, scale(b, offset)), offset};
    }

    distanceToPoint(point) {
        return distanceToSegment(point, this.p1, this.p2);
    }

    draw(ctx, {width = 2, color = "black", dash = []} = {}) {
        ctx.beginPath();
        ctx.lineWidth = width;
        ctx.strokeStyle = color;
        ctx.setLineDash(dash);
        ctx.moveTo(this.p1.x, this.p1.y);
        ctx.lineTo(this.p2.x, this.p2.y);
        ctx.stroke();
        ctx.setLineDash([]);
    }
}
