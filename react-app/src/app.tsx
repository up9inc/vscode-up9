import React from "react";
import {observer} from "mobx-react";
import {up9AuthStore} from "./stores/up9AuthStore";
import AuthComponent from "./components/authComponent";
import TestsBrowserComponent from "./components/testsBrowserComponent";

const App: React.FC<{}> = observer(() => {
    return <div>
        {up9AuthStore.setIsAuthConfigured ? <TestsBrowserComponent /> : <AuthComponent/>}
    </div>;
});


export default App;