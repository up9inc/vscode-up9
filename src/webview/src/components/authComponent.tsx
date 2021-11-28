import React from "react";
import {observer} from "mobx-react";
import {up9AuthStore} from "../stores/up9AuthStore";
import {startNewAuth} from "../providers/extensionConnectionProvider";
import {Container, Button} from "react-bootstrap";

const AuthComponent: React.FC<{}> = observer(() => {
    return <Container className="auth-container">
        <p>Welcome to UP9 for Visual Studio Code.</p>
        <p>To use the extension you must first sign in to UP9</p>

        <Button variant="primary" className="sign-in-button" onClick={_ => startNewAuth()}>Sign In To UP9</Button>

        {up9AuthStore.authError && <p style={{"color": "red"}}>{up9AuthStore.authError}</p>}
        {up9AuthStore.isAuthConfigured && <p style={{"color": "green"}}>Authenticated successfully</p>}
    </Container>;
});


export default AuthComponent;