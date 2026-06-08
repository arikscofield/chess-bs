import type {Arrow} from "../hooks/Arrows.ts";
import {Color, squareEqual, squareFromPerspective} from "@chess-bs/common";
import {memo} from "react";

function ArrowLayer({arrows, draft, view=Color.White, rowCount=8, colCount=8}: {
    arrows: Arrow[];
    draft: Arrow | null;
    view: Color;
    rowCount: number;
    colCount: number;
}) {


    return (<svg
        viewBox={`0 0 ${rowCount} ${colCount}`}
        className={"absolute inset-0 w-full h-full pointer-events-none z-10"}
    >
        {arrows.map((arrow, i) => <SingleArrow key={i} arrow={arrow} view={view} rowCount={rowCount} colCount={colCount} />)}
        {draft && <SingleArrow arrow={draft} view={view} rowCount={rowCount} colCount={colCount}/> }
    </svg>)
}


function SingleArrow({arrow, view, rowCount=8, colCount=8}: {
    arrow: Arrow;
    view: Color;
    rowCount: number;
    colCount: number;
}) {

    const fromSquare = squareFromPerspective(arrow.from, view, rowCount, colCount);
    const toSquare = squareFromPerspective(arrow.to, view, rowCount, colCount);

    // Dot highlight
    if (squareEqual(fromSquare, toSquare)) {
        return <g fill={"none"} stroke={arrow.color} strokeWidth={0.1} opacity={0.4}>
            <circle r={0.45} cx={fromSquare.col + 0.5} cy={fromSquare.row + 0.5}  />
        </g>;
    }


    // Full arrow highlight
    const headSize = 0.45;
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


    return (<g opacity={0.4}>
        <line x1={sx} y1={sy}
              x2={lineEndX} y2={lineEndY}
              strokeWidth={0.15} stroke={arrow.color}
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