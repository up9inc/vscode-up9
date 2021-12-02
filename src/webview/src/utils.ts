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
    test.code = test.code.replace('def ', 'def test_');
    test.code = test.code.replaceAll('self.base_url', `"${test.target}"`);
    test.code = test.code.replaceAll('resp = self.', 'resp = requests.');

    return test;
}


// produces a simplified version of the endpoint schema for easier reading
export const getSchemaForViewForEndpointSchema = (endpointSchema: any) => {
    const requests = {};
    for (const requestContentType in endpointSchema.requestBody?.content) {
        const contentTypeRequestProperties = endpointSchema.requestBody?.content[requestContentType]?.schema?.properties;
        if (contentTypeRequestProperties) {
            requests[requestContentType] = contentTypeRequestProperties;
        }
    }

    const responses = {};

    for (const responseCode in endpointSchema.responses) {
        const response = endpointSchema.responses[responseCode];
        if (response.content) {
            responses[responseCode] = {};
            for (const contentType in response.content) {
                responses[responseCode][contentType] = {
                    schema: response.content[contentType].schema
                }
            }
        }
    }
    
    const schemaForView = {} as any;
    if (Object.keys(endpointSchema.parameters).length) {
        schemaForView.parameters = endpointSchema.parameters;
    }
    if (Object.keys(requests).length) {
        schemaForView.requests = requests;
    }
    if (Object.keys(responses).length) {
        schemaForView.responses = responses;
    }
    return JSON.stringify(schemaForView, null, 4);
};