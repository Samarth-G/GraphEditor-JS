function getNearestPoint(click, points, boundary) {
    let minDist = Number.MAX_VALUE;
    let nearest = null;

    for (const point of points) {
        const dist = distance(point, click);
        if (dist < minDist && dist < boundary) {
            minDist = dist;
            nearest = point;
        }
    }
    return nearest;
}

function distance(p1, p2) {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y);
}

function add(p1, p2) {
    return new Point(p1.x + p2.x, p1.y + p2.y);
}

function subtract(p1, p2) {
    return new Point(p1.x - p2.x, p1.y - p2.y);
}

function scale(point, scale) {
    return new Point(point.x * scale, point.y * scale);
}

function dot(p1, p2) {
    return p1.x * p2.x + p1.y * p2.y;
}

function magnitude(point) {
    return Math.hypot(point.x, point.y);
}

function normalize(point) {
    const mag = magnitude(point);
    return mag == 0 ? new Point(0, 0) : scale(point, 1 / mag);
}

function perpendicular(point) { //rotated 90 degrees clockwise on screen (y points down)
    return new Point(-point.y, point.x);
}

function average(p1, p2) {
    return new Point((p1.x + p2.x) / 2, (p1.y + p2.y) / 2);
}

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function lerp2D(p1, p2, t) {
    return new Point(lerp(p1.x, p2.x, t), lerp(p1.y, p2.y, t));
}

function moveTowards(value, target, step) {
    if (value < target) return Math.min(target, value + step);
    return Math.max(target, value - step);
}

function random(min, max) {
    return min + Math.random() * (max - min);
}

function randomItem(items) {
    return items[Math.floor(Math.random() * items.length)];
}

function distanceToSegment(point, a, b) {
    const abx = b.x - a.x;
    const aby = b.y - a.y;
    const lengthSq = abx * abx + aby * aby;
    let t = lengthSq == 0 ? 0 : ((point.x - a.x) * abx + (point.y - a.y) * aby) / lengthSq;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(point.x - (a.x + abx * t), point.y - (a.y + aby * t));
}

function getIntersection(A, B, C, D) { //intersection of segments AB and CD, or null
    const tTop = (D.x - C.x) * (A.y - C.y) - (D.y - C.y) * (A.x - C.x);
    const uTop = (C.y - A.y) * (A.x - B.x) - (C.x - A.x) * (A.y - B.y);
    const bottom = (D.y - C.y) * (B.x - A.x) - (D.x - C.x) * (B.y - A.y);

    if (bottom != 0) {
        const t = tTop / bottom;
        const u = uTop / bottom;
        if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
            return {x: lerp(A.x, B.x, t), y: lerp(A.y, B.y, t), offset: t};
        }
    }
    return null;
}

function getFake3dPoint(point, viewPoint, height, camHeight) { //perspective projection from a camera above viewPoint
    const k = height / Math.max(1, camHeight - height);
    return new Point(
        point.x + (point.x - viewPoint.x) * k,
        point.y + (point.y - viewPoint.y) * k);
}
