import { Card, Col, Container, Form, Row } from "react-bootstrap";
import React, { useEffect, useState, useMemo } from "react";
import AceEditor from "react-ace";
import { v4 as uuidv4 } from 'uuid';

import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/mode-json";
import "ace-builds/src-noconflict/theme-chaos";
import "ace-builds/src-noconflict/theme-chrome";

import { copyIcon, inputIcon } from "./svgs";
import {sendApiMessage, sendInfoToast, sendPushCodeToEditor } from "../providers/extensionConnectionProvider";
import { isHexColorDark, transformTest, getAssertionsCodeForSpan, getEndpointSchema } from "../utils";
import { ApiMessageType } from "../../../models/internal";
import { microTestsHeader } from "../../../consts";
import EndpointSchema from "./endpointSchema";

enum TestCodeMode {
    Test = "test",
    Schema = "schema"
}

export interface TestCodeViewerProps {
    workspace: string;
    endpoint: any;
    spans: any;
    workspaceOAS: any;
}

const TestCodeViewer: React.FC<TestCodeViewerProps> = ({ workspace, endpoint, spans, workspaceOAS}) => {

    const [isThemeDark, setIsThemeDark] = useState(null);
    const [testsLoaded, setTestsLoaded] = useState(false);
    const [endpointTest, setEndpointTest] = useState(null);
    const [testCodeMode, setTestCodeMode] = useState(TestCodeMode.Test);

    const editorBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--vscode-editor-background');

    useEffect(() => {
        setIsThemeDark(isHexColorDark(editorBackgroundColor))
    }, [editorBackgroundColor]);

    const copyToClipboard = (text: string) => {
        sendInfoToast("Test code copied to clipboard");
        navigator.clipboard.writeText(text)
    };

    useEffect(() => {
        (async () => {
            setEndpointTest(null);
            setTestsLoaded(false);
            if (endpoint) {
                try {
                    const tests = await sendApiMessage(ApiMessageType.EndpointTests, {workspaceId: workspace, spanGuid: endpoint.uuid});
                    setTestsLoaded(true);
                    if (tests?.tests?.length < 1) {
                        return;
                    }
                    const test = transformTest(tests.tests[0]);
                    test.uuid = uuidv4(); //for react Key prop

                    setEndpointTest(test);
                } catch (error) {
                    console.log('error loading tests', error);
                    setTestsLoaded(false);
                }

            }
        })()
    }, [endpoint?.uuid]);

    const endpointSpan = useMemo(() => {
        if (!spans || !endpoint) {
            console.log('returning cause null');
            return null;
        }

        return spans.find(span => span.uuid === endpoint.uuid);
    }, [workspace, endpoint]);

    const endpointSchema = useMemo(() => {
        if (!endpoint || !workspaceOAS) {
            return null;
        }

        return getEndpointSchema(endpoint, workspaceOAS);
    }, [endpoint, workspaceOAS]);

    const testCode = useMemo(() => {
        if (!endpointTest) {
            return null;
        }
        const testCode = endpointTest.code.replace('return resp', '');

        let generatedAssertions = '';
        if (endpointSpan) {
            try {
                generatedAssertions = getAssertionsCodeForSpan(endpointSpan, '        ');
            } catch (error) {
                console.error("error generating assertions", error);
            }
        }
        
        return `${testCode}\n${generatedAssertions}`;
    }, [endpointTest, endpointSchema, endpointSpan]);

    useEffect(() => {
        // make sure ui doesnt reach a weird state where no schema is available and we hide the schema radio button
        if (!endpointSchema && testCodeMode == TestCodeMode.Schema) {
            setTestCodeMode(TestCodeMode.Test);
        }
    }, [endpointSchema, testCodeMode]);


    if (testsLoaded && !endpointTest) {
        return <p>No code found for this endpoint</p>;
    } else if (!endpointTest) {
        return null;
    }
    
    return <div className="tests-list-container">
                <Form.Group className="check-box-container">
                    <a className={"anchor-tab" + (testCodeMode == TestCodeMode.Test ? " active" : "")} onClick={_ => setTestCodeMode(TestCodeMode.Test)}>Code</a>
                    {endpointSchema && <a className={"anchor-tab" + (testCodeMode == TestCodeMode.Schema ? " active" : "")} onClick={_ => setTestCodeMode(TestCodeMode.Schema)}>Schema</a>}
                </Form.Group> 
                <Container className="test-code-container">
                <Card className="test-row">
                    {testCodeMode === TestCodeMode.Schema ? <EndpointSchema schema={getEndpointSchema(endpoint, workspaceOAS)} isThemeDark={true} /> : 
                    <>
                        <Card.Header className="test-row-card-header">
                            <Container>
                                <Row>
                                    <Col xs="2" md="2" lg="2" className="floating-buttons" style={{"padding": "0"}}>
                                        <span className="clickable" style={{marginRight: "5px"}} onClick={_ => copyToClipboard(testCode)}>{copyIcon}</span>
                                        <span className="clickable" onClick={_ => sendPushCodeToEditor(testCode, microTestsHeader)}>{inputIcon}</span>
                                    </Col>
                                    <Col xs="10" md="10" lg="10" style={{"paddingLeft": "5px"}}></Col>
                                </Row>
                            </Container>
                        </Card.Header>
                        <Card.Body style={{height: "100%", overflowY: "auto"}}>
                                <AceEditor width="100%" mode="python" fontSize="14px" maxLines={1000}
                                theme={isThemeDark ? "chaos" : "chrome"} readOnly={true} value={`${microTestsHeader}\n${testCode}`}
                                    setOptions={{showGutter: false, hScrollBarAlwaysVisible: false, highlightActiveLine: false}}/>
                        </Card.Body>
                    </>
                    }
                    </Card>
                </Container>
    </div>
};

export default TestCodeViewer;
