class Controls {
    constructor() {
        this.forward = false;
        this.reverse = false;
        this.left = false;
        this.right = false;
        this.brake = false;
        this.onSwitchCar = null;

        this.#addKeyboardListeners();
    }

    #keyToControl(code) { //physical key positions, so it also works on non-QWERTY layouts
        switch (code) {
            case "KeyW": case "ArrowUp": return "forward";
            case "KeyS": case "ArrowDown": return "reverse";
            case "KeyA": case "ArrowLeft": return "left";
            case "KeyD": case "ArrowRight": return "right";
            case "Space": return "brake";
        }
        return null;
    }

    #addKeyboardListeners() {
        window.addEventListener("keydown", (event) => {
            if (event.code == "Tab") {
                event.preventDefault();
                if (!event.repeat && this.onSwitchCar) this.onSwitchCar();
                return;
            }
            const control = this.#keyToControl(event.code);
            if (control) {
                event.preventDefault(); //no page scrolling or button presses while driving
                this[control] = true;
            }
        });
        window.addEventListener("keyup", (event) => {
            const control = this.#keyToControl(event.code);
            if (control) {
                this[control] = false;
            }
        });
        window.addEventListener("blur", () => {
            this.forward = this.reverse = this.left = this.right = this.brake = false;
        });
    }
}
