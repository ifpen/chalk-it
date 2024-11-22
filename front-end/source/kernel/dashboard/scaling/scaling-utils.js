// ┌────────────────────────────────────────────────────────────────────┐ \\
// │ dashboard load for page view                                       │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Copyright © 2016-2024 IFPEN                                        │ \\
// | Licensed under the Apache License, Version 2.0                     │ \\
// ├────────────────────────────────────────────────────────────────────┤ \\
// │ Original authors(s): Abir EL FEKI, Mongi BEN GAID                  │ \\
// └────────────────────────────────────────────────────────────────────┘ \\

import { rmUnit } from 'kernel/datanodes/plugins/thirdparty/utils';

/*--------convert vw to px--------*/
export function convertVwtoPx(value) {
  value = rmUnit(value);
  return (value / 100) * document.documentElement.clientWidth;
}

/*--------convert vh to px--------*/
export function convertVhtoPx(value) {
  value = rmUnit(value);
  return (value / 100) * document.documentElement.clientHeight;
}

/*--------getFontFactor --------*/
export function getFontFactor() {
  // Might be used later if we allow multiple layouts.
  return 1;
}
