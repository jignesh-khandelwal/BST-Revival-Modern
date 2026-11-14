(function (global) {
    "use strict";

    class SvgPanel {
        constructor(holder, options) {
            if (!holder) {
                throw new Error("SVG panel requires a holder element.");
            }

            this.holder = holder;
            this.options = options || {};
            this.elements = new Map();

            this.svg = document.createElementNS(
                "http://www.w3.org/2000/svg",
                "svg"
            );

            this.svg.setAttribute("width", "100%");
            this.svg.setAttribute("height", "100%");
            this.svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
            this.svg.setAttribute("role", "img");
            this.svg.setAttribute("aria-label", "Binary tree visualisation");

            this.holder.appendChild(this.svg);
            this.resize();

            if (typeof ResizeObserver !== "undefined") {
                this.resizeObserver = new ResizeObserver(() => this.resize());
                this.resizeObserver.observe(this.holder);
            } else {
                this.resizeHandler = () => this.resize();
                global.addEventListener("resize", this.resizeHandler);
            }
        }

        getHolderElement() {
            return this.holder;
        }

        getSvgElement() {
            return this.svg;
        }

        addElement(element) {
            if (!element || this.containsElement(element)) {
                return false;
            }

            const svgElement = element.getSvgElement();

            if (!svgElement) {
                throw new Error("Element does not provide an SVG element.");
            }

                       this.elements.set(element, svgElement);

            if (typeof element.setContainer === "function") {
                element.setContainer(this);
            }

            if (typeof element.addZIndexChangeListener === "function") {
                element.__svgPanelZListener = () => this.sortElements();
                element.addZIndexChangeListener(element.__svgPanelZListener);
            }

            this.svg.appendChild(svgElement);
            this.sortElements();

            return true;
        }

        removeElement(element) {
            const svgElement = this.elements.get(element);

            if (!svgElement) {
                return false;
            }

            if (svgElement.parentNode === this.svg) {
                this.svg.removeChild(svgElement);
            }

            if (
                typeof element.removeZIndexChangeListener === "function" &&
                element.__svgPanelZListener
            ) {
                element.removeZIndexChangeListener(element.__svgPanelZListener);
                delete element.__svgPanelZListener;
            }

            this.elements.delete(element);

            if (typeof element.setContainer === "function") {
                element.setContainer(null);
            }

            return true;
        }

        containsElement(element) {
            return this.elements.has(element);
        }

        clear() {
            this.elements.forEach((svgElement, element) => {
                if (
                    typeof element.removeZIndexChangeListener === "function" &&
                    element.__svgPanelZListener
                ) {
                    element.removeZIndexChangeListener(element.__svgPanelZListener);
                    delete element.__svgPanelZListener;
                }

                if (svgElement.parentNode === this.svg) {
                    this.svg.removeChild(svgElement);
                }

                if (typeof element.setContainer === "function") {
                    element.setContainer(null);
                }
            });

            this.elements.clear();
        }

        sortElements() {
            const ordered = Array.from(this.elements.entries());

            ordered.sort((a, b) => {
                const getZ = (element) =>
                    typeof element.getZIndex === "function"
                        ? element.getZIndex()
                        : (Number(element.zIndex) || 0);

                return getZ(a[0]) - getZ(b[0]);
            });

            ordered.forEach((entry) => {
                this.svg.appendChild(entry[1]);
            });
        }

        resize() {
            const width = Math.max(1, this.holder.clientWidth);
            const height = Math.max(1, this.holder.clientHeight);

            this.width = width;
            this.height = height;

            this.svg.setAttribute(
                "viewBox",
                "0 0 " + width + " " + height
            );
        }

        destroy() {
            this.clear();

            if (this.resizeObserver) {
                this.resizeObserver.disconnect();
            }

            if (this.resizeHandler) {
                global.removeEventListener("resize", this.resizeHandler);
            }

            if (this.svg.parentNode) {
                this.svg.parentNode.removeChild(this.svg);
            }
        }
    }

    global.BTVSvg = global.BTVSvg || {};
    global.BTVSvg.SvgPanel = SvgPanel;

})(window);
