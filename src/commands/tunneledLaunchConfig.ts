import * as vscode from 'vscode';
import { startTunnelCommandName } from '../extension';

const up9ConfigNameSuffix = "(UP9 tunneled)";
const startTunnelDialogOption = "Start tunnel now";

const getModifiedConfigName = (configName: string): string => {
    return `${configName} ${up9ConfigNameSuffix}`;
}

const getLaunchConfigs = () => {
    try {
        const launchConfig = vscode.workspace.getConfiguration("launch");
        const configurations = launchConfig.get<any[]>("configurations");
    
        return configurations;
    } catch (error) {
        console.warn("could not get workspace launch.json configurations", error);
        return [];
    }
};

const createAndAddLaunchJsonTunneledConfig = async (originalConfig: any, tunnelAddress: string): Promise<string> => {
    const modifiedConfig = {
        ...originalConfig,
        env: {
            ...originalConfig.env,
            "HTTP_PROXY": tunnelAddress,
            "HTTPS_PROXY": tunnelAddress,
        },
        name: getModifiedConfigName(originalConfig.name)
    }

    const launchConfig = vscode.workspace.getConfiguration("launch");
    const configurations = launchConfig.get<any[]>("configurations");

    configurations.push(modifiedConfig);
    launchConfig.update("configurations", configurations, vscode.ConfigurationTarget.Workspace);

    return modifiedConfig.name;
}

const showUserMessageWithStartTunnelAction = async (message: string) => {
    const userAction = await vscode.window.showInformationMessage(message, startTunnelDialogOption);

    
    if (userAction === startTunnelDialogOption) {
        vscode.commands.executeCommand(startTunnelCommandName);
    }
}

export const runCreateTunneledLaunchConfig = async (tunnelAddress: string) => {
    try {
        const launchConfigs = getLaunchConfigs();

        const unTunneledLaunchConfigs = launchConfigs.filter(config => !config.name.endsWith(up9ConfigNameSuffix));
    
        if (unTunneledLaunchConfigs.length === 0) {
            vscode.window.showErrorMessage("No untunneled launch.json configurations found");
            return;
        }
    
        const selectedConfigName = await vscode.window.showQuickPick(unTunneledLaunchConfigs.map(config => config.name), {title: "Create a copy of the selected launch configuration with UP9 tunneling enabled"});
        
        if (launchConfigs.find(config => config.name === getModifiedConfigName(selectedConfigName))) {
            showUserMessageWithStartTunnelAction(`This configuration already has a tunneled version: ${getModifiedConfigName(selectedConfigName)}`);
            return;
        }

        const selectedConfig = unTunneledLaunchConfigs.find(config => config.name === selectedConfigName);
    
        const newConfigName = await createAndAddLaunchJsonTunneledConfig(selectedConfig, tunnelAddress);

        showUserMessageWithStartTunnelAction(`Created new launch configuration ${newConfigName}, this configuration will only work with the UP9 tunnel enabled`);
    

    } catch (error) {
        vscode.window.showErrorMessage("An unknown error has occured while creating tunneled launch.json configuration");
        console.error(error);
    }
}