import type { ImageSourcePropType } from 'react-native';

import type { MascotId } from './types';

export interface CodeMascot {
  id: MascotId;
  name: string;
  source: ImageSourcePropType;
}

export const CODE_MASCOTS: CodeMascot[] = [
  { id: 0, name: 'Purple', source: require('../assets/images/maskota.png') },
  { id: 1, name: 'Pink', source: require('../assets/images/maskota-2.png') },
  { id: 2, name: 'Blue', source: require('../assets/images/maskota-3.png') },
  { id: 3, name: 'Green', source: require('../assets/images/maskota-4.png') },
];

export function mascotById(id: MascotId): CodeMascot {
  return CODE_MASCOTS[id];
}
