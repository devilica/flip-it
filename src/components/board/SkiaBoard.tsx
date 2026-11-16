import { Canvas } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { affectedCells } from '@/game/engine';
import type { Board } from '@/game/types';
import { useTheme } from '@/hooks/useTheme';
import type { TapEvent } from '@/store/gameStore';
import { shade } from '@/utils/color';
import { boardGeometry, cellAt, tileOrigin } from './boardGeometry';
import { HintRing } from './HintRing';
import { Tile } from './Tile';

const NEIGHBOR_DELAY_MS = 70;

interface SkiaBoardProps {
  board: Board;
  /** Pixel width and height of the square board. */
  size: number;
  lastTap: TapEvent | null;
  hintCell: number | null;
  interactive: boolean;
  celebrate: boolean;
  onTapCell: (index: number) => void;
}

export function SkiaBoard({ board, size, lastTap, hintCell, interactive, celebrate, onTapCell }: SkiaBoardProps) {
  const theme = useTheme();
  const geometry = useMemo(() => boardGeometry(size, board.size), [size, board.size]);

  const fills = useMemo(() => theme.tiles.slice(0, board.colors), [theme.tiles, board.colors]);
  const shades = useMemo(() => fills.map((color) => shade(color, -0.35)), [fills]);

  const rippleCells = useMemo(
    () => (lastTap && lastTap.index >= 0 ? new Set(affectedCells(board.size, lastTap.index)) : null),
    [board.size, lastTap],
  );

  const gesture = useMemo(
    () =>
      Gesture.Tap()
        .runOnJS(true)
        .maxDuration(1500)
        .enabled(interactive)
        .onEnd((event, success) => {
          if (!success) return;
          const cell = cellAt(geometry, board.size, event.x, event.y);
          if (cell !== null) onTapCell(cell);
        }),
    [board.size, geometry, interactive, onTapCell],
  );

  const flipDelay = (index: number) => {
    if (!lastTap) return 0;
    if (lastTap.index < 0) {
      // Restart: sweep diagonally across the board.
      return (Math.floor(index / board.size) + (index % board.size)) * 35;
    }
    if (index === lastTap.index) return 0;
    return rippleCells?.has(index) ? NEIGHBOR_DELAY_MS : 0;
  };

  const celebrateDelay = (index: number) =>
    celebrate ? 120 + (Math.floor(index / board.size) + (index % board.size)) * 55 : 0;

  return (
    <View
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: geometry.corner + geometry.padding,
          backgroundColor: theme.boardBackdrop,
          shadowColor: theme.boardShadow,
        },
      ]}
      accessibilityLabel={`${board.size} by ${board.size} puzzle board`}
    >
      <GestureDetector gesture={gesture}>
        <View style={StyleSheet.absoluteFill} collapsable={false}>
          <Canvas style={StyleSheet.absoluteFill}>
            {board.cells.map((colorIndex, index) => {
              const { x, y } = tileOrigin(geometry, board.size, index);
              return (
                <Tile
                  key={index}
                  x={x}
                  y={y}
                  size={geometry.tile}
                  corner={geometry.corner}
                  colorIndex={colorIndex}
                  fills={fills}
                  shades={shades}
                  shine={theme.tileShine}
                  flipDelay={flipDelay(index)}
                  seq={lastTap?.seq ?? 0}
                  celebrateDelay={celebrateDelay(index)}
                />
              );
            })}
            {hintCell !== null ? (
              <HintRing
                {...tileOrigin(geometry, board.size, hintCell)}
                size={geometry.tile}
                corner={geometry.corner}
              />
            ) : null}
          </Canvas>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 14 },
    elevation: 14,
  },
});
