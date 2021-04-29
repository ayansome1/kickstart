const path = require('path');
const solc = require('solc');
const fs = require('fs-extra');
const buildPath = path.resolve(__dirname, 'build');
fs.removeSync(buildPath);
const campaignPath = path.resolve(__dirname, 'contracts', 'Campaign.sol');
const source = fs.readFileSync(campaignPath, 'utf8');

let input = {
  language: 'Solidity',
  sources: {
    'Campaign.sol': {
      content: source,
    },
  },
  settings: {
    outputSelection: {
      '*': {
        '*': ['*'],
      },
    },
  },
};

let output = JSON.parse(solc.compile(JSON.stringify(input)));
const contracts = output.contracts['Campaign.sol'];
fs.ensureDirSync(buildPath);
for (let contractName in contracts) {
  const contract = contracts[contractName];
  fs.writeFileSync(
    path.resolve(buildPath, contractName + '.json'),
    JSON.stringify(contract, null, 2),
    'utf8'
  );
}
