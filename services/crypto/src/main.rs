use std::convert::Infallible;
use serde::{Deserialize, Serialize};
use warp::Filter;
use sodiumoxide::crypto::aead::xchacha20poly1305_ietf;
use argon2::{Argon2, PasswordHasher};
use hkdf::Hkdf;
use sha2::Sha256;
use base64::{Engine as _, engine::general_purpose};
use rand::{RngCore, rngs::OsRng};
use thiserror::Error;

#[derive(Error, Debug)]
pub enum CryptoError {
    #[error("Invalid input: {0}")]
    InvalidInput(String),
    #[error("Encryption failed: {0}")]
    EncryptionFailed(String),
    #[error("Decryption failed: {0}")]
    DecryptionFailed(String),
    #[error("Key derivation failed: {0}")]
    KeyDerivationFailed(String),
    #[error("Base64 decode error: {0}")]
    Base64Error(#[from] base64::DecodeError),
    #[error("Argon2 error: {0}")]
    Argon2Error(String),
}

// Versioned structs for API responses
#[derive(Debug, Serialize, Deserialize)]
pub struct KdfRequest {
    pub password: String,
    pub salt: Option<String>,
    pub memory: Option<u32>,
    pub iterations: Option<u32>,
    pub parallelism: Option<u32>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KdfResponse {
    pub version: u8,
    pub hash: String,
    pub salt: String,
    pub memory: u32,
    pub iterations: u32,
    pub parallelism: u32,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AeadEncryptRequest {
    pub plaintext: String,
    pub key: String,
    pub additional_data: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AeadEncryptResponse {
    pub version: u8,
    pub ciphertext: String,
    pub nonce: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AeadDecryptRequest {
    pub ciphertext: String,
    pub key: String,
    pub nonce: String,
    pub additional_data: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AeadDecryptResponse {
    pub version: u8,
    pub plaintext: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KeyWrapRequest {
    pub master_key: String,
    pub user_key: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KeyWrapResponse {
    pub version: u8,
    pub wrapped_key: String,
    pub salt: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KeyUnwrapRequest {
    pub master_key: String,
    pub wrapped_key: String,
    pub salt: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct KeyUnwrapResponse {
    pub version: u8,
    pub unwrapped_key: String,
}

pub struct CryptoBoundaryService {
    argon2: Argon2<'static>,
}

impl CryptoBoundaryService {
    pub fn new() -> Self {
        sodiumoxide::init().expect("Failed to initialize libsodium");
        
        Self {
            argon2: Argon2::default(),
        }
    }

    pub fn kdf_argon2id(&self, req: KdfRequest) -> Result<KdfResponse, CryptoError> {
        let salt_bytes = match req.salt {
            Some(s) => general_purpose::STANDARD.decode(s)?,
            None => {
                let mut salt = [0u8; 32];
                OsRng.fill_bytes(&mut salt);
                salt.to_vec()
            }
        };

        let memory = req.memory.unwrap_or(65536); // 64 MB
        let iterations = req.iterations.unwrap_or(3);
        let parallelism = req.parallelism.unwrap_or(1);

        let params = argon2::Params::new(memory, iterations, parallelism, Some(32))
            .map_err(|e| CryptoError::KeyDerivationFailed(e.to_string()))?;
        
        let argon2 = Argon2::new(argon2::Algorithm::Argon2id, argon2::Version::V0x13, params);
        
        use argon2::password_hash::SaltString;
        let salt_string = SaltString::encode_b64(&salt_bytes)
            .map_err(|e| CryptoError::KeyDerivationFailed(e.to_string()))?;
        
        let password_hash = argon2
            .hash_password(req.password.as_bytes(), &salt_string)
            .map_err(|e| CryptoError::Argon2Error(e.to_string()))?;

        Ok(KdfResponse {
            version: 1,
            hash: password_hash.to_string(),
            salt: general_purpose::STANDARD.encode(&salt_bytes),
            memory,
            iterations,
            parallelism,
        })
    }

    pub fn aead_encrypt(&self, req: AeadEncryptRequest) -> Result<AeadEncryptResponse, CryptoError> {
        let key_bytes = general_purpose::STANDARD.decode(&req.key)?;
        if key_bytes.len() != xchacha20poly1305_ietf::KEYBYTES {
            return Err(CryptoError::InvalidInput(
                format!("Key must be {} bytes", xchacha20poly1305_ietf::KEYBYTES)
            ));
        }

        let key = xchacha20poly1305_ietf::Key::from_slice(&key_bytes)
            .ok_or_else(|| CryptoError::InvalidInput("Invalid key format".to_string()))?;
        
        let nonce = xchacha20poly1305_ietf::gen_nonce();
        let additional_data = req.additional_data.as_deref().unwrap_or("");
        
        let ciphertext = xchacha20poly1305_ietf::seal(
            req.plaintext.as_bytes(),
            Some(additional_data.as_bytes()),
            &nonce,
            &key,
        );

        Ok(AeadEncryptResponse {
            version: 1,
            ciphertext: general_purpose::STANDARD.encode(&ciphertext),
            nonce: general_purpose::STANDARD.encode(&nonce.0),
        })
    }

    pub fn aead_decrypt(&self, req: AeadDecryptRequest) -> Result<AeadDecryptResponse, CryptoError> {
        let key_bytes = general_purpose::STANDARD.decode(&req.key)?;
        let ciphertext_bytes = general_purpose::STANDARD.decode(&req.ciphertext)?;
        let nonce_bytes = general_purpose::STANDARD.decode(&req.nonce)?;

        if key_bytes.len() != xchacha20poly1305_ietf::KEYBYTES {
            return Err(CryptoError::InvalidInput(
                format!("Key must be {} bytes", xchacha20poly1305_ietf::KEYBYTES)
            ));
        }

        if nonce_bytes.len() != xchacha20poly1305_ietf::NONCEBYTES {
            return Err(CryptoError::InvalidInput(
                format!("Nonce must be {} bytes", xchacha20poly1305_ietf::NONCEBYTES)
            ));
        }

        let key = xchacha20poly1305_ietf::Key::from_slice(&key_bytes)
            .ok_or_else(|| CryptoError::InvalidInput("Invalid key format".to_string()))?;
        
        let nonce = xchacha20poly1305_ietf::Nonce::from_slice(&nonce_bytes)
            .ok_or_else(|| CryptoError::InvalidInput("Invalid nonce format".to_string()))?;
        
        let additional_data = req.additional_data.as_deref().unwrap_or("");
        
        let plaintext = xchacha20poly1305_ietf::open(
            &ciphertext_bytes,
            Some(additional_data.as_bytes()),
            &nonce,
            &key,
        ).map_err(|_| CryptoError::DecryptionFailed("Failed to decrypt".to_string()))?;

        let plaintext_str = String::from_utf8(plaintext)
            .map_err(|_| CryptoError::DecryptionFailed("Invalid UTF-8 in plaintext".to_string()))?;

        Ok(AeadDecryptResponse {
            version: 1,
            plaintext: plaintext_str,
        })
    }

    pub fn key_wrap(&self, req: KeyWrapRequest) -> Result<KeyWrapResponse, CryptoError> {
        let master_key = general_purpose::STANDARD.decode(&req.master_key)?;
        let user_key = general_purpose::STANDARD.decode(&req.user_key)?;
        
        let mut salt = [0u8; 32];
        OsRng.fill_bytes(&mut salt);
        
        // Use HKDF to combine master key and user key
        let hk = Hkdf::<Sha256>::new(Some(&salt), &master_key);
        let mut derived_key = [0u8; 32];
        hk.expand(b"key-wrap", &mut derived_key)
            .map_err(|e| CryptoError::KeyDerivationFailed(e.to_string()))?;
        
        let key = xchacha20poly1305_ietf::Key::from_slice(&derived_key)
            .ok_or_else(|| CryptoError::InvalidInput("Invalid derived key".to_string()))?;
        
        let nonce = xchacha20poly1305_ietf::gen_nonce();
        let wrapped = xchacha20poly1305_ietf::seal(&user_key, None, &nonce, &key);
        
        // Combine nonce + wrapped key for storage
        let mut result = Vec::new();
        result.extend_from_slice(&nonce.0);
        result.extend_from_slice(&wrapped);
        
        Ok(KeyWrapResponse {
            version: 1,
            wrapped_key: general_purpose::STANDARD.encode(&result),
            salt: general_purpose::STANDARD.encode(&salt),
        })
    }

    pub fn key_unwrap(&self, req: KeyUnwrapRequest) -> Result<KeyUnwrapResponse, CryptoError> {
        let master_key = general_purpose::STANDARD.decode(&req.master_key)?;
        let wrapped_data = general_purpose::STANDARD.decode(&req.wrapped_key)?;
        let salt = general_purpose::STANDARD.decode(&req.salt)?;
        
        if wrapped_data.len() < xchacha20poly1305_ietf::NONCEBYTES {
            return Err(CryptoError::InvalidInput("Wrapped key too short".to_string()));
        }
        
        // Split nonce and ciphertext
        let (nonce_bytes, ciphertext) = wrapped_data.split_at(xchacha20poly1305_ietf::NONCEBYTES);
        
        // Derive the same key using HKDF
        let hk = Hkdf::<Sha256>::new(Some(&salt), &master_key);
        let mut derived_key = [0u8; 32];
        hk.expand(b"key-wrap", &mut derived_key)
            .map_err(|e| CryptoError::KeyDerivationFailed(e.to_string()))?;
        
        let key = xchacha20poly1305_ietf::Key::from_slice(&derived_key)
            .ok_or_else(|| CryptoError::InvalidInput("Invalid derived key".to_string()))?;
        
        let nonce = xchacha20poly1305_ietf::Nonce::from_slice(nonce_bytes)
            .ok_or_else(|| CryptoError::InvalidInput("Invalid nonce".to_string()))?;
        
        let unwrapped = xchacha20poly1305_ietf::open(ciphertext, None, &nonce, &key)
            .map_err(|_| CryptoError::DecryptionFailed("Failed to unwrap key".to_string()))?;
        
        Ok(KeyUnwrapResponse {
            version: 1,
            unwrapped_key: general_purpose::STANDARD.encode(&unwrapped),
        })
    }
}

// HTTP handlers
async fn kdf_handler(
    req: KdfRequest,
    service: std::sync::Arc<CryptoBoundaryService>,
) -> Result<impl warp::Reply, Infallible> {
    match service.kdf_argon2id(req) {
        Ok(response) => Ok(warp::reply::json(&response)),
        Err(e) => {
            eprintln!("KDF error: {}", e);
            Ok(warp::reply::json(&serde_json::json!({
                "error": e.to_string()
            })))
        }
    }
}

async fn aead_encrypt_handler(
    req: AeadEncryptRequest,
    service: std::sync::Arc<CryptoBoundaryService>,
) -> Result<impl warp::Reply, Infallible> {
    match service.aead_encrypt(req) {
        Ok(response) => Ok(warp::reply::json(&response)),
        Err(e) => {
            eprintln!("AEAD encrypt error: {}", e);
            Ok(warp::reply::json(&serde_json::json!({
                "error": e.to_string()
            })))
        }
    }
}

async fn aead_decrypt_handler(
    req: AeadDecryptRequest,
    service: std::sync::Arc<CryptoBoundaryService>,
) -> Result<impl warp::Reply, Infallible> {
    match service.aead_decrypt(req) {
        Ok(response) => Ok(warp::reply::json(&response)),
        Err(e) => {
            eprintln!("AEAD decrypt error: {}", e);
            Ok(warp::reply::json(&serde_json::json!({
                "error": e.to_string()
            })))
        }
    }
}

async fn key_wrap_handler(
    req: KeyWrapRequest,
    service: std::sync::Arc<CryptoBoundaryService>,
) -> Result<impl warp::Reply, Infallible> {
    match service.key_wrap(req) {
        Ok(response) => Ok(warp::reply::json(&response)),
        Err(e) => {
            eprintln!("Key wrap error: {}", e);
            Ok(warp::reply::json(&serde_json::json!({
                "error": e.to_string()
            })))
        }
    }
}

async fn key_unwrap_handler(
    req: KeyUnwrapRequest,
    service: std::sync::Arc<CryptoBoundaryService>,
) -> Result<impl warp::Reply, Infallible> {
    match service.key_unwrap(req) {
        Ok(response) => Ok(warp::reply::json(&response)),
        Err(e) => {
            eprintln!("Key unwrap error: {}", e);
            Ok(warp::reply::json(&serde_json::json!({
                "error": e.to_string()
            })))
        }
    }
}

#[tokio::main]
async fn main() {
    println!("Last Words Crypto Boundary Service");
    println!("==================================");
    
    let service = std::sync::Arc::new(CryptoBoundaryService::new());
    
    // CORS configuration
    let cors = warp::cors()
        .allow_any_origin()
        .allow_headers(vec!["content-type"])
        .allow_methods(vec!["POST", "GET", "OPTIONS"]);
    
    // Routes
    let service_filter = warp::any().map(move || service.clone());
    
    let kdf_route = warp::path!("kdf" / "argon2id")
        .and(warp::post())
        .and(warp::body::json())
        .and(service_filter.clone())
        .and_then(kdf_handler);
    
    let aead_encrypt_route = warp::path!("aead" / "encrypt")
        .and(warp::post())
        .and(warp::body::json())
        .and(service_filter.clone())
        .and_then(aead_encrypt_handler);
    
    let aead_decrypt_route = warp::path!("aead" / "decrypt")
        .and(warp::post())
        .and(warp::body::json())
        .and(service_filter.clone())
        .and_then(aead_decrypt_handler);
    
    let key_wrap_route = warp::path!("key" / "wrap")
        .and(warp::post())
        .and(warp::body::json())
        .and(service_filter.clone())
        .and_then(key_wrap_handler);
    
    let key_unwrap_route = warp::path!("key" / "unwrap")
        .and(warp::post())
        .and(warp::body::json())
        .and(service_filter.clone())
        .and_then(key_unwrap_handler);
    
    let health_route = warp::path!("health")
        .and(warp::get())
        .map(|| warp::reply::json(&serde_json::json!({
            "status": "healthy",
            "service": "crypto-boundary",
            "version": "1.0.0"
        })));
    
    let routes = kdf_route
        .or(aead_encrypt_route)
        .or(aead_decrypt_route)
        .or(key_wrap_route)
        .or(key_unwrap_route)
        .or(health_route)
        .with(cors);
    
    println!("Starting server on http://0.0.0.0:3001");
    println!("Available endpoints:");
    println!("  POST /kdf/argon2id");
    println!("  POST /aead/encrypt");
    println!("  POST /aead/decrypt");
    println!("  POST /key/wrap");
    println!("  POST /key/unwrap");
    println!("  GET  /health");
    
    warp::serve(routes)
        .run(([0, 0, 0, 0], 3001))
        .await;
}

#[cfg(test)]
mod tests {
    use super::*;
    use base64::engine::general_purpose;

    #[test]
    fn test_kdf_argon2id() {
        let service = CryptoBoundaryService::new();
        let req = KdfRequest {
            password: "test_password".to_string(),
            salt: None,
            memory: Some(4096),
            iterations: Some(3),
            parallelism: Some(1),
        };
        
        let result = service.kdf_argon2id(req).unwrap();
        assert_eq!(result.version, 1);
        assert_eq!(result.memory, 4096);
        assert_eq!(result.iterations, 3);
        assert_eq!(result.parallelism, 1);
        assert!(!result.hash.is_empty());
        assert!(!result.salt.is_empty());
    }

    #[test]
    fn test_aead_encrypt_decrypt() {
        let service = CryptoBoundaryService::new();
        
        // Generate a random key
        let mut key = [0u8; 32];
        OsRng.fill_bytes(&mut key);
        let key_b64 = general_purpose::STANDARD.encode(&key);
        
        let plaintext = "Hello, World! This is a test message.";
        
        let encrypt_req = AeadEncryptRequest {
            plaintext: plaintext.to_string(),
            key: key_b64.clone(),
            additional_data: Some("test_aad".to_string()),
        };
        
        let encrypted = service.aead_encrypt(encrypt_req).unwrap();
        assert_eq!(encrypted.version, 1);
        assert!(!encrypted.ciphertext.is_empty());
        assert!(!encrypted.nonce.is_empty());
        
        let decrypt_req = AeadDecryptRequest {
            ciphertext: encrypted.ciphertext,
            key: key_b64,
            nonce: encrypted.nonce,
            additional_data: Some("test_aad".to_string()),
        };
        
        let decrypted = service.aead_decrypt(decrypt_req).unwrap();
        assert_eq!(decrypted.version, 1);
        assert_eq!(decrypted.plaintext, plaintext);
    }

    #[test]
    fn test_key_wrap_unwrap() {
        let service = CryptoBoundaryService::new();
        
        // Generate random keys
        let mut master_key = [0u8; 32];
        let mut user_key = [0u8; 32];
        OsRng.fill_bytes(&mut master_key);
        OsRng.fill_bytes(&mut user_key);
        
        let master_key_b64 = general_purpose::STANDARD.encode(&master_key);
        let user_key_b64 = general_purpose::STANDARD.encode(&user_key);
        
        let wrap_req = KeyWrapRequest {
            master_key: master_key_b64.clone(),
            user_key: user_key_b64.clone(),
        };
        
        let wrapped = service.key_wrap(wrap_req).unwrap();
        assert_eq!(wrapped.version, 1);
        assert!(!wrapped.wrapped_key.is_empty());
        assert!(!wrapped.salt.is_empty());
        
        let unwrap_req = KeyUnwrapRequest {
            master_key: master_key_b64,
            wrapped_key: wrapped.wrapped_key,
            salt: wrapped.salt,
        };
        
        let unwrapped = service.key_unwrap(unwrap_req).unwrap();
        assert_eq!(unwrapped.version, 1);
        assert_eq!(unwrapped.unwrapped_key, user_key_b64);
    }

    #[test]
    fn test_known_vectors_argon2id() {
        let service = CryptoBoundaryService::new();
        
        // Test with known salt for reproducible results
        let salt = "c2FsdDEyMzQ1Njc4OTBhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5ejEyMzQ1Ng=="; // "salt1234567890abcdefghijklmnopqrstuvwxyz123456" in base64
        
        let req = KdfRequest {
            password: "password123".to_string(),
            salt: Some(salt.to_string()),
            memory: Some(4096),
            iterations: Some(3),
            parallelism: Some(1),
        };
        
        let result = service.kdf_argon2id(req).unwrap();
        assert_eq!(result.version, 1);
        assert_eq!(result.salt, salt);
        assert!(!result.hash.is_empty());
        
        // Verify the hash starts with the expected Argon2id prefix
        assert!(result.hash.starts_with("$argon2id$"));
    }

    #[test]
    fn test_aead_with_empty_additional_data() {
        let service = CryptoBoundaryService::new();
        
        let mut key = [0u8; 32];
        OsRng.fill_bytes(&mut key);
        let key_b64 = general_purpose::STANDARD.encode(&key);
        
        let plaintext = "Test without AAD";
        
        let encrypt_req = AeadEncryptRequest {
            plaintext: plaintext.to_string(),
            key: key_b64.clone(),
            additional_data: None,
        };
        
        let encrypted = service.aead_encrypt(encrypt_req).unwrap();
        
        let decrypt_req = AeadDecryptRequest {
            ciphertext: encrypted.ciphertext,
            key: key_b64,
            nonce: encrypted.nonce,
            additional_data: None,
        };
        
        let decrypted = service.aead_decrypt(decrypt_req).unwrap();
        assert_eq!(decrypted.plaintext, plaintext);
    }

    #[test]
    fn test_invalid_key_size() {
        let service = CryptoBoundaryService::new();
        
        let invalid_key = general_purpose::STANDARD.encode(b"short_key");
        
        let encrypt_req = AeadEncryptRequest {
            plaintext: "test".to_string(),
            key: invalid_key,
            additional_data: None,
        };
        
        let result = service.aead_encrypt(encrypt_req);
        assert!(result.is_err());
        assert!(matches!(result.unwrap_err(), CryptoError::InvalidInput(_)));
    }
    }
