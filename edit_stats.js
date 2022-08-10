import { getDividendInfo } from './corpInfo.js'

//line 98 above karma
            //Show corp info
            if (3 in dictSourceFiles || 3 == bitNode) {
                /** @type {Corporation} */
                const corp = eval("ns.corporation");
                try {
                    let c = corp.getCorporation();
                    let config = await getDividendInfo(ns);
                    let funds = formatMoney(c.funds, 3, 2);
                    let profit = c.revenue - c.expenses;
                    let corpProfit = formatMoney(profit * config.profitMultiplier, 3, 2);
                    let dividendProfit = formatMoney(profit * config.dividendMultiplier, 3, 2);
                    addHud("Corp", `${dividendProfit}/sec`, `Dividends are ${config.dividendPercent}%.\n` +
                    ` ${c.name} total funds are ${funds}.\n` +
                    ` ${c.name} profit after dividends is ${corpProfit}/sec.`);
                }
                catch (e) {
                }
            }
