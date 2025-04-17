import { ConnectButton } from '@rainbow-me/rainbowkit';

export function CustomConnectButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    className="h-12 rounded-xl bg-fluid-primary px-8 font-medium text-fluid-white transition-colors duration-200 hover:bg-fluid-primary/90"
                  >
                    Connect Wallet
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="h-12 rounded-xl bg-red-500 px-8 font-medium text-fluid-white transition-colors duration-200 hover:bg-red-600"
                  >
                    Wrong network
                  </button>
                );
              }

              return (
                <div className="flex items-center gap-4">
                  <button
                    onClick={openChainModal}
                    className="flex h-12 items-center gap-2 rounded-xl border border-fluid-white/10 bg-fluid-bg px-4 font-medium text-fluid-white transition-colors duration-200 hover:bg-fluid-white/5"
                  >
                    {chain.hasIcon && (
                      <div className="h-5 w-5">
                        {chain.iconUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            className="h-5 w-5"
                          />
                        )}
                      </div>
                    )}
                    <span>{chain.name}</span>
                  </button>

                  <button
                    onClick={openAccountModal}
                    className="flex h-12 items-center gap-2 rounded-xl bg-fluid-primary px-4 font-medium text-fluid-white transition-colors duration-200 hover:bg-fluid-primary/90"
                  >
                    {account.displayName}
                    {account.balanceFormatted && <span>{account.balanceFormatted}</span>}
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
