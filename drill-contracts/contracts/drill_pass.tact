struct CollectionData {
    nextItemIndex: Int;
    collectionContent: Cell;
    ownerAddress: Address;
}

struct NftData {
    init: Bool;
    index: Int;
    collectionAddress: Address;
    ownerAddress: Address;
    individualContent: Cell;
}

message(0x3a9dfd19) SetPrice {
    queryId: Int as uint64;
    newPrice: Int as coins;
}

message(0x41444d4e) AdminMint {
    queryId: Int as uint64;
    to: Address;
}

message(0x42555950) BuyPass {
    queryId: Int as uint64;
}

message ChangeCollectionAdmin {
    queryId: Int as uint64;
    newAdmin: Address;
}

message WithdrawTon {
    queryId: Int as uint64;
    to: Address;
    amount: Int as coins;
}

message RevokePass {
    queryId: Int as uint64;
    itemIndex: Int as uint64;
}

message InitPass {
    queryId: Int as uint64;
    owner: Address;
    authority: Address;
    content: Cell;
}

message Revoke {
    queryId: Int as uint64;
}

message TransferSbt {
    queryId: Int as uint64;
}

/// Soulbound item. Address depends only on collection + index so wallets can index it.
contract DrillPassItem(
    collection: Address,
    index: Int as uint64,
) {
    owner: Address = collection;
    authority: Address = collection;
    content: Cell = emptyCell();
    revokedAt: Int as uint64 = 0;
    initialized: Bool = false;

    receive(msg: InitPass) {
        require(sender() == self.collection, "Only collection");
        require(!self.initialized, "Already inited");
        self.owner = msg.owner;
        self.authority = msg.authority;
        self.content = msg.content;
        self.initialized = true;
    }

    receive(msg: TransferSbt) {
        require(false, "Soulbound: transfer disabled");
    }

    receive(msg: Revoke) {
        require(sender() == self.collection || sender() == self.authority, "Only authority");
        require(self.revokedAt == 0, "Already revoked");
        self.revokedAt = now();
    }

    get fun owner(): Address {
        return self.owner;
    }

    get fun isActive(): Bool {
        return self.initialized && self.revokedAt == 0;
    }

    get fun revokedAt(): Int {
        return self.revokedAt;
    }

    get fun get_nft_data(): NftData {
        return NftData{
            init: self.initialized,
            index: self.index,
            collectionAddress: self.collection,
            ownerAddress: self.owner,
            individualContent: self.content,
        };
    }
}

/// SBT collection. 1 pass per wallet. Indexer-friendly TEP-62 getters.
contract DrillPassCollection(
    admin: Address,
    nextItemIndex: Int as uint64,
    mintPrice: Int as coins,
    content: Cell,
    minted: map<Address, Int>,
) {
    receive() {}

    receive(msg: SetPrice) {
        require(sender() == self.admin, "Only admin can set price");
        require(msg.newPrice >= 0, "Invalid price");
        self.mintPrice = msg.newPrice;
    }

    receive(msg: AdminMint) {
        require(sender() == self.admin, "Only admin can admin-mint");
        self.mintPass(msg.to, msg.queryId);
    }

    receive(msg: BuyPass) {
        require(context().value >= self.mintPrice, "Insufficient TON");
        self.mintPass(sender(), msg.queryId);
    }

    receive(msg: ChangeCollectionAdmin) {
        require(sender() == self.admin, "Only admin");
        self.admin = msg.newAdmin;
    }

    receive(msg: WithdrawTon) {
        require(sender() == self.admin, "Only admin");
        send(SendParameters{
            to: msg.to,
            value: msg.amount,
            bounce: false,
        });
    }

    receive(msg: RevokePass) {
        require(sender() == self.admin, "Only admin");
        deploy(DeployParameters{
            value: 0,
            mode: SendRemainingValue,
            body: Revoke{ queryId: msg.queryId }.toCell(),
            init: initOf DrillPassItem(myAddress(), msg.itemIndex),
        });
    }

    fun mintPass(to: Address, queryId: Int) {
        require(self.minted.get(to) == null, "Wallet already has a pass");
        let index: Int = self.nextItemIndex;
        self.minted.set(to, index);
        self.nextItemIndex = index + 1;
        deploy(DeployParameters{
            value: ton("0.05"),
            bounce: false,
            body: InitPass{
                queryId: queryId,
                owner: to,
                authority: self.admin,
                content: self.content,
            }.toCell(),
            init: initOf DrillPassItem(myAddress(), index),
        });
    }

    get fun admin(): Address {
        return self.admin;
    }

    get fun mintPrice(): Int {
        return self.mintPrice;
    }

    get fun nextItemIndex(): Int {
        return self.nextItemIndex;
    }

    get fun passIndexOf(owner: Address): Int? {
        return self.minted.get(owner);
    }

    get fun get_collection_data(): CollectionData {
        return CollectionData{
            nextItemIndex: self.nextItemIndex,
            collectionContent: self.content,
            ownerAddress: self.admin,
        };
    }

    get fun get_nft_address_by_index(index: Int): Address {
        return contractAddress(initOf DrillPassItem(myAddress(), index));
    }

    get fun get_nft_content(index: Int, individualContent: Cell): Cell {
        return individualContent;
    }
}
