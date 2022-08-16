//line 399 above work-for-factions 
	if (3 in unlockedSFs && !findScript('buildEmpire.js')) {
		 launchScriptHelper(ns, 'buildEmpire.js');
	}


//line 422 in maybeDoCasino function before checking for player money  
	await ns.sleep(10000);
