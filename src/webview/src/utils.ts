import { microTestsClassDef, microTestsImports } from "../../consts";

export const unindentString = (str: string) => str.replace(/^    /gm, '');

export const isHexColorDark = (hexColor: string) => {
    const c = hexColor.substring(1);      // strip #
    const rgb = parseInt(c, 16);   // convert rrggbb to decimal
    const red = (rgb >> 16) & 0xff;  // extract red
    const green = (rgb >>  8) & 0xff;  // extract green
    const blue = (rgb >>  0) & 0xff;  // extract blue

    const luma = 0.2126 * red + 0.7152 * green + 0.0722 * blue; // per ITU-R BT.709

    if (luma < 40) {
        return true;
    }
    return false;
}

export const transformTest = (test: any) => {    
    test.urlVariableName = getUrlVariableNameForTestTarget(test.target);

    test.code = test.code.replace('def ', 'def test_');
    test.code = test.code.replaceAll('self.base_url', test.urlVariableName);
    test.code = test.code.replaceAll('resp = self.', 'resp = requests.');

    return test;
}

export const getUrlVariableNameForTestTarget = (testTarget: string) => {
    if (testTarget.indexOf('://') > -1) {
        testTarget = testTarget.split('://')[1];
    }

    // convert '.' and '-' to '_' so the variable name is valid in python
    testTarget = testTarget.replace(/\.|-/g,'_')
    return `url_${testTarget}`;
}

export const getRequestBodySchemaForView = (endpointSchema: any) => {
    return endpointSchema.requestBody?.content?.['application/json']?.schema?.properties;
}

export const getResponseBodySchemaForView = (endpointSchema: any) => {
    if (!endpointSchema.responses) {
        return null;
    }

    const responseCode = Object.keys(endpointSchema.responses ?? {})?.[0];

    if (!responseCode) {
        return null;
    }

    const contentType = Object.keys(endpointSchema.responses[responseCode].content ?? {})?.[0];

    if (!contentType) {
        return null;
    }
    
    const responseSchema =  endpointSchema.responses[responseCode].content[contentType]?.schema;

    const bodyName = Object.keys(responseSchema ?? {})?.[0];

    return responseSchema?.[bodyName]?.properties;
}

export const getAssertionsCodeForSpan = (span: any, indent: string = ''): string => {
    let code = "";
    for (const assertion of (span.assertions ?? [])) {
        const splitSpec = assertion.spec.replaceAll('\n', '').split('\t');
        switch (splitSpec[0]) {
            case 'status':
                code += indent + `# assert resp.status_code in [${assertion.expected.join(", ")}]\n`
                break;
            case 'body':
                switch (splitSpec[1]) {
                    case 'json':
                        const jsonPath = splitSpec[2];
                        if (!assertion.expected) { // assert css path exists regardless of value
                            code += indent +  `# assert parse("${jsonPath}").find(resp.json())\n`;
                        } else {
                            code += indent +  `# assert parse("${jsonPath}").find(resp.json())[0].value == ${JSON.stringify(assertion.expected)}\n`;
                        }
                        break;
                    case 'html':
                        const cssSelector = splitSpec[2];
                        if (!assertion.expected) { // assert css path exists regardless of value
                            code += indent +  `# assert html.fromstring(resp.text).cssselect("${cssSelector}")\n`;
                        } else {
                            code += indent +  `# assert html.fromstring(resp.text).cssselect("${cssSelector}")[0].text == "${assertion.expected}"\n`;
                        }
                }
            break;
        }
    }

    const avgRt = span.kpis.avg_rt;
    code += indent + `# assert resp.elapsed.total_seconds() < ${avgRt * 2} # this is based on in-cluster average response time\n`;

    return code;
}

export const getEndpointSchema = (endpoint, workspaceOAS) => {
    return workspaceOAS?.[endpoint.service]?.paths?.[endpoint.path]?.[endpoint.method.toLowerCase()];
};
