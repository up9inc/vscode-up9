import * as os from 'os';
import * as fs from 'fs';
import * as util from 'util';
import * as childProcess from 'child_process';
import * as vscode from 'vscode';

const exec = util.promisify(childProcess.exec);

const telepresenceNotRunningStatus = "Not running";
const telepresenceConnectSucessMessagePrefix = "Connected to context";

export class TelepresenceController {
    private _platform: string = `${process.platform}_${process.arch}`;
    private _telepresenceBinaryPath: string;

    public constructor(context: vscode.ExtensionContext) {
        this._telepresenceBinaryPath = context.asAbsolutePath(`binaries/${this._platform}/telepresence`);
        console.log('this._telepresenceBinaryPath', this._telepresenceBinaryPath);
    }

    public isRunningMachineSupported = (): boolean  => {
        return fs.existsSync(this._telepresenceBinaryPath);
    };

    public isTelepresenceConnected = async (): Promise<boolean> => {
        const { stdout, stderr } = await exec(`${this._telepresenceBinaryPath} status`);
        if (stderr) {
            throw stderr;
        }

        for (const line of stdout.trim().split('\n')) {
            if (line.indexOf(":") > -1) {
                const telepresenceComponentStatus = line.split(':')[1].trim();
                if (telepresenceComponentStatus === telepresenceNotRunningStatus) {
                    return false;
                }
            }
        }
        return true;
    };

    public startTelepresence = async(): Promise<void> => {
        const { stdout, stderr } = await exec(`sudo ${this._telepresenceBinaryPath} connect --kubeconfig=${os.homedir}/.kube/config`);
        if (stderr) {
            throw stderr;
        }

        const lines = stdout.trim().split('\n');
        const lastLine = lines[lines.length - 1];

        if (!lastLine.startsWith(telepresenceConnectSucessMessagePrefix)) {
            throw stdout;
        }
    }

    public stopTelepresence = async(): Promise<void> => {
        const { stderr } = await exec(`${this._telepresenceBinaryPath} quit`);
        if (stderr) {
            throw stderr;
        }
    }

}