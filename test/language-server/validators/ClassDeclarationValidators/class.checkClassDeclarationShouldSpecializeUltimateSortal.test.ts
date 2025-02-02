import { EmptyFileSystem } from "langium";
import { ErrorMessages } from "../../../../src/language-server/models/ErrorMessages";
import { createTontoServices } from "../../../../src/language-server/tonto-module";
import { validationHelper } from "../../../../src/test/tonto-test";

describe("checkClassDeclarationShouldSpecializeUltimateSortal", async () => {
  const services = createTontoServices(EmptyFileSystem);
  const validate = validationHelper(services.Tonto);

  it("should have error with more than one specialization", async () => {
    const stub = `
      module CheckNonUltimateSortalSpecializesUniqueUltimateSortal {
        kind Person
        mode Organization

        subkind Agent specializes Organization, Person
        phase AgentPhase specializes Organization, Person
        role AgentRole specializes Organization, Person
        historicalRole AgentHistoricalRole specializes Organization, Person

        collective BiologicalAnimals
        quantity BiologicalQuantity
        subkind BioSubkind specializes BiologicalQuantity, BiologicalAnimals
        phase BioPhase specializes BiologicalQuantity, BiologicalAnimals
        role BioRole specializes BiologicalAnimals, BiologicalQuantity
        historicalRole BioHistoricalRole specializes BiologicalQuantity, BiologicalAnimals

        relator Relator
        quality Quality
        subkind RelatorSubkind specializes Relator, Quality
        phase RelatorPhase specializes Relator, Quality
        role RelatorRole specializes Relator, Quality
        historicalRole RelatorHistoricalRole specializes Relator, Quality
    }
    `;
    const validationResult = await validate(stub);

    const diagnostics = validationResult.diagnostics;

    expect(diagnostics).not.toBeNull();
    expect(diagnostics.length).toBe(12);

    diagnostics.forEach((error) => {
      expect(error.message).toBe(
        ErrorMessages.sortalSpecializesUniqueUltimateSortal
      );
    });
  });

  it("should have missing ultimateSortal specialization", async () => {
    const stub = `
    module CheckNonUltimateSortalSpecializesUniqueUltimateSortal {
      subkind TestSubkind
      phase TestPhase
      role TestRole
      historicalRole TestHistoricalRole
    }
    `;
    const validationResult = await validate(stub);

    const diagnostics = validationResult.diagnostics;

    expect(diagnostics).not.toBeNull();
    expect(diagnostics.length).toBe(4);

    diagnostics.forEach((error) => {
      expect(error.message).toBe(
        ErrorMessages.sortalSpecializeNoUltimateSortal
      );
    });
  });

  it("should have no error becase it's restricted to type nature", async () => {
    const stub = `
    module CheckNonUltimateSortalSpecializesUniqueUltimateSortal {
      subkind TestSubkindType of types
      phase TestPhaseType of types
      role TestRoleType of types
      historicalRole TestHistoricalRoleType of types
    }
    `;
    const validationResult = await validate(stub);

    const diagnostics = validationResult.diagnostics;

    expect(diagnostics).not.toBeNull();
    expect(diagnostics.length).toBe(0);
  });
});
