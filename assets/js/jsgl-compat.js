(function (global) {
    "use strict";

    const SVG_NS = "http://www.w3.org/2000/svg";

    class EventRaiser {
        constructor() {
            this.listeners = [];
        }

        registerListener(listener) {
            if (typeof listener !== "function") {
                return false;
            }

            if (this.listeners.indexOf(listener) !== -1) {
                return false;
            }

            this.listeners.push(listener);
            return true;
        }

        unregisterListener(listener) {
            const index = this.listeners.indexOf(listener);

            if (index === -1) {
                return false;
            }

            this.listeners.splice(index, 1);
            return true;
        }

        raiseEvent() {
            this.listeners.slice().forEach((listener) => listener());
        }
    }

    function delegate(context, method) {
        return function () {
            return method.apply(context, arguments);
        };
    }

    const compatibility = global.BTVSvgCompat || {};

    compatibility.SVG_NS = SVG_NS;
    compatibility.EventRaiser = EventRaiser;
    compatibility.delegate = delegate;

    global.BTVSvgCompat = compatibility;


    class AbstractStyle {
        constructor() {
            this.onChangeRaiser = new EventRaiser();
        }

        registerChangeListener(listener) {
            return this.onChangeRaiser.registerListener(listener);
        }

        unregisterChangeListener(listener) {
            return this.onChangeRaiser.unregisterListener(listener);
        }

        notifyChange() {
            this.onChangeRaiser.raiseEvent();
        }
    }

    class SolidStroke extends AbstractStyle {
        constructor(weight, color, opacity, dashStyle, endcapType, joinStyle, enabled) {
            super();
            this.weight = weight === undefined ? 1 : weight;
            this.color = color || "black";
            this.opacity = opacity === undefined ? 1 : opacity;
            this.dashStyle = dashStyle || "solid";
            this.endcapType = endcapType || "round";
            this.joinStyle = joinStyle || "round";
            this.enabled = enabled === undefined ? true : !!enabled;
        }

        getWeight() { return this.weight; }
        setWeight(value) { this.weight = value; this.notifyChange(); }
        getColor() { return this.color; }
        setColor(value) { this.color = value; this.notifyChange(); }
        getOpacity() { return this.opacity; }
        setOpacity(value) { this.opacity = value; this.notifyChange(); }
        getDashStyle() { return this.dashStyle; }
        setDashStyle(value) { this.dashStyle = value; this.notifyChange(); }
        getEndcapType() { return this.endcapType; }
        setEndcapType(value) { this.endcapType = value; this.notifyChange(); }
        getJoinStyle() { return this.joinStyle; }
        setJoinStyle(value) { this.joinStyle = value; this.notifyChange(); }
        getEnabled() { return this.enabled; }
        isEnabled() { return this.enabled; }
        setEnabled(value) { this.enabled = !!value; this.notifyChange(); }

        applyToSvgElement(element) {
            if (!this.enabled) {
                element.style.setProperty("stroke", "none");
                return;
            }

            element.style.setProperty("stroke", this.color);
            element.style.setProperty("stroke-width", this.weight + "px");
            element.style.setProperty("stroke-opacity", this.opacity);

            const dashPatterns = {
                solid: null,
                dash: [3, 4],
                dashDot: [3, 4, 0, 4],
                dot: [0, 4],
                longDash: [7, 4],
                longDashDot: [7, 4, 0, 4],
                longDashDotDot: [7, 4, 0, 4, 0, 4],
                shortDashDot: [2, 2, 0, 2]
            };

            let dashArray = null;

            if (typeof this.dashStyle === "string") {
                dashArray = dashPatterns[this.dashStyle];
            } else if (this.dashStyle && typeof this.dashStyle.getDashArray === "function") {
                dashArray = this.dashStyle.getDashArray();
            }

            if (dashArray === null || dashArray === undefined) {
                element.style.setProperty("stroke-dasharray", "none");
            } else if (Array.isArray(dashArray)) {
                const scaledDashArray = dashArray.map(value => {
                    const scaledValue = value * this.weight;
                    return scaledValue || 0.01;
                });

                element.style.setProperty(
                    "stroke-dasharray",
                    scaledDashArray.join(",")
                );
            }

            element.style.setProperty(
                "stroke-linecap",
                this.endcapType === "flat" ? "butt" : this.endcapType
            );
            element.style.setProperty("stroke-linejoin", this.joinStyle);
        }
    }

    class SolidFill extends AbstractStyle {
        constructor(color, opacity, enabled) {
            super();
            this.color = color || "white";
            this.opacity = opacity === undefined ? 1 : opacity;
            this.enabled = enabled === undefined ? true : !!enabled;
        }

        getColor() { return this.color; }
        setColor(value) { this.color = value; this.notifyChange(); }
        getOpacity() { return this.opacity; }
        setOpacity(value) { this.opacity = value; this.notifyChange(); }
        getEnabled() { return this.enabled; }
        isEnabled() { return this.enabled; }
        setEnabled(value) { this.enabled = !!value; this.notifyChange(); }

        applyToSvgElement(element) {
            if (!this.enabled) {
                element.style.setProperty("fill", "none");
                return;
            }

            element.style.setProperty("fill", this.color);
            element.style.setProperty("fill-opacity", this.opacity);
        }
    }

    compatibility.AbstractStyle = AbstractStyle;
    compatibility.SolidStroke = SolidStroke;
    compatibility.SolidFill = SolidFill;



class SvgShapeBase {
    constructor(element) { this.svgElement = element; this.stroke = null; this.fill = null; this.strokeListener = () => this.refreshStroke(); this.fillListener = () => this.refreshFill(); }
    getSvgElement() { return this.svgElement; }
    getStroke() { return this.stroke; }
    getFill() { return this.fill; }
    setStroke(style) {
        if (this.stroke) this.stroke.unregisterChangeListener(this.strokeListener);
        this.stroke = style;
        if (style) style.registerChangeListener(this.strokeListener);
        this.refreshStroke();
    }
    setFill(style) {
        if (this.fill) this.fill.unregisterChangeListener(this.fillListener);
        this.fill = style;
        if (style) style.registerChangeListener(this.fillListener);
        this.refreshFill();
    }
    refreshStroke() { if (this.svgElement && this.stroke) this.stroke.applyToSvgElement(this.svgElement); }
    refreshFill() { if (this.svgElement && this.fill) this.fill.applyToSvgElement(this.svgElement); }
    refreshStyles() { this.refreshStroke(); this.refreshFill(); }
    setSvgElement(element) { this.svgElement = element; this.refreshStyles(); }
    destroy() {
        if (this.stroke) this.stroke.unregisterChangeListener(this.strokeListener);
        if (this.fill) this.fill.unregisterChangeListener(this.fillListener);
        this.stroke = null; this.fill = null; this.svgElement = null;
    }
}

compatibility.SvgShapeBase = SvgShapeBase;

class SvgLabel extends SvgShapeBase {
    constructor() {
        super(document.createElementNS(
            "http://www.w3.org/2000/svg",
            "text"
        ));

        this.text = "";
        this.fontFamily = "sans-serif";
        this.fontSize = 12;
        this.fontColor = "black";

        this.opacity = 1;
        this.bold = false;
        this.italics = false;
        this.underlined = false;
        this.overlined = false;
        this.struckThrough = false;
        this.horizontalAnchor = "LEFT";
        this.verticalAnchor = "TOP";
        this.x = 0;
        this.y = 0;

        this.refresh();
    }

    getText() { return this.text; }
    getFontFamily() { return this.fontFamily; }
    getFontSize() { return this.fontSize; }
    getFontColor() { return this.fontColor; }
    getOpacity() { return this.opacity; }
    getBold() { return this.bold; }
    getItalics() { return this.italics; }
    getUnderlined() { return this.underlined; }
    getOverlined() { return this.overlined; }
    getStruckThrough() { return this.struckThrough; }
    getHorizontalAnchor() { return this.horizontalAnchor; }
    getVerticalAnchor() { return this.verticalAnchor; }
    getX() { return this.x; }
    getY() { return this.y; }
    setText(value) { this.text = String(value); this.refresh(); }
    setFontFamily(value) { this.fontFamily = value; this.refresh(); }
    setFontSize(value) { this.fontSize = value; this.refresh(); }
    setFontColor(value) { this.fontColor = value; this.refresh(); }
    setOpacity(value) { this.opacity = value; this.refresh(); }
    setBold(value) { this.bold = Boolean(value); this.refresh(); }
    setItalics(value) { this.italics = Boolean(value); this.refresh(); }
    setUnderlined(value) { this.underlined = Boolean(value); this.refresh(); }
    setOverlined(value) { this.overlined = Boolean(value); this.refresh(); }
    setStruckThrough(value) { this.struckThrough = Boolean(value); this.refresh(); }
    setHorizontalAnchor(value) { this.horizontalAnchor = value; this.refresh(); }
    setVerticalAnchor(value) { this.verticalAnchor = value; this.refresh(); }
    setLocationXY(x, y) { this.x = x; this.y = y; this.refresh(); }
    setLocation(point) { this.setLocationXY(point.X, point.Y); }
    refresh() {
        const element = this.svgElement;
        if (!element) return;

        element.textContent = this.text;
        element.setAttribute("font-family", this.fontFamily);
        element.setAttribute("font-size", this.fontSize + "px");
        element.setAttribute("font-weight", this.bold ? "bold" : "normal");
        element.setAttribute("font-style", this.italics ? "italic" : "normal");
        element.setAttribute("fill", this.fontColor);
        element.setAttribute("opacity", this.opacity);

        const decorations = [];
        if (this.underlined) decorations.push("underline");
        if (this.overlined) decorations.push("overline");
        if (this.struckThrough) decorations.push("line-through");

        element.style.textDecoration = decorations.join(" ");
        const horizontalAnchor = this.horizontalAnchor;

        element.setAttribute("text-anchor",
            horizontalAnchor === 2 || horizontalAnchor === "CENTER" ? "middle" :
            horizontalAnchor === 1 || horizontalAnchor === "RIGHT" ? "end" : "start"
        );

        const verticalOffsets = {
            0: "1em",
            1: "0em",
            2: "0.6ex",
            TOP: "1em",
            MIDDLE: "0.6ex",
            BOTTOM: "0em"
        };

        element.setAttribute("x", this.x);
        element.setAttribute("y", this.y);
        element.setAttribute("dy", verticalOffsets[this.verticalAnchor] ?? "1em");
    }
}


compatibility.SvgLabel = SvgLabel;

})(window);
