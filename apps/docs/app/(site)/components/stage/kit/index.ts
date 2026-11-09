// The parts of the Stageshow kit (MIT, Copyright (c) 2026 Benji Taylor; see
// ./LICENSE) that the Overview illustration uses, vendored so the site builds
// on its own. Only React and react-dom are needed. Upstream exports more; this
// barrel lists just the vendored files.
export { Stage } from './stage'
export type { StageProps, Play, LookTokens } from './stage'
export type { Act, Script } from './act'
export { Window, Bar, Text } from './window'
export { Phone } from './phone'
export { Segmented } from './controls/Segmented'
export { Toggle } from './controls/Toggle'
