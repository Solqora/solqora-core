# Solana SDK for Solqora Core

Native Go wallet operations and RPC client for Solana blockchain integration.

## Features

- ED25519 wallet: key generation, message signing, signature verification
- SIWS (Sign-In With Solana) auth nonce generation
- JSON-RPC client for balance queries and token account lookups
- Token balance parsing (USDC, SOL, SPL tokens)

## Usage

```go
import "github.com/solqora/solqora-core/sdk/solana"

// Sign-in flow
nonce := solana.CreateAuthNonce(walletAddress, 600)
// Send nonce.Message to user, get signed sig back

valid := solana.VerifySignature(pubKey, sig, []byte(nonce.Message))
if valid {
    // Authenticate user
}

// Balance check
rpc := solana.NewSolanaRPC("https://api.mainnet-beta.solana.com")
balance, err := rpc.GetBalance(context.Background(), walletAddress)
if err != nil {
    log.Fatal(err)
}
fmt.Printf("%d lamports", balance)
```

## Test

```bash
go test ./sdk/solana/...
```
