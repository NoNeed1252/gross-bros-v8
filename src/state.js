const state = { 
  connected: localStorage.getItem('xaman_connected') === 'true', 
  wallet: localStorage.getItem('xaman_wallet') || "", 
  chat: [], 
  fuseUnlocked: false, 
  fuseToken: "XRP", 
  selectedNft: null, 
  userNfts: [], 
  fuseTargetUsd: 50,
  xrpPrice: 0,
  payloadUuid: localStorage.getItem('xaman_payload_uuid') || null
};