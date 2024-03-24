export enum Block {
    I = 'I',
    J = 'J',
    L = 'L',
    O = 'O',
    S = 'S',
    T = 'T',
    Z = 'Z'
}

export enum EmptyCell {
    Empty = 'Empty'
}

export type CellOptions = Block | EmptyCell;

export type BoardShape = CellOptions[][];

export type BlockShape = boolean[][];   // to describe the shapes as 2D forms: true if it fills the cell and false if it does not

interface ShapesObj {
    I: {shape: BlockShape};
    J: {shape: BlockShape};
    L: {shape: BlockShape};
    O: {shape: BlockShape};
    S: {shape: BlockShape};
    T: {shape: BlockShape};
    Z: {shape: BlockShape};
}

export const SHAPES: ShapesObj = {
    I: {
        shape: [
            [false, false, false, false],
            [false, false, false, false],
            [true, true, true, true],
            [false, false, false, false]
        ]
    },
    J: {
        shape: [
            [false, false, false],
            [true, false, false],
            [true, true, true],
        ]
    },
    L: {
        shape: [
            [false, false, false],
            [false, false, true],
            [true, true, true],
        ]
    },
    O: {
        shape: [
            [true, true],
            [true, true],
        ]
    },
    S: {
        shape: [
            [false, false, false],
            [false, true, true],
            [true, true, false],
        ]
    },
    T: {
        shape: [
            [false, false, false],
            [false, true, false],
            [true, true, true],
        ]
    },
    Z: {
        shape: [
            [false, false, false],
            [true, true, false],
            [false, true, true],
        ]
    },
}