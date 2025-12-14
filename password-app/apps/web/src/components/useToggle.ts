import { useState } from 'react';

export function useToggle(initial = false): [boolean, () => void] {
  const [state, setState] = useState(initial);
  const toggle = () => setState((v) => !v);
  return [state, toggle];
}
