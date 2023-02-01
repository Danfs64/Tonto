import { Model } from "../language-server/generated/ast";
import { extractDestinationAndName } from "./cli-util";
import { generate } from "./MicronautGenerator/main-generator";

export function generateMicronaut(
  model: Model,
  filePath: string,
  destination: string | undefined
): string {
  const data = extractDestinationAndName(filePath, destination);

  generate(model, data.destination)
  return data.destination;
}
