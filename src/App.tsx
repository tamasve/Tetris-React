import { useState } from 'react'
import Board from './component/Board'
import { EmptyCell } from './types'
import { useTetris } from './hooks/useTetris'
import UpcomingBlocks from './hooks/UpcomingBlocks';

// import './App.css'


function App() {

    const {board, startGame, isPlaying, score, upcomingBlocks} = useTetris();

    return (
        <div className='App'>
            <h1>Tetris</h1>
            <Board currentBoard={board} />
            <div className="controls">
                <h2>Score: {score}</h2>
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
