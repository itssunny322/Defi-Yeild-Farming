// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.0;

import "../node_modules/@openzeppelin/contracts/access/Ownable.sol";

import "./GovernanceToken.sol";
import "./NewPool.sol";

contract Governor is Ownable {
    //Governance token address
    address public governanceToken;

    //liquidity pool address
    address payable public pool;

    //mapping from user address to its vote status
    mapping(uint256 => mapping(address => bool)) public voters;

    /**
     * @notice it takes governance token parameter and assigns to the governanceToken
     */
    constructor(address governanceTokenAddress, address poolContract) {
        governanceToken = governanceTokenAddress;
        pool = payable(poolContract);
    }

    /**
     * @notice this enum stores the status of proposal
     */
    enum Status {
        Discussion,
        Approved,
        Discarded,
        Executing,
        Executed
    }

    /**
     * @notice Struture of proposal
     */
    struct Proposal {
        uint256 id;
        string topic;
        address tokenAddress;
        uint256 voteInFavor;
        uint256 voteAgainst;
        Status status;
        uint256 voteStart;
        uint256 voteEnd;
        uint256 iRate;
    }

    /**
     * @notice this variable stores the number of proposal
     */
    uint256 public proposalCount;

    /**
     * @notice mapping from proposalCount to proposal
     */
    mapping(uint256 => Proposal) public proposals;

    /**
     * @notice this checks if the user has sufficient governance token
     */
    modifier proposer() {
        require(
            ERC20(governanceToken).balanceOf(msg.sender) >= 100,
            "low governance token balance"
        );
        _;
    }

    /**
     * @notice this checks if the user has sufficient governance token
     */
    modifier voter() {
        require(
            ERC20(governanceToken).balanceOf(msg.sender) >= 10,
            "low token balance to vote"
        );
        _;
    }

    /**
     * @notice This function is for adding a new proposal
     * @param topic topic of the proposal
     * @param tokenAddress addres of the new token tobe added
     * @param iRate interest rate if needed to be changed
     * @return success true if success
     */
    function addProposal(
        string memory topic,
        address tokenAddress,
        uint256 iRate
    ) public proposer returns (bool success) {
        proposalCount += 1;
        uint256 voteEnd = block.number + 3;
        Proposal memory pro = Proposal(
            proposalCount,
            topic,
            tokenAddress,
            0,
            0,
            Status.Discussion,
            block.number,
            voteEnd,
            iRate
        );
        proposals[proposalCount] = pro;
        return
            ERC20(governanceToken).transferFrom(msg.sender, address(this), 100);
    }

    /**
     * @notice voting
     * @param id id of proposal
     * @param symbol 1 if in favor else 0
     * @return success true if success
     */
    function vote(uint256 id, uint256 symbol)
        public
        voter
        returns (bool success)
    {
        require(block.number < proposals[id].voteEnd, "Oops! voting ended");
        require(voters[id][msg.sender] == false, "already voted");
        voters[id][msg.sender] = true;
        if (symbol == 1) {
            proposals[id].voteInFavor += 1;
        } else {
            proposals[id].voteAgainst += 1;
        }
        return
            ERC20(governanceToken).transferFrom(msg.sender, address(this), 10);
    }

    /**
     * @notice restlt of voting
     * @param id proposal id
     * @return proposal
     */
    function result(uint256 id) public returns (Proposal memory) {
        require(block.number > proposals[id].voteEnd, "voting ongoing");
        uint256 favor = proposals[id].voteInFavor;
        uint256 against = proposals[id].voteAgainst;
        if (favor > against) {
            proposals[id].status = Status.Approved;
        } else {
            proposals[id].status = Status.Discarded;
        }
        return proposals[id];
    }

    /**
     * @notice implement the result
     * @param proposalId id of proposal
     * @return success true if success
     */
    function implementProposal(uint256 proposalId)
        public
        onlyOwner
        returns (bool success)
    {
        Status stat = proposals[proposalId].status;
        string memory dep = "deposit interest";
        string memory borrow = "borrow interest";
        address tokenAddr = proposals[proposalId].tokenAddress;
        if (stat == Status.Approved) {
            if (
                keccak256(abi.encodePacked(proposals[proposalId].topic)) ==
                keccak256(abi.encodePacked(dep))
            ) {
                uint256 val = uint256(proposals[proposalId].iRate);
                NewPool(pool).setDepositinterestFactor(tokenAddr, val);
                return true;
            } else if (
                keccak256(abi.encodePacked(proposals[proposalId].topic)) ==
                keccak256(abi.encodePacked(borrow))
            ) {
                uint256 val = uint256(proposals[proposalId].iRate);
                NewPool(pool).setBorrowinterestFactor(tokenAddr, val);
                return true;
            } else {
                NewPool(pool).registerToken(tokenAddr);
                return true;
            }
        }
    }
}
