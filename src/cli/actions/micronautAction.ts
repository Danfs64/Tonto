import colors from "colors";
import { Model } from "../../language-server/generated/ast";
import { createTontoServices } from "../../language-server/tonto-module";
import { extractAstNode } from "../cli-util";
import { NodeFileSystem } from 'langium/node';
import { generateMicronaut } from "../micronautGenerator";

export type GenerateOptions = {
  destination?: string;
};

export const micronautAction = async (
  fileName: string,
  opts: GenerateOptions
): Promise<void> => {
  const generatedFilePath = await generateCommand(fileName, opts);
  console.log(
    colors.green(`Micronaut files generated successfully: ${generatedFilePath}`)
  );
};

export const generateCommand = async (
  fileName: string,
  opts: GenerateOptions
): Promise<string> => {
  const services = createTontoServices({...NodeFileSystem }).Tonto;
  const model = await extractAstNode<Model>(fileName, services);

  const generatedFilePath = generateMicronaut(model, fileName, opts.destination);
  return generatedFilePath;
};
