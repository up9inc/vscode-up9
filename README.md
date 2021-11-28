# UP9 VS Code Extension

This extension for Microsoft Visual Studio Code popular IDE allows developers easy access to UP9-generated code samples for Web APIs.

## INSTALLATION

* install latest MS VS Code
	* 	we tested version 1.62 from October 2021
	*  NOTE: version 1.59 from August 2021 had bugs that made UP9 extension failure
* click **EXTENSIONS** icon - this open extensions list
* click **[...]** icon on top of extension list and select **[ Install from VSIX.. ]** 
	* chose _vsix_ file with UP9 extension and click OK
	* wait till "extension installed successfully" pop-up shows .. 


	
## BASIC USE

* press COMMAND-SHIFT-P to access VS Code command launcher
* type or select "UP9: Open Code Browser" command from the list
	* this opens right-pane dialog with credentials to fill (UP9 address, clientID, clientSecret)
	* fill the required details and press OK
	* screen should now offer drop-down-lists titled WORKSPACE and ENDPOINTS
* select workspace and endpoint from the drop-down lists
	* now you can view sample code for selected endpoint on the screen
	* use COPY button to copy code into clipboard .. 

	
## RUNNING CODE in UP9 - Python

* copy test sample code as it is
* remove @xxx annotations 
* right-click and select "UP9: Run Code with UP9" from the menu
*  

## RUNNING CODE locally - Python

* TBD
