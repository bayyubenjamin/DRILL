import "./messages";

/// Soulbound. Transfer sengaja tidak ada.
contract DrillPassItem {
    collection: Address;
    index: Int as uint64;
    owner: Address;
    authority: Address;
    revokedAt: Int as uint64;
    ready: Bool;

    init(collection: Address, index: Int) {
        self.collection = collection;
        self.index = index;
        self.owner = collection;
        self.authority = collection;
        self.revokedAt = 0;
        self.ready = false;
    }

    receive(msg: InitPass) {
        require(sender() == self.collection, "Only collection");
        require(!self.ready, "Already inited");
        self.owner = msg.owner;
        self.authority = msg.authority;
        self.ready = true;
    }

    receive(msg: RevokePass) {
        require(sender() == self.collection || sender() == self.authority, "No access");
        require(self.revokedAt == 0, "Revoked");
        self.revokedAt = now();
    }

    get fun owner(): Address { return self.owner; }
    get fun collection(): Address { return self.collection; }
    get fun index(): Int { return self.index; }
    get fun isActive(): Bool { return self.ready && self.revokedAt == 0; }
}
