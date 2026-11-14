(function (global) {
    "use strict";

    const compat = global.BTVSvgCompat;
    const SVG_NS = "http://www.w3.org/2000/svg";

    if (!compat || !compat.SvgShapeBase || !compat.SvgLabel) {
        throw new Error("SVG compatibility classes are not loaded.");
    }

    if (!global.BTVSvg || !global.BTVSvg.SvgPanel) {
        throw new Error("SVG renderer is not loaded.");
    }

    function createSvgElement(name) {
        return document.createElementNS(SVG_NS, name);
    }

    function normalizeAnchor(value, constants, fallback) {
        if (value === constants.CENTER || value === "CENTER") return "CENTER";
        if (value === constants.RIGHT || value === "RIGHT") return "RIGHT";
        if (value === constants.MIDDLE || value === "MIDDLE") return "MIDDLE";
        if (value === constants.BOTTOM || value === "BOTTOM") return "BOTTOM";
        if (value === constants.TOP || value === "TOP") return "TOP";
        if (value === constants.LEFT || value === "LEFT") return "LEFT";
        return fallback;
    }

    class SvgElementBase extends compat.SvgShapeBase {
        constructor(name) {
            super(createSvgElement(name));
            this.zIndex = 0;
            this.container = null;
            this.zIndexListeners = new Set();
        }

        getSvgElement() { return this.svgElement; }
        getZIndex() { return this.zIndex; }

        setZIndex(value) {
            this.zIndex = Number(value) || 0;
            this.zIndexListeners.forEach(listener => listener(this));
        }

        addZIndexChangeListener(listener) {
            this.zIndexListeners.add(listener);
        }

        removeZIndexChangeListener(listener) {
            this.zIndexListeners.delete(listener);
        }

        setContainer(container) {
            this.container = container;
        }
    }

    compat.SvgElementBase = SvgElementBase;
    compat.createSvgElement = createSvgElement;
    compat.normalizeAnchor = normalizeAnchor;

class SvgCircle extends SvgElementBase {
        constructor() {
            super("circle");
            this.x = 0;
            this.y = 0;
            this.radius = 0;
            this.refresh();
        }
        setCenterX(x) { this.x = x; this.refresh(); }
        setCenterY(y) { this.y = y; this.refresh(); }
        setCenterLocationXY(x, y) { this.x = x; this.y = y; this.refresh(); }
        setCenterLocation(point) { this.setCenterLocationXY(point.X, point.Y); }
        getCenterLocation() { return { X: this.x, Y: this.y }; }
        getRadius() { return this.radius; }
        setRadius(value) { this.radius = value; this.refresh(); }
        refresh() {
            this.svgElement.setAttribute("cx", this.x);
            this.svgElement.setAttribute("cy", this.y);
            this.svgElement.setAttribute("r", this.radius);
            this.refreshStyles();
        }
    }

    class SvgRectangle extends SvgElementBase {
        constructor() {
            super("rect");
            this.x = 0; this.y = 0;
            this.width = 0; this.height = 0;
            this.horizontalAnchor = "LEFT";
            this.verticalAnchor = "TOP";
            this.radiusX = 0; this.radiusY = 0;
            this.rotation = 0;
            this.refresh();
        }
        setLocationXY(x, y) { this.x = x; this.y = y; this.refresh(); }
        setLocation(point) { this.setLocationXY(point.X, point.Y); }
        getLocation() { return { X: this.x, Y: this.y }; }
        setWidth(value) { this.width = value; this.refresh(); }
        setHeight(value) { this.height = value; this.refresh(); }
        setRadiiXY(radiusX, radiusY) {
            this.radiusX = radiusX;
            this.radiusY = radiusY;
            this.refresh();
        }
        setSizeXY(width, height) { this.width = width; this.height = height; this.refresh(); }
        setHorizontalAnchor(value) {
            this.horizontalAnchor = normalizeAnchor(value, global.jsgl?.HorizontalAnchor || {}, "LEFT");
            this.refresh();
        }
        setVerticalAnchor(value) {
            this.verticalAnchor = normalizeAnchor(value, global.jsgl?.VerticalAnchor || {}, "TOP");
            this.refresh();
        }
        setRoundingRadiiXY(x, y) { this.radiusX = x; this.radiusY = y; this.refresh(); }
        setRotation(value) { this.rotation = value; this.refresh(); }
        refresh() {
            const x = this.x - (this.horizontalAnchor === "CENTER" ? this.width / 2 :
                this.horizontalAnchor === "RIGHT" ? this.width : 0);
            const y = this.y - (this.verticalAnchor === "MIDDLE" ? this.height / 2 :
                this.verticalAnchor === "BOTTOM" ? this.height : 0);
            const el = this.svgElement;
            el.setAttribute("x", x); el.setAttribute("y", y);
            el.setAttribute("width", this.width); el.setAttribute("height", this.height);
            el.setAttribute("rx", this.radiusX); el.setAttribute("ry", this.radiusY);
            el.setAttribute("transform", this.rotation ? "rotate(" + this.rotation + " " + this.x + " " + this.y + ")" : "");
            this.refreshStyles();
        }
    }

    class SvgLine extends SvgElementBase {
        constructor() {
            super("line");
            this.startX = 0; this.startY = 0;
            this.endX = 0; this.endY = 0;
            this.refresh();
        }
        setStartPointXY(x, y) { this.startX = x; this.startY = y; this.refresh(); }
        setEndPointXY(x, y) { this.endX = x; this.endY = y; this.refresh(); }
        setStartPoint(point) { this.setStartPointXY(point.X, point.Y); }
        setEndPoint(point) { this.setEndPointXY(point.X, point.Y); }
        getStartPoint() { return { X: this.startX, Y: this.startY }; }
        getEndPoint() { return { X: this.endX, Y: this.endY }; }
        refresh() {
            const el = this.svgElement;
            el.setAttribute("x1", this.startX); el.setAttribute("y1", this.startY);
            el.setAttribute("x2", this.endX); el.setAttribute("y2", this.endY);
            this.refreshStroke();
        }
    }

    compat.SvgCircle = SvgCircle;
    compat.SvgRectangle = SvgRectangle;
    compat.SvgLine = SvgLine;


    function SvgGroupElement(domPresenter, panel, x, y, z) {
        global.jsgl.elements.AbstractElement.call(this, panel);

        this.location = new global.jsgl.Vector2D(
            Number(x) || 0,
            Number(y) || 0
        );

        this.elements = new global.jsgl.util.ArrayList();
                this.domPresenter = domPresenter || null;
        this.svgElement = this.domPresenter
            ? this.domPresenter.getXmlElement()
            : createSvgElement("g");

        if (this.domPresenter) {
            this.domPresenter.setGraphicsElement(this);
        }
        this.nextChildAge = 0;

        this.setZIndex(Number(z) || 0);
        this.refresh();
    }

    SvgGroupElement.jsglExtend(global.jsgl.elements.AbstractElement);

    SvgGroupElement.prototype.getSvgElement = function () {
        return this.svgElement;
    };

    SvgGroupElement.prototype.getDomPresenter = function () {
        return this.domPresenter;
    };

        SvgGroupElement.prototype.refresh = function () {
        if (this.domPresenter) {
            this.domPresenter.update();
        } else {
            this.svgElement.setAttribute(
                "transform",
                "translate(" + this.location.X + " " + this.location.Y + ")"
            );
        }
    };

    SvgGroupElement.prototype.setLocationXY = function (x, y) {
        this.location.X = Number(x) || 0;
        this.location.Y = Number(y) || 0;
        this.refresh();
        if (this.onChangeRaiser) this.onChangeRaiser.raiseEvent(this);
    };

    SvgGroupElement.prototype.setLocation = function (point) {
        this.setLocationXY(point.X, point.Y);
    };

    SvgGroupElement.prototype.getLocation = function () {
        return new jsgl.Vector2D(this.location.X, this.location.Y);
    };

    SvgGroupElement.prototype.getX = function () {
        return this.location.X;
    };

    SvgGroupElement.prototype.getY = function () {
        return this.location.Y;
    };

    SvgGroupElement.prototype.setX = function (x) {
        this.setLocationXY(x, this.location.Y);
    };

    SvgGroupElement.prototype.setY = function (y) {
        this.setLocationXY(this.location.X, y);
    };

    SvgGroupElement.prototype.addElement = function (element) {
        if (!element || this.elements.contains(element)) return;

        const previousContainer = element.getContainer
            ? element.getContainer()
            : element.container;

        if (previousContainer && previousContainer !== this &&
            previousContainer.removeElement) {
            previousContainer.removeElement(element);
        }

        element.age = this.nextChildAge++;
        this.elements.add(element);
        element.setContainer(this);
        const childSvg = element.getSvgElement();
        if (childSvg) {
            childSvg.jsglElement = element;

            // Let clicks on a node's text pass through to its circle.
            if (childSvg.tagName &&
                childSvg.tagName.toLowerCase() === "text") {
                childSvg.setAttribute("pointer-events", "none");
            }
        }

        if (typeof element.addZIndexChangeListener === "function") {
            element.__svgGroupZListener = () => this.sortElements();
            element.addZIndexChangeListener(element.__svgGroupZListener);
        } else if (element.zIndexChangeRaiser) {
            element.__svgGroupZListener = () => this.sortElements();
            element.zIndexChangeRaiser.registerListener(
                element.__svgGroupZListener
            );
        }

        this.sortElements();
    };

    SvgGroupElement.prototype.removeElement = function (element) {
        if (!this.elements.contains(element)) return;

        if (element.__svgGroupZListener) {
            if (typeof element.removeZIndexChangeListener === "function") {
                element.removeZIndexChangeListener(element.__svgGroupZListener);
            } else if (element.zIndexChangeRaiser) {
                element.zIndexChangeRaiser.unregisterListener(
                    element.__svgGroupZListener
                );
            }

            delete element.__svgGroupZListener;
        }

        this.elements.remove(element);
        element.setContainer(null);

        const childSvg = element.getSvgElement();
        if (childSvg && childSvg.parentNode === this.svgElement) {
            this.svgElement.removeChild(childSvg);
        }
    };

    SvgGroupElement.prototype.getElementAt = function (index) {
        return this.elements.get(index);
    };

    SvgGroupElement.prototype.getElementsCount = function () {
        return this.elements.getCount();
    };

    SvgGroupElement.prototype.getElementCount = function () {
        return this.elements.getCount();
    };

    SvgGroupElement.prototype.containsElement = function (element) {
        return this.elements.contains(element);
    };

    SvgGroupElement.prototype.clear = function () {
        const children = [];
        for (let i = 0; i < this.elements.getCount(); i++) {
            children.push(this.elements.get(i));
        }
        children.forEach(element => this.removeElement(element));
    };

    SvgGroupElement.prototype.removeAllElements = function () {
        this.clear();
    };

    SvgGroupElement.prototype.sortElements = function () {
        const children = [];

        for (let i = 0; i < this.elements.getCount(); i++) {
            children.push(this.elements.get(i));
        }

        children.sort((a, b) => {
            const aZ = a.getZIndex ? a.getZIndex() : 0;
            const bZ = b.getZIndex ? b.getZIndex() : 0;

            return aZ - bZ || (a.age || 0) - (b.age || 0);
        });

        children.forEach(element => {
            const childSvg = element.getSvgElement();
            if (childSvg) this.svgElement.appendChild(childSvg);
        });
    };

    compat.SvgGroupElement = SvgGroupElement;

    compat.SvgLabel.prototype.zIndex = 0;
    compat.SvgLabel.prototype.getSvgElement = function () { return this.svgElement; };
    compat.SvgLabel.prototype.getZIndex = function () { return this.zIndex || 0; };
    compat.SvgLabel.prototype.setZIndex = function (v) { this.zIndex = Number(v) || 0; };
    compat.SvgLabel.prototype.setContainer = function (v) { this.container = v; };

    const panelPrototype = global.BTVSvg.SvgPanel.prototype;
    panelPrototype.ownerDocument = document;
    panelPrototype.createCircle = function () { return new SvgCircle(); };
    panelPrototype.createRectangle = function () { return new SvgRectangle(); };
    panelPrototype.createLine = function () { return new SvgLine(); };
    panelPrototype.createLabel = function () { return new compat.SvgLabel(); };
    panelPrototype.createGroup = function () {
        return new SvgGroupElement(null, this, 0, 0, 0);
    };

    if (global.jsgl && global.jsgl.elements) {
        global.jsgl.elements.GroupElement = SvgGroupElement;
        global.jsgl.Panel = function (holder, options) {
            const panel = new global.BTVSvg.SvgPanel(holder, options);
            panel.ownerDocument = holder.ownerDocument;
            return panel;
        };
    }

})(window);
