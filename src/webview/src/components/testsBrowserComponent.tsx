import React, { useEffect, useState, useMemo } from "react";
import {observer} from "mobx-react";
import { up9AuthStore } from "../stores/up9AuthStore";
import {sendApiMessage, SendInfoToast} from "../providers/extensionConnectionProvider";
import { ApiMessageType } from "../../../models/internal";
import {Form, FormControl, Dropdown, Container, Row, Col, Button, Card} from 'react-bootstrap';
import { isHexColorDark, unindentString } from "../utils";
import { v4 as uuidv4 } from 'uuid';

import AceEditor from "react-ace";

import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-chaos";
import "ace-builds/src-noconflict/theme-chrome";

const TestsBrowserComponent: React.FC<{}> = observer(() => {
    const [workspaces, setWorkspaces] = useState(null);
    const [workspaceFilterInput, setWorkspaceFilterInput] = useState("");
    const [selectedWorkspace, setSelectedWorkspace] = useState("");

    const [endpoints, setEndpoints] = useState(null);
    const [endpointFilterInput, setendpointFilterInput] = useState("");
    const [selectedEndpoint, setSelectedEndpoint] = useState("");

    const [testsLoaded, setTestsLoaded] = useState(false);
    const [endpointTest, setEndpointTest] = useState(null);

    const editorBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--vscode-editor-background');

    const [isThemeDark, setIsThemeDark] = useState(null);

    const getEndpointDisplayText = (endpoint) => {
        return `${endpoint.method.toUpperCase()} ${endpoint.service}${endpoint.path}`;
    }

    const filteredEndpoints = useMemo(() => {
        if (!endpoints || !endpointFilterInput) {
            return endpoints;
        }
        return endpoints.filter(endpoint => getEndpointDisplayText(endpoint).toLocaleLowerCase().indexOf(endpointFilterInput) > -1);
    }, [endpoints, endpointFilterInput]);

    const filteredWorkspaces = useMemo(() => {
        if (!workspaces || !workspaceFilterInput) {
            return workspaces;
        }
        return workspaces.filter(workspace => workspace.toLocaleLowerCase().indexOf(workspaceFilterInput) > -1);
    }, [workspaces, workspaceFilterInput]);

    useEffect(() => {
        setIsThemeDark(isHexColorDark(editorBackgroundColor))
    }, [editorBackgroundColor]);

    const refreshWorkspaces = async () => {
        setWorkspaceFilterInput("");
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
            setendpointFilterInput("");
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
        if (up9AuthStore.isAuthConfigured) {
            refreshWorkspaces();
        }
    }, [up9AuthStore.isAuthConfigured]);

    const copyToClipboard = (text: string) => {
        SendInfoToast("Test code copied to clipboard");
        navigator.clipboard.writeText(text)
    }

    // TODO: refactor this
    // ugly workaround for having the dropdowns apply focus to the filter form repeatedly
    const [isWorkspaceDropDownOpen, setIsWorkspaceDropDownOpen] = useState(false);
    const [isEndpointsDropdownOpen, setIsEndpointsDropdownOpen] = useState(false);

    return <div>
            <div className="select-test-form">
                <Form.Group className="workspaces-form-group">
                    <Form.Label>Workspace</Form.Label>
                    <br/>
                    <Dropdown className="select-dropdown" onToggle={(isOpen, _) => setIsWorkspaceDropDownOpen(isOpen)}>
                        <Dropdown.Toggle>
                            {selectedWorkspace ? selectedWorkspace : "Select a workspace"}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {isWorkspaceDropDownOpen && <FormControl className="dropdown-filter" autoFocus placeholder="Type to filter..." value={workspaceFilterInput} onChange={e => setWorkspaceFilterInput(e.target.value)} />}
                            <Dropdown.Divider/>
                            {filteredWorkspaces?.map((workspace) => {return <Dropdown.Item key={workspace} onClick={_ => {setWorkspaceFilterInput(""); setSelectedWorkspace(workspace)}}>{workspace}</Dropdown.Item>})}
                        </Dropdown.Menu>
                    </Dropdown>
                </Form.Group>

                <Form.Group className="endpoints-form-group">
                    <Form.Label>Endpoint</Form.Label>
                    <br/>
                    <Dropdown className="select-dropdown" onToggle={(isOpen, _) => setIsEndpointsDropdownOpen(isOpen)}>
                        <Dropdown.Toggle disabled={!selectedWorkspace}>
                            {selectedEndpoint ? selectedEndpoint : "Select an endpoint"}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {isEndpointsDropdownOpen && <FormControl className="dropdown-filter" autoFocus placeholder="Type to filter..." value={endpointFilterInput} onChange={e => setendpointFilterInput(e.target.value)} />}
                            <Dropdown.Divider/>
                            {filteredEndpoints?.map((endpoint) => {return <Dropdown.Item key={endpoint.uuid} onClick={_ => {setendpointFilterInput(""); setSelectedEndpoint(endpoint.uuid)}}>{getEndpointDisplayText(endpoint)}</Dropdown.Item>})}
                        </Dropdown.Menu>
                    </Dropdown>
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