import Board from './component/Board'
import { TickSpeed, useTetris } from './hooks/useTetris'
import UpcomingBlocks from './hooks/UpcomingBlocks';


function App() {

    const {board, startGame, pauseGame, isPlaying, score, pieces, upcomingBlocks, tickSpeed} = useTetris();

    return (
        <div className='App'>
            <h1>Tetris</h1>
            <Board currentBoard={board} />
            <div className="controls">
                <button onClick={pauseGame}> {tickSpeed === TickSpeed.Paused ? "Resume Game" : "Pause Game"} </button>
                <h2>Score: {score}</h2>
                <h2>Pieces: {pieces}</h2>
                {isPlaying ? (
                    <UpcomingBlocks upcomingBlocks={upcomingBlocks} />
                ) : (
                    <button onClick={startGame}>New Game</button>
                    )}
            </div>
        </div>
    )
}

export default App
