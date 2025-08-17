// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

contract HelloSepolia {
    string public message;

    constructor(string memory _message) {
        message = _message;
    }

    function setMessage(string memory _message) external {
        message = _message;
    }
}
