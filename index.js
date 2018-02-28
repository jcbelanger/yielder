Rx.Observable.prototype.slidingWindow = function(n) {
	return Rx.Observable.range(0, n)
		.map(i => this.skip(i))
		.zipAll();
}

const drawing = document.getElementById("drawing");
const svgNS = "http://www.w3.org/2000/svg";

const mouseDowns = Rx.Observable.fromEvent(drawing, "mousedown");
const mouseMoves = Rx.Observable.fromEvent(document, "mousemove");
const mouseUps = Rx.Observable.fromEvent(document, "mouseup");

const mousePaths = mouseDowns.map(mouseDown => mouseMoves
	.startWith(mouseDown)
	.do(mouseEvent => mouseEvent.preventDefault())
	.map(mouseEvent => toSvgPoint(drawing, mouseEvent))
	.takeUntil(mouseUps.do(mouseEvent => mouseEvent.preventDefault()))
);

const touchStarts = Rx.Observable.fromEvent(drawing, "touchstart");
const touchMoves = Rx.Observable.fromEvent(drawing, "touchmove");
const touchEnds = Rx.Observable.fromEvent(drawing, "touchend");
const touchCancels = Rx.Observable.fromEvent(drawing, "touchcancel");

const touchPaths = touchStarts
	.merge(touchMoves)
	.do(touchEvent => touchEvent.preventDefault())
	.mergeMap(touchEvent => Rx.Observable.from(touchEvent.changedTouches))
	.groupBy(
		touch => touch.identifier,
		touch => toSvgPoint(drawing, touch),
		group => touchEnds
			.merge(touchCancels)
			.do(touchEvent => touchEvent.preventDefault())
			.mergeMap(touchEvent => Rx.Observable.from(touchEvent.changedTouches))
			.find(touch => touch.identifier === group.key)
	)

const rawPaths = mousePaths.merge(touchPaths);

logPaths(rawPaths);
// logPaths(simplePaths);
renderPaths(rawPaths, "raw-path");
// renderPaths(simplePaths, "simple-path");


function toSvgPoint(svg, point) {
	let pt = svg.createSVGPoint();
	pt.x = point.clientX;
	pt.y = point.clientY;
	return pt.matrixTransform(svg.getScreenCTM().inverse())
};

function toClientPoint(svg, point) {
	return point.matrixTransform(svg.getScreenCTM());
}

function triangeArea( [{x:x1, y:y1}, {x:x2, y:y2}, {x:x3, y:y3}] ) {
	return ((x1 - x3) * (y2 - y1) - (x1 - x2) * (y3 - y1)) / 2;
}


function renderPaths(paths, pathClass, removeAfter=true) {
	paths.subscribe(path => {
		const poly = document.createElementNS(svgNS, "polyline");
		poly.classList.add(pathClass);
		drawing.appendChild(poly);
		path.subscribe(
			point => poly.points.appendItem(point),
			error => console.error(error),
			() => removeAfter ? drawing.removeChild(poly) : ""
		);
	});
}

function logPaths(paths) {
	paths.subscribe(path => path.subscribe(
		point => console.log(point),
		e => console.error(e),
		() => console.log('complete')
	));
}
