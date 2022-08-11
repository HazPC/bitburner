//line 399 above work-for-factions 
	if (3 in unlockedSFs && !findScript('buildEmpire.js') && ns.getServer("home").maxRam > 32) {
		 launchScriptHelper(ns, 'buildEmpire.js');
		 //ns.run('buildEmpire.js');
	}
