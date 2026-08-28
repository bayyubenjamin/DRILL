message(0xf8a7ea5) JettonTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    destination: Address;
    responseDestination: Address;
    customPayload: Cell?;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

message(0x178d4519) JettonInternalTransfer {
    queryId: Int as uint64;
    amount: Int as coins;
    from: Address;
    responseDestination: Address;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

message(0x7362d09c) JettonNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forwardPayload: Slice as remaining;
}

message(0xd53276db) JettonExcesses {
    queryId: Int as uint64;
}

message(0x595f07bc) JettonBurn {
    queryId: Int as uint64;
    amount: Int as coins;
    responseDestination: Address;
    customPayload: Cell?;
}

message(0x7bdd97de) JettonBurnNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    owner: Address;
    responseDestination: Address;
}

message Mint {
    queryId: Int as uint64;
    to: Address;
    amount: Int as coins;
}

message ChangeAdmin {
    queryId: Int as uint64;
    newAdmin: Address;
}

message CloseMinting {
    queryId: Int as uint64;
}

message SetPrice {
    queryId: Int as uint64;
    newPrice: Int as coins;
}

message AdminMintPass {
    queryId: Int as uint64;
    to: Address;
}

message BuyPass {
    queryId: Int as uint64;
}

message WithdrawTon {
    queryId: Int as uint64;
    to: Address;
    amount: Int as coins;
}

message ChangeCollectionAdmin {
    queryId: Int as uint64;
    newAdmin: Address;
}

message InitPass {
    queryId: Int as uint64;
    owner: Address;
    authority: Address;
}

message RevokePass {
    queryId: Int as uint64;
}
