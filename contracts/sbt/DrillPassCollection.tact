import "./DrillPassItem";

message SetPrice {
    queryId: Int as uint64;
    newPrice: Int as coins;
}

message AdminMint {
    queryId: Int as uint64;
    to: Address;
    content: Cell;
}

message BuyPass {
    queryId: Int as uint64;
    content: Cell;
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

/// Soulbound mining pass collection.
/// Transfer is disabled on the item contract.
/// Admin can change mint price at any time; price is publicly readable.
contract DrillPassCollection {
    admin: Address;
    nextItemIndex: Int as uint64;
    mintPrice: Int as coins;
    collectionContent: Cell;
    minted: map<Address, Int>;

    init(admin: Address, mintPrice: Int, collectionContent: Cell) {
        self.admin = admin;
        self.nextItemIndex = 0;
        self.mintPrice = mintPrice;
        self.collectionContent = collectionContent;
    }

    receive() {}

    receive(msg: SetPrice) {
        require(sender() == self.admin, "Only admin can set price");
        require(msg.newPrice >= 0, "Price cannot be negative");
        self.mintPrice = msg.newPrice;
    }

    receive(msg: AdminMint) {
        require(sender() == self.admin, "Only admin can admin-mint");
        self.mintPass(msg.to, msg.content, msg.queryId);
    }

    receive(msg: BuyPass) {
        let ctx: Context = context();
        require(ctx.value >= self.mintPrice, "Insufficient TON for current mint price");
        self.mintPass(sender(), msg.content, msg.queryId);
    }

    receive(msg: ChangeCollectionAdmin) {
        require(sender() == self.admin, "Only admin can change admin");
        self.admin = msg.newAdmin;
    }

    receive(msg: WithdrawTon) {
        require(sender() == self.admin, "Only admin can withdraw TON");
        send(SendParameters{
            to: msg.to,
            value: msg.amount,
            bounce: false
        });
    }

    receive(msg: RevokePass) {
        require(sender() == self.admin, "Only admin can revoke");
        let init: StateInit = initOf DrillPassItem(myAddress(), msg.itemIndex);
        send(SendParameters{
            to: contractAddress(init),
            value: 0,
            mode: SendRemainingValue,
            body: Revoke{ queryId: msg.queryId }.toCell()
        });
    }

    fun mintPass(to: Address, content: Cell, queryId: Int) {
        let existing: Int? = self.minted.get(to);
        require(existing == null, "Wallet already owns a Drill Pass");

        let index: Int = self.nextItemIndex;
        self.minted.set(to, index);
        self.nextItemIndex = index + 1;

        let init: StateInit = initOf DrillPassItem(myAddress(), index);
        send(SendParameters{
            to: contractAddress(init),
            value: ton("0.05"),
            bounce: false,
            body: InitPass{
                queryId: queryId,
                owner: to,
                content: content,
                authority: self.admin
            }.toCell(),
            code: init.code,
            data: init.data
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

    get fun get_nft_address_by_index(index: Int): Address {
        let init: StateInit = initOf DrillPassItem(myAddress(), index);
        return contractAddress(init);
    }
}
