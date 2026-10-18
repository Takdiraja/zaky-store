import { create } from "zustand";

interface FlyingBallStore {
  balls: { id: number; fromX: number; fromY: number; toX: number; toY: number; productName: string }[];
  throwBall: (fromX: number, fromY: number, toX: number, toY: number, productName: string) => void;
  removeBall: (id: number) => void;
}

let ballId = 0;

export const useFlyingBallStore = create<FlyingBallStore>((set) => ({
  balls: [],
  throwBall: (fromX, fromY, toX, toY, productName) => {
    const id = ballId++;
    set((s) => ({ balls: [...s.balls, { id, fromX, fromY, toX, toY, productName }] }));
    setTimeout(() => {
      set((s) => ({ balls: s.balls.filter((b) => b.id !== id) }));
    }, 700);
  },
  removeBall: (id) => {
    set((s) => ({ balls: s.balls.filter((b) => b.id !== id) }));
  },
}));
