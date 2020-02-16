package session

import (
	"bytes"
	"crypto/aes"
	"crypto/cipher"
	"crypto/hmac"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/json"
	"errors"
	"io"
)

func PKCS5Padding(ciphertext []byte, blockSize int) []byte {
	padding := blockSize - len(ciphertext)%blockSize
	padtext := bytes.Repeat([]byte{byte(padding)}, padding)
	return append(ciphertext, padtext...)
}

func PKCS5Trimming(encrypt []byte) []byte {
	padding := encrypt[len(encrypt)-1]
	return encrypt[:len(encrypt)-int(padding)]
}

func MarshalSession(key1, key2 []byte, in interface{}) ([]byte, error) {
	plaintext, err := json.Marshal(in)
	if err != nil {
		return nil, err
	}
	plaintext = PKCS5Padding(plaintext, aes.BlockSize)

	if len(plaintext)%aes.BlockSize != 0 {
		return nil, errors.New("plaintext is not a multiple of the block size")
	}

	block, err := aes.NewCipher(key1)
	if err != nil {
		return nil, err
	}
	block.BlockSize()

	ciphertext := make([]byte, aes.BlockSize+len(plaintext))
	iv := ciphertext[:aes.BlockSize]
	if _, err := io.ReadFull(rand.Reader, iv); err != nil {
		return nil, err
	}

	mode := cipher.NewCBCEncrypter(block, iv)
	mode.CryptBlocks(ciphertext[aes.BlockSize:], plaintext)

	// hmac
	h := hmac.New(sha256.New, key2)
	_, err = h.Write(ciphertext)
	if err != nil {
		return nil, err
	}
	hashSum := h.Sum(nil)

	// base64 ciphertext
	ciphertextBase64 := base64.RawStdEncoding.EncodeToString(ciphertext)
	// base64 hash
	hashSumBase64 := base64.RawStdEncoding.EncodeToString(hashSum)

	return []byte(ciphertextBase64 + "." + hashSumBase64), nil
}

func UnmarshalSession(key1, key2 []byte, in []byte, out interface{}) error {
	arrSplit := bytes.SplitN(in, []byte("."), 2)
	if len(arrSplit) != 2 {
		return errors.New("should have two dots")
	}
	ciphertextBase64, hashSumBase64 := string(arrSplit[0]), string(arrSplit[1])

	hashSum, err := base64.RawStdEncoding.DecodeString(hashSumBase64)
	if err != nil {
		return err
	}

	ciphertext, err := base64.RawStdEncoding.DecodeString(ciphertextBase64)
	if err != nil {
		return err
	}

	// hmac
	h := hmac.New(sha256.New, key2)
	_, err = h.Write(ciphertext)
	if err != nil {
		return err
	}
	hashSumNew := h.Sum(nil)
	if !hmac.Equal(hashSum, hashSumNew) {
		return errors.New("hmac not same")
	}

	block, err := aes.NewCipher(key1)
	if len(ciphertext) < aes.BlockSize {
		return errors.New("ciphertext too short")
	}
	iv := ciphertext[:aes.BlockSize]
	ciphertext = ciphertext[aes.BlockSize:]

	if len(ciphertext)%aes.BlockSize != 0 {
		return errors.New("ciphertext is not a multiple of the block size")
	}

	mode := cipher.NewCBCDecrypter(block, iv)
	mode.CryptBlocks(ciphertext, ciphertext)

	plaintext := PKCS5Trimming(ciphertext)
	return json.Unmarshal(plaintext, out)
}
