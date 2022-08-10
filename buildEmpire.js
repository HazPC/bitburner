import {
	UNLOCK_DEFS, UNLOCKS, UPGRADE_DEFS, UPGRADES, PHASES,
	CITIES, INDUSTRY_DEFS, INDUSTRIES, RESEARCH_DEFS, RESEARCH, JOBS,
	MATERIAL_DEFS, MATERIALS, MATERIAL_SIZES, DIVIDEND_FILE
} from "./corpInfo.js";
import { formatMoney } from "./helpers.js";

const TICK = 5000;
const CORP_NAME = "HazCorp";
//Always get an office in Sector-12 and sometimes want to use this instead of iterating cities
const DEFAULT_CITY = "Sector-12";
const PRODUCT_DEVELOPMENT_CITY = "Aevum";
/* Percentage of funds to spend on a new product
 * If we need to develop a product for 2 divisions in a cycle, we would spend this % of our funds on each product
 */
const PRODUCT_DEVELOPMENT_PERCENTAGE = 10;

/** @param {NS} ns */
export async function main(ns) {
	ns.clearLog();
	ns.tail();
	ns.disableLog("sleep");

	/** @type {Corporation} */
	const corp = eval("ns.corporation");

	try {
		corp.getCorporation();
	}
	catch (e) {
		ns.print("Don't own a corp");

		let player = ns.getPlayer();
		if (player.bitNodeN == 3) {
			ns.print(`BN3, so don't need to self fund`);
			if (corp.createCorporation(CORP_NAME, false)) {
				ns.print(`${CORP_NAME} has been founded!`);
			}
			else {
				ns.print(`Couldn't create ${CORP_NAME}`);
				return;
			}
		}
		else {
			ns.print(`Not in BN3, must self fund.`);
			let funds = player.money;
			while (funds < 150e9) {
				ns.printf(`Awaiting funds to found ${CORP_NAME} (${formatExpo(funds)}/${formatExpo(150e9)})`);
				await ns.sleep(TICK);
				funds = ns.getPlayer().money;
			}

			if (corp.createCorporation(CORP_NAME)) {
				ns.print(`${CORP_NAME} has been founded!`);
			}
			else {
				ns.print(`Couldn't create ${CORP_NAME}`);
				return;
			}
		}

		await ns.sleep(5000);
	}

	//Used in wait time calculations
	let profitMultiplier = 1;
	let dividendPercent = 0;

	/*try {
		corp.getCorporation();
	}
	catch (e) {
		
		if (!corp.createCorporation("HazCorp")) {
			ns.print(`Couldn't create corporation`);
			return;
		}
		else {
			ns.print("HazCorp was founded!");
		}
		await ns.sleep(10000);
	}*/

	for (let unlock of UNLOCKS) {
		unlock.owned = corp.hasUnlockUpgrade(unlock.name);
		//ns.printf(`${unlock.name} ${unlock.owned ? "owned" : "locked"}`);
	}

	for (let upgrade of UPGRADES) {
		upgrade.level = corp.getUpgradeLevel(upgrade.name);
		//ns.printf(`${upgrade.name}: ${upgrade.level}`);
	}

	function formatExpo(n) {
		return formatMoney(n);
		/*if (n < 1e7 && n > -1e7) {
			return n;
		}
		else {
			return n.toExponential(2);
		}*/
	}

	async function awaitFunds(description, cost, tick = TICK) {
		let funds = corp.getCorporation().funds;
		let n = Date.now();

		if (funds < cost) {
			ns.printf(`${description} (${formatExpo(funds)}/${formatExpo(cost)})`);

			while (funds < cost) {
				let profit = (corp.getCorporation().revenue - corp.getCorporation().expenses) * profitMultiplier * (corp.getBonusTime() > 0 ? 10 : 1);
				if (profit < 0) {
					ns.print("Profit is negative, wait 10s for it to normalise." +
						" If this message is spamming have a look at your corp");
					await ns.sleep(15000);
				}
				else {
					let realTick = Math.round((cost - funds) / profit * 1000);
					//If it costs <1t we're probably early game and can get crazy long timers, e.g. when we're developing our first product
					if (realTick > 1000 * 60 * 10 && cost < 1e15) {
						realTick = 1000 * 60 * 10;
					}
					else if (realTick > 1000 * 60 * 60) {
						realTick = 1000 * 60 * 60;
					}
					//Not doing the analyst products any more so just wait until we can afford so it doesn't spam the log
					//realTick = realTick > 1000 * 60 * 3 ? 1.8e5 : realTick;
					let d = new Date(Date.now() + realTick);
					if (realTick > 1000 * 10) {
						ns.print(`Sleep until ${d.toLocaleTimeString()}` +
							` (${Math.floor(realTick / 1000)}s) (${formatExpo(funds)}/${formatExpo(cost)})`);
						if (description.indexOf("develop product") === -1) {
							await analyseAllDivisionProducts(false);
						}
					}
					if (!(d instanceof Date && !isNaN(d))) {
						realTick = TICK;
					}
					await ns.sleep(realTick);
					funds = corp.getCorporation().funds;

					//This just stops you being able to expand at some point so not doing it any longer
					//If we're waiting for more than 5 minutes, develop products
					/*if (Date.now() - n > 1.8e5) {
						n = Date.now();
						await analyseAllDivisionProducts();
					}*/
				}
			}
		}
	}

	/* Warehouse and Office API are required for this script to run
	 * If you haven't beaten BN3.3 to get these for free I recommend following this guide manually
	 * until you get the 5t investment before running this script:
	 * https://docs.google.com/document/d/e/2PACX-1vTzTvYFStkFjQut5674ppS4mAhWggLL5PEQ_IbqSRDDCZ-l-bjv0E6Uo04Z-UfPdaQVu4c84vawwq8E/pub
	 */
	await buyUnlock(UNLOCK_DEFS.warehouse);
	await buyUnlock(UNLOCK_DEFS.office);

	//You can comment this smartSupply purchase for some extra early funds and it will unlock later
	await buyUnlock(UNLOCK_DEFS.smartSupply);

	/* Set the amount to spend on any new products this cycle.
	 * Setting it here means we don't spend less and less per product as we go through divisions.
	 * If we need to make 3 products and get funds before starting development
	 * it would be 10%, 9%, 7% as the overall funds reduce by 10% each new product.
	 */
	let productDevelopmentCost = corp.getCorporation().funds / PRODUCT_DEVELOPMENT_PERCENTAGE;
	if (corp.getCorporation().funds < 0) {
		ns.print("Funds are negative, set development cost to 30s of profit");
		productDevelopmentCost = Math.floor((corp.getCorporation().revenue - corp.getCorporation().expenses) * profitMultiplier * 30);
	}

	function getMaxProducts(division) {
		if (!division.makesProducts) { return 0 };
		if (corp.hasResearched(division.name, RESEARCH_DEFS.upgradeCapacity2.name)) { return 5 };
		if (corp.hasResearched(division.name, RESEARCH_DEFS.upgradeCapacity1.name)) { return 4 };
		return 3;
	}

	function developingProduct(division) {
		//ns.printf(`${division.products.length} products`);
		for (let product of division.products) {
			//ns.printf(`${product} dev progress: ${corp.getProduct(division.name, product).developmentProgress}`);
			if (corp.getProduct(division.name, product).developmentProgress < 100) {
				//ns.printf(`${product} being developed`);
				return true;
			}
		}

		return false;
	}

	function worstProduct(division) {
		let products = division.products.map(product => { return corp.getProduct(division.name, product) });
		let product = products.reduce(function (prev, curr) {
			return prev.rat < curr.rat ? prev : curr;
		});

		ns.printf(`${product.name} is the worst product at ${division.name} with a rating of ${product.rat.toFixed(0)}`);

		return product;
	}

	function discontinueProduct(division) {
		let product = worstProduct(division);
		ns.print(`Discontinue ${product.name} at ${division.name}`);
		corp.discontinueProduct(division.name, product.name);
	}

	async function developNewProduct(division, city) {
		//Assuming name needs to be unique so use current ms
		let productName = `${division.name}-${Date.now()}`;
		ns.print(`Create new product for ${division.name} at ${city} called ${productName}` +
			` with a budget of ${formatExpo(productDevelopmentCost)}`);
		await awaitFunds(`Awaiting funds to develop product`, productDevelopmentCost);
		corp.makeProduct(division.name, city, productName, productDevelopmentCost / 2, productDevelopmentCost / 2);
		sellProduct(division.name, city, productName);
	}

	async function analyseAllDivisionProducts(discontinue = true) {
		let industries = INDUSTRIES.filter(obj => obj.owned && obj.maxProducts > 0);
		if (industries.length > 0) {
			//ns.print("Owned industries with products:");
			for (let industry of industries) {
				//ns.print(`${industry.industryName} - ${industry.divisionName}`);
				await analyseProducts(corp.getDivision(industry.divisionName), discontinue);
			}
		}
	}

	/* Analyse the products in a division
	 * Check if we have empty product slots
	 * Make sure developed products are on sale
	 * Decide which product to discontinue
	 */
	async function analyseProducts(division, discontinue = true) {
		if (division.makesProducts) {
			//ns.printf(`${division.name} makes products`);
			if (!developingProduct(division)) {
				//ns.printf(`${division.name} isn't currently developing a product`);
				if (division.products.length == getMaxProducts(division)) {
					if (discontinue) {
						//ns.printf(`Need to discontinue`);
						//We have max products, so discontinue the worst one
						discontinueProduct(division, PRODUCT_DEVELOPMENT_CITY);
						//We aren't at product capacity so create a new product
						await developNewProduct(division, PRODUCT_DEVELOPMENT_CITY);
					}
				}
				else {
					//We aren't at product capacity so create a new product
					await developNewProduct(division, PRODUCT_DEVELOPMENT_CITY);
				}
			}
			else {
				//ns.printf(`${division.name} already has a product under developement`);
			}
		}
	}

	function sellProduct(divisionName, city, productName) {
		ns.printf(`Sell ${productName} for ${divisionName}`);
		corp.sellProduct(divisionName, city, productName, "MAX", "MP", true);

		if (corp.hasResearched(divisionName, RESEARCH_DEFS.marketta2.name)) {
			//ns.printf(`Set sales to MAX/Market.TA2 for ${productName} at ${divisionName} ${city}`);
			corp.setProductMarketTA2(divisionName, productName, true);
		}
		else {
			//ns.printf(`Set sales to MAX/MP for ${productName} at ${divisionName} ${city}`);
		}
	}

	function setMaterialForSale(divisionName, city, material) {
		corp.sellMaterial(divisionName, city, material, "MAX", "MP");

		if (corp.hasResearched(divisionName, RESEARCH_DEFS.marketta2.name)) {
			//ns.printf(`Set sales to MAX/Market.TA2 for ${material} at ${divisionName} ${city}`);
			corp.setMaterialMarketTA2(divisionName, city, material, true);
		}
		else {
			//ns.printf(`Set sales to MAX/MP for ${material} at ${divisionName} ${city}`);
		}
	}

	async function setPricing(industry, division, oneCity = "") {
		ns.printf(`Set pricing and enable SmartSupply for ${division.name}`);
		ns.printf(`Set use leftovers for ` +
			industry.reqMats.reduce((prev, curr) => prev + (prev != '' ? ", " : "") + curr, ""));

		for (let city of division.cities) {
			if (oneCity == "" || city == oneCity) {
				if (corp.hasWarehouse(division.name, city)) {
					//Might not need to do this here, we should always have smart supply so this should be done once on expansion
					smartSupply(industry, division, city);
					/*let warehouse = corp.getWarehouse(division.name, city);
					let capacity = warehouse.size;
					//Leave 20% of the capacity for production
					let limit = Math.floor(capacity * 0.8);*/
					for (let material of industry.prodMats) {
						setMaterialForSale(division.name, city, material);
					}
				}
			}
		}

		if (division.makesProducts) {
			for (let productName of division.products) {
				sellProduct(division.name, DEFAULT_CITY, productName);
			}
		}
	}

	async function setPricingOff(industry, division, oneCity = "") {
		ns.printf(`Stop selling products and materials at ${division.name}`);

		for (let city of division.cities) {
			if (oneCity == "" || city == oneCity) {
				if (corp.hasWarehouse(division.name, city)) {
					//Might not need to do this here, we should always have smart supply so this should be done once on expansion
					//smartSupply(industry, division, city);
					/*let warehouse = corp.getWarehouse(division.name, city);
					let capacity = warehouse.size;
					//Leave 20% of the capacity for production
					let limit = Math.floor(capacity * 0.8);*/
					for (let material of industry.prodMats) {
						corp.sellMaterial(division.name, city, material, "0", "MP");
					}
				}
			}
		}

		if (division.makesProducts) {
			for (let productName of division.products) {
				corp.sellProduct(division.name, DEFAULT_CITY, productName, "0", "MP", true);
			}
		}
	}

	/* Buys research if we can afford then returns true if we have it or false if not */
	async function research(industry, divisionName, researchDef) {
		let division = corp.getDivision(divisionName);

		if (!corp.hasResearched(divisionName, researchDef.name)) {
			if (corp.getResearchCost(divisionName, researchDef.name) < division.research) {
				ns.printf(`Research ${researchDef.name} at ${divisionName}`);
				corp.research(divisionName, researchDef.name);

				if (researchDef.name == RESEARCH_DEFS.marketta2.name) {
					await setPricing(industry, division);
				}
				return true;
			}
			else {
				return false;
			}
		}
		else {
			return true;
		}
	}

	async function analyseResearch(industry, divisionName) {
		let division = corp.getDivision(divisionName);
		let researchList = RESEARCH.sort((a, b) => (a.rank > b.rank) ? 1 : ((b.rank > a.rank) ? -1 : 0));
		if (!division.makesProducts) {
			researchList = researchList.filter(research => !research.product);
			//ns.printf(`Total research: ${researchList.length} (${divisionName} is not a product division)`);
		}
		else {
			//ns.printf(`Total research: ${researchList.length} (${divisionName} is a product division)`);
		}

		if (industry.research === undefined) {
			industry.research = 0;
		}
		if (industry.research != researchList.length) {
			industry.research = 0;
			//We have research remaining, research in order, return if we don't have and can't afford the next one
			//if(!research(divisionName, RESEARCH_DEFS.rnd)) { return };
			for (let r of researchList) {
				//ns.printf(`${r.rank} - ${r.name}`);
				let researched = await research(industry, divisionName, r);
				if (!researched) { ns.printf(`${divisionName} can't afford ${r.name} yet`); break };
				industry.research++;
			}
			//ns.printf(`${divisionName} has unlocked ${industry.research} research`);
		}
		else {
			//ns.printf(`${divisionName} has completed all research`);
		}
	}

	async function expandDivision(industry, division) {
		if (division.cities.length < CITIES.length) {
			ns.printf(`Expand ${division.name} to all cities`);
			for (let city of CITIES.filter(obj => division.cities.indexOf(obj) === -1)) {
				let cost = corp.getExpandCityCost();
				await awaitFunds(`Awaiting funds to expand ${division.name} to ${city}`, cost);
				/*let funds = corp.getCorporation().funds;
				while (funds < cost) {
					ns.printf(`Awaiting funds to expand ${division.name} to ${city}` +
						` (${parseInt(funds)}/${cost})`);
					await ns.sleep(TICK);
					funds = corp.getCorporation().funds;
				}*/
				ns.printf(`Expand ${division.name} to ${city}`);
				corp.expandCity(division.name, city);
				if (corp.getCorporation().divisions.length < 2) {
					ns.print(`<2 industries so recruit do stuff as we expand`);
					/* 
					 * Might be short on funds for first couple of industries if we haven't beaten BN3
					 * so for our first 2 industries, allocate staff and sort the products immediately
					 */
					await recruit(industry, division, 3, city);
					await allocateStaff(division, city);
					await expandWarehouse(industry, division, 3, city);
					await setPricing(industry, division, city);
				}
			}
		}
		/*else {
			ns.printf(`${division.name} already has offices in all cities`);
		}*/
	}

	async function expandOffice(industry, division, size, oneCity = "") {
		if (industry.officeStats.minOfficeSize < size) {
			ns.printf(`Expand offices of ${division.name} to size ${size}`);
			for (let city of division.cities) {
				if (oneCity == "" || city == oneCity) {
					let office = corp.getOffice(division.name, city);
					if (office.size < size) {
						let expansionSize = size - office.size;
						let cost = corp.getOfficeSizeUpgradeCost(division.name, city, expansionSize);
						if (size > 60 && size < 240) {
							await buyEarlyAdverts(division, cost / 100);
						}
						await awaitFunds(`Awaiting funds to expand office of ${division.name} in ${city}` +
							` by ${expansionSize} to size ${size}`, cost);
						corp.upgradeOfficeSize(division.name, city, expansionSize);
						await recruit(industry, division, size, city);
					}
				}
			}
			if (oneCity == "") { industry.officeStats.minOfficeSize = size; }
		}
		else {
			ns.printf(`All offices of ${division.name} are already at target size (${size})`);
		}
	}

	async function recruit(industry, division, size, oneCity = "") {
		if (industry.officeStats.minStaff < size) {
			if (oneCity == "") { ns.printf(`Hire employees for ${division.name} to fill capacity (${size})`); }
			for (let city of division.cities) {
				if (oneCity == "" || city == oneCity) {
					let office = corp.getOffice(division.name, city);
					if (office.employees.length < size) {
						let recruit = size - office.employees.length;
						while (recruit > 0) {
							corp.hireEmployee(division.name, city);
							recruit--;
						}
					}

					await allocateStaff(division, city);
				}
			}
			if (oneCity == "") {
				industry.officeStats.minStaff = size;
			}

		}
		else {
			ns.printf(`All offices of ${division.name} are already at capacity (${size})`);
		}
	}

	async function allocateStaff(division, oneCity = "") {
		//ns.printf(`Allocate employee roles for ${division.name}`);
		for (let city of division.cities) {
			if (oneCity == "" || city == oneCity) {
				//ns.printf(`Allocate employee roles for ${division.name} in ${city}`);
				let office = corp.getOffice(division.name, city);
				let size = office.employees.length;
				let roles = [
					JOBS.ops,
					JOBS.eng,
					JOBS.man,
					JOBS.rnd,
					JOBS.bus
				];
				if (size == 3) {
					roles = [
						JOBS.ops,
						JOBS.eng,
						JOBS.bus
					];
				}
				else if (size == 4) {
					roles = [
						JOBS.ops,
						JOBS.eng,
						JOBS.man,
						JOBS.bus
					];
				}

				let quotient = Math.floor(size / roles.length);
				let remainder = size % roles.length;
				let allocation;

				await corp.setAutoJobAssignment(division.name, city, JOBS.training, 0);//-office.employeeJobs[JOBS.training]);

				for (let role of roles) {
					let current = office.employeeJobs[role];
					allocation = quotient + (remainder > 0 ? 1 : 0);
					remainder--;

					if (allocation - current != 0) {
						/*ns.print(`${role}: ${current} currently assigned. Target is ${allocation}.` +
							` ${allocation - current} to allocate`);*/
						await corp.setAutoJobAssignment(division.name, city, role, allocation);// - current);
					}
				}
			}
		}
	}

	function smartSupply(industry, division, city) {
		if (UNLOCK_DEFS.smartSupply.owned) {
			//Turn on smartSupply if possible
			corp.setSmartSupply(division.name, city, true);
			for (let material of industry.reqMats) {
				corp.setSmartSupplyUseLeftovers(division.name, city, material, true);
			}
		}
		else {
			for (let material of industry.reqMats) {
				corp.buyMaterial(division.name, city, material, 0.5);
			}
		}
	}

	async function expandWarehouse(industry, division, level, oneCity = "") {
		if (industry.officeStats.minWarehouseLevel < level) {
			for (let city of division.cities) {
				if (oneCity == "" || city == oneCity) {
					if (!corp.hasWarehouse(division.name, city)) {
						let cost = corp.getPurchaseWarehouseCost();
						await awaitFunds(`Awaiting funds to buy warehouse for ${division.name} in ${city}`, cost);
						/*let funds = corp.getCorporation().funds;
						while (funds < cost) {
							ns.printf(`Awaiting funds to buy warehouse for ${division.name} in ${city}` +
								` (${funds}/${cost})`);
							await ns.sleep(TICK);
							funds = corp.getCorporation().funds;
						}*/
						corp.purchaseWarehouse(division.name, city);
						ns.printf(`Buy warehouse for ${division.name} in ${city}`);
						smartSupply(industry, division, city);
					}
					let warehouse = corp.getWarehouse(division.name, city);
					//ns.printf(`Warehouse level afer purchase: ${warehouse.level}`);
					if (warehouse.level < level) {
						let expansionSize = level - warehouse.level;
						let cost = corp.getUpgradeWarehouseCost(division.name, city, expansionSize);
						await awaitFunds(`Awaiting funds to expand warehouse for ${division.name} in ${city}` +
							` by ${expansionSize} to level ${level}`, cost);
						/*let funds = corp.getCorporation().funds;
						while (funds < cost) {
							ns.printf(`Awaiting funds to expand warehouse for ${division.name} in ${city}` +
							` by ${expansionSize} to level ${level} (${funds}/${cost})`);
							await ns.sleep(TICK);
							funds = corp.getCorporation().funds;
						}*/
						corp.upgradeWarehouse(division.name, city, expansionSize);
						ns.printf(`Expanded warehouse of ${division.name} in ${city} by ${expansionSize} to level ${level}`);
					}
				}
			}
			if (oneCity == "") { industry.officeStats.minWarehouseLevel = level; }
		}
		else {
			ns.printf(`All warehouses of ${division.name} are already at target level (${level})`);
		}
	}

	function sumUpgradeTier(tier) {
		let total = 0;

		for (let upgrade of UPGRADES.filter(upgrade => upgrade.tier === tier)) {
			total += upgrade.level;
		}

		return total;
	}

	async function buyUpgrades(upgrades, targetLevel) {
		for (let upgrade of upgrades) {
			if (upgrade.level < targetLevel) {
				do {
					let cost = corp.getUpgradeLevelCost(upgrade.name);
					await awaitFunds(`Awaiting funds to buy upgrade ${upgrade.name}` +
						` - ${targetLevel - upgrade.level} remaining`, cost);
					/*let funds = corp.getCorporation().funds;
					while (funds < cost) {
						ns.printf(`Awaiting funds to buy upgrade ${upgrade}` +
							` (${parseInt(funds)}/${cost}) - ${targetLevel - upgrade.level} remaining`);
						await ns.sleep(TICK);
						funds = corp.getCorporation().funds;
					}*/
					corp.levelUpgrade(upgrade.name);
					upgrade.level++;
				} while (upgrade.level < targetLevel);
			}
		}
	}

	async function buyCheapUpgrades(seconds = 1) {
		let upgrades = UPGRADES;
		let limit = Math.floor((corp.getCorporation().revenue - corp.getCorporation().expenses) * profitMultiplier * seconds);
		ns.print(`Buy any upgrades costing less than ${formatExpo(limit)}`);

		for (let upgrade of upgrades) {
			let cost = corp.getUpgradeLevelCost(upgrade.name);
			if (cost < limit) {
				do {
					await awaitFunds(`Awaiting funds to buy upgrade ${upgrade.name}`, cost);
					/*let funds = corp.getCorporation().funds;
					while (funds < cost) {
						ns.printf(`Awaiting funds to buy upgrade ${upgrade}` +
							` (${parseInt(funds)}/${cost})`);
						await ns.sleep(TICK);
						funds = corp.getCorporation().funds;
					}*/
					corp.levelUpgrade(upgrade.name);
					upgrade.level++;
					cost = corp.getUpgradeLevelCost(upgrade.name);
				} while (cost < limit);
			}
		}
	}

	async function buyEarlyAdverts(division, limit) {
		//let limit = Math.floor((corp.getCorporation().revenue - corp.getCorporation().expenses) * profitMultiplier * seconds);
		let cost = corp.getHireAdVertCost(division.name);

		if (cost < limit) {
			ns.print(`Buy adverts costing less than ${formatExpo(limit)}`);
			do {
				await awaitFunds(`Awaiting funds to hire AdVert.Inc for ${division.name}`, cost);
				corp.hireAdVert(division.name);
				cost = corp.getHireAdVertCost(division.name);
			} while (cost < limit);
		}
	}

	async function buyCheapAdverts(division, seconds = 1) {
		let limit = Math.floor((corp.getCorporation().revenue - corp.getCorporation().expenses) * profitMultiplier * seconds);
		let cost = corp.getHireAdVertCost(division.name);

		if (cost < limit) {
			ns.print(`Buy adverts costing less than ${formatExpo(limit)}`);
			do {
				await awaitFunds(`Awaiting funds to hire AdVert.Inc for ${division.name}`, cost);
				corp.hireAdVert(division.name);
				cost = corp.getHireAdVertCost(division.name);
			} while (cost < limit);
		}
	}

	async function buyMaterials(industry, division) {
		ns.printf(`Buy productivity materials for ${industry.industryName}`);
		//Factors don't add up to 1 so we need the total to work out a multiplier
		let factorTotal = industry.factors.map(item => item.factor).reduce((prev, curr) => prev + curr, 0);
		for (let f of industry.factors) {
			f.multiplier = f.factor / factorTotal;
			ns.printf(`${f.material}: ${f.factor} - ${(f.multiplier * 100).toFixed(2)}`);
		}
		for (let city of division.cities) {
			let warehouse = corp.getWarehouse(division.name, city);
			let capacity = warehouse.size;
			//Leave 20% of the capacity for production
			let limit = Math.floor(capacity * (warehouse.level < 40 ? 0.8 : 0.5));
			let enough = false;
			while (!enough) {
				enough = true;
				for (let f of industry.factors) {
					let amount = Math.floor(limit * f.multiplier / MATERIAL_SIZES[f.material] / 10) * 10;
					let current = corp.getMaterial(division.name, city, f.material).qty;
					if (amount - current > 10 && warehouse.sizeUsed < warehouse.size * 0.8) {
						enough = false;
						ns.printf(`${city} ${f.material}: Required ${amount} - Current ${current} - Buy ${amount - current}`);
						if (corp.hasResearched(division.name, RESEARCH_DEFS.bulkPurchasing.name)) {
							let m = corp.getMaterial(division.name, city, f.material);
							let cost = m.cost * Math.floor(amount - current);
							await awaitFunds(`Awaiting funds to buy ${Math.floor(amount - current)} ${f.material}` +
								` for ${division.name} in ${city}`, cost);
							corp.bulkPurchase(division.name, city, f.material, Math.floor(amount - current));
						}
						else {
							corp.buyMaterial(division.name, city, f.material, Math.floor((amount - current) / 10));
						}
						corp.sellMaterial(division.name, city, f.material, 0, 0);
					}
					else if (current - amount > 10) {
						//Correct for manually purchasing too much
						enough = false;
						ns.printf(`${city} ${f.material}: Required ${amount} - Current ${current} - Sell ${current - amount}`);
						corp.sellMaterial(division.name, city, f.material, current - amount, "MP/10000");
						corp.buyMaterial(division.name, city, f.material, 0);
					}
					else {
						corp.buyMaterial(division.name, city, f.material, 0);
						corp.sellMaterial(division.name, city, f.material, 0, 0);
					}
				}
				if (!enough) {
					await ns.sleep(corp.getBonusTime() > 0 ? 1000 : 2500);
				}
			}

			for (let f of industry.factors) {
				corp.buyMaterial(division.name, city, f.material, 0);
				corp.sellMaterial(division.name, city, f.material, 0, 0);
			}
		}
	}

	async function buyAdverts(division, targetAdverts) {
		let advertCount = corp.getHireAdVertCount(division.name);
		if (advertCount < targetAdverts) {
			do {
				let cost = corp.getHireAdVertCost(division.name);
				await awaitFunds(`Awaiting funds to hire AdVert.Inc` +
					` - ${targetAdverts - advertCount} remaining`, cost);
				corp.hireAdVert(division.name);
				advertCount++;
			} while (advertCount < targetAdverts);
		}
	}

	async function buyUnlock(unlock) {
		if (!unlock.owned) {
			let cost = corp.getUnlockUpgradeCost(unlock.name);
			await awaitFunds(`Awaiting funds to unlock ${unlock.name}`, cost);

			ns.printf(`Unlocking ${unlock.name}`);
			corp.unlockUpgrade(unlock.name);
			unlock.owned = true;
		}
	}

	async function buyUnlocks() {
		let unlocks = UNLOCKS.filter(unlock => !unlock.owned);
		let limit = Math.floor((corp.getCorporation().revenue - corp.getCorporation().expenses) * profitMultiplier * 10);

		for (let unlock of unlocks) {
			if (corp.getUnlockUpgradeCost(unlock.name) < limit) {
				await buyUnlock(unlock);
			}
		}
	}

	async function upgradeDivision(industry, targetOfficeSize, targetWarehouseLevel, targetAdverts) {
		let division = corp.getDivision(industry.divisionName);
		//Maybe don't do all cities 1st run to set it up and start making a bit of cash...
		await expandDivision(industry, division);
		await expandOffice(industry, division, targetOfficeSize);
		await recruit(industry, division, targetOfficeSize);
		await allocateStaff(division);
		await expandWarehouse(industry, division, targetWarehouseLevel);
		await setPricing(industry, division);
		await buyMaterials(industry, division);
		//ns.print("Sleep for 10s after buying materials for profit to stablise");
		//await ns.sleep(10000);
		await buyAdverts(division, targetAdverts);
		await buyUnlocks();
	}

	while (true) {
		var activeDivision = 0;
		let newIndustry = corp.getCorporation().divisions.length == 0;

		for (let division of corp.getCorporation().divisions) {
			let i = INDUSTRIES.findIndex(obj => obj.divisionName === division.name);
			let industry = INDUSTRIES[i];
			industry.owned = true;

			ns.printf(`Analysing ${division.name}`);

			//ns.print(`i: ${i+1} - divs: ${corp.getCorporation().divisions.length}`);

			await analyseProducts(division);
			await analyseResearch(industry, division.name);

			if (division.cities.length < 6) {
				industry.phase = PHASES.setup;
				ns.printf("Not expanded to all cities yet.");
			}
			else {
				let office, warehouse;
				let minWarehouseLevel = 0;
				let minOfficeSize = 0;
				let minStaff = 0;

				for (let city of division.cities) {
					office = corp.getOffice(division.name, city);
					minOfficeSize = minOfficeSize == 0 ? office.size : Math.min(minOfficeSize, office.size);
					minStaff = minStaff == 0 ? office.employees.length : Math.min(minStaff, office.employees.length);

					if (corp.hasWarehouse(division.name, city)) {
						warehouse = corp.getWarehouse(division.name, city);
						minWarehouseLevel = minWarehouseLevel == 0 ? warehouse.level :
							Math.min(minWarehouseLevel, warehouse.level);
					}
					else {
						minWarehouseLevel = Math.min(minWarehouseLevel, 0);
					}
				}

				//ns.printf(`Smallest office: ${minOfficeSize}`);
				//ns.printf(`Fewest employees: ${minStaff}`);
				//ns.printf(`Lowest warehouse level: ${minWarehouseLevel}`);

				industry.officeStats.minOfficeSize = minOfficeSize;
				industry.officeStats.minStaff = minStaff;
				industry.officeStats.minWarehouseLevel = minWarehouseLevel;

				industry.adverts = division.upgrades[1];
				//ns.printf(`AdVert.Inc: ${industry.adverts}`);


				if (division.makesProducts) {
					industry.maxProducts = getMaxProducts(division);
					//ns.printf(`Products: ${division.products.length} of ${industry.maxProducts}`);
				}

				if (minOfficeSize < 3 || minStaff < 3 || minWarehouseLevel < 3 || industry.adverts < 1) {
					//Still in setup phase: expand to all cities, hire 3 staff, upgrade warehouses to level 3 
					//ns.printf(`1`);
					industry.phase = PHASES.setup;
				}
				else if (minOfficeSize < 9 || minStaff < 9 || minWarehouseLevel < 10 || industry.adverts < 3) {
					//First growth stage: expanding office and warehouse, buy more productivity materials
					//ns.printf(`2`);
					//industry.phase = PHASES.growth1;
					industry.phase = PHASES.setup;
				}
				else if (division.makesProducts && division.products < industry.maxProducts) {
					//First growth stage: expanding office and warehouse, buy more productivity materials
					//ns.printf(`3`);
					//industry.phase = PHASES.production1;
					industry.phase = PHASES.setup;
				}
				else if (minOfficeSize < 60 || minWarehouseLevel < 20 || industry.adverts < 10) {
					//Second growth phase: expand office and warehouse more
					//ns.printf(`4`);
					industry.phase = PHASES.growth1;
				}
				else if (i + 1 == corp.getCorporation().divisions.length && i + 1 < INDUSTRIES.length && i + 1 < 2) {
					ns.print("Expand to new industry");
					//Expand to next industry?
					newIndustry = true;
					//Assuming office <120 and warehouse <30 at this point but doesn't really matter
					industry.phase = PHASES.growth2;
				}
				else if (minOfficeSize < 120 || minWarehouseLevel < 40 || industry.adverts < 50) {
					//Second growth phase: expand office and warehouse more
					//ns.printf(`Growth phase ${PHASES.growth1}`);
					//industry.phase = PHASES.growth2;
					industry.phase = PHASES.growth2;

					let minorPhase = Math.floor((industry.adverts - 10) / 10) / 10;
					//ns.print(`Minor phase: ${minorPhase}`)
					industry.phase = PHASES.growth2 + minorPhase;

					await buyCheapAdverts(division);
				}
				/*else if (minOfficeSize < 240 || minWarehouseLevel < 80 || industry.adverts < 50) {
					//Second growth phase: expand office and warehouse more
					//ns.printf(`Growth phase ${PHASES.growth1}`);
					//industry.phase = PHASES.growth2;
					industry.phase = PHASES.growth3;
				}*/
				else {
					/* From this point just double everything to expand further
					 * Increase phase by 1 for each time this has been doubled
					 * If minOffice size is 120, warehouse is 40 and adverts is 25 (growth2) phase is PHASES.doubleIt
					 * If it's 240, 40, 50 it's doubleIt+1, 480, 80, 100 doubleIt+2 etc
					 */

					//ns.print(`office: ${minOfficeSize} - ${Math.log2(Math.floor(minOfficeSize / 120))}`);
					//ns.print(`warehouse: ${minWarehouseLevel} - ${Math.log2(Math.floor(minWarehouseLevel / 40))}`);
					//ns.print(`adverts: ${industry.adverts} - ${Math.log2(Math.floor(industry.adverts / 25))}`);

					industry.phase = PHASES.doubleIt + 1 +
						Math.min(
							Math.log2(Math.floor(minOfficeSize / 120)),
							Math.log2(Math.floor(minWarehouseLevel / 40)),
							Math.log2(Math.floor(industry.adverts / 50))
						);

					if (i < 5 && industry.phase < PHASES.doubleIt + 2) {
						let minorPhase = Math.floor((minWarehouseLevel - 40) / 10) / 10;
						ns.print(`Minor phase: ${minorPhase}`)
						industry.phase = industry.phase + minorPhase;
					}

					//Should be making a tonne of money at this point so just expand to all industries
					if (i == 0 &&
						//industry.phase >= PHASES.doubleIt + 2 &&
						corp.getCorporation().divisions.length < 5) {
						newIndustry = true;
					}
					else if (i == 0 &&
						industry.phase >= PHASES.doubleIt + 3 &&
						corp.getCorporation().divisions.length < INDUSTRIES.length) {
						newIndustry = true;
					}

					await buyCheapAdverts(division);

					/*ns.print(`DoubleIt phase ${industry.phase - PHASES.doubleIt}`);
					ns.print(`New office size should be 120*${Math.pow(2, industry.phase - PHASES.doubleIt)}=` +
						`${120 * Math.pow(2, industry.phase - PHASES.doubleIt)}`);
					ns.print(`New warehouse level should be 40*${Math.pow(2, industry.phase - PHASES.doubleIt)}=` +
						`${40 * Math.pow(2, industry.phase - PHASES.doubleIt)}`);
					ns.print(`New AdVert.Inc level should be 25*${Math.pow(2, industry.phase - PHASES.doubleIt)}=` +
						`${25 * Math.pow(2, industry.phase - PHASES.doubleIt)}`);*/
				}
			}

			//ns.printf(`Division phase: ${industry.phase}. Current active phase: ${INDUSTRIES[activeDivision].phase}`);
			if (industry.phase < INDUSTRIES[activeDivision].phase) {
				activeDivision = i;
				//ns.printf("Should be active");
			}
		}

		//Only create a new industry when existing industries are at the same level
		if (newIndustry && activeDivision > 0) {
			newIndustry = false;
		}

		if (newIndustry) {
			let divisionCount = corp.getCorporation().divisions.length;
			if (divisionCount < INDUSTRIES.length) {
				let industry = INDUSTRIES[divisionCount];
				let industryCost = corp.getExpandIndustryCost(industry.industryName) * (activeDivision == 0 ? 1 : 3);
				//let funds = corp.getCorporation().funds;
				await awaitFunds(`Awaiting funds to create ${industry.industryName}`, industryCost);
				/*while (funds < industryCost * (activeDivision == 0 ? 1 : 3)) {
					ns.printf( +
						` (${parseInt(funds)}/${industryCost * 3})`);
					await ns.sleep(TICK);
					funds = corp.getCorporation().funds;
				}*/
				ns.printf(`Creating industry ${industry.industryName} as ${industry.divisionName}`);
				ns.printf("This will be the active division");
				activeDivision = divisionCount;
				corp.expandIndustry(industry.industryName, industry.divisionName);
				industry.officeStats = { minOfficeSize: 0, minStaff: 0, minWarehouseLevel: 0 };
				let division = corp.getDivision(industry.divisionName)
				await recruit(industry, division, 3);
				await allocateStaff(division, DEFAULT_CITY);
				await setPricing(industry, division, DEFAULT_CITY);
				await analyseProducts(division);

				//Jump this industry straight up to the first industry phase so it doesn't have to loop 8 times to catch it up
				industry.phase = INDUSTRIES[0].phase - 1;
			}
		}
		else {
			ns.printf(`Active division is ${INDUSTRIES[activeDivision].industryName}`);

			let industry = INDUSTRIES[activeDivision];
			if (industry.phase < PHASES.doubleIt) {
				ns.print(`Phase ${industry.phase}`);
			}
			else {
				ns.print(`DoubleIt phase ${industry.phase - PHASES.doubleIt}`);
			}
		}

		let t1 = sumUpgradeTier(1);
		let t2 = sumUpgradeTier(2);
		let t3 = sumUpgradeTier(3);
		//ns.printf(`Total upgrade tiers 1: ${t1}, 2: ${t2}, 3: ${t3}`);

		let corpPhase = 0;

		//ns.printf(`${formatExpo(corp.getCorporation().numShares)} - 0.9e9`);
		if (t1 < 10) {
			corpPhase = 0;
		}
		else if (UPGRADE_DEFS.factories.level + UPGRADE_DEFS.storage.level < 20) {
			if (!corp.getCorporation().public && corp.getCorporation().numShares == 1e9) {
				//Not public and still have all shares, need investment.
				corpPhase = 0;
			}
			else {
				corpPhase = 1;
			}
		}
		else if (!corp.getCorporation().public && corp.getCorporation().numShares == 0.9e9) {
			//Not public and only got investment once, need investment.
			corpPhase = 1;
		}
		else if (t1 + t2 < 140) {
			//20 of each t1 and t2 upgrade
			corpPhase = 2;
		}
		else if (!corp.getCorporation().public) {
			corpPhase = 3;
		}
		else {
			corpPhase = 999;
		}

		//ns.printf(`Corporation phase: ${corpPhase}`);

		let industry = INDUSTRIES[activeDivision];

		//If we're rich, skip early phases (i.e. don't hire 3, then 9, then 60 employees)
		let funds = corp.getCorporation().funds;

		if (funds < 1e12 && (industry.officeStats.minOfficeSize < 3 ||
			industry.officeStats.minStaff < 3 ||
			industry.officeStats.minWarehouseLevel < 3 ||
			industry.adverts < 1)) {
			//Still in setup phase: expand to all cities, hire 3 staff, upgrade warehouses to level 3 
			//ns.printf(`Setup phase ${PHASES.setup}`);
			industry.phase = PHASES.setup;

			let targetOfficeSize = 3;
			let targetWarehouseLevel = 3;
			let targetAdverts = 1;

			await upgradeDivision(industry, targetOfficeSize, targetWarehouseLevel, targetAdverts);
		}
		else if (corpPhase == 0) {
			//Buy 2 of all the tier 1 upgrades
			ns.printf("Buy 2 of each tier 1 upgrade");
			await buyUpgrades(UPGRADES.filter(upgrade => upgrade.tier === 1), 1);
			await buyUpgrades(UPGRADES.filter(upgrade => upgrade.tier === 1), 2);

			if (!corp.getCorporation().public && corp.getCorporation().numShares == 1e9) {
				ns.print("Get investment");

				let offer = corp.getInvestmentOffer().funds;
				await setPricingOff(industry, corp.getDivision(industry.divisionName));
				ns.print("Sleep for 30s to fill warehouse capacity");
				await ns.sleep(30000);
				await setPricing(industry, corp.getDivision(industry.divisionName));
				offer = corp.getInvestmentOffer().funds;
				let amount = 210e9;
				let n = 0;
				if (offer < amount) {
					do {
						ns.printf(`Waiting for 210b investment offer. Current offer ${formatExpo(offer)}`);
						await ns.sleep(5000);
						offer = corp.getInvestmentOffer().funds;
						/*n++;
						if (n == 5) {
							amount = 250e9;
						}
						else if (n == 10) {
							amount = 210e9;
						}*/
					} while (offer < amount);
				}
				corp.acceptInvestmentOffer();
				ns.printf(`Accepted investment. New funds ${formatExpo(corp.getCorporation().funds)}`);

				//If someone turned this off at the top because they haven't beaten 3.3, it should unlock here
				await buyUnlock(UNLOCK_DEFS.smartSupply);
			}
		}
		else if (funds < 1e12 && (industry.officeStats.minOfficeSize < 9 ||
			industry.officeStats.minStaff < 9 ||
			industry.officeStats.minWarehouseLevel < 10 ||
			industry.adverts < 3)) {
			//First growth stage: expanding office and warehouse, buy more productivity materials
			//ns.printf(`Growth phase ${PHASES.setup}`);
			//industry.phase = PHASES.growth1;
			industry.phase = PHASES.setup;
			//await allocate();
			let targetOfficeSize = 9;
			let targetWarehouseLevel = 10;
			let targetAdverts = 3;

			await upgradeDivision(industry, targetOfficeSize, targetWarehouseLevel, targetAdverts);
		}
		else if (corpPhase == 1) {
			//Upgrade factories and storage to 20
			ns.printf(`Buy 10 of each ${UPGRADE_DEFS.factories.name} and ${UPGRADE_DEFS.storage.name}`);
			await buyUpgrades([UPGRADE_DEFS.factories, UPGRADE_DEFS.storage], 10);
			await buyMaterials(industry, corp.getDivision(industry.divisionName));

			if (!corp.getCorporation().public && corp.getCorporation().numShares == 0.9e9) {
				while (corp.getCorporation().funds < 0) {
					ns.print("Wait for corporation to have funds for higher investment");
					await ns.sleep(10000);
				}
				ns.print("Get investment");
				let offer = corp.getInvestmentOffer().funds;
				await setPricingOff(industry, corp.getDivision(industry.divisionName));
				ns.print("Sleep for 30s to fill warehouse capacity");
				await ns.sleep(30000);
				await setPricing(industry, corp.getDivision(industry.divisionName));
				offer = corp.getInvestmentOffer().funds;
				let n = 0;
				if (offer < 4e12) {
					do {
						ns.printf(`Waiting for 4t investment offer. Current offer ${formatExpo(offer)}/4e12`);
						await ns.sleep(10000);
						offer = corp.getInvestmentOffer().funds;
						n++;
					} while (offer < 4e12 && n < 10);
				}
				if (offer > 4e12) {
					//await ns.sleep(10000);
					corp.acceptInvestmentOffer();
					ns.printf(`Accepted investment. New funds ${formatExpo(corp.getCorporation().funds)}`);
					await buyUpgrades([UPGRADE_DEFS.wilson], 10);
				}
				else {
					await buyUpgrades([UPGRADE_DEFS.wilson, UPGRADE_DEFS.dream], 2);
				}
			}
		}
		else if (funds < 10e12 && (industry.officeStats.minOfficeSize < 60 ||
			industry.officeStats.minStaff < 60 ||
			industry.officeStats.minWarehouseLevel < 20 ||
			industry.adverts < 10) && (corp.getCorporation().divisions.length < 3 || corpPhase > 2)) {
			//First growth stage: expanding office and warehouse, buy more productivity materials
			//ns.printf(`Growth phase ${PHASES.growth1}`);
			//industry.phase = PHASES.growth1;
			industry.phase = PHASES.growth1;
			//await allocate();
			let targetOfficeSize = 60;
			let targetWarehouseLevel = 20;
			let targetAdverts = 10;

			await upgradeDivision(industry, targetOfficeSize, targetWarehouseLevel, targetAdverts);

			await buyCheapUpgrades(10);
		}
		else if (corpPhase == 2) {
			//Upgrade factories and storage to 20
			ns.printf(`Buy 20 of each tier 1 and 2 upgrades`);
			await buyUpgrades(UPGRADES.filter(upgrade => upgrade.tier === 1 || upgrade.tier === 2), 20);
		}
		else if (corpPhase == 3 && corp.getInvestmentOffer().funds > 800e12) {
			//Get a final investment and go public
			if (!corp.getCorporation().public) {
				/*if (corp.getCorporation().numShares == 0.55e9) {
					ns.print("Get investment");
					//await ns.sleep(10000);
					let offer = corp.getInvestmentOffer().funds;
					if (offer < 800e12) {
						ns.printf(`Waiting for 800t investment offer. Current offer ${formatExpo(offer)}/8e14`);
						do {
							await ns.sleep(10000);
							offer = corp.getInvestmentOffer().funds;
						} while (offer < 800e12);
					}
					await ns.sleep(10000);
					corp.acceptInvestmentOffer();
					ns.printf(`Accepted investment. New funds ${formatExpo(corp.getCorporation().funds)}`);
				}*/

				if (corp.goPublic(0)) {
					ns.printf(`${corp.getCorporation().name} is now public!`);
				}
				else {
					ns.printf(`${corp.getCorporation().name} could not go public`);
				}
			}
		}
		else if (funds < 10e12 && (industry.officeStats.minOfficeSize < 120 ||
			industry.officeStats.minStaff < 120 ||
			industry.officeStats.minWarehouseLevel < 40 ||
			industry.adverts < 50) && (corp.getCorporation().divisions.length < 3 || corpPhase > 2)) {
			//First growth stage: expanding office and warehouse, buy more productivity materials
			//ns.printf(`Growth phase ${PHASES.growth2}`);
			//industry.phase = PHASES.growth1;
			industry.phase = PHASES.growth2;

			let multi = (industry.officeStats.minStaff - 60) / 15;

			let targetOfficeSize = 60 + (15 * multi); //120
			let targetWarehouseLevel = 20 + (5 * multi); //40
			let targetAdverts = 10 + (10 * multi); //25

			//Only increase if everything is up a step
			//This stops it doing office size again if the script is killed after doing office but before warehouse for example
			if (industry.officeStats.minStaff >= targetOfficeSize &&
				industry.officeStats.minWarehouseLevel >= targetWarehouseLevel &&
				industry.adverts >= targetAdverts) {
				targetOfficeSize += 15;
				targetWarehouseLevel += 5;
				targetAdverts += 10;
			}

			await upgradeDivision(industry, targetOfficeSize, targetWarehouseLevel, targetAdverts);

			await buyCheapUpgrades(10);
		}
		/*else if (industry.officeStats.minOfficeSize < 240 ||
			industry.officeStats.minStaff < 240 ||
			industry.officeStats.minWarehouseLevel < 80 ||
			industry.adverts < 50) {
			//First growth stage: expanding office and warehouse, buy more productivity materials
			ns.printf(`Growth phase ${PHASES.growth3}`);
			//industry.phase = PHASES.growth1;
			industry.phase = PHASES.growth3;
			//await allocate();
			let targetOfficeSize = 240;
			let targetWarehouseLevel = 80;
			let targetAdverts = 50;
	
			await upgradeDivision(industry, targetOfficeSize, targetWarehouseLevel, targetAdverts);
		}*/
		else if (industry.phase < 12) {
			//In the DoubleIt phase after 120. DoubleIt phase 1 is 240,80,50, DoubleIt phase 2 is 480, 160, 100 etc

			//If we're doing new industries, we want to jump them up quickly
			if (industry.phase < PHASES.doubleIt) {
				industry.phase = INDUSTRIES[0].phase - 1;
			}

			ns.print(`phase: ${industry.phase}`);
			let pow = Math.pow(2, industry.phase - PHASES.doubleIt);
			let targetOfficeSize = 120 * pow;
			let targetWarehouseLevel = 40 * pow;
			let targetAdverts = 50 * pow;
			//let t12Upgrades = 20 * pow;

			if (activeDivision < 5 && industry.phase < PHASES.doubleIt + 2) {
				let multi = (industry.officeStats.minStaff - 120) / 30;

				targetOfficeSize = 120 + (30 * multi); //120
				targetWarehouseLevel = 40 + (10 * multi); //40
				targetAdverts = 50 + (20 * multi); //25

				//Only increase if everything is up a step
				//This stops it doing office size again if the script is killed after doing office but before warehouse for example
				if (industry.officeStats.minStaff >= targetOfficeSize &&
					industry.officeStats.minWarehouseLevel >= targetWarehouseLevel &&
					industry.adverts >= targetAdverts) {
					targetOfficeSize += 30;
					targetWarehouseLevel += 10;
					targetAdverts += 20;
				}
			}
			else if (activeDivision < 5 && industry.phase < PHASES.doubleIt + 3) {
				let multi = (industry.officeStats.minStaff - 240) / 60;

				targetOfficeSize = 240 + (60 * multi); //120
				targetWarehouseLevel = 80 + (20 * multi); //40
				targetAdverts = 110 + (40 * multi); //25

				//Only increase if everything is up a step
				//This stops it doing office size again if the script is killed after doing office but before warehouse for example
				if (industry.officeStats.minStaff >= targetOfficeSize &&
					industry.officeStats.minWarehouseLevel >= targetWarehouseLevel &&
					industry.adverts >= targetAdverts) {
					targetOfficeSize += 60;
					targetWarehouseLevel += 20;
					targetAdverts += 40;
				}
			}

			/*ns.print(`New office size should be 120*${pow}=` +
				`${targetOfficeSize}`);
			ns.print(`New warehouse level should be 40*${pow}=` +
				`${targetWarehouseLevel}`);
			ns.print(`New AdVert.Inc level should be 25*${pow}=` +
				`${targetAdverts}`);*/

			await upgradeDivision(industry, targetOfficeSize, targetWarehouseLevel, targetAdverts);

			await buyCheapUpgrades();
		}
		else {
			ns.print("Expanding further seems to break the date object, so just buy upgrades and develop products now");
			await buyCheapUpgrades(5);
		}

		if (ns.getOwnedSourceFiles().filter(sf => sf.n === 4)) {
			//We have access to Singularity API so we can buy faction rep
			if (corp.getCorporation().funds > 1e30) {
				let player = ns.getPlayer();
				for (let faction of player.factions) {
					let rep = ns.singularity.getFactionRep(faction);
					let maxRepReq = 0;
					for (let augment of ns.singularity.getAugmentationsFromFaction(faction)) {
						let repReq = ns.singularity.getAugmentationRepReq(augment);
						if (repReq > maxRepReq) {
							maxRepReq = repReq;
						}
					}
					//ns.print(`Max rep requirement for ${faction} is ${maxRepReq}`);
					if (rep < maxRepReq) {
						await awaitFunds(`Awaiting funds to bribe ${faction}`, (maxRepReq - rep) * 1e9);
						ns.print(`Bribing ${faction}`);
						corp.bribe(faction, (maxRepReq - rep) * 1e9, 0);
					}
				}
			}
		}

		if (corp.getCorporation().public) {
			//ns.printf("We're public so issue dividends!");
			let c = corp.getCorporation();
			let profit = c.revenue - c.expenses;

			//Should be making e115 $/s at this point so take 95% of it as dividends
			if (industry.phase == 12) {
				corp.issueDividends(0.95);
				profitMultiplier = 0.05;
				dividendPercent = 95;
			}
			//If we're making more than 1t/s, take 50% of it
			else if (profit > 1e12) {
				corp.issueDividends(0.5);
				profitMultiplier = 0.5;
				dividendPercent = 50;
				//ns.print("50% dividends");
			}
			//If we're making more than 11b/s, take 25% of it
			else if (profit > 100e9) {
				corp.issueDividends(0.25);
				profitMultiplier = 0.75;
				dividendPercent = 25;
				//ns.print("25% dividends");
			}
			else {
				corp.issueDividends(0);
				profitMultiplier = 1;
				dividendPercent = 0;
				//ns.print("10% dividends");
			}
		}

		await ns.write(DIVIDEND_FILE, "{\n" +
			`  "dividendPercent": ${dividendPercent},\n` +
			`  "profitMultiplier": ${profitMultiplier},\n` +
			`  "dividendMultiplier": ${1 - profitMultiplier}\n` +
			"}", 'w');

		ns.printf(`${new Date().toLocaleString()}`);
		await ns.sleep(TICK);
		ns.clearLog();
	}
}
