import "./messages";
import "./drill_pass_item";

/// SBT collection. 1 pass per wallet. Admin bisa ganti harga kapan saja.
contract DrillPassCollection {
    admin: Address;
    nextIndex: Int as uint64;
    mintPrice: Int as coins;
    minted: map<Address, Int>;

    init(admin: Address, mintPrice: Int) {
        self.admin = admin;
        self.nextIndex = 0;
        self.mintPrice = mintPrice;
    }

    receive() {}

    receive(msg: SetPrice) {
        require(sender() == self.admin, "Only admin");
        require(msg.newPrice >= 0, "Price");
        self.mintPrice = msg.newPrice;
    }

    receive(msg: AdminMintPass) {
        require(sender() == self.admin, "Only admin");
        self.issue(msg.to, msg.queryId);
    }

    receive(msg: BuyPass) {
        require(context().value >= self.mintPrice, "Need more TON");
        self.issue(sender(), msg.queryId);
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
            bounce: false
        });
    }

    fun issue(to: Address, queryId: Int) {
        require(self.minted.get(to) == null, "Already has pass");
        let index: Int = self.nextIndex;
        self.minted.set(to, index);
        self.nextIndex = index + 1;

        let init = initOf DrillPassItem(myAddress(), index);
        send(SendParameters{
            to: contractAddress(init),
            value: ton("0.05"),
            bounce: false,
            body: InitPass{
                queryId: queryId,
                owner: to,
                authority: self.admin
            }.toCell(),
            code: init.code,
            data: init.data
        });
    }

    get fun admin(): Address { return self.admin; }
    get fun mintPrice(): Int { return self.mintPrice; }
    get fun nextIndex(): Int { return self.nextIndex; }
    get fun passOf(owner: Address): Int? { return self.minted.get(owner); }
    get fun get_nft_address_by_index(index: Int): Address {
        return contractAddress(initOf DrillPassItem(myAddress(), index));
    }
}
