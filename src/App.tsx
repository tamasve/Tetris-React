import { useState } from 'react'
import Board from './component/Board'
import { EmptyCell } from './types'
import { useTetris } from './hooks/useTetris'

// import './App.css'


function App() {

    const {board, startGame, isPlaying} = useTetris();

    return (
        <div className='App'>
            <h1>Tetris</h1>
            <Board currentBoard={board} />
            <div className="controls">
                {isPlaying ? null : (
                    <button onClick={startGame}>New Game</button>
                )}
            </div>
        </div>
    )
}

export default App
