import React, { useMemo } from "react";
import { Accordion, Table } from "react-bootstrap";
import AceEditor from "react-ace";
import { getRequestBodySchemaForView, getResponseBodySchemaForView } from "../utils";

export interface EndpointSchemaProps {
    schema: any;
    isThemeDark: boolean;
}

interface SchemaAccordionProps {
    header: string;
    key: string;
}

const SchemaAccordion: React.FC<SchemaAccordionProps> = ({header, key, children}) => {
    const inputBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--vscode-input-background');

    return <Accordion className="accordion" style={{background: `${inputBackgroundColor}15 !important`}}>
        <Accordion.Item eventKey={key} style={{background: `${inputBackgroundColor}15 !important`}}>
            <Accordion.Header style={{background: `${inputBackgroundColor}15 !important`}}>{header}</Accordion.Header>
            <Accordion.Body style={{background: `${inputBackgroundColor}15 !important`}}>
                {children}
            </Accordion.Body>
        </Accordion.Item>
    </Accordion>;
};

const EndpointSchema: React.FC<EndpointSchemaProps> = ({schema, isThemeDark}) => {


    const requestBody = useMemo(() => JSON.stringify(getRequestBodySchemaForView(schema), null, 4), [schema]);

    const backgroundContrastColor = getComputedStyle(document.documentElement).getPropertyValue('--vscode-editor-foreground');

    const responses = useMemo(() => {
        const responses = [];
        for (const [responseCode, responseCodeValue] of Object.entries<any>(schema.responses ?? {})) {
            if (!responseCodeValue.content) {
                responses.push({
                    code: responseCode,
                    description: responseCodeValue.description
                });
                continue
            }

            for (const [contentType, contentTypeValue] of Object.entries<any>(responseCodeValue.content ?? {})) {
                responses.push({
                    code: responseCode,
                    description: responseCodeValue.description,
                    contentType: contentType,
                    schema: JSON.stringify(contentTypeValue.schema?.properties, null, 4)
                });
            }
        };
        console.log('responses', responses);
        return responses;
    }, schema);

    return <div style={{marginTop: "6px", overflowY: "auto", maxHeight: "calc(100% - 65px)"}}>
        {schema?.parameters && <SchemaAccordion header="Parameters" key={"params"}>
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Param Location</th>
                        <th>Type</th>
                        <th>Required</th>
                    </tr>
                </thead>
                <tbody>
                    {schema.parameters.map(param => {
                        return <tr key={param.name}>
                            <td>{param.name}</td>
                            <td>{param.in}</td>
                            <td>{param.schema.type}</td>
                            <td>{param.required ? "Yes" : "No"}</td>
                        </tr>
                    })}
                </tbody>
            </table>
        </SchemaAccordion>}
        {requestBody?.length > 5 && <SchemaAccordion header="Request Body" key="requestBody">
            <AceEditor width="100%" mode="python" fontSize="15px" maxLines={1000} style={{background: `${backgroundContrastColor}15`}}
                                theme={isThemeDark ? "chaos" : "chrome"} readOnly={true} value={requestBody}  className="schema-code" 
                                    setOptions={{showGutter: false, hScrollBarAlwaysVisible: false, highlightActiveLine: false, enableEmmet: false}}/>
        </SchemaAccordion>}
        <SchemaAccordion header="Responses" key="responseBody">
            {responses.map(response => {
                return <div>
                    <table>
                        <thead>
                            <tr>
                                <th>Code</th>
                                <th>Description</th>
                                {response.contentType && <th>Content Type</th>}
                            </tr>
                        </thead>
                        <tbody>
                            <td>{response.code}</td>
                            <td>{response.description}</td>
                            {response.contentType && <td>{response.contentType}</td>}
                        </tbody>
                    </table>
                    {response.schema && <AceEditor width="100%" mode="python" fontSize="15px" maxLines={1000} style={{background: `${backgroundContrastColor}15`}}
                                theme={isThemeDark ? "chaos" : "chrome"} readOnly={true} value={response.schema}  className="schema-code" 
                                    setOptions={{showGutter: false, hScrollBarAlwaysVisible: false, highlightActiveLine: false, enableEmmet: false}}/>}
                </div>
            })}
        </SchemaAccordion>
        {/* {responseBody?.length > 5 && <SchemaAccordion header="Response Body" key={"responseBody"}>
            <AceEditor width="100%" mode="python" fontSize="15px" maxLines={1000}
                                theme={isThemeDark ? "chaos" : "chrome"} readOnly={true} value={responseBody}
                                    setOptions={{showGutter: false, hScrollBarAlwaysVisible: false, highlightActiveLine: false, enableEmmet: false}}/>
        </SchemaAccordion>} */}
    </div>;
};

export default EndpointSchema;