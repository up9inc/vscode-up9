import {action, makeObservable, observable} from "mobx";

class TestBrowserStore {
    // we need this as a store state for the "push code" keyboard shortcut
    selectedEndpointTest: any;
    codeDisplayText: string;

    constructor() {
        makeObservable(this, {
            selectedEndpointTest: observable,
            codeDisplayText: observable,

            setSelectedEndpointTest: action,
            setCodeDisplayText: action
        });
    }

    setSelectedEndpointTest(selectedEndpointTest: any) {
        this.selectedEndpointTest = selectedEndpointTest;
    }

    setCodeDisplayText(codeDisplayText: string) {
        this.codeDisplayText = codeDisplayText;
    }
}

export const testBrowserStore = new TestBrowserStore();
