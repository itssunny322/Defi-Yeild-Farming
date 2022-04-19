// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../node_modules/@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

contract Weth is ERC20, Ownable {
    /* Safe guarding my contract from integer
    overflow and underflow vulnerabilities.
    */
    using SafeMath for uint256;

    /* to check if destination address is 
    valid and not of this contract
    */
    modifier validDestination(address to) {
        require(to != address(0x0), "Not a valid address");
        require(to != address(this), "Not a valid address");
        _;
    }

    /**
     * @dev Constructor, which is a function that executes
     * once (on deployment) send the total supply to
     * the owner of the contract
     */
    constructor(uint256 supply) ERC20("Wrapped Ethereum", "WETH") {
        uint256 amount = supply.mul(10e18);
        _mint(msg.sender, amount);
    }

    /**
     * @dev overriding transfer function to add validDestination modifier
     */
    function transfer(address to, uint256 value)
        public
        override
        validDestination(to)
        returns (bool success)
    {
        return super.transfer(to, value);
    }

    /**
     * @dev overriding transferFrom function to add validDestination modifier
     */
    function transferFrom(
        address from,
        address to,
        uint256 value
    ) public override validDestination(to) returns (bool success) {
        return super.transferFrom(from, to, value);
    }

    /**
     * @notice user get rak token
     */
    function getToken(address to, uint256 amount) public returns (uint256) {
        uint256 val = amount.mul(10e18);
        transfer(to, val);
        return balanceOf(msg.sender);
    }
}
