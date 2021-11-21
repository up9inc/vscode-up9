import React, { useEffect, useState } from "react";
import {observer} from "mobx-react";
import {up9AuthStore} from "../stores/up9AuthStore";
import {startNewAuth} from "../providers/extensionConnectionProvider";
import {Container, Form, Button} from "react-bootstrap";

const AuthComponent: React.FC<{}> = observer(() => {
    const [up9EnvInput, setUP9EnvInput] = useState(up9AuthStore.up9Env ?? "");
    const [clientIdInput, setClientIdInput] = useState(up9AuthStore.clientId ?? "");
    const [clientSecretInput, setClientSecretInput] = useState(up9AuthStore.clientSecret ?? "");

    const doAuth = () => {
        up9AuthStore.setUP9Env(up9EnvInput);
        up9AuthStore.setClientId(clientIdInput);
        up9AuthStore.setClientSecret(clientSecretInput);
        startNewAuth(up9EnvInput, clientIdInput, clientSecretInput);
    };

    useEffect(() => {
        if (up9AuthStore.up9Env) {
            setUP9EnvInput(up9AuthStore.up9Env);
        }
        if (up9AuthStore.clientId) {
            setClientIdInput(up9AuthStore.clientId);
        }
        if (up9AuthStore.clientSecret) {
            setClientSecretInput(up9AuthStore.clientSecret);
        }
    }, [up9AuthStore.up9Env, up9AuthStore.clientId, up9AuthStore.clientSecret]);


    return <Container className="auth-container">
        <Form.Group className="auth-form-group">
            <Form.Label>UP9 Env</Form.Label>
            <Form.Control type="text" value={up9EnvInput} onChange={e => setUP9EnvInput(e.target.value)} />
            <Form.Text className="text-muted">
                Must contain protocol (http:// or https://)
            </Form.Text>
        </Form.Group>

        <Form.Group className="auth-form-group">
            <Form.Label>Client ID</Form.Label>
            <Form.Control type="text" value={clientIdInput} onChange={e => setClientIdInput(e.target.value)} />
        </Form.Group>
        
        <Form.Group className="auth-form-group">
            <Form.Label>Client Secret</Form.Label>
            <Form.Control type="text" value={clientSecretInput} onChange={e => setClientSecretInput(e.target.value)} />
        </Form.Group>
        
        {up9AuthStore.authError && <p style={{"color": "red"}}>{up9AuthStore.authError}</p>}
        {up9AuthStore.isAuthConfigured && <p style={{"color": "green"}}>Authenticated successfully</p>}

        <Button onClick={doAuth} className="login-button">Login</Button>
    </Container>;
});


export default AuthComponent;