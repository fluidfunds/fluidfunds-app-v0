import { ConnectButton } from '@rainbow-me/rainbowkit'

export function CustomConnectButton() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted
        const connected = ready && account && chain

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
                    className="h-12 px-8 rounded-xl bg-fluid-primary text-fluid-white 
                             font-medium hover:bg-fluid-primary/90 transition-colors duration-200"
                  >
                    Connect Wallet
                  </button>
                )
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    className="h-12 px-8 rounded-xl bg-red-500 text-fluid-white 
                             font-medium hover:bg-red-600 transition-colors duration-200"
                  >
                    Wrong network
                  </button>
                )
              }

              return (
                <div className="flex items-center gap-4">
                  <button
                    onClick={openChainModal}
                    className="flex items-center gap-2 h-12 px-4 rounded-xl 
                             bg-fluid-bg border border-fluid-white/10 text-fluid-white 
                             font-medium hover:bg-fluid-white/5 transition-colors duration-200"
                  >
                    {chain.hasIcon && (
                      <div className="w-5 h-5">
                        {chain.iconUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            className="w-5 h-5"
                          />
                        )}
                      </div>
                    )}
                    <span>{chain.name}</span>
                  </button>

                  <button
                    onClick={openAccountModal}
                    className="flex items-center gap-2 h-12 px-4 rounded-xl 
                             bg-fluid-primary text-fluid-white font-medium 
                             hover:bg-fluid-primary/90 transition-colors duration-200"
                  >
                    {account.displayName}
                    {account.balanceFormatted && (
                      <span>{account.balanceFormatted}</span>
                    )}
                  </button>
                </div>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}