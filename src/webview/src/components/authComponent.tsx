import React, { useEffect, useState } from "react";
import {observer} from "mobx-react";
import {up9AuthStore} from "../stores/up9AuthStore";
import {startNewAuth} from "../providers/extensionConnectionProvider";
import {Container, Button, Form} from "react-bootstrap";

const AuthComponent: React.FC<{}> = observer(() => {
    const [up9Env, setUP9Env] = useState('');

    useEffect(() => {
        setUP9Env(up9AuthStore.up9Env)
    }, [up9AuthStore.up9Env]);

    return <Container className="auth-container">
        <p>Welcome to UP9 for Visual Studio Code.</p>
        <p>To use the extension you must first sign in to UP9</p>

        <div className="auth-control-container">
            <Form.Control type="text" placeholder="UP9 URI" className="" value={up9Env} onChange={e => setUP9Env(e.target.value)}/>
            <Button variant="primary" className="sign-in-button" onClick={_ => startNewAuth(up9Env)}>Connect</Button>
        </div>

        {up9AuthStore.authError && <p style={{"color": "red"}}>{up9AuthStore.authError}</p>}
        {up9AuthStore.isAuthConfigured && <p style={{"color": "green"}}>Authenticated successfully</p>}
    </Container>;
});


export default AuthComponent;