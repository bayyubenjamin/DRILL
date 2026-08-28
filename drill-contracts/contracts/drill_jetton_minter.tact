import "./messages";
import "./drill_jetton_wallet";

/// $DRILL
/// Cap tetap 10,000,000,000 token (9 decimals).
/// Mint hanya admin. Admin tidak bisa menarik saldo user.
contract DrillJettonMinter {
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

    receive(msg: Mint) {
        require(sender() == self.admin, "Only admin");
        require(self.mintable, "Mint closed");
        require(msg.amount > 0, "Amount");
        require(self.totalSupply + msg.amount <= self.MAX_SUPPLY, "Cap 10B");

        self.totalSupply = self.totalSupply + msg.amount;

        let init = initOf DrillJettonWallet(msg.to, myAddress());
        send(SendParameters{
            to: contractAddress(init),
            value: 0,
            bounce: true,
            mode: SendRemainingValue,
            body: JettonInternalTransfer{
                queryId: msg.queryId,
                amount: msg.amount,
                from: myAddress(),
                responseDestination: self.admin,
                forwardTonAmount: 0,
                forwardPayload: beginCell().storeBit(false).asSlice()
            }.toCell(),
            code: init.code,
            data: init.data
        });
    }

    receive(msg: JettonBurnNotification) {
        let init = initOf DrillJettonWallet(msg.owner, myAddress());
        require(sender() == contractAddress(init), "Bad burn");
        self.totalSupply = self.totalSupply - msg.amount;
        require(self.totalSupply >= 0, "Supply");
        send(SendParameters{
            to: msg.responseDestination,
            value: 0,
            mode: SendRemainingValue + SendIgnoreErrors,
            body: JettonExcesses{ queryId: msg.queryId }.toCell()
        });
    }

    receive(msg: ChangeAdmin) {
        require(sender() == self.admin, "Only admin");
        self.admin = msg.newAdmin;
    }

    receive(msg: CloseMinting) {
        require(sender() == self.admin, "Only admin");
        self.mintable = false;
    }

    get fun totalSupply(): Int { return self.totalSupply; }
    get fun maxSupply(): Int { return self.MAX_SUPPLY; }
    get fun remainingMintable(): Int { return self.MAX_SUPPLY - self.totalSupply; }
    get fun mintable(): Bool { return self.mintable; }
    get fun admin(): Address { return self.admin; }
    get fun get_wallet_address(owner: Address): Address {
        return contractAddress(initOf DrillJettonWallet(owner, myAddress()));
    }
}
