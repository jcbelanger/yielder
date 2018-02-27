const drawing = document.getElementById("drawing");
const svgNS = "http://www.w3.org/2000/svg";

const mouseLines = Rx.Observable.fromEvent(drawing, "mousedown")
	.map(mouseDown => Rx.Observable.fromEvent(document, "mousemove")
		.startWith(mouseDown)
		.do(mouseEvent => mouseEvent.preventDefault())
		.takeUntil(Rx.Observable.fromEvent(document, "mouseup")
			.do(mouseUp => mouseUp.preventDefault())
		)
		.map(mouseEvent => toSvgPoint(drawing, mouseEvent))
	);

const touchStops = Rx.Observable.fromEvent(drawing, "touchend")
	.merge(Rx.Observable.fromEvent(drawing, "touchcancel"))
	.mergeMap(touchEvent => Rx.Observable.from(touchEvent.changedTouches))

const touchLines = Rx.Observable.fromEvent(drawing, "touchstart")
	.mergeMap(touchStart => Rx.Observable.fromEvent(drawing, "touchmove")
		.startWith(touchStart)
		.do(touchEvent => touchEvent.preventDefault())
		.mergeMap(touchEvent => Rx.Observable.from(touchEvent.changedTouches))
		.groupBy(
			touch => touch.identifier,
			touch => toSvgPoint(drawing, touch),
			group => touchStops.find(touch => touch.identifier === group.key)
		)
	);


const lines = mouseLines.merge(touchLines);

lines.subscribe(line => {
	const poly = document.createElementNS(svgNS, "polyline");
	poly.classList.add("drawing");
	drawing.appendChild(poly);
	line.subscribe(
		point => poly.points.appendItem(point),
		null,
		() => drawing.removeChild(poly)
	);
});


function toSvgPoint(svg, point) {
	let pt = svg.createSVGPoint();
	pt.x = point.clientX;
	pt.y = point.clientY;
	return pt.matrixTransform(svg.getScreenCTM().inverse())
};