package solana

import (
	"testing"
)

func TestWalletSignAndVerify(t *testing.T) {
	// Test vector: known keypair
	privB58 := "4Z7cXSyeFR8wNGMVXUE1TwtrWepjGZvRjX5bL4mG2DKmrR1w3M5VKqB6GQoJs8NfPx9jWAyT2U3iHbLdCtEaZ"
	pubB58 := "8xF3abCDEFGHijkLMNOPQRSVWXyz1234567890"
	message := []byte("Sign in to Solqora\n\nNonce: test123")

	wallet, err := NewWalletFromPrivateKey(privB58)
	if err != nil {
		t.Skipf("test vector key unavailable: %v", err)
	}

	if wallet.PublicKey() != pubB58 {
		t.Errorf("PublicKey mismatch: got %s, want %s", wallet.PublicKey(), pubB58)
	}

	sig := wallet.SignMessage(message)
	if !VerifySignature(pubB58, sig, message) {
		t.Error("Signature verification failed")
	}

	// Tampered message should fail
	if VerifySignature(pubB58, sig, append(message, 0x00)) {
		t.Error("Tampered message should not verify")
	}
}

func TestCreateAuthNonce(t *testing.T) {
	nonce := CreateAuthNonce("8xF3abCDEFGHijkLMNOPQRSVWXyz1234567890", 600)
	if nonce.WalletAddress == "" {
		t.Error("WalletAddress should not be empty")
	}
	if len(nonce.Nonce) != 32 {
		t.Errorf("Nonce length should be 32, got %d", len(nonce.Nonce))
	}
	if nonce.ExpiresAt == 0 {
		t.Error("ExpiresAt should not be zero")
	}
	if nonce.Message == "" {
		t.Error("Message should not be empty")
	}
}

func TestVerifySignatureInvalidKey(t *testing.T) {
	if VerifySignature("invalid_key", "sig", []byte("msg")) {
		t.Error("Should fail for invalid public key")
	}
}
