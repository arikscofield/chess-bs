import './App.css'
import Square from "./Square.tsx";
import {Color, type Piece, PieceType} from "@chess-bs/common";

function App() {

    const testPiece: Piece = {
        pieceType: PieceType.Pawn,
        color: Color.White,
        hasMoved: false
    }

  return (
    <>
        <div className="w-[300px] grid-rows-8">
            {[0, 1, 2, 3, 4, 5, 6, 7].map((row) => (
                <div key={row} className={"grid-cols-8"}>
                    {[0, 1, 2, 3, 4, 5, 6, 7].map((col) => (
                        <div key={col}>
                            <Square row={row} col={col} piece={testPiece} view={Color.White}/>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    </>
  )
}

export default App
