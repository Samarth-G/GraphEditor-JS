class CarEditor {
    constructor(viewport, world) {
        this.viewport = viewport;
        this.canvas = viewport.canvas;
        this.world = world;
        this.ctx = this.canvas.getContext("2d");

        this.mouse = null;
        this.hoverCar = null;
        this.preview = null;
        this.nextColor = randomItem(CAR_COLORS);

        this.enabled = false;
        this.boundMouseDown = this.#handleMouseDown.bind(this);
        this.boundMouseMove = this.#handleMouseMove.bind(this);
        this.boundContextMenu = (event) => event.preventDefault();
        this.boundMouseLeave = () => this.preview = this.hoverCar = null;
    }

    enable() {
        if (this.enabled) return;
        this.canvas.addEventListener("mousedown", this.boundMouseDown);
        this.canvas.addEventListener("mousemove", this.boundMouseMove);
        this.canvas.addEventListener("contextmenu", this.boundContextMenu);
        this.canvas.addEventListener("mouseleave", this.boundMouseLeave);
        this.enabled = true;
    }

    disable() {
        if (!this.enabled) return;
        this.canvas.removeEventListener("mousedown", this.boundMouseDown);
        this.canvas.removeEventListener("mousemove", this.boundMouseMove);
        this.canvas.removeEventListener("contextmenu", this.boundContextMenu);
        this.canvas.removeEventListener("mouseleave", this.boundMouseLeave);
        this.enabled = false;
        this.preview = null;
        this.hoverCar = null;
    }

    #refresh() {
        this.hoverCar = this.mouse ? this.world.getCarAt(this.mouse) : null;
        const placement = this.mouse && !this.hoverCar ? this.world.getCarPlacement(this.mouse) : null;
        this.preview = placement ? {
            car: new Car(placement.x, placement.y, placement.angle, {color: this.nextColor}),
            valid: placement.valid
        } : null;
    }

    #handleMouseMove(event) {
        this.mouse = this.viewport.getMouse(event);
        this.#refresh();
    }

    #handleMouseDown(event) {
        this.mouse = this.viewport.getMouse(event);
        this.#refresh();
        if (event.button == 0) { //left-click
            if (this.hoverCar) {
                this.world.setActiveCar(this.hoverCar); //take control of it
            } else if (this.preview && this.preview.valid) {
                this.world.addCar(this.preview.car);
                this.nextColor = randomItem(CAR_COLORS);
                this.#refresh();
            }
        }
        if (event.button == 2 && this.hoverCar) { //right-click
            this.world.removeCar(this.hoverCar);
            this.#refresh();
        }
    }

    display() {
        if (this.preview) {
            this.preview.car.draw(this.ctx, {ghost: true, invalid: !this.preview.valid});
        }
        if (this.hoverCar) {
            this.hoverCar.polygon.draw(this.ctx, {fill: null, stroke: "white", lineWidth: 2});
        }
    }
}
