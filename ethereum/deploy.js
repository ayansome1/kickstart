const { seedPhrase } = require('./config');
const HDWalletProvider = require('@truffle/hdwallet-provider');
const Web3 = require('web3');
const compiledFactory = require('./build/CampaignFactory.json');
const compiledFactoryInterface = compiledFactory.abi;
const compiledFactoryBytecode = compiledFactory.evm.bytecode.object;

const provider = new HDWalletProvider({
  mnemonic: {
    phrase: seedPhrase,
  },
  providerOrUrl:
    'https://rinkeby.infura.io/v3/bbf22df30c904062a4fdee2adbb6b333',
});

const web3 = new Web3(provider);

const deploy = async () => {
  const accounts = await web3.eth.getAccounts();
  console.log('Attempting to deploy from account', accounts[0]);

  try {
    const result = await new web3.eth.Contract(compiledFactoryInterface)
      .deploy({ data: compiledFactoryBytecode })
      .send({ from: accounts[0], gas: 1600000 });
    console.log('Contract deployed to: ', result.options.address); // Contract deployed to:  0xf53EC2612d49Fea0CFCA80950458d59bC2195ec7
  } catch (e) {
    console.log('error', e);
  }
};

deploy();
