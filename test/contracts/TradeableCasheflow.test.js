'use strict';

const { web3tx, toWad } = require('@decentral.ee/web3-helpers');
const { expectRevert } = require('@openzeppelin/test-helpers');
const deployFramework = require('@superfluid-finance/ethereum-contracts/scripts/deploy-framework');
const deployTestToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-test-token');
const deploySuperToken = require('@superfluid-finance/ethereum-contracts/scripts/deploy-super-token');
const SuperfluidSDK = require('@superfluid-finance/js-sdk');
const traveler = require('ganache-time-traveler');
const TradeableCashflow = artifacts.require('TradeableCashflow');
const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers').constants;

contract('TradeableCashflow', accounts => {
	const errorHandler = err => {
		if (err) throw err;
	};

	const [admin, owner, nftOwner] = accounts;

	let sf;
	let dai;
	let daix;
	let app;
	let viewer;

	const assertBNEqual = (actualBN, expectedBN, context) => {
		assert.strictEqual(actualBN.toString(), expectedBN.toString(), context);
	};

	const assertBNGreaterThan = (aBN, bBN) => {
		assert.ok(aBN.gt(bBN), `${aBN.toString()} is not greater than ${bBN.toString()}`);
	};

	async function timeTravelOnce(time) {
		const _time = time || TEST_TRAVEL_TIME;
		const block1 = await web3.eth.getBlock('latest');
		console.log('current block time', block1.timestamp);
		console.log(`time traveler going to the future +${_time}...`);
		await traveler.advanceTimeAndBlock(_time);
		const block2 = await web3.eth.getBlock('latest');
		console.log('new block time', block2.timestamp);
	}

	async function dropStream(sender, receiver, by) {
		await sf.cfa.deleteFlow({
			superToken: daix.address,
			sender: sender,
			receiver: receiver,
			by: by,
		});

		return await sf.cfa.getFlow({
			superToken: daix.address,
			sender: sender,
			receiver: receiver,
		});
	}

	async function getFlowFromUser(account) {
		return await getFlow(account, app.address);
	}

	async function getFlow(sender, receiver) {
		return await sf.cfa.getFlow({
			superToken: daix.address,
			sender: sender,
			receiver: receiver,
		});
	}

	before(async function() {
		await deployFramework(errorHandler, { web3: web3, from: admin });
		await deployTestToken(errorHandler, [':', 'fDAI'], {
			web3: web3,
			from: admin,
		});
		await deploySuperToken(errorHandler, [':', 'fDAI'], {
			web3: web3,
			from: admin,
		});

		sf = new SuperfluidSDK.Framework({
			web3: web3,
			tokens: ['fDAI'],
			version: 'test',
		});

		await sf.initialize();
		daix = sf.tokens.fDAIx;
		if (!dai) {
			const daiAddress = await sf.tokens.fDAI.address;
			dai = await sf.contracts.TestToken.at(daiAddress);

			const mintAmount = toWad(10000000).toString();
			const approveAmount = toWad(1000).toString();

			await web3tx(dai.mint, `Mint ${mintAmount} dai`)(admin, mintAmount, {
				from: admin,
			});
			await web3tx(dai.approve, `Approve ${approveAmount} daix`)(daix.address, approveAmount, {
				from: admin,
			});

			await web3tx(daix.upgrade, `Upgrade ${approveAmount} DAIx`)(approveAmount, {
				from: admin,
			});
		}

		app = await web3tx(TradeableCashflow.new, 'Deploy TradeableCashflow')(
			owner,
			sf.host.address,
			sf.agreements.cfa.address,
			daix.address,
			'Future Flow',
			'FTR'
		);
	});

	afterEach(async function() {
		assert.ok(!(await sf.host.isAppJailed(app.address)), 'App is Jailed');
	});

	describe('Constructor', () => {
		it('fails when owner is 0', async () => {
			await expectRevert(
				TradeableCashflow.new(
					ZERO_ADDRESS,
					sf.host.address,
					sf.agreements.cfa.address,
					daix.address,
					'Future Flow',
					'FTR'
				),
				'receiver/owner is zero address'
			);
		});
	});

	describe('When opening a stream to the contract', () => {
		// const flowRate = (1e18).toString();
		const flowRate = toWad(0.02);

		before('create stream', async () => {
			const userData = await web3.eth.abi.encodeParameters(['address'], [owner]);
			console.log((await daix.balanceOf(admin)).toString());
			const tx = await sf.cfa.createFlow({
				superToken: daix.address,
				sender: admin,
				receiver: app.address,
				flowRate: flowRate,
				userData: userData,
			});
			console.log(tx);
		});

		it('should open the stream succesfully', async () => {
			const flow = await sf.cfa.getFlow({
				superToken: daix.address,
				sender: admin,
				receiver: app.address,
			});
			console.log(flow);
			assert.equal(flow.flowRate, flowRate);
		});

		it('should open the stream succesfully', async () => {
			const flow = await sf.cfa.getFlow({
				superToken: daix.address,
				sender: app.address,
				receiver: owner,
			});
			console.log(flow);
			assert.equal(flow.flowRate, flowRate);
		});

		describe('When we fast forward into the future', () => {
			before('timeTravel', async () => {
				await timeTravelOnce(3600);
			});

			it('should have updated the balance of the owner and not the one of the contract', async () => {
				assertBNEqual(await daix.balanceOf(app.address), '0');
				console.log((await daix.balanceOf(owner)).toString());
				assertBNGreaterThan(await daix.balanceOf(owner), '0');
			});

			describe('An NFT is minted and given to the buyer', () => {
				const nftFlowRate = toWad(0.01);
				before('mint NFT', async () => {
					await app.createNFT(nftFlowRate, '3600', {
						from: owner,
					});
					await app.transferFrom(owner, nftOwner, '0', {
						from: owner,
					});
				});

				describe('When we fast forward into the future', () => {
					before('timeTravel', async () => {
						await timeTravelOnce(3600);
					});

					it('should increase the nftOwner balance', async () => {
						assertBNGreaterThan(await daix.balanceOf(nftOwner), '0');
					});
				});
			});
		});
	});
});
