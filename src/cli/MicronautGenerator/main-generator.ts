import { Model } from "../../language-server/generated/ast";

import { generateConfigs } from "./config-generator";

export function generateMicronaut(model: Model, target_folder: string) : void {
    generateConfigs(model, target_folder)
}