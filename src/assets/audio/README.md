# Audio assets

These `.wav` files are **original audio**, synthesized by `scripts/generate-audio.js`.
They are free to use with the game. Regenerate them with:

```
node scripts/generate-audio.js
```

Replace any file with your own recording (same file name) and reload the app.
No code changes are needed.

| File         | When it plays                                   |
| ------------ | ----------------------------------------------- |
| `tap.wav`    | A tile is tapped                                |
| `undo.wav`   | Undo / restart                                  |
| `hint.wav`   | A hint is revealed                              |
| `button.wav` | Any menu button                                 |
| `win.wav`    | Level solved                                    |
| `star.wav`   | Each star pops in on the victory screen, bonus  |
| `fail.wav`   | Out of moves                                    |
| `music.wav`  | Background music, looped                        |

To use another format (e.g. `.mp3` or `.ogg`), update the `require` paths in
`src/services/audio.ts`. Keep effects short (under ~1 s) for snappy feedback.
