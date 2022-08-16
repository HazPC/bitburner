export const MATERIAL_DEFS = {
	water: "Water",
	energy: "Energy",
	food: "Food",
	plants: "Plants",
	metal: "Metal",
	hardware: "Hardware",
	chemicals: "Chemicals",
	drugs: "Drugs",
	robots: "Robots",
	aiCores: "AI Cores",
	realEstate: "Real Estate"
};
export const MATERIALS = [
	MATERIAL_DEFS.water,
	MATERIAL_DEFS.energy,
	MATERIAL_DEFS.food,
	MATERIAL_DEFS.plants,
	MATERIAL_DEFS.metal,
	MATERIAL_DEFS.hardware,
	MATERIAL_DEFS.chemicals,
	MATERIAL_DEFS.drugs,
	MATERIAL_DEFS.robots,
	MATERIAL_DEFS.aiCores,
	MATERIAL_DEFS.realEstate
];
export const MATERIAL_SIZES = {
	[MATERIAL_DEFS.water]: 0.05,
	[MATERIAL_DEFS.energy]: 0.01,
	[MATERIAL_DEFS.food]: 0.03,
	[MATERIAL_DEFS.plants]: 0.05,
	[MATERIAL_DEFS.metal]: 0.1,
	[MATERIAL_DEFS.hardware]: 0.06,
	[MATERIAL_DEFS.chemicals]: 0.05,
	[MATERIAL_DEFS.drugs]: 0.02,
	[MATERIAL_DEFS.robots]: 0.5,
	[MATERIAL_DEFS.aiCores]: 0.1,
	[MATERIAL_DEFS.realEstate]: 0.005
};
export const UNLOCK_DEFS = {
	exports: { name: "Export", owned: false },
	smartSupply: { name: "Smart Supply", owned: false },
	marketDemand: { name: "Market Research - Demand", owned: false },
	marketComp: { name: "Market Data - Competition", owned: false },
	veChain: { name: "VeChain", owned: false },
	shady: { name: "Shady Accounting", owned: false },
	moreShady: { name: "Government Partnership", owned: false },
	warehouse: { name: "Warehouse API", owned: false },
	office: { name: "Office API", owned: false }
};
export const UNLOCKS = [
	UNLOCK_DEFS.exports,
	UNLOCK_DEFS.smartSupply,
	UNLOCK_DEFS.marketDemand,
	UNLOCK_DEFS.marketComp,
	UNLOCK_DEFS.veChain,
	UNLOCK_DEFS.shady,
	UNLOCK_DEFS.moreShady,
	UNLOCK_DEFS.warehouse,
	UNLOCK_DEFS.office
];
export const UPGRADE_DEFS = {
	factories: { name: "Smart Factories", tier: 1, level: 0 },
	storage: { name: "Smart Storage", tier: 2, level: 0 },
	dream: { name: "DreamSense", tier: 2, level: 0 },
	wilson: { name: "Wilson Analytics", tier: 3, level: 0 },
	nuoptimal: { name: "Nuoptimal Nootropic Injector Implants", tier: 1, level: 0 },
	speech: { name: "Speech Processor Implants", tier: 1, level: 0 },
	neural: { name: "Neural Accelerators", tier: 1, level: 0 },
	focus: { name: "FocusWires", level: 0, tier: 1 },
	abc: { name: "ABC SalesBots", tier: 2, level: 0 },
	project: { name: "Project Insight", tier: 2, level: 0 }
};
export const UPGRADES = [
	UPGRADE_DEFS.factories,
	UPGRADE_DEFS.storage,
	UPGRADE_DEFS.dream,
	UPGRADE_DEFS.wilson,
	UPGRADE_DEFS.nuoptimal,
	UPGRADE_DEFS.speech,
	UPGRADE_DEFS.neural,
	UPGRADE_DEFS.focus,
	UPGRADE_DEFS.abc,
	UPGRADE_DEFS.project
];
export const CITIES = ["Aevum", "Chongqing", "Sector-12", "New Tokyo", "Ishima", "Volhaven"];
export const JOBS = {
	ops: "Operations",
	eng: "Engineer",
	bus: "Business",
	man: "Management",
	rnd: "Research & Development",
	training: "Training"
};
export const PHASES = {
	setup: 1,
	growth1: 2,
	growth2: 3,
	growth3: 4,
	doubleIt: 5
};
export const INDUSTRY_DEFS = {
	agriculture: {
		industryName: "Agriculture", divisionName: "Ag", owned: false, maxProducts: 0, phase: 0,
		officeStats: { minOfficeSize: 0, minStaff: 0, minWarehouseLevel: 0 },
		reqMats: [MATERIAL_DEFS.water, MATERIAL_DEFS.energy],
		prodMats: [MATERIAL_DEFS.plants, MATERIAL_DEFS.food],
		factors: [
			{ material: MATERIAL_DEFS.hardware, factor: 0.2}, { material: MATERIAL_DEFS.robots, factor: 0.3},
			{ material: MATERIAL_DEFS.aiCores, factor: 0.3}, { material: MATERIAL_DEFS.realEstate, factor: 0.72}
		]
	},
	chemical: {
		industryName: "Chemical", divisionName: "Ch", owned: false, maxProducts: 0, phase: 0,
		officeStats: { minOfficeSize: 0, minStaff: 0, minWarehouseLevel: 0 },
		reqMats: [MATERIAL_DEFS.water, MATERIAL_DEFS.energy, MATERIAL_DEFS.plants],
		prodMats: [MATERIAL_DEFS.chemicals],
		factors: [
			{ material: MATERIAL_DEFS.hardware, factor: 0.2}, { material: MATERIAL_DEFS.robots, factor: 0.25},
			{ material: MATERIAL_DEFS.aiCores, factor: 0.2}, { material: MATERIAL_DEFS.realEstate, factor: 0.25}
		]
	},
	computer: {
		industryName: "Computer", divisionName: "Co", owned: false, maxProducts: 0, phase: 0,
		officeStats: { minOfficeSize: 0, minStaff: 0, minWarehouseLevel: 0 },
		reqMats: [MATERIAL_DEFS.metal, MATERIAL_DEFS.energy],
		prodMats: [MATERIAL_DEFS.hardware],
		factors: [
			{ material: MATERIAL_DEFS.robots, factor: 0.36},
			{ material: MATERIAL_DEFS.aiCores, factor: 0.19}, { material: MATERIAL_DEFS.realEstate, factor: 0.2}
		]
	},
	energy: {
		industryName: "Energy", divisionName: "En", owned: false, maxProducts: 0, phase: 0,
		officeStats: { minOfficeSize: 0, minStaff: 0, minWarehouseLevel: 0 },
		reqMats: [MATERIAL_DEFS.hardware, MATERIAL_DEFS.metal],
		prodMats: [MATERIAL_DEFS.energy],
		factors: [
			{ material: MATERIAL_DEFS.robots, factor: 0.05},
			{ material: MATERIAL_DEFS.aiCores, factor: 0.3}, { material: MATERIAL_DEFS.realEstate, factor: 0.65}
		]
	},
	fishing: {
		industryName: "Fishing", divisionName: "Fi", owned: false, maxProducts: 0, phase: 0,
		officeStats: { minOfficeSize: 0, minStaff: 0, minWarehouseLevel: 0 },
		reqMats: [MATERIAL_DEFS.energy],
		prodMats: [MATERIAL_DEFS.food],
		factors: [
			{ material: MATERIAL_DEFS.hardware, factor: 0.35}, { material: MATERIAL_DEFS.robots, factor: 0.5},
			{ material: MATERIAL_DEFS.aiCores, factor: 0.2}, { material: MATERIAL_DEFS.realEstate, factor: 0.15}
		]
	},
	food: {
		industryName: "Food", divisionName: "Fo", owned: false, maxProducts: 0, phase: 0,
		officeStats: { minOfficeSize: 0, minStaff: 0, minWarehouseLevel: 0 },
		reqMats: [MATERIAL_DEFS.food, MATERIAL_DEFS.water, MATERIAL_DEFS.energy],
		prodMats: [],
		factors: [
			{ material: MATERIAL_DEFS.hardware, factor: 0.15}, { material: MATERIAL_DEFS.robots, factor: 0.3},
			{ material: MATERIAL_DEFS.aiCores, factor: 0.25}, { material: MATERIAL_DEFS.realEstate, factor: 0.05}
		]
	},
	health: {
		industryName: "Healthcare", divisionName: "He", owned: false, maxProducts: 0, phase: 0,
		officeStats: { minOfficeSize: 0, minStaff: 0, minWarehouseLevel: 0 },
		reqMats: [MATERIAL_DEFS.robots, MATERIAL_DEFS.aiCores, MATERIAL_DEFS.energy, MATERIAL_DEFS.water],
		prodMats: [],
		factors: [
			{ material: MATERIAL_DEFS.hardware, factor: 0.1},
			{ material: MATERIAL_DEFS.realEstate, factor: 0.1}
		]
	},
	mining: {
		industryName: "Mining", divisionName: "Mi", owned: false, maxProducts: 0, phase: 0,
		officeStats: { minOfficeSize: 0, minStaff: 0, minWarehouseLevel: 0 },
		reqMats: [MATERIAL_DEFS.energy],
		prodMats: [MATERIAL_DEFS.metal],
		factors: [
			{ material: MATERIAL_DEFS.hardware, factor: 0.4}, { material: MATERIAL_DEFS.robots, factor: 0.45},
			{ material: MATERIAL_DEFS.aiCores, factor: 0.45}, { material: MATERIAL_DEFS.realEstate, factor: 0.3}
		]
	},
	pharma: {
		industryName: "Pharmaceutical", divisionName: "Ph", owned: false, maxProducts: 0, phase: 0,
		officeStats: { minOfficeSize: 0, minStaff: 0, minWarehouseLevel: 0 },
		reqMats: [MATERIAL_DEFS.chemicals, MATERIAL_DEFS.energy, MATERIAL_DEFS.water],
		prodMats: [MATERIAL_DEFS.drugs],
		factors: [
			{ material: MATERIAL_DEFS.hardware, factor: 0.15}, { material: MATERIAL_DEFS.robots, factor: 0.25},
			{ material: MATERIAL_DEFS.aiCores, factor: 0.2}, { material: MATERIAL_DEFS.realEstate, factor: 0.05}
		]
	},
	realEstate: {
		industryName: "RealEstate", divisionName: "Re", owned: false, maxProducts: 0, phase: 0,
		officeStats: { minOfficeSize: 0, minStaff: 0, minWarehouseLevel: 0 },
		reqMats: [MATERIAL_DEFS.metal, MATERIAL_DEFS.energy, MATERIAL_DEFS.water, MATERIAL_DEFS.hardware],
		prodMats: [MATERIAL_DEFS.realEstate],
		factors: [
			{ material: MATERIAL_DEFS.robots, factor: 0.6},
			{ material: MATERIAL_DEFS.aiCores, factor: 0.6}
		]
	},
	robotics: {
		industryName: "Robotics", divisionName: "Ro", owned: false, maxProducts: 0, phase: 0,
		officeStats: { minOfficeSize: 0, minStaff: 0, minWarehouseLevel: 0 },
		reqMats: [MATERIAL_DEFS.hardware, MATERIAL_DEFS.energy],
		prodMats: [MATERIAL_DEFS.robots],
		factors: [
			{ material: MATERIAL_DEFS.aiCores, factor: 0.36}, { material: MATERIAL_DEFS.realEstate, factor: 0.32}
		]
	},
	software: {
		industryName: "Software", divisionName: "So", owned: false, maxProducts: 0, phase: 0,
		officeStats: { minOfficeSize: 0, minStaff: 0, minWarehouseLevel: 0 },
		reqMats: [MATERIAL_DEFS.hardware, MATERIAL_DEFS.energy],
		prodMats: [MATERIAL_DEFS.aiCores],
		factors: [
			{ material: MATERIAL_DEFS.robots, factor: 0.05},
			{ material: MATERIAL_DEFS.realEstate, factor: 0.15}
		]
	},
	tobacco: {
		industryName: "Tobacco", divisionName: "To", owned: false, maxProducts: 0, phase: 0,
		officeStats: { minOfficeSize: 0, minStaff: 0, minWarehouseLevel: 0 },
		reqMats: [MATERIAL_DEFS.plants, MATERIAL_DEFS.water],
		prodMats: [],
		factors: [
			{ material: MATERIAL_DEFS.hardware, factor: 0.15}, { material: MATERIAL_DEFS.robots, factor: 0.2},
			{ material: MATERIAL_DEFS.aiCores, factor: 0.15}, { material: MATERIAL_DEFS.realEstate, factor: 0.15}
		]
	},
	utilities: {
		industryName: "Utilities", divisionName: "Ut", owned: false, maxProducts: 0, phase: 0,
		officeStats: { minOfficeSize: 0, minStaff: 0, minWarehouseLevel: 0 },
		reqMats: [MATERIAL_DEFS.hardware, MATERIAL_DEFS.metal],
		prodMats: [MATERIAL_DEFS.water],
		factors: [
			{ material: MATERIAL_DEFS.robots, factor: 0.4},
			{ material: MATERIAL_DEFS.aiCores, factor: 0.4}, { material: MATERIAL_DEFS.realEstate, factor: 0.5}
		]
	}
};
//Start with agriculture then tobacco as per the BN3 starting strat, then just buy in order of cost
export const INDUSTRIES = [
	INDUSTRY_DEFS.agriculture,
	INDUSTRY_DEFS.software,
	INDUSTRY_DEFS.chemical,
	INDUSTRY_DEFS.tobacco,
	INDUSTRY_DEFS.food,
	INDUSTRY_DEFS.fishing,
	INDUSTRY_DEFS.utilities,
	INDUSTRY_DEFS.energy,
	INDUSTRY_DEFS.pharma,
	INDUSTRY_DEFS.mining,
	INDUSTRY_DEFS.computer,
	INDUSTRY_DEFS.realEstate,
	INDUSTRY_DEFS.health,
	INDUSTRY_DEFS.robotics
];
export const RESEARCH_DEFS = {
	rnd: { name: "Hi-Tech R&D Laboratory", product: false, rank: 1 },
	autoBrew: { name: "AutoBrew", product: false, rank: 999 },
	autoParty: { name: "AutoPartyManager", product: false, rank: 999 },
	autoDrugs: { name: "Automatic Drug Administration", product: false, rank: 7 },
	bulkPurchasing: { name: "Bulk Purchasing", product: false, rank: 10 },
	cph4: { name: "CPH4 Injections", product: false, rank: 8 },
	drones: { name: "Drones", product: false, rank: 999 },
	dronesAssembly: { name: "Drones - Assembly", product: false, rank: 999 },
	dronesTransport: { name: "Drones - Transport", product: false, rank: 999 },
	goJuice: { name: "Go-Juice", product: false, rank: 9 },
	hrRecruitment: { name: "HRBuddy-Recruitment", product: false, rank: 999 },
	hrTraining: { name: "HRBuddy-Training", product: false, rank: 999 },
	joywire: { name: "JoyWire", product: false, rank: 6 },
	marketta1: { name: "Market-TA.I", product: false, rank: 2 },
	marketta2: { name: "Market-TA.II", product: false, rank: 3 },
	overclock: { name: "Overclock", product: false, rank: 4 },
	scAssemblers: { name: "Self-Correcting Assemblers", product: false, rank: 999 },
	stimu: { name: "Sti.mu", product: false, rank: 5 },
	upgradeFulcrum: { name: "uPgrade: Fulcrum", product: true, rank: 11 },
	upgradeCapacity1: { name: "uPgrade: Capacity.I", product: true, rank: 12 },
	upgradeCapacity2: { name: "uPgrade: Capacity.II", product: true, rank: 13 },
	upgradeDashboard: { name: "uPgrade: Dashboard", product: true, rank: 14 }
};
export const RESEARCH = [
	RESEARCH_DEFS.rnd,
	RESEARCH_DEFS.autoBrew,
	RESEARCH_DEFS.autoParty,
	RESEARCH_DEFS.autoDrugs,
	RESEARCH_DEFS.bulkPurchasing,
	RESEARCH_DEFS.cph4,
	RESEARCH_DEFS.drones,
	RESEARCH_DEFS.dronesAssembly,
	RESEARCH_DEFS.dronesTransport,
	RESEARCH_DEFS.goJuice,
	RESEARCH_DEFS.hrRecruitment,
	RESEARCH_DEFS.hrTraining,
	RESEARCH_DEFS.joywire,
	RESEARCH_DEFS.marketta1,
	RESEARCH_DEFS.marketta2,
	RESEARCH_DEFS.overclock,
	RESEARCH_DEFS.scAssemblers,
	RESEARCH_DEFS.stimu,
	RESEARCH_DEFS.upgradeFulcrum,
	RESEARCH_DEFS.upgradeCapacity1,
	RESEARCH_DEFS.upgradeCapacity2,
	RESEARCH_DEFS.upgradeDashboard
];

export const DIVIDEND_FILE="dividends.txt";
/** @param {NS} ns */
export async function getDividendInfo(ns){
	let config = JSON.parse(ns.read(DIVIDEND_FILE));
	//ns.print(config);
	return config;
}
