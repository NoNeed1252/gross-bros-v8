import { createAppKit } from 'https://esm.sh/@reown/appkit'
import { WagmiAdapter } from 'https://esm.sh/@reown/appkit-adapter-wagmi'
import { SolanaAdapter } from 'https://esm.sh/@reown/appkit-adapter-solana'
import { mainnet, polygon } from 'https://esm.sh/@reown/appkit/networks'
import { solana } from 'https://esm.sh/@reown/appkit/networks'
import { PhantomWalletAdapter, SolflareWalletAdapter } from 'https://esm.sh/@solana/wallet-adapter-wallets'

async function initAppKit() {
  try {
    const res = await fetch('/api/config');
    const config = await res.json();
    const projectId = config.appKitProjectId;

    const metadata = {
      name: 'Gross Bros OS',
      description: 'GGB Multi-Chain Terminal',
      url: 'https://grossbros.vercel.app',
      icons: ['https://grossbros.vercel.app/favicon.ico']
    };

    const wagmiAdapter = new WagmiAdapter({
      projectId,
      networks: [mainnet, polygon]
    });

    const solanaAdapter = new SolanaAdapter({
      wallets: [new PhantomWalletAdapter(), new SolflareWalletAdapter()]
    });

    const modal = createAppKit({
      adapters: [wagmiAdapter, solanaAdapter],
      networks: [mainnet, polygon, solana],
      metadata,
      projectId,
      features: {
        analytics: true
      }
    });

    window.appKit = modal;

    modal.subscribeEvents(event => {
      if (event.data.event === 'CONNECT_SUCCESS') {
        const { chainId, address } = modal.getAccount();
        window.onConnect(chainId, address);
      }
    });
  } catch (err) {
    console.error('AppKit init failed:', err);
  }
}

initAppKit();