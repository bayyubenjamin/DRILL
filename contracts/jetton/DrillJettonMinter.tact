import "./DrillJettonWallet";

/// $DRILL Jetton master.
/// Hard cap 10,000,000,000 tokens with 9 decimals.
/// Only admin may mint. Admin cannot move tokens out of user wallets.
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

message ProvideWalletAddress {
    queryId: Int as uint64;
    ownerAddress: Address;
    includeAddress: Bool;
}

message TakeWalletAddress {
    queryId: Int as uint64;
    walletAddress: Address;
    ownerAddress: Address?;
}

contract DrillJettonMinter {
    /// 10,000,000,000 * 1e9 smallest units. Immutable.
    const MAX_SUPPLY: Int = 10000000000000000000;

    totalSupply: Int as coins;
    admin: Address;
    mintable: Bool;
    content: Cell;

    init(admin: Address, content: Cell) {
        self.totalSupply = 0;
        self.admin = admin;
        self.mintable = true;
        self.content = content;
    }

    receive() {}

    /// Admin mints to treasury or a liquidity wallet. Cannot exceed MAX_SUPPLY.
    receive(msg: Mint) {
        require(sender() == self.admin, "Only admin can mint");
        require(self.mintable, "Minting is closed");
        require(msg.amount > 0, "Amount must be positive");
        require(self.totalSupply + msg.amount <= self.MAX_SUPPLY, "Exceeds hard cap of 10B DRILL");

        self.totalSupply = self.totalSupply + msg.amount;

        let init: StateInit = initOf DrillJettonWallet(msg.to, myAddress());
        let wallet: Address = contractAddress(init);

        send(SendParameters{
            to: wallet,
            value: 0,
            bounce: true,
            mode: SendRemainingValue,
            body: JettonInternalTransfer{
                queryId: msg.queryId,
                amount: msg.amount,
                from: myAddress(),
                responseAddress: self.admin,
                forwardTonAmount: 0,
                forwardPayload: rawSlice("x")
            }.toCell(),
            code: init.code,
            data: init.data
        });
    }

    receive(msg: JettonBurnNotification) {
        let init: StateInit = initOf DrillJettonWallet(msg.owner, myAddress());
        require(sender() == contractAddress(init), "Invalid burn sender");
        require(msg.amount <= self.totalSupply, "Burn exceeds supply");
        self.totalSupply = self.totalSupply - msg.amount;

        send(SendParameters{
            to: msg.responseDestination,
            value: 0,
            mode: SendRemainingValue + SendIgnoreErrors,
            body: Excesses{ queryId: msg.queryId }.toCell()
        });
    }

    receive(msg: ChangeAdmin) {
        require(sender() == self.admin, "Only admin can change admin");
        self.admin = msg.newAdmin;
    }

    /// One-way. After this, nobody can mint, including admin.
    receive(msg: CloseMinting) {
        require(sender() == self.admin, "Only admin can close minting");
        self.mintable = false;
    }

    receive(msg: ProvideWalletAddress) {
        let init: StateInit = initOf DrillJettonWallet(msg.ownerAddress, myAddress());
        send(SendParameters{
            to: sender(),
            value: 0,
            mode: SendRemainingValue,
            body: TakeWalletAddress{
                queryId: msg.queryId,
                walletAddress: contractAddress(init),
                ownerAddress: msg.includeAddress ? msg.ownerAddress : null
            }.toCell()
        });
    }

    get fun get_jetton_data(): String {
        return "DRILL";
    }

    get fun totalSupply(): Int {
        return self.totalSupply;
    }

    get fun maxSupply(): Int {
        return self.MAX_SUPPLY;
    }

    get fun remainingMintable(): Int {
        return self.MAX_SUPPLY - self.totalSupply;
    }

    get fun mintable(): Bool {
        return self.mintable;
    }

    get fun admin(): Address {
        return self.admin;
    }

    get fun get_wallet_address(owner: Address): Address {
        let init: StateInit = initOf DrillJettonWallet(owner, myAddress());
        return contractAddress(init);
    }
}
