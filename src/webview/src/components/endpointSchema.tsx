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

    console.log('inputBackgroundColor', `${inputBackgroundColor}15 !important`)

    return <Accordion className="accordion" style={{background: `${inputBackgroundColor}15 !important`}}>
        <Accordion.Item eventKey={key} style={{background: `${inputBackgroundColor}15 !important`}}>
            <Accordion.Header style={{background: `${inputBackgroundColor}15 !important`}}>{header}</Accordion.Header>
            <Accordion.Body style={{maxHeight: "700px", overflowY: "auto", background: `${inputBackgroundColor}15 !important`}}>
                {children}
            </Accordion.Body>
        </Accordion.Item>
    </Accordion>;
};

const EndpointSchema: React.FC<EndpointSchemaProps> = ({schema, isThemeDark}) => {


    const requestBody = useMemo(() => JSON.stringify(getRequestBodySchemaForView(schema), null, 4), [schema]);
    const responseBody = useMemo(() => JSON.stringify(getResponseBodySchemaForView(schema), null, 4), [schema]);

    return <div style={{marginTop: "6px"}}>
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
        {requestBody?.length > 5 && <SchemaAccordion header="Request Body" key={"requestBody"}>
            <AceEditor width="100%" mode="python" fontSize="15px" maxLines={1000}
                                theme={isThemeDark ? "chaos" : "chrome"} readOnly={true} value={requestBody}
                                    setOptions={{showGutter: false, hScrollBarAlwaysVisible: false, highlightActiveLine: false, enableEmmet: false}}/>
        </SchemaAccordion>}
        {responseBody?.length > 5 && <SchemaAccordion header="Response Body" key={"responseBody"}>
            <AceEditor width="100%" mode="python" fontSize="15px" maxLines={1000}
                                theme={isThemeDark ? "chaos" : "chrome"} readOnly={true} value={responseBody}
                                    setOptions={{showGutter: false, hScrollBarAlwaysVisible: false, highlightActiveLine: false, enableEmmet: false}}/>
        </SchemaAccordion>}
    </div>;
};

export default EndpointSchema;