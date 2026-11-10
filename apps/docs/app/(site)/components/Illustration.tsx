import { PRODUCT_NAME } from "../../site";
import { IllustrationClient } from "./stage/IllustrationClient";

// The product illustration on the Overview page: a preview site with the
// Switches panel open at the bottom left, animated with the Stageshow kit
// (vendored in ./stage/kit). The pointer flips the Hero switch and picks a
// Pricing version; each section behind changes version as it does. On a
// phone-width column the same round plays on a phone. With reduced motion it
// shows the poster: Hero on (split), One plan picked. Pressing the picture or
// the pause button stops the loop, and the picture can then be clicked like
// the real panel. How it was made and checked: ./stage/REHEARSAL.md.

export function Illustration() {
  return (
    <IllustrationClient
      label={`Animation: a preview site with the ${PRODUCT_NAME} panel open at the bottom left. A pointer turns the Hero switch off and on, and the hero behind changes between a centred and a split version; it picks Tiers, then One plan, in the Pricing control, and the pricing section changes between three tiers and a single plan.`}
    />
  );
}
