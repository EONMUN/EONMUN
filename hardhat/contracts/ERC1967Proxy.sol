// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

// Wrapper contract to make ERC1967Proxy deployable by Hardhat
contract ERC1967ProxyWrapper is ERC1967Proxy {
    constructor(address implementation, bytes memory data) ERC1967Proxy(implementation, data) {}
} 