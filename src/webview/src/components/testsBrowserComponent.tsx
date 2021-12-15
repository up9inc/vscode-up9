import React, { useEffect, useState, useMemo } from "react";
import {observer} from "mobx-react";
import { up9AuthStore } from "../stores/up9AuthStore";
import {sendApiMessage, setExtensionDefaultWorkspace} from "../providers/extensionConnectionProvider";
import { ApiMessageType } from "../../../models/internal";
import {Form, FormControl, Dropdown} from 'react-bootstrap';
import { userIcon, logoIcon } from "./svgs";

import { LoadingOverlay } from "./loadingOverlay";
import TestCodeViewer from "./testCodeViewer";

const TestsBrowserComponent: React.FC<{}> = observer(() => {
    const [workspaces, setWorkspaces] = useState(null);
    const [workspaceFilterInput, setWorkspaceFilterInput] = useState("");
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

    useEffect(() => {
        if (workspaces && !up9AuthStore.defaultWorkspace) {
            setExtensionDefaultWorkspace(workspaces?.[0]);
        }
    }, [workspaces])

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
        (async () => {
            setSelectedEndpoint(null);
            setEndpointFilterInput("");
            setEndpoints(null);
            setWorkspaceOAS(null);

            if (up9AuthStore.defaultWorkspace) {
                try {
                    const endpoints = await sendApiMessage(ApiMessageType.EndpointsList, {workspaceId: up9AuthStore.defaultWorkspace});
                    setEndpoints(endpoints);
                } catch (error) {
                    console.error('error loading workspace endpoints', error);
                }

                try {
                    const workspaceOAS = await sendApiMessage(ApiMessageType.Swagger, {workspaceId: up9AuthStore.defaultWorkspace});
                    setWorkspaceOAS(workspaceOAS);
                } catch (error) {
                    console.error('error loading workspace OAS', error);
                }

                try {
                    const spans = await sendApiMessage(ApiMessageType.Spans, {workspaceId: up9AuthStore.defaultWorkspace}); 
                    setWorkspaceSpans(spans);
                } catch (error) {
                    console.error('error loading workspace spans', error);
                }
            }
        })()
    }, [up9AuthStore.defaultWorkspace]);

    useEffect(() => {
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
                <div style={{padding: "5px 0"}}>
                    {logoIcon}
                </div>
                <div>
                    <p>{up9AuthStore.username}</p>
                    {userIcon}
                </div>
            </div>
            <hr style={{margin: "0"}}/>
            <div className="select-test-form">
                <Form.Group className="workspaces-form-group">
                <Form.Label style={{fontSize: "1.1em"}}>{up9AuthStore.defaultWorkspace ? up9AuthStore.defaultWorkspace : <Dropdown className="select-dropdown" onToggle={(isOpen, _) => setIsWorkspaceDropDownOpen(isOpen)}>
                            <Dropdown.Toggle>Select a workspace</Dropdown.Toggle>
                            <Dropdown.Menu>
                                {isWorkspaceDropDownOpen && <FormControl className="dropdown-filter" autoFocus placeholder="Type to filter..." value={workspaceFilterInput} onChange={e => setWorkspaceFilterInput(e.target.value)} />}
                                <Dropdown.Divider/>
                                {filteredWorkspaces?.map((workspace) => {return <Dropdown.Item key={workspace} onClick={_ => {setWorkspaceFilterInput(""); setDefaultWorkspace(workspace)}}>{workspace}</Dropdown.Item>})}
                            </Dropdown.Menu>
                        </Dropdown>}
                    <br/>
                    {up9AuthStore.defaultWorkspace && <><a className="anchor-button clickable" style={{marginLeft: "4px", float: "right", fontSize: "0.75em"}} onClick={_ => setDefaultWorkspace(null)}>Change</a></>}
                    <br/>
                </Form.Label>
                </Form.Group>

                <Form.Group className="endpoints-form-group">
                    {up9AuthStore.defaultWorkspace && <><Form.Label style={{fontSize: "1.1em"}}>Endpoint</Form.Label>
                    <br/>
                    <Dropdown className="select-dropdown" onToggle={(isOpen, _) => setIsEndpointsDropdownOpen(isOpen)}>
                        <Dropdown.Toggle disabled={!up9AuthStore.defaultWorkspace}>
                            {selectedEndpoint ? getEndpointDisplayText(selectedEndpoint) : "Select an endpoint"}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            {isEndpointsDropdownOpen && <FormControl className="dropdown-filter" autoFocus placeholder="Type to filter..." value={endpointFilterInput} onChange={e => setEndpointFilterInput(e.target.value)} />}
                            <Dropdown.Divider/>
                            {filteredEndpoints?.map((endpoint) => {return <Dropdown.Item title={getEndpointDisplayText(endpoint)} key={endpoint.uuid} onClick={_ => {setEndpointFilterInput(""); setSelectedEndpoint(endpoint)}}>{getEndpointDisplayText(endpoint)}</Dropdown.Item>})}
                        </Dropdown.Menu>
                    </Dropdown></>}
                </Form.Group>
            </div>
            <hr/>
            <TestCodeViewer workspace={up9AuthStore.defaultWorkspace} endpoint={selectedEndpoint} spans={workspaceSpans} workspaceOAS={workspaceOAS} />
        </>;
});

export default TestsBrowserComponent;
