import React, { useEffect, useState } from "react";
import {observer} from "mobx-react";
import { up9AuthStore } from "../stores/up9AuthStore";
import {ApiRequestTypes, sendApiRequest, sendOpenFileMessage} from "../providers/extensionConnectionProvider";
import {Form, Container, Row, Col, Button} from 'react-bootstrap';


const TestsBrowserComponent: React.FC<{}> = observer(() => {
    const [workspaces, setWorkspaces] = useState(null);
    const [selectedWorkspace, setSelectedWorkspace] = useState("");

    const [endpoints, setEndpoints] = useState(null);
    const [selectedEndpoint, setSelectedEndpoint] = useState("");

    const [tests, setTests] = useState(null);

    const refreshWorkspaces = async () => {
        try {
            const workspaces = await sendApiRequest(ApiRequestTypes.WorkspacesList, null);
            console.log('workspaces', workspaces);
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
                    console.log('selectedEndpoint', JSON.stringify(selectedEndpoint, null, 4));
                    const tests = await sendApiRequest(ApiRequestTypes.EndpointTests, {workspaceId: selectedWorkspace, spanGuid: selectedEndpoint});
                    setTests(tests);
                    console.log('received tests in panel!', tests);
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
                <Container>
                        {tests.tests.map((test) => {
                            return <Row className="test-row">
                                <Col xs="10" md="10" lg="10">{test.variantDisplayName}</Col>
                                <Col xs="1" md="1" lg="1" style={{"padding": "0", "margin": "0px 2px"}}><Button variant="primary" onClick={_ => sendOpenFileMessage(test.code, ".py")}>View</Button></Col>
                                {/* <Col xs="1" style={{"padding": "0", "margin": "0px 2px"}}><Button variant="primary">Copy</Button></Col> */}
                        </Row>
                        })}
                    </Container>
            </div>
            </>}
            {(tests && !tests.tests) && <p>No tests found for this endpoint</p>}
        </div>;
});


export default TestsBrowserComponent;