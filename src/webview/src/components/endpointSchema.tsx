import React, { useMemo, useState } from "react";
import { Accordion, Table } from "react-bootstrap";
import AceEditor from "react-ace";
import { getRequestBodySchemaForView, getResponseBodySchemaForView } from "../utils";
import { getHeapCodeStatistics } from "v8";
import { Redoc, RedocStandalone } from "redoc";

export interface EndpointSchemaProps {
    schema: any;
    isThemeDark: boolean;
}

interface SchemaAccordionProps {
    header: string;
    key: string;
    collapsedSuffix?: string;
    hideOnStart?: boolean;
}

const noneAccordionKey = "none";
const OASSchemaTest = {
    "operationId": "84d60c09-a9a4-49fa-aa8c-aff7d7971293",
    "parameters": [
        {
            "examples": [
                "LY-007",
                "LY-011",
                "LH-213",
                "BA-411"
            ],
            "in": "query",
            "name": "product_id",
            "required": true,
            "schema": {
                "type": "string"
            }
        },
        {
            "examples": [
                "trdemo-client.trdemo"
            ],
            "in": "header",
            "name": "x-mizu-destination",
            "required": false,
            "schema": {
                "type": "string"
            }
        }
    ],
    "responses": {
        "302": {
            "content": {
                "text/html": {
                    "example": "<!DOCTYPE HTML PUBLIC \"-//W3C//DTD HTML 3.2 Final//EN\">\n<title>Redirecting...</title>\n<h1>Redirecting...</h1>\n<p>You should be redirected automatically to target URL: <a href=\"/cart\">/cart</a>.  If not click the link.</p>"
                }
            },
            "description": "Found"
        }
    },
    "summary": "Seen 6 requests",
    "tags": [
        "cart"
    ],
    "x-endpoints": [
        "84d60c09-a9a4-49fa-aa8c-aff7d7971293"
    ],
    "x-kpis": {
        "avg_rt": 0.006871630716079488,
        "entries": 6,
        "err_rate": 0,
        "failures": 0,
        "first_seen": 1636036878.146157,
        "hits_rate": 0.139290034404702,
        "last_active": 1636036947.421457,
        "last_seen": 1636036947.421457,
        "sessions": 2,
        "sum_duration": 43.075587034225464,
        "sum_rt": 0.29599952697753906
    }
}
 
const SchemaAccordion: React.FC<SchemaAccordionProps> = ({header, key, hideOnStart, collapsedSuffix, children}) => {
    const inputBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--vscode-input-background');
    const inputForegroundColor = getComputedStyle(document.documentElement).getPropertyValue('--vscode-input-foreground');
    const [isCollapsed, setIsCollapsed] = useState(hideOnStart);

    return <Accordion className="accordion" activeKey={isCollapsed ? noneAccordionKey : key}>
        <Accordion.Item eventKey={key}>
            <Accordion.Header onClick={_ => setIsCollapsed(!isCollapsed)} style={{background: `${inputForegroundColor}10`}}>
                {header}
                {isCollapsed ?
                    <span style={{fontWeight: "bold", marginLeft: "0.5em"}}>
                        {collapsedSuffix ?? ""}
                    </span> : ""
                }
            </Accordion.Header>
            <Accordion.Body>
                {children}
            </Accordion.Body>
        </Accordion.Item>
        {hideOnStart && <Accordion.Item eventKey={noneAccordionKey} style={{height: 0, visibility: "hidden"}} /> }
    </Accordion>;
};

const EndpointSchema: React.FC<EndpointSchemaProps> = ({schema, isThemeDark}) => {
    if (!schema) {
        return <></>;
    }

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
        return responses;
    }, schema);

    const responseCodes = useMemo(() => {
        const codes = new Set(responses.map(response => response.code));
        return Array.from(codes);
    }, [responses]);

    return <div style={{marginTop: "6px", overflowY: "auto", maxHeight: "calc(100vh - 300px)"}}>
        {schema?.parameters?.length ? <SchemaAccordion header="Parameters" key={"params"}>
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
        </SchemaAccordion> : null}
        {requestBody?.length > 5 && <SchemaAccordion header="Request Body" key="requestBody">
            <AceEditor width="100%" mode="python" fontSize="15px" maxLines={1000} style={{background: `${backgroundContrastColor}15`}}
                                theme={isThemeDark ? "chaos" : "chrome"} readOnly={true} value={requestBody}  className="schema-code" 
                                    setOptions={{showGutter: false, hScrollBarAlwaysVisible: false, highlightActiveLine: false, enableEmmet: false}}/>
        </SchemaAccordion>}
        {responses?.length > 0 && <SchemaAccordion header={"Response"} key="responseBody" hideOnStart={true} collapsedSuffix={responseCodes.join(", ")}>
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
        </SchemaAccordion>}
    </div>;
};

export default EndpointSchema;