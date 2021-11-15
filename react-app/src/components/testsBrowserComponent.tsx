import React, { useContext, useEffect, useState } from "react";
import {observer} from "mobx-react";
import { up9AuthStore } from "../stores/up9AuthStore";
import {ApiRequestTypes, sendApiRequest, SendInfoToast} from "../providers/extensionConnectionProvider";
import {Form, Container, Row, Col, Button, Accordion, useAccordionButton, Card, AccordionContext} from 'react-bootstrap';
import { isHexColorDark, unindentString } from "../utils";
import { v4 as uuidv4 } from 'uuid';

import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-chaos";
import "ace-builds/src-noconflict/theme-chrome";


const TestsBrowserComponent: React.FC<{}> = observer(() => {
    const [workspaces, setWorkspaces] = useState(null);
    const [selectedWorkspace, setSelectedWorkspace] = useState("");

    const [endpoints, setEndpoints] = useState(null);
    const [selectedEndpoint, setSelectedEndpoint] = useState("");

    const [tests, setTests] = useState(null);

    const editorBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--vscode-editor-background');

    const [isThemeDark, setIsThemeDark] = useState(isHexColorDark(editorBackgroundColor));

    useEffect(() => {
        setIsThemeDark(isHexColorDark(editorBackgroundColor))
    }, [editorBackgroundColor]);

    const refreshWorkspaces = async () => {
        try {
            const workspaces = await sendApiRequest(ApiRequestTypes.WorkspacesList, null);
            setWorkspaces(workspaces);
        } catch(error) {
            console.log(error);
        }
    }

    useEffect(() => {
        (async () => {
            setSelectedEndpoint("");
            setEndpoints(null);
            if (selectedWorkspace) {
                try {
                    const endpoints = await sendApiRequest(ApiRequestTypes.EndpointsList, {workspaceId: selectedWorkspace});
                    setEndpoints(endpoints);
                } catch (error) {
                    console.log('error loading endpoints', error);
                }
            }
        })()
    }, [selectedWorkspace]);

    useEffect(() => {
        (async () => {
            setTests(null);
            if (selectedEndpoint) {
                try {
                    const tests = await sendApiRequest(ApiRequestTypes.EndpointTests, {workspaceId: selectedWorkspace, spanGuid: selectedEndpoint});
                    for (const test of tests?.tests ?? []) {
                        test.code = unindentString(test.code); // tests from up9 come over indented by 4 spaces
                        test.uuid = uuidv4(); //for react Key prop
                    }
                    setTests(tests);
                } catch (error) {
                    console.log('error loading tests', error);
                }
            }
        })()
    }, [selectedEndpoint]);

    useEffect(() => {
        if (up9AuthStore.up9Env) {
            setSelectedWorkspace("");

            refreshWorkspaces()
        }
    }, [up9AuthStore.up9Env]);

    const copyToClipboard = (text: string) => {
        SendInfoToast("Test code copied to clipboard");
        navigator.clipboard.writeText(text)
    }

    return <div>
            <div className="select-test-form">
                <Form.Group className="workspaces-form-group">
                    <Form.Label>Workspace</Form.Label>
                    <Form.Select value={selectedWorkspace} placeholder="Select a workspace..." onChange={e => setSelectedWorkspace(e.target.value)}>
                        <option hidden>Select a workspace</option>
                        {workspaces?.map((workspace) => {return <option key={workspace} value={workspace}>{workspace}</option>})}
                    </Form.Select>
                </Form.Group>

                <Form.Group className="endpoints-form-group">
                    <Form.Label>Endpoint</Form.Label>
                    <Form.Select value={selectedEndpoint} onChange={e => setSelectedEndpoint(e.target.value)} disabled={!selectedWorkspace}>
                    <option hidden>Select a service endpoint</option>
                    {endpoints?.map((endpoint) => {return <option key={endpoint.uuid} value={endpoint.uuid}>{`${endpoint.method.toUpperCase()} ${endpoint.service}${endpoint.path}`}</option>})}
                    </Form.Select>
                </Form.Group>
            </div>
            {tests?.tests && <>
            <hr/>
            <div className="tests-list-container">
            <Form.Group>
                <Form.Label>Tests</Form.Label>
            </Form.Group>
            <Container>
                <Accordion>
                    {tests.tests.map(test => {
                        return <Card key={test.uuid} className="test-row">
                            <Card.Header className="test-row-card-header">
                                <Container>
                                    <Row key={test.uuid}>
                                        <Col xs="9" md="9" lg="9">{test.variantDisplayName}</Col>
                                        <Col xs="1" md="1" lg="1" style={{"padding": "0", "margin": "0px 15px 0 0"}}>
                                            <CustomAccordionTrigger eventKey={test.uuid} />
                                        </Col>
                                        <Col xs="1" md="1" lg="1" style={{"padding": "0"}}>
                                            <Button variant="primary" onClick={_ => copyToClipboard(test.code)}>Copy</Button>
                                        </Col>
                                    </Row>
                                </Container>
                            </Card.Header>
                            <Accordion.Collapse eventKey={test.uuid}>
                                <Card.Body>
                                    <AceEditor width="100%" mode="python" fontSize="14px" theme={isThemeDark ? "chaos" : "chrome"} readOnly={true} value={test.code} setOptions={{showGutter: false, hScrollBarAlwaysVisible: false, highlightActiveLine: false}}/>
                                </Card.Body>
                            </Accordion.Collapse>
                            </Card>;
                    })}
                </Accordion>
            </Container>
            </div>
            </>}
            {(tests && !tests.tests) && <p>No tests found for this endpoint</p>}
        </div>;
});

function CustomAccordionTrigger({eventKey}) {
    const { activeEventKey } = useContext(AccordionContext);
    const decoratedOnClick = useAccordionButton(eventKey);

    const isThisButtonActive = activeEventKey == eventKey;
  
    return (
        <Button variant="primary" onClick={_ => decoratedOnClick(eventKey)}>{isThisButtonActive ? "Close" : "View"}</Button>
    );
  }


export default TestsBrowserComponent;