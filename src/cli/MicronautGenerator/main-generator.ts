import fs from "fs";
import { Model } from "../../language-server/generated/ast";

import { generateConfigs } from "./config-generator";
import { generateModules } from "./module-generator";

export function generate(model: Model, target_folder: string) : void {
    fs.mkdirSync(target_folder, {recursive:true})
    generateConfigs(model, target_folder)
    generateModules(model, target_folder)
}