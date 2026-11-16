/**
 * Dev-only switch. Flip the `true` to `false` to test the real level lock.
 * Release builds ignore this, because `__DEV__` is false there.
 */
// export const UNLOCK_ALL_LEVELS = __DEV__ && true;
export const UNLOCK_ALL_LEVELS = false;