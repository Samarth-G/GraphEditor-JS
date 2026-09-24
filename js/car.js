const CAR_COLORS = ["#e53935", "#1e88e5", "#fdd835", "#43a047", "#fb8c00", "#8e24aa", "#eceff1", "#263238", "#00acc1"];

const NO_INPUT = {forward: false, reverse: false, left: false, right: false, brake: false};

class Car {
    constructor(x, y, angle, {color = randomItem(CAR_COLORS)} = {}) {
        this.x = x;
        this.y = y;
        this.angle = angle; //0 faces right, increases clockwise on screen
        this.color = color;

        this.length = 30;
        this.width = 16;
        this.radius = Math.hypot(this.length, this.width) / 2;

        this.speed = 0;
        this.acceleration = 0.12;
        this.brakePower = 0.25;
        this.friction = 0.04;
        this.maxSpeed = 4.5;
        this.maxReverse = 1.8;
        this.turnRate = 0.045;

        this.braking = false;
        this.offRoad = false;
        this.polygon = this.#createPolygon();
    }

    static load(saved) {
        return new Car(saved.x, saved.y, saved.angle, {color: saved.color});
    }

    toJSON() {
        return {x: this.x, y: this.y, angle: this.angle, color: this.color};
    }

    #createPolygon(x = this.x, y = this.y, angle = this.angle) {
        return Polygon.rectangle(new Point(x, y), this.length, this.width, angle);
    }

    update(dt, controls, world) {
        this.offRoad = !world.isOnRoad(this);
        const maxSpeed = this.offRoad ? this.maxSpeed * 0.45 : this.maxSpeed; //grass is slow
        this.braking = false;

        if (controls.forward) {
            this.speed += (this.speed < 0 ? this.brakePower : this.acceleration) * dt;
        }
        if (controls.reverse) {
            if (this.speed > 0) {
                this.speed -= this.brakePower * dt;
                this.braking = true;
            } else {
                this.speed -= this.acceleration * 0.6 * dt;
            }
        }
        if (controls.brake) {
            this.speed = moveTowards(this.speed, 0, this.brakePower * 1.6 * dt);
            this.braking = true;
        }
        if (!controls.forward && !controls.reverse) {
            this.speed = moveTowards(this.speed, 0, this.friction * (this.offRoad ? 3 : 1) * dt);
        }
        if (this.speed > maxSpeed) {
            this.speed = Math.max(maxSpeed, this.speed - 0.25 * dt);
        }
        this.speed = Math.max(this.speed, -Math.min(this.maxReverse, maxSpeed));

        //steering only works while rolling, and flips when reversing
        const steer = (controls.right ? 1 : 0) - (controls.left ? 1 : 0);
        if (steer != 0 && Math.abs(this.speed) > 0.02) {
            const grip = Math.min(1, Math.abs(this.speed) / 1.2);
            const angle = this.angle + steer * this.turnRate * grip * Math.sign(this.speed) * dt;
            if (!world.collides(this.#createPolygon(this.x, this.y, angle), this)) {
                this.angle = angle;
                this.polygon = this.#createPolygon();
            }
        }

        if (this.speed != 0) {
            const x = this.x + Math.cos(this.angle) * this.speed * dt;
            const y = this.y + Math.sin(this.angle) * this.speed * dt;
            const polygon = this.#createPolygon(x, y, this.angle);
            if (world.collides(polygon, this)) {
                this.speed *= -0.3; //bump
                if (Math.abs(this.speed) < 0.05) this.speed = 0;
            } else {
                this.x = x;
                this.y = y;
                this.polygon = polygon;
            }
        }
    }

    draw(ctx, {active = false, ghost = false, invalid = false} = {}) {
        const L = this.length;
        const W = this.width;

        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        if (ghost) ctx.globalAlpha = 0.55;

        if (!ghost) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.35)";
            roundedRect(ctx, -L / 2 + 2, -W / 2 + 3, L, W, 5);
            ctx.fill();
        }

        ctx.fillStyle = invalid ? "#ff3b3b" : this.color;
        roundedRect(ctx, -L / 2, -W / 2, L, W, 5);
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(0, 0, 0, 0.6)";
        ctx.stroke();

        ctx.fillStyle = "rgba(20, 30, 45, 0.9)"; //windows
        roundedRect(ctx, -L * 0.24, -W * 0.38, L * 0.54, W * 0.76, 3);
        ctx.fill();
        ctx.fillStyle = invalid ? "#ff3b3b" : this.color; //roof
        roundedRect(ctx, -L * 0.15, -W * 0.33, L * 0.3, W * 0.66, 2);
        ctx.fill();

        ctx.fillStyle = "#fff6c0"; //headlights
        ctx.fillRect(L / 2 - 3, -W / 2 + 2, 3, 4);
        ctx.fillRect(L / 2 - 3, W / 2 - 6, 3, 4);
        ctx.fillStyle = this.braking ? "#ff1f1f" : "#7a1a1a"; //taillights
        ctx.fillRect(-L / 2, -W / 2 + 2, 2.5, 4);
        ctx.fillRect(-L / 2, W / 2 - 6, 2.5, 4);

        ctx.restore();

        if (active) {
            ctx.beginPath();
            ctx.arc(this.x, this.y, L * 0.8, 0, 2 * Math.PI);
            ctx.lineWidth = 2;
            ctx.strokeStyle = "yellow";
            ctx.setLineDash([6, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
        }
    }
}

function roundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}
