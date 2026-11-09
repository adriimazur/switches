import { withBase } from "../../base";

export type VideoSlotProps = {
  /** Video file URL (a "/file.mp4" in public/ gets the basePath). Without it, a "Demo video coming" placeholder shows. */
  src?: string;
  /** Still image shown before the video plays. */
  poster?: string;
  /** Accessible name for the video, e.g. "A client picking a hero version". */
  title: string;
  /** Short line under the video. */
  caption?: string;
};

export function VideoSlot({ src, poster, title, caption }: VideoSlotProps) {
  return (
    <figure className="s-video">
      {src ? (
        <video className="s-video-frame" controls playsInline preload="metadata" poster={poster && withBase(poster)} aria-label={title}>
          <source src={withBase(src)} />
        </video>
      ) : (
        <div className="s-video-frame s-video-empty" role="img" aria-label={`${title}: video coming soon`}>
          <span className="s-video-play" aria-hidden />
          <span className="s-video-soon">Demo video coming</span>
          <span className="s-video-sub">A screen recording of a real round, start to finish.</span>
        </div>
      )}
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  );
}
