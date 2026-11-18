import { GuessRow } from '@/components/flip-code/GuessRow';
import type { MascotId, Peg } from '@/flip-code/types';

interface SecretCodeProps {
  secret: MascotId[];
  revealed: boolean;
}

const HIDDEN: (MascotId | null)[] = [null, null, null, null];
const EMPTY: Peg[] = ['empty', 'empty', 'empty', 'empty'];
const SOLVED: Peg[] = ['exact', 'exact', 'exact', 'exact'];

/** Same slots as a guess. Empty until the code is revealed, with peg circles beside them. */
export function SecretCode({ secret, revealed }: SecretCodeProps) {
  return (
    <GuessRow
      slots={revealed ? secret : HIDDEN}
      pegs={revealed ? SOLVED : EMPTY}
      active={false}
      selectedIndex={null}
      onPressSlot={() => {}}
    />
  );
}
