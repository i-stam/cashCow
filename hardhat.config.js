'use strict';

const path = require('path');

require('@nomiclabs/hardhat-truffle5');

const GAS_PRICE = 20e9; // 20 GWEI

module.exports = {
	GAS_PRICE,
	solidity: {
		version: '0.7.1',
		settings: {
			optimizer: {
				enabled: true,
				runs: 1000000000,
			},
		},
	},
	paths: {
		sources: './contracts',
		tests: './test/',
	},
	defaultNetwork: 'hardhat',
	networks: {
		hardhat: {
			gas: 12e6,
			blockGasLimit: 12e6,
			allowUnlimitedContractSize: true,
			gasPrice: 10e9,
		},
		localhost: {
			gas: 12e6,
			blockGasLimit: 12e6,
			url: 'http://localhost:8545',
		},
	},
};
