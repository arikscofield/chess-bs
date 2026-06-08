import type {Arrow} from "../hooks/Arrows.ts";
import {Color, squareEqual, squareFromPerspective} from "@chess-bs/common";
import {memo} from "react";

function ArrowLayer({arrows, draft, view=Color.White, rowCount=8, colCount=8}: {
    arrows: Arrow[];
    draft: Arrow | null;
    view: Color;
    rowCount?: number;
    colCount?: number;
}) {


    // If drawing an arrow overtop an existing arrow: hide the draft arrow and lower opacity of existing arrow to indicate removal
    for (const a of arrows) {
        if (squareEqual(a.from, draft?.from) && squareEqual(a.to, draft?.to) && a.color === draft?.color) {
            a.opacity = 0.75;
            draft = null;
        } else {
            a.opacity = 1;
        }
    }

    return (<svg
        viewBox={`0 0 ${rowCount} ${colCount}`}
        opacity={0.5}
        className={"absolute inset-0 w-full h-full pointer-events-none z-10"}
    >
        {arrows.map((arrow, i) => <SingleArrow key={i} arrow={arrow} view={view} rowCount={rowCount} colCount={colCount} />)}
        {draft && <SingleArrow arrow={draft} view={view} rowCount={rowCount} colCount={colCount} circleStrokeWidth={0.08} lineStrokeWidth={0.12} headSize={0.4}/> }
    </svg>)
}


function SingleArrow({arrow, view, rowCount=8, colCount=8, circleStrokeWidth=0.1, lineStrokeWidth=0.15, headSize=0.48}: {
    arrow: Arrow;
    view: Color;
    rowCount?: number;
    colCount?: number;
    circleStrokeWidth?: number;
    lineStrokeWidth?: number;
    headSize?: number;
}) {

    const fromSquare = squareFromPerspective(arrow.from, view, rowCount, colCount);
    const toSquare = squareFromPerspective(arrow.to, view, rowCount, colCount);

    // Dot highlight
    if (squareEqual(fromSquare, toSquare)) {
        return <g fill={"none"} stroke={arrow.color} strokeWidth={circleStrokeWidth} opacity={arrow.opacity ?? 1}>
            <circle r={0.45} cx={fromSquare.col + 0.5} cy={fromSquare.row + 0.5}  />
        </g>;
    }


    // Full arrow highlight
    const sx = fromSquare.col + 0.5, sy = fromSquare.row + 0.5; // Start coords
    const ex = toSquare.col + 0.5, ey = toSquare.row + 0.5; // End coords
    const dx = ex-sx, dy=ey-sy;
    const len = Math.hypot(dx, dy);

    const lineEndX = sx + (dx * (len - headSize)) / len;
    const lineEndY = sy + (dy * (len - headSize)) / len;

    const angle = Math.atan(-dy/dx); // Angle from start square to end square
    const perpAngle = angle-1.570796 // Angle along the base of the arrow head

    const halfHeadLen = headSize * 0.57735 // h*tan(30deg)

    const headPoint2X = lineEndX + halfHeadLen * Math.cos(perpAngle);
    const headPoint2Y = lineEndY - halfHeadLen * Math.sin(perpAngle);

    const headPoint3X = lineEndX - halfHeadLen * Math.cos(perpAngle);
    const headPoint3Y = lineEndY + halfHeadLen * Math.sin(perpAngle);


    return (<g opacity={arrow.opacity ?? 1}>
        <line x1={sx} y1={sy}
              x2={lineEndX} y2={lineEndY}
              strokeWidth={lineStrokeWidth} stroke={arrow.color} strokeLinecap={"round"}
        />
        <polygon points={`
        ${ex}, ${ey} 
        ${headPoint2X}, ${headPoint2Y} 
        ${headPoint3X}, ${headPoint3Y}`}
                 stroke={"none"}
                 fill={arrow.color}
        />
    </g>)
}

export default memo(ArrowLayer);