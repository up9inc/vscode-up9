import React, { useEffect, useState } from "react";
import {observer} from "mobx-react";
import {up9AuthStore} from "../stores/up9AuthStore";
import {startNewAuth} from "../providers/extensionConnectionProvider";



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


    return <div>
        UP9 Env: <input value={up9EnvInput} onChange={e => setUP9EnvInput(e.target.value)}/> <br/>
        Client ID: <input value={clientIdInput} onChange={e => setClientIdInput(e.target.value)}/> <br/>
        Client Secret: <input value={clientSecretInput} onChange={e => setClientSecretInput(e.target.value)}/> <br/>
        {up9AuthStore.authError && <p style={{"color": "red"}}>{up9AuthStore.authError}</p>}
        {up9AuthStore.token && up9AuthStore.setIsAuthConfigured && <p style={{"color": "green"}}>Authenticated successfully</p>}

        <button onClick={doAuth}>Start new Authentication</button>
    </div>;
});


export default AuthComponent;