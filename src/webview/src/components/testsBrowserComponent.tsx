import React, { useEffect, useState, useMemo } from "react";
import {observer} from "mobx-react";
import { up9AuthStore } from "../stores/up9AuthStore";
import {sendApiMessage, setExtensionDefaultWorkspace, signOut} from "../providers/extensionConnectionProvider";
import { ApiMessageType } from "../../../models/internal";
import {Form, FormControl, Dropdown} from 'react-bootstrap';
import { userIcon, logoIcon } from "./svgs";
import { isHexColorDark } from "../utils";
import { LoadingOverlay } from "./loadingOverlay";
import TestCodeViewer from "./testCodeViewer";
import $ from "jquery";

const TestsBrowserComponent: React.FC<{}> = observer(() => {
    const [workspaces, setWorkspaces] = useState(null);
    const [workspaceOAS, setWorkspaceOAS] = useState(null);

    const [services, setServices] = useState(null);
    const [selectedService, setSelectedService] = useState(null);

    const [endpoints, setEndpoints] = useState(null);
    const [selectedEndpoint, setSelectedEndpoint] = useState(null);
    const [workspaceSpans, setWorkspaceSpans] = useState(null);

    const [lastSelectedWorkspace, setLastSelectedWorkspace] = useState("");

    const [isLoading, setIsLoading] = useState(true);

    const [isThemeDark, setIsThemeDark] = useState(null);

    const editorBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--vscode-editor-background');

    useEffect(() => {
        setIsThemeDark(isHexColorDark(editorBackgroundColor))
    }, [editorBackgroundColor]);

    const serviceEndpoints = useMemo(() => {
        if (!selectedService || !endpoints) {
            return [];
        }
        return endpoints.filter(endpoint => endpoint.service === selectedService);
    }, [selectedService, endpoints]);

    useEffect(() => {
        if (up9AuthStore.defaultWorkspace) {
            setLastSelectedWorkspace(up9AuthStore.defaultWorkspace);
        }
    }, [up9AuthStore.defaultWorkspace]);


    const setDefaultWorkspace = (workspace: string) => {
        setExtensionDefaultWorkspace(workspace);
        up9AuthStore.setDefaultWorkspace(workspace);
    }

    const getEndpointDisplayText = (endpoint) => {
        return `${endpoint.method.toUpperCase()} ${endpoint.path}`;
    }

    useEffect(() => {
        if (workspaces && !up9AuthStore.defaultWorkspace) {
            setDefaultWorkspace(workspaces?.[0]);
        }
    }, [workspaces])

    const refreshWorkspaces = async () => {
        setIsLoading(true);
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
            setSelectedService("");
            setSelectedEndpoint(null);
            setEndpoints(null);
            setWorkspaceOAS(null);

            if (up9AuthStore.defaultWorkspace) {
                try {
                    const endpoints = await sendApiMessage(ApiMessageType.EndpointsList, {workspaceId: up9AuthStore.defaultWorkspace});
                    setEndpoints(endpoints);

                    setServices(Array.from(new Set(endpoints.map(endpoint => endpoint.service))));
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
    }, [up9AuthStore.isAuthConfigured, up9AuthStore.up9Env]);

    const onWorkspaceDropdownToggle = (isOpen: boolean) => {
        if (!isOpen && !up9AuthStore.defaultWorkspace && lastSelectedWorkspace) {
            // prevent user from reaching state where nothing is selected
            setDefaultWorkspace(lastSelectedWorkspace);
        }
    }

    if (isLoading) {
        return <LoadingOverlay />;
    }

    return <div className={isThemeDark ? "dark-theme" : "light-theme"}>
            <div className="user-info">
                <div style={{padding: "5px 0"}} className="user-icon">
                    {logoIcon}
                </div>
                <span className="env-text">
                    {up9AuthStore.up9Env}
                </span>
                <div className="user-name-container">
                    <p>{up9AuthStore.username}</p>
                    <Dropdown className="discreet-dropdown">
                        <Dropdown.Toggle>
                            {userIcon}
                        </Dropdown.Toggle>

                        <Dropdown.Menu>
                            <Dropdown.Item onClick={signOut}>Log out</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </div>
            </div>
            <hr style={{margin: "0"}}/>
            <div className="select-test-form">                
                <div style={{display: "flex"}}>
                    <TestBrowserParameterDropdown className="dropdown-container workspaces-form-group" label="Workspace" placeholder="Select"
                    items={workspaces?.map((workspace) => ({key: workspace, value: workspace, label: workspace}))}
                    onDropdownToggle={onWorkspaceDropdownToggle} onSelect={setDefaultWorkspace} value={up9AuthStore.defaultWorkspace} />
                </div>
                <div className="endpoints-services-container">
                    <TestBrowserParameterDropdown className="dropdown-container services-form-group" label="Service" placeholder="Select"
                    items={services?.map((service) => ({key: service, value: service, label: service}))}
                    disabled={!up9AuthStore.defaultWorkspace || services?.length < 1} onSelect={setSelectedService} value={selectedService} />

                    <TestBrowserParameterDropdown className="dropdown-container endpoints-form-group" label="Endpoint" placeholder="Select" 
                    items={serviceEndpoints?.map((endpoint) => {return {key: endpoint.uuid, value: endpoint, label: getEndpointDisplayText(endpoint)}})}
                    disabled={!selectedService} onSelect={setSelectedEndpoint} value={selectedEndpoint} />
                </div>
                
            </div>
            <hr/>
            <TestCodeViewer workspace={up9AuthStore.defaultWorkspace} endpoint={selectedEndpoint} spans={workspaceSpans} workspaceOAS={workspaceOAS} />
        </div>;
});

interface TestBrowserParameterDropdownProps {
    label: string;
    className: string;
    placeholder: string;
    disabled?: boolean;
    items: {label: string, value: any, key: any}[];
    value: any;
    onSelect: (value: any) => void;
    onDropdownToggle?: (isOpen: boolean) => void;
}

const TestBrowserParameterDropdown: React.FC<TestBrowserParameterDropdownProps> = ({label, className, placeholder, disabled, items, value, onSelect, onDropdownToggle}) => {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [filterInputValue, setFilterInputValue] = useState("");
    const [isThemeDark, setIsThemeDark] = useState(null);

    const editorBackgroundColor = getComputedStyle(document.documentElement).getPropertyValue('--vscode-editor-background');

    useEffect(() => {
        setIsThemeDark(isHexColorDark(editorBackgroundColor))
    }, [editorBackgroundColor]);

    const inputForegroundColor = getComputedStyle(document.documentElement).getPropertyValue('--vscode-editor-foreground');
    const alphaTextColorModifier = isThemeDark ? 'c8' : '66';
    const triggerTextColor = !value && !disabled ? `${inputForegroundColor}${alphaTextColorModifier}` : inputForegroundColor

    const selectedItem = useMemo(() => {
        if (value) {
            return items.find(item => item.value === value);
        } else {
            return null;
        }
    }, [value, items]);

    const filteredItems = useMemo(() => {
        if (!items || !filterInputValue) {
            return items;
        }
        return items.filter(item => item.label.toLocaleLowerCase().indexOf(filterInputValue.toLowerCase()) > -1);
    }, [items, filterInputValue]);

    const onDropdownToggled = (isOpen: boolean) => {
        if (onDropdownToggle) {
            onDropdownToggle(isOpen);
        }
        setIsDropdownOpen(isOpen);
    }

    return <Form.Group className={className}>
    <Form.Label>{label}</Form.Label>
    <Dropdown className="select-dropdown" onToggle={(isOpen, _) => {
            onDropdownToggled(isOpen)
            if (isOpen) {
                $('.select-dropdown .dropdown-menu').hide().show(0); //this is a very strange workaround for a very strange html bug, without this the drop down sometimes shifts the entire page until anything changes in the dom
            }
        }}>
        <Dropdown.Toggle disabled={disabled} style={{color: triggerTextColor, fontWeight: value ? 400 : 300}}>
            {selectedItem ? selectedItem.label : placeholder}
        </Dropdown.Toggle>
        {isDropdownOpen && <Dropdown.Menu>
            {isDropdownOpen && <FormControl className="dropdown-filter" autoFocus placeholder="Type to filter..." value={filterInputValue} onChange={e => setFilterInputValue(e.target.value)} />}
            <Dropdown.Divider/>
            {filteredItems.map((item) => <Dropdown.Item title={item.label} key={item.key} onClick={_ => {setFilterInputValue(""); onSelect(item.value)}}>{item.label}</Dropdown.Item>)}
        </Dropdown.Menu>}
    </Dropdown>
</Form.Group>
};

export default TestsBrowserComponent;
