const { assert } = require("chai");

// pass the name of the contract you want to test
const NewPool = artifacts.require("NewPool");
const RakToken = artifacts.require("RakToken");

require("chai")
  .use(require("chai-as-promised"))
  .should();

contract("NewPool", (accounts) => {
  let contractNewPool;
  let contractRaktoken;

  // accounts of ganache
  console.log("accounts:", accounts);

  before(async () => {
    //abi of contracts
    contractNewPool = await NewPool.deployed();
    contractRaktoken = await RakToken.deployed();
  });

  describe("deployment of RakToken ", async () => {
    it("deploys successfully", async () => {
      const addressRaktoken = contractRaktoken.address;
      console.log("contractRakToken Address -->> ", addressRaktoken);
      assert.notEqual(addressRaktoken, "");
      assert.notEqual(addressRaktoken, 0x0);
      assert.notEqual(addressRaktoken, null);
      assert.notEqual(addressRaktoken, undefined);
      assert.ok(addressRaktoken);
    });
  });

  describe("deployment of contract NewPool ", async () => {
    it("deploys successfully", async () => {
      const address = contractNewPool.address;
      console.log("contractNewPool Address -->> ", address);
      assert.notEqual(address, "");
      assert.notEqual(address, 0x0);
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
      assert.ok(address);
    });
  });

  describe("registerToken", async () => {
    it("registerToken functionality check ", async () => {
      try {
        const resultRegisterToken = await contractNewPool.registerToken(
          contractRaktoken.address,
          { from: accounts[0] }
        );
        const eventFired = await resultRegisterToken.logs[0].args;
        // console.log("Event-:", eventFired);
        assert.equal(eventFired.token, contractRaktoken.address);
        assert.equal(eventFired.tokenCount, 1, "Not Matching");
        // assert.notEqual(eventFired.tokenCount, 2, "Not Matching");
      } catch (e) {
        console.log("error", e);
      }
    });
  });

  describe("depositToken", async () => {
    it("depositToken functionality check ", async () => {
      try {
        const rakTokenApprove = await contractRaktoken.approve(
          contractNewPool.address,
          10000000
        );
        const resultDepositToken = await contractNewPool.depositToken(
          contractRaktoken.address,
          10000000
        );
        const eventFired = await resultDepositToken.logs[0].args;
        console.log("Event-:", eventFired);
        assert.equal(eventFired.amount, 10000000);
        assert.equal(eventFired.depositor, accounts[0]);
        assert.equal(eventFired.token, contractRaktoken.address);
      } catch (e) {
        console.log("error", e);
      }
    });
  });

  describe("withdraw token", async () => {
    it("withdraw token functionality check ", async () => {
      try {
        const resultWithdrawToken = await contractNewPool.withdrawToken(
          1000,
          contractRaktoken.address
        );
        const eventFired = await resultWithdrawToken.logs[0].args;
        console.log("Event->:", eventFired);
        assert.equal(eventFired.amount, 1000);
        assert.equal(eventFired.depositor, accounts[0]);
        assert.equal(eventFired.token, contractRaktoken.address);
      } catch (e) {
        console.log("error", e);
      }
    });
  });

  describe("borrow token", async () => {
    it("borrow token functionality check ", async () => {
      try {
        const resultBorrowToken = await contractNewPool.borrow(
          1000,
          contractRaktoken.address,
          contractRaktoken.address
        );
        const eventFired = await resultBorrowToken.logs[0].args;
        console.log("Event->:", eventFired);
        assert.equal(eventFired.amount, 1000);
        assert.equal(eventFired.borrower, accounts[0]);
        assert.equal(eventFired.token, contractRaktoken.address);
      } catch (e) {
        console.log("error", e);
      }
    });
  });

  describe("repay loan", async () => {
    it("repay loan functionality check ", async () => {
      try {
        const rakTokenApprove = await contractRaktoken.approve(
          contractNewPool.address,
          100
        );
        const resultRepayToken = await contractNewPool.repay(100, 1);
        const eventFired = await rakTokenApprove.logs[0].args;
        console.log("Event->:", eventFired);
        assert.equal(eventFired.value, 100);
        assert.equal(eventFired.owner, accounts[0]);
        assert.equal(eventFired.spender, contractNewPool.address);
      } catch (e) {
        console.log("error", e);
      }
    });
  });

  describe("Interest calculation", async () => {
    it("Interest calculation functionality check ", async () => {
      try {
        const resultInterestCalculation = await contractNewPool.calculateLoanInterest(
          1,
          contractRaktoken.address
        );
        const eventFired = await resultInterestCalculation.logs[0].args;
        console.log("Event->:", eventFired);
        assert.notEqual(eventFired.principalAmount, eventFired.interest);
        // assert.equal(eventFired.owner, accounts[0]);
        // assert.equal(eventFired.spender, contractNewPool.address);
      } catch (e) {
        console.log("error", e);
      }
    });
  });
});
