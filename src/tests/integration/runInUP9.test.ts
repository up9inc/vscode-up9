import * as path from 'path';
import * as assert from 'assert';
import { after, test, before } from 'mocha';
import * as vscode from 'vscode';
import { clientIdConfigKey, clientSecretConfigKey, defaultWorkspaceConfigKey, envConfigKey, up9ConfigSectionName, internalExtensionName } from '../../consts';
import { onRunCodeInCloudCommand } from '../../extension';
import { terminalLineDelimeter } from '../../providers/runInCloud';

const validPythonTestFilePath = "/resources/";

let extensionContext: vscode.ExtensionContext;

const runTestFileAndGetTerminalOutput = async (extensionContext: vscode.ExtensionContext, relativeTestFilePath: string): Promise<string[]> => {
    const openPath = vscode.Uri.parse("file://" + path.resolve(__dirname, relativeTestFilePath));
    const doc = await vscode.workspace.openTextDocument(openPath);
    await vscode.window.showTextDocument(doc, vscode.ViewColumn.One);

    let terminalOutput = "";

    await onRunCodeInCloudCommand(extensionContext, terminalMessage => terminalOutput += terminalMessage);

    return terminalOutput.split(terminalLineDelimeter)
};

suite('Run In UP9 Command', () => {
  before(async () => {
    const up9Env = process.env.UP9_AUTH_ENV; 
    const clientId = process.env.UP9_CLIENT_ID;
    const clientSecret = process.env.UP9_CLIENT_SECRET;
    const defaultWorkspace = process.env.DEFAULT_WORKSPACE;

    // initialize extension config
    const up9ConfigSection = vscode.workspace.getConfiguration(up9ConfigSectionName);
    await up9ConfigSection.update(envConfigKey, up9Env, vscode.ConfigurationTarget.Global);
    await up9ConfigSection.update(clientIdConfigKey, clientId, vscode.ConfigurationTarget.Global);
    await up9ConfigSection.update(clientSecretConfigKey, clientSecret, vscode.ConfigurationTarget.Global);
    await up9ConfigSection.update(defaultWorkspaceConfigKey, defaultWorkspace, vscode.ConfigurationTarget.Global);

    const extension = await vscode.extensions.getExtension(internalExtensionName);
    extensionContext = await extension.activate();
  });

  after(async () => {
    // reset extension config
    const up9ConfigSection = vscode.workspace.getConfiguration(up9ConfigSectionName);
    await up9ConfigSection.update(envConfigKey, "", vscode.ConfigurationTarget.Global);
    await up9ConfigSection.update(clientIdConfigKey, "", vscode.ConfigurationTarget.Global);
    await up9ConfigSection.update(clientSecretConfigKey, "", vscode.ConfigurationTarget.Global);
    await up9ConfigSection.update(defaultWorkspaceConfigKey, "", vscode.ConfigurationTarget.Global);
  });

  test('Run passing tests', async function() { 
    this.timeout(10000);

    const terminalLines = await runTestFileAndGetTerminalOutput(extensionContext, './resources/validTests.py');
    
    assert(terminalLines.indexOf("test_1: SUCCESS") > 0);
    assert(terminalLines.indexOf("test_2: SUCCESS") > 0);
  });

  test('Run mixed tests', async function() { 
    this.timeout(10000);

    const terminalLines = await runTestFileAndGetTerminalOutput(extensionContext, './resources/testWithError.py');
    
    assert(terminalLines.indexOf("test_1: FAIL AssertionError: assert 5 == 7") > 0);
    assert(terminalLines.indexOf("test_2: SUCCESS") > 0);
  });

  test('Run tests with syntax error', async function() { 
    this.timeout(10000);

    const terminalLines = await runTestFileAndGetTerminalOutput(extensionContext, './resources/invalidTests.py');
    
    assert(terminalLines.indexOf("E   SyntaxError: invalid syntax") > 0);
    assert(terminalLines.indexOf("test_2: SUCCESS") == -1);
  });
});
