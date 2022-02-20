import {action, makeObservable, observable} from "mobx";

class TestBrowserStore {
    // we need this as a store state for the "push code" keyboard shortcut
    selectedEndpointTest: any;

    constructor() {
        makeObservable(this, {
            selectedEndpointTest: observable,

            setSelectedEndpointTest: action,
        });
    }

    setSelectedEndpointTest(selectedEndpointTest: any) {
        this.selectedEndpointTest = selectedEndpointTest;
    }
}

export const testBrowserStore = new TestBrowserStore();
