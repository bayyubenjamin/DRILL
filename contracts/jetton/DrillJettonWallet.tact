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
    responseAddress: Address;
    forwardTonAmount: Int as coins;
    forwardPayload: Slice as remaining;
}

message(0x7362d09c) JettonNotification {
    queryId: Int as uint64;
    amount: Int as coins;
    sender: Address;
    forwardPayload: Slice as remaining;
}

message(0xd53276db) Excesses {
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

contract DrillJettonWallet {
    balance: Int as coins;
    owner: Address;
    master: Address;

    init(owner: Address, master: Address) {
        self.balance = 0;
        self.owner = owner;
        self.master = master;
    }

    receive(msg: JettonTransfer) {
        require(sender() == self.owner, "Only wallet owner can transfer");
        require(msg.amount > 0, "Amount must be positive");
        self.balance = self.balance - msg.amount;
        require(self.balance >= 0, "Insufficient jetton balance");

        let init: StateInit = initOf DrillJettonWallet(msg.destination, self.master);
        let destWallet: Address = contractAddress(init);

        send(SendParameters{
            to: destWallet,
            value: 0,
            bounce: true,
            mode: SendRemainingValue,
            body: JettonInternalTransfer{
                queryId: msg.queryId,
                amount: msg.amount,
                from: self.owner,
                responseAddress: msg.responseDestination,
                forwardTonAmount: msg.forwardTonAmount,
                forwardPayload: msg.forwardPayload
            }.toCell(),
            code: init.code,
            data: init.data
        });
    }

    receive(msg: JettonInternalTransfer) {
        let expectedWallet: StateInit = initOf DrillJettonWallet(msg.from, self.master);
        let expectedSender: Address = contractAddress(expectedWallet);
        require(sender() == expectedSender || sender() == self.master, "Invalid jetton sender");

        self.balance = self.balance + msg.amount;

        if (msg.forwardTonAmount > 0) {
            send(SendParameters{
                to: self.owner,
                value: msg.forwardTonAmount,
                bounce: false,
                body: JettonNotification{
                    queryId: msg.queryId,
                    amount: msg.amount,
                    sender: msg.from,
                    forwardPayload: msg.forwardPayload
                }.toCell()
            });
        }

        send(SendParameters{
            to: msg.responseAddress,
            value: 0,
            mode: SendRemainingValue + SendIgnoreErrors,
            body: Excesses{ queryId: msg.queryId }.toCell()
        });
    }

    receive(msg: JettonBurn) {
        require(sender() == self.owner, "Only wallet owner can burn");
        require(msg.amount > 0, "Amount must be positive");
        self.balance = self.balance - msg.amount;
        require(self.balance >= 0, "Insufficient jetton balance");

        send(SendParameters{
            to: self.master,
            value: 0,
            mode: SendRemainingValue,
            body: JettonBurnNotification{
                queryId: msg.queryId,
                amount: msg.amount,
                owner: self.owner,
                responseDestination: msg.responseDestination
            }.toCell()
        });
    }

    bounced(src: Slice) {
        src.skipBits(32);
        let op: Int = src.loadUint(32);
        if (op == 0x178d4519) {
            src.skipBits(64);
            let amount: Int = src.loadCoins();
            self.balance = self.balance + amount;
        }
    }

    get fun get_wallet_data(): String {
        return "DRILL_WALLET";
    }

    get fun balance(): Int {
        return self.balance;
    }

    get fun owner(): Address {
        return self.owner;
    }
}
