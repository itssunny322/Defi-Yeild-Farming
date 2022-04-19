// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";

import "./WrappedEthereum.sol";

contract WETH {
    /**
     * @notice Safe guarding contract from integer
     * overflow and underflow vulnerabilities.
     */
    using SafeMath for uint256;
    /**
     * @notice This variable stores the WETH token address
     */
    Weth public weth;

    constructor() {
        weth = new Weth(100000);
    }

    /**
     * @notice This functions runs when user sends eth directly to the contract
     */
    receive() external payable {
        depositEth();
    }

    /**
     * @notice deposit eth to the pool
     * @return success true if success
     */
    function depositEth() public payable returns (bool success) {
        uint256 val = msg.value;
        address user= msg.sender;
        weth.transfer(user, val);
        return success;
    }

    /**
     * @notice Withdraw deposited eth
     * @param amount amount to be withdrawn
     * @return success true if success
     */
    function withdrawEth(uint256 amount) public payable returns (bool success) {
        address user= msg.sender;
        uint256 bal = weth.balanceOf(user);
        require(amount <= bal, "Insufficient Balance");
        weth.transferFrom(user, address(this), amount);
        payable(msg.sender).transfer(amount);
        return true;
    }
}
