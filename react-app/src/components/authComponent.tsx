import React, { useEffect, useState } from "react";
import {observer} from "mobx-react";
import {up9AuthStore} from "../stores/up9AuthStore";
import {startNewAuth} from "../providers/extensionConnectionProvider";
import {Container, Form, Button} from "react-bootstrap";



const AuthComponent: React.FC<{}> = observer(() => {
    const [up9EnvInput, setUP9EnvInput] = useState("");
    const [clientIdInput, setClientIdInput] = useState("");
    const [clientSecretInput, setClientSecretInput] = useState("");

    const doAuth = () => {
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
        <Form.Group>
            <Form.Label>UP9 Env</Form.Label>
            <Form.Control type="text" value={up9EnvInput} onChange={e => setUP9EnvInput(e.target.value)} />
        </Form.Group>
        <Form.Group>
            <Form.Label>Client ID</Form.Label>
            <Form.Control type="text" value={clientIdInput} onChange={e => setClientIdInput(e.target.value)} />
        </Form.Group>
        
        <Form.Group>
            <Form.Label>Client Secret</Form.Label>
            <Form.Control type="text" value={clientSecretInput} onChange={e => setClientSecretInput(e.target.value)} />
        </Form.Group>
        
        {up9AuthStore.authError && <p style={{"color": "red"}}>{up9AuthStore.authError}</p>}
        {up9AuthStore.token && up9AuthStore.setIsAuthConfigured && <p style={{"color": "green"}}>Authenticated successfully</p>}

        <Button onClick={doAuth}>Start new Authentication</Button>
    </Container>;
});


export default AuthComponent;