import "@stdlib/deploy";

struct EmissionData {
    currentQuarter: Int;
    currentEmission: Int;
    genesisTime: Int;
    quarterDuration: Int;
}

contract DrillCore with Deployable {
    owner: Address;
    genesisTime: Int as uint64;
    quarterDuration: Int as uint64;
    initialEmission: Int as coins;

    init(owner: Address, genesisTime: Int) {
        self.owner = owner;
        self.genesisTime = genesisTime;
        
        // 90 hari dalam detik (1 Quarter)
        self.quarterDuration = 7776000; 
        
        // 100 Juta $DRILL untuk Q1 (asumsi 9 desimal)
        self.initialEmission = 100000000000000000; 
    }

    // Kalkulasi kuartal ke-berapa saat ini (0 = Q1, 1 = Q2, dst)
    get fun current_quarter(): Int {
        let timePassed: Int = now() - self.genesisTime;
        if (timePassed < 0) { return 0; }
        return timePassed / self.quarterDuration;
    }

    // Kalkulasi emission halving (initialEmission / 2^Quarter)
    get fun current_emission(): Int {
        let q: Int = self.current_quarter();
        // Bitwise right shift (>>) membagi angka dengan 2 pangkat Q.
        // Sangat efisien untuk smart contract.
        return self.initialEmission >> q;
    }

    // Endpoint data komprehensif untuk dibaca oleh backend Next.js
    get fun emission_data(): EmissionData {
        return EmissionData{
            currentQuarter: self.current_quarter(),
            currentEmission: self.current_emission(),
            genesisTime: self.genesisTime,
            quarterDuration: self.quarterDuration
        };
    }
}
