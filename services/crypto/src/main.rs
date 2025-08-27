use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use sha2::{Sha256, Digest};
use aes_gcm::{
    aead::{Aead, AeadCore, KeyInit, OsRng},
    Aes256Gcm, Nonce, Key
};
use base64::{Engine as _, engine::general_purpose};

#[derive(Debug, Serialize, Deserialize)]
pub struct HashRequest {
    pub data: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct HashResponse {
    pub hash: String,
    pub algorithm: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EncryptRequest {
    pub data: String,
    pub key: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct EncryptResponse {
    pub encrypted: String,
    pub key: String,
    pub nonce: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DecryptRequest {
    pub encrypted: String,
    pub key: String,
    pub nonce: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct DecryptResponse {
    pub decrypted: String,
}

pub struct CryptoService;

impl CryptoService {
    pub fn new() -> Self {
        Self
    }

    pub fn hash_sha256(&self, data: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(data.as_bytes());
        let result = hasher.finalize();
        hex::encode(result)
    }

    pub fn encrypt_aes256(&self, data: &str, key: Option<&str>) -> Result<EncryptResponse, Box<dyn std::error::Error>> {
        let key_bytes = match key {
            Some(k) => {
                let decoded = general_purpose::STANDARD.decode(k)?;
                if decoded.len() != 32 {
                    return Err("Key must be 32 bytes (256 bits)".into());
                }
                decoded
            }
            None => {
                let key = Aes256Gcm::generate_key(&mut OsRng);
                key.to_vec()
            }
        };

        let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key_bytes));
        let nonce = Aes256Gcm::generate_nonce(&mut OsRng);
        let ciphertext = cipher.encrypt(&nonce, data.as_bytes())?;

        Ok(EncryptResponse {
            encrypted: general_purpose::STANDARD.encode(&ciphertext),
            key: general_purpose::STANDARD.encode(&key_bytes),
            nonce: general_purpose::STANDARD.encode(&nonce),
        })
    }

    pub fn decrypt_aes256(&self, encrypted: &str, key: &str, nonce: &str) -> Result<DecryptResponse, Box<dyn std::error::Error>> {
        let key_bytes = general_purpose::STANDARD.decode(key)?;
        let nonce_bytes = general_purpose::STANDARD.decode(nonce)?;
        let encrypted_bytes = general_purpose::STANDARD.decode(encrypted)?;

        let cipher = Aes256Gcm::new(Key::<Aes256Gcm>::from_slice(&key_bytes));
        let nonce = Nonce::from_slice(&nonce_bytes);
        let plaintext = cipher.decrypt(nonce, encrypted_bytes.as_ref())?;

        Ok(DecryptResponse {
            decrypted: String::from_utf8(plaintext)?,
        })
    }
}

#[tokio::main]
async fn main() {
    println!("Last Words Crypto Service");
    println!("========================");
    
    let crypto = CryptoService::new();
    
    // Example usage
    let test_data = "Hello, World!";
    println!("Original data: {}", test_data);
    
    // Hash example
    let hash = crypto.hash_sha256(test_data);
    println!("SHA256 hash: {}", hash);
    
    // Encryption example
    match crypto.encrypt_aes256(test_data, None) {
        Ok(encrypted) => {
            println!("Encrypted: {}", encrypted.encrypted);
            println!("Key: {}", encrypted.key);
            println!("Nonce: {}", encrypted.nonce);
            
            // Decryption example
            match crypto.decrypt_aes256(&encrypted.encrypted, &encrypted.key, &encrypted.nonce) {
                Ok(decrypted) => {
                    println!("Decrypted: {}", decrypted.decrypted);
                }
                Err(e) => println!("Decryption error: {}", e),
            }
        }
        Err(e) => println!("Encryption error: {}", e),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_hash_sha256() {
        let crypto = CryptoService::new();
        let hash = crypto.hash_sha256("test");
        assert_eq!(hash, "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08");
    }

    #[test]
    fn test_encrypt_decrypt() {
        let crypto = CryptoService::new();
        let data = "test data";
        
        let encrypted = crypto.encrypt_aes256(data, None).unwrap();
        let decrypted = crypto.decrypt_aes256(&encrypted.encrypted, &encrypted.key, &encrypted.nonce).unwrap();
        
        assert_eq!(data, decrypted.decrypted);
    }
}
