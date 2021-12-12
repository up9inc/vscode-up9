import React, { useEffect, useState, useMemo } from "react";
import {observer} from "mobx-react";
import { up9AuthStore } from "../stores/up9AuthStore";
import {sendApiMessage, setExtensionDefaultWorkspace} from "../providers/extensionConnectionProvider";
import { ApiMessageType } from "../../../models/internal";
import {Form, FormControl, Dropdown} from 'react-bootstrap';
import { userIcon } from "./svgs";

import { LoadingOverlay } from "./loadingOverlay";
import TestCodeViewer from "./testCodeViewer";

const TestsBrowserComponent: React.FC<{}> = observer(() => {
    const [workspaces, setWorkspaces] = useState(null);
    const [workspaceFilterInput, setWorkspaceFilterInput] = useState("");
    const [selectedWorkspace, setSelectedWorkspace] = useState("");
    const [workspaceOAS, setWorkspaceOAS] = useState(null);

    const [endpoints, setEndpoints] = useState(null);
    const [endpointFilterInput, setEndpointFilterInput] = useState("");
    const [selectedEndpoint, setSelectedEndpoint] = useState(null);
    const [workspaceSpans, setWorkspaceSpans] = useState(null);

    const [isLoading, setIsLoading] = useState(true);

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
            setWorkspaceOAS(null);

            if (selectedWorkspace) {
                try {
                    const endpoints = await sendApiMessage(ApiMessageType.EndpointsList, {workspaceId: selectedWorkspace});
                    setEndpoints(endpoints);
                } catch (error) {
                    console.error('error loading workspace endpoints', error);
                }

                try {
                    const workspaceOAS = await sendApiMessage(ApiMessageType.Swagger, {workspaceId: selectedWorkspace});
                    setWorkspaceOAS(workspaceOAS);
                } catch (error) {
                    console.error('error loading workspace OAS', error);
                }

                try {
                    const spans = await sendApiMessage(ApiMessageType.Spans, {workspaceId: selectedWorkspace}); 
                    setWorkspaceSpans(spans);
                } catch (error) {
                    console.error('error loading workspace spans', error);
                }
            }
        })()
    }, [selectedWorkspace]);

    useEffect(() => {
        setSelectedWorkspace("");
        if (up9AuthStore.isAuthConfigured) {
            refreshWorkspaces();
        }
    }, [up9AuthStore.isAuthConfigured]);

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

    return <>
            <div className="user-info">
                <div>
                    <p>{up9AuthStore.username}</p>
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
            <hr/>
            <TestCodeViewer workspace={selectedWorkspace} endpoint={selectedEndpoint} spans={workspaceSpans} workspaceOAS={workspaceOAS} />
        </>;
});

export default TestsBrowserComponent;
