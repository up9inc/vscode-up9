import React, { useEffect, useState } from "react";
import {observer} from "mobx-react";
import {up9AuthStore} from "../stores/up9AuthStore";
import {sendApiMessage, sendErrorToast, startNewAuth} from "../providers/extensionConnectionProvider";
import {Container, Button, Form} from "react-bootstrap";
import { logoIconLarge } from "./svgs";
import { ApiMessageType } from "../../../models/internal";
import { LoadingOverlay } from "./loadingOverlay";

const AuthComponent: React.FC<{}> = observer(() => {
    const [up9Env, setUP9Env] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setUP9Env(up9AuthStore.up9Env)
    }, [up9AuthStore.up9Env]);

    const onKeyDownHandler = (e) => {
        if (e.key === 'Enter') {
            onNewEnv();
        }
    }

    const onNewEnv = async () => {
        setIsLoading(true);
        try {
            const isEnvReachable = await sendApiMessage(ApiMessageType.EnvCheck, {env: up9Env});
            if (!isEnvReachable) {
                throw 'unreachable';
            }
        } catch (e) {
            sendErrorToast(`${up9Env} is unreachable or not an UP9 env`);
            return;
        } finally {
            setIsLoading(false);
        }
        
        startNewAuth(up9Env)
    };

    return <div onKeyDown={onKeyDownHandler}>
        {isLoading && <LoadingOverlay />}
        <Container className="auth-container">
            <div style={{flexGrow: 1}} className="auth-icon-container">
                {logoIconLarge}
            </div>
            <div style={{display: "flex", flexDirection: "column", flexGrow: 4, marginTop: "1em"}}>
                <p>Welcome to UP9 Integration Code Plugin for Visual Studio Code.</p>
                <p style={{fontSize: "0.9em"}}>In order to start working with the plugin, please connect to your desired UP9 environment.</p>

                <div className="auth-control-container">
                    <Form.Control type="text" placeholder="UP9 URI" className="" value={up9Env} onChange={e => setUP9Env(e.target.value)}/>
                    <Button variant="primary" className="sign-in-button" onClick={_ => onNewEnv()}>Connect</Button>
                </div>

                {up9AuthStore.authError && <p style={{"color": "red"}}>{up9AuthStore.authError}</p>}
                {up9AuthStore.isAuthConfigured && <p style={{"color": "green"}}>Authenticated successfully</p>}
            </div>
        </Container>
    </div>;
});


export default AuthComponent;