import "./messages";

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
        require(sender() == self.owner, "Only owner");
        require(msg.amount > 0, "Amount");
        self.balance = self.balance - msg.amount;
        require(self.balance >= 0, "Low balance");

        let init = initOf DrillJettonWallet(msg.destination, self.master);
        send(SendParameters{
            to: contractAddress(init),
            value: 0,
            bounce: true,
            mode: SendRemainingValue,
            body: JettonInternalTransfer{
                queryId: msg.queryId,
                amount: msg.amount,
                from: self.owner,
                responseDestination: msg.responseDestination,
                forwardTonAmount: msg.forwardTonAmount,
                forwardPayload: msg.forwardPayload
            }.toCell(),
            code: init.code,
            data: init.data
        });
    }

    receive(msg: JettonInternalTransfer) {
        let fromInit = initOf DrillJettonWallet(msg.from, self.master);
        require(sender() == contractAddress(fromInit) || sender() == self.master, "Bad sender");
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
            to: msg.responseDestination,
            value: 0,
            bounce: false,
            mode: SendRemainingValue + SendIgnoreErrors,
            body: JettonExcesses{ queryId: msg.queryId }.toCell()
        });
    }

    receive(msg: JettonBurn) {
        require(sender() == self.owner, "Only owner");
        self.balance = self.balance - msg.amount;
        require(self.balance >= 0, "Low balance");
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

    bounced(msg: bounced<JettonInternalTransfer>) {
        self.balance = self.balance + msg.amount;
    }

    get fun balance(): Int {
        return self.balance;
    }

    get fun owner(): Address {
        return self.owner;
    }
}
