import React, { useEffect, useState } from "react";
import {observer} from "mobx-react";
import { up9AuthStore } from "../stores/up9AuthStore";
import {sendApiMessage, SendInfoToast} from "../providers/extensionConnectionProvider";
import { ApiMessageType } from "../../../models/internal";
import {Form, Container, Row, Col, Button, Card} from 'react-bootstrap';
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

    const [testsLoaded, setTestsLoaded] = useState(false);
    const [endpointTest, setEndpointTest] = useState(null);

    const editorBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--vscode-editor-background');

    const [isThemeDark, setIsThemeDark] = useState(null);

    useEffect(() => {
        setIsThemeDark(isHexColorDark(editorBackgroundColor))
    }, [editorBackgroundColor]);

    const refreshWorkspaces = async () => {
        try {
            const workspaces = await sendApiMessage(ApiMessageType.WorkspacesList, null);
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
                    const endpoints = await sendApiMessage(ApiMessageType.EndpointsList, {workspaceId: selectedWorkspace});
                    setEndpoints(endpoints);
                } catch (error) {
                    console.log('error loading endpoints', error);
                }
            }
        })()
    }, [selectedWorkspace]);

    useEffect(() => {
        (async () => {
            setEndpointTest(null);
            setTestsLoaded(false);
            if (selectedEndpoint) {
                try {
                    const tests = await sendApiMessage(ApiMessageType.EndpointTests, {workspaceId: selectedWorkspace, spanGuid: selectedEndpoint});
                    setTestsLoaded(true);
                    if (tests?.tests?.length < 1) {
                        return;
                    }
                    let test = tests.tests.find(t => t.tag == "minimal");
                    if (!test) {
                        test = tests.tests[0];
                    }

                    test.code = unindentString(test.code); // tests from up9 come over indented by 4 spaces
                    test.uuid = uuidv4(); //for react Key prop

                    setEndpointTest(test);
                } catch (error) {
                    console.log('error loading tests', error);
                    setTestsLoaded(false);
                }
            }
        })()
    }, [selectedEndpoint]);

    useEffect(() => {
        setSelectedWorkspace("");
        if (up9AuthStore.up9Env && up9AuthStore.isAuthConfigured) {
            refreshWorkspaces()
        }
    }, [up9AuthStore.up9Env, up9AuthStore.isAuthConfigured]);

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
            {endpointTest && <>
            <hr/>
            <div className="tests-list-container">
            <Form.Group>
                <Form.Label>Test code</Form.Label>
            </Form.Group> 
            <Container>
                <Card className="test-row">
                    <Card.Header className="test-row-card-header">
                        <Container>
                            <Row>
                                <Col xs="10" md="10" lg="10" style={{"paddingLeft": "5px"}}>{endpointTest.variantDisplayName}</Col>
                                <Col xs="1" md="1" lg="1" style={{"padding": "0"}}>
                                    <Button variant="primary" onClick={_ => copyToClipboard(endpointTest.code)}>Copy</Button>
                                </Col>
                            </Row>
                        </Container>
                    </Card.Header>
                    <Card.Body>
                            <AceEditor width="100%" mode="python" fontSize="14px" maxLines={1000} height={`${14 * endpointTest.code.split(/\r\n|\r|\n/).length}px`}
                            theme={isThemeDark ? "chaos" : "chrome"} readOnly={true} value={endpointTest.code}
                                setOptions={{showGutter: false, hScrollBarAlwaysVisible: false, highlightActiveLine: false}}/>
                    </Card.Body>
                </Card>
            </Container>
            </div>
            </>}
            {(testsLoaded && !endpointTest) && <p>No test code found for this endpoint</p>}
        </div>;
});

export default TestsBrowserComponent;