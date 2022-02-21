import { microTestsClassDef, microTestsImports } from "./consts";

export const getTestCodeHeader = (test: any) => {
    return `${microTestsImports}

${test.urlVariableName} = "${test.target}"

${microTestsClassDef}
`;
}