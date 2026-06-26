package solana

import (
	"context"
	"crypto/ed25519"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"time"

	"github.com/mr-tron/base58"
)

// Wallet represents a Solana keypair for transaction signing.
type Wallet struct {
	publicKey  ed25519.PublicKey
	privateKey ed25519.PrivateKey
}

// NewWalletFromPrivateKey creates a wallet from a base58-encoded private key.
func NewWalletFromPrivateKey(b58key string) (*Wallet, error) {
	key, err := base58.Decode(b58key)
	if err != nil {
		return nil, fmt.Errorf("solana: invalid private key: %w", err)
	}
	if len(key) != ed25519.SeedSize {
		return nil, fmt.Errorf("solana: expected %d byte seed, got %d", ed25519.SeedSize, len(key))
	}
	priv := ed25519.NewKeyFromSeed(key)
	pub := priv.Public().(ed25519.PublicKey)
	return &Wallet{publicKey: pub, privateKey: priv}, nil
}

// PublicKey returns the base58-encoded wallet public key.
func (w *Wallet) PublicKey() string {
	return base58.Encode(w.publicKey)
}

// SignMessage signs an arbitrary message and returns a base58-encoded signature.
func (w *Wallet) SignMessage(message []byte) string {
	sig := ed25519.Sign(w.privateKey, message)
	return base58.Encode(sig)
}

// VerifySignature checks a base58 signature against a public key and message.
func VerifySignature(pubKeyB58, sigB58 string, message []byte) bool {
	pubKey, err := base58.Decode(pubKeyB58)
	if err != nil {
		return false
	}
	sig, err := base58.Decode(sigB58)
	if err != nil {
		return false
	}
	if len(pubKey) != ed25519.PublicKeySize {
		return false
	}
	return ed25519.Verify(ed25519.PublicKey(pubKey), message, sig)
}

// AuthNonce generates a sign-in nonce for wallet authentication.
type AuthNonce struct {
	WalletAddress string `json:"wallet_address"`
	Nonce         string `json:"nonce"`
	Message       string `json:"message"`
	ExpiresAt     int64  `json:"expires_at"`
}

// CreateAuthNonce builds a sign-in message for SIWS (Sign-In With Solana).
func CreateAuthNonce(walletAddress string, ttlSeconds int) *AuthNonce {
	nonce := base64.RawURLEncoding.EncodeToString(
		ed25519.NewKeyFromSeed([]byte(fmt.Sprintf("%d", time.Now().UnixNano()))[:32]).Seed(),
	)[:32]
	expiresAt := time.Now().Add(time.Duration(ttlSeconds) * time.Second).Unix()
	message := fmt.Sprintf(
		"Sign in to Solqora\n\nWallet: %s\nNonce: %s\nIssued: %s\nExpires: %s",
		walletAddress,
		nonce,
		time.Now().UTC().Format(time.RFC3339),
		time.Unix(expiresAt, 0).UTC().Format(time.RFC3339),
	)
	return &AuthNonce{
		WalletAddress: walletAddress,
		Nonce:         nonce,
		Message:       message,
		ExpiresAt:     expiresAt,
	}
}

// TokenBalance fetches a token account balance from RPC.
type TokenBalance struct {
	Address  string  `json:"address"`
	Mint     string  `json:"mint"`
	Amount   float64 `json:"amount"`
	Decimals int     `json:"decimals"`
}

// GetTokenAccountsByOwnerRequest is the RPC payload.
type GetTokenAccountsByOwnerRequest struct {
	JSONRPC string        `json:"jsonrpc"`
	ID      int           `json:"id"`
	Method  string        `json:"method"`
	Params  []interface{} `json:"params"`
}

// RPCResponse wraps a JSON-RPC response.
type RPCResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      int             `json:"id"`
	Result  json.RawMessage `json:"result"`
	Error   *RPCError       `json:"error,omitempty"`
}

// RPCError is a JSON-RPC error object.
type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
}

// SolanaRPC is a minimal client for Solana JSON-RPC.
type SolanaRPC struct {
	endpoint string
	client   *http.Client
}

// NewSolanaRPC creates a new RPC client.
func NewSolanaRPC(endpoint string) *SolanaRPC {
	return &SolanaRPC{
		endpoint: endpoint,
		client:   &http.Client{Timeout: 30 * time.Second},
	}
}

// GetBalance fetches the SOL balance for a wallet (in lamports).
func (r *SolanaRPC) GetBalance(ctx context.Context, pubKey string) (uint64, error) {
	reqBody := GetTokenAccountsByOwnerRequest{
		JSONRPC: "2.0",
		ID:      1,
		Method:  "getBalance",
		Params:  []interface{}{pubKey},
	}
	b, _ := json.Marshal(reqBody)
	httpReq, err := http.NewRequestWithContext(ctx, "POST", r.endpoint, bytes.NewReader(b))
	if err != nil {
		return 0, err
	}
	httpReq.Header.Set("Content-Type", "application/json")
	resp, err := r.client.Do(httpReq)
	if err != nil {
		return 0, fmt.Errorf("rpc call: %w", err)
	}
	defer resp.Body.Close()
	var rpcResp RPCResponse
	if err := json.NewDecoder(resp.Body).Decode(&rpcResp); err != nil {
		return 0, err
	}
	if rpcResp.Error != nil {
		return 0, fmt.Errorf("rpc error %d: %s", rpcResp.Error.Code, rpcResp.Error.Message)
	}
	var balance struct{ Value uint64 }
	if err := json.Unmarshal(rpcResp.Result, &balance); err != nil {
		return 0, err
	}
	return balance.Value, nil
}
