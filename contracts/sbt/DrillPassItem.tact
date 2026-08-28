message InitPass {
    queryId: Int as uint64;
    owner: Address;
    content: Cell;
    authority: Address;
}

message Revoke {
    queryId: Int as uint64;
}

message TransferSbt {
    queryId: Int as uint64;
    newOwner: Address;
    responseDestination: Address;
    customPayload: Cell?;
    forwardAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

/// Soulbound item. Owner is set once and never transferred.
contract DrillPassItem {
    collection: Address;
    index: Int as uint64;
    owner: Address;
    content: Cell;
    authority: Address;
    revokedAt: Int as uint64;
    initialized: Bool;

    init(collection: Address, index: Int) {
        self.collection = collection;
        self.index = index;
        self.owner = collection;
        self.content = emptyCell();
        self.authority = collection;
        self.revokedAt = 0;
        self.initialized = false;
    }

    receive(msg: InitPass) {
        require(sender() == self.collection, "Only collection can init");
        require(!self.initialized, "Already initialized");
        self.owner = msg.owner;
        self.content = msg.content;
        self.authority = msg.authority;
        self.initialized = true;
    }

    /// Explicitly rejected. This is an SBT, not a tradable NFT.
    receive(msg: TransferSbt) {
        require(false, "Drill Pass is soulbound and cannot be transferred");
    }

    receive(msg: Revoke) {
        require(sender() == self.collection || sender() == self.authority, "Only authority can revoke");
        require(self.revokedAt == 0, "Already revoked");
        self.revokedAt = now();
    }

    get fun get_nft_data(): Int {
        return self.index;
    }

    get fun owner(): Address {
        return self.owner;
    }

    get fun collection(): Address {
        return self.collection;
    }

    get fun revokedAt(): Int {
        return self.revokedAt;
    }

    get fun isActive(): Bool {
        return self.initialized && self.revokedAt == 0;
    }
}
