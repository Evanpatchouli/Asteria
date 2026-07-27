import { z } from "zod";

/** Current pet package manifest protocol accepted by Asteria. */
export const PET_MANIFEST_PROTOCOL_VERSION = "1.1" as const;

/** Logical states understood by the Pet Runtime. */
export const PET_STATES = [
  "idle",
  "thinking",
  "coding",
  "tooling",
  "waiting",
  "happy",
  "error",
  "sleep",
] as const;

export const petAnimationSchema = z
  .object({
    source: z.string().min(1),
    loop: z.boolean(),
    frameRate: z.number().positive(),
  })
  .strict();

export const petManifestSchema = z
  .object({
    id: z.string().min(1),
    name: z.string().min(1),
    version: z.string().min(1),
    protocolVersion: z.literal(PET_MANIFEST_PROTOCOL_VERSION),
    renderer: z.literal("pixijs"),
    states: z
      .object({
        idle: z.string().min(1),
        thinking: z.string().min(1),
        coding: z.string().min(1),
        tooling: z.string().min(1),
        happy: z.string().min(1),
        error: z.string().min(1),
        waiting: z.string().min(1).optional(),
        sleep: z.string().min(1).optional(),
      })
      .strict(),
    animations: z.record(z.string().min(1), petAnimationSchema),
  })
  .strict()
  .superRefine((manifest, context) => {
    for (const [state, animationName] of Object.entries(manifest.states)) {
      if (animationName === undefined) {
        continue;
      }

      if (!(animationName in manifest.animations)) {
        context.addIssue({
          code: "custom",
          message: `State "${state}" references unknown animation "${animationName}".`,
          path: ["states", state],
        });
      }
    }
  });

/** Logical state names available to Runtime and Renderer integrations. */
export type PetState = (typeof PET_STATES)[number];
/** Validated animation entry declared by a pet package. */
export type PetAnimation = z.infer<typeof petAnimationSchema>;
/** Validated Asteria pet package manifest. */
export type PetManifest = z.infer<typeof petManifestSchema>;

/**
 * Validates an unknown pet package manifest before resources are loaded.
 */
export function parsePetManifest(input: unknown): PetManifest {
  return petManifestSchema.parse(input);
}
