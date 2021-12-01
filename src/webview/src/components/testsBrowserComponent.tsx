import React, { useEffect, useState, useMemo } from "react";
import {observer} from "mobx-react";
import { up9AuthStore } from "../stores/up9AuthStore";
import {sendApiMessage, sendInfoToast, setExtensionDefaultWorkspace} from "../providers/extensionConnectionProvider";
import { ApiMessageType } from "../../../models/internal";
import {Form, FormControl, Dropdown, Container, Row, Col, Card} from 'react-bootstrap';
import { isHexColorDark } from "../utils";
import { v4 as uuidv4 } from 'uuid';
import { copyIcon, userIcon } from "./svgs";
import { microTestsHeader } from "../../../utils";

import AceEditor from "react-ace";
import "ace-builds/src-noconflict/mode-python";
import "ace-builds/src-noconflict/theme-chaos";
import "ace-builds/src-noconflict/theme-chrome";
import { LoadingOverlay } from "./loadingOverlay";

enum TestCodeMode {
    Code = "code",
    Test = "test"
}


// TODO: split this into multiple components
const TestsBrowserComponent: React.FC<{}> = observer(() => {
    const [workspaces, setWorkspaces] = useState(null);
    const [workspaceFilterInput, setWorkspaceFilterInput] = useState("");
    const [selectedWorkspace, setSelectedWorkspace] = useState("");

    const [endpoints, setEndpoints] = useState(null);
    const [endpointFilterInput, setEndpointFilterInput] = useState("");
    const [selectedEndpoint, setSelectedEndpoint] = useState(null);

    const [testsLoaded, setTestsLoaded] = useState(false);
    const [endpointTest, setEndpointTest] = useState(null);

    const editorBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--vscode-editor-background');

    const [isThemeDark, setIsThemeDark] = useState(null);

    const [isLoading, setIsLoading] = useState(true);

    const [testCodeMode, setTestCodeMode] = useState(TestCodeMode.Test);

    const getEndpointDisplayText = (endpoint) => {
        return `${endpoint.method.toUpperCase()} ${endpoint.service}${endpoint.path}`;
    }

    const filteredEndpoints = useMemo(() => {
        if (!endpoints || !endpointFilterInput) {
            return endpoints;
        }
        return endpoints.filter(endpoint => getEndpointDisplayText(endpoint).toLocaleLowerCase().indexOf(endpointFilterInput.toLowerCase()) > -1);
    }, [endpoints, endpointFilterInput]);

    const filteredWorkspaces = useMemo(() => {
        if (!workspaces || !workspaceFilterInput) {
            return workspaces;
        }
        return workspaces.filter(workspace => workspace.toLocaleLowerCase().indexOf(workspaceFilterInput.toLowerCase()) > -1);
    }, [workspaces, workspaceFilterInput]);

    useEffect(() => {
        setIsThemeDark(isHexColorDark(editorBackgroundColor))
    }, [editorBackgroundColor]);

    const testCode = useMemo(() => {
        if (!endpointTest) {
            return null;
        }

        if (testCodeMode === TestCodeMode.Test) {
            return `${microTestsHeader}\n${endpointTest.code}`;
        }

        return endpointTest.code;
    }, [endpointTest, testCodeMode]);

    const refreshWorkspaces = async () => {
        setIsLoading(true);
        setWorkspaceFilterInput("");
        try {
            const workspaces = await sendApiMessage(ApiMessageType.WorkspacesList, null);
            setWorkspaces(workspaces);
        } catch(error) {
            console.log(error);
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        if (workspaces && up9AuthStore.defaultWorkspace && workspaces.indexOf(up9AuthStore.defaultWorkspace) > -1) {
            setSelectedWorkspace(up9AuthStore.defaultWorkspace);
        }
    }, [workspaces, up9AuthStore.defaultWorkspace]);

    useEffect(() => {
        (async () => {
            setSelectedEndpoint(null);
            setEndpointFilterInput("");
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
                    const tests = await sendApiMessage(ApiMessageType.EndpointTests, {workspaceId: selectedWorkspace, spanGuid: selectedEndpoint.uuid});
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
    }, [selectedEndpoint?.uuid]);

    useEffect(() => {
        setSelectedWorkspace("");
        if (up9AuthStore.isAuthConfigured) {
            refreshWorkspaces();
        }
    }, [up9AuthStore.isAuthConfigured]);

    const copyToClipboard = (text: string) => {
        sendInfoToast("Test code copied to clipboard");
        navigator.clipboard.writeText(text)
    }

    const setDefaultWorkspace = (workspace: string) => {
        setExtensionDefaultWorkspace(workspace);
        up9AuthStore.setDefaultWorkspace(workspace);
    }

    // TODO: refactor this
    // ugly workaround for having the dropdowns apply focus to the filter form repeatedly
    const [isWorkspaceDropDownOpen, setIsWorkspaceDropDownOpen] = useState(false);
    const [isEndpointsDropdownOpen, setIsEndpointsDropdownOpen] = useState(false);

    if (isLoading) {
        return <LoadingOverlay />;
    }

    return <div>
            <div className="user-info">
                <div>
                    <p>{up9AuthStore.username}</p>
                    {/* <img src={userIcon} /> */}
                    {userIcon}
                </div>
            </div>
            <div className="select-test-form">
                <Form.Group className="workspaces-form-group">
                    <Form.Label>Workspace {(selectedWorkspace && selectedWorkspace != up9AuthStore.defaultWorkspace) && <a className="anchor-button clickable" onClick={_ => setDefaultWorkspace(selectedWorkspace)}>Make Default</a>}</Form.Label>
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
                            {selectedEndpoint ? getEndpointDisplayText(selectedEndpoint) : "Select an endpoint"}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {isEndpointsDropdownOpen && <FormControl className="dropdown-filter" autoFocus placeholder="Type to filter..." value={endpointFilterInput} onChange={e => setEndpointFilterInput(e.target.value)} />}
                            <Dropdown.Divider/>
                            {filteredEndpoints?.map((endpoint) => {return <Dropdown.Item title={getEndpointDisplayText(endpoint)} key={endpoint.uuid} onClick={_ => {setEndpointFilterInput(""); setSelectedEndpoint(endpoint)}}>{getEndpointDisplayText(endpoint)}</Dropdown.Item>})}
                        </Dropdown.Menu>
                    </Dropdown>
                </Form.Group>
            </div>
            {endpointTest && <>
            <hr/>
            <div className="tests-list-container">
            <Form.Group>
                <Form.Check inline label="Test" name="group1" type="radio" checked={testCodeMode == TestCodeMode.Test} onClick={_ => setTestCodeMode(TestCodeMode.Test)} />
                <Form.Check inline label="Code" name="group1" type="radio" checked={testCodeMode == TestCodeMode.Code} onClick={_ => setTestCodeMode(TestCodeMode.Code)} />
            </Form.Group> 
            <Container>
                <Card className="test-row">
                    <Card.Header className="test-row-card-header">
                        <Container>
                            <Row>
                                <Col xs="10" md="10" lg="10" style={{"paddingLeft": "5px"}}>{endpointTest.variantDisplayName}</Col>
                                <Col xs="1" md="1" lg="1" style={{"padding": "0"}}>
                                    <span className="clickable" onClick={_ => copyToClipboard(testCode)}>{copyIcon}</span>
                                </Col>
                            </Row>
                        </Container>
                    </Card.Header>
                    <Card.Body>
                            <AceEditor width="100%" mode="python" fontSize="14px" maxLines={1000}
                            theme={isThemeDark ? "chaos" : "chrome"} readOnly={true} value={testCode}
                                setOptions={{showGutter: false, hScrollBarAlwaysVisible: false, highlightActiveLine: false}}/>
                    </Card.Body>
                </Card>
            </Container>
            </div>
            </>}
            {(testsLoaded && !endpointTest) && <p>No code found for this endpoint</p>}
        </div>;
});

export default TestsBrowserComponent;