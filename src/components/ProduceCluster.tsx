import { ProduceScene } from "./ProduceScene";

/**
 * The produce crop on the brand screens. Cropped by the viewport edge rather
 * than centred — the overlap is the look.
 *
 * It sits behind the step's own content on a negative layer, so the form never
 * has to compete with it and a tap always reaches the control underneath.
 */
export function ProduceCluster({
  variant,
}: {
  variant: "name" | "ready" | "how";
}) {
  return (
    <ProduceScene
      variant={variant}
      className="fixed inset-x-0 bottom-0 -z-10 h-[42vh] max-h-[300px] min-h-[150px]"
    />
  );
}
