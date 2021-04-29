const assert = require('assert');
const ganache = require('ganache-cli');
const Web3 = require('web3');
const web3 = new Web3(ganache.provider());

const compiledFactory = require('../ethereum/build/CampaignFactory.json');
const compiledFactoryInterface = compiledFactory.abi;
const compiledFactoryBytecode = compiledFactory.evm.bytecode.object;

const compiledCampaign = require('../ethereum/build/Campaign.json');
const compiledCampaignInterface = compiledCampaign.abi;

let accounts;
let factory;
let campaignAddress;
let campaign;
beforeEach(async () => {
  accounts = await web3.eth.getAccounts();
  factory = await new web3.eth.Contract(compiledFactoryInterface)
    .deploy({ data: compiledFactoryBytecode })
    .send({ from: accounts[0], gas: '1500000' });

  await factory.methods
    .createCampaign('100')
    .send({ from: accounts[0], gas: '1000000' });

  const addresses = await factory.methods.getDeployedCampaigns().call();
  campaignAddress = addresses[0];
  campaign = await new web3.eth.Contract(
    compiledCampaignInterface,
    campaignAddress
  );
});

describe('Campaigns', () => {
  it('deploys a factory and a campaign', () => {
    assert.ok(factory.options.address);
    assert.ok(campaign.options.address);
  });

  it('marks caller as the campaign manager', async () => {
    const manager = await campaign.methods.manager().call();
    assert.strictEqual(accounts[0], manager);
  });

  it('allows people to contribute money and marks them as approvers', async () => {
    await campaign.methods.contribute().send({
      value: '200',
      from: accounts[1],
    });
    const isContributor = await campaign.methods.approvers(accounts[1]).call();
    assert(isContributor);
  });

  it('requires a minimum contribution', async () => {
    let isNoErrorThrown;
    try {
      await campaign.methods.contribute().send({
        value: '90',
        from: accounts[1],
      });
      isNoErrorThrown = true;
    } catch (e) {
      assert(e);
    }
    if (isNoErrorThrown) {
      assert.fail();
    }
  });

  it('allows a manager to make a payment request', async () => {
    await campaign.methods
      .createRequest('buy batteries', '50', accounts[1])
      .send({
        from: accounts[0],
        gas: '1000000',
      });
    const request = await campaign.methods.requests(0).call();
    assert.strictEqual('buy batteries', request.description);

    const numRequests = await campaign.methods.numRequests().call();
    assert.strictEqual('1', numRequests);
  });

  it('processes requests', async () => {
    // contribute 10 ether to campaign
    await campaign.methods.contribute().send({
      value: web3.utils.toWei('10', 'ether'),
      from: accounts[0],
    });

    // out of those 10 ether, create request for sending 5 ether to accounts[1]
    await campaign.methods
      .createRequest(
        'buy batteries',
        web3.utils.toWei('5', 'ether'),
        accounts[1]
      )
      .send({ from: accounts[0], gas: '1000000' });

    await campaign.methods.approveRequest(0).send({
      from: accounts[0],
      gas: '1000000',
    });

    await campaign.methods.finalizeRequest(0).send({
      from: accounts[0],
      gas: '1000000',
    });

    let balance = await web3.eth.getBalance(accounts[1]);
    balance = web3.utils.fromWei(balance, 'ether');
    balance = parseFloat(balance);
    console.log(balance);
    assert(balance > 104);
  });
});
