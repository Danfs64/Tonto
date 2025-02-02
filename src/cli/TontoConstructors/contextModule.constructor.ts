import { CompositeGeneratorNode, NL } from "langium";
import { Class, OntoumlElement, OntoumlType } from "ontouml-js";
import { constructClassElement } from "../TontoConstructors/classElement.constructor";
import { replaceWhitespace } from "../utils/replaceWhitespace";

export function createTontoModule(
  element: OntoumlElement,
  fileNode: CompositeGeneratorNode
) {
  const project = element.project;
  if (project) {
    project.getAllPackages().forEach((packageItem) => {
      if (packageItem.getName() !== "root") {
        fileNode.append(
          `module ${replaceWhitespace(packageItem.getName())} {`,
          NL
        );
        fileNode.indent((indent) => {
          packageItem.getAllContents().forEach((content) => {
            if (content.type === OntoumlType.CLASS_TYPE) {
              const classItem = content as Class;
              constructClassElement(packageItem, classItem, indent);
            }
          });
        });
        fileNode.append("}", NL);
      }
    });
  }
}
