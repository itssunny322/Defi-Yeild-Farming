// const RakTokenFactory = artifacts.require("./contracts/RakTokenFactory.sol");
// const Pool = artifacts.require("./contracts/Pool.sol");
const RakToken = artifacts.require("RakToken");
const NewPool = artifacts.require("NewPool");

module.exports = async function (deployer,networks,accounts) {
  await deployer.deploy(RakToken,1000000000000000);
  await deployer.deploy(NewPool);
};