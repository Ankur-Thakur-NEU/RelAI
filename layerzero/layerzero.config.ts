import { EndpointId } from "@layerzerolabs/lz-definitions";
const hedera_testnetContract = {
    eid: EndpointId.HEDERA_V2_TESTNET,
    contractName: "MyOApp"
};
const sepolia_testnetContract = {
    eid: EndpointId.SEPOLIA_V2_TESTNET,
    contractName: "MyOApp"
};
export default { contracts: [{ contract: hedera_testnetContract }, { contract: sepolia_testnetContract }], connections: [{ from: hedera_testnetContract, to: sepolia_testnetContract, config: { sendLibrary: "0x1707575F7cEcdC0Ad53fde9ba9bda3Ed5d4440f4", receiveLibraryConfig: { receiveLibrary: "0xc0c34919A04d69415EF2637A3Db5D637a7126cd0", gracePeriod: 0 }, sendConfig: { executorConfig: { maxMessageSize: 10000, executor: "0xe514D331c54d7339108045bF4794F8d71cad110e" }, ulnConfig: { confirmations: 1, requiredDVNs: ["0xEc7Ee1f9e9060e08dF969Dc08EE72674AfD5E14D"], optionalDVNs: [], optionalDVNThreshold: 0 } }, receiveConfig: { ulnConfig: { confirmations: 2, requiredDVNs: ["0xEc7Ee1f9e9060e08dF969Dc08EE72674AfD5E14D"], optionalDVNs: [], optionalDVNThreshold: 0 } } } }, { from: sepolia_testnetContract, to: hedera_testnetContract, config: { sendLibrary: "0xcc1ae8Cf5D3904Cef3360A9532B477529b177cCE", receiveLibraryConfig: { receiveLibrary: "0xdAf00F5eE2158dD58E0d3857851c432E34A3A851", gracePeriod: 0 }, sendConfig: { executorConfig: { maxMessageSize: 10000, executor: "0x718B92b5CB0a5552039B593faF724D182A881eDA" }, ulnConfig: { confirmations: 2, requiredDVNs: ["0x8eebf8b423B73bFCa51a1Db4B7354AA0bFCA9193"], optionalDVNs: [], optionalDVNThreshold: 0 } }, receiveConfig: { ulnConfig: { confirmations: 1, requiredDVNs: ["0x8eebf8b423B73bFCa51a1Db4B7354AA0bFCA9193"], optionalDVNs: [], optionalDVNThreshold: 0 } } } }] };
