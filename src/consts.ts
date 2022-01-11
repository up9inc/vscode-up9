export const up9ConfigSectionName = "up9";
export const envConfigKey = "env";
export const envProtocolConfigKey = "envProtocol";
export const defaultWorkspaceConfigKey = "defaultWorkspace";

export const internalExtensionName = "up9.up9";
export const internalRunTestCommandName = "up9.runTest";

export const authGlobalStorageKey = "up9.auth.data";
export const authEnvStorageKey = "up9.auth.env";

export const defaultUP9Env = "up9.app";
export const defaultUP9EnvProtocol = "https";

export const microTestsClassDef = 'class Tests(unittest.TestCase):'

export const microTestsHeader = `import requests
import unittest
from urllib.parse import urlencode
# from jsonpath_ng import parse
# from lxml import html


${microTestsClassDef}
`