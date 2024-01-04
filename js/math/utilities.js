function getNearestPoint(click, points, boundary) {
    let minDist = Number.MAX_VALUE;
    let nearest = null;

    for (const point of points) {
        dist = distance(point, click);
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