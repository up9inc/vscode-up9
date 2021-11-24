import * as vscode from 'vscode';
import { TelepresenceController } from '../providers/telepresenceController';

export const startTelepresence = async (context: vscode.ExtensionContext): Promise<void> => {
    const telepresenceController = new TelepresenceController(context);
    if(!telepresenceController.isRunningMachineSupported()) {
        console.error('unsupported machine');
    }

    try {
        if ((await telepresenceController.isTelepresenceConnected())) {
            vscode.window.showInformationMessage("Telepresence is already up and running");
            return;
        }
    
        await telepresenceController.startTelepresence();
        vscode.window.showInformationMessage("Telepresence is up and running");
    } catch (error) {
        console.error(error);
        vscode.window.showErrorMessage(`Unknown Telepresence error occured: ${error}`);
    }
    
};

export const stopTelepresence = async (context: vscode.ExtensionContext): Promise<void> => {
    const telepresenceController = new TelepresenceController(context);

    try {
        await telepresenceController.stopTelepresence();
        vscode.window.showInformationMessage("Telepresence has stopped");
    } catch (error) {
        console.error(error);
        vscode.window.showErrorMessage(`Unknown Telepresence error occured: ${error}`);
    }
};