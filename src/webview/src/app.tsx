import React from "react";
import {observer} from "mobx-react";
import {up9AuthStore} from "./stores/up9AuthStore";
import AuthComponent from "./components/authComponent";
import TestsBrowserComponent from "./components/testsBrowserComponent";

const App: React.FC<{}> = observer(() => {
    console.log('up9AuthStore.isAuthConfigured', up9AuthStore.isAuthConfigured);
    return <div>
        {up9AuthStore.isAuthConfigured ? <TestsBrowserComponent /> : <AuthComponent/>}
    </div>;
});


export default App;