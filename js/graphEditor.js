class GraphEditor {
    constructor(viewport, graph) {
        this.viewport = viewport;
        this.canvas = viewport.canvas;
        this.graph = graph;

        this.mouse = null;
        this.selected = null;
        this.hover = null;
        this.dragging = false;

        this.ctx = this.canvas.getContext("2d");
        this.#addEventListeners();
    }

    #addEventListeners() {
        this.canvas.addEventListener("mousedown", this.#handleMouseDown.bind(this));
        this.canvas.addEventListener("mousemove", this.#handleMouseMove.bind(this));
        this.canvas.addEventListener("contextmenu", (event) => event.preventDefault());
        this.canvas.addEventListener("mouseup", () => this.dragging = false);
    }

    #handleMouseDown(event) {
        if (event.button == 2) { //right-click
            if (this.selected) {
                this.selected = null; //first right-click unselects
            } else if (this.hover) {
                this.#removePoint(this.hover); //second right-click removes
            }
        }
        if (event.button == 0) { //left-click
            if (this.hover) {
                this.#selectPoint(this.hover)
                this.dragging = true;
                return;
            }
            this.graph.addPoint(this.mouse);
            this.#selectPoint(this.mouse);
            this.hover = this.mouse; //added point is hover && selected
        }
    }

    #handleMouseMove(event) {
        this.mouse = this.viewport.getMouse(event);
        this.hover = getNearestPoint(this.mouse, this.graph.points, 12 * this.viewport.zoom);
        if (this.dragging) {
            this.selected.x = this.mouse.x;
            this.selected.y = this.mouse.y;
        }
    }

    #selectPoint(point) {
        if (this.selected) {
            this.graph.tryAddSegment(new Segment(this.selected, point));
        }
        this.selected = point;
    }

    #removePoint(point) {
        this.graph.removePoint(point);
        this.hover = null;
        if (this.selected == point) { //keeps selected point if different
            this.selected = null;
        }
    }

    dispose() {
        this.graph.clear();
        this.hover = null;
        this.selected = null;
    }

    display() {
        this.graph.draw(this.ctx);
        if (this.hover) {
            this.hover.draw(this.ctx, {fill: true});
        }
        if (this.selected) {
            const intent = this.hover ? this.hover : this.mouse; //passes nearest point instead of mouse if available
            new Segment(this.selected, intent).draw(this.ctx, {dash: [8, 4]});
            this.selected.draw(this.ctx, {outline: true});
        }
    }
}