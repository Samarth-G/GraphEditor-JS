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

        this.enabled = false;
        this.boundMouseDown = this.#handleMouseDown.bind(this);
        this.boundMouseMove = this.#handleMouseMove.bind(this);
        this.boundContextMenu = (event) => event.preventDefault();
        this.boundMouseUp = () => this.dragging = false;
        this.enable();
    }

    enable() {
        if (this.enabled) return;
        this.#addEventListeners();
        this.enabled = true;
    }

    disable() { //stops listening to the mouse so another tool can use the canvas
        if (!this.enabled) return;
        this.#removeEventListeners();
        this.enabled = false;
        this.selected = null;
        this.hover = null;
        this.dragging = false;
    }

    #addEventListeners() {
        this.canvas.addEventListener("mousedown", this.boundMouseDown);
        this.canvas.addEventListener("mousemove", this.boundMouseMove);
        this.canvas.addEventListener("contextmenu", this.boundContextMenu);
        this.canvas.addEventListener("mouseup", this.boundMouseUp);
    }

    #removeEventListeners() {
        this.canvas.removeEventListener("mousedown", this.boundMouseDown);
        this.canvas.removeEventListener("mousemove", this.boundMouseMove);
        this.canvas.removeEventListener("contextmenu", this.boundContextMenu);
        this.canvas.removeEventListener("mouseup", this.boundMouseUp);
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

    display({drawGraph = true, previewColor = "black"} = {}) {
        if (drawGraph) {
            this.graph.draw(this.ctx);
        }
        if (this.hover) {
            this.hover.draw(this.ctx, {fill: true});
        }
        if (this.selected) {
            const intent = this.hover ? this.hover : this.mouse; //passes nearest point instead of mouse if available
            new Segment(this.selected, intent).draw(this.ctx, {color: previewColor, dash: [8, 4]});
            this.selected.draw(this.ctx, {outline: true});
        }
    }
}